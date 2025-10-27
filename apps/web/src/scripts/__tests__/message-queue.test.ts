import { describe, expect, it, vi } from 'vitest';
import { MessageQueue, type QueueEvent } from '../chat/message-queue';

describe('MessageQueue', () => {
  it('processes messages in order and resolves successful handlers', async () => {
    const handler = vi.fn().mockResolvedValueOnce({ ok: true });
    const queue = new MessageQueue(handler, {
      maxAttempts: 2,
      initialBackoffMs: 5,
      maxBackoffMs: 10,
      jitterRatio: 0,
      minIntervalMs: 0,
    });

    const events: QueueEvent<unknown>[] = [];
    queue.subscribe((event) => events.push(event));

    const result = await queue.enqueue({ id: 1 });

    expect(result).toEqual({ ok: true });
    expect(handler).toHaveBeenCalledTimes(1);
    expect(events[0]?.type).toBe('enqueued');
    expect(events.some((event) => event.type === 'succeeded')).toBe(true);

    queue.dispose();
  });

  it('retries failed messages before succeeding', async () => {
    const handler = vi
      .fn()
      .mockRejectedValueOnce(new Error('network'))
      .mockRejectedValueOnce(new Error('timeout'))
      .mockResolvedValueOnce({ ok: true });

    const queue = new MessageQueue(handler, {
      maxAttempts: 3,
      initialBackoffMs: 5,
      maxBackoffMs: 20,
      jitterRatio: 0,
      minIntervalMs: 0,
    });

    const events: QueueEvent<unknown>[] = [];
    queue.subscribe((event) => events.push(event));

    const result = await queue.enqueue({ id: 2 });

    expect(result).toEqual({ ok: true });
    expect(handler).toHaveBeenCalledTimes(3);
    const retryAttempts = events.filter((event) => event.type === 'retrying');
    expect(retryAttempts).toHaveLength(2);
    expect(retryAttempts[0]?.attempt).toBe(1);
    expect(retryAttempts[1]?.attempt).toBe(2);

    queue.dispose();
  });

  it('rejects after exceeding max attempts', async () => {
    const handler = vi.fn().mockRejectedValue(new Error('unreachable'));

    const queue = new MessageQueue(handler, {
      maxAttempts: 2,
      initialBackoffMs: 5,
      maxBackoffMs: 5,
      jitterRatio: 0,
      minIntervalMs: 0,
    });

    const events: QueueEvent<unknown>[] = [];
    queue.subscribe((event) => events.push(event));

    await expect(queue.enqueue({ id: 3 })).rejects.toThrow('unreachable');
    expect(handler).toHaveBeenCalledTimes(2);
    expect(events.some((event) => event.type === 'failed')).toBe(true);

    queue.dispose();
  });
});
