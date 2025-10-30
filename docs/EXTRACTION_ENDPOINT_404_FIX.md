# Extraction Endpoint 404 Error Fix

## Problem

When uploading a document for lease extraction, the request to `/v1/api/extract/lease-direct` returns a 404 error with an HTML page instead of the expected JSON response.

## Root Cause

The 404 HTML page shows it's coming from Astro's development server (custom 404 page), not the API worker. This means:

1. The request to `/v1/api/extract/lease-direct` is being handled by the Astro dev server (port 4321)
2. The web worker proxy (port 8788) is not running or not proxying correctly
3. OR the web worker is running but not forwarding `/v1/api/extract` routes

## Solution

### Check 1: Is the web worker running?

```bash
lsof -i :8788
```

If nothing is running on port 8788, start the web worker:

```bash
cd workers/web && pnpm dev
```

### Check 2: Is the API worker running?

```bash
lsof -i :8787
```

If nothing is running on port 8787, start the API worker:

```bash
cd workers/api && pnpm wrangler dev --port 8787 --local
```

### Check 3: Is the proxy configuration correct?

The web worker's `wrangler.toml` should have:

```toml
[vars]
ENVIRONMENT = "development"
API_DEV_ORIGIN = "http://localhost:8787"
```

And the web worker's `src/index.ts` should proxy `/v1/` routes to the API.

### Check 4: Are you accessing the correct URL?

**Correct:**
- `http://localhost:8788/commercial-real-estate-lease` (web worker - has proxy)

**Wrong:**
- `http://localhost:4321/commercial-real-estate-lease` (Astro dev server - no proxy)
- `http://localhost:8787/commercial-real-estate-lease` (API worker - no UI)

## Debug Steps

1. **Verify both workers are running:**
   ```bash
   lsof -i :8788  # Should show web worker
   lsof -i :8787  # Should show API worker
   ```

2. **Test the API endpoint directly:**
   ```bash
   curl -X POST http://localhost:8787/v1/api/extract/lease-direct \
     -H "Content-Type: application/json" \
     -d '{"test":"data"}'
   ```
   This should return JSON, not 404.

3. **Test through the web worker proxy:**
   ```bash
   curl -X POST http://localhost:8788/v1/api/extract/lease-direct \
     -H "Content-Type: application/json" \
     -d '{"test":"data"}'
   ```
   This should also return JSON.

4. **Check browser console:**
   - Open DevTools → Network tab
   - Upload a document
   - Look at the request URL
   - If it shows `localhost:4321`, you're on the wrong server
   - Should show `localhost:8788`

## Quick Fix

The easiest solution is to use the unified dev command:

```bash
pnpm run dev:all
```

This starts both workers correctly.

## Verification

After starting both workers, you should see:

1. API worker: `http://localhost:8787` - returns JSON for `/v1/*` routes
2. Web worker: `http://localhost:8788` - proxies API routes and serves UI
3. Document upload works on `http://localhost:8788/commercial-real-estate-lease`

## Endpoint Exists

The endpoint `/v1/api/extract/lease-direct` **does exist** in `workers/api/src/index.ts` at line 3097. The issue is that the request is hitting the wrong server.


