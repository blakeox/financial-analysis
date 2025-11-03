# LLM Architecture Refactor Plan

**Goal:** Restructure LLM implementation for best practices, speed, efficiency, and deep application integration.

---

## 🔍 Current State Analysis

### Endpoint Architecture

**3 Main LLM Endpoints:**
1. `/v1/chat` - Basic Workers AI chat
2. `/v1/chat/enhanced` - Enhanced chat with thinking process  
3. `/api/v1/chat/enhanced` - Contextual chat for VS Code-style panel

**Issues Identified:**
- Large, monolithic handlers (4000+ lines in index.ts)
- Mixing concerns (validation, business logic, LLM calls)
- Duplicate validation logic
- Pattern matching instead of LLM for many cases
- Limited reuse of services
- Hard to test and extend

### Current Services

✅ **Good:**
- `IntelligentCache` - Multi-level caching
- `LLMRetryHandler` - Retry with backoff
- `LLMMetricsCollector` - Metrics tracking
- `ResponseValidator` - Response validation
- `ResponseFormatter` - Response formatting
- `retrieveWebsiteContext` - AutoRAG helper

❌ **Missing:**
- Central LLM service
- Unified prompt builder
- Context manager
- Routing/orchestration layer

---

## 🎯 Refactor Goals

1. **Single Responsibility** - Each service does one thing well
2. **Testability** - Services can be tested in isolation
3. **Reusability** - Common logic extracted and shared
4. **Performance** - Fast path for common cases
5. **Observability** - Clear tracing and metrics
6. **Extensibility** - Easy to add new features

---

## 📐 New Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    API Endpoints                             │
│  /api/v1/chat/enhanced, /v1/chat, /v1/chat/enhanced        │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│              LLM Orchestrator                                │
│  - Route to appropriate handler                             │
│  - Unified request/response format                          │
│  - Error handling & fallbacks                               │
└────────────────────┬────────────────────────────────────────┘
                     │
         ┌───────────┼───────────┐
         ▼           ▼           ▼
   ┌─────────┐ ┌─────────┐ ┌─────────┐
   │Context  │ │Intent   │ │Message  │
   │Manager  │ │Detector │ │Builder  │
   └────┬────┘ └────┬────┘ └────┬────┘
        │           │           │
        └───────────┼───────────┘
                    │
                    ▼
┌─────────────────────────────────────────────────────────────┐
│              LLM Service                                     │
│  - Unified prompt building                                  │
│  - Model selection                                          │
│  - Streaming support                                        │
│  - Response processing                                      │
└────────────────────┬────────────────────────────────────────┘
                     │
    ┌────────────────┼────────────────┐
    ▼                ▼                ▼
┌─────────┐   ┌──────────┐   ┌──────────┐
│Context  │   │Retrieval │   │Tool      │
│Cache    │   │(AutoRAG) │   │Executor  │
└─────────┘   └──────────┘   └──────────┘
    │                │                │
    └────────────────┼────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│              Infrastructure Services                         │
│  - IntelligentCache                                         │
│  - LLMRetryHandler                                          │
│  - LLMMetricsCollector                                      │
│  - ResponseValidator                                        │
│  - ResponseFormatter                                        │
└─────────────────────────────────────────────────────────────┘
```

---

## 🔨 Implementation Plan

### Phase 1: Create Core Services (High Priority)

#### 1.1 LLM Service
**File:** `workers/api/src/services/llm-service.ts`

**Responsibilities:**
- Single entry point for all LLM calls
- Model selection logic
- Prompt building
- Response processing
- Streaming support

**Interface:**
```typescript
interface LLMRequest {
  message: string;
  context?: string;
  systemPrompt?: string;
  temperature?: number;
  maxTokens?: number;
  stream?: boolean;
  metadata?: Record<string, unknown>;
}

interface LLMResponse {
  content: string;
  fromCache?: boolean;
  tokensUsed?: number;
  latency?: number;
  metadata?: Record<string, unknown>;
}

export class LLMService {
  constructor(
    private ai: Ai,
    private cache: IntelligentCache,
    private retry: LLMRetryHandler,
    private metrics: LLMMetricsCollector
  ) {}
  
  async chat(request: LLMRequest): Promise<LLMResponse>
  async chatStreaming(request: LLMRequest): AsyncIterable<LLMResponse>
}
```

#### 1.2 Context Manager
**File:** `workers/api/src/services/context-manager.ts`

**Responsibilities:**
- Build context from request
- Enrich with AutoRAG results
- Inject conversation history
- Add tool information

**Interface:**
```typescript
interface ContextBuilder {
  message: string;
  contextKey: string;
  contextData?: Record<string, unknown>;
  memoryContext?: { conversationHistory?: string };
  availableTools?: ToolSummary[];
}

export class ContextManager {
  constructor(
    private ai: Ai,
    private promptBuilder: PromptBuilder
  ) {}
  
  async build(request: ContextBuilder): Promise<BuiltContext>
}
```

#### 1.3 Intent Detector
**File:** `workers/api/src/services/intent-detector.ts`

**Responsibilities:**
- Detect user intent (tool call, modification, question)
- Route to appropriate handler
- Extract parameters

**Interface:**
```typescript
interface IntentDetection {
  intent: 'tool_call' | 'field_update' | 'llm_question' | 'general';
  confidence: number;
  parameters?: Record<string, unknown>;
  suggestedTool?: string;
}

export class IntentDetector {
  detect(message: string, context: string, availableTools: ToolSummary[]): IntentDetection
}
```

#### 1.4 Message Builder
**File:** `workers/api/src/services/message-builder.ts`

**Responsibilities:**
- Build prompts from templates
- Add few-shot examples
- Format context
- Handle different output formats

**Interface:**
```typescript
interface MessageBuildOptions {
  template: string;
  variables: Record<string, unknown>;
  examples?: Array<{ input: string; output: string }>;
  outputFormat?: string;
}

export class MessageBuilder {
  build(options: MessageBuildOptions): string
}
```

---

### Phase 2: Create Orchestrator (High Priority)

#### 2.1 LLM Orchestrator
**File:** `workers/api/src/services/llm-orchestrator.ts`

**Responsibilities:**
- Route requests to appropriate handler
- Coordinate services
- Handle errors
- Return unified responses

**Interface:**
```typescript
interface OrchestrationRequest {
  message: string;
  context: string;
  contextData?: Record<string, unknown>;
  currentModel?: Record<string, unknown>;
  availableTools?: ToolSummary[];
  toolOutputs?: Record<string, unknown>;
  memoryContext?: { conversationHistory?: string };
}

interface OrchestrationResponse {
  response: string;
  toolUsed?: string;
  modelChanges?: Record<string, unknown>;
  explanation?: string;
  fromCache?: boolean;
}

export class LLMOrchestrator {
  constructor(
    private llm: LLMService,
    private contextManager: ContextManager,
    private intentDetector: IntentDetector,
    private toolExecutor: ToolExecutor
  ) {}
  
  async handle(request: OrchestrationRequest): Promise<OrchestrationResponse>
}
```

**Flow:**
```
1. Detect intent
   ↓
2. Handle intent:
   - Tool call → Execute tool
   - Field update → Return changes
   - LLM question → Build context → Call LLM
   ↓
3. Format response
   ↓
4. Return
```

---

### Phase 3: Refactor Endpoints (Medium Priority)

#### 3.1 Simplify Main Endpoint

**Before:** 4000+ line monolithic handler  
**After:** 200-line orchestrator wrapper

```typescript
router.post('/api/v1/chat/enhanced', withErrorHandler(async (request, env) => {
  const requestContext = buildRequestContext(request, env);
  
  // Validate request
  const validation = await validateRequest(request);
  if (!validation.valid) {
    return validation.error;
  }
  
  // Extract body
  const body = await request.json();
  
  // Initialize services
  const services = createServices(env);
  
  // Handle via orchestrator
  const result = await services.orchestrator.handle({
    message: body.message,
    context: body.context || 'general',
    contextData: body.contextData,
    currentModel: body.currentModel,
    availableTools: body.availableTools,
    toolOutputs: body.toolOutputs,
    memoryContext: body.memoryContext
  });
  
  // Return response
  return new Response(JSON.stringify(result), {
    status: 200,
    headers: buildChatHeaders(env)
  });
}));
```

---

### Phase 4: Enhance Features (Low Priority)

#### 4.1 Streaming Support
- Add streaming to LLMService
- Update orchestrator
- Frontend integration

#### 4.2 Multi-Model Support
- Add model selection logic
- A/B testing framework
- Fallback hierarchy

#### 4.3 Advanced Caching
- Semantic matching
- Intent-based cache keys
- Pre-computation

---

## 📊 Expected Benefits

**Code Quality:**
- 60% reduction in main file size
- Clear separation of concerns
- Testable units

**Performance:**
- 30% faster response times
- Better cache hit rates
- Reduced token usage

**Maintainability:**
- Easy to add new features
- Clear extension points
- Better error handling

**Observability:**
- Comprehensive tracing
- Detailed metrics
- Debug-friendly

---

## 🚀 Migration Strategy

**Step 1:** Create services (Phase 1)  
**Step 2:** Create orchestrator (Phase 2)  
**Step 3:** Migrate one endpoint (Phase 3)  
**Step 4:** Test thoroughly  
**Step 5:** Migrate remaining endpoints  
**Step 6:** Remove old code  
**Step 7:** Add enhancements (Phase 4)  

---

## 📝 Files to Create/Modify

**New Files:**
- `workers/api/src/services/llm-service.ts`
- `workers/api/src/services/context-manager.ts`
- `workers/api/src/services/intent-detector.ts`
- `workers/api/src/services/message-builder.ts`
- `workers/api/src/services/llm-orchestrator.ts`

**Modify:**
- `workers/api/src/index.ts` - Simplify endpoints
- Tests for all new services

**Estimated Time:** 2-3 days  
**Risk:** Low (backward compatible)

---

**This refactor will make your LLM implementation world-class!** 🚀

