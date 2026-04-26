import { describe, expect, it } from 'vitest';
import {
  PLAYWRIGHT_MATRIX_PROJECTS,
  TestRunner,
  createPlaywrightTargetSuite,
  formatSuiteCatalog,
  getFailureExcerpt,
  getPlaywrightTestFile,
  parseRunnerOptions,
  selectTestSuites,
  summarizeExecutedSuites,
  validateTestEnvironment,
} from '../../../scripts/test-runner.mjs';

type RunnerSuite = NonNullable<ReturnType<typeof selectTestSuites>[number]>;

function getSuites(args: string[]): RunnerSuite[] {
  return selectTestSuites(args) as RunnerSuite[];
}

describe('test runner Playwright target detection', () => {
  it('returns an explicit spec path when one is provided', () => {
    expect(
      getPlaywrightTestFile('pnpm exec playwright test tests/calculators/calculator-e2e.spec.ts')
    ).toBe('tests/calculators/calculator-e2e.spec.ts');
  });

  it('ignores grep-based playwright commands that do not target a file', () => {
    expect(getPlaywrightTestFile('pnpm exec playwright test --grep @accessibility')).toBeNull();
    expect(getPlaywrightTestFile('pnpm exec playwright test --grep @performance')).toBeNull();
  });

  it('supports config flags before an explicit spec path', () => {
    expect(
      getPlaywrightTestFile(
        'PLAYWRIGHT_DEV=1 playwright test -c playwright.dev.config.ts tests/navbar-hmr.spec.ts'
      )
    ).toBe('tests/navbar-hmr.spec.ts');
  });

  it('validates the environment from the package script working directory', () => {
    expect(() => validateTestEnvironment()).not.toThrow();
  });

  it('throws when required files are missing', () => {
    expect(() =>
      validateTestEnvironment(['missing.spec.ts'], '/tmp/financial-analysis-missing')
    ).toThrow('Missing required test files:');
  });

  it('can select only critical suites', () => {
    const suites = getSuites(['--critical-only']);
    expect(suites.every((suite) => suite.critical)).toBe(true);
    expect(suites.map((suite) => suite.id)).toEqual([
      'test-layout',
      'typecheck-tests',
      'unit',
      'e2e',
    ]);
  });

  it('can select an explicit suite by id', () => {
    expect(getSuites(['--suite', 'chat']).map((suite) => suite.id)).toEqual(['chat']);
  });

  it('can build a focused Playwright target run with preflights', () => {
    const suites = getSuites(['--playwright', 'tests/chat']);
    expect(suites.map((suite) => suite.id)).toEqual([
      'test-layout',
      'typecheck-tests',
      'playwright-target',
    ]);
    expect(suites.at(-1)?.command).toBe('pnpm exec playwright test tests/chat');
  });

  it('can build a repeated Playwright target run for flake checks', () => {
    const suites = getSuites(['--playwright', 'tests/chat', '--repeat-each', '3']);
    expect(suites.at(-1)?.command).toBe(
      'pnpm exec playwright test --repeat-each=3 --workers=1 tests/chat'
    );
  });

  it('can pin a targeted Playwright repro to a matrix project', () => {
    const suites = getSuites(['--playwright', 'tests/chat', '--project', 'chromium']);
    expect(suites.at(-1)?.command).toBe(
      'PLAYWRIGHT_MATRIX=1 pnpm exec playwright test --project=chromium tests/chat'
    );
  });

  it('includes Playwright typecheck in the default suite selection', () => {
    expect(getSuites([]).map((suite) => suite.id)).toEqual([
      'test-layout',
      'typecheck-tests',
      'unit',
      'e2e',
    ]);
  });

  it('rejects unknown suite ids', () => {
    expect(() => selectTestSuites(['--suite', 'missing-suite'])).toThrow(
      'Unknown suite id(s): missing-suite'
    );
  });

  it('rejects filter combinations that select no suites', () => {
    expect(() => selectTestSuites(['--critical-only', '--suite', 'accessibility'])).toThrow(
      'No test suites selected for the requested filters'
    );
  });

  it('rejects mixing Playwright target mode with suite filters', () => {
    expect(() => selectTestSuites(['--playwright', 'tests/chat', '--suite', 'chat'])).toThrow(
      'Cannot combine --playwright with --suite or --critical-only'
    );
  });

  it('rejects repeat-each without Playwright target mode', () => {
    expect(() => selectTestSuites(['--repeat-each', '3'])).toThrow(
      '--repeat-each requires --playwright'
    );
  });

  it('rejects project selection without Playwright target mode', () => {
    expect(() => selectTestSuites(['--project', 'chromium'])).toThrow(
      '--project requires --playwright'
    );
  });

  it('summarizes only the suites that actually ran', () => {
    expect(
      summarizeExecutedSuites(
        [{ suite: 'Playwright Typecheck', passed: true, output: '', duration: 1 }],
        getSuites([])
      )
    ).toEqual(['Playwright Typecheck: Static type safety for Playwright specs and helpers']);
  });

  it('formats a discoverable suite catalog', () => {
    expect(formatSuiteCatalog(getSuites([]))).toContain(
      '- test-layout [default, critical]: Detect duplicate Playwright spec basenames before heavier test stages run'
    );
    expect(
      formatSuiteCatalog([
        {
          id: 'chat',
          name: 'Chat Regression Tests',
          command: 'pnpm run test:chat',
          description: 'Chat checks',
          critical: false,
          defaultSelected: false,
        },
      ])
    ).toBe('- chat: Chat checks');
  });

  it('parses Playwright target options', () => {
    expect(parseRunnerOptions(['--playwright=tests/nav'])).toEqual({
      requestedIds: [],
      criticalOnly: false,
      playwrightTarget: 'tests/nav',
      repeatEach: null,
      project: null,
      jsonSummaryPath: null,
    });
  });

  it('parses repeat-each for Playwright target mode', () => {
    expect(parseRunnerOptions(['--playwright=tests/nav', '--repeat-each=4'])).toEqual({
      requestedIds: [],
      criticalOnly: false,
      playwrightTarget: 'tests/nav',
      repeatEach: 4,
      project: null,
      jsonSummaryPath: null,
    });
  });

  it('parses project selection for Playwright target mode', () => {
    expect(parseRunnerOptions(['--playwright=tests/nav', '--project=firefox'])).toEqual({
      requestedIds: [],
      criticalOnly: false,
      playwrightTarget: 'tests/nav',
      repeatEach: null,
      project: 'firefox',
      jsonSummaryPath: null,
    });
  });

  it('parses JSON summary output for runner mode', () => {
    expect(
      parseRunnerOptions(['--suite=chat', '--json-summary=test-results/runner/summary.json'])
    ).toEqual({
      requestedIds: ['chat'],
      criticalOnly: false,
      playwrightTarget: null,
      repeatEach: null,
      project: null,
      jsonSummaryPath: 'test-results/runner/summary.json',
    });
  });

  it('rejects Playwright targets outside tests', () => {
    expect(() => createPlaywrightTargetSuite('src')).toThrow(
      'Playwright targets must live under the tests/ directory'
    );
  });

  it('rejects invalid repeat counts', () => {
    expect(() => createPlaywrightTargetSuite('tests/chat', { repeatEach: 1 })).toThrow(
      'Repeat count must be an integer greater than 1'
    );
  });

  it('rejects unknown Playwright projects', () => {
    expect(() => createPlaywrightTargetSuite('tests/chat', { project: 'opera' })).toThrow(
      'Unknown Playwright project: opera'
    );
  });

  it('exposes the supported Playwright matrix projects', () => {
    expect(PLAYWRIGHT_MATRIX_PROJECTS).toEqual([
      'chromium',
      'firefox',
      'webkit',
      'mobile-safari',
    ]);
  });

  it('returns a readable failure excerpt from the tail of output', () => {
    expect(getFailureExcerpt('line 1\nline 2\nline 3', 2)).toBe('line 2\nline 3');
  });

  it('stops running after a critical suite failure', async () => {
    const suites = [
      {
        id: 'critical',
        name: 'Critical Suite',
        command: 'critical-command',
        description: 'Critical path',
        critical: true,
        defaultSelected: true,
      },
      {
        id: 'after',
        name: 'After Suite',
        command: 'after-command',
        description: 'Should not run',
        critical: false,
        defaultSelected: true,
      },
    ];

    const execCommand = (command: string) => {
      if (command === 'critical-command') {
        const error = new Error('critical failure') as Error & { stdout?: string };
        error.stdout = 'critical failure';
        throw error;
      }

      return '';
    };

    const runner = new TestRunner(suites, { execCommand, appRoot: '/tmp' });
    const summary = await runner.runAllTests();

    expect(summary.success).toBe(false);
    expect(runner.results.map((result) => result.suite)).toEqual(['Critical Suite']);
  });
});
