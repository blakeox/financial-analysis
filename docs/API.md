# Financial Analysis API Documentation

## Overview

The Financial Analysis API is built on Cloudflare Workers and provides endpoints for financial calculations, health monitoring, and MCP (Model Context Protocol) integration for AI-powered insights.

**Version:** v1.0.0
**Base URL:** `https://your-worker-url.workers.dev`

## Features

- ✅ CORS enabled for web app integration
- ✅ Security headers (CSP, X-Frame-Options, etc.)
- ✅ Rate limiting (100 requests/minute per IP)
- ✅ Input validation with Zod schemas
- ✅ Comprehensive error handling
- ✅ Request logging and monitoring
- ✅ API versioning (v1)
- ✅ Database integration (D1, KV, R2)

## Authentication

Currently, no authentication is required. Rate limiting is applied per IP address.

## Rate Limiting

- **Limit:** 100 requests per minute per IP address
- **Headers:** Standard rate limit headers included in 429 responses
- **Reset:** Automatic reset every minute

## Endpoints

### Health Check

Get the health status of the API.

**Endpoint:** `GET /health`

**Response (200):**

```json
{
  "status": "ok",
  "timestamp": "2023-12-01T12:00:00.000Z",
  "version": "v1",
  "environment": "production"
}
```

### MCP Server

Handle MCP protocol requests for AI integration.

**Endpoint:** `POST /mcp`

**Headers:**
```
Content-Type: application/json
```

**Request Body:**

```json
{
  "jsonrpc": "2.0",
  "id": "123",
  "method": "lease-analysis",
  "params": {
    "principal": 100000,
    "rate": 0.05,
    "term": 60
  }
}
```

**Response (200):**

```json
{
  "jsonrpc": "2.0",
  "id": "123",
  "result": {
    "monthlyPayment": 1910.46,
    "totalPayments": 114627.60,
    "totalInterest": 14627.60
  }
}
```

**Error Response (400/500):**

```json
{
  "jsonrpc": "2.0",
  "error": {
    "code": -32700,
    "message": "Parse error",
    "data": "Detailed error message"
  }
}
```

### Analysis API (v1)

Perform financial analysis calculations.

**Endpoint:** `GET /v1/api/analysis`

**Query Parameters:**
- `type` (optional): Analysis type (`lease`, `amortization`, `cashflow`)

**Example:** `GET /v1/api/analysis?type=lease`

**Response (200):**

```json
{
  "message": "Analysis API endpoint",
  "version": "v1",
  "environment": "production",
  "requestedType": "lease"
}
```

**Legacy Endpoint:** `GET /api/analysis` (redirects to v1)

### CORS Support

All endpoints support CORS for web app integration.

**Preflight Request:** `OPTIONS *`

**Allowed Methods:** GET, POST, PUT, DELETE, OPTIONS
**Allowed Headers:** Content-Type, Authorization
**Max Age:** 86400 seconds

## Error Responses

All endpoints return consistent error responses:

```json
{
  "error": {
    "message": "Error description",
    "code": "ERROR_CODE",
    "stack": "Stack trace (development only)"
  }
}
```

**Common Error Codes:**
- `RATE_LIMIT_EXCEEDED` (429): Too many requests
- `INTERNAL_ERROR` (500): Server error
- `VALIDATION_ERROR` (400): Invalid input

## Security Headers

- **Content Security Policy:** `default-src 'self'`
- **X-Frame-Options:** `DENY`
- **X-Content-Type-Options:** `nosniff`
- **X-XSS-Protection:** `1; mode=block`
- **Referrer-Policy:** `strict-origin-when-cross-origin`

## Database Schema

The API uses Cloudflare D1 for data persistence with the following tables:

- `analysis_cache` - Cached calculation results
- `user_sessions` - Session management
- `calculation_audit` - Audit log for calculations
- `api_metrics` - API usage metrics

## MCP Integration

The API includes MCP server functionality for seamless integration with AI models. The MCP protocol allows LLMs to perform financial analysis tasks through structured tool calls.

### Available MCP Tools

- Lease analysis tools
- Financial calculation tools
- Document processing tools

For detailed MCP tool specifications, refer to the tools package documentation.

## Development Setup

### Local Development

1. Copy `.env.example` to `.env.local`
2. Fill in your Cloudflare credentials
3. Run `pnpm run dev` in the workers/api directory

### Testing

Run tests with:

```bash
pnpm run test
```

### Deployment

Deploy to Cloudflare Workers:

```bash
# Deploy to production
pnpm run deploy:api

# Deploy to preview environment
npx wrangler deploy --dry-run
```

## Environment Variables

The worker requires the following environment variables:

- `DB`: D1 Database binding
- `SESSIONS`: KV Namespace for session storage
- `DOCUMENTS`: R2 Bucket for document storage
- `ENVIRONMENT`: Current environment (development/production)

## Monitoring & Logging

- Request/response logging to console
- Error tracking with stack traces (development only)
- Rate limiting metrics via KV storage
- Health check endpoint for monitoring systems
- Cloudflare Workers dashboard metrics
