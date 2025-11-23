import { D1Database } from '@cloudflare/workers-types';

export interface Conversation {
  id: string;
  user_id: string;
  title?: string | undefined;
  created_at: string;
  updated_at: string;
  metadata?: Record<string, unknown> | undefined;
}

export interface Message {
  id: string;
  conversation_id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  created_at: string;
  metadata?: Record<string, unknown> | undefined;
}

export interface Memory {
  id: number;
  user_id: string;
  content: string;
  category?: string;
  confidence: number;
  created_at: string;
  last_accessed_at: string;
}

interface ConversationRow {
  id: string;
  user_id: string;
  title?: string;
  created_at: string;
  updated_at: string;
  metadata?: string;
}

interface MessageRow {
  id: string;
  conversation_id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  created_at: string;
  metadata?: string;
}

export class MemoryService {
  constructor(private db: D1Database) {}

  async createConversation(userId: string, title?: string, metadata?: Record<string, unknown>): Promise<Conversation> {
    const id = crypto.randomUUID();
    const now = new Date().toISOString();
    await this.db.prepare(
      'INSERT INTO conversations (id, user_id, title, created_at, updated_at, metadata) VALUES (?, ?, ?, ?, ?, ?)'
    ).bind(id, userId, title || null, now, now, metadata ? JSON.stringify(metadata) : null).run();

    return {
      id,
      user_id: userId,
      title,
      created_at: now,
      updated_at: now,
      metadata
    };
  }

  async addMessage(conversationId: string, role: 'user' | 'assistant' | 'system', content: string, metadata?: Record<string, unknown>): Promise<Message> {
    const id = crypto.randomUUID();
    const now = new Date().toISOString();
    
    // Use a transaction to insert message and update conversation timestamp
    await this.db.batch([
      this.db.prepare(
        'INSERT INTO messages (id, conversation_id, role, content, created_at, metadata) VALUES (?, ?, ?, ?, ?, ?)'
      ).bind(id, conversationId, role, content, now, metadata ? JSON.stringify(metadata) : null),
      this.db.prepare(
        'UPDATE conversations SET updated_at = ? WHERE id = ?'
      ).bind(now, conversationId)
    ]);

    return {
      id,
      conversation_id: conversationId,
      role,
      content,
      created_at: now,
      metadata
    };
  }

  async getConversationHistory(conversationId: string): Promise<Message[]> {
    const { results } = await this.db.prepare(
      'SELECT * FROM messages WHERE conversation_id = ? ORDER BY created_at ASC'
    ).bind(conversationId).all<MessageRow>();

    return results.map(row => ({
      ...row,
      metadata: row.metadata ? JSON.parse(row.metadata) : undefined
    }));
  }

  async getUserConversations(userId: string): Promise<Conversation[]> {
    const { results } = await this.db.prepare(
      'SELECT * FROM conversations WHERE user_id = ? ORDER BY updated_at DESC'
    ).bind(userId).all<ConversationRow>();

    return results.map(row => ({
      ...row,
      metadata: row.metadata ? JSON.parse(row.metadata) : undefined
    }));
  }

  async saveMemory(userId: string, content: string, category: string = 'general', confidence: number = 1.0): Promise<Memory> {
    const now = new Date().toISOString();
    const result = await this.db.prepare(
      'INSERT INTO memories (user_id, content, category, confidence, created_at, last_accessed_at) VALUES (?, ?, ?, ?, ?, ?)'
    ).bind(userId, content, category, confidence, now, now).run();

    return {
      id: result.meta.last_row_id as number,
      user_id: userId,
      content,
      category,
      confidence,
      created_at: now,
      last_accessed_at: now
    };
  }

  async searchMemories(userId: string, query: string): Promise<Memory[]> {
    // Simple LIKE search for now. In a real "semantic" memory, we'd use vector search (Vectorize).
    const { results } = await this.db.prepare(
      'SELECT * FROM memories WHERE user_id = ? AND content LIKE ? ORDER BY created_at DESC'
    ).bind(userId, `%${query}%`).all<Memory>();

    return results;
  }
  
  async getAllMemories(userId: string): Promise<Memory[]> {
      const { results } = await this.db.prepare(
        'SELECT * FROM memories WHERE user_id = ? ORDER BY created_at DESC'
      ).bind(userId).all<Memory>();
      
      return results;
  }
}
