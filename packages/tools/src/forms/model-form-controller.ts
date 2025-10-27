import { appEventBus, type ModelContextEvent, type ModelSubmitEvent, type SerializedContext } from '../event-bus';
import { z } from 'zod';

type ObjectSchema = z.ZodType<Record<string, unknown>>;

type FormControllerOptions<TSchema extends ObjectSchema> = {
  formId: string;
  schema: TSchema;
  contextLabel?: string | null;
  modelId?: string | null;
  initialValues?: Partial<z.infer<TSchema>>;
};

export type FormValidationError = {
  path: string;
  message: string;
};

export type FormControllerState<TValues> = {
  values: TValues;
  isValid: boolean;
  errors: FormValidationError[];
};

type Listener<TValues> = (state: FormControllerState<TValues>) => void;

const toErrorList = (issue: z.ZodIssue): FormValidationError => ({
  path: issue.path.map(String).join('.') || issue.path.join('.'),
  message: issue.message,
});

const buildContextEvent = (
  formId: string,
  contextLabel: string | null | undefined,
  modelId: string | null | undefined,
  data: SerializedContext
): ModelContextEvent => ({
  formId,
  modelId: modelId ?? null,
  contextLabel: contextLabel ?? null,
  data,
});

const buildSubmitEvent = (
  formId: string,
  values: SerializedContext,
  errors: FormValidationError[]
): ModelSubmitEvent => {
  const event: ModelSubmitEvent = {
    formId,
    data: values,
    valid: errors.length === 0,
  };

  if (errors.length > 0) {
    event.errors = errors.map((error) => ({
      path: error.path,
      message: error.message,
    }));
  }

  return event;
};

export function createModelFormController<TSchema extends ObjectSchema>(
  options: FormControllerOptions<TSchema>
) {
  type Values = z.infer<TSchema>;

  let currentValues: Values = options.schema.parse(options.initialValues ?? {});
  let currentErrors: FormValidationError[] = [];
  let latestSerialized: SerializedContext | null = null;
  const listeners = new Set<Listener<Values>>();

  const notifyState = () => {
    const state: FormControllerState<Values> = {
      values: currentValues,
      isValid: currentErrors.length === 0,
      errors: currentErrors,
    };
    for (const listener of listeners) {
      listener(state);
    }
  };

  const emitContext = () => {
    const contextData = { ...currentValues } as SerializedContext;
    const payload = buildContextEvent(
      options.formId,
      options.contextLabel ?? null,
      options.modelId ?? null,
      contextData
    );
    appEventBus.emit('model:context', payload);
  };

  const controller = {
    setValues(values: Partial<Values>) {
      const merged = {
        ...currentValues,
        ...values,
      } satisfies Record<string, unknown>;
      const result = options.schema.safeParse(merged);
      if (result.success) {
        currentValues = result.data;
        currentErrors = [];
        latestSerialized = { ...result.data } as SerializedContext;
      } else {
        currentErrors = result.error.issues.map(toErrorList);
      }
      notifyState();
      emitContext();
    },
    update(serialized: SerializedContext) {
      latestSerialized = { ...serialized };
      const result = options.schema.safeParse(serialized);
      if (result.success) {
        currentValues = result.data;
        currentErrors = [];
      } else {
        currentErrors = result.error.issues.map(toErrorList);
      }
      notifyState();
      emitContext();
    },
    getValues(): Values {
      return currentValues;
    },
    validate(): FormControllerState<Values> {
      const source = latestSerialized ?? ({ ...currentValues } as SerializedContext);
      const result = options.schema.safeParse(source);
      if (result.success) {
        currentValues = result.data;
        currentErrors = [];
        latestSerialized = { ...result.data } as SerializedContext;
      } else {
        currentErrors = result.error.issues.map(toErrorList);
      }
      notifyState();
      emitContext();
      return {
        values: currentValues,
        isValid: currentErrors.length === 0,
        errors: currentErrors,
      };
    },
    submit(): FormControllerState<Values> {
      const state = this.validate();
      const submitEvent = buildSubmitEvent(
        options.formId,
        { ...state.values } as SerializedContext,
        state.errors
      );
      appEventBus.emit('model:submit', submitEvent);
      return state;
    },
    reset(values?: Partial<Values>) {
      currentValues = options.schema.parse(values ?? options.initialValues ?? {});
      currentErrors = [];
      latestSerialized = null;
      notifyState();
      emitContext();
    },
    subscribe(listener: Listener<Values>) {
      listeners.add(listener);
      listener({
        values: currentValues,
        isValid: currentErrors.length === 0,
        errors: currentErrors,
      });
      return () => listeners.delete(listener);
    },
    dispose() {
      listeners.clear();
      latestSerialized = null;
    },
  };

  return controller;
}
