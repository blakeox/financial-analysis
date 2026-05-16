import { describe, expect, it, vi } from 'vitest';
import {
  GLOBAL_BUS_SYMBOL,
  createEventBus,
  getOrCreateGlobalBus,
  type EventMap,
} from '../event-bus';

interface TestEvents extends EventMap {
  'alpha:event': { value: number };
  'beta:event': { message: string };
}

describe('event bus', () => {
  it('emits to subscribed listeners and supports unsubscribe', () => {
    const bus = createEventBus<TestEvents>();
    const listener = vi.fn();
    const unsubscribe = bus.on('alpha:event', listener);

    bus.emit('alpha:event', { value: 1 });
    unsubscribe();
    bus.emit('alpha:event', { value: 2 });

    expect(listener).toHaveBeenCalledTimes(1);
    expect(listener).toHaveBeenCalledWith({ value: 1 });
  });

  it('removes once listeners after the first event', () => {
    const bus = createEventBus<TestEvents>();
    const listener = vi.fn();

    bus.once('beta:event', listener);
    bus.emit('beta:event', { message: 'first' });
    bus.emit('beta:event', { message: 'second' });

    expect(listener).toHaveBeenCalledTimes(1);
    expect(listener).toHaveBeenCalledWith({ message: 'first' });
  });

  it('clears listeners by event type or globally', () => {
    const bus = createEventBus<TestEvents>();
    const alpha = vi.fn();
    const beta = vi.fn();

    bus.on('alpha:event', alpha);
    bus.on('beta:event', beta);
    bus.clearListeners('alpha:event');

    bus.emit('alpha:event', { value: 1 });
    bus.emit('beta:event', { message: 'kept' });
    expect(alpha).not.toHaveBeenCalled();
    expect(beta).toHaveBeenCalledTimes(1);

    bus.clearListeners();
    bus.emit('beta:event', { message: 'cleared' });
    expect(beta).toHaveBeenCalledTimes(1);
  });

  it('reuses the global singleton once initialized', () => {
    const globalScope = globalThis as typeof globalThis & {
      [GLOBAL_BUS_SYMBOL]?: ReturnType<typeof createEventBus<TestEvents>>;
      __appEventBus?: ReturnType<typeof createEventBus<TestEvents>>;
    };

    delete globalScope[GLOBAL_BUS_SYMBOL];
    delete globalScope.__appEventBus;

    const initializer = vi.fn(() => createEventBus<TestEvents>());
    const first = getOrCreateGlobalBus(initializer);
    const second = getOrCreateGlobalBus(() => createEventBus<TestEvents>());

    expect(first).toBe(second);
    expect(initializer).toHaveBeenCalledTimes(1);
    expect(globalScope[GLOBAL_BUS_SYMBOL]).toBe(first);
    expect(globalScope.__appEventBus).toBe(first);

    delete globalScope[GLOBAL_BUS_SYMBOL];
    delete globalScope.__appEventBus;
  });
});
