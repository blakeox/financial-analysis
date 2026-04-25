import { beforeEach, describe, expect, it, vi } from 'vitest';
import { z } from 'zod';
import { appEventBus } from '../event-bus';
import { createModelFormController } from '../forms/model-form-controller';

describe('model form controller', () => {
  beforeEach(() => {
    appEventBus.clearListeners();
  });

  it('emits model context updates for valid value changes', () => {
    const onContext = vi.fn();
    appEventBus.on('model:context', onContext);

    const controller = createModelFormController({
      formId: 'lease-form',
      modelId: 'enhanced-lease',
      contextLabel: 'Lease analysis',
      schema: z.object({
        amount: z.number().min(0),
        termMonths: z.number().int().positive(),
      }),
      initialValues: {
        amount: 1000,
        termMonths: 12,
      },
    });

    controller.setValues({ amount: 1250 });

    expect(controller.getValues()).toEqual({
      amount: 1250,
      termMonths: 12,
    });
    expect(onContext).toHaveBeenCalledWith({
      formId: 'lease-form',
      modelId: 'enhanced-lease',
      contextLabel: 'Lease analysis',
      data: {
        amount: 1250,
        termMonths: 12,
      },
    });
  });

  it('validates serialized updates and emits invalid submit payloads with errors', () => {
    const onSubmit = vi.fn();
    appEventBus.on('model:submit', onSubmit);

    const controller = createModelFormController({
      formId: 'budget-form',
      schema: z.object({
        income: z.number().positive(),
        savingsRate: z.number().min(0).max(1),
      }),
      initialValues: {
        income: 5000,
        savingsRate: 0.2,
      },
    });

    controller.update({
      income: -1,
      savingsRate: 2,
    });

    const state = controller.submit();

    expect(state.isValid).toBe(false);
    expect(state.errors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ path: 'income' }),
        expect.objectContaining({ path: 'savingsRate' }),
      ])
    );
    expect(onSubmit).toHaveBeenCalledWith({
      formId: 'budget-form',
      data: {
        income: 5000,
        savingsRate: 0.2,
      },
      valid: false,
      errors: expect.arrayContaining([
        expect.objectContaining({ path: 'income' }),
        expect.objectContaining({ path: 'savingsRate' }),
      ]),
    });
  });

  it('resets to initial values and notifies subscribers with current validity', () => {
    const states = vi.fn();

    const controller = createModelFormController({
      formId: 'retirement-form',
      schema: z.object({
        contribution: z.number().min(0),
      }),
      initialValues: {
        contribution: 300,
      },
    });

    controller.subscribe(states);
    controller.setValues({ contribution: 450 });
    controller.reset();

    expect(controller.getValues()).toEqual({ contribution: 300 });
    expect(states).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        values: { contribution: 300 },
        isValid: true,
        errors: [],
      })
    );
    expect(states).toHaveBeenLastCalledWith({
      values: { contribution: 300 },
      isValid: true,
      errors: [],
    });
  });
});
