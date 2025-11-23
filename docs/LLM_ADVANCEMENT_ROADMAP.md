# LLM Advancement Roadmap

**Date:** November 20, 2025
**Status:** Draft
**Based on:** Recent Chat Architecture Refactor

This roadmap outlines the strategic advancement of the LLM capabilities within the Financial Analysis platform. It builds upon the recently completed refactor which introduced streaming responses, a robust orchestrator pattern, and improved tool handling.

---

## Phase 1: Intelligence & Context (The "Brain")

*Focus: Making the AI smarter, more context-aware, and better at retrieving information.*

### 1.1 Complete AutoRAG Integration

**Goal:** Enable the AI to answer questions based on the platform's own documentation and knowledge base.

- **Action:** Finalize the `AutoRAG` integration in `workers/api`.
- **Dependency:** Requires the AutoRAG instance name from Cloudflare Dashboard.
- **Reference:** `docs/AUTORAG_NEXT_STEPS.md`

### 1.2 Persistent Long-Term Memory

**Goal:** Allow the AI to remember user preferences and past financial scenarios across sessions.

- **Current:** Session-based memory via `memoryContext`.
- **Upgrade:** Implement a persistent store (Cloudflare D1 or Vectorize) to index user conversations and financial profiles.
- **Benefit:** "As I mentioned last week, my risk tolerance is low..."

### 1.3 Semantic Tool Selection

**Goal:** Improve the accuracy of tool usage.

- **Current:** Keyword/heuristic-based selection.
- **Upgrade:** Use a lightweight, fast LLM (e.g., Llama 3 8B on Workers AI) as a "Router" to semantically analyze the user prompt and select the exact tools needed before passing to the main reasoning model.
- **Reference:** `docs/CHATBOT_IMPROVEMENT_ROADMAP.md`

---

## Phase 2: Security & Robustness (The "Shield")

*Focus: Protecting the application and user data at the edge.*

### 2.1 Edge Security Layer

**Goal:** Stop abuse and prompt injection before it hits the LLM.

- **Action:** Implement Cloudflare WAF custom rules for prompt injection patterns.
- **Action:** Deploy granular Rate Limiting for the `/v1/chat/*` endpoints.
- **Reference:** `docs/CHAT_SECURITY_ROADMAP.md`

### 2.2 PII Redaction Middleware

**Goal:** Ensure no sensitive personal data (SSN, specific account numbers) reaches the LLM provider.

- **Action:** Implement a pre-processing step in the Orchestrator that detects and redacts PII patterns (Regex + NER) before the prompt is constructed.

### 2.3 Financial Guardrails

**Goal:** Ensure responsible AI behavior.

- **Action:** Implement post-processing validation to ensure every financial advice response includes standard disclaimers.
- **Action:** "Refusal Training" via system prompts to prevent the AI from giving specific legal or tax advice.

---

## Phase 3: Agentic Capabilities (The "Hands")

*Focus: Moving from "Chatbot" to "Autonomous Financial Analyst".*

### 3.1 Multi-Step Reasoning (Chains)

**Goal:** Solve complex problems that require multiple tools.

- **Scenario:** "Can I afford this house, and how will it affect my retirement?"
- **Implementation:** Upgrade the Orchestrator to support "ReAct" (Reasoning + Acting) loops where the model can:
    1. Call `home-buying-affordability` tool.
    2. Observe output.
    3. Call `retirement` tool with updated cash flow.
    4. Synthesize final answer.

### 3.2 Background Analysis Agents

**Goal:** Proactive insights.

- **Implementation:** Use Cloudflare Cron Triggers to run periodic analysis on user portfolios.
- **Example:** "Weekly Wealth Check" agent that runs `investment-portfolio` analysis and alerts the user if rebalancing is needed.

---

## Phase 4: Multi-modal & UX (The "Senses")

*Focus: Expanding how users interact with the AI.*

### 4.1 Document Intelligence

**Goal:** Analyze raw financial documents.

- **Feature:** Upload a PDF (Lease Agreement, Tax Return).
- **Tech:** Use Cloudflare Workers AI (Vision models) or OCR to extract text, then feed into the `enhanced-lease` or `tax-optimization` tools.

### 4.2 Voice Interface

**Goal:** Hands-free financial planning.

- **Tech:** Integrate OpenAI Whisper (via Workers AI) for Speech-to-Text and a Text-to-Speech model for responses.

---

## Summary of Priorities

1. **Immediate:** AutoRAG & Semantic Tool Selection.
2. **Short-term:** Edge Security & PII Redaction.
3. **Medium-term:** Multi-step Reasoning Agents.
4. **Long-term:** Document Uploads & Voice.
