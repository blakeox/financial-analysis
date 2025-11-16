# ⚠️ Competing & Duplicate Logic Analysis

## 🔍 Deep Scan Results - 3 Issues Found

### Summary
Completed comprehensive scan for duplicate functionality across entire codebase.

**True Duplicates (code in multiple files):** 3 found
**Repetitive Patterns (within same file):** 1 found (analysis.ts)

---

## ⚠️ Issue #1: Duplicate Function Name - checkRateLimit()

### Problem
Two DIFFERENT functions with the SAME name serving different purposes.

**Implementation 1: lib/auth.ts**
- Function: `async function checkRateLimit(keyInfo, env)`
- Purpose: API key-based rate limiting
- Scope: Private (not exported)
- Uses: Key ID for tracking
- Called by: validateApiKey() in same file

**Implementation 2: lib/rate-limit.ts**
- Function: `export async function checkRateLimit(request, env)`
- Purpose: IP-based rate limiting  
- Scope: Public (exported)
- Uses: Client IP for tracking
- Called by: index.ts main fetch handler

### Analysis
✅ **NO ACTUAL CONFLICT** - auth.ts version is private (not exported)
✅ Only lib/rate-limit.ts exports checkRateLimit
✅ No ambiguity when imported

**Status:** ✅ NOT A PROBLEM (private function, no conflict)

---

## ⚠️ Issue #2: Duplicate Method - splitPrompt()

### Problem
Nearly identical private method duplicated in two service classes.

**Implementation 1: services/context-manager.ts**
```typescript
private splitPrompt(prompt: string): { 
  systemPrompt?: string; userPrompt: string 
} {
  // Lines 242-269
  // Splits at markers, returns system + user parts
  return {
    systemPrompt: systemLines.join('\n').trim(),
    userPrompt: userLines.join('\n').trim()
  };
}
```

**Implementation 2: services/message-builder.ts**
```typescript
private splitPrompt(prompt: string): { 
  systemPrompt?: string; userPrompt: string 
} {
  // Lines 94-120
  // Nearly identical logic with minor differences
  return {
    systemPrompt: systemLines.join('\n'),
    userPrompt: userLines.join('\n').trim()
  };
}
```

### Analysis
⚠️ **TRUE DUPLICATE** - Same logic in two classes
- Both are private methods
- Nearly identical implementation
- Used internally by each service

**Impact:** Medium
- Maintenance burden (update in 2 places)
- Code bloat (~50 lines duplicated)
- Potential inconsistency

**Recommendation:** 
Extract to shared utility: `utils/prompt-helpers.ts`
```typescript
export function splitPrompt(prompt: string): { 
  systemPrompt?: string; userPrompt: string 
}
```

**Priority:** Medium - Not critical but should fix

---

## ⚠️ Issue #3: Duplicate Method - estimateTokens()

### Problem
Identical token estimation logic in TWO places.

**Implementation 1: utils/tokens.ts**
```typescript
export function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}
```

**Implementation 2: services/message-builder.ts**
```typescript
estimateTokens(text: string): number {
  // Simple estimation: ~4 characters per token on average
  return Math.ceil(text.length / 4);
}
```

**Implementation 3: services/llm-service.ts**
```typescript
import { estimateTokens } from '../utils/tokens'; // ✅ Correct!
```

### Analysis
⚠️ **TRUE DUPLICATE** - Exact same logic
- utils/tokens.ts has the canonical implementation
- message-builder.ts duplicates it as a method
- llm-service.ts correctly imports from utils

**Impact:** Low-Medium
- Maintenance burden
- Unnecessary code duplication
- 5 lines duplicated

**Recommendation:**
Remove method from message-builder.ts, import from utils/tokens instead
```typescript
import { estimateTokens } from '../utils/tokens';
```

**Priority:** High - Easy fix, clear duplication

---

## 📊 Summary of Findings

### Actual Duplicates to Fix: 2

1. **splitPrompt()** - Duplicated in 2 services
   - Priority: Medium
   - Impact: ~50 lines
   - Fix: Extract to utils/prompt-helpers.ts

2. **estimateTokens()** - Duplicated in message-builder
   - Priority: High
   - Impact: ~5 lines
   - Fix: Import from utils/tokens.ts

### Not Issues: 1

1. **checkRateLimit()** - Same name but private in one file
   - Priority: N/A
   - Impact: None (no conflict)
   - Fix: None needed

### Repetitive Patterns: 1

1. **analysis.ts validation** - Repetitive within same file
   - Priority: Low
   - Impact: ~420 lines
   - Fix: Optional refactoring (future improvement)

---

## 🎯 Recommended Actions

### HIGH Priority (Quick Wins)
- ✅ Fix #3: Remove estimateTokens from message-builder, import from utils

### MEDIUM Priority (Should Fix)
- 📝 Fix #2: Extract splitPrompt to utils/prompt-helpers.ts

### LOW Priority (Optional)
- 📝 Refactor analysis.ts validation patterns (future improvement)

---

## ✅ What's Already Perfect

- ✅ Zero duplicate routes
- ✅ Zero duplicate route handlers
- ✅ All middleware properly extracted
- ✅ All error handling centralized
- ✅ generateSampleLeaseText fixed
- ✅ Build passing
- ✅ TypeScript clean

---

**Status:** 2 minor duplicates found, easy to fix
**Build:** Still passing (duplicates don't break functionality)
**Priority:** Fix estimateTokens duplicate (easy, 2 min fix)
