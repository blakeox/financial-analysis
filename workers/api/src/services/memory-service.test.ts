import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryService } from './memory-service';
import { D1Database, D1PreparedStatement, D1Result } from '@cloudflare/workers-types';

// Mock D1 types
const mockD1Result = (results: unknown[], meta: Record<string, unknown> = {}): D1Result =>
  ({
    results,
    success: true,
    meta: {
      duration: 0,
      size_after: 0,
      rows_read: 0,
      rows_written: 0,
      last_row_id: null,
      changed_db: false,
      changes: 0,
      ...meta,
    },
  }) as unknown as D1Result;

const createMockStatement = (results: unknown[] = [], lastRowId: number | null = null) => {
  const stmt = {
    bind: vi.fn().mockReturnThis(),
    all: vi.fn().mockResolvedValue(mockD1Result(results)),
    run: vi.fn().mockResolvedValue(mockD1Result([], { last_row_id: lastRowId })),
    first: vi.fn(),
    raw: vi.fn(),
  } as unknown as D1PreparedStatement;
  return stmt;
};

describe('MemoryService', () => {
  let db: D1Database;
  let service: MemoryService;
  let mockStmt: D1PreparedStatement;

  beforeEach(() => {
    mockStmt = createMockStatement();
    db = {
      prepare: vi.fn().mockReturnValue(mockStmt),
      batch: vi.fn().mockResolvedValue([mockD1Result([])]),
      dump: vi.fn(),
      exec: vi.fn(),
    } as unknown as D1Database;
    service = new MemoryService(db);
  });

  describe('createConversation', () => {
    it('should create a conversation', async () => {
      const userId = 'user-123';
      const title = 'Test Conversation';
      const metadata = { key: 'value' };

      const result = await service.createConversation(userId, title, metadata);

      expect(db.prepare).toHaveBeenCalledWith(expect.stringContaining('INSERT INTO conversations'));
      expect(mockStmt.bind).toHaveBeenCalledWith(
        expect.any(String), // id
        userId,
        title,
        expect.any(String), // created_at
        expect.any(String), // updated_at
        JSON.stringify(metadata)
      );
      expect(mockStmt.run).toHaveBeenCalled();
      expect(result).toMatchObject({
        user_id: userId,
        title,
        metadata,
      });
    });
  });

  describe('addMessage', () => {
    it('should add a message and update conversation timestamp', async () => {
      const conversationId = 'conv-123';
      const role = 'user';
      const content = 'Hello';
      const metadata = { tokens: 10 };

      const result = await service.addMessage(conversationId, role, content, metadata);

      expect(db.batch).toHaveBeenCalled();
      expect(db.prepare).toHaveBeenCalledWith(expect.stringContaining('INSERT INTO messages'));
      expect(db.prepare).toHaveBeenCalledWith(expect.stringContaining('UPDATE conversations'));
      expect(result).toMatchObject({
        conversation_id: conversationId,
        role,
        content,
        metadata,
      });
    });
  });

  describe('getConversationHistory', () => {
    it('should retrieve conversation history', async () => {
      const conversationId = 'conv-123';
      const mockMessages = [
        {
          id: 'msg-1',
          conversation_id: conversationId,
          role: 'user',
          content: 'Hello',
          created_at: '2023-01-01T00:00:00Z',
          metadata: JSON.stringify({ tokens: 5 }),
        },
      ];

      // Re-create mock statement with results
      mockStmt = createMockStatement(mockMessages);
      vi.mocked(db.prepare).mockReturnValue(mockStmt);

      const result = await service.getConversationHistory(conversationId);

      expect(db.prepare).toHaveBeenCalledWith(expect.stringContaining('SELECT * FROM messages'));
      expect(mockStmt.bind).toHaveBeenCalledWith(conversationId);
      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        id: 'msg-1',
        content: 'Hello',
        metadata: { tokens: 5 },
      });
    });
  });

  describe('saveMemory', () => {
    it('should save a memory', async () => {
      const userId = 'user-123';
      const content = 'User likes blue';
      const lastRowId = 42;

      mockStmt = createMockStatement([], lastRowId);
      vi.mocked(db.prepare).mockReturnValue(mockStmt);

      const result = await service.saveMemory(userId, content);

      expect(db.prepare).toHaveBeenCalledWith(expect.stringContaining('INSERT INTO memories'));
      expect(mockStmt.bind).toHaveBeenCalledWith(
        userId,
        content,
        'general',
        1.0,
        expect.any(String),
        expect.any(String)
      );
      expect(result).toMatchObject({
        id: lastRowId,
        user_id: userId,
        content,
      });
    });
  });
});
