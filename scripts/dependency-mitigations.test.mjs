import assert from 'node:assert/strict';
import { realpathSync } from 'node:fs';
import { createRequire } from 'node:module';
import { join } from 'node:path';
import test from 'node:test';
import { pathToFileURL } from 'node:url';

const thinkDirectory = realpathSync(
  new URL('../workers/api/node_modules/@cloudflare/think', import.meta.url)
);
const think = createRequire(join(thinkDirectory, 'package.json'));
const bash = createRequire(think.resolve('just-bash'));

test('the installed transitive formatter uses bounded precision', () => {
  const { sprintf } = bash('sprintf-js');
  assert.equal(sprintf('%.999f', 1), `1.${'0'.repeat(100)}`);
  assert.equal(sprintf('%.0g', 1.25), '1');
});

test('the existing Bash consumer retains normal output and handles invalid input', async () => {
  const { Bash } = await import(pathToFileURL(think.resolve('just-bash')).href);
  const shell = new Bash();
  const normal = await shell.exec("printf '%.2f' 1.25");
  assert.equal(normal.stdout, '1.25');
  assert.equal(normal.exitCode, 0);
  // Bash's own formatter rejects invalid precision with a bounded command error.
  // It must not abort the interpreter or break a subsequent valid command.
  const invalid = await shell.exec("printf '%.999f' 1.25");
  assert.equal(invalid.exitCode, 1);
  assert.ok(invalid.stderr.length < 200);
  const recovered = await shell.exec("printf '%s' healthy");
  assert.equal(recovered.exitCode, 0);
  assert.equal(recovered.stdout, 'healthy');
});
