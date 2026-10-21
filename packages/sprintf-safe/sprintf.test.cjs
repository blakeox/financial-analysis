const assert = require('node:assert/strict');
const test = require('node:test');
const { sprintf, vsprintf } = require('./sprintf.cjs');

test('preserves ordinary Bash formatter output and exports', () => {
  assert.equal(sprintf('%s %04d %.2f %X %%', 'amount', 7, 12.345, 255), 'amount 0007 12.35 FF %');
  assert.equal(vsprintf('%2$s %1$d', [12, 'months']), 'months 12');
  assert.equal(sprintf('%(lease.months)d', { lease: { months: 12 } }), '12');
  assert.equal(sprintf('%.3s', 'lease'), 'lea');
});

for (const type of ['e', 'f', 'g']) {
  test(`bounds excessive ${type} precision without throwing RangeError`, () => {
    for (const precision of ['101', '1000000000', '9'.repeat(400)]) {
      assert.equal(sprintf(`%.${precision}${type}`, 1.25), sprintf(`%.100${type}`, 1.25));
    }
  });
}

test('preserves valid numeric precision boundaries', () => {
  assert.equal(sprintf('%.0f', 1.25), '1');
  assert.equal(sprintf('%.0e', 1.25), '1e+0');
  assert.equal(sprintf('%.100f', 1), `1.${'0'.repeat(100)}`);
  assert.equal(sprintf('%.1g', 1.25), '1');
  assert.equal(sprintf('%.100g', 1.25), '1.25');
});

test('bounds zero significant precision and remains safe across cached formats', () => {
  assert.equal(sprintf('%.0g', 1.25), '1');
  assert.equal(sprintf('%.999f', 1), `1.${'0'.repeat(100)}`);
  assert.equal(sprintf('%.999f', 2), `2.${'0'.repeat(100)}`);
  assert.equal(sprintf('%.2f', 2), '2.00');
});
