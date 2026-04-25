import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from 'fs';
import { dirname, join } from 'path';
import { tmpdir } from 'os';
import { afterEach, describe, expect, it } from 'vitest';
import { findDuplicateBasenames } from '../../../scripts/check-test-layout.mjs';

const tempDirs: string[] = [];

function createTempTestTree(): string {
  const dir = mkdtempSync(join(tmpdir(), 'fa-test-layout-'));
  tempDirs.push(dir);
  return dir;
}

function writeTestFile(rootDir: string, relativePath: string, contents = 'test()') {
  const filePath = join(rootDir, relativePath);
  mkdirSync(dirname(filePath), { recursive: true });
  writeFileSync(filePath, contents);
}

afterEach(() => {
  while (tempDirs.length > 0) {
    const dir = tempDirs.pop();
    if (dir) {
      rmSync(dir, { recursive: true, force: true });
    }
  }
});

describe('check-test-layout', () => {
  it('returns no duplicates when basenames are unique', () => {
    const rootDir = createTempTestTree();
    writeTestFile(rootDir, 'tests/chat/chat-panel.spec.ts');
    writeTestFile(rootDir, 'tests/nav/nav.spec.ts');

    expect(findDuplicateBasenames(join(rootDir, 'tests'), rootDir)).toEqual([]);
  });

  it('reports duplicate basenames across different folders', () => {
    const rootDir = createTempTestTree();
    writeTestFile(rootDir, 'tests/chat/chat-panel.spec.ts', 'one');
    writeTestFile(rootDir, 'tests/legacy/chat-panel.spec.ts', 'two');

    expect(findDuplicateBasenames(join(rootDir, 'tests'), rootDir)).toEqual([
      {
        name: 'chat-panel.spec.ts',
        entries: [
          {
            path: 'tests/chat/chat-panel.spec.ts',
            hash: 'fe05bcdcdc4928012781a5f1a2a77cbb5398e106',
          },
          {
            path: 'tests/legacy/chat-panel.spec.ts',
            hash: 'ad782ecdac770fc6eb9a62e44f90873fb97fb26b',
          },
        ],
      },
    ]);
  });
});
