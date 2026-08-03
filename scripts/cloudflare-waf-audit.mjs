#!/usr/bin/env node

/**
 * Read-only audit of the zone WAF phase entrypoints.
 *
 * This intentionally never creates or updates rulesets. A WAF write token is a
 * separate operational authority and must be used only by an approved change.
 */

const token = process.env.CLOUDFLARE_API_TOKEN?.trim();
const zoneId = process.env.CLOUDFLARE_ZONE_ID?.trim();
const apiBase = (
  process.env.CLOUDFLARE_API_BASE_URL || 'https://api.cloudflare.com/client/v4'
).replace(/\/$/, '');

if (!token || !zoneId) {
  console.error(
    'CLOUDFLARE_API_TOKEN and CLOUDFLARE_ZONE_ID are required in the process environment.'
  );
  process.exit(2);
}

const phases = ['http_request_firewall_managed', 'http_request_firewall_custom', 'http_ratelimit'];
const startedAt = new Date().toISOString();

async function readPhase(phase) {
  const response = await fetch(
    `${apiBase}/zones/${encodeURIComponent(zoneId)}/rulesets/phases/${phase}/entrypoint`,
    {
      headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
      signal: AbortSignal.timeout(15_000),
    }
  );

  if (response.status === 404) {
    return { phase, status: 404, configured: false, rules: 0 };
  }
  if (!response.ok) {
    throw new Error(`Cloudflare WAF audit request failed for ${phase}: HTTP ${response.status}`);
  }

  const body = await response.json();
  if (body?.success !== true || typeof body.result !== 'object' || body.result === null) {
    throw new Error(`Cloudflare WAF audit returned an invalid response for ${phase}`);
  }

  const rules = Array.isArray(body.result.rules) ? body.result.rules : [];
  return {
    phase,
    status: response.status,
    configured: true,
    rules: rules.length,
    ruleIds: rules.map((rule) => rule?.id).filter((id) => typeof id === 'string'),
  };
}

const checks = [];
for (const phase of phases) {
  checks.push(await readPhase(phase));
}

console.log(
  JSON.stringify(
    {
      schemaVersion: '1.0.0',
      kind: 'cloudflare-waf-audit',
      generatedAt: new Date().toISOString(),
      startedAt,
      zoneId,
      readOnly: true,
      passed: checks.every((check) => check.status === 200 || check.status === 404),
      checks,
    },
    null,
    2
  )
);
