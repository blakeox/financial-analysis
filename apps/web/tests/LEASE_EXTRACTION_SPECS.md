# Commercial Real Estate Lease - AI Extraction Specifications

## Test Data: Industrial Net Lease

### Key Lease Terms to Extract:

1. **Lease Type**: `warehouse-nnn` (triple net lease)
2. **Base Rent**: $45,000/month (Year 1)
3. **Lease Term**: 60 months (5 years)
4. **Square Footage**: 50,000 RSF (rentable square feet)
5. **Escalation**: 3% annually, percentage-based
6. **Security Deposit**: $90,000
7. **CAM/Operating Expenses**: $0 (tenant pays 100% of Operating Expenses - NNN)
8. **Taxes**: Included in Operating Expenses
9. **Insurance**: Tenant maintains own ($2M CGL, $4M aggregate)
10. **Utilities**: Separately metered (electricity and gas)
11. **Parking**: 60 exclusive parking spaces
12. **Property Address**: 4800 Foundry Park Drive, Livonia, Michigan
13. **Lease Start**: February 1, 2025
14. **Lease End**: January 31, 2030 (calculated from 5-year term)
15. **Landlord**: Ironclad Industrial Holdings, LLC
16. **Tenant**: Midwest Precision Manufacturing, LLC
17. **Allowed Use**: Precision machining, metal fabrication, warehousing, and ancillary office

### Expected Extraction Structure:

```json
{
  "confidence": {
    "overall": 0.95,
    "financial": 0.98,
    "property": 0.92
  },
  "leaseType": "warehouse-nnn",
  "baseRent": 45000,
  "leaseTerm": 60,
  "squareFootage": 50000,
  "escalationType": "percentage",
  "escalationRate": 0.03,
  "securityDeposit": 90000,
  "cam": 0,
  "taxes": 0,
  "insurance": 0,
  "utilities": 0,
  "parkingSpaces": 60,
  "propertyAddress": "4800 Foundry Park Drive, Livonia, Michigan",
  "leaseStartDate": "2025-02-01",
  "leaseEndDate": "2030-01-31",
  "landlord": "Ironclad Industrial Holdings, LLC",
  "tenant": "Midwest Precision Manufacturing, LLC",
  "allowedUse": "Precision machining, metal fabrication, warehousing, and ancillary office",
  "specialProvisions": [
    "Triple net lease (NNN) - tenant pays 100% of Operating Expenses",
    "3% annual rent escalation on each anniversary",
    "Security deposit: $90,000 or letter of credit",
    "5 year term commencing February 1, 2025",
    "Tenant has exclusive use of 60 parking spaces"
  ]
}
```

### Test Cases:

1. **Basic Field Extraction**: Verifies that key fields (rent, term, square footage, escalation) are correctly extracted and populated into the form
2. **NNN Lease Structure**: Confirms that triple net leases are identified correctly and CAM/taxes/insurance are set to $0
3. **Escalation Parsing**: Ensures "3% annually" is correctly parsed as percentage-based escalation with a 0.03 rate

### Running the Tests:

```bash
cd apps/web
pnpm exec playwright test commercial-real-estate-lease-extraction.spec.ts
```

### Integration with AI Extraction:

The actual AI extraction (`extractLeaseDataWithAI` in `workers/api/src/services/lease-extraction.ts`) should:
1. Receive text from Workers AI `@cf/browsershot/text-extract`
2. Use the LLM to extract structured data matching the above schema
3. Calculate derived fields (lease end date from start + term)
4. Return high-confidence (>90%) data for financial terms




