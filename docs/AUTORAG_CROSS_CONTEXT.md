# Expanding AutoRAG to All Contexts

**Status:** Ready to Implement

---

## 🎯 Goal

Move AutoRAG retrieval from startup-planning-only to ALL contexts so all users benefit from website knowledge base.

---

## 🔍 Current Structure

**File:** `workers/api/src/index.ts`

**Current Flow:**
```
Enhanced Chat Endpoint
  ↓
Parse Body
  ↓
Detect Context (lease, ebitda, amortization, startup-planning, general)
  ↓
Handle Field Updates (lease/ebitda/amortization)
  ↓
IF context === 'startup-planning':
  → Run AutoRAG
  → Build prompt with results
  → Call LLM
ELSE:
  → Generate simple response
```

---

## 🚀 New Structure

**Proposed Flow:**
```
Enhanced Chat Endpoint
  ↓
Parse Body
  ↓
Detect Context
  ↓
Handle Field Updates
  ↓
IF no field updates:
  → Run AutoRAG (for ALL contexts)
  → Build prompt with results
  → Call LLM
ELSE:
  → Return field update response
```

---

## 📋 Implementation Plan

### Step 1: Extract AutoRAG Helper Function

Create reusable function:
```typescript
async function retrieveWebsiteContext(
  env: Env,
  sanitizedMessage: string,
  requestContext: RequestContext
): Promise<string> {
  if (!env.AI) return '';
  
  try {
    const aiAutorag = env.AI.autorag('ai-search-gentle-tree-ce67-d9b958');
    const websiteResponse = await aiAutorag.aiSearch({ query: sanitizedMessage });
    
    // Parse response...
    
    if (websiteResults.length > 0) {
      const formattedResults = formatResults(websiteResults);
      return `\n\nRelevant information from our website:\n${formattedResults}\n\nUse this information to provide specific, cited guidance.`;
    }
  } catch (error) {
    logWarn(requestContext, 'AutoRAG search failed', { error });
  }
  
  return '';
}
```

---

### Step 2: Restructure Main Handler

Move AutoRAG call BEFORE context-specific handling:
```typescript
// If no field changes detected, try to provide AI assistance
if (Object.keys(modelChanges).length === 0) {
  // Retrieve website context for ALL contexts
  const websiteContext = await retrieveWebsiteContext(env, sanitizedMessage, requestContext);
  
  // Then handle context-specific logic
  if (context === 'startup-planning') {
    // Phase-specific prompt...
  } else {
    // General prompt with website context...
  }
}
```

---

### Step 3: Create General Assistant Prompt

For non-startup contexts, use general template:
```typescript
const generalAssistantPrompt = `You are a helpful financial analysis assistant.
Based on the context and relevant information from our website, provide expert guidance.

Context: ${context}
User Question: ${sanitizedMessage}
${websiteContext}

Provide clear, actionable guidance.`;
```

---

## ✅ Benefits

**After This:**
- All calculator pages can cite website content
- Users get authoritative answers everywhere
- Single knowledge base serves all contexts
- Better SEO and content discovery

---

## 🎯 Expected Impact

**Before:**
- Only startup-planning benefits from website knowledge
- Other pages get generic responses

**After:**
- ALL pages can cite your content
- Better answers everywhere
- Higher user satisfaction

---

## 📝 Files to Modify

- `workers/api/src/index.ts` - Extract helper, restructure main handler
- `workers/api/src/prompts/prompt-templates.ts` - Add general assistant template

---

**Estimated Time:** 2-3 hours  
**Impact:** High - All users benefit

