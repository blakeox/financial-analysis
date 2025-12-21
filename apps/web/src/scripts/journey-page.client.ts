/**
 * Journey Page Client Script
 *
 * Handles journey-specific functionality like progress tracking
 * and model completion status with new journey state management.
 */

import { initializeJourneyFromScenario } from './journey-state.client';

interface JourneyProgress {
  completed: string[];
  currentStep: number;
  totalSteps: number;
}

interface JourneyModel {
  id: string;
  name: string;
  description: string;
  url: string;
  order: number;
  required: boolean;
}

interface JourneyScenario {
  name: string;
  models: JourneyModel[];
}

class JourneyPageManager {
  private scenarioId: string;
  private progress: JourneyProgress;

  constructor() {
    this.scenarioId = this.getScenarioId();
    this.progress = this.loadProgress();
    this.initializeJourneyState();
    this.updateProgressDisplay();
    this.setupEventListeners();
    this.updateChatbotContext();
  }

  private getScenarioId(): string {
    const path = window.location.pathname;
    const match = path.match(/\/journey\/([^/]+)/);
    return match ? match[1] : '';
  }

  /**
   * Initialize journey state from scenario data
   */
  private initializeJourneyState(): void {
    const scenarioData = this.getScenarioData();
    if (!scenarioData) return;

    // Convert scenario models to journey steps
    const journeySteps = scenarioData.models.map((model) => ({
      id: model.id,
      name: model.name,
      description: model.description,
      url: model.url,
      order: model.order,
      required: model.required,
      completed: false,
    }));

    // Initialize journey state
    initializeJourneyFromScenario(this.scenarioId, scenarioData.name, journeySteps);
  }

  /**
   * Get scenario data from the page
   */
  private getScenarioData(): JourneyScenario | undefined {
    // This would typically come from the server-side rendered data
    // For now, we'll use a simple mapping
    const scenarioMap: Record<string, JourneyScenario> = {
      'young-professional': {
        name: 'Young Professional Journey',
        models: [
          {
            id: 'student-loan',
            name: 'Student Loan Analyzer',
            description: 'Optimize student loan repayment strategies',
            url: '/calculator/student-loans',
            order: 1,
            required: true,
          },
          {
            id: 'budget',
            name: 'Budget Optimizer',
            description: 'Create emergency fund and budget planning',
            url: '/calculator/budget',
            order: 2,
            required: true,
          },
          {
            id: 'retirement',
            name: 'Retirement Planning Engine',
            description: 'Early retirement planning and 401(k) optimization',
            url: '/calculator/retirement',
            order: 3,
            required: true,
          },
          {
            id: 'savings-goal',
            name: 'Savings Goal Planner',
            description: 'Plan for emergency fund and financial goals',
            url: '/calculator/savings-goal',
            order: 4,
            required: false,
          },
        ],
      },
      'family-planning': {
        name: 'Family Planning Journey',
        models: [
          {
            id: 'amortization',
            name: 'Mortgage Calculator',
            description: 'Analyze home buying readiness and affordability',
            url: '/calculator/amortization',
            order: 1,
            required: true,
          },
          {
            id: 'savings-goal',
            name: 'Savings Goal Planner',
            description: "Plan for children's education funding",
            url: '/calculator/savings-goal',
            order: 2,
            required: true,
          },
          {
            id: 'budget',
            name: 'Budget Optimizer',
            description: 'Comprehensive family budget analysis',
            url: '/calculator/budget',
            order: 3,
            required: true,
          },
          {
            id: 'retirement',
            name: 'Retirement Planning Engine',
            description: 'Optimize tax strategy for family finances',
            url: '/calculator/retirement',
            order: 4,
            required: false,
          },
        ],
      },
      'ma-analysis-journey': {
        name: 'M&A Analysis Journey',
        models: [
          {
            id: 'ma-analysis',
            name: 'M&A Analysis Calculator',
            description: 'Complete M&A analysis with accretion/dilution',
            url: '/calculator/ma-analysis',
            order: 1,
            required: true,
          },
          {
            id: 'dcf-valuation',
            name: 'DCF Valuation Calculator',
            description: 'Detailed DCF analysis for target valuation',
            url: '/calculator/dcf-valuation',
            order: 2,
            required: true,
          },
          {
            id: 'risk-management',
            name: 'Risk Management Calculator',
            description: 'Assess integration and operational risks',
            url: '/calculator/risk-management',
            order: 3,
            required: true,
          },
        ],
      },
      // Add more scenarios as needed
    };

    return scenarioMap[this.scenarioId];
  }

  private loadProgress(): JourneyProgress {
    const saved = localStorage.getItem(`journey-progress-${this.scenarioId}`);
    if (saved) {
      return JSON.parse(saved);
    }
    return {
      completed: [],
      currentStep: 0,
      totalSteps: this.getTotalSteps(),
    };
  }

  private getTotalSteps(): number {
    // This would ideally come from the page data, but for now we'll estimate
    const stepElements = document.querySelectorAll('.journey-step');
    return stepElements.length || 4; // Default to 4 steps
  }

  private saveProgress(): void {
    localStorage.setItem(`journey-progress-${this.scenarioId}`, JSON.stringify(this.progress));
  }

  private updateProgressDisplay(): void {
    const completedElement = document.querySelector('.progress-completed');
    const totalElement = document.querySelector('.progress-total');
    const percentageElement = document.querySelector('.progress-percentage');

    if (completedElement) {
      completedElement.textContent = this.progress.completed.length.toString();
    }
    if (totalElement) {
      totalElement.textContent = this.progress.totalSteps.toString();
    }
    if (percentageElement) {
      const percentage = Math.round(
        (this.progress.completed.length / this.progress.totalSteps) * 100
      );
      percentageElement.textContent = `${percentage}%`;
    }
  }

  private setupEventListeners(): void {
    // Listen for journey start button clicks
    document.addEventListener('click', (event: Event) => {
      const target = event.target as HTMLElement;
      if (target.classList.contains('journey-start-btn')) {
        event.preventDefault();
        this.handleJourneyStart(target);
      }
    });

    // Listen for model completion events
    window.addEventListener('model-completed', (event: CustomEvent) => {
      const modelId = event.detail.modelId;
      this.markModelCompleted(modelId);
    });

    // Listen for page visibility changes to refresh progress
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden) {
        this.refreshProgress();
      }
    });
  }

  /**
   * Handle journey start button clicks
   */
  private handleJourneyStart(button: HTMLElement): void {
    const scenarioId = button.getAttribute('data-scenario');
    const modelId = button.getAttribute('data-model-id');

    if (!scenarioId || !modelId) {
      console.error('Missing journey data attributes');
      return;
    }

    // Get scenario data
    const scenarioData = this.getScenarioData();
    if (!scenarioData) {
      console.error('Scenario data not found');
      return;
    }

    // Convert scenario models to journey steps
    const journeySteps = scenarioData.models.map((model) => ({
      id: model.id,
      name: model.name,
      description: model.description,
      url: model.url,
      order: model.order,
      required: model.required,
      completed: false,
    }));

    // Initialize journey state
    initializeJourneyFromScenario(scenarioId, scenarioData.name, journeySteps);

    // Navigate to the calculator with journey context
    const calculatorUrl = button.getAttribute('href');
    if (calculatorUrl) {
      // Add journey parameter to URL
      const url = new URL(calculatorUrl, window.location.origin);
      url.searchParams.set('journey', scenarioId);
      window.location.href = url.toString();
    }
  }

  public markModelCompleted(modelId: string): void {
    if (!this.progress.completed.includes(modelId)) {
      this.progress.completed.push(modelId);
      this.progress.currentStep = Math.max(
        this.progress.currentStep,
        this.progress.completed.length
      );
      this.saveProgress();
      this.updateProgressDisplay();
      this.updateModelStatus(modelId);
    }
  }

  private updateModelStatus(modelId: string): void {
    // Update the visual status of completed models
    const modelElements = document.querySelectorAll(`[data-model-id="${modelId}"]`);
    modelElements.forEach((element) => {
      element.classList.add('completed');
      const button = element.querySelector('a');
      if (button) {
        button.textContent = 'Review';
        button.classList.remove('bg-blue-600', 'hover:bg-blue-700');
        button.classList.add('bg-green-600', 'hover:bg-green-700');
      }
    });
  }

  private refreshProgress(): void {
    // This could check with the server or other sources for updated progress
    this.updateProgressDisplay();
  }

  public getProgress(): JourneyProgress {
    return { ...this.progress };
  }

  public resetProgress(): void {
    this.progress = {
      completed: [],
      currentStep: 0,
      totalSteps: this.getTotalSteps(),
    };
    this.saveProgress();
    this.updateProgressDisplay();

    // Reset all model statuses
    const modelElements = document.querySelectorAll('[data-model-id]');
    modelElements.forEach((element) => {
      element.classList.remove('completed');
      const button = element.querySelector('a');
      if (button) {
        button.textContent = 'Start';
        button.classList.remove('bg-green-600', 'hover:bg-green-700');
        button.classList.add('bg-blue-600', 'hover:bg-blue-700');
      }
    });
  }

  private updateChatbotContext(): void {
    // Get journey data from the page
    const journeyTitle = document.querySelector('h1')?.textContent || '';
    const journeyDescription = document.querySelector('p.text-xl')?.textContent || '';
    const models = Array.from(document.querySelectorAll('h4')).map((h4) => h4.textContent || '');
    const workflowSteps = Array.from(document.querySelectorAll('ol li')).map(
      (li) => li.textContent || ''
    );

    // Update global context for chatbot
    if (typeof window !== 'undefined') {
      window.currentJourney = {
        id: this.scenarioId,
        title: journeyTitle,
        description: journeyDescription,
        models: models,
        workflowSteps: workflowSteps,
        progress: this.progress,
        completedModels: this.progress.completed,
      };

      // Notify chatbot of journey context
      const event = new CustomEvent('journey-context-updated', {
        detail: {
          journeyId: this.scenarioId,
          journeyTitle,
          progress: this.progress,
        },
      });
      document.dispatchEvent(event);

      console.log('Journey context updated for chatbot:', {
        journeyId: this.scenarioId,
        title: journeyTitle,
        progress: this.progress,
      });
    }
  }
}

// Initialize when DOM is ready
function initializeJourneyPage() {
  console.log('Journey page script loaded');
  (window as any).journeyManager = new JourneyPageManager();
  console.log('Journey manager initialized:', window.journeyManager);
}

// Check if DOM is already loaded
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeJourneyPage);
} else {
  initializeJourneyPage();
}

// Global functions
interface JourneyContext {
  id: string;
  title: string;
  description: string;
  models: string[];
  workflowSteps: string[];
  progress: JourneyProgress;
  completedModels: string[];
}

declare global {
  interface Window {
    currentJourney?: JourneyContext;
  }
}

export default JourneyPageManager;
