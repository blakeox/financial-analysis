// Test the amortization regex matching
const testContent = 'Calculate amortization for this loan: {"principal": 100000, "interestRate": 0.05, "termInYears": 5}';
console.log('Original content:', testContent);
console.log('Amortization regex test:', /amortization/i.test(testContent));
console.log('JSON regex test:', /\{.*\}/.test(testContent));
const jsonMatch = testContent.match(/\{.*\}/);
console.log('JSON match result:', jsonMatch);
if (jsonMatch) {
  console.log('Matched JSON:', jsonMatch[0]);
  try {
    const parsed = JSON.parse(jsonMatch[0]);
    console.log('Parsed JSON:', parsed);
  } catch (e) {
    console.log('Parse error:', e);
  }
}