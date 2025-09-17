#!/usr/bin/env node
/* eslint-env node */
/* global console */
// Simple smoke test for local dev servers (Node 18+)
import { performance } from 'node:perf_hooks';
import { fetch as undiciFetch } from 'undici';

const fetchFn = globalThis.fetch || undiciFetch;

const targets = [
  { name: 'API', url: 'http://localhost:8787/health' },
  { name: 'WEB', url: 'http://localhost:8788/' },
];

function now() { return performance.now(); }

async function check({ name, url }) {
  const start = now();
  try {
  const res = await fetchFn(url, { redirect: 'manual' });
    const ms = Math.round(now() - start);
    const ok = res.ok;
    const status = res.status;
    let info = '';
    try {
      const ct = res.headers.get('content-type') || '';
      if (ct.includes('application/json')) {
        const json = await res.clone().json().catch(() => undefined);
        if (json && json.status) info = ` status=${json.status}`;
      }
    } catch (err) {
      void err; // ignore parse errors
    }
    console.log(`${name.padEnd(3)} ${ok ? 'OK ' : 'ERR'} ${status} ${ms}ms${info}`);
  } catch (e) {
    const ms = Math.round(now() - start);
    console.log(`${name.padEnd(3)} ERR - ${e?.message || e} ${ms}ms`);
  }
}

(async () => {
  await Promise.all(targets.map(check));
})();
