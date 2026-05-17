#!/usr/bin/env node
/**
 * Apply branch protection from .github/branch-protection.json via GitHub REST API.
 * Requires: gh CLI authenticated with admin on the repo.
 *
 * Usage: node scripts/sync-branch-protection.mjs [--dry-run]
 */
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const dryRun = process.argv.includes('--dry-run');

const config = JSON.parse(
  readFileSync(join(root, '.github/branch-protection.json'), 'utf8')
);

const remoteUrl = execFileSync('git', ['remote', 'get-url', 'origin'], {
  encoding: 'utf8',
}).trim();
const match = remoteUrl.match(/github\.com[:/]([^/]+)\/([^/.]+)/);
if (!match) {
  console.error('Could not parse owner/repo from origin:', remoteUrl);
  process.exit(1);
}
const [, owner, repo] = match;

const body = {
  required_status_checks: {
    strict: config.required_status_checks.strict,
    checks: config.required_status_checks.contexts.map((context) => ({
      context,
    })),
  },
  enforce_admins: config.enforce_admins,
  required_pull_request_reviews: config.required_pull_request_reviews,
  restrictions: null,
  required_linear_history: config.required_linear_history,
  allow_force_pushes: config.allow_force_pushes,
  allow_deletions: config.allow_deletions,
};

for (const branch of config.branches) {
  const path = `/repos/${owner}/${repo}/branches/${branch}/protection`;
  console.log(`${dryRun ? '[dry-run] ' : ''}PUT ${path}`);
  console.log(JSON.stringify(body, null, 2));
  if (!dryRun) {
    execFileSync(
      'gh',
      ['api', '-X', 'PUT', path, '--input', '-'],
      { input: JSON.stringify(body), stdio: ['pipe', 'inherit', 'inherit'] }
    );
    console.log(`✓ ${branch}`);
  }
}

console.log('\nDone. Required checks:', config.required_status_checks.contexts.join(', '));
