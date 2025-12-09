# Enhanced Lease Analysis - Playwright Test Suite

This directory contains comprehensive E2E tests for the Enhanced Lease Analysis component (`LeaseAnalysisDashboard`).

## Test Files Overview

### 1. `lease-analysis-basic.spec.ts`

**Core functionality tests:**

- Page loading and header sections
- Form tab navigation (Basic Info, Escalations, Additional Costs, Options)
- Basic form submission and results display
- Input validation and error handling
- Responsive design verification
- Mobile viewport testing

### 2. `lease-analysis-upload.spec.ts`

**File upload and AI features:**

- Drag-and-drop visual feedback states
- AI extraction preview with confidence indicators
- Apply/Dismiss extracted data functionality
- File upload error handling
- Upload progress indicators
- File type validation
- Mock document extraction responses

### 3. `lease-analysis-templates.spec.ts`

**Templates and history management:**

- Template selection and form population
- "View All Templates" functionality
- Save analysis workflow with localStorage
- Load saved analysis functionality
- Delete saved analysis
- Empty state handling
- Template categories and descriptions

### 4. `lease-analysis-scenarios.spec.ts`

**Advanced features and scenario analysis:**

- Scenario analysis execution (optimistic, conservative, pessimistic)
- Scenario comparison display and calculations
- Export functionality (PDF, CSV, JSON)
- Shareable link generation
- Lease vs buy comparison display
- Risk analysis indicators
- Payment schedule visualization
- Scenario analysis close/reopen

### 5. `lease-analysis-validation.spec.ts`

**Form validation and edge cases:**

- Required field validation
- Numeric input boundary testing
- Interest rate validation (0-100%)
- Term months validation
- Escalation and additional costs validation
- API error handling (500 errors)
- Network timeout handling
- Form reset functionality
- Accessibility (keyboard navigation, screen reader labels)

### 6. `lease-analysis-mobile.spec.ts`

**Mobile and responsive design:**

- Mobile layout and touch interactions
- Mobile tab navigation (2x2 grid)
- Touch-friendly form inputs (44px+ touch targets)
- Mobile upload interactions
- Mobile button active states
- Mobile scenario analysis layout (single column)
- Mobile template selection
- Text scaling and readability
- Horizontal scroll prevention
- Mobile save/load workflow
- Tablet layout testing (iPad)

## Key Testing Patterns

### API Mocking

All tests mock the `/v1/api/analysis/lease` endpoint to ensure consistent, predictable responses:

```typescript
await page.route('**/v1/api/analysis/lease', async (route) => {
  await route.fulfill({
    status: 200,
    headers: { 'content-type': 'application/json' },
    json: { /* mock response */ },
  });
});
```

### File Upload Testing

Document extraction is mocked with realistic confidence scores and extracted data:

```typescript
await page.route('**/v1/api/documents/extract', async (route) => {
  await route.fulfill({
    status: 200,
    json: {
      extractedData: {
        confidence: { overall: 0.85, financial: 0.92, property: 0.78 },
        leaseTerm: 60,
        baseRent: 2500,
        // ... more extracted fields
      },
    },
  });
});
```

### LocalStorage Mocking

Saved analyses are tested using localStorage mocking:

```typescript
await page.addInitScript(() => {
  const savedAnalysis = { /* mock analysis data */ };
  localStorage.setItem('lease-analyses', JSON.stringify([savedAnalysis]));
});
```

### Responsive Testing

Mobile and tablet viewports are tested explicitly:

```typescript
test.use({ ...devices['iPhone 12'] });
test.use({ ...devices['iPad'] });
```

## Coverage Areas

### ✅ Functional Testing

- Form submission and validation
- Tab navigation and state management
- File upload and AI extraction
- Template system
- Analysis history (save/load/delete)
- Export functionality
- Scenario analysis
- Results display

### ✅ Error Handling

- API errors (4xx, 5xx responses)
- Network timeouts
- Invalid file uploads
- Form validation errors
- Missing required fields

### ✅ User Experience

- Loading states and progress indicators
- Visual feedback for drag-and-drop
- Button active states
- Mobile touch interactions
- Responsive layouts

### ✅ Accessibility

- Keyboard navigation
- Screen reader labels
- Touch target sizing (mobile)
- Proper ARIA attributes

### ✅ Performance

- Network request mocking
- Timeout handling
- Progress indication

## Running the Tests

```bash
# Run all lease analysis tests
npx playwright test lease-analysis

# Run specific test file
npx playwright test lease-analysis-basic.spec.ts

# Run with UI mode for debugging
npx playwright test --ui

# Run mobile tests only
npx playwright test lease-analysis-mobile.spec.ts

# Generate test report
npx playwright test --reporter=html
```

## Test Data Patterns

### Standard Form Data

```typescript
const standardLease = {
  principal: 100000,
  annualRate: 6.5,
  termMonths: 60,
  leaseType: 'office-lease',
};
```

### Mock Analysis Response

```typescript
const mockAnalysisResult = {
  metrics: {
    totalCost: 120000,
    averageMonthlyPayment: 2000,
    presentValue: 110000,
    effectiveAnnualRate: 0.065,
  },
  schedule: [/* payment schedule array */],
  riskAnalysis: {
    flexibilityScore: 75,
    renewalRisk: 'medium',
    marketComparability: 'high',
  },
  leaseVsBuy: {
    recommendation: 'lease',
    leaseOption: { totalCost: 120000, monthlyPayment: 2000 },
    buyOption: { totalLoanCost: 140000, loanPayment: 2333 },
  },
};
```

This test suite provides comprehensive coverage of the Enhanced Lease Analysis component, ensuring all features work correctly across different devices, screen sizes, and user interactions.