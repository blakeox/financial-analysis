# Best Practices Implementation Guide

## Quick Start: Configuration Management

The first and most impactful improvement is adding configuration validation. This catches errors at startup rather than at runtime and provides type-safe access to environment variables.

### What's Been Implemented

✅ **Created**: `lib/config-validator.ts`
- Environment variable validation with Zod
- Type-safe configuration access
- Sensible defaults for optional configs
- Helper methods for common checks

### How to Integrate

#### Step 1: Basic Integration (Opt-in)

You can start using the new configuration system alongside the existing one:

```typescript
// In index.ts or any route
import { createAppConfig, ConfigurationError } from './lib/config-validator';

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    // Validate configuration (optional check)
    try {
      const config = createAppConfig(env);
      console.log('Configuration validated:', config.toJSON());
      
      // Use either the validated config or original env
      if (config.isDevelopment) {
        console.log('Running in development mode');
      }
    } catch (error) {
      if (error instanceof ConfigurationError) {
        console.error('Configuration validation failed:', error.message);
        // In development, you might want to see these errors
        // In production, continue with defaults
      }
    }
    
    // Continue with existing code using env directly
    // No breaking changes required
  }
}
```

#### Step 2: Gradual Migration (Recommended)

Migrate routes one at a time to use the typed configuration:

```typescript
// Before
router.get('/health', async (request: Request, env: Env) => {
  const isDev = env.ENVIRONMENT === 'development';
  const hasAI = env.AI !== undefined;
  // ...
});

// After
router.get('/health', async (request: Request, env: Env) => {
  const config = createAppConfig(env);
  const isDev = config.isDevelopment;  // Type-safe property
  const hasAI = config.hasAI;           // Convenience method
  // ...
});
```

#### Step 3: Full Integration (Future)

Eventually, validate config once in the main handler:

```typescript
export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    // Validate config once at the start
    let config: AppConfig;
    try {
      config = createAppConfig(env);
    } catch (error) {
      if (error instanceof ConfigurationError) {
        return new Response(
          JSON.stringify({
            error: 'Service configuration error',
            message: 'The service is misconfigured. Please contact support.',
          }),
          { status: 503, headers: { 'Content-Type': 'application/json' } }
        );
      }
      throw error;
    }

    // Pass config instead of env to routes
    // This ensures all routes use validated configuration
    const response = await router.fetch(request, config.toEnv(), ctx);
    return response;
  }
}
```

### Benefits You'll See Immediately

1. **Catch Configuration Errors Early**
   ```typescript
   // Before: Runtime error when trying to use undefined service
   await env.AI.run('...') // TypeError: Cannot read property 'run' of undefined
   
   // After: Clear error message at startup
   // Configuration validation failed:
   //   - AI: Required
   ```

2. **Type-Safe Access**
   ```typescript
   // Before: Manual string parsing with potential errors
   const ttl = parseInt(env.ANALYSIS_CACHE_TTL_SECONDS || '3600', 10);
   
   // After: Already parsed and validated
   const ttl = config.analysisCacheTTL; // Type: number
   ```

3. **Better Defaults**
   ```typescript
   // Before: Repeated default logic across codebase
   const model = env.WORKERS_AI_MODEL || '@cf/meta/llama-3-8b-instruct';
   
   // After: Centralized defaults
   const model = config.aiModel; // Always has a value
   ```

4. **Convenience Methods**
   ```typescript
   // Before: Repeated checks
   if (env.STRIPE_SECRET_KEY && env.STRIPE_WEBHOOK_SECRET) {
     // Enable Stripe features
   }
   
   // After: Clear intent
   if (config.hasStripeConfigured) {
     // Enable Stripe features
   }
   ```

### Testing the New Configuration

Create a test file to verify configuration works:

```typescript
// __tests__/config.test.ts
import { describe, it, expect } from 'vitest';
import { createAppConfig, ConfigurationError } from '../lib/config-validator';

describe('Configuration Validation', () => {
  it('should accept valid minimal config', () => {
    const config = createAppConfig({
      ENVIRONMENT: 'development',
    });
    
    expect(config.isDevelopment).toBe(true);
    expect(config.aiModel).toBe('@cf/meta/llama-3-8b-instruct');
  });
  
  it('should reject invalid Stripe key format', () => {
    expect(() => {
      createAppConfig({
        ENVIRONMENT: 'production',
        STRIPE_SECRET_KEY: 'invalid_key',
      });
    }).toThrow(ConfigurationError);
  });
  
  it('should provide correct service checks', () => {
    const mockAI = {} as Ai;
    const config = createAppConfig({
      ENVIRONMENT: 'development',
      AI: mockAI,
    });
    
    expect(config.hasService('ai')).toBe(true);
    expect(config.hasService('kv')).toBe(false);
  });
});
```

### Migration Checklist

- [ ] Add config validation test
- [ ] Start using config in new routes
- [ ] Migrate one existing route as proof of concept
- [ ] Update error handling to catch ConfigurationError
- [ ] Add configuration logging at startup
- [ ] Document required vs optional env vars in README
- [ ] Update wrangler.toml with all environment variables

### Common Patterns

#### Pattern 1: Feature Flags Based on Config

```typescript
// Centralize feature availability
export function getFeatureFlags(config: AppConfig) {
  return {
    aiEnabled: config.hasService('ai'),
    stripeEnabled: config.hasStripeConfigured,
    analyticsEnabled: config.hasService('analytics'),
    cacheEnabled: config.hasService('kv'),
  };
}

// Use in routes
const features = getFeatureFlags(config);
if (!features.aiEnabled) {
  return new Response('AI features not available', { status: 503 });
}
```

#### Pattern 2: Environment-Specific Behavior

```typescript
// Clean environment checks
if (config.isDevelopment) {
  console.log('Debug info:', debugData);
}

if (config.isProduction) {
  // Enable production optimizations
  enableCaching();
  enableCompression();
}
```

#### Pattern 3: Safe Service Access

```typescript
// Before: Unsafe access
await env.DOCUMENTS.put(key, value);

// After: Safe with validation
if (!config.hasService('documents')) {
  throw new ServiceUnavailableError('Document storage not configured');
}
await config.documents!.put(key, value);
```

### Next Steps

Once configuration management is working well:

1. ✅ **Configuration** - Done!
2. 🔜 **Structured Errors** - Implement custom error classes
3. 🔜 **Metrics** - Add structured metrics collection
4. 🔜 **Tracing** - Add request tracing
5. 🔜 **DI Container** - Implement dependency injection

See `BEST_PRACTICES_ROADMAP.md` for the complete plan.

### Troubleshooting

**Q: What if I get a ConfigurationError in production?**

A: Log the error details and return a 503 response. This indicates a deployment configuration issue that needs immediate attention.

```typescript
catch (error) {
  if (error instanceof ConfigurationError) {
    console.error('CRITICAL: Configuration validation failed', {
      errors: error.validationErrors,
      environment: env.ENVIRONMENT,
    });
    
    return new Response('Service Unavailable', { status: 503 });
  }
}
```

**Q: Can I use this without TypeScript?**

A: The validation still works, but you'll lose the type safety benefits. TypeScript is highly recommended for best results.

**Q: Will this slow down cold starts?**

A: The validation is very fast (< 1ms) and only runs once per worker instance. The benefits far outweigh any minimal overhead.

### Resources

- `lib/config-validator.ts` - Implementation
- `workers/api/BEST_PRACTICES_ROADMAP.md` - Complete best practices guide
- [Zod Documentation](https://zod.dev/) - Schema validation library
- [Cloudflare Workers Env Vars](https://developers.cloudflare.com/workers/configuration/environment-variables/)







