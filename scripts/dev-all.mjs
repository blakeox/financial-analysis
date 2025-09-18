#!/usr/bin/env node
/* eslint-env node */
/* global console */
/**
 * Orchestrated dev startup:
 * 1. Build Astro site once (apps/web)
 * 2. Start web worker (serves static assets) and wait for ready
 * 3. Start API worker after web worker bound its port to avoid race
 * 4. Graceful shutdown on SIGINT/SIGTERM
 * 5. Optional debounce for rapid file change restarts (wrangler sometimes double-triggers)
 */
import { execSync, spawn } from 'node:child_process';
import net from 'node:net';
import process from 'node:process';
import { setTimeout as delay } from 'node:timers/promises';

// Root directory of repository (executed from root via package script)
const root = process.cwd();

function run(cmd, args, opts = {}) {
  const child = spawn(cmd, args, {
    stdio: 'inherit',
    cwd: opts.cwd || root,
    env: { ...process.env, FORCE_COLOR: '1' },
  });
  child.on('exit', (code, signal) => {
    if (code != null && code !== 0) {
      console.log(`Process ${cmd} exited with code ${code}`);
    } else if (signal) {
      console.log(`Process ${cmd} exited via signal ${signal}`);
    }
  });
  return child;
}

let webProc;
let apiProc;
let shuttingDown = false;

async function main() {
  console.log('\n[dev-all] Building Astro web app once...');
  const build = run('pnpm', ['--filter', '@financial-analysis/web', 'build']);
  await new Promise((res, rej) => {
    build.on('exit', (code) => (code === 0 ? res() : rej(new Error('Astro build failed'))));
  });
  console.log('[dev-all] Astro build complete. Starting web worker...');
  webProc = run('pnpm', ['--filter', '@financial-analysis/web-worker', 'dev']);
  // Give the web worker a moment to bind port
  await delay(1500);
  const preferred = 8787;
  await ensurePortFree(preferred);
  console.log(`[dev-all] Starting API worker on port ${preferred}...`);
  apiProc = startApi(preferred, preferred);

  // Handle restarts if needed in future (placeholder hook)
}

function startApi(port) {
  const args = [
    '--filter',
    '@financial-analysis/api',
    'exec',
    '--',
    'wrangler',
    'dev',
    '--port',
    String(port),
    '--local',
  ];
  const child = spawn('pnpm', args, { stdio: 'inherit', cwd: root, env: process.env });
  child.on('exit', (code) => {
    if (!shuttingDown && code !== 0) {
      console.log(`[dev-all] API worker exited (code ${code}). Not retrying automatically.`);
    }
  });
  return child;
}

async function ensurePortFree(port) {
  const isFree = await isPortFree(port);
  if (isFree) return;
  console.log(
    `[dev-all] Port ${port} appears in use; attempting to identify and terminate process (macOS).`
  );
  try {
    const output = execSync(`lsof -n -iTCP:${port} -sTCP:LISTEN -P | tail -n +2 || true`, {
      encoding: 'utf8',
    });
    if (!output.trim()) {
      console.log(
        '[dev-all] No listener found despite bind error (might be TIME_WAIT). Waiting briefly...'
      );
      await delay(1200);
      return;
    }
    const lines = output.trim().split('\n');
    for (const line of lines) {
      const parts = line.split(/\s+/);
      const pid = parts[1];
      if (pid && /^\d+$/.test(pid)) {
        try {
          process.kill(Number(pid), 'SIGINT');
          await delay(300);
          if (!(await isPortFree(port))) {
            process.kill(Number(pid), 'SIGKILL');
            await delay(300);
          }
          console.log(`[dev-all] Terminated process ${pid} on port ${port}.`);
        } catch (e) {
          console.log(`[dev-all] Could not terminate PID ${pid}: ${e.message}`);
        }
      }
    }
  } catch (err) {
    console.log('[dev-all] lsof not available or failed:', err.message);
  }
}

function isPortFree(port) {
  return new Promise((resolve) => {
    const tester = net
      .createServer()
      .once('error', () => resolve(false))
      .once('listening', () => tester.close(() => resolve(true)))
      .listen(port, '127.0.0.1');
  });
}

async function shutdown() {
  if (shuttingDown) return;
  shuttingDown = true;
  console.log('\n[dev-all] Shutting down...');
  for (const proc of [apiProc, webProc]) {
    if (proc && !proc.killed) proc.kill('SIGINT');
  }
  // small grace period
  await delay(300);
  process.exit(0);
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

main().catch((err) => {
  console.error('[dev-all] Failed to start:', err);
  shutdown();
});
