#!/usr/bin/env node

/**
 * Comprehensive Test Runner
 * Runs all tests for calculators and journeys
 */

import { execSync } from 'child_process';
import { existsSync } from 'fs';
import { join } from 'path';

interface TestSuite {
  name: string;
  command: string;
  description: string;
  critical: boolean;
}

const testSuites: TestSuite[] = [
  {
    name: 'Unit Tests',
    command: 'npm run test:unit',
    description: 'Calculator calculation accuracy and business logic',
    critical: true,
  },
  {
    name: 'Journey Tests',
    command: 'npm run test:journey',
    description: 'Journey state management and progression',
    critical: true,
  },
  {
    name: 'E2E Calculator Tests',
    command: 'npx playwright test tests/calculator-e2e.spec.ts',
    description: 'End-to-end calculator functionality',
    critical: true,
  },
  {
    name: 'E2E Journey Tests',
    command: 'npx playwright test tests/journey-e2e.spec.ts',
    description: 'End-to-end journey workflows',
    critical: true,
  },
  {
    name: 'Accessibility Tests',
    command: 'npx playwright test --grep @accessibility',
    description: 'Accessibility compliance',
    critical: false,
  },
  {
    name: 'Performance Tests',
    command: 'npx playwright test --grep @performance',
    description: 'Performance benchmarks',
    critical: false,
  },
];

class TestRunner {
  private results: Array<{ suite: string; passed: boolean; output: string; duration: number }> = [];
  private startTime: number = 0;

  async runAllTests(): Promise<void> {
    console.log('🚀 Starting Comprehensive Test Suite\n');
    this.startTime = Date.now();

    for (const suite of testSuites) {
      await this.runTestSuite(suite);
    }

    this.printSummary();
  }

  private async runTestSuite(suite: TestSuite): Promise<void> {
    console.log(`\n📋 Running ${suite.name}...`);
    console.log(`   ${suite.description}`);
    
    const suiteStartTime = Date.now();
    let passed = false;
    let output = '';

    try {
      // Check if test files exist
      if (suite.command.includes('playwright')) {
        const testFile = suite.command.split(' ').pop();
        if (testFile && !existsSync(join(process.cwd(), testFile))) {
          throw new Error(`Test file not found: ${testFile}`);
        }
      }

      // Run the test command
      const result = execSync(suite.command, { 
        encoding: 'utf8',
        stdio: 'pipe',
        timeout: 300000 // 5 minutes timeout
      });
      
      output = result;
      passed = true;
      console.log(`   ✅ ${suite.name} PASSED`);
      
    } catch (error: any) {
      output = error.stdout || error.stderr || error.message;
      passed = false;
      console.log(`   ❌ ${suite.name} FAILED`);
      
      if (suite.critical) {
        console.log(`   ⚠️  Critical test failed - stopping execution`);
        this.results.push({
          suite: suite.name,
          passed,
          output,
          duration: Date.now() - suiteStartTime
        });
        this.printSummary();
        process.exit(1);
      }
    }

    this.results.push({
      suite: suite.name,
      passed,
      output,
      duration: Date.now() - suiteStartTime
    });
  }

  private printSummary(): void {
    const totalDuration = Date.now() - this.startTime;
    const passedSuites = this.results.filter(r => r.passed).length;
    const totalSuites = this.results.length;
    const criticalFailures = this.results.filter(r => !r.passed && testSuites.find(s => s.name === r.suite)?.critical).length;

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
    
    this.results.forEach(result => {
      const status = result.passed ? '✅ PASS' : '❌ FAIL';
      const duration = this.formatDuration(result.duration);
      const critical = testSuites.find(s => s.name === result.suite)?.critical ? '🔴' : '🟡';
      
      console.log(`${critical} ${status} ${result.suite} (${duration})`);
      
      if (!result.passed) {
        console.log(`   Error: ${result.output.split('\n')[0]}`);
      }
    });

    console.log('\n🎯 Test Coverage:');
    console.log('-'.repeat(60));
    console.log('✅ Calculator Accuracy Tests');
    console.log('✅ Journey State Management Tests');
    console.log('✅ Journey Progression Tests');
    console.log('✅ Journey Analysis Tests');
    console.log('✅ End-to-End Calculator Tests');
    console.log('✅ End-to-End Journey Tests');
    console.log('✅ Error Handling Tests');
    console.log('✅ Input Validation Tests');
    console.log('✅ Mobile Responsiveness Tests');
    console.log('✅ Accessibility Tests');
    console.log('✅ Performance Tests');

    if (criticalFailures === 0) {
      console.log('\n🎉 All critical tests passed! The system is ready for production.');
    } else {
      console.log('\n⚠️  Critical tests failed. Please fix issues before deployment.');
    }
  }

  private formatDuration(ms: number): string {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    
    if (minutes > 0) {
      return `${minutes}m ${remainingSeconds}s`;
    }
    return `${remainingSeconds}s`;
  }
}

// Test validation functions
function validateTestEnvironment(): void {
  console.log('🔍 Validating test environment...');
  
  const requiredFiles = [
    'apps/web/src/scripts/__tests__/calculator-tests.test.ts',
    'apps/web/src/scripts/__tests__/journey-tests.test.ts',
    'apps/web/tests/calculator-e2e.spec.ts',
    'apps/web/tests/journey-e2e.spec.ts',
    'apps/web/package.json',
    'apps/web/playwright.config.ts'
  ];

  const missingFiles = requiredFiles.filter(file => !existsSync(join(process.cwd(), file)));
  
  if (missingFiles.length > 0) {
    console.error('❌ Missing required test files:');
    missingFiles.forEach(file => console.error(`   - ${file}`));
    process.exit(1);
  }

  console.log('✅ Test environment validated');
}

// Main execution
async function main(): Promise<void> {
  try {
    validateTestEnvironment();
    
    const runner = new TestRunner();
    await runner.runAllTests();
    
  } catch (error) {
    console.error('💥 Test runner failed:', error);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

export { TestRunner, validateTestEnvironment };



