# LLM AutoRAG Integration - Next Steps

**Date**: January 2025  
**Status**: Ready to Implement

---

## 🎯 Current State

✅ **LLM Integration Complete**: Chatbot is fully integrated into all 4 phases of Startup Planning  
✅ **Phase-Aware Context**: Chatbot knows which phase user is in and has access to their data  
✅ **Smart Caching**: Common questions are cached for fast responses  
✅ **Tool Suggestions**: LLM suggests relevant MCP tools based on phase  
✅ **Prompt Templates**: Comprehensive phase-specific guidance  

---

## 🚀 What's Next: AutoRAG Integration

### The Big Picture

**Right Now:**  
LLM answers using pre-written prompt templates (good, but static)

**With AutoRAG:**  
LLM retrieves and uses YOUR actual website content (excellent, dynamic, authoritative)

---

## 📋 Implementation Checklist

### Step 1: Set Up AutoRAG Instance (5 min)

**In Cloudflare Dashboard:**
1. Go to **AI > AutoRAG**
2. Click **"Create Instance"**
3. Name: `fanalyx-website`
4. Data Source: `https://fanalyx.com`
5. Copy the **Instance ID** (you'll need this)

**Indexing Strategy:**
- **Include**: All subdirectories (`/journey/*`, `/docs/*`, etc.)
- **Exclude**: `/dashboard`, `/status` (user-specific pages)
- **Schedule**: "On content change" (auto-reindex on deploy)
- **Preview**: Test crawl to verify page detection

---

### Step 2: Add Binding to Worker (2 min)

**File:** `workers/api/wrangler.toml`

```toml
[[autorag]]
binding = "AUTORAG"
instance_id = "paste-your-instance-id-here"
```

---

### Step 3: Update TypeScript Types (5 min)

**File:** `workers/api/src/index.ts`

Add to WorkerEnv interface:
```typescript
export interface WorkerEnv {
  // ... existing bindings
  AUTORAG: any; // AutoRAG binding
  // ... other bindings
}
```

---

### Step 4: Integrate AutoRAG Search (30 min)

**File:** `workers/api/src/index.ts`

**Location:** Inside the `/api/v1/chat/enhanced` endpoint, in the startup-planning context handler

**Add after prompt construction, before LLM call:**

```typescript
// Try to retrieve relevant content from website
let websiteContext = '';
if (env.AUTORAG && shouldRetrieveFromKnowledgeBase(sanitizedMessage)) {
  try {
    const searchResults = await env.AUTORAG.aiSearch({
      query: sanitizedMessage,
      maxResults: 3,
      minScore: 0.7, // Only high-quality matches
    });

    if (searchResults && searchResults.length > 0) {
      websiteContext = formatSearchResults(searchResults);
      logInfo(requestContext, 'AutoRAG retrieved website content', {
        queryLength: sanitizedMessage.length,
        resultsCount: searchResults.length,
      });
    }
  } catch (error) {
    logWarn(requestContext, 'AutoRAG search failed', {
      error: error instanceof Error ? error.message : String(error),
    });
    // Continue without website context - fall back to prompt templates
  }
}

// Enrich prompt with website content if available
if (websiteContext) {
  promptContext.websiteContent = `\n\nRelevant information from our website:\n${websiteContext}\n\nUse this information to provide specific, data-backed guidance.`;
}
```

**Add helper functions at module level:**

```typescript
/**
 * Determine if query should trigger AutoRAG search
 */
function shouldRetrieveFromKnowledgeBase(message: string): boolean {
  // Skip very short queries (likely yes/no or single words)
  if (message.length < 20) return false;
  
  // Skip if user just wants to change a field
  const fieldChangePatterns = [
    /^(set|change|update|make).*\sto\s/,
    /^(what|show|give)\sme\s\d+/,
  ];
  if (fieldChangePatterns.some(p => p.test(message.toLowerCase()))) {
    return false;
  }
  
  // Otherwise, search is beneficial
  return true;
}

/**
 * Format AutoRAG search results for LLM prompt
 */
function formatSearchResults(results: any[]): string {
  return results
    .map((result, idx) => {
      const url = result.url || result.metadata?.url || 'Unknown URL';
      const content = result.content || result.text || '';
      const title = result.metadata?.title || extractTitleFromContent(content);
      
      return `${idx + 1}. **${title}** (${url})\n   ${content.substring(0, 500)}${content.length > 500 ? '...' : ''}`;
    })
    .join('\n\n');
}

/**
 * Extract title from content snippet
 */
function extractTitleFromContent(content: string): string {
  const lines = content.split('\n').filter(l => l.trim().length > 0);
  return lines[0]?.substring(0, 60) || 'Page Content';
}
```

---

### Step 5: Deploy & Test (10 min)

**Deploy:**
```bash
cd workers/api
npm run deploy
```

**Test Scenarios:**

1. **Feature Discovery Query:**
   ```
   "What tools do you have for startup planning?"
   ```
   **Expected:** AutoRAG finds `/journey/startup-planning` page

2. **Specific Calculation Query:**
   ```
   "How do I calculate my runway based on my budget?"
   ```
   **Expected:** AutoRAG finds `startup-budget` content

3. **Cross-Reference Query:**
   ```
   "How does Phase 1 investment affect Phase 2 projections?"
   ```
   **Expected:** AutoRAG finds both phase pages

4. **Simple Field Change:**
   ```
   "Set interest rate to 5%"
   ```
   **Expected:** No AutoRAG call (wasteful for simple commands)

---

### Step 6: Monitor & Optimize (Ongoing)

**Add to Cloudflare Analytics:**

Track:
- AutoRAG queries per hour/day
- Average response latency with/without AutoRAG
- Cache hit rate improvements
- Most retrieved pages

**Optimize:**

1. **Adjust `minScore`**: If too many results, increase; if too few, decrease
2. **Fine-tune `maxResults`**: 3 is good for long-form responses, but can be reduced for concise answers
3. **Improve `shouldRetrieveFromKnowledgeBase`**: Add more patterns as you discover common non-search queries

---

## 🎯 Expected Outcomes

### Response Quality Improvements

**Before:**
> "Burn rate is calculated as monthly expenses minus monthly revenue..."

**After:**
> "Based on our [Startup Budget Planning guide](/journey/startup-planning/step/startup-budget), burn rate is calculated as monthly expenses minus monthly revenue. Using your Phase 2 data: your expenses total $75,000/month and revenue is $50,000/month, giving you a net burn rate of $25,000/month..."

### User Experience Improvements

✅ **Citations**: Users see links to authoritative content  
✅ **Consistency**: Same information as your website  
✅ **Discovery**: Users learn about features organically  
✅ **Trust**: Responses reference your proven expertise  

### Business Impact

✅ **SEO Boost**: More pages get discovered  
✅ **Lower Support**: Users self-serve via chat  
✅ **Higher Conversion**: Better feature discovery  
✅ **Authority**: Positions you as the expert source  

---

## 🔄 Optional Enhancements

### 1. Hybrid Approach

Combine website content with external data:

```typescript
// Retriever website content
const websiteResults = await env.AUTORAG.aiSearch(...);

// Also retrieve from external data sources (optional)
const benchmarkResults = await fetchExternalBenchmarks(query);

// Combine in prompt
promptContext.allContext = formatBothSources(websiteResults, benchmarkResults);
```

### 2. Phase-Specific Search

Bias results toward current phase:

```typescript
// Add phase context to query
const enhancedQuery = phaseData.phase
  ? `${message} [context: startup planning phase ${phaseData.phase}]`
  : message;

const results = await env.AUTORAG.aiSearch({
  query: enhancedQuery,
  // ...
});
```

### 3. Personalized Results

Use user's journey data to filter results:

```typescript
if (currentPhaseData && Object.keys(currentPhaseData).length > 0) {
  // Add user-specific context
  promptContext.userData = `User has filled in: ${Object.keys(currentPhaseData).join(', ')}`;
}
```

---

## 📊 Success Metrics

**Week 1:**
- [ ] AutoRAG integration deployed
- [ ] Basic queries working
- [ ] No performance regressions
- [ ] Zero errors in logs

**Week 2:**
- [ ] 50%+ of queries trigger AutoRAG
- [ ] Average response time < 3s
- [ ] Positive user feedback
- [ ] Higher engagement metrics

**Week 4:**
- [ ] 80%+ of complex queries use AutoRAG
- [ ] 10%+ increase in page clicks from chat
- [ ] 20%+ reduction in support tickets
- [ ] Measurable SEO improvements

---

## 🚨 Troubleshooting

### Issue: AutoRAG Returns No Results

**Check:**
- Instance ID is correct
- Website is deployed and accessible
- Site map includes target pages
- Query is long enough (> 20 chars)

**Fix:**
- Lower `minScore` threshold
- Verify site crawl in AutoRAG dashboard
- Check for robots.txt blocking

### Issue: Slow Responses

**Check:**
- AutoRAG latency metrics
- Whether caching is working
- Network conditions

**Fix:**
- Increase cache timeouts
- Reduce `maxResults` to 2
- Add timeout wrapper to AutoRAG call

### Issue: Irrelevant Results

**Check:**
- Query phrasing
- Index quality
- Minimum score

**Fix:**
- Improve `shouldRetrieveFromKnowledgeBase` heuristics
- Increase `minScore` to 0.8
- Add query intent classification

---

## 📚 Resources

- [Cloudflare AutoRAG Docs](https://developers.cloudflare.com/autorag/)
- [AutoRAG aiSearch Reference](https://developers.cloudflare.com/autorag/api-reference/)
- [Vector Search Best Practices](https://developers.cloudflare.com/vectorize/)
- [Our Integration Plan](./AUTORAG_INTEGRATION_PLAN.md)

---

## ✅ Ready to Start?

1. Open Cloudflare Dashboard
2. Navigate to AI > AutoRAG
3. Create instance for `fanalyx-website`
4. Copy instance ID
5. Follow implementation checklist above

**Estimated Time**: ~1 hour from setup to deployment 🚀

