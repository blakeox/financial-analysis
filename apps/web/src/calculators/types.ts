/**
 * Calculator Page Template System
 *
 * This system provides reusable components and utilities for creating
 * financial calculator pages with consistent structure and minimal repetition.
 */

// Types for calculator page configuration
export interface CalculatorConfig {
  id: string;
  title: string;
  description: string;
  category: 'personal' | 'business';
  icon: string;
  color: string;
  keywords: string[];
  faqSchema: {
    '@context': 'https://schema.org';
    '@type': 'FAQPage';
    mainEntity: Array<{
      '@type': 'Question';
      name: string;
      acceptedAnswer: {
        '@type': 'Answer';
        text: string;
      };
    }>;
  };
  breadcrumbs: Array<{
    name: string;
    href: string;
  }>;
  formFields: FormFieldConfig[];
  clientScript: string;
  analysisType: string;
}

export interface FormFieldConfig {
  id: string;
  name: string;
  type: 'number' | 'text' | 'select' | 'checkbox' | 'radio';
  label: string;
  placeholder?: string;
  min?: number;
  max?: number;
  step?: number;
  required?: boolean;
  options?: Array<{ value: string; label: string }>;
  group?: string;
  helpText?: string;
  advancedOnly?: boolean; // If true, field is hidden in Basic mode
  default?: string | number | boolean;
  assistantAliases?: string[];
}
