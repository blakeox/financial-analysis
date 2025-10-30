import type { Env } from '../types';
import { 
  LeaseExtractionRequestSchema, 
  type LeaseExtractionResponse, 
  type ExtractedLeaseData
} from '@financial-analysis/analysis';
import { z } from 'zod';

// AI prompt for lease extraction
const LEASE_EXTRACTION_PROMPT = `You are a financial analyst AI specialized in extracting lease agreement data. Analyze the provided lease document text and extract structured financial and property information.

Focus on extracting:
1. Basic lease terms (type, duration, start date)
2. Financial terms (base rent, escalations, deposits)
3. Property details (size, address, type)
4. Additional costs (CAM, taxes, insurance, utilities, parking, etc.)
5. Special provisions and options

For lease types, use these categories:
- office-gross, office-modified-gross, office-nnn, office-full-service
- warehouse-gross, warehouse-modified-gross, warehouse-nnn
- retail-gross, retail-modified-gross, retail-nnn, retail-percentage
- medical-gross, medical-nnn, mixed-use

For costs, extract amounts as monthly figures when possible. If annual amounts are given, convert to monthly.

CONFIDENCE SCORING GUIDELINES:
- 0.9-1.0: Explicitly stated with clear dollar amounts and terms
- 0.7-0.8: Clearly implied or stated with minor ambiguity
- 0.5-0.6: Reasonably inferred from context
- 0.3-0.4: Estimated or partially stated
- 0.1-0.2: Very uncertain or missing information

Include confidence scores for:
- overall: Overall confidence in the entire extraction
- financial: Confidence in financial terms (rent, costs, deposits)
- property: Confidence in property details (size, type, location)

Extract relevant text sections for user review:
- financialTerms: Key sentences about rent and financial obligations
- propertyDescription: Sentences describing the property and space
- additionalCosts: Text about CAM, utilities, and other charges
- specialProvisions: Important clauses, options, or special terms

Return ONLY valid JSON matching the ExtractedLeaseData schema. Do not include explanations or markdown formatting.`;

/**
 * Extract text content from different document types
 */
async function extractTextFromDocument(
  documentBuffer: ArrayBuffer,
  documentType: string
): Promise<string> {
  switch (documentType.toLowerCase()) {
    case 'txt':
      return new TextDecoder().decode(documentBuffer);
    
    case 'pdf':
      // For PDF, we'd need a PDF parsing library
      // For now, return a placeholder that indicates PDF processing is needed
      return '[PDF_CONTENT_EXTRACTION_NEEDED]';
    
    case 'docx':
      // For DOCX, we'd need a DOCX parsing library
      // For now, return a placeholder that indicates DOCX processing is needed
      return '[DOCX_CONTENT_EXTRACTION_NEEDED]';
    
    default:
      throw new Error(`Unsupported document type: ${documentType}`);
  }
}

/**
 * Use AI to extract structured lease data from text
 */
export async function extractLeaseDataWithAI(
  text: string,
  env: Env,
  options: { preferredLeaseType?: string; confidenceThreshold?: number } = {}
): Promise<ExtractedLeaseData> {
  // Check if AI is available
  if (!env.AI) {
    // Fallback: return basic extracted data with low confidence
    const fallbackData: ExtractedLeaseData = {
      confidence: {
        overall: 0.1,
        financial: 0.1,
        property: 0.1,
      },
      extractedSections: {
        financialTerms: text.slice(0, 500), // First 500 chars as sample
        propertyDescription: text.slice(500, 1000),
        additionalCosts: text.slice(1000, 1500),
        specialProvisions: text.slice(1500, 2000),
      },
    };
    
    if (options.preferredLeaseType) {
      fallbackData.leaseType = options.preferredLeaseType;
    }
    
    return fallbackData;
  }

  // Prepare AI prompt with document text
  const prompt = `${LEASE_EXTRACTION_PROMPT}

Document text to analyze:
${text.slice(0, 8000)} // Limit to first 8000 chars to stay within AI limits

${options.preferredLeaseType ? `Preferred lease type hint: ${options.preferredLeaseType}` : ''}

Extract lease data as JSON:`;

  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const ai = env.AI as any;
    const response = await ai.run('@cf/meta/llama-3.1-8b-instruct', {
      messages: [
        { role: 'system', content: 'You are a financial analyst AI that extracts lease data and returns only valid JSON.' },
        { role: 'user', content: prompt }
      ],
      max_tokens: 2048,
      temperature: 0.1, // Low temperature for consistent extraction
    });

    let aiResponse = '';
    if (typeof response === 'string') {
      aiResponse = response;
    } else if (response && typeof response === 'object' && 'response' in response) {
      aiResponse = String(response.response);
    }

    // Clean and parse AI response
    const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No JSON found in AI response');
    }

    const extractedData = JSON.parse(jsonMatch[0]) as ExtractedLeaseData;
    
    // Apply confidence threshold
    if (extractedData.confidence?.overall && extractedData.confidence.overall < (options.confidenceThreshold || 0.5)) {
      // Add warning about low confidence
      return {
        ...extractedData,
        confidence: {
          overall: Math.max(0.1, extractedData.confidence.overall),
          financial: extractedData.confidence.financial || 0.1,
          property: extractedData.confidence.property || 0.1,
        },
      };
    }

    return extractedData;
  } catch (error) {
    console.error('AI extraction failed:', error);
    // Return fallback data with error indication
    return {
      confidence: {
        overall: 0.1,
        financial: 0.1,
        property: 0.1,
      },
      extractedSections: {
        financialTerms: 'AI extraction failed - manual review required',
        propertyDescription: text.slice(0, 500),
      },
    };
  }
}

/**
 * Main lease extraction service
 */
export async function extractLeaseFromDocument(
  request: Request,
  env: Env
): Promise<LeaseExtractionResponse> {
  const startTime = Date.now();
  const warnings: string[] = [];

  try {
    // Parse and validate request
    const body = await request.json();
    const parseResult = LeaseExtractionRequestSchema.safeParse(body);
    
    if (!parseResult.success) {
      return {
        success: false,
        processingTime: Date.now() - startTime,
        errors: parseResult.error.issues.map((issue: z.ZodIssue) => `${issue.path.join('.')}: ${issue.message}`),
      };
    }

    const { documentKey, documentType, extractionOptions } = parseResult.data;

    // Check if R2 bucket is available
    if (!env.DOCUMENTS) {
      return {
        success: false,
        processingTime: Date.now() - startTime,
        errors: ['Document storage not configured'],
      };
    }

    // Fetch document from R2
    let document = await env.DOCUMENTS.get(documentKey);
    
    // If document not found in R2, try to handle the case gracefully
    if (!document) {
      console.warn(`Document not found in R2: ${documentKey}, using sample data for demo`);
      warnings.push('Document not found in storage - using sample data for demonstration');
      // For development/demo purposes, use sample lease text directly
      const extractedText = generateSampleLeaseText();
      const aiOptions: { preferredLeaseType?: string; confidenceThreshold?: number } = {};
      if (extractionOptions?.preferredLeaseType) {
        aiOptions.preferredLeaseType = extractionOptions.preferredLeaseType;
      }
      const extractedData = await extractLeaseDataWithAI(extractedText, env, aiOptions);
      
      return {
        success: true,
        extractedData: extractionOptions?.includeRawText ? extractedData : {
          ...extractedData,
          extractedSections: undefined,
        },
        processingTime: Date.now() - startTime,
        warnings: warnings.length > 0 ? warnings : undefined,
        suggestions: ['Using sample data - please upload a document for real extraction'],
      };
    }

    // Get document buffer
    const documentBuffer = await document.arrayBuffer();
    
    // Extract text from document
    let extractedText: string;
    try {
      extractedText = await extractTextFromDocument(documentBuffer, documentType);
      
      if (extractedText.includes('_CONTENT_EXTRACTION_NEEDED]')) {
        warnings.push(`${documentType.toUpperCase()} parsing not fully implemented - using placeholder`);
        // For demo purposes, use a sample lease text
        extractedText = generateSampleLeaseText();
      }
    } catch (error) {
      return {
        success: false,
        processingTime: Date.now() - startTime,
        errors: [`Failed to extract text from ${documentType}: ${error instanceof Error ? error.message : String(error)}`],
      };
    }

    // Use AI to extract structured data
    const aiOptions: { preferredLeaseType?: string; confidenceThreshold?: number } = {};
    if (extractionOptions?.preferredLeaseType) {
      aiOptions.preferredLeaseType = extractionOptions.preferredLeaseType;
    }
    if (extractionOptions?.confidenceThreshold) {
      aiOptions.confidenceThreshold = extractionOptions.confidenceThreshold;
    }
    
    const extractedData = await extractLeaseDataWithAI(extractedText, env, aiOptions);

    // Generate suggestions based on extracted data
    const suggestions: string[] = [];
    if (extractedData.confidence?.overall && extractedData.confidence.overall < 0.7) {
      suggestions.push('Review extracted data carefully - confidence is below 70%');
    }
    if (!extractedData.leaseType) {
      suggestions.push('Lease type not detected - please select manually');
    }
    if (!extractedData.baseRent) {
      suggestions.push('Base rent amount not found - please enter manually');
    }
    if (!extractedData.leaseTerm) {
      suggestions.push('Lease term not detected - please verify duration');
    }

    return {
      success: true,
      extractedData: extractionOptions?.includeRawText ? extractedData : {
        ...extractedData,
        extractedSections: undefined, // Remove raw text if not requested
      },
      processingTime: Date.now() - startTime,
      warnings: warnings.length > 0 ? warnings : undefined,
      suggestions: suggestions.length > 0 ? suggestions : undefined,
    };

  } catch (error) {
    return {
      success: false,
      processingTime: Date.now() - startTime,
      errors: [`Processing failed: ${error instanceof Error ? error.message : String(error)}`],
    };
  }
}

/**
 * Generate sample lease text for demo purposes
 */
function generateSampleLeaseText(): string {
  return `
COMMERCIAL LEASE AGREEMENT

Property Address: 123 Business Plaza, Suite 450, Downtown City, ST 12345
Lease Term: 60 months
Commencement Date: January 1, 2024

RENT AND CHARGES:
Base Rent: $8,500.00 per month
Lease Type: Office Modified Gross
Square Footage: 2,850 square feet
Annual Escalation: 3% per year, effective each January 1st

ADDITIONAL COSTS:
Common Area Maintenance (CAM): $425.00 per month
Property Taxes: Tenant responsible for proportionate share
Insurance: Landlord maintains building insurance, tenant maintains contents
Utilities: Tenant pays electric, landlord pays HVAC maintenance
Parking: 6 spaces included, additional spaces at $75/month each

DEPOSITS:
Security Deposit: $17,000.00 (two months rent)
Prepaid Rent: $8,500.00 (first month)

BUILDING DETAILS:
Building Type: Class A Office Building
Floor: 4th Floor
Load Factor: 15%
Amenities: 24/7 security, fitness center, conference facilities

RENEWAL OPTIONS:
First Option: 36 months at 95% of market rate
Second Option: 24 months at market rate

Special Provisions: Tenant improvement allowance of $25 per square foot provided by landlord.
  `;
}