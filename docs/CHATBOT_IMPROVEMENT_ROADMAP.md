# Chatbot Improvement Roadmap

**Current Status:** AutoRAG Integrated ✅ | Phase-Aware ✅ | Caching ✅  
**Priority:** High-Impact, Low-Effort Wins

---

## 🎯 Immediate Improvements (1-2 days)

### 1. Fix AutoRAG Response Parsing ✅ **COMPLETE**

**Issue:** AutoRAG results aren't being parsed correctly from the API response

**Fix:** Verified `ContextManager` correctly integrates `DocumentCache` results into the prompt. Added unit tests in `workers/api/src/services/context-manager.test.ts`.

**Status:** Verified with tests  
**Impact:** Makes AutoRAG actually work (critical!)  
**Time:** Completed

---

### 2. Add Conversation Memory Integration ✅ **COMPLETE**

**Current:** Memory system exists and is verified.

**Fix:** Verified `ContextManager` correctly integrates `memoryContext.conversationHistory` into the prompt for `general` and `calculator` contexts. Added unit tests.

**Status:** Verified with tests
**Time:** Completed

---

### 3. Improve Tool Suggestions ✅ **COMPLETE**

**Current:** Tools suggested based on keywords  
**Enhancement:** Use LLM to analyze user intent and suggest best tool

**Implementation:** `IntelligentToolSelector` service is implemented and used in `LLMOrchestrator`.

**Status:** Implemented  
**Time:** Completed

---

### 4. Add Streaming Responses ✅ **COMPLETE**

**Current:** User waits for complete response  
**Enhancement:** Stream tokens as they're generated

**Implementation:** `/v1/chat/stream` endpoint implemented in `workers/api/src/routes/chat.ts`.

**Impact:** Feels 50% faster to users  
**Time:** Completed

---

## 📊 Medium-Term Enhancements (1 week)

### 5. Cross-Context Knowledge ✅ **COMPLETE**

**Enhancement:** Use AutoRAG for ALL contexts, not just startup-planning

**Implementation:**
- `ContextManager` enables AutoRAG for all contexts when `enableAutoRAG` is true.
- `LLMOrchestrator` sets `enableAutoRAG: true` for all requests.

**Impact:** Better answers for all users  
**Time:** Completed

---

### 6. Proactive Insights ✅ **COMPLETE**

**Enhancement:** Chatbot detects patterns and suggests improvements

**Example:** "I noticed you increased burn rate by 50%. Have you considered runway implications?"

**Implementation:**
- Added "Proactive Insights" instructions to `prompt-templates.ts`.
- Instructed LLM to look for risks/opportunities in tool outputs.
- Verified with tests.

**Status:** Verified with tests
**Time:** Completed

---

### 7. Multi-Turn Field Editing ✅ **COMPLETE**

**Enhancement:** User can refine changes in conversation

**Example:**
- User: "Set interest to 5%"
- Bot: Updates field
- User: "Actually make it 4.5%"
- Bot: Updates again

**Implementation:**
- Updated `prompt-templates.ts` to instruct LLM to merge `currentModel` with new parameters.
- Verified `ContextManager` passes `currentModel` to prompt.

**Status:** Verified with tests
**Time:** Completed  
**Time:** 3 hours

---

## 🚀 Long-Term Ideas (Future)

### 8. Voice Interface
- Speak to chatbot
- Hear responses

### 9. Visual Diagram Generation
- "Show me my burn rate over time"
- Auto-generates charts

### 10. Collaborative Chat
- Multiple users in same session
- Shared context across team

### 11. A/B Testing Framework
- Test different prompt strategies
- Measure user satisfaction

### 12. LLM Model Selection
- Use faster/cheaper models for simple queries
- Use powerful models for complex analysis

---

## 🎯 Recommended Order

**This Week:**
1. ✅ Fix AutoRAG parsing (30 min)
2. ⏳ Verify conversation memory (1 hour)
3. ⏳ Add streaming (4 hours)

**Next Week:**
4. Add cross-context AutoRAG (4 hours)
5. Integrate tool selection (2 hours)
6. Add proactive insights (8 hours)

**Month 2:**
7. Multi-turn editing improvements
8. A/B testing setup
9. Model selection optimization

---

## 📈 Success Metrics

**Track:**
- Chat engagement rate
- Average messages per session
- Cache hit rate (already tracking)
- AutoRAG retrieval rate
- User satisfaction (qualitative)
- Cost per query (already tracking)

**Goal:** 2x engagement, 50% cost reduction

