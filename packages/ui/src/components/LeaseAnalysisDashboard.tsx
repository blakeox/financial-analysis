import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import type { ChangeEvent, DragEvent, MutableRefObject } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './Card';
import { Button } from './Button';
import { Input } from './Input';
import { Select } from './Select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './Tabs';
import type {
  EnhancedLeaseInput,
  EnhancedLeaseAnalysisResult,
  LeaseType,
  EscalationType,
  AdditionalCosts,
  ExtractedLeaseData,
} from '@financial-analysis/analysis';
import { formatCurrency, formatPercentage } from '../lib/formatters';
import { validateFile } from '../lib/validation';
import { useLocalStorage } from '../lib/hooks';
import { parsers } from '../lib/formUtils';

interface LeaseAnalysisDashboardProps {
  onAnalyze?: (result: EnhancedLeaseAnalysisResult) => void;
}

interface SavedAnalysis {
  id: string;
  name: string;
  description: string | undefined;
  formData: LeaseFormData;
  result?: EnhancedLeaseAnalysisResult;
  savedAt: string;
  tags: string[] | undefined;
}

interface LeaseTemplate {
  id: string;
  name: string;
  description: string;
  category: 'office' | 'warehouse' | 'retail' | 'medical' | 'mixed-use';
  formData: Partial<LeaseFormData>;
}

interface LeaseFormData extends Partial<EnhancedLeaseInput> {
  leaseType: LeaseType;
  principal: number;
  termMonths: number;
  additionalCosts?: AdditionalCosts;
}

interface ProgressBarProps {
  value: number;
  max?: number;
  className?: string;
}

function ProgressBar({ value, max = 100, className = '' }: ProgressBarProps) {
  const percentage = Math.min(Math.max((value / max) * 100, 0), 100);

  return (
    <div className={`w-24 bg-gray-200 rounded-full h-2 relative overflow-hidden ${className}`}>
      <div
        className={`absolute top-0 left-0 bg-blue-600 h-2 rounded-full transition-all ${
          percentage >= 90
            ? 'w-full'
            : percentage >= 80
              ? 'w-5/6'
              : percentage >= 70
                ? 'w-4/5'
                : percentage >= 60
                  ? 'w-3/5'
                  : percentage >= 50
                    ? 'w-1/2'
                    : percentage >= 40
                      ? 'w-2/5'
                      : percentage >= 30
                        ? 'w-1/3'
                        : percentage >= 20
                          ? 'w-1/5'
                          : percentage >= 10
                            ? 'w-1/12'
                            : 'w-px'
        }`}
      />
    </div>
  );
}

const calculateScenarioImpact = (baseValue: number, scenarioValue: number) => {
  if (!baseValue) return 0;
  return ((scenarioValue - baseValue) / baseValue) * 100;
};

interface LeaseDocumentUploadProps {
  dragActive: boolean;
  uploadProgress: number;
  uploadedFile: File | null;
  uploading: boolean;
  fileInputRef: MutableRefObject<HTMLInputElement | null>;
  onDragEnter: (event: DragEvent<HTMLDivElement>) => void;
  onDragLeave: (event: DragEvent<HTMLDivElement>) => void;
  onDragOver: (event: DragEvent<HTMLDivElement>) => void;
  onDrop: (event: DragEvent<HTMLDivElement>) => void;
  onFileUpload: (event: ChangeEvent<HTMLInputElement>) => void;
}

function LeaseDocumentUpload({
  dragActive,
  uploadProgress,
  uploadedFile,
  uploading,
  fileInputRef,
  onDragEnter,
  onDragLeave,
  onDragOver,
  onDrop,
  onFileUpload,
}: LeaseDocumentUploadProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">🤖 AI-Powered Document Analysis</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm sm:text-base text-gray-600 dark:text-gray-300 mb-4">
          Upload a lease agreement and let AI extract the key terms automatically, or fill out the
          form manually below.
        </p>

        <div
          className={`relative border-2 border-dashed rounded-lg p-4 sm:p-6 lg:p-8 text-center transition-all duration-200 touch-manipulation ${
            dragActive
              ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 dark:border-blue-400'
              : uploadProgress > 0 && uploadProgress < 100
                ? 'border-yellow-400 bg-yellow-50 dark:bg-yellow-900/20'
                : uploadProgress === 100
                  ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
                  : 'border-gray-300 dark:border-gray-600 hover:border-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/10'
          }`}
          onDragEnter={onDragEnter}
          onDragLeave={onDragLeave}
          onDragOver={onDragOver}
          onDrop={onDrop}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.doc,.docx,.txt"
            onChange={onFileUpload}
            className="hidden"
            disabled={uploading}
            aria-label="Upload lease document"
          />

          {uploadProgress > 0 && uploadProgress < 100 && (
            <div className="absolute top-0 left-0 w-full h-1 bg-gray-200 dark:bg-gray-700 rounded-t-lg overflow-hidden">
              <div
                className={`h-full bg-blue-600 transition-all duration-300 ease-out ${
                  uploadProgress >= 75
                    ? 'w-3/4'
                    : uploadProgress >= 50
                      ? 'w-1/2'
                      : uploadProgress >= 25
                        ? 'w-1/4'
                        : 'w-1/12'
                }`}
              />
            </div>
          )}

          <div className="space-y-4">
            {uploadProgress === 100 ? (
              <div className="text-green-600 dark:text-green-400">
                <svg
                  className="w-12 h-12 mx-auto mb-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <p className="font-medium">Document processed successfully!</p>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  Form populated with extracted data
                </p>
              </div>
            ) : uploadProgress > 0 ? (
              <div className="text-blue-600 dark:text-blue-400">
                <div className="inline-block w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-2" />
                <p className="font-medium">
                  {uploadProgress < 50
                    ? 'Uploading document...'
                    : uploadProgress < 75
                      ? 'Analyzing content...'
                      : 'Extracting lease data...'}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  {uploadProgress}% complete
                </p>
              </div>
            ) : dragActive ? (
              <div className="text-blue-600 dark:text-blue-400">
                <svg
                  className="w-12 h-12 mx-auto mb-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 12l3 3m0 0l3-3m-3 3V9"
                  />
                </svg>
                <p className="font-medium">Drop your lease document here</p>
              </div>
            ) : uploadedFile ? (
              <div className="text-gray-700 dark:text-gray-300">
                <svg
                  className="w-12 h-12 mx-auto mb-2 text-gray-500 dark:text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
                <p className="font-medium">{uploadedFile.name}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {(uploadedFile.size / 1024 / 1024).toFixed(2)} MB
                </p>
              </div>
            ) : (
              <div className="text-gray-500 dark:text-gray-400">
                <svg
                  className="w-12 h-12 mx-auto mb-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                  />
                </svg>
                <p className="font-medium">Drag & drop your lease document here</p>
                <p className="text-sm">or click to browse files</p>
              </div>
            )}

            {!uploading && uploadProgress === 0 && (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="inline-flex items-center px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                  />
                </svg>
                Choose File
              </button>
            )}
          </div>

          <div className="mt-4 text-xs text-gray-500 dark:text-gray-400 flex items-center justify-center">
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            Supports PDF, DOC, DOCX, TXT files up to 10MB
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

interface LeaseExtractionPreviewProps {
  extractedData: ExtractedLeaseData;
  onApply: (data: ExtractedLeaseData) => void;
  onDismiss: () => void;
}

function LeaseExtractionPreview({
  extractedData,
  onApply,
  onDismiss,
}: LeaseExtractionPreviewProps) {
  return (
    <Card className="border-blue-200 bg-blue-50 dark:bg-blue-900/20 dark:border-blue-800">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <svg
              className="w-5 h-5 text-blue-600 dark:text-blue-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            AI Extraction Preview
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onDismiss}
              className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              title="Close preview"
              aria-label="Close extraction preview"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {extractedData.confidence && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 p-3 sm:p-4 bg-white dark:bg-gray-800 rounded-lg">
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {Math.round((extractedData.confidence.overall || 0) * 100)}%
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Overall</div>
              <div
                className={`h-2 rounded-full mt-1 ${
                  (extractedData.confidence.overall || 0) >= 0.8
                    ? 'bg-green-500'
                    : (extractedData.confidence.overall || 0) >= 0.6
                      ? 'bg-yellow-500'
                      : 'bg-red-500'
                }`}
              />
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {Math.round((extractedData.confidence.financial || 0) * 100)}%
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Financial</div>
              <div
                className={`h-2 rounded-full mt-1 ${
                  (extractedData.confidence.financial || 0) >= 0.8
                    ? 'bg-green-500'
                    : (extractedData.confidence.financial || 0) >= 0.6
                      ? 'bg-yellow-500'
                      : 'bg-red-500'
                }`}
              />
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {Math.round((extractedData.confidence.property || 0) * 100)}%
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Property</div>
              <div
                className={`h-2 rounded-full mt-1 ${
                  (extractedData.confidence.property || 0) >= 0.8
                    ? 'bg-green-500'
                    : (extractedData.confidence.property || 0) >= 0.6
                      ? 'bg-yellow-500'
                      : 'bg-red-500'
                }`}
              />
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="space-y-3">
            <h4 className="font-semibold text-gray-900 dark:text-gray-100">Basic Terms</h4>
            <div className="space-y-2 text-sm">
              {extractedData.leaseType && (
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Lease Type:</span>
                  <span className="font-medium">{extractedData.leaseType}</span>
                </div>
              )}
              {extractedData.leaseTerm && (
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Term:</span>
                  <span className="font-medium">{extractedData.leaseTerm} months</span>
                </div>
              )}
              {extractedData.baseRent && (
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Base Rent:</span>
                  <span className="font-medium">
                    ${extractedData.baseRent.toLocaleString()}/month
                  </span>
                </div>
              )}
              {extractedData.squareFootage && (
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Square Footage:</span>
                  <span className="font-medium">
                    {extractedData.squareFootage.toLocaleString()} sq ft
                  </span>
                </div>
              )}
            </div>
          </div>

          <div className="space-y-3">
            <h4 className="font-semibold text-gray-900 dark:text-gray-100">Additional Costs</h4>
            <div className="space-y-2 text-sm">
              {extractedData.cam && (
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">CAM:</span>
                  <span className="font-medium">${extractedData.cam.toLocaleString()}/month</span>
                </div>
              )}
              {extractedData.taxes && (
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Taxes:</span>
                  <span className="font-medium">${extractedData.taxes.toLocaleString()}/month</span>
                </div>
              )}
              {extractedData.insurance && (
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Insurance:</span>
                  <span className="font-medium">
                    ${extractedData.insurance.toLocaleString()}/month
                  </span>
                </div>
              )}
              {extractedData.utilities && (
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Utilities:</span>
                  <span className="font-medium">
                    ${extractedData.utilities.toLocaleString()}/month
                  </span>
                </div>
              )}
              {extractedData.parking && (
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Parking:</span>
                  <span className="font-medium">
                    ${extractedData.parking.toLocaleString()}/month
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        {extractedData.extractedSections &&
          Object.values(extractedData.extractedSections).some((section) => section) && (
            <div className="space-y-3">
              <h4 className="font-semibold text-gray-900 dark:text-gray-100">
                Key Document Sections
              </h4>
              <div className="space-y-3">
                {extractedData.extractedSections.financialTerms && (
                  <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded text-sm">
                    <div className="font-medium text-gray-900 dark:text-gray-100 mb-1">
                      Financial Terms:
                    </div>
                    <div className="text-gray-700 dark:text-gray-300">
                      {extractedData.extractedSections.financialTerms}
                    </div>
                  </div>
                )}
                {extractedData.extractedSections.propertyDescription && (
                  <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded text-sm">
                    <div className="font-medium text-gray-900 dark:text-gray-100 mb-1">
                      Property Description:
                    </div>
                    <div className="text-gray-700 dark:text-gray-300">
                      {extractedData.extractedSections.propertyDescription}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 pt-4 border-t">
          <button
            onClick={() => onApply(extractedData)}
            className="flex-1 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white px-4 py-3 sm:py-2 rounded-lg font-medium transition-colors touch-manipulation"
          >
            Apply to Form
          </button>
          <button
            onClick={onDismiss}
            className="px-4 py-3 sm:py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 active:bg-gray-100 dark:active:bg-gray-600 transition-colors touch-manipulation"
          >
            Dismiss
          </button>
        </div>
      </CardContent>
    </Card>
  );
}

type ScenarioKey = 'optimistic' | 'conservative' | 'pessimistic';

const SCENARIO_THEMES: Record<ScenarioKey, { label: string; container: string; accent: string; heading: string; text: string }> = {
  optimistic: {
    label: 'Optimistic',
    container:
      'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4',
    accent: 'bg-green-500',
    heading: 'text-green-800 dark:text-green-300',
    text: 'text-green-700 dark:text-green-400',
  },
  conservative: {
    label: 'Conservative',
    container:
      'bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4',
    accent: 'bg-blue-500',
    heading: 'text-blue-800 dark:text-blue-300',
    text: 'text-blue-700 dark:text-blue-400',
  },
  pessimistic: {
    label: 'Pessimistic',
    container:
      'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4',
    accent: 'bg-red-500',
    heading: 'text-red-800 dark:text-red-300',
    text: 'text-red-700 dark:text-red-400',
  },
};

interface ScenarioResultCardProps {
  scenarioKey: ScenarioKey;
  result: EnhancedLeaseAnalysisResult | null;
  baseTotalCost?: number | undefined;
}

function ScenarioResultCard({ scenarioKey, result, baseTotalCost }: ScenarioResultCardProps) {
  const theme = SCENARIO_THEMES[scenarioKey];
  const totalCost = result?.metrics?.totalCost;
  const averageMonthly = result?.metrics?.averageMonthlyPayment;
  const totalCostLabel = typeof totalCost === 'number' ? formatCurrency(totalCost) : 'N/A';
  const averageMonthlyLabel =
    typeof averageMonthly === 'number' ? formatCurrency(averageMonthly) : 'N/A';
  const relativeImpact =
    typeof totalCost === 'number' && typeof baseTotalCost === 'number' && baseTotalCost !== 0
      ? `${calculateScenarioImpact(baseTotalCost, totalCost).toFixed(1)}%`
      : 'N/A';

  return (
    <div className={theme.container}>
      <div className="flex items-center mb-3">
        <div className={`h-3 w-3 rounded-full mr-2 ${theme.accent}`} />
        <h4 className={`font-semibold ${theme.heading}`}>{theme.label}</h4>
      </div>
      <div className="space-y-2 text-sm">
        <div className="flex justify-between">
          <span className={theme.text}>Total Cost:</span>
          <span className={`font-medium ${theme.heading}`}>{totalCostLabel}</span>
        </div>
        <div className="flex justify-between">
          <span className={theme.text}>Monthly Avg:</span>
          <span className={`font-medium ${theme.heading}`}>{averageMonthlyLabel}</span>
        </div>
        <div className="flex justify-between">
          <span className={theme.text}>vs Base:</span>
          <span className={`font-medium ${theme.heading}`}>{relativeImpact}</span>
        </div>
      </div>
    </div>
  );
}

type CostMultiplierMap = Partial<Record<keyof AdditionalCosts, number>>;

interface ScenarioConfig {
  escalationMultiplier: number;
  clampEscalationAtZero?: boolean;
  costMultipliers: CostMultiplierMap;
}

const SCENARIO_CONFIGS: Record<ScenarioKey, ScenarioConfig> = {
  optimistic: {
    escalationMultiplier: 0.7,
    clampEscalationAtZero: true,
    costMultipliers: {
      camCharges: 0.9,
      propertyTaxes: 0.9,
      insurance: 0.9,
      utilities: 0.9,
    },
  },
  conservative: {
    escalationMultiplier: 1.1,
    costMultipliers: {
      camCharges: 1.05,
      propertyTaxes: 1.1,
      insurance: 1.05,
      utilities: 1.1,
    },
  },
  pessimistic: {
    escalationMultiplier: 1.5,
    costMultipliers: {
      camCharges: 1.25,
      propertyTaxes: 1.3,
      insurance: 1.2,
      utilities: 1.4,
    },
  },
};

const SCENARIO_ORDER: ScenarioKey[] = ['optimistic', 'conservative', 'pessimistic'];

const SAVED_ANALYSES_STORAGE_KEY = 'lease-analyses';
const SCENARIO_ANALYSIS_ENDPOINT = '/v1/api/analysis/lease';

const applyCostMultipliers = (
  costs: AdditionalCosts | undefined,
  multipliers: CostMultiplierMap
): AdditionalCosts | undefined => {
  if (!costs) return costs;
  const updated: AdditionalCosts = { ...costs };

  (Object.entries(multipliers) as Array<[keyof AdditionalCosts, number]>).forEach(
    ([key, multiplier]) => {
      const current = updated[key];
      if (typeof current === 'number') {
        updated[key] = current * multiplier;
      }
    }
  );

  return updated;
};

const buildScenarioPayload = (base: LeaseFormData, scenarioKey: ScenarioKey): LeaseFormData => {
  const config = SCENARIO_CONFIGS[scenarioKey];
  const baseEscalation = base.escalation;
  const scaledRate = (baseEscalation?.rate || 0) * config.escalationMultiplier;

  const result: LeaseFormData = {
    ...base,
    escalation: baseEscalation
      ? {
          ...baseEscalation,
          rate: config.clampEscalationAtZero ? Math.max(0, scaledRate) : scaledRate,
        }
      : baseEscalation,
  };

  const scaledCosts = applyCostMultipliers(base.additionalCosts, config.costMultipliers);
  if (scaledCosts !== undefined) {
    result.additionalCosts = scaledCosts;
  }

  return result;
};

const buildScenarioPayloads = (base: LeaseFormData): Record<ScenarioKey, LeaseFormData> => ({
  optimistic: buildScenarioPayload(base, 'optimistic'),
  conservative: buildScenarioPayload(base, 'conservative'),
  pessimistic: buildScenarioPayload(base, 'pessimistic'),
});

async function postLeaseScenarioAnalysis(
  payload: LeaseFormData
): Promise<EnhancedLeaseAnalysisResult> {
  const response = await fetch(SCENARIO_ANALYSIS_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  let data: unknown = null;
  try {
    data = await response.json();
  } catch {
    data = null;
  }

  if (!response.ok) {
    const message =
      (data && typeof data === 'object' && 'error' in data
        ? (data as { error?: { message?: string } }).error?.message
        : response.statusText) || 'Scenario analysis failed';
    throw new Error(message);
  }

  return data as EnhancedLeaseAnalysisResult;
}

const defaultFormData: LeaseFormData = {
  leaseType: 'equipment',
  principal: 50000,
  annualRate: 0.05,
  termMonths: 36,
  residualValue: 0,
  baseRent: undefined,
  discountRate: 0.08,
  renewalOptions: [],
  escalation: {
    type: 'none',
    rate: 0,
    schedule: [],
    cpiBase: 0,
  },
  additionalCosts: {
    camCharges: 0,
    propertyTaxes: 0,
    insurance: 0,
    utilities: 0,
    maintenance: 0,
    managementFee: 0,
    // Building-specific costs
    parking: 0,
    security: 0,
    cleaning: 0,
    technology: 0,
    elevatorMaintenance: 0,
    hvacMaintenance: 0,
    landscaping: 0,
    wasteManagement: 0,
  },
  purchaseOption: {
    enabled: false,
    fairMarketValue: false,
  },
  earlyTermination: {
    allowed: false,
    penaltyMonths: 0,
    penaltyAmount: 0,
  },
  securityDeposit: {
    amount: 0,
    interestRate: 0,
  },
  percentageRent: {
    enabled: false,
    percentage: 0,
    breakpoint: 0,
    annualSalesEstimate: 0,
  },
};

export function LeaseAnalysisDashboard({ onAnalyze }: LeaseAnalysisDashboardProps) {
  const [formData, setFormData] = useState<LeaseFormData>(defaultFormData);
  const [result, setResult] = useState<EnhancedLeaseAnalysisResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [dragActive, setDragActive] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [extractedData, setExtractedData] = useState<ExtractedLeaseData | null>(null);
  const [showExtractedPreview, setShowExtractedPreview] = useState(false);
  const [savedAnalyses, setSavedAnalyses] = useLocalStorage<SavedAnalysis[]>(
    SAVED_ANALYSES_STORAGE_KEY,
    []
  );
  const [shareableLinkGenerated, setShareableLinkGenerated] = useState<string | null>(null);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [saveFormName, setSaveFormName] = useState('');
  const [saveFormDescription, setSaveFormDescription] = useState('');
  const [scenarioResults, setScenarioResults] = useState<{
    optimistic: EnhancedLeaseAnalysisResult | null;
    pessimistic: EnhancedLeaseAnalysisResult | null;
    conservative: EnhancedLeaseAnalysisResult | null;
  }>({
    optimistic: null,
    pessimistic: null,
    conservative: null,
  });
  const [showScenarioAnalysis, setShowScenarioAnalysis] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Update form defaults when lease type changes
  useEffect(() => {
    if (formData.leaseType === 'equipment') {
      setFormData((prev) => ({
        ...prev,
        baseRent: undefined,
        annualRate: prev.annualRate || 0.05,
        principal: prev.principal || 50000,
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        baseRent: prev.baseRent || 3000,
        annualRate: 0, // Not used for real estate leases
        principal: 0, // Not used for real estate leases
      }));
    }
  }, [formData.leaseType]);

  const handleInputChange = (field: keyof LeaseFormData, value: unknown) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleNestedInputChange = (
    parentField: keyof LeaseFormData,
    field: string,
    value: unknown
  ) => {
    setFormData((prev) => ({
      ...prev,
      [parentField]: {
        ...((prev[parentField] as Record<string, unknown>) || {}),
        [field]: value,
      },
    }));
  };

  const analyzeLeaseVsBuy = formData.compareAlternatives?.purchasePrice ? true : false;

  const handleAnalyze = async () => {
    setIsAnalyzing(true);
    setError(null);

    try {
      // Call the enhanced lease analysis API
      const response = await fetch('/v1/api/analysis/enhanced-lease', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || 'Analysis failed');
      }

      const analysisResult: EnhancedLeaseAnalysisResult = await response.json();
      setResult(analysisResult);
      onAnalyze?.(analysisResult);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Handle applying extracted data to form
  const applyExtractedData = (data: ExtractedLeaseData) => {
    const updates: Partial<LeaseFormData> = {};

    if (data.leaseType) {
      // Map lease type string to LeaseType enum
      const leaseTypeMap: Record<string, LeaseType> = {
        'office-gross': 'office-gross',
        'office-modified': 'office-modified',
        'office-nnn': 'office-nnn',
        'warehouse-gross': 'warehouse-gross',
        'warehouse-nnn': 'warehouse-nnn',
        'retail-base': 'retail-base',
        'retail-percentage': 'retail-percentage',
        'medical-gross': 'medical-gross',
        'medical-nnn': 'medical-nnn',
        'mixed-use': 'mixed-use',
        'commercial-gross': 'commercial-gross',
        'commercial-nnn': 'commercial-nnn',
        'commercial-modified': 'commercial-modified',
      };
      updates.leaseType = leaseTypeMap[data.leaseType] || 'equipment';
    }

    if (data.leaseTerm) {
      updates.termMonths = data.leaseTerm;
    }

    if (data.baseRent) {
      updates.baseRent = data.baseRent;
    }

    if (data.escalationType && data.escalationRate) {
      updates.escalation = {
        type: data.escalationType as EscalationType,
        rate: data.escalationRate,
        schedule: [],
        cpiBase: 0,
      };
    }

    if (data.securityDeposit) {
      updates.securityDeposit = {
        amount: data.securityDeposit,
        interestRate: 0,
      };
    }

    // Map all additional costs from extraction
    const hasAdditionalCosts = Object.keys(data).some(
      (key) =>
        [
          'cam',
          'taxes',
          'insurance',
          'utilities',
          'maintenance',
          'managementFee',
          'parking',
          'security',
          'cleaning',
          'technology',
          'elevatorMaintenance',
          'hvacMaintenance',
          'landscaping',
          'wasteManagement',
        ].includes(key) && data[key as keyof ExtractedLeaseData] !== undefined
    );

    if (hasAdditionalCosts) {
      const currentCosts = formData.additionalCosts || {
        camCharges: 0,
        propertyTaxes: 0,
        insurance: 0,
        utilities: 0,
        maintenance: 0,
        managementFee: 0,
        parking: 0,
        security: 0,
        cleaning: 0,
        technology: 0,
        elevatorMaintenance: 0,
        hvacMaintenance: 0,
        landscaping: 0,
        wasteManagement: 0,
      };

      updates.additionalCosts = {
        camCharges: data.cam ?? currentCosts.camCharges,
        propertyTaxes: data.taxes ?? currentCosts.propertyTaxes,
        insurance: data.insurance ?? currentCosts.insurance,
        utilities: data.utilities ?? currentCosts.utilities,
        maintenance: data.maintenance ?? currentCosts.maintenance,
        managementFee: data.managementFee ?? currentCosts.managementFee,
        parking: data.parking ?? currentCosts.parking,
        security: data.security ?? currentCosts.security,
        cleaning: data.cleaning ?? currentCosts.cleaning,
        technology: data.technology ?? currentCosts.technology,
        elevatorMaintenance: data.elevatorMaintenance ?? currentCosts.elevatorMaintenance,
        hvacMaintenance: data.hvacMaintenance ?? currentCosts.hvacMaintenance,
        landscaping: data.landscaping ?? currentCosts.landscaping,
        wasteManagement: data.wasteManagement ?? currentCosts.wasteManagement,
      };
    }

    // Apply updates to form
    setFormData((prev) => ({ ...prev, ...updates }));

    // Close preview and clear extracted data
    setShowExtractedPreview(false);
    setExtractedData(null);
    setError(null);
  };

  // Handle dismissing the preview
  const dismissExtractedData = () => {
    setShowExtractedPreview(false);
    setExtractedData(null);
  };

  // Export functions
  const exportToPDF = async () => {
    if (!result) return;

    // Create PDF export using browser's print functionality
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    printWindow.document.write(`
      <html>
        <head>
          <title>Lease Analysis Report</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            h1, h2 { color: #2563eb; }
            .summary { display: grid; grid-template-columns: repeat(2, 1fr); gap: 20px; margin: 20px 0; }
            .metric { text-align: center; padding: 10px; border: 1px solid #e5e7eb; border-radius: 8px; }
            .metric-value { font-size: 24px; font-weight: bold; color: #2563eb; }
            .table { width: 100%; border-collapse: collapse; margin: 20px 0; }
            .table th, .table td { border: 1px solid #e5e7eb; padding: 8px; text-align: left; }
            .table th { background-color: #f3f4f6; }
            .recommendation { background-color: #dbeafe; padding: 15px; border-radius: 8px; margin: 20px 0; }
          </style>
        </head>
        <body>
          <h1>Lease Analysis Report</h1>
          <p>Generated on ${new Date().toLocaleDateString()}</p>
          
          <h2>Financial Summary</h2>
          <div class="summary">
            <div class="metric">
              <div class="metric-value">${formatCurrency(result.metrics.averageMonthlyPayment)}</div>
              <div>Avg Monthly Payment</div>
            </div>
            <div class="metric">
              <div class="metric-value">${formatCurrency(result.metrics.totalCost)}</div>
              <div>Total Cost</div>
            </div>
            <div class="metric">
              <div class="metric-value">${formatCurrency(result.metrics.presentValue)}</div>
              <div>Present Value</div>
            </div>
            <div class="metric">
              <div class="metric-value">${formatPercentage(result.metrics.effectiveAnnualRate)}</div>
              <div>Effective Rate</div>
            </div>
          </div>

          <h2>Risk Assessment</h2>
          <table class="table">
            <tr><td>Flexibility Score</td><td>${result.riskAnalysis.flexibilityScore}/100</td></tr>
            <tr><td>Early Termination Cost</td><td>${formatCurrency(result.riskAnalysis.earlyTerminationCost)}</td></tr>
            <tr><td>Renewal Risk</td><td>${result.riskAnalysis.renewalRisk}</td></tr>
          </table>

          ${
            result.leaseVsBuy
              ? `
            <h2>Lease vs Buy Comparison</h2>
            <div class="recommendation">
              <strong>Recommendation: ${result.leaseVsBuy.recommendation.toUpperCase()}</strong>
            </div>
            <table class="table">
              <tr><th>Option</th><th>Total Cost</th><th>Monthly Payment</th></tr>
              <tr><td>Lease</td><td>${formatCurrency(result.leaseVsBuy.leaseOption.totalCost)}</td><td>${formatCurrency(result.leaseVsBuy.leaseOption.monthlyPayment)}</td></tr>
              <tr><td>Buy</td><td>${formatCurrency(result.leaseVsBuy.buyOption.totalLoanCost)}</td><td>${formatCurrency(result.leaseVsBuy.buyOption.loanPayment)}</td></tr>
            </table>
          `
              : ''
          }

          <h2>Payment Schedule (First 12 Months)</h2>
          <table class="table">
            <tr><th>Month</th><th>Base Payment</th><th>Additional Costs</th><th>Total Payment</th><th>Cumulative</th></tr>
            ${result.schedule
              .slice(0, 12)
              .map(
                (payment) => `
              <tr>
                <td>${payment.month}</td>
                <td>${formatCurrency(payment.escalatedPayment)}</td>
                <td>${formatCurrency(payment.additionalCosts.total)}</td>
                <td>${formatCurrency(payment.totalPayment)}</td>
                <td>${formatCurrency(payment.cumulativePaid)}</td>
              </tr>
            `
              )
              .join('')}
          </table>
        </body>
      </html>
    `);

    printWindow.document.close();
    printWindow.print();
  };

  const exportToCSV = () => {
    if (!result) return;

    const csvData = [
      ['Lease Analysis Report'],
      ['Generated', new Date().toISOString()],
      [''],
      ['Financial Summary'],
      ['Metric', 'Value'],
      ['Average Monthly Payment', result.metrics.averageMonthlyPayment.toString()],
      ['Total Cost', result.metrics.totalCost.toString()],
      ['Present Value', result.metrics.presentValue.toString()],
      ['Effective Annual Rate', result.metrics.effectiveAnnualRate.toString()],
      [''],
      ['Payment Schedule'],
      ['Month', 'Base Payment', 'Additional Costs', 'Total Payment', 'Cumulative Paid'],
      ...result.schedule.map((payment) => [
        payment.month.toString(),
        payment.escalatedPayment.toString(),
        payment.additionalCosts.total.toString(),
        payment.totalPayment.toString(),
        payment.cumulativePaid.toString(),
      ]),
    ];

    const csvContent = csvData.map((row) => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `lease-analysis-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  };

  const exportToJSON = () => {
    if (!result) return;

    const exportData = {
      analysis: result,
      formData: formData,
      generatedAt: new Date().toISOString(),
      version: '1.0',
    };

    const jsonContent = JSON.stringify(exportData, null, 2);
    const blob = new Blob([jsonContent], { type: 'application/json' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `lease-analysis-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  };

  const generateShareableLink = async () => {
    if (!result) return;

    try {
      const shareData = {
        formData: formData,
        result: result,
        timestamp: new Date().toISOString(),
      };

      // Encode the data as base64 for URL sharing
      const encodedData = btoa(JSON.stringify(shareData));
      const shareUrl = `${window.location.origin}${window.location.pathname}?shared=${encodedData}`;

      // Copy to clipboard
      await navigator.clipboard.writeText(shareUrl);
      setShareableLinkGenerated(shareUrl);
    } catch (error) {
      console.error('Failed to generate shareable link:', error);
      alert('Failed to generate shareable link. Please try again.');
    }
  };

  // Lease templates
  const leaseTemplates: LeaseTemplate[] = [
    {
      id: 'office-equipment',
      name: 'Downtown Office Space',
      description: 'Standard office equipment lease with moderate terms',
      category: 'office',
      formData: {
        leaseType: 'equipment',
        principal: 50000,
        annualRate: 0.065,
        termMonths: 60,
        residualValue: 5000,
      },
    },
    {
      id: 'warehouse-equipment',
      name: 'Industrial Warehouse',
      description: 'Heavy equipment and machinery lease for warehouse operations',
      category: 'warehouse',
      formData: {
        leaseType: 'equipment',
        principal: 150000,
        annualRate: 0.055,
        termMonths: 84,
        residualValue: 20000,
      },
    },
    {
      id: 'retail-equipment',
      name: 'Shopping Center Retail',
      description: 'Retail equipment and fixtures lease',
      category: 'retail',
      formData: {
        leaseType: 'equipment',
        principal: 75000,
        annualRate: 0.07,
        termMonths: 48,
        residualValue: 10000,
      },
    },
  ];

  // History and template functions
  const saveAnalysis = (name: string, description?: string, tags?: string[]) => {
    if (!result) return;

    const savedAnalysis: SavedAnalysis = {
      id: crypto.randomUUID(),
      name,
      description,
      formData,
      result,
      savedAt: new Date().toISOString(),
      tags,
    };

    const updated = [...savedAnalyses, savedAnalysis];
    setSavedAnalyses(updated);
  };

  const loadAnalysis = (analysis: SavedAnalysis) => {
    // Force a new object reference to trigger React re-render
    setFormData(() => ({ ...defaultFormData, ...analysis.formData }));
    setResult(analysis.result || null);
  };

  const deleteAnalysis = (id: string) => {
    const updated = savedAnalyses.filter((a) => a.id !== id);
    setSavedAnalyses(updated);
  };

  const loadTemplate = (template: LeaseTemplate) => {
    // Clear any existing results first
    setResult(null);
    // Merge template data with defaults to ensure all required fields are present
    // Force a new object reference to trigger React re-render
    setFormData(() => ({ ...defaultFormData, ...template.formData }));
  };

  // Scenario analysis functions
  const runScenarioAnalysis = async () => {
    if (!result) return;

    try {
      setIsAnalyzing(true);
      setError(null);

      const payloadEntries = Object.entries(buildScenarioPayloads(formData)) as Array<[
        ScenarioKey,
        LeaseFormData
      ]>;

      const analysisEntries = await Promise.all(
        payloadEntries.map(async ([key, payload]) => {
          const analysis = await postLeaseScenarioAnalysis(payload);
          return [key, analysis] as const;
        })
      );

      const nextResults: typeof scenarioResults = {
        optimistic: null,
        pessimistic: null,
        conservative: null,
      };

      analysisEntries.forEach(([key, analysis]) => {
        nextResults[key] = analysis;
      });

      setScenarioResults(nextResults);
      setShowScenarioAnalysis(true);
    } catch (error) {
      console.error('Scenario analysis failed:', error);
      setError(
        error instanceof Error
          ? error.message
          : 'Failed to run scenario analysis. Please try again.'
      );
    } finally {
      setIsAnalyzing(false);
    }
  };

  const scenarioEntries = useMemo(
    () =>
      SCENARIO_ORDER.map(
        (key) => [key, scenarioResults[key]] as [
          ScenarioKey,
          EnhancedLeaseAnalysisResult | null
        ]
      ),
    [scenarioResults]
  );

  const scenarioSummary = useMemo(() => {
    const baseTotalCost =
      typeof result?.metrics?.totalCost === 'number' ? result.metrics.totalCost : null;
    const optimisticTotal =
      typeof scenarioResults.optimistic?.metrics?.totalCost === 'number'
        ? scenarioResults.optimistic.metrics.totalCost
        : null;
    const pessimisticTotal =
      typeof scenarioResults.pessimistic?.metrics?.totalCost === 'number'
        ? scenarioResults.pessimistic.metrics.totalCost
        : null;

    return {
      baseTotalCost,
      optimisticTotal,
      pessimisticTotal,
      riskRangeText:
        optimisticTotal !== null && pessimisticTotal !== null
          ? `$${(pessimisticTotal - optimisticTotal).toLocaleString()} difference`
          : 'N/A',
      bestCaseSavings:
        baseTotalCost !== null && optimisticTotal !== null
          ? `$${(baseTotalCost - optimisticTotal).toLocaleString()}`
          : 'N/A',
      worstCaseImpact:
        baseTotalCost !== null && pessimisticTotal !== null
          ? `+$${(pessimisticTotal - baseTotalCost).toLocaleString()}`
          : 'N/A',
    };
  }, [result, scenarioResults]);

  // Handle drag events
  const handleDrag = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDragIn = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(true);
  }, []);

  const handleDragOut = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
  }, []);

  const processFile = useCallback(async (file: File) => {
    // Validate file
    const validationError = validateFile(file, {
      maxSizeBytes: 10 * 1024 * 1024,
      allowedTypes: [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'text/plain',
      ],
    });
    if (validationError) {
      setError(validationError);
      return;
    }

    setUploading(true);
    setUploadProgress(0);
    setUploadedFile(file);
    setError(null);

    try {
      // Upload file with progress tracking
      setUploadProgress(25);
      const uploadFormData = new FormData();
      uploadFormData.append('file', file);

      const uploadResponse = await fetch('/v1/api/upload/lease', {
        method: 'POST',
        body: uploadFormData,
      });

      if (!uploadResponse.ok) {
        throw new Error('Failed to upload file');
      }

      const uploadResult = await uploadResponse.json();
      setUploadProgress(50);

      // Extract lease data from uploaded document
      const extractResponse = await fetch('/v1/api/extract/lease', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          documentKey: uploadResult.key,
          documentType: 'lease',
          extractionOptions: {
            includeFinancialDetails: true,
            includeLegalTerms: true,
            includePropertyDetails: true,
          },
        }),
      });

      if (!extractResponse.ok) {
        throw new Error('Failed to extract lease data');
      }

      setUploadProgress(75);
      const extractResult = await extractResponse.json();

      if (extractResult.success && extractResult.extractedData) {
        setUploadProgress(100);
        // Store extracted data and show preview
        setExtractedData(extractResult.extractedData);
        setShowExtractedPreview(true);
        // Clear upload state
        setTimeout(() => {
          setUploadProgress(0);
          setUploadedFile(null);
        }, 1000);
      } else {
        throw new Error('No lease data could be extracted from the document');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to process document');
      setUploadProgress(0);
      setUploadedFile(null);
    } finally {
      setUploading(false);
    }
  }, []);

  const handleDrop = useCallback(
    (e: DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.stopPropagation();
      setDragActive(false);

      const file = e.dataTransfer.files?.[0];
      if (file) {
        void processFile(file);
      }
    },
    [processFile]
  );

  const handleFileUpload = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) return;

      void processFile(file);
    },
    [processFile]
  );

  return (
    <div className="space-y-4 lg:space-y-6 p-2 sm:p-4 lg:p-0 overflow-x-hidden">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">🏗️ Enhanced Lease Analysis</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm sm:text-base text-gray-600 dark:text-gray-300">
            Comprehensive lease analysis with escalations, renewal options, purchase analysis, and
            lease vs buy comparisons.
          </p>
        </CardContent>
      </Card>

      <LeaseDocumentUpload
        dragActive={dragActive}
        uploadProgress={uploadProgress}
        uploadedFile={uploadedFile}
        uploading={uploading}
        fileInputRef={fileInputRef}
        onDragEnter={handleDragIn}
        onDragLeave={handleDragOut}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onFileUpload={handleFileUpload}
      />

      {/* AI Extraction Preview */}
      {showExtractedPreview && extractedData && (
        <LeaseExtractionPreview
          extractedData={extractedData}
          onApply={applyExtractedData}
          onDismiss={dismissExtractedData}
        />
      )}

      {/* Scenario Analysis */}
      {result && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <svg
                  className="w-5 h-5 text-purple-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v4m-6 0a2 2 0 002 2h2a2 2 0 002-2V9a2 2 0 012-2h2a2 2 0 012 2v2"
                  />
                </svg>
                Scenario Analysis
              </div>
              <Button
                onClick={runScenarioAnalysis}
                disabled={isAnalyzing}
                className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-md"
              >
                {isAnalyzing ? 'Analyzing...' : 'Run Scenarios'}
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mb-4">
              Compare optimistic, conservative, and pessimistic scenarios based on your current
              lease terms.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Scenario Results */}
      {showScenarioAnalysis && scenarioResults && (
        <Card>
          <CardHeader>
            <CardTitle>Scenario Comparison</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-6 mb-6">
              {scenarioEntries.map(([key, scenarioResult]) => (
                <ScenarioResultCard
                  key={key}
                  scenarioKey={key}
                  result={scenarioResult}
                  baseTotalCost={scenarioSummary.baseTotalCost ?? undefined}
                />
              ))}
            </div>

            {/* Key Insights */}
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
              <h5 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">Key Insights</h5>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 text-sm">
                <div>
                  <span className="text-gray-600 dark:text-gray-400">Risk Range:</span>
                  <span className="ml-2 font-medium text-gray-900 dark:text-gray-100">
                    {scenarioSummary.riskRangeText}
                  </span>
                </div>
                <div>
                  <span className="text-gray-600 dark:text-gray-400">Best Case Savings:</span>
                  <span className="ml-2 font-medium text-green-600 dark:text-green-400">
                    {scenarioSummary.bestCaseSavings}
                  </span>
                </div>
                <div>
                  <span className="text-gray-600 dark:text-gray-400">Worst Case Impact:</span>
                  <span className="ml-2 font-medium text-red-600 dark:text-red-400">
                    {scenarioSummary.worstCaseImpact}
                  </span>
                </div>
                <div>
                  <span className="text-gray-600 dark:text-gray-400">Confidence Level:</span>
                  <span className="ml-2 font-medium text-gray-900 dark:text-gray-100">
                    Medium-High
                  </span>
                </div>
              </div>
            </div>

            <div className="mt-4 flex justify-center sm:justify-end">
              <Button
                onClick={() => setShowScenarioAnalysis(false)}
                variant="outline"
                className="px-4 py-2"
              >
                Close Analysis
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Templates and History Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* Quick Templates */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <svg
                className="w-5 h-5 text-green-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                />
              </svg>
              Quick Start Templates
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {leaseTemplates.slice(0, 3).map((template) => (
                <div
                  key={template.id}
                  className="p-4 sm:p-3 border border-gray-200 dark:border-gray-700 rounded-lg hover:border-blue-300 active:border-blue-400 active:bg-blue-50 dark:active:bg-blue-900/20 cursor-pointer transition-colors touch-manipulation"
                  onClick={() => loadTemplate(template)}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-medium text-gray-900 dark:text-gray-100">
                        {template.name}
                      </h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        {template.description}
                      </p>
                      <div className="flex items-center gap-2 mt-2">
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                          {template.category}
                        </span>
                        <span className="text-xs text-gray-500">
                          {template.formData.baseRent
                            ? `$${template.formData.baseRent.toLocaleString()}/mo`
                            : ''}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              <button
                className="w-full p-3 sm:p-2 text-blue-600 hover:text-blue-700 active:text-blue-800 text-sm font-medium border border-dashed border-blue-300 rounded-lg hover:bg-blue-50 active:bg-blue-100 dark:hover:bg-blue-900/20 dark:active:bg-blue-800/30 transition-colors touch-manipulation"
                disabled
              >
                View All Templates ({leaseTemplates.length})
              </button>
            </div>
          </CardContent>
        </Card>

        {/* Saved Analyses */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <svg
                  className="w-5 h-5 text-purple-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                  />
                </svg>
                Analysis History
              </div>
              {result && (
                <button
                  onClick={() => setShowSaveModal(true)}
                  className="text-sm bg-purple-600 hover:bg-purple-700 text-white px-3 py-1 rounded transition-colors"
                >
                  Save Current
                </button>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {savedAnalyses.length === 0 ? (
                <div className="text-center py-6 text-gray-500 dark:text-gray-400">
                  <svg
                    className="w-12 h-12 mx-auto mb-2 opacity-50"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                  <p className="text-sm">No saved analyses yet</p>
                  <p className="text-xs mt-1">Save your first analysis to see it here</p>
                </div>
              ) : (
                <>
                  {savedAnalyses.slice(0, 3).map((analysis) => (
                    <div
                      key={analysis.id}
                      className="p-4 sm:p-3 border border-gray-200 dark:border-gray-700 rounded-lg hover:border-purple-300 active:border-purple-400 active:bg-purple-50 dark:active:bg-purple-900/20 cursor-pointer transition-colors touch-manipulation"
                      onClick={() => loadAnalysis(analysis)}
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-900 dark:text-gray-100">
                            {analysis.name}
                          </h4>
                          {analysis.description && (
                            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                              {analysis.description}
                            </p>
                          )}
                          <div className="flex items-center gap-2 mt-2">
                            <span className="text-xs text-gray-500">
                              {new Date(analysis.savedAt).toLocaleDateString()}
                            </span>
                            {analysis.result && (
                              <span className="text-xs text-green-600 dark:text-green-400">
                                {analysis.result.metrics.totalCost
                                  ? `$${analysis.result.metrics.totalCost.toLocaleString()}`
                                  : 'Complete'}
                              </span>
                            )}
                          </div>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteAnalysis(analysis.id);
                          }}
                          className="text-gray-400 hover:text-red-600 p-1"
                          title="Delete analysis"
                        >
                          <svg
                            className="w-4 h-4"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                            />
                          </svg>
                        </button>
                      </div>
                    </div>
                  ))}
                  {savedAnalyses.length > 3 && (
                    <button
                      className="w-full p-3 sm:p-2 text-purple-600 hover:text-purple-700 active:text-purple-800 text-sm font-medium border border-dashed border-purple-300 rounded-lg hover:bg-purple-50 active:bg-purple-100 dark:hover:bg-purple-900/20 dark:active:bg-purple-800/30 transition-colors touch-manipulation"
                      disabled
                    >
                      View All Saved ({savedAnalyses.length})
                    </button>
                  )}
                </>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
        {/* Input Form */}
        <div className="space-y-6">
          <Tabs defaultValue="basic" className="w-full">
            <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 gap-1">
              <TabsTrigger value="basic">Basic</TabsTrigger>
              <TabsTrigger value="terms">Terms</TabsTrigger>
              <TabsTrigger value="options">Options</TabsTrigger>
              <TabsTrigger value="compare">Compare</TabsTrigger>
            </TabsList>

            {/* Basic Information */}
            <TabsContent value="basic">
              <Card>
                <CardHeader>
                  <CardTitle>Basic Lease Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Select
                    label="Lease Type"
                    value={formData.leaseType}
                    onChange={(value: string) => handleInputChange('leaseType', value as LeaseType)}
                    options={[
                      { value: 'equipment', label: 'Equipment Lease' },
                      // Office Building Leases
                      { value: 'office-gross', label: 'Office Building - Gross Lease' },
                      { value: 'office-nnn', label: 'Office Building - Triple Net' },
                      { value: 'office-modified', label: 'Office Building - Modified Gross' },
                      // Warehouse/Industrial Building Leases
                      { value: 'warehouse-gross', label: 'Warehouse/Industrial - Gross Lease' },
                      { value: 'warehouse-nnn', label: 'Warehouse/Industrial - Triple Net' },
                      // Retail Building Leases
                      { value: 'retail-base', label: 'Retail Building - Base Rent Only' },
                      { value: 'retail-percentage', label: 'Retail Building - Base + Percentage' },
                      // Medical Building Leases
                      { value: 'medical-gross', label: 'Medical Building - Gross Lease' },
                      { value: 'medical-nnn', label: 'Medical Building - Triple Net' },
                      // Mixed-Use Building Leases
                      { value: 'mixed-use', label: 'Mixed-Use Building' },
                      // Legacy Commercial Types (for backward compatibility)
                      { value: 'commercial-gross', label: 'Commercial - Gross Lease (Legacy)' },
                      { value: 'commercial-nnn', label: 'Commercial - Triple Net (Legacy)' },
                      {
                        value: 'commercial-modified',
                        label: 'Commercial - Modified Gross (Legacy)',
                      },
                    ]}
                  />

                  {formData.leaseType === 'equipment' ? (
                    <>
                      <Input
                        label="Equipment Cost"
                        type="number"
                        value={formData.principal}
                        onChange={(e) => handleInputChange('principal', parsers.number(e.target.value))}
                        min="0"
                        step="1000"
                      />
                      <Input
                        label="Annual Interest Rate"
                        type="number"
                        value={formData.annualRate ? formData.annualRate * 100 : 0}
                        onChange={(e) =>
                          handleInputChange('annualRate', parsers.percentage(e.target.value))
                        }
                        min="0"
                        max="20"
                        step="0.1"
                        placeholder="5.0"
                        helperText="Enter as percentage (e.g., 5.0 for 5%)"
                      />
                      <Input
                        label="Residual Value"
                        type="number"
                        value={formData.residualValue}
                        onChange={(e) => handleInputChange('residualValue', parsers.number(e.target.value))}
                        min="0"
                        step="1000"
                      />
                    </>
                  ) : (
                    <Input
                      label="Monthly Base Rent"
                      type="number"
                      value={formData.baseRent || 0}
                      onChange={(e) => handleInputChange('baseRent', parsers.number(e.target.value))}
                      min="0"
                      step="100"
                    />
                  )}

                  <Input
                    label="Lease Term (Months)"
                    type="number"
                    value={formData.termMonths}
                    onChange={(e) => handleInputChange('termMonths', parsers.number(e.target.value))}
                    min="1"
                    max="360"
                  />

                  <Input
                    label="Discount Rate for NPV"
                    type="number"
                    value={formData.discountRate ? formData.discountRate * 100 : 8}
                    onChange={(e) =>
                      handleInputChange('discountRate', parsers.percentage(e.target.value))
                    }
                    min="0"
                    max="20"
                    step="0.1"
                    placeholder="8.0"
                    helperText="Annual discount rate for present value calculations"
                  />
                </CardContent>
              </Card>
            </TabsContent>

            {/* Lease Terms */}
            <TabsContent value="terms">
              <div className="space-y-4">
                {/* Escalations */}
                <Card>
                  <CardHeader>
                    <CardTitle>Rent Escalations</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <Select
                      label="Escalation Type"
                      value={formData.escalation?.type || 'none'}
                      onChange={(value: string) =>
                        handleNestedInputChange('escalation', 'type', value as EscalationType)
                      }
                      options={[
                        { value: 'none', label: 'No Escalations' },
                        { value: 'fixed', label: 'Fixed Percentage' },
                        { value: 'cpi', label: 'CPI-Based' },
                        { value: 'market', label: 'Market Rate' },
                        { value: 'stepped', label: 'Stepped Increases' },
                      ]}
                    />

                    {formData.escalation?.type !== 'none' && (
                      <Input
                        label="Annual Escalation Rate"
                        type="number"
                        value={formData.escalation?.rate ? formData.escalation.rate * 100 : 0}
                        onChange={(e) =>
                          handleNestedInputChange(
                            'escalation',
                            'rate',
                            parsers.percentage(e.target.value)
                          )
                        }
                        min="0"
                        max="10"
                        step="0.1"
                        helperText="Enter as percentage (e.g., 3.0 for 3%)"
                      />
                    )}
                  </CardContent>
                </Card>

                {/* Additional Costs */}
                {formData.leaseType !== 'equipment' && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Additional Monthly Costs</CardTitle>
                    </CardHeader>
                    <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                      <Input
                        label="CAM Charges"
                        type="number"
                        value={formData.additionalCosts?.camCharges || 0}
                        onChange={(e) =>
                          handleNestedInputChange(
                            'additionalCosts',
                            'camCharges',
                            parsers.number(e.target.value)
                          )
                        }
                        min="0"
                      />
                      <Input
                        label="Property Taxes"
                        type="number"
                        value={formData.additionalCosts?.propertyTaxes || 0}
                        onChange={(e) =>
                          handleNestedInputChange(
                            'additionalCosts',
                            'propertyTaxes',
                            parsers.number(e.target.value)
                          )
                        }
                        min="0"
                      />
                      <Input
                        label="Insurance"
                        type="number"
                        value={formData.additionalCosts?.insurance || 0}
                        onChange={(e) =>
                          handleNestedInputChange(
                            'additionalCosts',
                            'insurance',
                            parsers.number(e.target.value)
                          )
                        }
                        min="0"
                      />
                      <Input
                        label="Utilities"
                        type="number"
                        value={formData.additionalCosts?.utilities || 0}
                        onChange={(e) =>
                          handleNestedInputChange(
                            'additionalCosts',
                            'utilities',
                            parsers.number(e.target.value)
                          )
                        }
                        min="0"
                      />
                      <Input
                        label="Maintenance"
                        type="number"
                        value={formData.additionalCosts?.maintenance || 0}
                        onChange={(e) =>
                          handleNestedInputChange(
                            'additionalCosts',
                            'maintenance',
                            parsers.number(e.target.value)
                          )
                        }
                        min="0"
                      />
                      <Input
                        label="Management Fee"
                        type="number"
                        value={formData.additionalCosts?.managementFee || 0}
                        onChange={(e) =>
                          handleNestedInputChange(
                            'additionalCosts',
                            'managementFee',
                            parsers.number(e.target.value)
                          )
                        }
                        min="0"
                      />

                      {/* Building-Specific Costs */}
                      <Input
                        label="Parking Fees"
                        type="number"
                        value={formData.additionalCosts?.parking || 0}
                        onChange={(e) =>
                          handleNestedInputChange(
                            'additionalCosts',
                            'parking',
                            parsers.number(e.target.value)
                          )
                        }
                        min="0"
                      />
                      <Input
                        label="Security Services"
                        type="number"
                        value={formData.additionalCosts?.security || 0}
                        onChange={(e) =>
                          handleNestedInputChange(
                            'additionalCosts',
                            'security',
                            parsers.number(e.target.value)
                          )
                        }
                        min="0"
                      />
                      <Input
                        label="Cleaning Services"
                        type="number"
                        value={formData.additionalCosts?.cleaning || 0}
                        onChange={(e) =>
                          handleNestedInputChange(
                            'additionalCosts',
                            'cleaning',
                            parsers.number(e.target.value)
                          )
                        }
                        min="0"
                      />
                      <Input
                        label="Technology/Internet"
                        type="number"
                        value={formData.additionalCosts?.technology || 0}
                        onChange={(e) =>
                          handleNestedInputChange(
                            'additionalCosts',
                            'technology',
                            parsers.number(e.target.value)
                          )
                        }
                        min="0"
                      />
                      <Input
                        label="Elevator Maintenance"
                        type="number"
                        value={formData.additionalCosts?.elevatorMaintenance || 0}
                        onChange={(e) =>
                          handleNestedInputChange(
                            'additionalCosts',
                            'elevatorMaintenance',
                            parsers.number(e.target.value)
                          )
                        }
                        min="0"
                      />
                      <Input
                        label="HVAC Maintenance"
                        type="number"
                        value={formData.additionalCosts?.hvacMaintenance || 0}
                        onChange={(e) =>
                          handleNestedInputChange(
                            'additionalCosts',
                            'hvacMaintenance',
                            parsers.number(e.target.value)
                          )
                        }
                        min="0"
                      />
                      <Input
                        label="Landscaping"
                        type="number"
                        value={formData.additionalCosts?.landscaping || 0}
                        onChange={(e) =>
                          handleNestedInputChange(
                            'additionalCosts',
                            'landscaping',
                            parsers.number(e.target.value)
                          )
                        }
                        min="0"
                      />
                      <Input
                        label="Waste Management"
                        type="number"
                        value={formData.additionalCosts?.wasteManagement || 0}
                        onChange={(e) =>
                          handleNestedInputChange(
                            'additionalCosts',
                            'wasteManagement',
                            parsers.number(e.target.value)
                          )
                        }
                        min="0"
                      />
                    </CardContent>
                  </Card>
                )}

                {/* Percentage Rent for Retail */}
                {formData.leaseType === 'retail-percentage' && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Percentage Rent</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <Input
                        label="Percentage Rate"
                        type="number"
                        value={
                          formData.percentageRent?.percentage
                            ? formData.percentageRent.percentage * 100
                            : 0
                        }
                        onChange={(e) =>
                          handleNestedInputChange(
                            'percentageRent',
                            'percentage',
                            parsers.percentage(e.target.value)
                          )
                        }
                        min="0"
                        max="10"
                        step="0.1"
                        helperText="Percentage of gross sales (e.g., 5.0 for 5%)"
                      />
                      <Input
                        label="Annual Sales Breakpoint"
                        type="number"
                        value={formData.percentageRent?.breakpoint || 0}
                        onChange={(e) =>
                          handleNestedInputChange(
                            'percentageRent',
                            'breakpoint',
                            parsers.number(e.target.value)
                          )
                        }
                        min="0"
                        step="10000"
                      />
                      <Input
                        label="Estimated Annual Sales"
                        type="number"
                        value={formData.percentageRent?.annualSalesEstimate || 0}
                        onChange={(e) =>
                          handleNestedInputChange(
                            'percentageRent',
                            'annualSalesEstimate',
                            parsers.number(e.target.value)
                          )
                        }
                        min="0"
                        step="10000"
                      />
                    </CardContent>
                  </Card>
                )}
              </div>
            </TabsContent>

            {/* Options */}
            <TabsContent value="options">
              <div className="space-y-4">
                {/* Purchase Option */}
                <Card>
                  <CardHeader>
                    <CardTitle>Purchase Option</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="purchase-option-enabled"
                        checked={formData.purchaseOption?.enabled || false}
                        onChange={(e) =>
                          handleNestedInputChange('purchaseOption', 'enabled', e.target.checked)
                        }
                        className="rounded border-gray-300"
                      />
                      <label htmlFor="purchase-option-enabled">Enable purchase option</label>
                    </div>

                    {formData.purchaseOption?.enabled && (
                      <>
                        <Input
                          label="Fixed Purchase Price"
                          type="number"
                          value={formData.purchaseOption?.fixedAmount || 0}
                          onChange={(e) =>
                            handleNestedInputChange(
                              'purchaseOption',
                              'fixedAmount',
                              parsers.number(e.target.value)
                            )
                          }
                          min="0"
                          step="1000"
                        />
                        <div className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            id="fair-market-value"
                            checked={formData.purchaseOption?.fairMarketValue || false}
                            onChange={(e) =>
                              handleNestedInputChange(
                                'purchaseOption',
                                'fairMarketValue',
                                e.target.checked
                              )
                            }
                            className="rounded border-gray-300"
                          />
                          <label htmlFor="fair-market-value">Use fair market value option</label>
                        </div>
                      </>
                    )}
                  </CardContent>
                </Card>

                {/* Early Termination */}
                <Card>
                  <CardHeader>
                    <CardTitle>Early Termination</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="early-termination-allowed"
                        checked={formData.earlyTermination?.allowed || false}
                        onChange={(e) =>
                          handleNestedInputChange('earlyTermination', 'allowed', e.target.checked)
                        }
                        className="rounded border-gray-300"
                      />
                      <label htmlFor="early-termination-allowed">Allow early termination</label>
                    </div>

                    {formData.earlyTermination?.allowed && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                        <Input
                          label="Penalty (Months of Rent)"
                          type="number"
                          value={formData.earlyTermination?.penaltyMonths || 0}
                          onChange={(e) =>
                            handleNestedInputChange(
                              'earlyTermination',
                              'penaltyMonths',
                              parsers.number(e.target.value)
                            )
                          }
                          min="0"
                          max="12"
                        />
                        <Input
                          label="Fixed Penalty Amount"
                          type="number"
                          value={formData.earlyTermination?.penaltyAmount || 0}
                          onChange={(e) =>
                            handleNestedInputChange(
                              'earlyTermination',
                              'penaltyAmount',
                              parsers.number(e.target.value)
                            )
                          }
                          min="0"
                          step="1000"
                        />
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Security Deposit */}
                <Card>
                  <CardHeader>
                    <CardTitle>Security Deposit</CardTitle>
                  </CardHeader>
                  <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                    <Input
                      label="Deposit Amount"
                      type="number"
                      value={formData.securityDeposit?.amount || 0}
                      onChange={(e) =>
                        handleNestedInputChange('securityDeposit', 'amount', parsers.number(e.target.value))
                      }
                      min="0"
                      step="1000"
                    />
                    <Input
                      label="Interest Rate"
                      type="number"
                      value={
                        formData.securityDeposit?.interestRate
                          ? formData.securityDeposit.interestRate * 100
                          : 0
                      }
                      onChange={(e) =>
                        handleNestedInputChange(
                          'securityDeposit',
                          'interestRate',
                          parsers.percentage(e.target.value)
                        )
                      }
                      min="0"
                      max="10"
                      step="0.1"
                      helperText="Annual interest rate on deposit"
                    />
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Lease vs Buy Comparison */}
            <TabsContent value="compare">
              <Card>
                <CardHeader>
                  <CardTitle>Lease vs Buy Analysis</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="lease-vs-buy-compare"
                      checked={analyzeLeaseVsBuy}
                      onChange={(e) => {
                        if (e.target.checked) {
                          handleInputChange('compareAlternatives', {
                            purchasePrice: formData.principal || 50000,
                            loanRate: 0.06,
                            loanTermMonths: formData.termMonths,
                          });
                        } else {
                          handleInputChange('compareAlternatives', undefined);
                        }
                      }}
                      className="rounded border-gray-300"
                    />
                    <label htmlFor="lease-vs-buy-compare">Compare with purchase option</label>
                  </div>

                  {analyzeLeaseVsBuy && (
                    <div className="space-y-4">
                      <Input
                        label="Purchase Price"
                        type="number"
                        value={formData.compareAlternatives?.purchasePrice || 0}
                        onChange={(e) =>
                          handleInputChange('compareAlternatives', {
                            ...formData.compareAlternatives,
                            purchasePrice: parsers.number(e.target.value),
                          })
                        }
                        min="0"
                        step="1000"
                      />
                      <Input
                        label="Loan Interest Rate"
                        type="number"
                        value={
                          formData.compareAlternatives?.loanRate
                            ? formData.compareAlternatives.loanRate * 100
                            : 6
                        }
                        onChange={(e) =>
                          handleInputChange('compareAlternatives', {
                            ...formData.compareAlternatives,
                            loanRate: parsers.percentage(e.target.value),
                          })
                        }
                        min="0"
                        max="15"
                        step="0.1"
                        helperText="Annual loan interest rate"
                      />
                      <Input
                        label="Loan Term (Months)"
                        type="number"
                        value={formData.compareAlternatives?.loanTermMonths || formData.termMonths}
                        onChange={(e) =>
                          handleInputChange('compareAlternatives', {
                            ...formData.compareAlternatives,
                            loanTermMonths: parsers.number(e.target.value),
                          })
                        }
                        min="1"
                        max="360"
                      />
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          {/* Analyze Button */}
          <Card>
            <CardContent className="pt-6">
              <Button onClick={handleAnalyze} disabled={isAnalyzing} className="w-full" size="lg">
                {isAnalyzing ? 'Analyzing...' : 'Analyze Lease'}
              </Button>
              {error && <p className="mt-2 text-sm text-red-600 dark:text-red-400">{error}</p>}
            </CardContent>
          </Card>
        </div>

        {/* Results */}
        {result && (
          <div className="space-y-6">
            {/* Financial Summary */}
            <Card>
              <CardHeader>
                <CardTitle>Financial Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                      {formatCurrency(result.metrics.averageMonthlyPayment)}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-300">
                      Avg Monthly Payment
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                      {formatCurrency(result.metrics.totalCost)}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-300">Total Cost</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                      {formatCurrency(result.metrics.presentValue)}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-300">Present Value</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                      {formatPercentage(result.metrics.effectiveAnnualRate)}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-300">Effective Rate</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Risk Analysis */}
            <Card>
              <CardHeader>
                <CardTitle>Risk Analysis</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span>Flexibility Score</span>
                    <div className="flex items-center gap-2">
                      <ProgressBar value={result.riskAnalysis.flexibilityScore} />
                      <span className="text-sm font-medium">
                        {result.riskAnalysis.flexibilityScore}/100
                      </span>
                    </div>
                  </div>
                  <div className="flex justify-between">
                    <span>Early Termination Cost</span>
                    <span className="font-medium">
                      {formatCurrency(result.riskAnalysis.earlyTerminationCost)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Renewal Risk</span>
                    <span
                      className={`font-medium capitalize ${
                        result.riskAnalysis.renewalRisk === 'low'
                          ? 'text-green-600'
                          : result.riskAnalysis.renewalRisk === 'medium'
                            ? 'text-yellow-600'
                            : 'text-red-600'
                      }`}
                    >
                      {result.riskAnalysis.renewalRisk}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Payment Schedule */}
            <Card>
              <CardHeader>
                <CardTitle>Payment Schedule</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-200 dark:border-gray-700">
                        <th className="text-left py-2 px-3">Month</th>
                        <th className="text-right py-2 px-3">Payment</th>
                        <th className="text-right py-2 px-3">Interest</th>
                        <th className="text-right py-2 px-3">Principal</th>
                        <th className="text-right py-2 px-3">Balance</th>
                      </tr>
                    </thead>
                    <tbody>
                      {result.schedule.slice(0, 12).map((payment, idx) => (
                        <tr key={idx} className="border-b border-gray-100 dark:border-gray-800">
                          <td className="py-2 px-3">Month {payment.month}</td>
                          <td className="text-right py-2 px-3">
                            {formatCurrency(payment.totalPayment)}
                          </td>
                          <td className="text-right py-2 px-3">
                            {formatCurrency(payment.interestComponent)}
                          </td>
                          <td className="text-right py-2 px-3">
                            {formatCurrency(payment.principalComponent)}
                          </td>
                          <td className="text-right py-2 px-3">
                            {formatCurrency(payment.remainingBalance)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {result.schedule.length > 12 && (
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-3 text-center">
                      Showing first 12 months of {result.schedule.length} month schedule
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Lease vs Buy Comparison */}
            {result.leaseVsBuy && (
              <Card>
                <CardHeader>
                  <CardTitle>Lease vs Buy Comparison</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div
                      className={`p-4 rounded-lg border-2 ${
                        result.leaseVsBuy.recommendation === 'lease'
                          ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
                          : 'border-gray-300'
                      }`}
                    >
                      <h4 className="font-semibold mb-2">Lease Option</h4>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div>
                          Total Cost: {formatCurrency(result.leaseVsBuy.leaseOption.totalCost)}
                        </div>
                        <div>
                          Monthly Payment:{' '}
                          {formatCurrency(result.leaseVsBuy.leaseOption.monthlyPayment)}
                        </div>
                      </div>
                    </div>

                    <div
                      className={`p-4 rounded-lg border-2 ${
                        result.leaseVsBuy.recommendation === 'buy'
                          ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
                          : 'border-gray-300'
                      }`}
                    >
                      <h4 className="font-semibold mb-2">Buy Option</h4>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div>
                          Total Cost: {formatCurrency(result.leaseVsBuy.buyOption.totalLoanCost)}
                        </div>
                        <div>
                          Monthly Payment: {formatCurrency(result.leaseVsBuy.buyOption.loanPayment)}
                        </div>
                      </div>
                    </div>

                    <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                      <div className="font-semibold text-lg">
                        Recommendation: {result.leaseVsBuy.recommendation.toUpperCase()}
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-300">
                        Potential savings: {formatCurrency(result.leaseVsBuy.savingsAmount)}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Insights & Recommendations */}
            <Card>
              <CardHeader>
                <CardTitle>Insights & Recommendations</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span>Flexibility Rating</span>
                    <span className="font-medium">{result.insights.flexibilityRating}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Effective Rent</span>
                    <span className="font-medium">
                      {formatCurrency(result.insights.effectiveRent)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Total Commitment</span>
                    <span className="font-medium">
                      {formatCurrency(result.insights.totalCommitment)}
                    </span>
                  </div>

                  {result.insights.recommendations.length > 0 && (
                    <div className="mt-4">
                      <h4 className="font-semibold mb-2">Recommendations:</h4>
                      <ul className="space-y-1">
                        {result.insights.recommendations.map((rec, index) => (
                          <li
                            key={index}
                            className="text-sm text-gray-600 dark:text-gray-300 flex items-start gap-2"
                          >
                            <span className="text-blue-500">•</span>
                            {rec}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Enhanced Analysis & Insights */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">💡 AI Analysis & Insights</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {/* Executive Summary */}
                  <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                    <h4 className="font-semibold text-blue-900 dark:text-blue-200 mb-2">
                      Executive Summary
                    </h4>
                    <p className="text-sm text-blue-800 dark:text-blue-300">
                      This {formData.leaseType.replace('-', ' ')} lease for{' '}
                      {formatCurrency(result.metrics.totalCost)}
                      over {formData.termMonths} months represents a{' '}
                      {result.riskAnalysis.renewalRisk === 'low'
                        ? 'low-risk'
                        : result.riskAnalysis.renewalRisk === 'medium'
                          ? 'moderate-risk'
                          : 'high-risk'}{' '}
                      investment with an average monthly cost of{' '}
                      {formatCurrency(result.metrics.averageMonthlyPayment)}.
                      {result.leaseVsBuy?.recommendation && (
                        <>
                          {' '}
                          Based on financial analysis,{' '}
                          {result.leaseVsBuy.recommendation === 'lease'
                            ? 'leasing'
                            : 'purchasing'}{' '}
                          is recommended with significant financial advantages.
                        </>
                      )}
                    </p>
                  </div>

                  {/* Key Financial Metrics */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="text-center p-3 bg-gray-50 dark:bg-gray-800 rounded">
                      <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                        {formatPercentage(result.riskAnalysis.flexibilityScore / 100)}
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        Flexibility Score
                      </div>
                    </div>
                    <div className="text-center p-3 bg-gray-50 dark:bg-gray-800 rounded">
                      <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                        {Math.round(formData.termMonths / 12)} yr
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">Lease Term</div>
                    </div>
                    <div className="text-center p-3 bg-gray-50 dark:bg-gray-800 rounded">
                      <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                        {formatCurrency(result.metrics.costPerYear)}
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">Annual Cost</div>
                    </div>
                  </div>

                  {/* Financial Insights */}
                  <div>
                    <h4 className="font-semibold mb-3">Financial Analysis</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between items-center">
                        <span>Total Cost</span>
                        <span className="font-medium">
                          {formatCurrency(result.metrics.totalCost)}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span>Present Value</span>
                        <span className="font-medium">
                          {formatCurrency(result.metrics.presentValue)}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span>Effective Annual Rate</span>
                        <span className="font-medium">
                          {formatPercentage(result.metrics.effectiveAnnualRate)}
                        </span>
                      </div>
                      {result.escalationSummary && (
                        <div className="flex justify-between items-center">
                          <span>Total Escalations</span>
                          <span className="font-medium text-orange-600">
                            +{formatCurrency(result.escalationSummary.totalEscalations)}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Strategic Recommendations */}
                  <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                    <h4 className="font-semibold text-green-900 dark:text-green-200 mb-2">
                      Strategic Recommendations
                    </h4>
                    <ul className="text-sm text-green-800 dark:text-green-300 space-y-1">
                      {result.riskAnalysis.renewalRisk === 'high' && (
                        <li>• Consider negotiating renewal options due to high renewal risk</li>
                      )}
                      {result.riskAnalysis.flexibilityScore < 50 && (
                        <li>• Low flexibility score suggests limited early termination options</li>
                      )}
                      {result.escalationSummary &&
                        result.escalationSummary.totalEscalations >
                          result.metrics.totalCost * 0.1 && (
                          <li>
                            • Escalations represent significant cost - consider fixed-rate
                            alternatives
                          </li>
                        )}
                      {result.leaseVsBuy?.recommendation === 'buy' && (
                        <li>• Purchase option offers better long-term value than leasing</li>
                      )}
                      {formData.termMonths > 60 && (
                        <li>• Consider break clauses for long-term commitments</li>
                      )}
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Sensitivity Analysis */}
            {result.sensitivity && (
              <Card>
                <CardHeader>
                  <CardTitle>Sensitivity Analysis</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between">
                      <span>1% Rate Increase Impact</span>
                      <span className="font-medium">
                        +{formatCurrency(result.sensitivity.rateIncrease1Percent.totalCostChange)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>6-Month Extension Impact</span>
                      <span className="font-medium">
                        +{formatCurrency(result.sensitivity.termExtension6Months.totalCostChange)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Escalation Rate Change</span>
                      <span className="font-medium">
                        +{formatCurrency(result.sensitivity.escalationRateChange.totalCostChange)}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Export & Sharing Options */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z"
                    />
                  </svg>
                  Export Results
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <button
                    onClick={exportToPDF}
                    className="flex flex-col items-center gap-2 p-4 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    <svg
                      className="w-6 h-6 text-red-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
                      />
                    </svg>
                    <span className="text-sm font-medium">Export PDF</span>
                  </button>

                  <button
                    onClick={exportToCSV}
                    className="flex flex-col items-center gap-2 p-4 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    <svg
                      className="w-6 h-6 text-green-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                      />
                    </svg>
                    <span className="text-sm font-medium">Export CSV</span>
                  </button>

                  <button
                    onClick={exportToJSON}
                    className="flex flex-col items-center gap-2 p-4 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    <svg
                      className="w-6 h-6 text-blue-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"
                      />
                    </svg>
                    <span className="text-sm font-medium">Export JSON</span>
                  </button>

                  <button
                    onClick={generateShareableLink}
                    className="flex flex-col items-center gap-2 p-4 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    <svg
                      className="w-6 h-6 text-purple-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
                      />
                    </svg>
                    <span className="text-sm font-medium">Generate Shareable Link</span>
                  </button>
                </div>

                {shareableLinkGenerated && (
                  <div className="mt-4 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                    <div className="flex items-start gap-2">
                      <svg
                        className="w-5 h-5 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                      <div className="flex-1">
                        <p className="font-medium text-green-800 dark:text-green-200">
                          Shareable Link Generated
                        </p>
                        <p className="text-sm text-green-700 dark:text-green-300 mt-1">
                          Link copied to clipboard!
                        </p>
                        <input
                          type="text"
                          value={shareableLinkGenerated}
                          readOnly
                          title="Shareable link URL"
                          aria-label="Shareable link URL"
                          className="w-full mt-2 px-3 py-2 text-sm bg-white dark:bg-gray-800 border border-green-300 dark:border-green-700 rounded"
                          onClick={(e) => (e.target as HTMLInputElement).select()}
                        />
                      </div>
                      <button
                        onClick={() => setShareableLinkGenerated(null)}
                        className="text-green-600 hover:text-green-700 dark:text-green-400 dark:hover:text-green-300"
                        aria-label="Close shareable link message"
                        title="Close"
                      >
                        <svg
                          className="w-5 h-5"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M6 18L18 6M6 6l12 12"
                          />
                        </svg>
                      </button>
                    </div>
                  </div>
                )}

                <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <div className="flex items-start gap-2">
                    <svg
                      className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    <div className="text-sm text-blue-800 dark:text-blue-200">
                      <p className="font-medium">Export Options:</p>
                      <ul className="list-disc list-inside mt-1 space-y-1">
                        <li>
                          <strong>PDF Report:</strong> Formatted report for printing or sharing
                        </li>
                        <li>
                          <strong>CSV Data:</strong> Raw data for spreadsheet analysis
                        </li>
                        <li>
                          <strong>JSON Export:</strong> Complete analysis data for developers
                        </li>
                        <li>
                          <strong>Share Link:</strong> Generate a shareable URL with your analysis
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      {/* Save Analysis Modal */}
      {showSaveModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100">
              Save Analysis
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Analysis Name
                </label>
                <input
                  type="text"
                  value={saveFormName}
                  onChange={(e) => setSaveFormName(e.target.value)}
                  placeholder="e.g., analysis name"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Description (optional)
                </label>
                <textarea
                  value={saveFormDescription}
                  onChange={(e) => setSaveFormDescription(e.target.value)}
                  placeholder="Add a description..."
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                />
              </div>
              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => {
                    setShowSaveModal(false);
                    setSaveFormName('');
                    setSaveFormDescription('');
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    if (saveFormName.trim()) {
                      saveAnalysis(saveFormName, saveFormDescription);
                      setShowSaveModal(false);
                      setSaveFormName('');
                      setSaveFormDescription('');
                    }
                  }}
                  disabled={!saveFormName.trim()}
                  className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
