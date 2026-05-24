const fs = require('fs');
const path = require('path');

const filePath = path.join(process.cwd(), 'apps/web/src/calculators/calculator-configs.ts');
const content = fs.readFileSync(filePath, 'utf8');

// Regex to find calculator definitions
// This is a simplified parser and might need adjustment
const calculatorRegex = /^\s+([a-zA-Z0-9_-]+):\s*{\s*id:\s*'([^']+)'/gm;
const calculators = [];

let match;
while ((match = calculatorRegex.exec(content)) !== null) {
    calculators.push(match[2]);
}

console.log(JSON.stringify(calculators, null, 2));
