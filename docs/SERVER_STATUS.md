# Server Status

## ✅ Current Status

Both workers are running:

1. **API Worker** - Port 8787
   - Process: PID 54273
   - Status: Running
   - Endpoint: `http://localhost:8787`

2. **Web Worker** - Port 8788  
   - Process: PID 26812
   - Status: Running
   - Endpoint: `http://localhost:8788`

## 🎯 Access URLs

Use these URLs to access the application:

### Main Application (Web Worker - Recommended)
- **Commercial Lease Analysis**: `http://localhost:8788/commercial-real-estate-lease`
- **Home Page**: `http://localhost:8788`

### API Direct (API Worker - For Testing)
- **API Health**: `http://localhost:8787/health`
- **API Docs**: `http://localhost:8787/docs`

## ⚠️ Important Notes

### Use Port 8788 (Web Worker)
The web worker on port 8788 is the correct entry point because it:
- Proxies API requests to the API worker
- Serves the UI
- Handles CORS correctly

### Don't Use Port 4321
Port 4321 is the Astro dev server which:
- Does NOT proxy API requests
- Will show 404 errors for `/v1/api/*` endpoints
- Not the correct entry point

## 🔧 Troubleshooting

If you see 404 errors for API endpoints:

1. Check both workers are running:
   ```bash
   lsof -i :8788  # Web worker
   lsof -i :8787  # API worker
   ```

2. Verify API endpoint exists:
   ```bash
   curl http://localhost:8787/v1/api/extract/lease-direct
   ```

3. Check through web worker proxy:
   ```bash
   curl http://localhost:8788/v1/api/extract/lease-direct
   ```

4. Restart if needed:
   ```bash
   # Kill all wrangler processes
   killall -9 wrangler
   
   # Restart both workers
   pnpm run dev:all
   ```

## 📝 Recent Changes

- Fixed TypeScript build error in `LeaseAnalysisDashboard.tsx`
- Added type assertion for `extractedData`
- Auto-apply extraction data to form without manual button click
- Fixed upload UI resetting issue
- Added success feedback banner

## ✅ Ready to Test

You can now upload documents and extract lease data at:
**`http://localhost:8788/commercial-real-estate-lease`**






