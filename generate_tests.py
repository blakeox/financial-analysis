import re
import json
import os

file_path = 'apps/web/src/components/CalculatorTemplate.tsx'
output_path = 'apps/web/tests/calculators/generated-models.spec.ts'

with open(file_path, 'r') as f:
    content = f.read()

# Regex to find calculator blocks
# We look for the key and the opening brace
# Then we try to find the formFields array
# This is tricky with regex. 

# Alternative: Split by "id: '" which seems to be the start of most configs (except the key itself)
# But the key is what we found with grep.

# Let's try to find the start of each calculator config
# They seem to be properties of CALCULATOR_CONFIGS

# We can iterate through the keys we found earlier
implemented_scripts = set([
    "amortization", "auto-loan", "budget", "debt-payoff", "retirement", "savings-goal",
    "student-loans", "rent-vs-buy", "invest-vs-payoff-debt", "credit-card-payoff",
    "break-even", "tax-optimization", "insurance-needs", "financial-journey",
    "college-savings", "home-buying-affordability", "investment-portfolio",
    "retirement-planning", "analysis", "calculator-quick-access",
    "calculator-comprehensive-analysis", "analysis-content-generators", "analytics",
    "commercial-real-estate-lease", "equipment-lease", "journey-page", "journey-state",
    "journey-navigation", "journey-analysis", "models", "multi-model-scenarios",
    "mortgage-scenario-planning", "dcf-valuation", "ma-analysis-simple", "risk-management",
    "cash-flow-forecast", "cash-flow-analysis", "business-loan-qualifier", "bond-pricing",
    "options-pricing", "cca-analysis", "ma-analysis", "scenario-analysis",
    "business-expansion-loan", "business-financial-health", "debt-capacity", "dscr",
    "business-loan-scenarios", "social-security", "heloc", "refinancing",
    "capital-structure", "project-finance", "real-estate-investment", "fire-calculator",
    "lbo", "credit-risk", "working-capital", "var", "portfolio-optimization",
    "estate-planning", "emergency-fund", "net-worth", "401k-match", "pricing",
    "pricing-strategy", "saas-metrics", "unit-economics", "business-valuation",
    "revenue-forecast", "side-hustle-income", "field-highlighting", "dashboard-personal"
])

all_keys = [
    "amortization", "auto-loan", "retirement", "savings-goal", "debt-payoff", "student-loans",
    "budget", "dcf-valuation", "ma-analysis", "risk-management", "equipment-lease",
    "invest-vs-payoff-debt", "rent-vs-buy", "mortgage-scenario-planning", "side-hustle-income",
    "credit-card-payoff", "break-even", "cash-flow-forecast", "business-loan-qualifier",
    "pricing-strategy", "saas-metrics", "business-financial-health", "debt-capacity", "dscr",
    "business-loan-scenarios", "social-security", "heloc", "refinancing", "fire-calculator",
    "estate-planning", "emergency-fund", "net-worth", "401k-match", "capital-structure",
    "project-finance", "real-estate-investment", "lbo", "credit-risk", "working-capital", "var",
    "portfolio-optimization", "hsa-optimization", "tax-loss-harvesting", "charitable-giving",
    "car-lease-vs-buy", "long-term-care", "disability-insurance", "life-insurance-reassessment",
    "529-optimizer", "credit-score-impact", "inventory-optimization", "accounts-receivable-aging",
    "financial-ratio-analyzer", "depreciation", "equipment-lease-vs-buy", "revenue-recognition",
    "employee-stock-options", "franchise-roi", "startup-financial-model",
    "accounts-payable-optimization", "cryptocurrency-tax", "international-tax-planning",
    "1031-exchange", "business-succession-planning", "supply-chain-finance"
]

keys = [k for k in all_keys if k in implemented_scripts]

# Helper to extract fields for a given key
def extract_fields(key, content):
    # Find the start of the config for this key
    # It could be "key: {" or "'key': {"
    pattern = re.compile(r"['\"]?" + re.escape(key) + r"['\"]?:\s*\{")
    match = pattern.search(content)
    if not match:
        return []
    
    start_pos = match.end()
    
    # Now find "formFields: [" after this position
    # We need to be careful not to go into the next calculator
    # We can search for the next "id: '" which would indicate the next calculator (or the current one's id)
    
    # Let's just look for the first "formFields: [" after the key
    form_fields_match = re.search(r"formFields:\s*\[", content[start_pos:])
    if not form_fields_match:
        return []
    
    fields_start = start_pos + form_fields_match.end()
    
    # Now extract the content of the array until "],"
    # This is brittle but might work if formatting is consistent
    bracket_count = 1
    current_pos = fields_start
    fields_str = ""
    
    while bracket_count > 0 and current_pos < len(content):
        char = content[current_pos]
        if char == '[':
            bracket_count += 1
        elif char == ']':
            bracket_count -= 1
        
        if bracket_count > 0:
            fields_str += char
        current_pos += 1
        
    # Now parse the fields from fields_str
    # We look for objects { ... }
    # And extract id, type, default, options
    
    fields = []
    # Split by "}," to get individual field objects roughly
    field_blocks = fields_str.split('},')
    
    for block in field_blocks:
        field = {}
        
        # Extract ID
        id_match = re.search(r"id:\s*['\"]([^'\"]+)['\"]", block)
        if id_match:
            field['id'] = id_match.group(1)
        
        # Extract Type
        type_match = re.search(r"type:\s*['\"]([^'\"]+)['\"]", block)
        if type_match:
            field['type'] = type_match.group(1)
            
        # Extract Default
        default_match = re.search(r"default:\s*([^,\n]+)", block)
        if default_match:
            val = default_match.group(1).strip()
            if val == 'true': field['default'] = True
            elif val == 'false': field['default'] = False
            elif val.startswith("'") or val.startswith('"'): field['default'] = val[1:-1]
            else: 
                try: field['default'] = float(val)
                except: field['default'] = val # could be a variable or something
        
        # Extract Options (for select)
        if field.get('type') == 'select':
            # Just check if options exist, we might pick the first one
            options_match = re.search(r"options:\s*\[", block)
            if options_match:
                # Extract first value from options
                first_opt = re.search(r"value:\s*['\"]([^'\"]+)['\"]", block[options_match.end():])
                if first_opt:
                    field['firstOption'] = first_opt.group(1)

        # Extract advancedOnly
        advanced_match = re.search(r"advancedOnly:\s*true", block)
        if advanced_match:
            field['advancedOnly'] = True

        if 'id' in field:
            fields.append(field)
            
    return fields

test_content = """
import { test, expect } from '@playwright/test';

const BASE_URL = process.env.PLAYWRIGHT_TEST_URL || 'http://localhost:8788';

test.describe('Generated Model Tests', () => {
"""

for key in keys:
    fields = extract_fields(key, content)
    if not fields:
        print(f"Warning: No fields found for {key}")
        continue
        
    test_content += f"""
  test('should run {key} calculator', async ({{ page }}) => {{
    await page.goto(`${{BASE_URL}}/calculator/{key}/`);
    await expect(page.locator('#calculator-form')).toBeVisible();
    
    // Check for advanced fields and toggle if necessary
    const hasAdvancedFields = {str(any(f.get('advancedOnly') for f in fields)).lower()};
    if (hasAdvancedFields) {{
        const toggle = page.locator('#mode-toggle');
        await expect(toggle).toBeVisible();
        const isChecked = await toggle.getAttribute('aria-checked') === 'true';
        if (!isChecked) {{
            await toggle.click();
            await expect(toggle).toHaveAttribute('aria-checked', 'true');
        }}
    }}

    // Fill fields
"""
    
    for field in fields:
        field_id = field.get('id')
        field_type = field.get('type')
        default_val = field.get('default')
        
        if not field_id: continue
        
        selector = f"#{field_id}"
        
        if field_type == 'number':
            val = default_val
            if val is None:
                # Heuristics for better default values
                lower_id = field_id.lower()
                if 'rate' in lower_id or 'percent' in lower_id or 'apr' in lower_id or 'apy' in lower_id or 'tax' in lower_id:
                    val = '5'
                elif 'year' in lower_id or 'term' in lower_id:
                    val = '30'
                elif 'down' in lower_id:
                    val = '50000'
                elif 'price' in lower_id or 'value' in lower_id or 'balance' in lower_id or 'amount' in lower_id or 'cost' in lower_id:
                    val = '300000'
                elif 'insurance' in lower_id or 'fee' in lower_id:
                    val = '100'
                elif 'age' in lower_id:
                    val = '30'
                elif 'rent' in lower_id:
                    val = '2000'
                elif 'hours' in lower_id:
                    val = '40'
                else:
                    val = '1000'
            
            test_content += f"    await page.fill('{selector}', '{val}');\n"
        elif field_type == 'text':
            val = default_val if default_val else 'Test Value'
            test_content += f"    await page.fill('{selector}', '{val}');\n"
        elif field_type == 'select':
            val = field.get('firstOption')
            if val:
                test_content += f"    await page.selectOption('{selector}', '{val}');\n"
        elif field_type == 'checkbox':
            if default_val is True:
                test_content += f"    await page.check('{selector}');\n"
            else:
                test_content += f"    await page.uncheck('{selector}');\n"

    test_content += """
    // Submit form
    await page.click('button[type="submit"]');
    
    // Check results
    await expect(page.locator('#results-section')).not.toBeHidden({ timeout: 10000 });
  });
"""

test_content += "});\n"

with open(output_path, 'w') as f:
    f.write(test_content)

print(f"Generated tests for {len(keys)} calculators at {output_path}")
