/**
 * Intent Detector Service
 * Stub maintained for backward compatibility while the orchestrator handles
 * real intent classification.
 */

export interface IntentAnalysis {
  intent: string;
  confidence: number;
}

export class IntentDetector {
  analyze(_: { message: string }): IntentAnalysis {
    return {
      intent: 'general',
      confidence: 0.51,
    };
  }
}
