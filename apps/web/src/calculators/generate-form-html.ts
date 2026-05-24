/**
 * Form HTML generation for calculator template pages.
 */
/**
 * Form HTML generation for calculator template pages.
 */
import type { CalculatorConfig, FormFieldConfig } from './types';

// Enhanced form generation with validation
export function generateFormHTMLWithValidation(fields: FormFieldConfig[]): string {
  // Check if any fields are marked as advancedOnly (to show toggle)
  const hasAdvancedFields = fields.some((f) => f.advancedOnly);

  const groupedFields = fields.reduce(
    (groups, field) => {
      const group = field.group || 'default';
      if (!groups[group]) groups[group] = [];
      groups[group].push(field);
      return groups;
    },
    {} as Record<string, FormFieldConfig[]>
  );

  let html = '<form id="calculator-form" class="space-y-6" novalidate>';

  // Add Basic/Advanced toggle if there are advanced fields
  if (hasAdvancedFields) {
    html += `
    <div class="fa-highlight-card mb-4 flex items-center justify-between p-4">
      <div>
        <span class="fa-field-label">Calculator Mode</span>
        <p class="fa-help-copy">Advanced mode includes PMI, tax details, inflation & more</p>
      </div>
      <div class="flex items-center gap-3">
        <span id="mode-label-basic" class="fa-switch-label-active">Basic</span>
        <button type="button" id="mode-toggle" role="switch" aria-checked="false" aria-label="Toggle advanced mode"
          class="fa-switch-inactive relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2">
          <span class="fa-switch-knob-inactive pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out"></span>
        </button>
        <span id="mode-label-advanced" class="fa-switch-label-inactive">Advanced</span>
      </div>
    </div>`;
  }

  Object.entries(groupedFields).forEach(([groupName, groupFields], _index) => {
    if (groupName !== 'default') {
      const isOptional = groupName.includes('Optional');
      const sectionClass = isOptional ? 'fa-subcard' : 'fa-highlight-card';
      html += `<div class="mb-6 p-6 ${sectionClass}">
        <h3 class="fa-scenario-title mb-4">${groupName}</h3>`;
    }

    html += '<div class="grid grid-cols-1 md:grid-cols-2 gap-6">';

    groupFields.forEach((field) => {
      html += generateFieldHTMLWithValidation(field);
    });

    html += '</div>';

    if (groupName !== 'default') {
      html += '</div>';
    }
  });

  html += `
    <div class="flex flex-wrap gap-4 mt-8 pt-6 fa-panel-divider-top">
      <button type="submit" id="calculate-btn" class="fa-button-primary flex-1 sm:flex-none">
        📊 Calculate Scenarios
      </button>
      <button type="button" id="reset-btn" class="fa-button-secondary">
        Reset
      </button>
      <button type="button" id="save-btn" class="fa-button-primary">
        💾 Save
      </button>
    </div>
  </form>`;

  return html;
}

function generateFieldHTMLWithValidation(field: FormFieldConfig): string {
  const baseAttrs = `
    id="${field.id}"
    name="${field.name}"
    ${field.required ? 'required' : ''}
    ${field.min !== undefined ? `min="${field.min}"` : ''}
    ${field.max !== undefined ? `max="${field.max}"` : ''}
    ${field.step !== undefined ? `step="${field.step}"` : ''}
    ${field.placeholder ? `placeholder="${field.placeholder}"` : ''}
    data-field-type="${field.type}"
  `.trim();

  let inputHTML = '';

  switch (field.type) {
    case 'number':
      inputHTML = `<input type="number" ${baseAttrs} class="fa-input-surface w-full">`;
      break;
    case 'text':
      inputHTML = `<input type="text" ${baseAttrs} class="fa-input-surface w-full">`;
      break;
    case 'select':
      inputHTML = `<select ${baseAttrs} class="fa-input-surface w-full">`;
      if (field.options) {
        field.options.forEach((option) => {
          inputHTML += `<option value="${option.value}">${option.label}</option>`;
        });
      }
      inputHTML += '</select>';
      break;
    case 'checkbox':
      inputHTML = `<input type="checkbox" ${baseAttrs} class="h-4 w-4 rounded border-slate-300 text-violet-600 focus:ring-violet-500 dark:border-slate-700 dark:bg-slate-950/40 dark:text-violet-300">`;
      break;
  }

  // Add data-advanced attribute for fields that should be hidden in Basic mode
  const advancedAttr = field.advancedOnly ? 'data-advanced="true"' : '';
  const hiddenClass = field.advancedOnly ? ' hidden' : '';

  return `
    <div class="form-field field-container${hiddenClass}" data-field-id="${field.id}" ${advancedAttr}>
      <label for="${field.id}" class="fa-field-label mb-2">
        ${field.label}
        ${field.required ? '<span class="ml-1 text-rose-500">*</span>' : ''}
      </label>
      ${inputHTML}
      ${field.helpText ? `<p class="fa-help-copy mt-1">${field.helpText}</p>` : ''}
      <div class="field-error fa-help-copy mt-1 hidden text-rose-600 dark:text-rose-300"></div>
    </div>
  `;
}

export function generateSoftwareApplicationSchema(config: CalculatorConfig, url: string) {
  return {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: config.title,
    applicationCategory: 'FinanceApplication',
    operatingSystem: 'Web',
    url: url,
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD',
      availability: 'https://schema.org/InStock',
    },
  };
}

export function generateBreadcrumbSchema(breadcrumbs: Array<{ name: string; href: string }>) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: breadcrumbs.map((crumb, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: crumb.name,
      item: crumb.href,
    })),
  };
}

export function generateFormHTML(fields: FormFieldConfig[]): string {
  const groupedFields = fields.reduce(
    (groups, field) => {
      const group = field.group || 'default';
      if (!groups[group]) groups[group] = [];
      groups[group].push(field);
      return groups;
    },
    {} as Record<string, FormFieldConfig[]>
  );

  let html = '<form id="calculator-form" class="space-y-6">';

  Object.entries(groupedFields).forEach(([groupName, groupFields]) => {
    if (groupName !== 'default') {
      const isOptional = groupName.includes('Optional');
      const sectionClass = isOptional ? 'fa-section-shell-optional' : '';
      html += `<div class="mb-6 fa-section-shell ${sectionClass}">
        <h3 class="fa-section-title mb-4">${groupName}</h3>`;
    }

    // Use a more balanced grid layout
    const fieldCount = groupFields.length;
    let gridClass = 'grid grid-cols-1 gap-6';

    if (fieldCount <= 2) {
      gridClass = 'grid grid-cols-1 md:grid-cols-2 gap-6';
    } else if (fieldCount <= 4) {
      gridClass = 'grid grid-cols-1 md:grid-cols-2 gap-6';
    } else if (fieldCount <= 6) {
      gridClass = 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6';
    } else {
      gridClass = 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6';
    }

    html += `<div class="${gridClass}">`;

    groupFields.forEach((field) => {
      html += generateFieldHTML(field);
    });

    html += '</div>';

    if (groupName !== 'default') {
      html += '</div>';
    }
  });

  html += `
    <div class="flex flex-wrap gap-4 mt-8 pt-6 fa-panel-divider-top">
      <button type="submit" id="calculate-btn" class="fa-button-primary flex-1 sm:flex-none">
        📊 Calculate Scenarios
      </button>
      <button type="button" id="reset-btn" class="fa-button-secondary">
        Reset
      </button>
      <button type="button" id="save-scenario-btn" class="fa-button-primary">
        💾 Save
      </button>
    </div>
  </form>`;

  return html;
}

function generateFieldHTML(field: FormFieldConfig): string {
  const baseAttrs = `
    id="${field.id}"
    name="${field.name}"
    ${field.required ? 'required' : ''}
    ${field.min !== undefined ? `min="${field.min}"` : ''}
    ${field.max !== undefined ? `max="${field.max}"` : ''}
    ${field.step !== undefined ? `step="${field.step}"` : ''}
    ${field.placeholder ? `placeholder="${field.placeholder}"` : ''}
  `.trim();

  let inputHTML = '';

  switch (field.type) {
    case 'number':
      inputHTML = `<input type="number" ${baseAttrs} class="fa-input-surface w-full">`;
      break;
    case 'text':
      inputHTML = `<input type="text" ${baseAttrs} class="fa-input-surface w-full">`;
      break;
    case 'select':
      inputHTML = `<select ${baseAttrs} class="fa-input-surface w-full">`;
      if (field.options) {
        field.options.forEach((option) => {
          inputHTML += `<option value="${option.value}">${option.label}</option>`;
        });
      }
      inputHTML += '</select>';
      break;
    case 'checkbox':
      inputHTML = `<input type="checkbox" ${baseAttrs} class="h-4 w-4 rounded border-slate-300 text-violet-600 focus:ring-violet-500 dark:border-slate-700 dark:bg-slate-950/40 dark:text-violet-300">`;
      break;
  }

  return `
    <div class="field-container">
      <label for="${field.id}" class="fa-field-label mb-2">
        ${field.label}${field.required ? ' <span class="text-rose-500">*</span>' : ''}
      </label>
      ${inputHTML}
      ${field.helpText ? `<p class="fa-help-copy mt-1">${field.helpText}</p>` : ''}
    </div>
  `;
}
