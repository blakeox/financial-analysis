# Advanced Chatbot and MCP System Integration Guide

This guide provides comprehensive instructions for integrating the advanced chatbot and MCP (Model Context Protocol) system enhancements into your financial analysis application.

## Overview

The enhanced system includes five major components:

1. **Advanced Error Recovery** - Robust error handling with circuit breakers and retry logic
2. **Performance Dashboard** - Real-time monitoring and analytics
3. **Advanced Caching** - Multi-layer caching with intelligent eviction
4. **Integration Tests** - Comprehensive test coverage
5. **Advanced Security** - Threat detection and access control

## Installation and Setup

### 1. Install Dependencies

```bash
npm install vitest @vitest/ui
```

### 2. Update TypeScript Configuration

Add the new files to your `tsconfig.json`:

```json
{
  "include": [
    "src/**/*",
    "src/scripts/advanced-error-recovery.ts",
    "src/scripts/performance-dashboard.ts",
    "src/scripts/advanced-caching.ts",
    "src/scripts/advanced-security.ts",
    "src/scripts/__tests__/integration.test.ts"
  ]
}
```

### 3. Update Package Scripts

Add test scripts to your `package.json`:

```json
{
  "scripts": {
    "test": "vitest",
    "test:ui": "vitest --ui",
    "test:integration": "vitest run src/scripts/__tests__/integration.test.ts"
  }
}
```

## Integration Steps

### Step 1: Enhanced Chat Panel Integration

Replace your existing chat panel with the enhanced version:

```typescript
// In your main application file
import { EnhancedChatPanel } from './scripts/enhanced-chat-panel';
import { AdvancedErrorRecovery } from './scripts/advanced-error-recovery';
import { PerformanceDashboard } from './scripts/performance-dashboard';
import { AdvancedCache } from './scripts/advanced-caching';
import { AdvancedSecurityManager } from './scripts/advanced-security';

// Initialize components
const errorRecovery = new AdvancedErrorRecovery();
const dashboard = new PerformanceDashboard();
const cache = new AdvancedCache();
const securityManager = new AdvancedSecurityManager();

// Initialize enhanced chat panel
const chatElements = {
  panel: document.getElementById('chat-panel') as HTMLDivElement,
  toggle: document.getElementById('chat-toggle') as HTMLButtonElement,
  // ... other elements
};

const chatPanel = new EnhancedChatPanel(chatElements, {
  maxMessageLength: 2000,
  messageTimeoutMs: 15000,
  maxRetries: 3,
  enableMessageHistory: true,
});
```

### Step 2: API Integration

Update your API endpoints to use the enhanced MCP server:

```typescript
// In your API worker
import { handleEnhancedMCPRequest } from './lib/enhanced-mcp';
import { defaultSecurityManager } from './lib/advanced-security';

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    // Security analysis
    const securityAnalysis = defaultSecurityManager.analyzeRequest({
      url: request.url,
      method: request.method,
      headers: Object.fromEntries(request.headers.entries()),
      body: await request.text(),
      ipAddress: request.headers.get('cf-connecting-ip'),
      userAgent: request.headers.get('user-agent'),
    });

    if (securityAnalysis.shouldBlock) {
      return new Response('Access denied', { status: 403 });
    }

    // Handle MCP requests
    if (url.pathname === '/mcp') {
      return handleEnhancedMCPRequest(request, env, requestContext);
    }

    // Handle enhanced chat
    if (url.pathname === '/api/v1/chat/enhanced') {
      return handleEnhancedChatRequest(request, env, securityAnalysis);
    }

    return new Response('Not found', { status: 404 });
  },
};
```

### Step 3: Performance Monitoring Integration

Add performance monitoring to your application:

```typescript
// In your main application
import { PerformanceMonitor } from './scripts/performance-dashboard';

const monitor = new PerformanceMonitor(dashboard);

// Wrap API calls with monitoring
const monitoredFetch = async (url: string, options: RequestInit) => {
  return monitor.monitor(
    'api_request',
    async () => {
      return fetch(url, options);
    },
    `url:${url}`
  );
};

// Wrap MCP tool calls with monitoring
const monitoredMCPCall = async (toolName: string, params: any) => {
  return monitor.monitor(
    'mcp_tool_call',
    async () => {
      return handleMCPRequest('tools/call', { name: toolName, arguments: params }, env);
    },
    `tool:${toolName}`
  );
};
```

### Step 4: Caching Integration

Integrate advanced caching into your application:

```typescript
// In your application
import { chatCache, mcpCache, analysisCache } from './scripts/advanced-caching';

// Cache chat responses
const getCachedResponse = (message: string) => {
  return chatCache.get(`chat:${message}`);
};

const setCachedResponse = (message: string, response: string) => {
  chatCache.set(`chat:${message}`, response, {
    ttl: 600000, // 10 minutes
    tags: ['chat', 'response'],
  });
};

// Cache MCP tool results
const getCachedToolResult = (toolName: string, params: any) => {
  const key = `tool:${toolName}:${JSON.stringify(params)}`;
  return mcpCache.get(key);
};

const setCachedToolResult = (toolName: string, params: any, result: any) => {
  const key = `tool:${toolName}:${JSON.stringify(params)}`;
  mcpCache.set(key, result, {
    ttl: 1800000, // 30 minutes
    tags: ['mcp', 'tool', toolName],
  });
};
```

### Step 5: Error Recovery Integration

Integrate error recovery into your API calls:

```typescript
// In your API handlers
import { defaultErrorRecovery } from './scripts/advanced-error-recovery';

const handleChatRequest = async (request: Request) => {
  return defaultErrorRecovery.executeWithRetry(
    async () => {
      // Your chat logic here
      return processChatRequest(request);
    },
    {
      maxAttempts: 3,
      baseDelayMs: 1000,
      maxDelayMs: 5000,
      jitterRatio: 0.1,
    }
  );
};

const handleMCPRequest = async (request: Request) => {
  return defaultErrorRecovery.executeWithCircuitBreaker('mcp-service', async () => {
    // Your MCP logic here
    return processMCPRequest(request);
  });
};
```

## Configuration

### Environment Variables

Add these environment variables to your configuration:

```bash
# Performance Dashboard
PERFORMANCE_DASHBOARD_ENABLED=true
PERFORMANCE_REFRESH_INTERVAL=1000
PERFORMANCE_MAX_METRICS=1000

# Advanced Caching
CACHE_ENABLED=true
CACHE_MAX_SIZE=1000
CACHE_DEFAULT_TTL=300000
CACHE_ENABLE_PERSISTENCE=true

# Advanced Security
SECURITY_ENABLED=true
SECURITY_THREAT_DETECTION=true
SECURITY_RATE_LIMITING=true
SECURITY_MAX_REQUEST_SIZE=1048576
SECURITY_RATE_LIMIT_WINDOW=60000
SECURITY_RATE_LIMIT_MAX_REQUESTS=100

# Error Recovery
ERROR_RECOVERY_ENABLED=true
ERROR_RECOVERY_MAX_ATTEMPTS=3
ERROR_RECOVERY_BASE_DELAY=1000
ERROR_RECOVERY_MAX_DELAY=5000
```

### Security Configuration

Customize security settings:

```typescript
const securityConfig = {
  enableThreatDetection: true,
  enableInputSanitization: true,
  enableRateLimiting: true,
  enableAccessControl: true,
  maxRequestSize: 1024 * 1024, // 1MB
  maxMessageLength: 2000,
  rateLimitWindowMs: 60000, // 1 minute
  rateLimitMaxRequests: 100,
  suspiciousActivityThreshold: 5,
  blockDurationMs: 300000, // 5 minutes
};

const securityManager = new AdvancedSecurityManager(securityConfig);
```

## Testing

### Run Integration Tests

```bash
# Run all tests
npm run test

# Run integration tests only
npm run test:integration

# Run tests with UI
npm run test:ui
```

### Test Coverage

The integration tests cover:

- Chat panel functionality
- Error recovery patterns
- Performance monitoring
- Caching strategies
- Security measures
- End-to-end workflows
- Error scenarios and edge cases

## Monitoring and Maintenance

### Performance Dashboard

Access the performance dashboard at `/performance-dashboard` to monitor:

- System health status
- Response times and percentiles
- Error rates and throughput
- Top operations and errors
- Real-time alerts

### Security Monitoring

Monitor security events:

```typescript
// Get security metrics
const metrics = securityManager.getSecurityMetrics();
console.log('Security Metrics:', metrics);

// Get recent security events
const events = securityManager.getSecurityEvents({
  severity: 'high',
  since: new Date(Date.now() - 3600000), // Last hour
  limit: 100,
});
console.log('Recent Security Events:', events);
```

### Cache Management

Monitor cache performance:

```typescript
// Get cache metrics
const chatMetrics = chatCache.getMetrics();
const mcpMetrics = mcpCache.getMetrics();
const analysisMetrics = analysisCache.getMetrics();

console.log('Cache Metrics:', {
  chat: chatMetrics,
  mcp: mcpMetrics,
  analysis: analysisMetrics,
});
```

## Troubleshooting

### Common Issues

1. **TypeScript Errors**: Ensure all imports are correct and types are properly defined
2. **Memory Issues**: Monitor cache sizes and adjust limits as needed
3. **Performance Issues**: Check rate limiting and adjust thresholds
4. **Security False Positives**: Review threat patterns and adjust sensitivity

### Debug Mode

Enable debug mode for detailed logging:

```typescript
const debugConfig = {
  enableDebugLogging: true,
  logLevel: 'debug',
  enablePerformanceLogging: true,
  enableSecurityLogging: true,
};
```

## Best Practices

1. **Regular Monitoring**: Check performance dashboard regularly
2. **Security Updates**: Keep threat patterns updated
3. **Cache Optimization**: Monitor cache hit rates and adjust TTLs
4. **Error Analysis**: Review error patterns and improve recovery
5. **Testing**: Run integration tests before deployments

## Support

For issues or questions:

1. Check the integration tests for examples
2. Review the performance dashboard for insights
3. Monitor security events for threats
4. Check cache metrics for optimization opportunities

The enhanced system provides comprehensive monitoring, security, and performance features to ensure your chatbot and MCP system operates at peak efficiency while maintaining security and reliability.
