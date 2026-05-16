export type QueueEvent<Payload> =
  | { type: 'enqueued'; id: string; payload: Payload; size: number }
  | { type: 'sending'; id: string; attempt: number }
  | { type: 'retrying'; id: string; attempt: number; delay: number; error: Error }
  | { type: 'succeeded'; id: string; attempt: number }
  | { type: 'failed'; id: string; attempt: number; error: Error };

type QueueListener<Payload> = (event: QueueEvent<Payload>) => void;

type QueueConfig = {
  maxAttempts: number;
  initialBackoffMs: number;
  maxBackoffMs: number;
  jitterRatio?: number;
  minIntervalMs?: number;
};

type QueueHandler<Payload, Result> = (payload: Payload, attempt: number) => Promise<Result>;

type QueueJob<Payload, Result> = {
  id: string;
  payload: Payload;
  attempt: number;
  resolve: (value: Result) => void;
  reject: (reason: unknown) => void;
};

const defaultConfig: Required<Omit<QueueConfig, 'jitterRatio' | 'minIntervalMs'>> & {
  jitterRatio: number;
  minIntervalMs: number;
} = {
  maxAttempts: 3,
  initialBackoffMs: 1000,
  maxBackoffMs: 8000,
  jitterRatio: 0.2,
  minIntervalMs: 0,
};

const createId = (): string =>
  `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

const calculateBackoff = (
  attempt: number,
  initial: number,
  max: number,
  jitterRatio: number
): number => {
  const exponential = initial * 2 ** (attempt - 1);
  const clamped = Math.min(exponential, max);
  const jitter = clamped * jitterRatio * Math.random();
  return clamped + jitter;
};

export class MessageQueue<Payload, Result> {
  private readonly config: {
    maxAttempts: number;
    initialBackoffMs: number;
    maxBackoffMs: number;
    jitterRatio: number;
    minIntervalMs: number;
  };

  private readonly handler: QueueHandler<Payload, Result>;
  private readonly listeners = new Set<QueueListener<Payload>>();
  private queue: Array<QueueJob<Payload, Result>> = [];
  private processing = false;
  private disposed = false;
  private lastSendAt = 0;

  constructor(handler: QueueHandler<Payload, Result>, config: QueueConfig) {
    this.handler = handler;
    this.config = {
      ...defaultConfig,
      ...config,
      jitterRatio: config.jitterRatio ?? defaultConfig.jitterRatio,
      minIntervalMs: config.minIntervalMs ?? defaultConfig.minIntervalMs,
    };
  }

  public subscribe(listener: QueueListener<Payload>): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  public enqueue(payload: Payload): Promise<Result> {
    if (this.disposed) {
      return Promise.reject(new Error('Message queue has been disposed'));
    }

    const jobId = createId();

    return new Promise<Result>((resolve, reject) => {
      const job: QueueJob<Payload, Result> = {
        id: jobId,
        payload,
        attempt: 0,
        resolve,
        reject,
      };

      this.queue.push(job);
      this.emit({
        type: 'enqueued',
        id: jobId,
        payload,
        size: this.queue.length,
      });
      void this.processQueue();
    });
  }

  public clear(): void {
    this.queue = [];
  }

  public dispose(): void {
    this.disposed = true;
    this.queue = [];
    this.listeners.clear();
  }

  private async processQueue(): Promise<void> {
    if (this.processing || this.disposed) {
      return;
    }

    const job = this.queue.shift();
    if (!job) {
      return;
    }

    this.processing = true;

    const attemptNumber = job.attempt + 1;
    job.attempt = attemptNumber;
    this.emit({ type: 'sending', id: job.id, attempt: attemptNumber });

    const waitForRateLimit = async () => {
      if (this.config.minIntervalMs <= 0 || this.lastSendAt === 0) {
        return;
      }
      const elapsed = Date.now() - this.lastSendAt;
      if (elapsed >= this.config.minIntervalMs) {
        return;
      }
      const delay = this.config.minIntervalMs - elapsed;
      await new Promise((resolve) => setTimeout(resolve, delay));
    };

    try {
      await waitForRateLimit();
      const result = await this.handler(job.payload, attemptNumber);
      this.lastSendAt = Date.now();
      job.resolve(result);
      this.emit({ type: 'succeeded', id: job.id, attempt: attemptNumber });
    } catch (error) {
      if (attemptNumber >= this.config.maxAttempts) {
        job.reject(error);
        this.emit({
          type: 'failed',
          id: job.id,
          attempt: attemptNumber,
          error: error instanceof Error ? error : new Error(String(error)),
        });
      } else {
        const delay = calculateBackoff(
          attemptNumber,
          this.config.initialBackoffMs,
          this.config.maxBackoffMs,
          this.config.jitterRatio
        );
        this.emit({
          type: 'retrying',
          id: job.id,
          attempt: attemptNumber,
          delay,
          error: error instanceof Error ? error : new Error(String(error)),
        });

        setTimeout(() => {
          if (this.disposed) {
            return;
          }
          this.queue.unshift(job);
          void this.processQueue();
        }, delay);

        this.processing = false;
        return;
      }
    }

    this.processing = false;

    if (this.queue.length > 0) {
      void this.processQueue();
    }
  }

  private emit(event: QueueEvent<Payload>): void {
    for (const listener of this.listeners) {
      listener(event);
    }
  }
}
