import {
  appEventBus,
  type ModelContextEvent,
  type SerializedContext,
} from '@financial-analysis/tools';
import type { ModelMetadata } from './types';

export type ModelSelectionState = {
  selectedId: string | null;
  metadata: ModelMetadata | null;
};

type Listener = (state: ModelSelectionState) => void;

const defaultState: ModelSelectionState = {
  selectedId: null,
  metadata: null,
};

const MODEL_SELECTION_FORM_ID = 'model-selection';

const buildContextPayload = (metadata: ModelMetadata | null): ModelContextEvent => {
  const data: SerializedContext = metadata
    ? {
        id: metadata.id,
        name: metadata.name,
        status: metadata.status,
        description: metadata.description,
        ctaHref: metadata.ctaHref,
        ctaLabel: metadata.ctaLabel,
        features: metadata.features,
      }
    : {};

  return {
    formId: MODEL_SELECTION_FORM_ID,
    modelId: metadata?.id ?? null,
    contextLabel: metadata?.name ?? null,
    data,
  };
};

export class ModelSelectionStore {
  private state: ModelSelectionState = { ...defaultState };
  private readonly listeners = new Set<Listener>();

  public subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    listener(this.state);
    return () => {
      this.listeners.delete(listener);
    };
  }

  public setSelection(metadata: ModelMetadata | null): void {
    const nextState: ModelSelectionState = {
      selectedId: metadata?.id ?? null,
      metadata,
    };
    this.state = nextState;
    this.emit();
    appEventBus.emit('model:context', buildContextPayload(metadata));
  }

  public clear(): void {
    this.setSelection(null);
  }

  public getState(): ModelSelectionState {
    return this.state;
  }

  private emit(): void {
    for (const listener of this.listeners) {
      listener(this.state);
    }
  }
}

export const modelSelectionStore = new ModelSelectionStore();
