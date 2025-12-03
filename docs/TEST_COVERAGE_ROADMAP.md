# Test Coverage & Functionality Roadmap

**Generated:** December 2024  
**Status:** Planning Phase

---

## Executive Summary

This roadmap outlines recommended improvements for test coverage and functionality across the `financial-analysis` monorepo. After analyzing 194+ test files, 46 calculator scripts, 27 MCP tools, and current coverage metrics, we've identified opportunities for consolidation, gap-filling, and strategic improvements.

### Current State Metrics

| Component | Files | Tests | Coverage |
|-----------|-------|-------|----------|
| API Worker | 37 | 259 | ~40% statements, ~31% branches |
| Analysis Package | 18+ | 176+ | Good (engines well-tested) |
| Tools Package | 3 | 22 | **Low** (2 of 26 tools tested) |
| Web E2E (Playwright) | 84 | Varied | Visual/functional coverage |
| UI Package | 6 | Unit tests | Helper utilities |

---

## 🔴 Priority 1: Consolidate Navigation Tests (High Impact)

### Problem
- **40 navigation test files** spanning 3,183+ lines
- Excessive fragmentation: `nav.spec.ts`, `nav-*.spec.ts`, `nav.*.spec.ts`, `navbar-*.spec.ts`
- Duplicate files detected: `navbar-buttons.spec.ts`, `navbar-layout-quick.spec.ts`, `navbar-layout.spec.ts`
- Testing the same nav component from 40+ angles creates maintenance burden

### Recommendation

**REMOVE or CONSOLIDATE** (suggested reduction: 40 → 5-7 files):

| Keep | Merge Into | Remove |
|------|------------|--------|
| `nav.spec.ts` (core visibility) | — | — |
| `nav.mobile.spec.ts` | Merge `nav.mobile.stability.spec.ts` | `nav.mobile.stability.spec.ts` |
| `nav.keyboard.spec.ts` | Merge `nav.theme.spec.ts` | — |
| `nav-ssr.spec.ts` | Merge `nav-ssr-hydration-diff.spec.ts`, `nav.hydration.sanity.spec.ts` | Both |
| `navbar-layout.spec.ts` | Merge `navbar-layout-quick.spec.ts` | Quick version |
| `nav-a11y.spec.ts` (create) | Consolidate from `nav-aria-visibility.spec.ts` | — |

**Files to DELETE** (redundant or too granular):
```
nav-class-churn.spec.ts
nav-dom-churn.spec.ts
nav-mutation-element.spec.ts
nav-style-flip.spec.ts
nav-style-integrity.spec.ts
nav-style-regression.spec.ts
nav-stylesheet-injection.spec.ts
nav-postload-resources.spec.ts
nav-process.spec.ts
nav-html-hash.spec.ts
nav-longrun.spec.ts
nav-snapshots.spec.ts (unless visual regression is active)
nav-state-machine.spec.ts
nav-ui-collision.spec.ts
nav-hittest.spec.ts
nav-duplicates.spec.ts
nav-appearance-advanced.spec.ts
```

**Estimated Impact:** ~30 fewer files, ~2,000 fewer lines of test code

---

## 🔴 Priority 2: MCP Tools Test Coverage (Critical Gap)

### Problem
- **26 MCP tools** but only **2 have tests** (`ebitda-forecasting.test.ts`, `bond-pricing.test.ts`)
- Tools are the primary MCP interface; untested tools = production risk

### Tools Needing Tests (24 total)

**Tier 1 - Core Financial Tools (Add First):**
1. `amortization.ts` - Loan amortization calculations
2. `lease.ts` + `enhanced-lease.ts` - Commercial lease analysis
3. `retirement.ts` - Retirement planning
4. `dcf-analysis.ts` - DCF valuation
5. `ma-analysis.ts` - M&A analysis
6. `cca-analysis.ts` - Comparable company analysis

**Tier 2 - Popular Calculator Tools:**
7. `auto-loan.ts`
8. `budget.ts`
9. `savings-goal.ts`
10. `debt-payoff.ts`
11. `student-loan.ts`
12. `home-buying-affordability.ts`

**Tier 3 - Specialized Tools:**
13. `investment-portfolio.ts`
14. `options-pricing.ts`
15. `insurance-needs.ts`
16. `tax-optimization.ts`
17. `college-savings.ts`
18. `cash-flow.ts`

**Tier 4 - Journey/Integration Tools:**
19. `financial-journey.ts`
20. `interactive-model.ts`
21. `multi-model-scenario.ts`
22. `populate-lease-form.ts`
23. `autorag-documents.ts`

### Test Template
```typescript
// packages/tools/src/__tests__/[tool-name].test.ts
import { describe, it, expect } from 'vitest';
import { [ToolName]Tool } from '../tools/[tool-name]';

describe('[ToolName] Tool', () => {
  it('should return valid schema', () => {
    const tool = new [ToolName]Tool();
    expect(tool.name).toBe('[tool-name]');
    expect(tool.inputSchema).toBeDefined();
  });

  it('should execute with valid input', async () => {
    const tool = new [ToolName]Tool();
    const result = await tool.execute({ /* valid params */ });
    expect(result.success).toBe(true);
  });

  it('should handle invalid input gracefully', async () => {
    const tool = new [ToolName]Tool();
    const result = await tool.execute({ /* invalid params */ });
    expect(result.error).toBeDefined();
  });
});
```

---

## 🟡 Priority 3: Calculator Client Script Coverage

### Problem
- **46 calculator client scripts** in `apps/web/src/scripts/`
- Only **2 E2E test files** covering calculators (`calculator-e2e.spec.ts`, `calculators-e2e.spec.ts`)
- 662 lines of calculator E2E tests for 46 calculators = insufficient

### "Simple" Variant Evaluation

Found 5 `-simple` calculator variants:
```
dcf-valuation-simple.client.ts
ma-analysis-simple.client.ts
retirement-simple.client.ts
risk-management-simple.client.ts
savings-goal-simple.client.ts
```

**Recommendation:** Evaluate if "simple" variants are:
- [ ] Active and distinct from full versions → Keep, add tests
- [ ] Legacy/deprecated → Remove to reduce surface area
- [ ] Redundant copies → Consolidate with full versions

### Calculators Missing E2E Tests

Cross-reference `calculators-e2e.spec.ts` with available calculators to identify gaps. Likely missing:
- Options pricing calculator
- M&A analysis calculator
- DCF valuation calculator
- Risk management calculator
- Tax optimization calculator
- Insurance needs calculator

---

## 🟡 Priority 4: API Worker Coverage Improvement

### Current Coverage: 39.47% statements, 31.26% branches

### Files Needing Coverage (sorted by priority)

**Critical Services:**
1. `services/llm-orchestrator.ts` - Core AI orchestration
2. `services/llm-service.ts` - LLM interactions
3. `services/context-manager.ts` - Context building
4. `services/document-cache.ts` - Vector search

**Routes:**
5. `routes/chat.ts` - Main chat endpoint
6. `routes/analysis.ts` - Analysis endpoints
7. `routes/documents.ts` - Document management

**Middleware:**
8. `lib/error-handler.ts`
9. `lib/rate-limit.ts`
10. `lib/request-context.ts`

### Test Gap Analysis Tasks
- [ ] Run `pnpm --filter @financial-analysis/api test -- --coverage` and examine uncovered files
- [ ] Prioritize routes and services that handle user-facing functionality
- [ ] Mock Cloudflare bindings (AI, Vectorize, R2) for local testing

---

## 🟢 Priority 5: Journey Scenario Coverage

### Current Journeys
Located in `apps/web/src/pages/journey/` and `apps/web/src/utils/journeyData.ts`:

**Implemented Scenarios:**
1. `startup-planning` - 8 models
2. `auto-lease-decision` - Multi-step auto/lease comparison
3. `invest-vs-payoff-debt` - Investment vs debt payoff

### Missing Journey Tests
- [ ] `chatbot-journey-integration.spec.ts` exists but verify coverage
- [ ] Add E2E tests for each journey's multi-step workflow
- [ ] Test journey state persistence across steps

---

## 🟢 Priority 6: Performance & Regression Tests

### Existing
- `performance.test.ts` in analysis engines
- Lighthouse CI config (`lighthouserc.json`)

### Missing
- [ ] API response time benchmarks
- [ ] Calculator computation time limits
- [ ] Memory usage tests for large datasets
- [ ] Concurrent user load testing

---

## Implementation Phases

### Phase 1: Cleanup (Week 1-2)
- [ ] Delete redundant nav tests (reduce 40 → 7)
- [ ] Remove duplicate navbar test files
- [ ] Evaluate and remove "simple" calculator variants if unused
- [ ] Update test configuration to skip deleted files

### Phase 2: MCP Tools Coverage (Week 2-4)
- [ ] Add tests for Tier 1 tools (6 tools)
- [ ] Add tests for Tier 2 tools (6 tools)
- [ ] Target: 50% tool coverage

### Phase 3: Calculator E2E Expansion (Week 4-6)
- [ ] Audit which calculators have E2E tests
- [ ] Add tests for 10 highest-traffic calculators
- [ ] Add form validation edge case tests

### Phase 4: API Coverage Push (Week 6-8)
- [ ] Target 60% statement coverage
- [ ] Add integration tests for chat endpoints
- [ ] Mock Cloudflare services consistently

### Phase 5: Journey & Performance (Week 8-10)
- [ ] E2E tests for all journey scenarios
- [ ] API performance benchmark suite
- [ ] Lighthouse CI integration verification

---

## Metrics Targets

| Metric | Current | Phase 2 | Phase 4 | Final |
|--------|---------|---------|---------|-------|
| API Statement Coverage | 40% | 45% | 60% | 70% |
| API Branch Coverage | 31% | 35% | 50% | 60% |
| MCP Tools Tested | 2/26 | 14/26 | 20/26 | 24/26 |
| Nav Test Files | 40 | 7 | 7 | 7 |
| Calculator E2E Coverage | ~20% | 30% | 50% | 70% |

---

## Files to Create

```
packages/tools/src/__tests__/amortization.test.ts
packages/tools/src/__tests__/lease.test.ts
packages/tools/src/__tests__/enhanced-lease.test.ts
packages/tools/src/__tests__/retirement.test.ts
packages/tools/src/__tests__/dcf-analysis.test.ts
packages/tools/src/__tests__/ma-analysis.test.ts
packages/tools/src/__tests__/cca-analysis.test.ts
packages/tools/src/__tests__/auto-loan.test.ts
packages/tools/src/__tests__/budget.test.ts
packages/tools/src/__tests__/savings-goal.test.ts
packages/tools/src/__tests__/debt-payoff.test.ts
packages/tools/src/__tests__/student-loan.test.ts
... (24 total)
```

## Files to Delete

```bash
# Redundant nav tests (run from apps/web/tests/)
rm nav-class-churn.spec.ts
rm nav-dom-churn.spec.ts
rm nav-mutation-element.spec.ts
rm nav-style-flip.spec.ts
rm nav-style-integrity.spec.ts
rm nav-style-regression.spec.ts
rm nav-stylesheet-injection.spec.ts
rm nav-postload-resources.spec.ts
rm nav-process.spec.ts
rm nav-html-hash.spec.ts
rm nav-longrun.spec.ts
rm nav-snapshots.spec.ts
rm nav-state-machine.spec.ts
rm nav-ui-collision.spec.ts
rm nav-hittest.spec.ts
rm nav-duplicates.spec.ts
rm nav-appearance-advanced.spec.ts
rm nav-ssr-hydration-diff.spec.ts
rm nav.hydration.sanity.spec.ts
rm nav.mobile.stability.spec.ts
rm navbar-layout-quick.spec.ts
```

---

## Next Steps

1. **Review this roadmap** - Approve phases and priorities
2. **Start Phase 1** - Begin nav test cleanup
3. **Create tracking issue** - Track progress across phases
4. **Set up CI coverage gates** - Prevent regression

---

*This document should be reviewed and updated as implementation progresses.*
