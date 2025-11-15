# 📋 API Modularization Plan

## Current Status

**File:** `workers/api/src/index.ts`  
**Lines:** 3,435  
**Status:** ❌ MONOLITHIC - Needs modularization

---

## ✅ Tools Check: No Duplicates

**MCP Tools:** 26 unique tools  
**Duplicates:** None found ✅

**All Tools:**
1. Amortization
2. AutoLoan
3. BondPricing
4. Budget
5. CCAAnalysis
6. CashFlowAnalysis
7. CollegeSavings
8. DCFAnalysis
9. DebtPayoff
10. EbitdaForecasting
11. EbitdaScenarioComparison
12. EnhancedLease
13. FinancialJourney
14. HomeBuyingAffordability
15. InsuranceNeeds
16. InteractiveModel
17. InvestmentPortfolio
18. Lease
19. MAAnalysis
20. MultiModelScenario
21. OptionsPricing
22. PopulateLeaseForm
23. Retirement
24. SavingsGoal
25. StudentLoan
26. TaxOptimization

**Result:** ✅ All tools are unique, no cleanup needed

---

## 📊 Current Structure

### Already Modularized ✅
- `routes/health.ts` - Health check endpoint
- `routes/analytics.ts` - Client-side event tracking
- `routes/api-keys.ts` - API key management
- `routes/stripe.ts` - Stripe integration

### Still in index.ts ❌ (Needs Extraction)

**1. Chat Endpoints (~500 lines)**
- `POST /v1/chat/enhanced` (Enhanced AI chat with thinking)
- `POST /v1/chat` (Basic Workers AI chat)
- `POST /api/v1/chat/enhanced` (Contextual chat with AI orchestrator)

**2. MCP Protocol Endpoints (~50 lines)**
- `POST /mcp` (MCP protocol handler)
- `GET /api/v1/mcp/tools` (List available MCP tools)

**3. Document Processing Endpoints (~400 lines)**
- `POST /v1/api/upload/lease` (Upload lease documents)
- `POST /v1/api/extract/lease-direct` (Extract from base64)
- `POST /v1/api/extract/lease-text` (Extract from plain text)

**4. Analysis Endpoints (~800 lines)**
- `GET /v1/api/analysis` (Analysis info)
- `POST /v1/api/analysis/lease` (Lease analysis)
- `POST /v1/api/analysis/enhanced-lease` (Enhanced lease analysis)
- `POST /v1/api/analysis/ebitda-forecast` (EBITDA forecasting)
- `POST /v1/api/analysis/amortization` (Amortization analysis)
- `POST /api/analysis` (Generic analysis endpoint)

**5. Storage Endpoints (~150 lines)**
- `GET /v1/storage/status` (Storage status)
- `GET /v1/storage/usage` (Usage stats)
- `POST /v1/storage/reconcile` (Reconcile buckets)

**6. Utility Endpoints (Small, can stay in index.ts)**
- `GET /` (Root/health)
- `GET /ping` (Ping)
- `GET /version` (Version info)
- `GET /v1/admin/circuit-breakers` (Admin)
- `OPTIONS /*` (CORS preflight - 5 routes)
- `ALL *` (404 handler)

---

## 🎯 Modularization Strategy

### Phase 1: Extract Chat Routes
**File:** `routes/chat.ts`  
**Routes:** 3 chat endpoints (~500 lines)  
**Reason:** Largest section, most complex

### Phase 2: Extract Document Routes
**File:** `routes/documents.ts`  
**Routes:** 3 document endpoints (~400 lines)  
**Reason:** Second largest, clear grouping

### Phase 3: Extract Analysis Routes  
**File:** `routes/analysis.ts`  
**Routes:** 6 analysis endpoints (~800 lines)  
**Reason:** Large section, clear purpose

### Phase 4: Extract MCP Routes
**File:** `routes/mcp.ts`  
**Routes:** 2 MCP endpoints (~50 lines)  
**Reason:** Protocol-specific

### Phase 5: Extract Storage Routes
**File:** `routes/storage.ts`  
**Routes:** 3 storage endpoints (~150 lines)  
**Reason:** Clear grouping

### Phase 6: Clean Up index.ts
**Final size:** ~200 lines  
**Contents:** 
- Imports
- Router initialization
- Utility routes (ping, version, admin)
- CORS options
- Route registrations
- 404 handler
- Export default handler

---

## 📐 Route Module Template

Each route module should follow this pattern:

```typescript
import type { RouterType } from 'itty-router';
import type { Env } from '../types';
import { buildDefaultHeaders, withErrorHandler } from '../lib';
// ... other imports

export function registerChatRoutes(router: RouterType) {
  // Route 1
  router.post('/v1/chat', withErrorHandler(async (request, env) => {
    // ... implementation
  }));

  // Route 2
  router.post('/api/v1/chat/enhanced', withErrorHandler(async (request, env) => {
    // ... implementation
  }));
}
```

---

## 📊 Expected Results

### Before Modularization:
```
index.ts: 3,435 lines ❌
routes/:
  - health.ts: 18 lines
  - analytics.ts: ~100 lines
  - api-keys.ts: ~150 lines
  - stripe.ts: ~100 lines
```

### After Modularization:
```
index.ts: ~200 lines ✅ (94% reduction!)
routes/:
  - health.ts: 18 lines
  - analytics.ts: ~100 lines
  - api-keys.ts: ~150 lines
  - stripe.ts: ~100 lines
  - chat.ts: ~500 lines (NEW)
  - documents.ts: ~400 lines (NEW)
  - analysis.ts: ~800 lines (NEW)
  - mcp.ts: ~50 lines (NEW)
  - storage.ts: ~150 lines (NEW)
```

**Total:** ~2,250 lines moved to route modules  
**index.ts reduction:** 3,435 → 200 lines

---

## ✅ Benefits

**1. Maintainability:**
- Easy to find specific routes
- Clear separation of concerns
- Smaller files, easier to understand

**2. Testability:**
- Can test route modules independently
- Mock dependencies more easily
- Better unit test organization

**3. Scalability:**
- Add new routes to appropriate modules
- No more massive index.ts
- Clear patterns for new features

**4. Collaboration:**
- Multiple developers can work on different route files
- Reduced merge conflicts
- Clear ownership boundaries

**5. Performance:**
- Faster IDE loading/parsing
- Better code navigation
- Improved developer experience

---

## 🚀 Implementation Order

1. ✅ Check for duplicate tools (DONE - no duplicates)
2. 📝 Create modularization plan (THIS DOC)
3. Extract chat routes → `routes/chat.ts`
4. Extract document routes → `routes/documents.ts`
5. Extract analysis routes → `routes/analysis.ts`
6. Extract MCP routes → `routes/mcp.ts`
7. Extract storage routes → `routes/storage.ts`
8. Clean up `index.ts` to minimal size
9. Test build
10. Deploy

---

## 📚 Dependencies to Extract

Each route module may need:
- Type imports (Env, Request types)
- Service imports (LLM services, caching, retry)
- Schema imports (Zod validation)
- Lib imports (headers, logging, auth)
- Analyzer imports (from @financial-analysis/analysis)

---

##Status: Ready to implement
**Next Step:** Create `routes/chat.ts` with all chat endpoints

