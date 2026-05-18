#!/usr/bin/env node
/**
 * Apply GitHub Actions repository settings via REST API (gh cli).
 * Requires: gh authenticated with repo admin access.
 *
 * Usage:
 *   node scripts/configure-github-actions-settings.mjs
 *   node scripts/configure-github-actions-settings.mjs --dry-run
 *
 * Not configurable via API (use GitHub UI):
 *   Settings → Actions → "Run workflows from Dependabot pull requests"
 */
import { execFileSync } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const dryRun = process.argv.includes('--dry-run');

const remoteUrl = execFileSync('git', ['remote', 'get-url', 'origin'], {
  encoding: 'utf8',
  cwd: root,
}).trim();
const match = remoteUrl.match(/github\.com[:/]([^/]+)\/([^/.]+)/);
if (!match) {
  console.error('Could not parse owner/repo from origin:', remoteUrl);
  process.exit(1);
}
const [, owner, repo] = match;
const apiBase = `repos/${owner}/${repo}/actions/permissions`;

function ghApi(method, path, body) {
  const args = ['api', '-X', method, path];
  if (body) {
    for (const [key, value] of Object.entries(body)) {
      if (typeof value === 'boolean') {
        args.push('-F', `${key}=${value}`);
      } else {
        args.push('-f', `${key}=${value}`);
      }
    }
  }
  console.log(`${dryRun ? '[dry-run] ' : ''}${method} ${path}`, body ?? '');
  if (dryRun) return null;
  const out = execFileSync('gh', args, { encoding: 'utf8' });
  return out ? JSON.parse(out) : null;
}

function ghGet(path) {
  console.log(`GET ${path}`);
  if (dryRun) return null;
  return JSON.parse(execFileSync('gh', ['api', path], { encoding: 'utf8' }));
}

console.log(`Repository: ${owner}/${repo}\n`);

const actions = ghGet(apiBase);
console.log('Current Actions permissions:', JSON.stringify(actions, null, 2));

ghApi('PUT', apiBase, {
  enabled: true,
  allowed_actions: 'all',
  sha_pinning_required: false,
});

const workflow = ghGet(`${apiBase}/workflow`);
console.log('Current workflow permissions:', JSON.stringify(workflow, null, 2));

ghApi('PUT', `${apiBase}/workflow`, {
  default_workflow_permissions: 'write',
  can_approve_pull_request_reviews: false,
});

const forkApproval = ghGet(`${apiBase}/fork-pr-contributor-approval`);
console.log('Current fork PR approval:', JSON.stringify(forkApproval, null, 2));

ghApi('PUT', `${apiBase}/fork-pr-contributor-approval`, {
  approval_policy: 'first_time_contributors',
});

console.log('\nApplied (or dry-run) settings:');
console.log('  - Actions: enabled, allow all actions, SHA pinning off');
console.log('  - Workflow token: read/write, bot PR approval off');
console.log('  - Fork PRs: require approval for first-time contributors');
console.log('\nManual UI only: enable "Run workflows from Dependabot pull requests"');
console.log(`  https://github.com/${owner}/${repo}/settings/actions`);
