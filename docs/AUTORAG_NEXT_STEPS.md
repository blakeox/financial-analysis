# AutoRAG Integration - Next Steps

**Date**: January 2025  
**Status**: Waiting for instance name

---

## ✅ Current Status

You've completed the NLWeb template setup in the Cloudflare Dashboard. Your website (`fanalyx.com`) is being indexed by AutoRAG as the knowledge source.

**What you need:** The **AutoRAG instance name** from your Cloudflare Dashboard.

---

## 🔍 How to Find Your Instance Name

1. Go to **Cloudflare Dashboard**
2. Navigate to **AI > AI Search** (or **AI > AutoRAG**)
3. Find your NLWeb instance
4. Look for the **instance name** (e.g., `gentle-tree-ce67` or similar)

---

## 🚀 Integration Code

Once you have the instance name, the integration is simple:

**File:** `workers/api/src/index.ts`

In the startup-planning LLM handler (around line 3000), add this BEFORE the prompt construction:

```typescript
// Try to retrieve relevant content from website via AutoRAG
if (env.AI) {
  try {
    // Use your actual instance name here
    const aiAutorag = env.AI.autorag('YOUR_INSTANCE_NAME');
    
    const websiteResults = await aiAutorag.aiSearch({
      query: sanitizedMessage,
      maxResults: 3
    });
    
    if (websiteResults && websiteResults.length > 0) {
      // Format results for LLM
      const formattedResults = websiteResults
        .map((result: any, idx: number) => {
          const url = result.url || 'Unknown URL';
          const content = result.content || result.text || '';
          const title = result.metadata?.title || 'Page Content';
          
          return `${idx + 1}. **${title}** (${url})\n   ${content.substring(0, 500)}${content.length > 500 ? '...' : ''}`;
        })
        .join('\n\n');
      
      // Add website content to prompt
      promptContext.websiteContent = `\n\nRelevant information from our website:\n${formattedResults}\n\nUse this information to provide specific, cited guidance.`;
      
      logInfo(requestContext, 'Retrieved website content from AutoRAG', {
        results: websiteResults.length
      });
    }
  } catch (error) {
    logWarn(requestContext, 'AutoRAG search failed', {
      error: error instanceof Error ? error.message : String(error)
    });
    // Continue without website context - graceful degradation
  }
}
```

**No wrangler.toml changes needed** - Uses your existing `env.AI` binding!

---

## 🎯 Expected Behavior

**Before Integration:**
```
User: "How do I calculate my burn rate?"
LLM: "Burn rate is calculated as monthly expenses minus..."
```

**After Integration:**
```
User: "How do I calculate my burn rate?"
AutoRAG Finds: /journey/startup-planning/step/startup-budget
LLM: "Based on our [Startup Budget Planning guide](/journey/startup-planning/step/startup-budget), 
      burn rate is calculated as monthly expenses ($75K) minus monthly revenue ($50K), 
      giving you a net burn rate of $25K/month..."
```

---

## 📊 Testing Plan

1. **Deploy** with instance name added
2. **Test queries:**
   - "What tools do you have?"
   - "How do I calculate runway?"
   - "Explain burn rate"
3. **Verify** responses cite your website pages
4. **Monitor** logs for AutoRAG retrieval success

---

## 🆘 Troubleshooting

**If AutoRAG returns empty:**
- Wait 10-15 minutes for initial indexing
- Check instance name is correct
- Verify website is accessible at fanalyx.com

**If you get errors:**
- Check logs for specific error message
- Verify `env.AI` binding exists
- Confirm instance name spelling

---

## 📝 Next Steps

1. **Get instance name** from dashboard
2. **Share with me** - I'll add the integration code
3. **Deploy** and test
4. **Monitor** performance and user feedback

