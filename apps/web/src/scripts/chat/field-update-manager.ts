import type { SerializedContext } from '@financial-analysis/tools';
import type { ContextKey } from './types';

export type FieldUpdateInstruction = {
  field: string;
  value: string;
  fieldLabel?: string | null;
};

type FieldUpdateCallbacks = {
  updateField(fieldId: string, value: string): { success: boolean; previousValue?: string };
  captureOutputs(): SerializedContext | null;
  getFieldDisplayName(fieldId: string): string;
};

export class FieldUpdateManager {
  private lastFieldUpdate: {
    context: ContextKey;
    fieldId: string;
    fieldLabel?: string | null;
  } | null = null;

  constructor(private readonly callbacks: FieldUpdateCallbacks) {}

  public tryApply(update: FieldUpdateInstruction, context: ContextKey): string | null {
    const normalizedValue = this.normalizeFieldValue(update.value) ?? update.value;
    const { success, previousValue } = this.callbacks.updateField(update.field, normalizedValue);

    if (!success) {
      return null;
    }

    const friendlyLabel = update.fieldLabel || this.callbacks.getFieldDisplayName(update.field);
    const formattedValue = this.formatFieldValue(update.field, normalizedValue);
    const formattedPreviousValue =
      previousValue && previousValue.length > 0
        ? this.formatFieldValue(update.field, previousValue)
        : null;

    this.rememberFieldReference(update.field, context, friendlyLabel);

    const changeSummary = this.formatFieldChangeSummary(
      friendlyLabel,
      formattedPreviousValue,
      formattedValue
    );

    const summarySections = [`Sure thing! ${changeSummary}.`];

    const resultsSummary = this.buildResultsSummary();
    if (resultsSummary) {
      summarySections.push(resultsSummary);
    }

    summarySections.push(
      'Re-run the calculation whenever you\'d like me to refresh the analysis with these values.'
    );

    return summarySections.join('\n\n');
  }

  public detectImplicitInstruction(
    message: string,
    context: ContextKey
  ): FieldUpdateInstruction | null {
    if (!this.lastFieldUpdate || this.lastFieldUpdate.context !== context) {
      return null;
    }

    const patterns = [
      /(?:set|change|make|adjust|update|what if|could|can|let(?:'|)s)\s+(?:it|that|this)\s+(?:to|at|=|be|was|is)\s+([0-9,.]+(?:\s*(?:k|thousand|m|million|b|billion))?%?)/i,
      /(?:it|that|this)\s+(?:to|at|=|be|was|is)\s+([0-9,.]+(?:\s*(?:k|thousand|m|million|b|billion))?%?)/i,
    ];

    for (const pattern of patterns) {
      const match = message.match(pattern);
      if (match && match[1]) {
        return {
          field: this.lastFieldUpdate.fieldId,
          value: match[1],
          fieldLabel: this.lastFieldUpdate.fieldLabel,
        };
      }
    }

    return null;
  }

  public clearRememberedField(): void {
    this.lastFieldUpdate = null;
  }

  private rememberFieldReference(
    fieldId: string,
    context: ContextKey,
    label?: string | null
  ): void {
    this.lastFieldUpdate = {
      context,
      fieldId,
      fieldLabel: label,
    };
  }

  private normalizeFieldValue(rawValue: string | null | undefined): string | null {
    if (!rawValue) {
      return null;
    }

    const trimmed = rawValue.trim();
    if (!trimmed) {
      return null;
    }

    const lower = trimmed.toLowerCase().replace(/,/g, '').replace(/\$/g, '');
    let multiplier = 1;
    if (/\bb(?:illion)?\b/.test(lower) || lower.endsWith('b')) {
      multiplier = 1_000_000_000;
    } else if (/\bm(?:illion)?\b/.test(lower) || lower.endsWith('m')) {
      multiplier = 1_000_000;
    } else if (/\b(thousand|k)\b/.test(lower) || lower.endsWith('k')) {
      multiplier = 1_000;
    }

    const numberMatch = lower.match(/-?\d+(\.\d+)?/);
    if (!numberMatch) {
      return trimmed;
    }

    const numericValue = parseFloat(numberMatch[0]) * multiplier;
    if (!Number.isFinite(numericValue)) {
      return trimmed;
    }

    return Number.isInteger(numericValue) ? numericValue.toString() : numericValue.toString();
  }

  private formatFieldValue(fieldId: string, rawValue: string): string {
    const numeric = Number(rawValue);
    const isNumeric = !Number.isNaN(numeric) && Number.isFinite(numeric);
    const numberFormatter = new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    });

    if (isNumeric) {
      if (/(amount|payment|principal|down|price|balance|value|revenue|cost|expense)/i.test(fieldId)) {
        return new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: 'USD',
          minimumFractionDigits: numeric % 1 === 0 ? 0 : 2,
          maximumFractionDigits: numeric % 1 === 0 ? 0 : 2,
        }).format(numeric);
      }

      if (/(rate|interest|apr|percent)/i.test(fieldId)) {
        return `${numberFormatter.format(numeric)}%`;
      }

      if (/years?/i.test(fieldId)) {
        return `${numberFormatter.format(numeric)} ${numeric === 1 ? 'year' : 'years'}`;
      }

      if (/(term|months|duration)/i.test(fieldId)) {
        return `${numberFormatter.format(numeric)} ${numeric === 1 ? 'month' : 'months'}`;
      }

      return numberFormatter.format(numeric);
    }

    return rawValue;
  }

  private formatFieldChangeSummary(
    label: string,
    previousValue: string | null,
    newValue: string
  ): string {
    if (previousValue && previousValue !== newValue) {
      return `Updated ${label} from ${previousValue} to ${newValue}`;
    }
    return `Set ${label} to ${newValue}`;
  }

  private buildResultsSummary(): string | null {
    const outputs = this.callbacks.captureOutputs();
    if (!outputs || typeof outputs !== 'object') {
      return null;
    }

    const entries = Object.entries(outputs).slice(0, 2);
    const lines: string[] = [];

    for (const [toolName, value] of entries) {
      const summary = this.summarizeOutputValue(value);
      if (summary) {
        lines.push(`• ${this.formatOutputLabel(toolName)}: ${summary}`);
      }
    }

    if (lines.length === 0) {
      return null;
    }

    return `Latest results I can see:\n${lines.join('\n')}`;
  }

  private summarizeOutputValue(value: unknown): string | null {
    if (value === null || value === undefined) {
      return null;
    }

    if (typeof value === 'number') {
      return new Intl.NumberFormat('en-US', { maximumFractionDigits: 2 }).format(value);
    }

    if (typeof value === 'string') {
      const trimmed = value.trim();
      if (!trimmed) {
        return null;
      }
      return trimmed.length > 180 ? `${trimmed.slice(0, 177)}…` : trimmed;
    }

    if (Array.isArray(value)) {
      return value.length === 0 ? 'No items' : `${value.length} data point${value.length === 1 ? '' : 's'}`;
    }

    if (typeof value === 'object') {
      const record = value as Record<string, unknown>;
      const preferredKeys = [
        'monthlyPayment',
        'payment',
        'totalPayment',
        'totalInterest',
        'totalCost',
        'npv',
        'irr',
        'cashFlow',
        'summary',
        'result',
        'recommendation',
      ];

      for (const key of preferredKeys) {
        if (record[key] !== undefined) {
          const nestedSummary = this.summarizeOutputValue(record[key]);
          if (nestedSummary) {
            return `${this.formatOutputLabel(key)} ${nestedSummary}`;
          }
        }
      }

      const firstEntry = Object.entries(record)[0];
      if (firstEntry) {
        const [key, val] = firstEntry;
        const nestedSummary = this.summarizeOutputValue(val);
        if (nestedSummary) {
          return `${this.formatOutputLabel(key)} ${nestedSummary}`;
        }
      }
    }

    return null;
  }

  private formatOutputLabel(raw: string): string {
    if (!raw) {
      return 'Result';
    }
    const cleaned = raw.replace(/[_-]+/g, ' ').trim();
    return cleaned.replace(/\b\w/g, (char) => char.toUpperCase());
  }
}

