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
import { cn, textColors } from '../lib/classNames';

// Extend Window interface for analysis results storage
declare global {
  interface Window {
    analysisResults?: Record<string, unknown>;
  }
}

interface LeaseAnalysisDashboardProps {
  onAnalyze?: (result: EnhancedLeaseAnalysisResult) => void;
  hideAnalyzeButton?: boolean;
  hideScenarioCard?: boolean;
  hideAnalysisHistory?: boolean;
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
    <div
      className={cn(
        'relative h-2 w-24 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800',
        className
      )}
    >
      <div
        className={`absolute top-0 left-0 h-2 rounded-full bg-violet-600 transition-all ${
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
  error: string | null;
  fileInputRef: MutableRefObject<HTMLInputElement | null>;
  onDragEnter: (event: DragEvent<HTMLDivElement>) => void;
  onDragLeave: (event: DragEvent<HTMLDivElement>) => void;
  onDragOver: (event: DragEvent<HTMLDivElement>) => void;
  onDrop: (event: DragEvent<HTMLDivElement>) => void;
  onFileUpload: (event: ChangeEvent<HTMLInputElement>) => void;
  onDismissError: () => void;
}

function LeaseDocumentUpload({
  dragActive,
  uploadProgress,
  uploadedFile,
  uploading,
  error,
  fileInputRef,
  onDragEnter,
  onDragLeave,
  onDragOver,
  onDrop,
  onFileUpload,
  onDismissError,
}: LeaseDocumentUploadProps) {
  return (
    <Card variant="interactive">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">🤖 AI-Powered Document Analysis</CardTitle>
      </CardHeader>
      <CardContent>
        <p className={cn('mb-4 text-sm sm:text-base', textColors.secondary)}>
          Upload a lease agreement and let AI extract the key terms automatically. Your document is 
          processed in memory and never stored on our servers. You can also fill out the form manually below.
        </p>

        {/* Error Message */}
        {error && (
          <div className="mb-4 flex items-start gap-3 rounded-2xl border border-rose-200 bg-rose-50/90 p-4 dark:border-rose-900/70 dark:bg-rose-950/30">
            <svg className="mt-0.5 h-5 w-5 flex-shrink-0 text-rose-600 dark:text-rose-300" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            <div className="flex-1">
              <p className="text-sm font-medium text-rose-800 dark:text-rose-200">Upload Failed</p>
              <p className="mt-1 text-sm text-rose-700 dark:text-rose-300">{error}</p>
            </div>
            <Button
              onClick={onDismissError}
              variant="ghost"
              size="sm"
              className="h-9 w-9 rounded-xl px-0 text-rose-600 dark:text-rose-300"
              aria-label="Dismiss error"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </Button>
          </div>
        )}

        <div
          className={`relative rounded-[1.5rem] border-2 border-dashed p-4 text-center transition-all duration-200 touch-manipulation sm:p-6 lg:p-8 ${
            error
              ? 'border-rose-400 bg-rose-50/90 dark:bg-rose-950/20'
              : dragActive
                ? 'border-violet-500 bg-violet-50/90 dark:border-violet-400 dark:bg-violet-950/25'
                : uploadProgress > 0 && uploadProgress < 100
                  ? 'border-amber-400 bg-amber-50/90 dark:bg-amber-950/20'
                  : uploadProgress === 100
                    ? 'border-emerald-500 bg-emerald-50/90 dark:bg-emerald-950/20'
                    : 'border-slate-300 dark:border-slate-700 hover:border-violet-400 hover:bg-violet-50/70 dark:hover:bg-violet-950/10'
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
            <div className="absolute top-0 left-0 h-1 w-full overflow-hidden rounded-t-[1.35rem] bg-slate-200 dark:bg-slate-800">
              <div
                className={`h-full bg-violet-600 transition-all duration-300 ease-out ${
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
              <div className="text-emerald-600 dark:text-emerald-300">
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
                {uploadedFile && (
                  <p className={cn('mt-1 text-xs', textColors.muted)}>
                    {uploadedFile.name}
                  </p>
                )}
                <p className={cn('mt-2 text-sm', textColors.secondary)}>
                  Form populated with extracted data
                </p>
              </div>
            ) : uploadProgress > 0 ? (
              <div className="text-violet-600 dark:text-violet-300">
                <div className="mb-2 inline-block h-12 w-12 animate-spin rounded-full border-4 border-violet-500 border-t-transparent" />
                <p className="font-medium">
                  {uploadProgress < 50
                    ? 'Uploading document...'
                    : uploadProgress < 75
                      ? 'Analyzing content...'
                      : 'Extracting lease data...'}
                </p>
                <p className={cn('text-sm', textColors.secondary)}>
                  {uploadProgress}% complete
                </p>
              </div>
            ) : dragActive ? (
              <div className="text-violet-600 dark:text-violet-300">
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
              <div className="text-slate-700 dark:text-slate-300">
                <svg
                  className="mx-auto mb-2 h-12 w-12 text-slate-500 dark:text-slate-400"
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
                <p className={cn('text-sm', textColors.muted)}>
                  {(uploadedFile.size / 1024 / 1024).toFixed(2)} MB
                </p>
              </div>
            ) : (
              <div className={textColors.muted}>
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
              <Button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="px-6 py-3"
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
              </Button>
            )}
          </div>

          <div className={cn('mt-4 flex items-center justify-center text-xs', textColors.muted)}>
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            Supports PDF, DOC, DOCX, TXT files up to 50MB
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
    <Card
      variant="rail"
      className="border-violet-200 bg-violet-50/70 dark:border-violet-900/70 dark:bg-violet-950/20"
    >
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <svg
              className="w-5 h-5 text-violet-600 dark:text-violet-300"
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
            <Button
              onClick={onDismiss}
              variant="ghost"
              size="sm"
              className="h-9 w-9 rounded-xl px-0"
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
            </Button>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {extractedData.confidence && (
          <div className="grid grid-cols-1 gap-3 rounded-[1.35rem] border border-slate-200/80 bg-white/90 p-3 sm:grid-cols-3 sm:gap-4 sm:p-4 dark:border-slate-800 dark:bg-slate-900/80">
            <div className="text-center">
              <div className="text-2xl font-bold text-slate-900 dark:text-white">
                {Math.round((extractedData.confidence.overall || 0) * 100)}%
              </div>
              <div className={cn('text-sm', textColors.secondary)}>Overall</div>
              <div
                className={`h-2 rounded-full mt-1 ${
                  (extractedData.confidence.overall || 0) >= 0.8
                    ? 'bg-emerald-500'
                    : (extractedData.confidence.overall || 0) >= 0.6
                      ? 'bg-yellow-500'
                      : 'bg-rose-500'
                }`}
              />
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-slate-900 dark:text-white">
                {Math.round((extractedData.confidence.financial || 0) * 100)}%
              </div>
              <div className={cn('text-sm', textColors.secondary)}>Financial</div>
              <div
                className={`h-2 rounded-full mt-1 ${
                  (extractedData.confidence.financial || 0) >= 0.8
                    ? 'bg-emerald-500'
                    : (extractedData.confidence.financial || 0) >= 0.6
                      ? 'bg-yellow-500'
                      : 'bg-rose-500'
                }`}
              />
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-slate-900 dark:text-white">
                {Math.round((extractedData.confidence.property || 0) * 100)}%
              </div>
              <div className={cn('text-sm', textColors.secondary)}>Property</div>
              <div
                className={`h-2 rounded-full mt-1 ${
                  (extractedData.confidence.property || 0) >= 0.8
                    ? 'bg-emerald-500'
                    : (extractedData.confidence.property || 0) >= 0.6
                      ? 'bg-yellow-500'
                      : 'bg-rose-500'
                }`}
              />
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="space-y-3">
            <h4 className="font-semibold text-slate-900 dark:text-white">Basic Terms</h4>
            <div className="space-y-2 text-sm">
              {extractedData.leaseType && (
                <div className="flex justify-between">
                  <span className={textColors.secondary}>Lease Type:</span>
                  <span className="font-medium">{extractedData.leaseType}</span>
                </div>
              )}
              {extractedData.leaseTerm && (
                <div className="flex justify-between">
                  <span className={textColors.secondary}>Term:</span>
                  <span className="font-medium">{extractedData.leaseTerm} months</span>
                </div>
              )}
              {extractedData.baseRent && (
                <div className="flex justify-between">
                  <span className={textColors.secondary}>Base Rent:</span>
                  <span className="font-medium">
                    ${extractedData.baseRent.toLocaleString()}/month
                  </span>
                </div>
              )}
              {extractedData.squareFootage && (
                <div className="flex justify-between">
                  <span className={textColors.secondary}>Square Footage:</span>
                  <span className="font-medium">
                    {extractedData.squareFootage.toLocaleString()} sq ft
                  </span>
                </div>
              )}
            </div>
          </div>

          <div className="space-y-3">
            <h4 className="font-semibold text-slate-900 dark:text-white">Additional Costs</h4>
            <div className="space-y-2 text-sm">
              {extractedData.cam && (
                <div className="flex justify-between">
                  <span className={textColors.secondary}>CAM:</span>
                  <span className="font-medium">${extractedData.cam.toLocaleString()}/month</span>
                </div>
              )}
              {extractedData.taxes && (
                <div className="flex justify-between">
                  <span className={textColors.secondary}>Taxes:</span>
                  <span className="font-medium">${extractedData.taxes.toLocaleString()}/month</span>
                </div>
              )}
              {extractedData.insurance && (
                <div className="flex justify-between">
                  <span className={textColors.secondary}>Insurance:</span>
                  <span className="font-medium">
                    ${extractedData.insurance.toLocaleString()}/month
                  </span>
                </div>
              )}
              {extractedData.utilities && (
                <div className="flex justify-between">
                  <span className={textColors.secondary}>Utilities:</span>
                  <span className="font-medium">
                    ${extractedData.utilities.toLocaleString()}/month
                  </span>
                </div>
              )}
              {extractedData.parking && (
                <div className="flex justify-between">
                  <span className={textColors.secondary}>Parking:</span>
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
              <h4 className="font-semibold text-slate-900 dark:text-white">
                Key Document Sections
              </h4>
              <div className="space-y-3">
                {extractedData.extractedSections.financialTerms && (
                <div className="rounded-2xl border border-slate-200/80 bg-slate-50/85 p-3 text-sm dark:border-slate-800 dark:bg-slate-900/80">
                  <div className="mb-1 font-medium text-slate-900 dark:text-white">
                      Financial Terms:
                    </div>
                  <div className="text-slate-700 dark:text-slate-300">
                      {extractedData.extractedSections.financialTerms}
                    </div>
                  </div>
                )}
                {extractedData.extractedSections.propertyDescription && (
                <div className="rounded-2xl border border-slate-200/80 bg-slate-50/85 p-3 text-sm dark:border-slate-800 dark:bg-slate-900/80">
                  <div className="mb-1 font-medium text-slate-900 dark:text-white">
                      Property Description:
                    </div>
                  <div className="text-slate-700 dark:text-slate-300">
                      {extractedData.extractedSections.propertyDescription}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

        <div className="flex flex-col gap-2 border-t border-slate-200/80 pt-4 sm:flex-row sm:gap-3 dark:border-slate-800">
          <Button
            onClick={() => onApply(extractedData)}
            className="flex-1 px-4 py-3 sm:py-2"
          >
            Apply to Form
          </Button>
          <Button
            onClick={onDismiss}
            variant="outline"
            className="px-4 py-3 sm:py-2"
          >
            Dismiss
          </Button>
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
      'bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800 rounded-lg p-4',
    accent: 'bg-emerald-500',
    heading: 'text-emerald-800 dark:text-emerald-300',
    text: 'text-emerald-700 dark:text-emerald-300',
  },
  conservative: {
    label: 'Conservative',
    container:
      'bg-violet-50 dark:bg-violet-950/20 border border-violet-200 dark:border-violet-800 rounded-lg p-4',
    accent: 'bg-violet-500',
    heading: 'text-violet-800 dark:text-violet-300',
    text: 'text-violet-700 dark:text-violet-300',
  },
  pessimistic: {
    label: 'Pessimistic',
    container:
      'bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-800 rounded-lg p-4',
    accent: 'bg-rose-500',
    heading: 'text-rose-800 dark:text-rose-300',
    text: 'text-rose-700 dark:text-rose-300',
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
const SCENARIO_ANALYSIS_ENDPOINT = '/v1/api/analysis/enhanced-lease';

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
  leaseType: 'warehouse-nnn',
  principal: 0,
  annualRate: 0,
  termMonths: 60,
  residualValue: 0,
  baseRent: 45000,
  discountRate: 0.08,
  renewalOptions: [],
  escalation: {
    type: 'fixed',
    rate: 0.03,
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

export function LeaseAnalysisDashboard({ onAnalyze, hideAnalyzeButton, hideScenarioCard, hideAnalysisHistory }: LeaseAnalysisDashboardProps) {
  const [formData, setFormData] = useState<LeaseFormData>(defaultFormData);
  const [result, setResult] = useState<EnhancedLeaseAnalysisResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showAdvanced, setShowAdvanced] = useState(false);
  // Keep track of previous state to generate change analyses
  const prevFormDataRef = useRef<LeaseFormData | null>(null);
  const prevResultRef = useRef<EnhancedLeaseAnalysisResult | null>(null);
  // Ensure global analysisResults exists for chat context
  useEffect(() => {
    if (typeof window !== 'undefined') {
      if (!window.analysisResults) {
        window.analysisResults = {};
      }
    }
  }, []);
  const [appliedSuccess, setAppliedSuccess] = useState(false);
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
      console.log('🚀 Starting lease analysis with data:', formData);
      
      // Call the enhanced lease analysis API
      const response = await fetch('/v1/api/analysis/enhanced-lease', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      console.log('📡 API Response status:', response.status, response.statusText);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ API Error Response:', errorText);
        let errorData: any;
        try {
          errorData = JSON.parse(errorText);
        } catch {
          errorData = { message: errorText };
        }

        // Capture server-side validation issues for LLM context
        const issues = Array.isArray(errorData?.error?.issues) ? errorData.error.issues : [];
        const issueSummaries = issues.map((i: any) => ({
          path: String(i?.path ?? ''),
          message: String(i?.message ?? ''),
          code: String(i?.code ?? ''),
        }));

        // Build simple suggestions the LLM can use directly
        const suggestions = issueSummaries.map((iss: { path: string; message: string }) => {
          const field = iss.path || 'field';
          if (/baseRent/i.test(field)) return `Set baseRent to a positive number, e.g., 5000`;
          if (/principal/i.test(field)) return `Set principal to a positive number, e.g., 25000`;
          if (/termMonths/i.test(field)) return `Use a whole number of months, e.g., 36 or 60`;
          if (/annualRate|discountRate/i.test(field)) return `Enter a percentage between 0 and 100, e.g., 5.0`;
          if (/escalation\.type/i.test(field)) return `Choose one of: none, fixed, cpi, market, stepped`;
          return `Adjust ${field} to satisfy: ${iss.message}`;
        });

        if (typeof window !== 'undefined') {
          if (!window.analysisResults) window.analysisResults = {};
          window.analysisResults['analysis_errors'] = {
            message: errorData?.error?.message || errorData?.message || 'Analysis failed',
            issues: issueSummaries,
            suggestions,
            lastInput: formData,
          };
          window.dispatchEvent(
            new CustomEvent('analysis-result-updated', {
              detail: { toolName: 'analysis_errors', result: window.analysisResults['analysis_errors'] },
            })
          );
        }

        const firstIssue = issues?.[0]?.message;
        const composed = firstIssue
          ? `${errorData.error?.message || 'Validation error'}: ${firstIssue}`
          : errorData.error?.message || errorData.message || 'Analysis failed';
        throw new Error(composed);
      }

      const analysisResult: EnhancedLeaseAnalysisResult = await response.json();
      console.log('✅ Analysis result received:', analysisResult);
      setResult(analysisResult);

      // Build change analysis vs previous run
      const previousInput = prevFormDataRef.current;
      const previousResult = prevResultRef.current;
      if (previousInput && previousResult) {
        const changedFields: Array<{ field: string; before: unknown; after: unknown }> = [];
        const collectChanges = (a: Record<string, unknown>, b: Record<string, unknown>, prefix = '') => {
          const keys = new Set([...Object.keys(a || {}), ...Object.keys(b || {})]);
          keys.forEach((k) => {
            const key = prefix ? `${prefix}.${k}` : k;
            const av = (a as any)?.[k];
            const bv = (b as any)?.[k];
            const bothObjects = av && bv && typeof av === 'object' && typeof bv === 'object';
            if (bothObjects && !Array.isArray(av) && !Array.isArray(bv)) {
              collectChanges(av as Record<string, unknown>, bv as Record<string, unknown>, key);
            } else if (JSON.stringify(av) !== JSON.stringify(bv)) {
              changedFields.push({ field: key, before: av, after: bv });
            }
          });
        };
        collectChanges(previousInput as unknown as Record<string, unknown>, formData as unknown as Record<string, unknown>);

        const metricDelta = (name: keyof typeof analysisResult.metrics) => {
          const before = previousResult.metrics?.[name] as number | undefined;
          const after = analysisResult.metrics?.[name] as number | undefined;
          return before !== undefined && after !== undefined
            ? { before, after, delta: after - before, deltaPct: before !== 0 ? (after - before) / before : null }
            : undefined;
        };

        const deltas = {
          totalCost: metricDelta('totalCost'),
          presentValue: metricDelta('presentValue'),
          effectiveAnnualRate: metricDelta('effectiveAnnualRate'),
          averageMonthly: metricDelta('averageMonthlyPayment'),
        } as const;

        const narrativeParts: string[] = [];
        if (changedFields.length > 0) {
          const firstFew = changedFields.slice(0, 5).map((c) => `${c.field}: ${String(c.before)} → ${String(c.after)}`);
          narrativeParts.push(`Inputs changed (${changedFields.length}): ${firstFew.join('; ')}${changedFields.length > 5 ? '…' : ''}`);
        }
        const addMetricLine = (label: string, d?: { before: number; after: number; delta: number; deltaPct: number | null }) => {
          if (!d) return;
          const pct = d.deltaPct == null ? '' : ` (${(d.deltaPct * 100).toFixed(2)}%)`;
          narrativeParts.push(`${label}: ${d.before.toLocaleString()} → ${d.after.toLocaleString()} (Δ ${d.delta.toLocaleString()}${pct})`);
        };
        addMetricLine('Total Cost', deltas.totalCost as any);
        addMetricLine('Present Value', deltas.presentValue as any);
        addMetricLine('Effective Annual Rate', deltas.effectiveAnnualRate as any);
        addMetricLine('Average Monthly', deltas.averageMonthly as any);

        const changeReport = {
          changedFields,
          deltas,
          summary: narrativeParts.join(' | '),
          previousInput,
          previousResult,
          currentInput: formData,
          currentResult: analysisResult,
          timestamp: new Date().toISOString(),
        };

        if (typeof window !== 'undefined') {
          if (!window.analysisResults) window.analysisResults = {};
          window.analysisResults['analysis_change_report'] = changeReport;
          window.dispatchEvent(new CustomEvent('analysis-result-updated', {
            detail: { toolName: 'analysis_change_report', result: changeReport }
          }));
        }
      }

      // Update previous snapshots
      prevFormDataRef.current = { ...formData };
      prevResultRef.current = analysisResult;
      
      // Store result for chat panel integration
      if (typeof window !== 'undefined' && window.analysisResults) {
        window.analysisResults['analyze_lease'] = analysisResult;
        window.dispatchEvent(new CustomEvent('analysis-result-updated', {
          detail: { toolName: 'analyze_lease', result: analysisResult }
        }));
      }
      
      onAnalyze?.(analysisResult);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Auto-run analysis on initial load and when form changes (debounced)
  useEffect(() => {
    const controller = new AbortController();
    const timeout = setTimeout(() => {
      // Avoid overlapping requests
      if (!isAnalyzing) {
        void handleAnalyze();
      }
    }, 500);
    return () => {
      controller.abort();
      clearTimeout(timeout);
    };
  }, [formData.leaseType, formData.principal, formData.baseRent, formData.termMonths, formData.annualRate, formData.residualValue, formData.discountRate, formData.escalation, formData.additionalCosts, formData.securityDeposit, formData.buildingSpace, formData.percentageRent, formData.compareAlternatives]);

  // Handle applying extracted data to form
  const applyExtractedData = useCallback((data: ExtractedLeaseData) => {
    console.log('📝 Applying extracted data to form:', data);
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
      // Normalize extracted escalation type to schema-supported values
      const normalizeEscalationType = (t: string): EscalationType => {
        const lower = t.toLowerCase();
        if (lower === 'percentage' || lower === 'percent' || lower === 'fixed-percentage') return 'fixed';
        if (lower === 'none') return 'none';
        if (lower === 'cpi' || lower === 'cpi-based') return 'cpi';
        if (lower === 'market' || lower === 'market-rate') return 'market';
        if (lower === 'stepped' || lower === 'step' || lower === 'step-up') return 'stepped';
        return 'fixed';
      };

      updates.escalation = {
        type: normalizeEscalationType(String(data.escalationType)),
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
    setFormData((prev) => {
      const newData = { ...prev, ...updates };
      console.log('✅ Form data updated:', newData);
      return newData;
    });

    // Show success feedback
    setError(null);
    setAppliedSuccess(true);
    
    // Close preview and clear extracted data after brief delay to show success
    setTimeout(() => {
      setShowExtractedPreview(false);
      setExtractedData(null);
      console.log('✅ Applied to form - closing preview');
    }, 500);
    
    // Clear success message after 3 seconds
    setTimeout(() => {
      setAppliedSuccess(false);
    }, 3000);
    
    // Scroll to form after delay
    setTimeout(() => {
      const formElement = document.querySelector('[data-form-section="main"]');
      if (formElement) {
        formElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 600);
  }, [formData]);

  // Handle dismissing the preview
  const dismissExtractedData = () => {
    setShowExtractedPreview(false);
    setExtractedData(null);
    // Reset upload state when user dismisses the preview
    setUploadProgress(0);
    setUploadedFile(null);
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

  // Lease templates - Commercial Real Estate Focus
  const leaseTemplates: LeaseTemplate[] = [
    // Commercial Real Estate Lease Templates
    {
      id: 'warehouse-nnn-template',
      name: 'Industrial Warehouse NNN',
      description: 'Triple net warehouse/industrial lease with full CAM responsibility',
      category: 'warehouse',
      formData: {
        leaseType: 'warehouse-nnn',
        baseRent: 45000,
        termMonths: 60,
        annualRate: 0.05,
        principal: 0,
        residualValue: 0,
        escalation: {
          type: 'fixed',
          rate: 0.03,
          schedule: [],
          cpiBase: 0,
        },
        additionalCosts: {
          camCharges: 5000,
          propertyTaxes: 3000,
          insurance: 1500,
          utilities: 2000,
          maintenance: 1000,
          managementFee: 500,
          parking: 0,
          security: 500,
          cleaning: 300,
          technology: 200,
          elevatorMaintenance: 0,
          hvacMaintenance: 1200,
          landscaping: 400,
          wasteManagement: 600,
        },
        securityDeposit: {
          amount: 90000,
          interestRate: 0,
        },
        buildingSpace: {
          squareFeet: 50000,
          usableSquareFeet: 47500,
          loadFactor: 1.05,
          pricePerSquareFoot: 10.80,
          floors: ['1'],
          parkingSpaces: 60,
          exclusiveAreas: ['Loading docks', 'Storage area'],
          zoningType: 'Industrial',
          permittedUses: ['Manufacturing', 'Warehousing', 'Distribution'],
        },
      },
    },
    {
      id: 'office-nnn-template',
      name: 'Office Building NNN',
      description: 'Triple net office lease for professional services',
      category: 'office',
      formData: {
        leaseType: 'office-nnn',
        baseRent: 12000,
        termMonths: 60,
        annualRate: 0.05,
        principal: 0,
        residualValue: 0,
        escalation: {
          type: 'fixed',
          rate: 0.025,
          schedule: [],
          cpiBase: 0,
        },
        additionalCosts: {
          camCharges: 3000,
          propertyTaxes: 2000,
          insurance: 800,
          utilities: 1500,
          maintenance: 600,
          managementFee: 400,
          parking: 800,
          security: 0,
          cleaning: 500,
          technology: 300,
          elevatorMaintenance: 200,
          hvacMaintenance: 800,
          landscaping: 200,
          wasteManagement: 100,
        },
        securityDeposit: {
          amount: 24000,
          interestRate: 0,
        },
        buildingSpace: {
          squareFeet: 3000,
          usableSquareFeet: 2700,
          loadFactor: 1.11,
          pricePerSquareFoot: 48,
          floors: ['3'],
          parkingSpaces: 10,
          exclusiveAreas: ['Reception'],
          zoningType: 'Office',
          permittedUses: ['Professional services', 'Office use only'],
        },
      },
    },
    {
      id: 'retail-percentage-template',
      name: 'Retail Base + Percentage',
      description: 'Retail lease with base rent and percentage rent over breakpoint',
      category: 'retail',
      formData: {
        leaseType: 'retail-percentage',
        baseRent: 8000,
        termMonths: 60,
        annualRate: 0.05,
        principal: 0,
        residualValue: 0,
        escalation: {
          type: 'fixed',
          rate: 0.025,
          schedule: [],
          cpiBase: 0,
        },
        additionalCosts: {
          camCharges: 2000,
          propertyTaxes: 1500,
          insurance: 600,
          utilities: 800,
          maintenance: 400,
          managementFee: 300,
          parking: 0,
          security: 0,
          cleaning: 0,
          technology: 200,
          elevatorMaintenance: 0,
          hvacMaintenance: 400,
          landscaping: 100,
          wasteManagement: 100,
        },
        percentageRent: {
          enabled: true,
          percentage: 0.06,
          breakpoint: 1600000,
          annualSalesEstimate: 2400000,
        },
        securityDeposit: {
          amount: 20000,
          interestRate: 0,
        },
        buildingSpace: {
          squareFeet: 2500,
          usableSquareFeet: 2300,
          loadFactor: 1.087,
          pricePerSquareFoot: 38.40,
          floors: ['G'],
          parkingSpaces: 0,
          exclusiveAreas: ['Storage room'],
          zoningType: 'Commercial',
          permittedUses: ['Retail sales', 'Restaurant', 'Customer service'],
        },
      },
    },
    {
      id: 'medical-office-template',
      name: 'Medical Office Building',
      description: 'Medical office lease with specialized HVAC and parking requirements',
      category: 'medical',
      formData: {
        leaseType: 'medical-nnn',
        baseRent: 15000,
        termMonths: 60,
        annualRate: 0.05,
        principal: 0,
        residualValue: 0,
        escalation: {
          type: 'fixed',
          rate: 0.03,
          schedule: [],
          cpiBase: 0,
        },
        additionalCosts: {
          camCharges: 4000,
          propertyTaxes: 2500,
          insurance: 1200,
          utilities: 2500,
          maintenance: 800,
          managementFee: 500,
          parking: 1200,
          security: 600,
          cleaning: 800,
          technology: 400,
          elevatorMaintenance: 300,
          hvacMaintenance: 1500,
          landscaping: 300,
          wasteManagement: 200,
        },
        securityDeposit: {
          amount: 30000,
          interestRate: 0,
        },
        buildingSpace: {
          squareFeet: 3500,
          usableSquareFeet: 3150,
          loadFactor: 1.11,
          pricePerSquareFoot: 51.43,
          floors: ['2'],
          parkingSpaces: 14,
          exclusiveAreas: ['Waiting room', 'Storage'],
          zoningType: 'Medical',
          permittedUses: ['Medical practice', 'Healthcare services'],
        },
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
    // Validate file - increased to 50MB for larger lease documents
    const validationError = validateFile(file, {
      maxSizeBytes: 50 * 1024 * 1024, // 50MB
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
      // Process file client-side - no server storage
      setUploadProgress(25);
      console.log('Processing file:', file.name, 'Size:', file.size);
      
      // Read file as text (for now, supporting TXT files)
      // For PDF/DOCX, we'll need additional libraries or send to extract endpoint
      const fileExtension = file.name.split('.').pop()?.toLowerCase() || 'txt';
      let fileText = '';
      
      if (fileExtension === 'txt') {
        fileText = await file.text();
      } else {
        // For PDF/DOCX, convert to base64 and send to extraction API
        setUploadProgress(50);
        const fileArrayBuffer = await file.arrayBuffer();
        
        // Convert ArrayBuffer to base64 efficiently for large files
        const uint8Array = new Uint8Array(fileArrayBuffer);
        let binary = '';
        const chunkSize = 8192; // Process in 8KB chunks to avoid stack overflow
        for (let i = 0; i < uint8Array.length; i += chunkSize) {
          const chunk = uint8Array.subarray(i, i + chunkSize);
          binary += String.fromCharCode.apply(null, Array.from(chunk));
        }
        const fileBase64 = btoa(binary);
        
        // Send file directly to extraction endpoint without storing
        const extractResponse = await fetch('/v1/api/extract/lease-direct', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            fileData: fileBase64,
            fileName: file.name,
            fileType: file.type,
            documentType: fileExtension,
            extractionOptions: {
              includeFinancialDetails: true,
              includeLegalTerms: true,
              includePropertyDetails: true,
            },
          }),
        });
        
        if (!extractResponse.ok) {
          const errorText = await extractResponse.text();
          console.error('Extraction failed:', errorText);
          throw new Error(`Failed to extract lease data: ${errorText}`);
        }
        
        const extractResult = await extractResponse.json();
        console.log('Extraction result:', extractResult);
        
      if (extractResult.success && extractResult.extractedData) {
        setUploadProgress(100);
        setExtractedData(extractResult.extractedData);
        // Automatically apply to form without showing preview
        applyExtractedData(extractResult.extractedData);
        setShowExtractedPreview(false);
        // Store extraction context for chat
        if (typeof window !== 'undefined') {
          if (!window.analysisResults) window.analysisResults = {};
          window.analysisResults['lease_extracted'] = extractResult.extractedData;
          window.dispatchEvent(new CustomEvent('analysis-result-updated', {
            detail: { toolName: 'lease_extracted', result: extractResult.extractedData }
          }));
        }
        // Keep upload state visible to show success - don't reset
        return;
        } else {
          throw new Error(extractResult.errors ? extractResult.errors.join(', ') : 'No lease data could be extracted');
        }
      }
      
      // For TXT files, process directly
      setUploadProgress(75);
      console.log('Processing TXT file content');
      
      // Extract lease data from text using AI
      const extractResponse = await fetch('/v1/api/extract/lease-text', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: fileText,
          extractionOptions: {
            includeFinancialDetails: true,
            includeLegalTerms: true,
            includePropertyDetails: true,
          },
        }),
      });
      
      if (!extractResponse.ok) {
        const errorText = await extractResponse.text();
        console.error('Extraction failed:', errorText);
        throw new Error(`Failed to extract lease data: ${errorText}`);
      }
      
      const extractResult = await extractResponse.json();
      console.log('Extraction result:', extractResult);
      
      if (extractResult.success && extractResult.extractedData) {
        setUploadProgress(100);
        setExtractedData(extractResult.extractedData);
        // Automatically apply to form without showing preview
        applyExtractedData(extractResult.extractedData);
        setShowExtractedPreview(false);
        // Store extraction context for chat
        if (typeof window !== 'undefined') {
          if (!window.analysisResults) window.analysisResults = {};
          window.analysisResults['lease_extracted'] = extractResult.extractedData;
          if (fileText) {
            window.analysisResults['lease_document_text'] = fileText;
          }
          // If raw text present in extraction, also store it
          if (extractResult.extractedData && (extractResult.extractedData as any).extractedSections) {
            const sections = (extractResult.extractedData as any).extractedSections;
            const joined = Object.values(sections || {}).filter(Boolean).join('\n\n');
            if (joined) {
              window.analysisResults['lease_document_text'] = joined;
            }
          }
          window.dispatchEvent(new CustomEvent('analysis-result-updated', {
            detail: { toolName: 'lease_extracted', result: extractResult.extractedData }
          }));
        }
        // Keep upload state visible to show success - don't reset
      } else {
        throw new Error(extractResult.errors ? extractResult.errors.join(', ') : 'No lease data could be extracted');
      }
    } catch (err) {
      console.error('Document processing error:', err);
      setError(err instanceof Error ? err.message : 'Failed to process document');
      setUploadProgress(0);
      setUploadedFile(null);
    } finally {
      setUploading(false);
    }
  }, [applyExtractedData]);

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
          <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300">
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
        error={error}
        fileInputRef={fileInputRef}
        onDragEnter={handleDragIn}
        onDragLeave={handleDragOut}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onFileUpload={handleFileUpload}
        onDismissError={() => setError(null)}
      />

      {/* AI Extraction Preview - Hidden since we auto-apply */}
      {false && showExtractedPreview && extractedData && (
        <LeaseExtractionPreview
          extractedData={extractedData as ExtractedLeaseData}
          onApply={applyExtractedData}
          onDismiss={dismissExtractedData}
        />
      )}

      {/* Scenario Analysis */}
      {result && !hideScenarioCard && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <svg
                  className="w-5 h-5 text-violet-600"
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
                className="rounded-md bg-violet-600 px-4 py-2 text-white hover:bg-violet-700"
              >
                {isAnalyzing ? 'Analyzing...' : 'Run Scenarios'}
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mb-4">
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
            <div className="bg-slate-50 dark:bg-slate-900/60 rounded-lg p-4">
              <h5 className="font-semibold text-slate-900 dark:text-white mb-2">Key Insights</h5>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 text-sm">
                <div>
                  <span className="text-slate-600 dark:text-slate-400">Risk Range:</span>
                  <span className="ml-2 font-medium text-slate-900 dark:text-white">
                    {scenarioSummary.riskRangeText}
                  </span>
                </div>
                <div>
                  <span className="text-slate-600 dark:text-slate-400">Best Case Savings:</span>
                  <span className="ml-2 font-medium text-emerald-600 dark:text-emerald-300">
                    {scenarioSummary.bestCaseSavings}
                  </span>
                </div>
                <div>
                  <span className="text-slate-600 dark:text-slate-400">Worst Case Impact:</span>
                  <span className="ml-2 font-medium text-rose-600 dark:text-rose-300">
                    {scenarioSummary.worstCaseImpact}
                  </span>
                </div>
                <div>
                  <span className="text-slate-600 dark:text-slate-400">Confidence Level:</span>
                  <span className="ml-2 font-medium text-slate-900 dark:text-white">
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
                className="w-5 h-5 text-emerald-600"
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
                  className="p-4 sm:p-3 border border-slate-200 dark:border-slate-800 rounded-lg hover:border-violet-300 active:border-violet-400 active:bg-violet-50 dark:active:bg-violet-900/20 cursor-pointer transition-colors touch-manipulation"
                  onClick={() => loadTemplate(template)}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-medium text-slate-900 dark:text-white">
                        {template.name}
                      </h4>
                      <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                        {template.description}
                      </p>
                      <div className="flex items-center gap-2 mt-2">
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-violet-100 text-violet-800 dark:bg-violet-900 dark:text-violet-200">
                          {template.category}
                        </span>
                        <span className="text-xs text-slate-500">
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
                className="w-full p-3 sm:p-2 text-violet-600 hover:text-violet-700 active:text-violet-800 text-sm font-medium border border-dashed border-violet-300 rounded-lg hover:bg-violet-50 active:bg-violet-100 dark:hover:bg-violet-900/20 dark:active:bg-violet-800/30 transition-colors touch-manipulation"
                disabled
              >
                View All Templates ({leaseTemplates.length})
              </button>
            </div>
          </CardContent>
        </Card>

        {/* Saved Analyses */}
        {!hideAnalysisHistory && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <svg
                  className="w-5 h-5 text-violet-600"
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
                  className="rounded bg-violet-600 px-3 py-1 text-sm text-white transition-colors hover:bg-violet-700"
                >
                  Save Current
                </button>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {savedAnalyses.length === 0 ? (
                <div className="text-center py-6 text-slate-500 dark:text-slate-400">
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
                      className="cursor-pointer rounded-lg border border-slate-200 p-4 transition-colors touch-manipulation hover:border-violet-300 active:border-violet-400 active:bg-violet-50 dark:border-slate-800 dark:active:bg-violet-900/20 sm:p-3"
                      onClick={() => loadAnalysis(analysis)}
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <h4 className="font-medium text-slate-900 dark:text-white">
                            {analysis.name}
                          </h4>
                          {analysis.description && (
                            <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                              {analysis.description}
                            </p>
                          )}
                          <div className="flex items-center gap-2 mt-2">
                            <span className="text-xs text-slate-500">
                              {new Date(analysis.savedAt).toLocaleDateString()}
                            </span>
                            {analysis.result && (
                              <span className="text-xs text-emerald-600 dark:text-emerald-300">
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
                          className="text-slate-400 hover:text-rose-600 p-1"
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
                      className="w-full p-3 sm:p-2 text-violet-600 hover:text-violet-700 active:text-violet-800 text-sm font-medium border border-dashed border-violet-300 rounded-lg hover:bg-violet-50 active:bg-violet-100 dark:hover:bg-violet-900/20 dark:active:bg-violet-800/30 transition-colors touch-manipulation"
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
        )}
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
              {appliedSuccess && (
                <Card className="mb-4 border-emerald-200 bg-emerald-50 dark:border-emerald-800 dark:bg-emerald-950/20">
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-3">
                      <svg
                        className="w-6 h-6 text-emerald-600 dark:text-emerald-300"
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
                      <div>
                        <p className="font-medium text-emerald-800 dark:text-emerald-200">
                          ✅ Data applied successfully!
                        </p>
                        <p className="text-sm text-emerald-700 dark:text-emerald-300">
                          Your lease information has been extracted and populated in the form below.
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
              <Card data-form-section="main">
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
                  <div className="flex items-center justify-between pt-2">
                    <span className="text-sm text-slate-600 dark:text-slate-400">Advanced options</span>
                    <Button type="button" onClick={() => setShowAdvanced((v) => !v)} size="sm">
                      {showAdvanced ? 'Hide' : 'Show'} Advanced
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Key Results Summary */}
              {result && (
                <Card>
                  <CardContent className="py-4">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-slate-600 dark:text-slate-400">Total Cost</span>
                        <span className="font-medium">
                          {formatCurrency(result.metrics.totalCost)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-slate-600 dark:text-slate-400">Present Value</span>
                        <span className="font-medium">
                          {formatCurrency(result.metrics.presentValue)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-slate-600 dark:text-slate-400">Effective Annual Rate</span>
                        <span className="font-medium">
                          {formatPercentage(result.metrics.effectiveAnnualRate)}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* Lease Terms */}
            <TabsContent value="terms">
              <div className="space-y-4">
                {/* Advanced inputs collapsed by default */}
                {showAdvanced && (
                  <>
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
                  </>
                )}

                {/* Advanced Options Section */}
                {showAdvanced && formData.leaseType !== 'equipment' && (
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
                        className="rounded border-slate-300"
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
                            className="rounded border-slate-300"
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
                        className="rounded border-slate-300"
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
                      className="rounded border-slate-300"
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

          {/* Analyze Button (optional) */}
          {!hideAnalyzeButton && (
            <Card>
              <CardContent className="pt-6">
                <Button onClick={handleAnalyze} disabled={isAnalyzing} className="w-full" size="lg">
                  {isAnalyzing ? 'Analyzing...' : 'Analyze Lease'}
                </Button>
                {error && <p className="mt-2 text-sm text-rose-600 dark:text-rose-300">{error}</p>}
              </CardContent>
            </Card>
          )}
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
                    <div className="text-2xl font-bold text-violet-600 dark:text-violet-300">
                      {formatCurrency(result.metrics.averageMonthlyPayment)}
                    </div>
                    <div className="text-sm text-slate-600 dark:text-slate-300">
                      Avg Monthly Payment
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-300">
                      {formatCurrency(result.metrics.totalCost)}
                    </div>
                    <div className="text-sm text-slate-600 dark:text-slate-300">Total Cost</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-violet-600 dark:text-violet-300">
                      {formatCurrency(result.metrics.presentValue)}
                    </div>
                    <div className="text-sm text-slate-600 dark:text-slate-300">Present Value</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                      {formatPercentage(result.metrics.effectiveAnnualRate)}
                    </div>
                    <div className="text-sm text-slate-600 dark:text-slate-300">Effective Rate</div>
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
                          ? 'text-emerald-600'
                          : result.riskAnalysis.renewalRisk === 'medium'
                            ? 'text-yellow-600'
                            : 'text-rose-600'
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
                      <tr className="border-b border-slate-200 dark:border-slate-800">
                        <th className="text-left py-2 px-3">Month</th>
                        <th className="text-right py-2 px-3">Payment</th>
                        <th className="text-right py-2 px-3">Interest</th>
                        <th className="text-right py-2 px-3">Principal</th>
                        <th className="text-right py-2 px-3">Balance</th>
                      </tr>
                    </thead>
                    <tbody>
                      {result.schedule.slice(0, 12).map((payment, idx) => (
                        <tr key={idx} className="border-b border-slate-100 dark:border-slate-800">
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
                    <p className="text-sm text-slate-600 dark:text-slate-400 mt-3 text-center">
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
                          ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/20'
                          : 'border-slate-300'
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
                          ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/20'
                          : 'border-slate-300'
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

                    <div className="text-center p-4 bg-violet-50 dark:bg-violet-950/20 rounded-lg">
                      <div className="font-semibold text-lg">
                        Recommendation: {result.leaseVsBuy.recommendation.toUpperCase()}
                      </div>
                      <div className="text-sm text-slate-600 dark:text-slate-300">
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
                            className="text-sm text-slate-600 dark:text-slate-300 flex items-start gap-2"
                          >
                            <span className="text-violet-500">•</span>
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
                  <div className="p-4 bg-violet-50 dark:bg-violet-950/20 rounded-lg">
                    <h4 className="font-semibold text-violet-900 dark:text-violet-200 mb-2">
                      Executive Summary
                    </h4>
                    <p className="text-sm text-violet-800 dark:text-violet-300">
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
                    <div className="text-center p-3 bg-slate-50 dark:bg-slate-900/60 rounded">
                      <div className="text-2xl font-bold text-slate-900 dark:text-white">
                        {formatPercentage(result.riskAnalysis.flexibilityScore / 100)}
                      </div>
                      <div className="text-sm text-slate-600 dark:text-slate-400">
                        Flexibility Score
                      </div>
                    </div>
                    <div className="text-center p-3 bg-slate-50 dark:bg-slate-900/60 rounded">
                      <div className="text-2xl font-bold text-slate-900 dark:text-white">
                        {Math.round(formData.termMonths / 12)} yr
                      </div>
                      <div className="text-sm text-slate-600 dark:text-slate-400">Lease Term</div>
                    </div>
                    <div className="text-center p-3 bg-slate-50 dark:bg-slate-900/60 rounded">
                      <div className="text-2xl font-bold text-slate-900 dark:text-white">
                        {formatCurrency(result.metrics.costPerYear)}
                      </div>
                      <div className="text-sm text-slate-600 dark:text-slate-400">Annual Cost</div>
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
                  <div className="p-4 bg-emerald-50 dark:bg-emerald-950/20 rounded-lg">
                    <h4 className="font-semibold text-emerald-900 dark:text-emerald-200 mb-2">
                      Strategic Recommendations
                    </h4>
                    <ul className="text-sm text-emerald-800 dark:text-emerald-300 space-y-1">
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
                    className="flex flex-col items-center gap-2 p-4 border border-slate-300 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                  >
                    <svg
                      className="w-6 h-6 text-rose-600"
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
                    className="flex flex-col items-center gap-2 p-4 border border-slate-300 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                  >
                    <svg
                      className="w-6 h-6 text-emerald-600"
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
                    className="flex flex-col items-center gap-2 p-4 border border-slate-300 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                  >
                    <svg
                      className="w-6 h-6 text-violet-600"
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
                    className="flex flex-col items-center gap-2 p-4 border border-slate-300 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                  >
                    <svg
                      className="w-6 h-6 text-violet-600"
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
                  <div className="mt-4 p-4 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800 rounded-lg">
                    <div className="flex items-start gap-2">
                      <svg
                        className="w-5 h-5 text-emerald-600 dark:text-emerald-300 mt-0.5 flex-shrink-0"
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
                        <p className="font-medium text-emerald-800 dark:text-emerald-200">
                          Shareable Link Generated
                        </p>
                        <p className="text-sm text-emerald-700 dark:text-emerald-300 mt-1">
                          Link copied to clipboard!
                        </p>
                        <input
                          type="text"
                          value={shareableLinkGenerated}
                          readOnly
                          title="Shareable link URL"
                          aria-label="Shareable link URL"
                          className="w-full mt-2 px-3 py-2 text-sm bg-white dark:bg-slate-900 border border-emerald-300 dark:border-emerald-800 rounded"
                          onClick={(e) => (e.target as HTMLInputElement).select()}
                        />
                      </div>
                      <button
                        onClick={() => setShareableLinkGenerated(null)}
                        className="text-emerald-600 hover:text-emerald-700 dark:text-emerald-300 dark:hover:text-emerald-200"
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

                <div className="mt-4 p-3 bg-violet-50 dark:bg-violet-950/20 rounded-lg">
                  <div className="flex items-start gap-2">
                    <svg
                      className="w-5 h-5 text-violet-600 dark:text-violet-300 mt-0.5 flex-shrink-0"
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
                    <div className="text-sm text-violet-800 dark:text-violet-200">
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
          <div className="bg-white dark:bg-slate-900 rounded-lg shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-semibold mb-4 text-slate-900 dark:text-white">
              Save Analysis
            </h3>
            <div className="space-y-4">
              <div>
                <label className="fa-field-label mb-1">
                  Analysis Name
                </label>
                <input
                  type="text"
                  value={saveFormName}
                  onChange={(e) => setSaveFormName(e.target.value)}
                  placeholder="e.g., analysis name"
                  className="fa-input-surface w-full"
                  autoFocus
                />
              </div>
              <div>
                <label className="fa-field-label mb-1">
                  Description (optional)
                </label>
                <textarea
                  value={saveFormDescription}
                  onChange={(e) => setSaveFormDescription(e.target.value)}
                  placeholder="Add a description..."
                  rows={3}
                  className="fa-input-surface w-full"
                />
              </div>
              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => {
                    setShowSaveModal(false);
                    setSaveFormName('');
                    setSaveFormDescription('');
                  }}
                  className="fa-button-secondary flex-1 justify-center"
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
                  className="flex-1 rounded-md bg-violet-600 px-4 py-2 text-white hover:bg-violet-700 disabled:cursor-not-allowed disabled:opacity-50"
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
