---
'@financial-analysis/api': minor
---

# Add /docs route (RapiDoc)

Add /docs endpoint to the API Worker providing an embedded RapiDoc UI with a strict Content Security Policy. Also documents the route in docs/API.md.

- New: GET /docs renders RapiDoc pointing to /openapi.json
- Security: tight CSP allowing only self + unpkg script for RapiDoc
- Docs: updated API docs with usage notes
