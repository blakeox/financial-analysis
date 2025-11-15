# Journey Step Field Update Fix

## Problem
On the home-buying journey's financial-snapshot step (`/journey/home-buying/step/financial-snapshot/`), when users asked "What if my income is 80000", the chat:
1. Showed generic amortization examples instead of financial snapshot examples
2. Gave a canned response about updating the amortization model
3. Did not actually update the income field

## Root Cause
1. **Context Detection**: The home-buying journey was mapped to 'amortization' context, but the financial-snapshot step has different fields (income, assets, debts) that aren't in amortization field mappings
2. **Field Update Detection**: The backend only checked for field updates in `['lease', 'amortization', 'ebitda', 'startup-planning']` contexts, not 'general'
3. **Missing Field Mappings**: The 'general' context didn't have field mappings for financial snapshot fields like `annualIncome`, `savingsBalance`, etc.
4. **Pattern Matching**: The frontend `parseFieldUpdate` function didn't handle "What if my income is 80000" pattern well

## Solution

### 1. **Journey Step Context Detection** (`apps/web/src/scripts/chat/context-manager.ts`)
Added specific detection for journey step pages before general journey pages:

```typescript
// Journey step pages - check these FIRST before general journey pages
{ pattern: /\/journey\/([^/]+)\/step\/([^/]+)/, handler: (match) => {
  const journeyId = match[1];
  const stepId = match[2];
  
  const stepContextMap = {
    'home-buying': {
      'financial-snapshot': 'general', // Financial snapshot has its own fields
      'goal-planning': 'amortization',
      // ...
    },
  };
  
  return stepContextMap[journeyId]?.[stepId] || journeyContext;
}}
```

### 2. **Field Mappings for General Context** (`apps/web/src/scripts/chat/calculator-contexts.ts`)
Added comprehensive field mappings for financial snapshot fields:

```typescript
'general': {
  fieldMappings: {
    'income': 'annualIncome',
    'annual income': 'annualIncome',
    'gross income': 'annualIncome',
    'monthly income': 'monthlyIncome',
    'checking': 'checkingBalance',
    'savings': 'savingsBalance',
    'credit card': 'creditCardDebt',
    'student loan': 'studentLoanDebt',
    // ... more mappings
  },
}
```

### 3. **Backend Field Update Support** (`workers/api/src/services/intent-detector.ts`)
- Added 'general' to supported contexts for field updates
- Added income field patterns with context restrictions:
  ```typescript
  {
    field: 'annualIncome',
    keywords: ['income', 'annual income', 'gross income', 'salary'],
    extractor: (msg) => this.extractCurrency(msg),
    contexts: ['general'], // Only for general context
  }
  ```
- Updated `detectFieldUpdate` to accept context parameter and filter patterns by context

### 4. **Orchestrator Support** (`workers/api/src/services/llm-orchestrator.ts`)
Added 'general' to the list of contexts that support field updates:

```typescript
if (['lease', 'amortization', 'ebitda', 'startup-planning', 'general'].includes(context)) {
  const fieldIntent = this.intentDetector.detectFieldUpdate(message.toLowerCase(), context);
  // ...
}
```

### 5. **Improved Pattern Matching** (`apps/web/src/scripts/chat/calculator-contexts.ts`)
Enhanced `parseFieldUpdate` to handle more natural language patterns:

```typescript
const patterns = [
  /(?:set|change|update|make)\s+(.+?)\s+(?:to|at|=)\s+([0-9,.]+%?)/i,
  /(?:what if|try)\s+(?:my|the)\s+(.+?)\s+(?:was|is)\s+([0-9,.]+%?)/i,
  /(?:my|the)\s+(.+?)\s+(?:is|was)\s+([0-9,.]+%?)/i, // "my income is 80000"
];
```

### 6. **Updated Context Examples** (`apps/web/src/scripts/chat/context-manager.ts`)
Changed 'general' context intro and examples to be more relevant for financial snapshot pages:

```typescript
general: {
  intro: 'I can help you update your financial information. What would you like to change?',
  examples: [
    '"Set my income to 80000"',
    '"What if my income is 80000"',
    '"Update my savings to 10000"',
  ],
}
```

## Files Changed

1. `apps/web/src/scripts/chat/context-manager.ts` - Journey step context detection
2. `apps/web/src/scripts/chat/calculator-contexts.ts` - Field mappings and pattern matching
3. `workers/api/src/services/intent-detector.ts` - Backend field update detection
4. `workers/api/src/services/llm-orchestrator.ts` - Orchestrator support for 'general' context

## Testing

To verify the fix:
1. Navigate to `/journey/home-buying/step/financial-snapshot/`
2. Open the chat panel
3. Type: "What if my income is 80000"
4. Expected: Income field should update to 80000, chat should confirm the update
5. Try: "Set my savings to 10000"
6. Expected: Savings field should update

## Result

Now when users are on financial-snapshot pages:
- ✅ Chat shows relevant examples for updating financial information
- ✅ Field updates are detected and applied correctly
- ✅ Both frontend and backend support the 'general' context for journey step pages
- ✅ Natural language patterns like "What if my income is 80000" work correctly

