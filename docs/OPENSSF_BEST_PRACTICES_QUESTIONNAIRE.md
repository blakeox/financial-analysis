# OpenSSF Best Practices — passing questionnaire cheat sheet

Copy/paste references while completing the [passing badge](https://www.bestpractices.dev/criteria/0) at [bestpractices.dev](https://www.bestpractices.dev/en/projects/new) for `https://github.com/blakeox/financial-analysis`.

**Project URL:** `https://github.com/blakeox/financial-analysis`  
**Homepage:** same (README is the primary description)  
**License:** MIT — [LICENSE](../LICENSE)  
**Release:** `v0.1.1` tag and [GitHub release](https://github.com/blakeox/financial-analysis/releases/tag/v0.1.1)

## Basics

| Criterion | Suggested answer | Evidence |
|-----------|------------------|----------|
| `description_good` | README describes lease/financial analysis, LLM/MCP, Cloudflare stack | [README.md](../README.md) |
| `interact` | README + CONTRIBUTING: clone, issues, PRs | README Quick Start, Contributing |
| `contribution` | Pull requests on GitHub; see CONTRIBUTING | [CONTRIBUTING.md](../CONTRIBUTING.md) |
| `contribution_requirements` | `pnpm run verify`, coding standards in AGENT.md | [AGENT.md](../AGENT.md), CONTRIBUTING |
| `floss_license` / `license_location` | MIT in repo root | [LICENSE](../LICENSE) |
| `documentation_basics` | N/A or point to README + `docs/` | Monorepo docs under `docs/` |
| `documentation_interface` | N/A or [docs/API.md](./API.md) | API worker + OpenAPI in repo |
| `sites_https` | GitHub HTTPS | — |
| `discussion` | GitHub Issues + PRs | — |
| `english` | Yes | — |
| `maintained` | Yes (recent commits, CI green) | Actions tab |

## Change control

| Criterion | Suggested answer | Evidence |
|-----------|------------------|----------|
| `repo_public` / `repo_track` / `repo_interim` | Public GitHub repo, git history | — |
| `repo_distributed` | git | — |
| `version_unique` | `v0.1.1` release | Releases page |
| `version_semver` | SemVer in package.json `0.1.1` | [package.json](../package.json) |
| `version_tags` | git tag `v0.1.1` | `git tag` |
| `release_notes` | N/A (continuous delivery to Cloudflare) **or** link release notes on v0.1.1 | GitHub release body |
| `release_notes_vulns` | N/A if no CVEs in that release | — |

## Reporting

| Criterion | Suggested answer | Evidence |
|-----------|------------------|----------|
| `report_process` / `report_tracker` / `report_archive` | GitHub Issues | — |
| `report_responses` | Yes (maintainer responds to issues) | Issues tab |
| `enhancement_responses` | Yes / partial | — |
| `vulnerability_report_process` | SECURITY.md | [SECURITY.md](../SECURITY.md) |
| `vulnerability_report_private` | GitHub Security Advisories | SECURITY.md link |
| `vulnerability_report_response` | N/A (no reports in last 6 months) or ≤14 days per policy | SECURITY.md timeline |

## Quality

| Criterion | Suggested answer | Evidence |
|-----------|------------------|----------|
| `build` | `pnpm install`, `pnpm run build:libs`, CI build | [ci.yml](../.github/workflows/ci.yml) |
| `build_common_tools` | pnpm, Node 22 | CONTRIBUTING |
| `build_floss_tools` | Yes | — |
| `test` | `pnpm run verify` / `pnpm test` | CONTRIBUTING, CI |
| `test_invocation` | `pnpm run test` (Vitest) | package.json scripts |
| `test_continuous_integration` | GitHub Actions on every PR | ci.yml |
| `test_policy` / `tests_are_added` | Tests required for engines/features | CONTRIBUTING, AGENTS.md |
| `tests_documented_added` | CONTRIBUTING step 4 | — |
| `warnings` | ESLint + TypeScript strict | eslint configs, tsconfig |
| `warnings_fixed` | No ESLint errors in CI (warnings only in api) | CI lint job |

## Security

| Criterion | Suggested answer | Evidence |
|-----------|------------------|----------|
| `know_secure_design` / `know_common_errors` | Maintainer attestation | — |
| `crypto_*` | N/A (no custom crypto; Workers TLS; `crypto.getRandomValues` for API keys) | [auth.ts](../workers/api/src/lib/auth.ts) |
| `delivery_mitm` | HTTPS (GitHub, Cloudflare) | — |
| `delivery_unsigned` | N/A | — |
| `vulnerabilities_fixed_60_days` | Dependabot + code scanning remediation | Security tab, #302–#316 |
| `vulnerabilities_critical_fixed` | Yes | — |
| `no_leaked_credentials` | Secret scan in CI; no secrets in repo | pull-request checks |

## Analysis

| Criterion | Suggested answer | Evidence |
|-----------|------------------|----------|
| `static_analysis` | CodeQL on PR/push | [codeql.yml](../.github/workflows/codeql.yml) |
| `static_analysis_common_vulnerabilities` | CodeQL security queries | — |
| `static_analysis_fixed` | Code scanning alerts remediated | [SECURITY_HYGIENE.md](./SECURITY_HYGIENE.md) |
| `static_analysis_often` | CodeQL on PR + weekly schedule | codeql.yml |
| `dynamic_analysis` | Playwright e2e (suggested) | [e2e-web workflow](../.github/workflows/e2e-web.yml) |

## After submit

1. Note **project ID** from the badge URL (`/projects/<ID>/`).
2. Add badge to README (see [OPENSSF_BEST_PRACTICES.md](./OPENSSF_BEST_PRACTICES.md)).
3. Request **passing** review on the site.
4. `gh workflow run "OpenSSF Scorecard" --ref main`
5. Dismiss stale `CIIBestPracticesID` on the Security tab if it does not auto-clear.
