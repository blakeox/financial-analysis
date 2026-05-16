import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from 'fs';
import { dirname, join } from 'path';
import { tmpdir } from 'os';
import { afterEach, describe, expect, it } from 'vitest';
import {
  findDuplicateBasenames,
  findForbiddenDuplicateModules,
  findIdenticalContent,
} from '../../../scripts/check-test-layout.mjs';

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

  it('reports forbidden legacy duplicate modules', () => {
    const rootDir = createTempTestTree();
    writeTestFile(rootDir, 'tests/_shared/nav.ts', 'export const nav = 1;');
    writeTestFile(rootDir, 'tests/utils/nav.ts', 'export const nav = 1;');

    expect(findForbiddenDuplicateModules(rootDir)).toEqual([
      { canonical: 'tests/_shared/nav.ts', legacy: 'tests/utils/nav.ts' },
    ]);
  });

  it('reports identical file content under tests/', () => {
    const rootDir = createTempTestTree();
    const body = 'export const helper = true;';
    writeTestFile(rootDir, 'tests/_shared/helper.ts', body);
    writeTestFile(rootDir, 'tests/legacy/helper.ts', body);

    expect(findIdenticalContent(join(rootDir, 'tests'), rootDir)).toEqual([
      ['tests/_shared/helper.ts', 'tests/legacy/helper.ts'],
    ]);
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
