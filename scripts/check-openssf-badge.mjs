#!/usr/bin/env node
/**
 * Query OpenSSF Best Practices for this repo's badge status.
 * Used before/after enrollment at https://www.bestpractices.dev/
 *
 * Usage: node scripts/check-openssf-badge.mjs [--json]
 */
import { execFileSync } from 'node:child_process';

const REPO_URL = 'https://github.com/blakeox/financial-analysis';
const SEARCH = 'financial-analysis';
const jsonOut = process.argv.includes('--json');

const remoteUrl = execFileSync('git', ['remote', 'get-url', 'origin'], {
  encoding: 'utf8',
}).trim();
const match = remoteUrl.match(/github\.com[:/]([^/]+)\/([^/.]+)/);
const repoSlug = match ? `${match[1]}/${match[2]}` : 'blakeox/financial-analysis';
const expectedRepoUrl = `https://github.com/${repoSlug}`;

const url = `https://www.bestpractices.dev/projects.json?pq=${encodeURIComponent(SEARCH)}`;
const res = await fetch(url);
if (!res.ok) {
  console.error(`Best Practices API error: ${res.status} ${res.statusText}`);
  process.exit(2);
}

const projects = await res.json();
const project = projects.find(
  (p) =>
    p.repo_url === expectedRepoUrl ||
    p.repo_url === REPO_URL ||
    (typeof p.repo_url === 'string' && p.repo_url.includes(repoSlug))
);

if (jsonOut) {
  console.log(JSON.stringify({ expectedRepoUrl, project: project ?? null }, null, 2));
  process.exit(project?.badge_level === 'passing' ||
    project?.badge_level === 'silver' ||
    project?.badge_level === 'gold'
    ? 0
    : 1);
}

if (!project) {
  console.log(`No Best Practices project found for ${expectedRepoUrl}.`);
  console.log('Enroll: https://www.bestpractices.dev/en/projects/new');
  console.log('Guide: docs/OPENSSF_BEST_PRACTICES.md');
  process.exit(1);
}

const level = project.badge_level ?? 'unknown';
console.log(`Project: ${project.name} (id=${project.id})`);
console.log(`Repo: ${project.repo_url}`);
console.log(`Badge level: ${level}`);

if (level === 'passing' || level === 'silver' || level === 'gold') {
  console.log(
    `Badge URL: https://www.bestpractices.dev/projects/${project.id}/badge`
  );
  process.exit(0);
}

console.log('Not yet at passing tier. Complete the questionnaire and request review.');
process.exit(1);
