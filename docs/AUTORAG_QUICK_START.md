# AutoRAG Quick Start Guide

**Time to Deploy**: ~10 minutes  
**Status**: Ready when you have instance ID

---

## ✅ What You Just Did in Cloudflare Dashboard

1. **Clicked "Use Template"** for NLWeb for Websites
2. **Entered your website**: `fanalyx.com`
3. **Started indexing**: AutoRAG is now crawling your site
4. **Copied the instance ID**: You need this next

---

## 🚀 Add to Your Worker (3 Steps)

### Step 1: Add Binding to wrangler.toml

**File:** `workers/api/wrangler.toml`

Add this to the `[env.production]` section (after line 101):

```toml
# AutoRAG for website search
[[env.production.ai_search]]
binding = "AUTORAG"
instance_id = "PASTE_YOUR_INSTANCE_ID_HERE"
```

**Also add to development** (after line 45):

```toml
# AutoRAG for website search (dev)
[[ai_search]]
binding = "AUTORAG"
instance_id = "SAME_INSTANCE_ID_OR_CREATE_SEPARATE_DEV"
```

**Note:** You can use the same instance for dev/prod, or create separate ones.

---

### Step 2: Update TypeScript Types

**File:** `workers/api/src/types.ts`

Find the `WorkerEnv` interface and add:

```typescript
export interface WorkerEnv {
  // ... existing bindings ...
  AI?: any; // Already exists
  AUTORAG?: any; // Add this line
  // ... other bindings ...
}
```

---

### Step 3: Integrate in Code

**File:** `workers/api/src/index.ts`

Find the startup-planning LLM handler (around line 3000) where it says:

```typescript
// Build prompt from template
const prompt = buildPrompt('startupPlanningAssistant', promptContext);
```

**Add this BEFORE the prompt line:**

```typescript
// Try to retrieve relevant content from your website
if (env.AUTORAG) {
  try {
    const websiteResults = await env.AUTORAG.aiSearch({
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
      promptContext.websiteContent = `\n\nRelevant information from our website:\n${formattedResults}\n\nUse this information to provide specific guidance.`;
      
      logInfo(requestContext, 'Retrieved website content', {
        results: websiteResults.length
      });
    }
  } catch (error) {
    logWarn(requestContext, 'Website search failed', {
      error: error instanceof Error ? error.message : String(error)
    });
    // Continue without website context
  }
}

// Build prompt from template
const prompt = buildPrompt('startupPlanningAssistant', promptContext);
```

---

## 🎯 Deploy & Test

**Deploy:**
```bash
cd workers/api
npm run deploy --env production
```

**Test in Chat:**

Try asking:
- "What tools do you have for startup planning?"
- "How do I calculate runway?"
- "Explain burn rate"

You should see responses that reference your actual website pages!

---

## 🔍 What Gets Indexed?

NLWeb/AutoRAG automatically indexes:
- ✅ All `/journey/*` pages
- ✅ All calculator pages  
- ✅ All documentation
- ✅ All `/models` pages
- ✅ Homepage and feature pages

**Total: 100+ pages** of your expert content!

---

## 📊 How to Verify It's Working

**In your chat logs**, you should see:

```
info: Retrieved website content
  results: 3
```

**If you see errors:**
- Check instance ID is correct
- Wait a few minutes for indexing to complete
- Verify website is accessible at fanalyx.com

---

## 🎉 That's It!

Your chatbot now:
- ✅ Searches your website for relevant answers
- ✅ Cites your actual pages
- ✅ Uses your expert guidance
- ✅ Links to your tools

**Next:** Monitor AutoRAG in Cloudflare Dashboard to see queries and performance.

---

## 🆘 Troubleshooting

### "AUTORAG is undefined"

**Fix:** Double-check the binding name matches in wrangler.toml and the code

### "No results found"

**Wait:** Indexing takes 5-10 minutes after setup

### "Slow responses"

**Optimize:** Reduce `maxResults` from 3 to 2

---

**Questions?** Check `docs/AUTORAG_WEBSITE_INTEGRATION.md` for detailed examples.

