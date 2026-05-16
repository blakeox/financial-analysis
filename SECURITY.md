# Security Policy

## Supported Versions

Security fixes are applied to the active development branch and the latest release on `main`.

| Branch | Supported |
| ------ | --------- |
| `main` | Yes       |
| `dev`  | Yes       |
| Other  | No        |

## Reporting a Vulnerability

**Please do not open public GitHub issues for security vulnerabilities.**

Report vulnerabilities privately using one of these channels:

1. **GitHub Security Advisories (preferred)**  
   [Create a private security advisory](https://github.com/blakeox/financial-analysis/security/advisories/new)

2. **GitHub Security Issue template**  
   Use only if you cannot access Security Advisories. Avoid including exploit details in the issue body.

### What to Include

- Description of the vulnerability and affected components
- Steps to reproduce or proof of concept (if available)
- Potential impact (data exposure, auth bypass, RCE, etc.)
- Suggested remediation, if known

### Response Timeline

| Stage              | Target        |
| ------------------ | ------------- |
| Initial acknowledgment | 3 business days |
| Triage & severity assessment | 7 business days |
| Fix or mitigation plan | Depends on severity |

We will coordinate disclosure with you after a fix is available.

## Security Practices for Contributors

- Never commit secrets, API keys, or production credentials
- Use `.env.example` files as templates only; keep real values in Wrangler secrets or CI secrets
- Run `pnpm install` with lockfile integrity (`pnpm install --frozen-lockfile` in CI)
- Report dependency vulnerabilities via Dependabot PRs or private advisory

See [CONTRIBUTING.md](./CONTRIBUTING.md#security--privacy) for additional project security guidelines.
