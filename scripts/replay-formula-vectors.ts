import { createHash } from 'node:crypto';

import {
  AMORTIZATION_CANONICAL_TEST_VECTORS,
  AmortizationAnalyzer,
} from '../packages/analysis/src/index.ts';

const results = AMORTIZATION_CANONICAL_TEST_VECTORS.map((vector) => {
  const result = AmortizationAnalyzer.analyze(vector.input);
  const values = {
    monthlyPayment: result.monthlyPayment,
    totalPayments: result.totalPayments,
    totalInterest: result.totalInterest,
    scheduleLength: result.schedule.length,
  };

  for (const [key, actual] of Object.entries(values)) {
    const expected = vector.expectedOutput[key as keyof typeof vector.expectedOutput];
    if (typeof actual !== 'number' || Math.abs(actual - expected) > vector.tolerance) {
      throw new Error(`Formula vector ${vector.id} failed for ${key}`);
    }
  }

  return {
    id: vector.id,
    formulaId: vector.formulaId,
    formulaVersion: vector.formulaVersion,
    tolerance: vector.tolerance,
    output: values,
  };
});

const payload = {
  schemaVersion: '1.0.0',
  kind: 'canonical-formula-vector-replay',
  passed: true,
  vectorCount: results.length,
  vectors: results,
};

const digest = createHash('sha256').update(JSON.stringify(payload)).digest('hex');
console.log(JSON.stringify({ ...payload, receiptSha256: digest }));
