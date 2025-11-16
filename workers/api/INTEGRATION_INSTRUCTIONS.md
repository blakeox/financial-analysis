# Integration Instructions - Gold Standard Chat Route

## Quick Start (5 Minutes)

### Step 1: Register the New Routes

Add to `src/index.ts`:

```typescript
// Add import at top
import { registerEnhancedChatRoutes } from './routes/chat-v2';

// Add route registration after existing routes
registerHealthRoute(router);
registerAnalyticsRoutes(router);
registerMCPRoutes(router);
registerStorageRoutes(router);
registerDocumentRoutes(router);
registerAnalysisRoutes(router);
registerChatRoutes(router);  // Original chat routes
registerEnhancedChatRoutes(router);  // ✨ New gold standard routes
```

### Step 2: Test the New Endpoint

```bash
# Health check
curl https://your-api.com/api/v2/chat/health

# Test chat
curl -X POST https://your-api.com/api/v2/chat \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Hello, AI!"
  }'

# View metrics
curl https://your-api.com/api/v2/chat/metrics
```

### Step 3: Monitor Logs

Look for structured logs:
```json
{
  "level": "info",
  "requestId": "abc123",
  "message": "Chat request received",
  "environment": "production"
}
```

---

## Gradual Migration Strategy

### Phase 1: Run Both (Recommended)

Keep both routes running simultaneously:

```typescript
// Old route (v1) - backward compatible
router.post('/api/v1/chat/enhanced', oldChatHandler);

// New route (v2) - gold standard
router.post('/api/v2/chat', newChatHandler);
```

**Benefits**:
- No breaking changes
- Test in production with real traffic
- Easy rollback if issues found

### Phase 2: Migrate Traffic

Update client code gradually:

```typescript
// Frontend/client update
const API_VERSION = process.env.CHAT_API_VERSION || 'v2';
const chatEndpoint = `/api/${API_VERSION}/chat`;
```

Monitor metrics to ensure v2 is stable before switching.

### Phase 3: Deprecate Old Route

After v2 is proven stable:

```typescript
// Add deprecation warning to v1
router.post('/api/v1/chat/enhanced', (request, env) => {
  console.warn('v1 chat endpoint is deprecated. Use /api/v2/chat');
  return oldChatHandler(request, env);
});
```

### Phase 4: Remove Old Route

After transition period (e.g., 30 days):

```typescript
// Remove old route
// router.post('/api/v1/chat/enhanced', oldChatHandler);  // Removed
```

---

## Testing in Different Environments

### Local Development

```typescript
// wrangler.toml or .dev.vars
ENVIRONMENT=development
WORKERS_AI_MODEL=@cf/meta/llama-3-8b-instruct
```

```bash
npm run dev

# Test locally
curl -X POST http://localhost:8787/api/v2/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "test"}'
```

### Staging

```bash
# Deploy to staging
wrangler deploy --env staging

# Test staging
curl -X POST https://staging-api.example.com/api/v2/chat \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $STAGING_API_KEY" \
  -d '{"message": "test"}'
```

### Production

```bash
# Deploy to production
wrangler deploy --env production

# Smoke test
curl -X POST https://api.example.com/api/v2/chat/health
```

---

## Configuration Required

### Environment Variables

Ensure these are set in your wrangler.toml or Cloudflare dashboard:

```toml
[env.production]
vars = { 
  ENVIRONMENT = "production",
  WORKERS_AI_MODEL = "@cf/meta/llama-3-8b-instruct",
  ANALYSIS_CACHE_TTL_SECONDS = "3600",
  ANALYSIS_MAX_JSON_BYTES = "102400"
}

[env.production.ai]
binding = "AI"

[env.production.kv_namespaces]
binding = "KV"
id = "your-kv-id"

[env.production.analytics_engine_datasets]
binding = "ANALYTICS"
dataset = "your-analytics-dataset"
```

### Verify Configuration

```bash
# Check health endpoint includes configuration
curl https://api.example.com/api/v2/chat/health | jq

# Expected output
{
  "status": "healthy",
  "services": {
    "ai": true,
    "cache": true,
    "analytics": true
  },
  "configuration": {
    "model": "@cf/meta/llama-3-8b-instruct",
    "cacheEnabled": true,
    "environment": "production"
  },
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

---

## Monitoring & Alerting

### Key Metrics to Monitor

1. **Error Rate**
   ```
   Alert if error_rate > 1% for 5 minutes
   ```

2. **Response Time**
   ```
   Alert if p95_latency > 5000ms for 5 minutes
   ```

3. **AI Service Availability**
   ```
   Alert if ai_errors > 10 in 1 minute
   ```

4. **Cache Hit Rate**
   ```
   Info if cache_hit_rate < 30%
   ```

### Cloudflare Analytics Query

```sql
SELECT
  COUNT(*) as total_requests,
  SUM(CASE WHEN blob3 = 'success' THEN 1 ELSE 0 END) as successful,
  SUM(CASE WHEN blob3 = 'error' THEN 1 ELSE 0 END) as errors,
  AVG(double1) as avg_processing_time
FROM analytics_dataset
WHERE blob2 = 'chat'
  AND timestamp > NOW() - INTERVAL '1 hour'
```

### Log Queries

Find errors:
```bash
wrangler tail --env production | grep "level.*error"
```

Find slow requests:
```bash
wrangler tail --env production | grep "processingTimeMs" | \
  awk '$NF > 5000'  # Requests over 5 seconds
```

---

## Rollback Plan

If issues occur:

### Quick Rollback

```typescript
// In index.ts, comment out new routes
// registerEnhancedChatRoutes(router);  // Disabled temporarily

// Ensure old routes are active
registerChatRoutes(router);  // Using v1
```

```bash
# Redeploy
wrangler deploy --env production
```

### Gradual Rollback

```typescript
// Route based on feature flag
const USE_V2_CHAT = env.USE_V2_CHAT === 'true';

if (USE_V2_CHAT) {
  registerEnhancedChatRoutes(router);
} else {
  registerChatRoutes(router);
}
```

Update environment variable:
```bash
wrangler secret put USE_V2_CHAT --env production
# Enter: false
```

---

## Troubleshooting

### Issue: Configuration Validation Fails

**Error**: `ConfigurationError: Environment configuration validation failed`

**Solution**: Check wrangler.toml has all required bindings:
```bash
# Verify bindings
wrangler deployments list --env production

# Check environment variables
curl https://api.example.com/api/v2/chat/health
```

### Issue: AI Service Unavailable

**Error**: `ServiceUnavailableError: AI service is not available`

**Solution**: Verify AI binding is configured:
```toml
[env.production.ai]
binding = "AI"
```

### Issue: High Error Rate

**Check**:
1. View logs: `wrangler tail --env production`
2. Check metrics: `curl /api/v2/chat/metrics`
3. Test health: `curl /api/v2/chat/health`

**Common Causes**:
- AI service outage
- Configuration issue
- Rate limiting triggered
- Invalid requests from clients

---

## Performance Optimization

### Enable Caching

```typescript
// Configuration
const config = createAppConfig(env);

// Cache is automatically used if KV binding exists
console.log('Cache enabled:', config.hasService('kv'));
```

### Optimize AI Calls

```typescript
// Use AI Gateway for caching and rate limiting
// In wrangler.toml:
[env.production.vars]
AI_GATEWAY_ID = "your-gateway-id"
```

### Monitor Cache Hit Rate

```bash
# Check metrics endpoint
curl https://api.example.com/api/v2/chat/metrics | \
  jq '.cacheHitRate'
```

---

## Security Checklist

Before production deployment:

- [ ] API keys/auth configured
- [ ] Rate limiting enabled
- [ ] Request size limits set
- [ ] CORS headers configured
- [ ] Security headers enabled
- [ ] Threat detection active
- [ ] Logging sanitizes sensitive data
- [ ] Error messages don't leak internals

### Test Security

```bash
# Test request size limit
curl -X POST https://api.example.com/api/v2/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "'$(head -c 10000 < /dev/urandom | base64)'"}'
# Should return 413 Payload Too Large

# Test validation
curl -X POST https://api.example.com/api/v2/chat \
  -H "Content-Type: application/json" \
  -d '{}'
# Should return 400 Validation Error
```

---

## Success Criteria

The migration is successful when:

1. ✅ V2 endpoint handles >80% of traffic
2. ✅ Error rate < 0.1%
3. ✅ P95 latency < 2 seconds
4. ✅ Cache hit rate > 40%
5. ✅ No configuration errors
6. ✅ Metrics are being recorded
7. ✅ Logs are structured and searchable
8. ✅ Health check shows all services healthy

---

## Next Steps

Once Chat V2 is stable:

1. **Apply patterns to other routes**
   - Use as template for analysis routes
   - Refactor storage routes
   - Update MCP routes

2. **Add more metrics**
   - Business metrics (queries by type)
   - User behavior metrics
   - Cost tracking

3. **Enhance monitoring**
   - Set up dashboards
   - Configure alerts
   - Create runbooks

4. **Optimize performance**
   - Fine-tune caching
   - Optimize AI prompts
   - Implement request batching

---

## Support

If you encounter issues:

1. **Check Documentation**
   - `GOLD_STANDARD_ROUTE.md` - Complete guide
   - `BEST_PRACTICES_ROADMAP.md` - All patterns
   - `IMPLEMENTATION_GUIDE.md` - Step-by-step

2. **Review Logs**
   ```bash
   wrangler tail --env production --format pretty
   ```

3. **Test Health**
   ```bash
   curl /api/v2/chat/health
   curl /api/v2/chat/metrics
   ```

4. **Rollback if Needed**
   - Follow rollback plan above
   - Investigate in non-production

---

## Conclusion

You now have:
- ✅ Gold standard route implementation
- ✅ Comprehensive testing
- ✅ Complete documentation
- ✅ Clear integration path
- ✅ Rollback plan
- ✅ Monitoring setup

**The route is production-ready!** 🚀

Deploy with confidence and use as a template for future routes.







