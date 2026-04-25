#!/usr/bin/env node

/**
 * Comprehensive Test Runner
 * Runs all tests for calculators and journeys
 */

import { execSync } from 'child_process';
import { existsSync, mkdirSync, writeFileSync } from 'fs';
import { dirname, join, resolve } from 'path';
import { fileURLToPath, pathToFileURL } from 'url';
import { PLAYWRIGHT_MATRIX_PROJECTS } from './playwright-projects.mjs';

const SCRIPT_DIR = dirname(fileURLToPath(import.meta.url));
const APP_ROOT = resolve(SCRIPT_DIR, '..');

const testSuites = [
  {
    id: 'test-layout',
    name: 'Test Layout Check',
    command: 'pnpm run test:layout',
    description: 'Detect duplicate Playwright spec basenames before heavier test stages run',
    critical: true,
    defaultSelected: true,
  },
  {
    id: 'typecheck-tests',
    name: 'Playwright Typecheck',
    command: 'pnpm run typecheck:tests',
    description: 'Static type safety for Playwright specs and helpers',
    critical: true,
    defaultSelected: true,
  },
  {
    id: 'unit',
    name: 'Unit Tests',
    command: 'pnpm run test:unit',
    description: 'Full Vitest unit and browser-harness coverage',
    critical: true,
    defaultSelected: true,
  },
  {
    id: 'coverage',
    name: 'Coverage Tests',
    command: 'pnpm run test:coverage',
    description: 'Vitest coverage run with enforced web thresholds and artifacts',
    critical: false,
    defaultSelected: false,
  },
  {
    id: 'e2e',
    name: 'E2E Tests',
    command: 'pnpm run test:e2e',
    description: 'Full Playwright browser suite across supported workflows',
    critical: true,
    defaultSelected: true,
  },
  {
    id: 'chat',
    name: 'Chat Regression Tests',
    command: 'pnpm run test:chat',
    description: 'Chat surface contracts, context handling, and scoped tool behavior',
    critical: false,
    defaultSelected: false,
  },
  {
    id: 'journey',
    name: 'Journey Tests',
    command: 'pnpm run test:journey',
    description: 'Journey state management and progression',
    critical: false,
    defaultSelected: false,
  },
  {
    id: 'calculator',
    name: 'Calculator Tests',
    command: 'pnpm run test:calculator',
    description: 'Focused calculator-unit coverage',
    critical: false,
    defaultSelected: false,
  },
  {
    id: 'e2e-smoke',
    name: 'E2E Smoke Tests',
    command: 'pnpm run test:e2e:smoke',
    description: 'Fast browser smoke checks for core site availability and status flows',
    critical: false,
    defaultSelected: false,
  },
  {
    id: 'e2e-calculator',
    name: 'E2E Calculator Tests',
    command: 'pnpm run test:e2e:calculator',
    description: 'End-to-end calculator functionality',
    critical: false,
    defaultSelected: false,
  },
  {
    id: 'e2e-journey',
    name: 'E2E Journey Tests',
    command: 'pnpm run test:e2e:journey',
    description: 'End-to-end journey workflows',
    critical: false,
    defaultSelected: false,
  },
  {
    id: 'e2e-chat',
    name: 'E2E Chat Tests',
    command: 'pnpm run test:e2e:chat',
    description: 'Browser-level chat behavior and response quality flows',
    critical: false,
    defaultSelected: false,
  },
  {
    id: 'e2e-nav',
    name: 'E2E Navigation Tests',
    command: 'pnpm run test:e2e:nav',
    description: 'Browser-level navigation stability and interaction coverage',
    critical: false,
    defaultSelected: false,
  },
  {
    id: 'e2e-site',
    name: 'E2E Site Tests',
    command: 'pnpm run test:e2e:site',
    description: 'Site-level smoke and route coverage',
    critical: false,
    defaultSelected: false,
  },
  {
    id: 'e2e-auto-lease',
    name: 'E2E Auto Lease Tests',
    command: 'pnpm run test:e2e:auto-lease',
    description: 'Auto-lease journey browser coverage',
    critical: false,
    defaultSelected: false,
  },
  {
    id: 'e2e-lease-analysis',
    name: 'E2E Lease Analysis Tests',
    command: 'pnpm run test:e2e:lease-analysis',
    description: 'Lease-analysis browser workflows and validation coverage',
    critical: false,
    defaultSelected: false,
  },
  {
    id: 'e2e-matrix',
    name: 'E2E Matrix Tests',
    command: 'pnpm run test:e2e:matrix',
    description: 'Cross-browser Playwright matrix for CI and full validation runs',
    critical: false,
    defaultSelected: false,
  },
  {
    id: 'e2e-smoke-matrix',
    name: 'E2E Smoke Matrix Tests',
    command: 'pnpm run test:e2e:smoke:matrix',
    description: 'Cross-browser smoke coverage for the canonical web smoke specs',
    critical: false,
    defaultSelected: false,
  },
  {
    id: 'accessibility',
    name: 'Accessibility Tests',
    command: 'pnpm exec playwright test --grep @accessibility',
    description: 'Accessibility compliance',
    critical: false,
    defaultSelected: false,
  },
  {
    id: 'performance',
    name: 'Performance Tests',
    command: 'pnpm exec playwright test --grep @performance',
    description: 'Performance benchmarks',
    critical: false,
    defaultSelected: false,
  },
];

function getPlaywrightTestFile(command) {
  return (
    command.split(/\s+/).find((token) => /^tests\/.+\.(spec|test)\.[cm]?[jt]sx?$/.test(token)) ??
    null
  );
}

function createPlaywrightTargetSuite(target, options = {}) {
  const normalizedTarget = target.replaceAll('\\', '/');
  const repeatEach = options.repeatEach ?? null;
  const project = options.project ?? null;

  if (!normalizedTarget.startsWith('tests/')) {
    throw new Error('Playwright targets must live under the tests/ directory');
  }

  if (!existsSync(join(APP_ROOT, normalizedTarget))) {
    throw new Error(`Playwright target not found: ${normalizedTarget}`);
  }

  if (repeatEach !== null && (!Number.isInteger(repeatEach) || repeatEach < 2)) {
    throw new Error('Repeat count must be an integer greater than 1');
  }

  if (project !== null && !PLAYWRIGHT_MATRIX_PROJECTS.includes(project)) {
    throw new Error(`Unknown Playwright project: ${project}`);
  }

  const repeatArgs = repeatEach ? ` --repeat-each=${repeatEach} --workers=1` : '';
  const repeatLabel = repeatEach ? ` repeated ${repeatEach}x` : '';
  const projectArgs = project ? ` --project=${project}` : '';
  const projectPrefix = project ? 'PLAYWRIGHT_MATRIX=1 ' : '';
  const projectLabel = project ? ` on ${project}` : '';

  return {
    id: 'playwright-target',
    name: `Playwright Target (${normalizedTarget})`,
    command: `${projectPrefix}pnpm exec playwright test${repeatArgs}${projectArgs} ${normalizedTarget}`,
    description: `Focused Playwright run for ${normalizedTarget}${projectLabel}${repeatLabel}`,
    critical: true,
    defaultSelected: false,
  };
}

function parseRunnerOptions(args) {
  const requestedIds = [];
  let criticalOnly = false;
  let playwrightTarget = null;
  let repeatEach = null;
  let project = null;
  let jsonSummaryPath = null;

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];

    if (arg === '--critical-only') {
      criticalOnly = true;
      continue;
    }

    if (arg === '--suite') {
      const suiteId = args[index + 1];
      if (!suiteId) {
        throw new Error('Expected a suite id after --suite');
      }
      requestedIds.push(suiteId);
      index += 1;
      continue;
    }

    if (arg.startsWith('--suite=')) {
      requestedIds.push(arg.slice('--suite='.length));
      continue;
    }

    if (arg === '--playwright') {
      const target = args[index + 1];
      if (!target) {
        throw new Error('Expected a Playwright target after --playwright');
      }
      playwrightTarget = target;
      index += 1;
      continue;
    }

    if (arg.startsWith('--playwright=')) {
      playwrightTarget = arg.slice('--playwright='.length);
      continue;
    }

    if (arg === '--project') {
      const value = args[index + 1];
      if (!value) {
        throw new Error('Expected a Playwright project after --project');
      }
      project = value;
      index += 1;
      continue;
    }

    if (arg.startsWith('--project=')) {
      project = arg.slice('--project='.length);
      continue;
    }

    if (arg === '--json-summary') {
      const value = args[index + 1];
      if (!value) {
        throw new Error('Expected a file path after --json-summary');
      }
      jsonSummaryPath = value;
      index += 1;
      continue;
    }

    if (arg.startsWith('--json-summary=')) {
      jsonSummaryPath = arg.slice('--json-summary='.length);
      continue;
    }

    if (arg === '--repeat-each') {
      const value = args[index + 1];
      if (!value) {
        throw new Error('Expected a repeat count after --repeat-each');
      }
      repeatEach = Number.parseInt(value, 10);
      index += 1;
      continue;
    }

    if (arg.startsWith('--repeat-each=')) {
      repeatEach = Number.parseInt(arg.slice('--repeat-each='.length), 10);
    }
  }

  if (playwrightTarget && (criticalOnly || requestedIds.length > 0)) {
    throw new Error('Cannot combine --playwright with --suite or --critical-only');
  }

  if (repeatEach !== null && !playwrightTarget) {
    throw new Error('--repeat-each requires --playwright');
  }

  if (project !== null && !playwrightTarget) {
    throw new Error('--project requires --playwright');
  }

  return { requestedIds, criticalOnly, playwrightTarget, repeatEach, project, jsonSummaryPath };
}

function selectTestSuites(args, suites = testSuites) {
  const { requestedIds, criticalOnly, playwrightTarget, repeatEach, project } =
    parseRunnerOptions(args);

  if (playwrightTarget) {
    return [
      suites.find((suite) => suite.id === 'test-layout'),
      suites.find((suite) => suite.id === 'typecheck-tests'),
      createPlaywrightTargetSuite(playwrightTarget, { repeatEach, project }),
    ].filter(Boolean);
  }

  const selected = suites.filter((suite) => {
    if (requestedIds.length > 0 && !requestedIds.includes(suite.id)) {
      return false;
    }

    if (criticalOnly && !suite.critical) {
      return false;
    }

    if (requestedIds.length === 0 && !criticalOnly && suite.defaultSelected === false) {
      return false;
    }

    return true;
  });

  if (requestedIds.length > 0) {
    const missingIds = requestedIds.filter((id) => !suites.some((suite) => suite.id === id));
    if (missingIds.length > 0) {
      throw new Error(`Unknown suite id(s): ${missingIds.join(', ')}`);
    }
  }

  if (selected.length === 0) {
    throw new Error('No test suites selected for the requested filters');
  }

  return selected;
}

function summarizeExecutedSuites(results, suites) {
  return results.map((result) => {
    const suite = suites.find((candidate) => candidate.name === result.suite);
    return suite ? `${suite.name}: ${suite.description}` : result.suite;
  });
}

function formatSuiteCatalog(suites = testSuites) {
  return suites
    .map((suite) => {
      const labels = [
        suite.defaultSelected ? 'default' : null,
        suite.critical ? 'critical' : null,
      ].filter(Boolean);
      const suffix = labels.length > 0 ? ` [${labels.join(', ')}]` : '';
      return `- ${suite.id}${suffix}: ${suite.description}`;
    })
    .join('\n');
}

const DEFAULT_REQUIRED_FILES = [
  'tsconfig.playwright.json',
  'scripts/check-test-layout.mjs',
  'src/scripts/__tests__/calculator-tests.test.ts',
  'src/scripts/__tests__/chat-surface-contracts.test.ts',
  'src/scripts/__tests__/chat-tool-scope.test.ts',
  'src/scripts/__tests__/journey-tests.test.ts',
  'tests/calculators/calculator-e2e.spec.ts',
  'tests/journeys/journey-e2e.spec.ts',
  'package.json',
  'playwright.config.ts',
];

class TestRunner {
  constructor(suites = testSuites, options = {}) {
    this.results = [];
    this.startTime = 0;
    this.suites = suites;
    this.execCommand = options.execCommand ?? execSync;
    this.appRoot = options.appRoot ?? APP_ROOT;
    this.summaryPath = options.summaryPath ?? null;
  }

  async runAllTests() {
    console.log('🚀 Starting Comprehensive Test Suite\n');
    this.startTime = Date.now();

    for (const suite of this.suites) {
      const result = await this.runTestSuite(suite);
      if (!result.passed && suite.critical) {
        break;
      }
    }

    return this.printSummary();
  }

  async runTestSuite(suite) {
    console.log(`\n📋 Running ${suite.name}...`);
    console.log(`   ${suite.description}`);

    const suiteStartTime = Date.now();
    let passed = false;
    let output = '';

    try {
      // Check if test files exist
      if (suite.command.includes('playwright')) {
        const testFile = getPlaywrightTestFile(suite.command);
        if (testFile && !existsSync(join(this.appRoot, testFile))) {
          throw new Error(`Test file not found: ${testFile}`);
        }
      }

      // Run the test command
      const result = this.execCommand(suite.command, {
        cwd: this.appRoot,
        encoding: 'utf8',
        stdio: 'pipe',
        timeout: 300000, // 5 minutes timeout
      });

      output = result;
      passed = true;
      console.log(`   ✅ ${suite.name} PASSED`);
    } catch (error) {
      output = error.stdout || error.stderr || error.message;
      passed = false;
      console.log(`   ❌ ${suite.name} FAILED`);
      if (suite.critical) {
        console.log(`   ⚠️  Critical test failed - stopping execution`);
      }
    }

    const result = {
      suite: suite.name,
      passed,
      output,
      duration: Date.now() - suiteStartTime,
    };
    this.results.push(result);
    return result;
  }

  printSummary() {
    const totalDuration = Date.now() - this.startTime;
    const passedSuites = this.results.filter((r) => r.passed).length;
    const totalSuites = this.results.length;
    const criticalFailures = this.results.filter(
      (r) => !r.passed && this.suites.find((s) => s.name === r.suite)?.critical
    ).length;

    console.log('\n' + '='.repeat(60));
    console.log('📊 TEST SUMMARY');
    console.log('='.repeat(60));

    console.log(`\n⏱️  Total Duration: ${this.formatDuration(totalDuration)}`);
    console.log(`📈 Overall Result: ${passedSuites}/${totalSuites} test suites passed`);

    if (criticalFailures > 0) {
      console.log(`🚨 Critical Failures: ${criticalFailures}`);
    }

    console.log('\n📋 Detailed Results:');
    console.log('-'.repeat(60));

    this.results.forEach((result) => {
      const status = result.passed ? '✅ PASS' : '❌ FAIL';
      const duration = this.formatDuration(result.duration);
      const critical = this.suites.find((s) => s.name === result.suite)?.critical ? '🔴' : '🟡';

      console.log(`${critical} ${status} ${result.suite} (${duration})`);

      if (!result.passed) {
        console.log(`   Error: ${getFailureExcerpt(result.output, 5)}`);
      }
    });

    console.log('\n🎯 Executed Coverage:');
    console.log('-'.repeat(60));
    summarizeExecutedSuites(this.results, this.suites).forEach((summary) => {
      console.log(`✅ ${summary}`);
    });

    if (criticalFailures === 0) {
      console.log('\n🎉 All critical tests passed! The system is ready for production.');
    } else {
      console.log('\n⚠️  Critical tests failed. Please fix issues before deployment.');
    }

    const summary = {
      success: criticalFailures === 0,
      criticalFailures,
      passedSuites,
      totalSuites,
      totalDuration,
      results: this.results.map((result) => {
        const suite = this.suites.find((candidate) => candidate.name === result.suite);
        return {
          suite: result.suite,
          suiteId: suite?.id ?? null,
          command: suite?.command ?? null,
          description: suite?.description ?? null,
          critical: suite?.critical ?? false,
          passed: result.passed,
          duration: result.duration,
          failureExcerpt: result.passed ? null : getFailureExcerpt(result.output, 20),
        };
      }),
    };

    if (this.summaryPath) {
      this.writeSummary(summary);
    }

    return summary;
  }

  formatDuration(ms) {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;

    if (minutes > 0) {
      return `${minutes}m ${remainingSeconds}s`;
    }
    return `${remainingSeconds}s`;
  }

  writeSummary(summary) {
    const outputPath = resolve(this.appRoot, this.summaryPath);
    mkdirSync(dirname(outputPath), { recursive: true });
    writeFileSync(outputPath, JSON.stringify(summary, null, 2));
    console.log(`\n📝 Wrote runner summary to ${this.summaryPath}`);
  }
}

function getFailureExcerpt(output, maxLines = 10) {
  return String(output)
    .split('\n')
    .map((line) => line.trimEnd())
    .filter(Boolean)
    .slice(-maxLines)
    .join('\n');
}

// Test validation functions
function validateTestEnvironment(requiredFiles = DEFAULT_REQUIRED_FILES, baseDir = APP_ROOT) {
  console.log('🔍 Validating test environment...');

  const missingFiles = requiredFiles.filter((file) => !existsSync(join(baseDir, file)));

  if (missingFiles.length > 0) {
    throw new Error(
      `Missing required test files:\n${missingFiles.map((file) => `- ${file}`).join('\n')}`
    );
  }

  console.log('✅ Test environment validated');
}

// Main execution
async function main() {
  try {
    const args = process.argv.slice(2);

    if (args.includes('--help') || args.includes('-h')) {
      console.log(`Usage: node scripts/test-runner.mjs [options]

Options:
  --critical-only    Run only critical suites
  --suite <id>       Run a specific suite (repeatable)
  --suite=<id>       Run a specific suite
  --playwright <p>   Run a Playwright file or directory under tests/ with preflights
  --playwright=<p>   Run a Playwright file or directory under tests/
  --project <name>   Run a targeted Playwright repro on a matrix project (requires --playwright)
  --project=<name>   Run a targeted Playwright repro on a matrix project
  --json-summary <p> Write a JSON summary report to a file under apps/web
  --json-summary=<p> Write a JSON summary report to a file under apps/web
  --repeat-each <n>  Repeat a targeted Playwright run n times (requires --playwright)
  --repeat-each=<n>  Repeat a targeted Playwright run n times
  --list-suites      Print the available suite ids
  -h, --help         Show this help

Available suites:
${formatSuiteCatalog()}`);
      return;
    }

    if (args.includes('--list-suites')) {
      console.log(formatSuiteCatalog());
      return;
    }

    const suites = selectTestSuites(args);
    const { jsonSummaryPath } = parseRunnerOptions(args);
    validateTestEnvironment();

    const runner = new TestRunner(suites, { summaryPath: jsonSummaryPath });
    const summary = await runner.runAllTests();
    if (!summary.success) {
      process.exit(1);
    }
  } catch (error) {
    console.error('💥 Test runner failed:', error);
    process.exit(1);
  }
}

// Run if called directly
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main();
}

export {
  DEFAULT_REQUIRED_FILES,
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
};
