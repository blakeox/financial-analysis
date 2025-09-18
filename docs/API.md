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

### OpenAPI Spec

Get the OpenAPI v3.0.3 JSON document that describes this API.

**Endpoint:** `GET /openapi.json`

**Response (200):**

Content-Type: application/json; body is a standard OpenAPI document including servers, paths, and schemas.

You can import this URL into tools like Postman, Insomnia, or ReDoc.

### Interactive API Docs

A built-in documentation UI is available, powered by RapiDoc. It loads the OpenAPI spec from `/openapi.json` and renders interactive docs.

**Endpoint:** `GET /docs`

Notes:

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

### Request IDs

Every response includes an `X-Request-ID` header for traceability. Include this value when reporting issues.

### MCP Endpoint

Programmatic MCP access is exposed at `POST /mcp` using JSON-RPC 2.0.

Examples:

- Initialize:

  { "jsonrpc": "2.0", "id": 1, "method": "initialize" }

- List tools:

  { "jsonrpc": "2.0", "id": 2, "method": "tools/list" }

- Call tool:

  ```json
  {
    "jsonrpc": "2.0",
    "id": 3,
    "method": "tools/call",
    "params": {
      "name": "analyze_lease",
      "arguments": {
        "principal": 10000,
        "annualRate": 0.05,
        "termMonths": 12,
        "residualValue": 1000
      }
    }
  }
  ```

- Call amortization tool:

  ```json
  {
    "jsonrpc": "2.0",
    "id": 4,
    "method": "tools/call",
    "params": {
      "name": "analyze_amortization",
      "arguments": { "principal": 250000, "annualRate": 0.045, "termMonths": 360 }
    }
  }
  ```

## Analysis Endpoints

### POST /v1/api/analysis/lease

Analyze a lease agreement and return payment schedule and summary metrics.

Request body (application/json):

- principal: number (positive) — Principal amount
- annualRate: number (0-1) — Annual interest rate as a decimal
- termMonths: integer (positive) — Lease term in months
- residualValue: number (>=0, default 0) — Residual value at end of term

Example:

{
"principal": 10000,
"annualRate": 0.06,
"termMonths": 12,
"residualValue": 1000
}

Response 200 (application/json):

{
"monthlyPayment": 450.12,
"totalPayments": 5401.44,
"totalInterest": 401.44,
"schedule": [
{ "month": 1, "payment": 450.12, "principal": 400.00, "interest": 50.12, "balance": 9600.00 },
// ... per-month schedule entries
]
}

Errors:

- 400 — Invalid request body (returns issues array)
- 415 — Unsupported Media Type (Content-Type must be application/json)

### POST /v1/api/analysis/amortization

Analyze an amortization schedule and return payment breakdown and summary metrics.

Request body (application/json):

- principal: number (positive) — Principal amount
- annualRate: number (0-1) — Annual interest rate as a decimal
- termMonths: integer (positive) — Amortization term in months

Example:

```json
{
  "principal": 250000,
  "annualRate": 0.045,
  "termMonths": 360
}
```

Response 200 (application/json):

```json
{
  "monthlyPayment": 1266.71,
  "totalPayments": 456015.6,
  "totalInterest": 206015.6,
  "schedule": [
    {
      "month": 1,
      "payment": 1266.71,
      "principal": 329.21,
      "interest": 937.5,
      "balance": 249670.79
    },
    {
      "month": 2,
      "payment": 1266.71,
      "principal": 330.44,
      "interest": 936.27,
      "balance": 249340.35
    }
    // ... per-month schedule entries
  ]
}
```

Errors:

- 400 — Invalid request body (returns issues array)
- 415 — Unsupported Media Type (Content-Type must be application/json)

### MCP Server

Handle MCP protocol requests for AI integration.

**Endpoint:** `POST /mcp`

**Headers:**

```http
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
    "totalPayments": 114627.6,
    "totalInterest": 14627.6
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

- **analyze_lease** - Lease analysis calculations
- **analyze_amortization** - Amortization schedule calculations
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
