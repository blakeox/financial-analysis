# Index.ts Refactoring Plan

**Current State:**
- `index.ts` is **4,112 lines** with **36 route handlers**
- Many route modules exist but aren't being used
- Duplicate routes exist (chat routes in both index.ts and routes/chat.ts)

**Goal:**
Reduce `index.ts` to ~200-300 lines containing only:
- Imports
- Router initialization
- Route registration calls
- Main fetch handler
- Scheduled handler

## Extraction Plan

### 1. ✅ Already Extracted (but may need registration)
- [x] `routes/chat.ts` - Chat routes
- [x] `routes/analytics.ts` - Analytics
- [x] `routes/health.ts` - Health check
- [x] `routes/analysis.ts` - Analysis routes
- [x] `routes/api-keys.ts` - API key management
- [x] `routes/storage.ts` - Storage routes
- [x] `routes/mcp.ts` - MCP routes
- [x] `routes/documents.ts` - Document routes
- [x] `routes/stripe.ts` - Stripe routes

### 2. 🔄 Need to Register Existing Routes
These route modules exist but routes are duplicated in index.ts:

**`routes/api-keys.ts`**
- Extract: `/v1/keys/*` routes (lines 724-764)
- Register: `registerApiKeyRoutes(router)`

**`routes/storage.ts`**
- Extract: `/v1/storage/*` routes (lines 1547-1739)
- Register: `registerStorageRoutes(router)`

**`routes/mcp.ts`**
- Extract: `/mcp` and `/api/v1/mcp/tools` routes (lines 1769-1819)
- Register: `registerMCPRoutes(router)`

**`routes/analysis.ts`**
- Extract: `/v1/api/analysis/*` routes (lines 1822-2663)
- Register: `registerAnalysisRoutes(router)` (may already exist)

**`routes/documents.ts`**
- Extract: `/v1/api/upload/*` and `/v1/api/extract/*` routes (lines 3614-3870)
- Register: `registerDocumentRoutes(router)`

**`routes/stripe.ts`**
- Extract: `/v1/stripe/*` route (line 767-769)
- Register: `registerStripeRoutes(router)`

### 3. 🆕 Create New Route Modules

**`routes/root.ts`**
- Extract: Root routes (lines 793-856)
  - `GET /ping`
  - `GET /version`
  - `GET /`
- Register: `registerRootRoutes(router)`

**`routes/docs.ts`**
- Extract: Documentation routes (lines 2663-2711)
  - `GET /docs`
  - `GET /openapi.json`
- Register: `registerDocsRoutes(router)`

**`routes/admin.ts`**
- Extract: Admin routes (line 772-790)
  - `GET /v1/admin/circuit-breakers`
- Register: `registerAdminRoutes(router)`

**`routes/cors.ts`**
- Extract: CORS preflight handlers (lines 859-884)
  - `OPTIONS /mcp`
  - `OPTIONS /api/*`
  - `OPTIONS /v1/*`
  - `OPTIONS /openapi.json`
  - `OPTIONS /docs`
- Register: `registerCorsRoutes(router)`

### 4. 🗑️ Remove Duplicate Routes

**Chat Routes:**
- Remove `/v1/chat/enhanced` (line 887) - already in `routes/chat.ts`
- Remove `/v1/chat` (line 1253) - consider if needed or merge into chat.ts
- Remove commented-out legacy route (lines 2812-3611)

## Implementation Steps

1. **Verify existing route modules** - Check if they export registration functions
2. **Update route modules** - Add registration functions if missing
3. **Extract remaining routes** - Create new route modules for root, docs, admin, cors
4. **Update index.ts** - Remove route handlers, add registration calls
5. **Test** - Verify all routes still work
6. **Clean up** - Remove commented code, unused imports

## Expected Result

**Before:**
```
index.ts: 4,112 lines
├── 36 route handlers
├── Helper functions
├── Type definitions
└── Main fetch handler
```

**After:**
```
index.ts: ~200-300 lines
├── Imports
├── Router initialization
├── Route registrations (8-10 calls)
└── Main fetch handler

routes/
├── chat.ts ✅
├── analytics.ts ✅
├── health.ts ✅
├── analysis.ts ✅
├── api-keys.ts ✅
├── storage.ts ✅
├── mcp.ts ✅
├── documents.ts ✅
├── stripe.ts ✅
├── root.ts 🆕
├── docs.ts 🆕
├── admin.ts 🆕
└── cors.ts 🆕
```

## Benefits

1. **Maintainability** - Each route module is focused and testable
2. **Discoverability** - Easy to find where routes are defined
3. **Reusability** - Route modules can be imported independently
4. **Testability** - Each module can be tested in isolation
5. **Performance** - Smaller files load faster
6. **Code Review** - Smaller diffs are easier to review

## Priority

**High Priority:**
1. Register existing route modules (api-keys, storage, mcp, analysis, documents, stripe)
2. Remove duplicate chat routes
3. Extract root routes

**Medium Priority:**
4. Extract docs routes
5. Extract admin routes
6. Extract CORS routes

**Low Priority:**
7. Clean up commented code
8. Remove unused imports
9. Consolidate helper functions

