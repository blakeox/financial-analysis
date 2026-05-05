/**
 * Journey Navigation Client Script
 * Handles journey-specific navigation and state management
 */

interface JourneyContext {
  scenarioId: string | null;
  currentStep: number | null;
  totalSteps: number | null;
  isJourneySpecific: boolean;
  calculatorId: string;
}

interface JourneyState {
  scenarioId: string;
  currentStep: number;
  completedSteps: string[];
  collectedData: Record<string, Record<string, unknown>>;
  startTime: Date;
  lastActivity: Date;
}

class JourneyNavigationManager {
  private context: JourneyContext | null = null;
  private state: JourneyState | null = null;
  private storageKey = 'fanalyx-journey-state';

  constructor() {
    this.init();
  }

  private init(): void {
    // Listen for journey context events
    window.addEventListener('journey-context-loaded', (event: CustomEvent) => {
      this.context = event.detail as JourneyContext;
      this.loadJourneyState();
      this.setupJourneyNavigation();
    });

    // Listen for calculator completion events
    window.addEventListener('calculator-completed', (event: CustomEvent) => {
      this.handleCalculatorCompletion(event.detail);
    });

    // Listen for page visibility changes to update activity
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden && this.state) {
        this.state.lastActivity = new Date();
        this.saveJourneyState();
      }
    });
  }

  private loadJourneyState(): void {
    if (!this.context?.scenarioId) return;

    try {
      const stored = localStorage.getItem(`${this.storageKey}-${this.context.scenarioId}`);
      if (stored) {
        this.state = JSON.parse(stored);
        // Convert date strings back to Date objects
        if (this.state) {
          this.state.startTime = new Date(this.state.startTime);
          this.state.lastActivity = new Date(this.state.lastActivity);
        }
      } else {
        // Initialize new journey state
        this.state = {
          scenarioId: this.context.scenarioId,
          currentStep: this.context.currentStep || 1,
          completedSteps: [],
          collectedData: {},
          startTime: new Date(),
          lastActivity: new Date(),
        };
        this.saveJourneyState();
      }
    } catch (error) {
      console.error('Failed to load journey state:', error);
      this.initializeNewState();
    }
  }

  private initializeNewState(): void {
    if (!this.context?.scenarioId) return;

    this.state = {
      scenarioId: this.context.scenarioId,
      currentStep: this.context.currentStep || 1,
      completedSteps: [],
      collectedData: {},
      startTime: new Date(),
      lastActivity: new Date(),
    };
    this.saveJourneyState();
  }

  private saveJourneyState(): void {
    if (!this.state) return;

    try {
      localStorage.setItem(
        `${this.storageKey}-${this.state.scenarioId}`,
        JSON.stringify(this.state)
      );
    } catch (error) {
      console.error('Failed to save journey state:', error);
    }
  }

  private setupJourneyNavigation(): void {
    if (!this.context?.isJourneySpecific || !this.state) return;

    // Add journey progress indicators
    this.addJourneyProgressIndicators();

    // Enhance navigation buttons
    this.enhanceNavigationButtons();

    // Add journey-specific styling
    this.addJourneyStyling();

    // Track journey analytics
    this.trackJourneyAnalytics();
  }

  private addJourneyProgressIndicators(): void {
    if (!this.state) return;
    const state = this.state;

    // Add step completion indicators
    const progressBar = document.querySelector<HTMLElement>(
      '.bg-gradient-to-r.from-blue-500.to-indigo-600'
    );
    if (progressBar) {
      const completionPercentage = (state.completedSteps.length / state.currentStep) * 100;
      progressBar.style.width = `${Math.min(completionPercentage, 100)}%`;
    }

    // Add step status indicators
    const stepIndicators = document.querySelectorAll<HTMLElement>('[data-step-indicator]');
    stepIndicators.forEach((indicator, index) => {
      const stepNumber = index + 1;
      indicator.classList.remove(
        'fa-step-indicator-pending',
        'fa-step-indicator-current',
        'fa-step-indicator-complete'
      );
      if (state.completedSteps.includes(stepNumber.toString())) {
        indicator.classList.add('fa-step-indicator-complete');
      } else if (stepNumber === state.currentStep) {
        indicator.classList.add('fa-step-indicator-current');
      } else {
        indicator.classList.add('fa-step-indicator-pending');
      }
    });
  }

  private enhanceNavigationButtons(): void {
    if (!this.state) return;

    // Enhance next button with validation
    const nextButton = document.querySelector<HTMLAnchorElement>('a[href*="next"]');
    if (nextButton) {
      nextButton.addEventListener('click', (event) => {
        if (!this.validateCurrentStep()) {
          event.preventDefault();
          this.showValidationError();
          return;
        }

        // Mark current step as completed
        this.markStepCompleted();

        // Add smooth transition
        this.addTransitionEffect();
      });
    }

    // Enhance previous button
    const previousButton = document.querySelector<HTMLAnchorElement>('a[href*="previous"]');
    if (previousButton) {
      previousButton.addEventListener('click', () => {
        this.trackNavigation('previous');
      });
    }

    // Enhance complete journey button
    const completeButton = document.querySelector<HTMLAnchorElement>('a[href*="journey-analysis"]');
    if (completeButton) {
      completeButton.addEventListener('click', () => {
        this.trackNavigation('complete');
        this.completeJourney();
      });
    }
  }

  private validateCurrentStep(): boolean {
    // Check if required fields are filled
    const requiredFields = document.querySelectorAll(
      'input[required], select[required], textarea[required]'
    );
    for (const field of requiredFields) {
      if (
        field instanceof HTMLInputElement ||
        field instanceof HTMLTextAreaElement ||
        field instanceof HTMLSelectElement
      ) {
        if (!field.value.trim()) {
          return false;
        }
      } else {
        return false;
      }
    }

    // Check if calculation has been performed
    const resultsSection = document.getElementById('results');
    if (resultsSection && resultsSection.classList.contains('hidden')) {
      return false;
    }

    return true;
  }

  private showValidationError(): void {
    // Create or show validation error message
    let errorDiv = document.getElementById('journey-validation-error');
    if (!errorDiv) {
      errorDiv = document.createElement('div');
      errorDiv.id = 'journey-validation-error';
      errorDiv.className =
        'fa-toast-error fixed top-4 right-4 px-4 py-2 z-50';
      document.body.appendChild(errorDiv);
    }

    errorDiv.textContent = 'Please complete the current step before proceeding.';
    errorDiv.classList.remove('hidden');

    // Auto-hide after 3 seconds
    setTimeout(() => {
      errorDiv?.classList.add('hidden');
    }, 3000);
  }

  private markStepCompleted(): void {
    if (!this.state) return;

    const currentStepStr = this.state.currentStep.toString();
    if (!this.state.completedSteps.includes(currentStepStr)) {
      this.state.completedSteps.push(currentStepStr);
      this.saveJourneyState();
    }
  }

  private addTransitionEffect(): void {
    // Add page transition effect
    document.body.style.transition = 'opacity 0.3s ease-out';
    document.body.style.opacity = '0.8';

    setTimeout(() => {
      document.body.style.opacity = '1';
    }, 150);
  }

  private addJourneyStyling(): void {
    // Add journey-specific CSS classes
    document.body.classList.add('journey-active');

    // Add journey context to form
    const form = document.getElementById('calculator-form');
    if (form) {
      form.setAttribute('data-journey-context', this.state?.scenarioId || '');
    }
  }

  private trackJourneyAnalytics(): void {
    if (!this.state) return;

    // Track journey start
    if (this.state.currentStep === 1) {
      this.trackEvent('journey_started', {
        scenario_id: this.state.scenarioId,
        journey_type: 'financial_analysis',
      });
    }

    // Track step completion
    this.trackEvent('journey_step_viewed', {
      scenario_id: this.state.scenarioId,
      step_number: this.state.currentStep,
      total_steps: this.context?.totalSteps,
    });
  }

  private trackNavigation(direction: 'next' | 'previous' | 'complete'): void {
    if (!this.state) return;

    this.trackEvent('journey_navigation', {
      scenario_id: this.state.scenarioId,
      direction: direction,
      step_number: this.state.currentStep,
      completed_steps: this.state.completedSteps.length,
    });
  }

  private completeJourney(): void {
    if (!this.state) return;

    // Track journey completion
    this.trackEvent('journey_completed', {
      scenario_id: this.state.scenarioId,
      total_time: Date.now() - this.state.startTime.getTime(),
      completed_steps: this.state.completedSteps.length,
      total_steps: this.context?.totalSteps,
    });

    // Clean up journey state
    this.cleanupJourneyState();
  }

  private cleanupJourneyState(): void {
    if (!this.state) return;

    // Archive completed journey
    const archiveKey = `fanalyx-journey-archive-${this.state.scenarioId}-${Date.now()}`;
    try {
      localStorage.setItem(
        archiveKey,
        JSON.stringify({
          ...this.state,
          completedAt: new Date(),
          status: 'completed',
        })
      );
    } catch (error) {
      console.error('Failed to archive journey state:', error);
    }

    // Remove active journey state
    localStorage.removeItem(`${this.storageKey}-${this.state.scenarioId}`);
  }

  private trackEvent(eventName: string, properties: Record<string, unknown>): void {
    // Dispatch custom event for analytics
    window.dispatchEvent(
      new CustomEvent('journey-analytics', {
        detail: {
          event: eventName,
          properties: properties,
          timestamp: new Date().toISOString(),
        },
      })
    );

    // Also track in console for development
    if (process.env.NODE_ENV === 'development') {
      console.log('Journey Analytics:', eventName, properties);
    }
  }

  private handleCalculatorCompletion(data: Record<string, unknown>): void {
    if (!this.state || !this.context?.isJourneySpecific) return;

    // Store calculator results in journey state
    this.state.collectedData[this.context.calculatorId] = {
      ...data,
      completedAt: new Date(),
      stepNumber: this.state.currentStep,
    };

    this.saveJourneyState();

    // Show journey progress feedback
    this.showJourneyProgressFeedback();
  }

  private showJourneyProgressFeedback(): void {
    if (!this.state) return;

    const totalSteps = this.context?.totalSteps ?? Math.max(this.state.completedSteps.length, 1);
    const progressPercentage = (this.state.completedSteps.length / totalSteps) * 100;

    // Create progress feedback
    const feedbackDiv = document.createElement('div');
    feedbackDiv.className =
      'fa-toast-success fixed bottom-4 left-4 px-4 py-2 z-50';
    feedbackDiv.innerHTML = `
      <div class="flex items-center">
        <svg class="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
          <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 002.828 0l4-4z" clip-rule="evenodd" />
        </svg>
        Step completed! ${Math.round(progressPercentage)}% of journey done.
      </div>
    `;

    document.body.appendChild(feedbackDiv);

    // Auto-hide after 3 seconds
    setTimeout(() => {
      feedbackDiv.remove();
    }, 3000);
  }

  // Public methods for external access
  public getJourneyState(): JourneyState | null {
    return this.state;
  }

  public getJourneyContext(): JourneyContext | null {
    return this.context;
  }

  public isJourneyActive(): boolean {
    return this.context?.isJourneySpecific === true && this.state !== null;
  }
}

// Initialize journey navigation manager
const journeyNavigationManager = new JourneyNavigationManager();

declare global {
  interface Window {
    journeyNavigationManager?: JourneyNavigationManager;
  }
}

// Export for external access
window.journeyNavigationManager = journeyNavigationManager;

// Export types for TypeScript
export { JourneyNavigationManager };
export type { JourneyContext, JourneyState };
