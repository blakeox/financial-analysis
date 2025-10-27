import { appEventBus, type ChatStateEvent } from '@financial-analysis/tools';
import type { QueueEvent } from './message-queue';

export type ChatSendStatus = 'idle' | 'queued' | 'sending' | 'retrying' | 'error';

export type ChatState = {
  isOpen: boolean;
  sendStatus: ChatSendStatus;
  pendingCount: number;
  lastError: string | null;
  lastQueueEvent: QueueEvent<unknown> | null;
};

type ChatStateListener = (state: ChatState) => void;

const initialState: ChatState = {
  isOpen: false,
  sendStatus: 'idle',
  pendingCount: 0,
  lastError: null,
  lastQueueEvent: null,
};

export class ChatStateStore {
  private state: ChatState;
  private readonly listeners = new Set<ChatStateListener>();

  constructor(defaultState: Partial<ChatState> = {}) {
    this.state = { ...initialState, ...defaultState };
  }

  public getState(): ChatState {
    return this.state;
  }

  public subscribe(listener: ChatStateListener): () => void {
    this.listeners.add(listener);
    listener(this.state);
    return () => {
      this.listeners.delete(listener);
    };
  }

  public setOpen(isOpen: boolean): void {
    if (this.state.isOpen === isOpen) {
      return;
    }
    this.state = { ...this.state, isOpen };
    this.emit();
    this.broadcastState();
  }

  public setPendingCount(count: number): void {
    if (this.state.pendingCount === count) {
      return;
    }
    this.state = { ...this.state, pendingCount: count };
    this.emit();
  }

  public setSendStatus(status: ChatSendStatus): void {
    if (this.state.sendStatus === status) {
      return;
    }
    this.state = { ...this.state, sendStatus: status };
    this.emit();
  }

  public setError(error: string | null): void {
    if (this.state.lastError === error) {
      return;
    }
    this.state = { ...this.state, lastError: error };
    this.emit();
  }

  public integrateQueueEvent<Payload>(event: QueueEvent<Payload>): void {
    this.state = {
      ...this.state,
      lastQueueEvent: event as QueueEvent<unknown>,
    };

    switch (event.type) {
      case 'enqueued': {
        this.setPendingCount(event.size);
        this.setSendStatus('queued');
        break;
      }
      case 'sending': {
        this.setSendStatus('sending');
        break;
      }
      case 'retrying': {
        this.setSendStatus('retrying');
        this.setError(event.error.message);
        break;
      }
      case 'succeeded': {
        this.setSendStatus(this.state.pendingCount > 1 ? 'queued' : 'idle');
        this.setError(null);
        this.setPendingCount(Math.max(0, this.state.pendingCount - 1));
        break;
      }
      case 'failed': {
        this.setSendStatus('error');
        this.setError(event.error.message);
        this.setPendingCount(Math.max(0, this.state.pendingCount - 1));
        break;
      }
      default:
        break;
    }

    this.emit();
  }

  private broadcastState(): void {
    const payload: ChatStateEvent = { isOpen: this.state.isOpen, source: 'panel' };
    appEventBus.emit('chat:state', payload);
  }

  private emit(): void {
    for (const listener of this.listeners) {
      listener(this.state);
    }
  }
}
