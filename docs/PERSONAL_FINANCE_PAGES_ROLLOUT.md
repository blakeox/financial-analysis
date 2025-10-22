# Personal Finance Model Pages - Implementation Guide

## Status

### ✅ Completed
- Auto Loan Calculator (`/auto-loan`) - Fully integrated with `storeAnalysisResult()`
- Amortization Calculator (`/amortization`) - Integrated
- EBITDA Forecasting (`/ebitda-forecasting`) - Integrated (React component)
- **Savings Goal Planner (`/savings-goal`) - ✅ NEW! Complete with client-side calculation**

### 🔄 Needs Integration
These pages need to be created:

1. **Student Loan Analyzer** - Create `/student-loans` page
2. **Retirement Calculator** - Create `/retirement` page
3. **Budget Optimizer** - Create `/budget` page
4. **Debt Payoff Optimizer** - Create `/debt-payoff` page

## Integration Pattern

### For Astro Pages (like auto-loan.astro, amortization.astro)

```astro
<script>
  import { storeAnalysisResult } from '../scripts/analysis-results';
  
  // ... form submission code ...
  
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    // Gather form data
    const formData = new FormData(form);
    const payload = {
      // ... build payload from form data
    };
    
    try {
      // Call API
      const response = await fetch('/api/endpoint', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      
      const result = await response.json();
      
      // ✅ STORE RESULT
      storeAnalysisResult('tool_name_here', result);
      
      // Display results
      displayResults(result);
      
    } catch (error) {
      // Error handling
    }
  });
</script>
```

### For React Components (like EbitdaDashboard.tsx)

```tsx
// Add global declaration at top of file
declare global {
  interface Window {
    analysisResults?: Record<string, unknown>;
  }
}

// In the component, after API call:
const results = await response.json();

// ✅ STORE RESULT
if (typeof window !== 'undefined' && window.analysisResults) {
  window.analysisResults['tool_name_here'] = results;
  window.dispatchEvent(new CustomEvent('analysis-result-updated', {
    detail: { toolName: 'tool_name_here', result: results }
  }));
}

setState({ ...prev, results });
```

## Tool Name Mapping

Must match MCP tool registry (`packages/tools/src/mcp/tools.ts`):

| Page | Tool Name | API Endpoint |
|------|-----------|--------------|
| Auto Loan | `analyze_auto_loan` | `/api/v1/auto-loan` (TBD) |
| Savings Goal | `analyze_savings_goal` | `/api/v1/savings-goal` (TBD) |
| Student Loans | `analyze_student_loans` | `/api/v1/student-loans` (TBD) |
| Retirement | `analyze_retirement_savings` | `/api/v1/retirement` (TBD) |
| Budget | `optimize_budget` | `/api/v1/budget` (TBD) |
| Debt Payoff | `analyze_debt_payoff` | `/api/v1/debt-payoff` (TBD) |
| Amortization | `analyze_amortization` | `/v1/api/analysis/amortization` ✅ |
| Lease | `analyze_lease` | `/v1/api/analysis/lease` ✅ |
| EBITDA | `analyze_ebitda_forecast` | `/v1/api/analysis/ebitda-forecast` ✅ |

## API Endpoints Needed

Currently the Personal Finance tools don't have dedicated API endpoints. They need to be created:

### Option 1: Add to existing API routes
Add to `workers/api/src/index.ts`:

```typescript
// Savings Goal endpoint
router.post('/api/v1/savings-goal', withErrorHandler(async (request: Request, env: Env) => {
  const body = await request.json();
  const validated = SavingsGoalInputSchema.parse(body);
  const result = analyzeSavingsGoal(validated);
  
  return new Response(JSON.stringify({ result }), {
    headers: buildDefaultHeaders(env),
  });
}));

// Repeat for other tools...
```

### Option 2: Client-side calculation
Since these are deterministic calculations, they can run in the browser:

```typescript
import { analyzeSavingsGoal } from '@financial-analysis/analysis';

const result = analyzeSavingsGoal(inputData);
storeAnalysisResult('analyze_savings_goal', result);
displayResults(result);
```

**Recommendation: Use Option 2** (client-side) for faster responses and reduced server load.

## Page Creation Checklist

For each new model page (e.g., `/savings-goal.astro`):

### 1. File Structure
```astro
---
import Layout from '../layouts/Layout.astro';
---

<Layout 
  title="Tool Name" 
  description="Tool description"
  canonical={Astro.url.href}
>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-900">
    <!-- Header with back button -->
    <!-- Input Form -->
    <!-- Results Section (hidden initially) -->
    <!-- Loading/Error states -->
  </div>
</Layout>

<script>
  import { storeAnalysisResult } from '../scripts/analysis-results';
  import { analyzeToolName } from '@financial-analysis/analysis';
  
  // Form handling
  // Call analysis function
  // Store result
  // Display result
</script>
```

### 2. Form Inputs
Map schema fields to form inputs:
- Use proper input types (`number`, `text`, `select`)
- Add validation attributes (`min`, `max`, `step`, `required`)
- Include helpful labels and placeholders
- Group related fields

### 3. Results Display
- Summary cards for key metrics
- Detailed breakdown tables/charts
- Recommendations section
- Export/share buttons (optional)

### 4. Chat Integration
After analysis runs:
```typescript
storeAnalysisResult('tool_name', result);
```

Chat button in header:
```html
<button 
  onclick="if (window.toggleChatPanel) { 
    window.toggleChatPanel(); 
    if (window.updateChatContext) { 
      window.updateChatContext('Tool Name', { tool: 'tool_name' }); 
    } 
  }"
  class="chat-button"
>
  Ask AI about this analysis
</button>
```

### 5. Update Navigation
Add links in:
- `/models/personal.astro` (already has cards)
- `/models.astro` (category page)
- Site navigation (if applicable)

## Example: Savings Goal Planner

See `/savings-goal.astro` for complete implementation example.

Key features:
- ✅ Form with all schema fields
- ✅ Client-side calculation using `analyzeSavingsGoal()`
- ✅ Results stored via `storeAnalysisResult()`
- ✅ Chat button integration
- ✅ Responsive design
- ✅ Dark mode support
- ✅ Loading/error states
- ✅ Input validation

## Testing Checklist

For each integrated page:

1. **Form Submission**
   - [ ] Fill out form with valid data
   - [ ] Click "Analyze" button
   - [ ] Verify results display correctly

2. **Result Storage**
   - [ ] Open browser console
   - [ ] Check `window.analysisResults`
   - [ ] Should see tool result stored

3. **Chat Integration**
   - [ ] Click chat button after analysis
   - [ ] Chat panel should open
   - [ ] Type "Tell me about this"
   - [ ] Response should reference specific numbers from results

4. **Result Updates**
   - [ ] Change form values
   - [ ] Re-run analysis
   - [ ] Verify `window.analysisResults` updates
   - [ ] Ask chat again - should have new values

## Migration Priority

### Phase 1: High Traffic (Complete)

- ✅ Auto Loan
- ✅ Amortization
- ✅ EBITDA

### Phase 2: New Models (Complete)

All pages created with full integration:

- ✅ Savings Goal Planner (`/savings-goal`)
- ✅ Debt Payoff Optimizer (`/debt-payoff`)
- ✅ Student Loan Analyzer (`/student-loans`)
- ✅ Retirement Calculator (`/retirement`)
- ✅ Budget Optimizer (`/budget`)


### Phase 3: Enhancement
- Add API endpoints if server-side needed
- Add data visualization (charts)
- Add export to PDF
- Add scenario comparison
- Add "Save my analysis" feature

## Performance Considerations

### Client-Side Calculation (Recommended)
**Pros:**
- Instant results (no network delay)
- Reduced server load
- Works offline
- No API rate limits

**Cons:**
- Larger bundle size
- Browser compatibility concerns (minimal with modern browsers)
- Can't leverage server-side caching

**Bundle Impact:**
- `@financial-analysis/analysis`: ~50KB gzipped
- Individual engines: ~5-15KB each
- Use dynamic imports if needed:
  ```typescript
  const { analyzeSavingsGoal } = await import('@financial-analysis/analysis');
  ```

### Server-Side Calculation
Use when:
- Need to log usage analytics
- Want to cache common scenarios
- Require rate limiting
- Need to update calculations without client update

## Summary

**Current Status:**

- 9/9 pages integrated ✅ (100% complete)
- Infrastructure complete (storage, chat panel, API support)
- All pages use client-side calculation for instant results (except Enhanced Lease which uses API)
- All pages integrated with chat for AI assistance

**Completed Pages:**

1. Auto Loan Calculator ✅
2. Amortization Calculator ✅
3. EBITDA Forecasting ✅
4. Enhanced Lease Analysis ✅ (React component - final integration)
5. Savings Goal Planner ✅ (NEW)
6. Debt Payoff Optimizer ✅ (NEW)
7. Student Loan Analyzer ✅ (NEW)
8. Retirement Calculator ✅ (NEW)
9. Budget Optimizer ✅ (NEW)

**Next Steps:**

1. Update navigation in `/models/personal.astro` to link to new pages ✅
2. Add tests for new pages
3. Consider adding charts/visualizations
4. Optional: Add API endpoints for server-side calculation (where beneficial)

**Developer Experience:**
Once template is established, each additional page follows the same pattern:
1. Copy template
2. Update form fields to match schema
3. Update results display logic
4. Test & verify
5. Done!
