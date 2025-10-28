/**
 * Journey Page Client Script
 * 
 * Handles journey-specific functionality like progress tracking
 * and model completion status.
 */

interface JourneyProgress {
  completed: string[];
  currentStep: number;
  totalSteps: number;
}

class JourneyPageManager {
  private scenarioId: string;
  private progress: JourneyProgress;

  constructor() {
    this.scenarioId = this.getScenarioId();
    this.progress = this.loadProgress();
    this.updateProgressDisplay();
    this.setupEventListeners();
  }

  private getScenarioId(): string {
    const path = window.location.pathname;
    const match = path.match(/\/journey\/([^\/]+)/);
    return match ? match[1] : '';
  }

  private loadProgress(): JourneyProgress {
    const saved = localStorage.getItem(`journey-progress-${this.scenarioId}`);
    if (saved) {
      return JSON.parse(saved);
    }
    return {
      completed: [],
      currentStep: 0,
      totalSteps: this.getTotalSteps()
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
      const percentage = Math.round((this.progress.completed.length / this.progress.totalSteps) * 100);
      percentageElement.textContent = `${percentage}%`;
    }
  }

  private setupEventListeners(): void {
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

  public markModelCompleted(modelId: string): void {
    if (!this.progress.completed.includes(modelId)) {
      this.progress.completed.push(modelId);
      this.progress.currentStep = Math.max(this.progress.currentStep, this.progress.completed.length);
      this.saveProgress();
      this.updateProgressDisplay();
      this.updateModelStatus(modelId);
    }
  }

  private updateModelStatus(modelId: string): void {
    // Update the visual status of completed models
    const modelElements = document.querySelectorAll(`[data-model-id="${modelId}"]`);
    modelElements.forEach(element => {
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
      totalSteps: this.getTotalSteps()
    };
    this.saveProgress();
    this.updateProgressDisplay();
    
    // Reset all model statuses
    const modelElements = document.querySelectorAll('[data-model-id]');
    modelElements.forEach(element => {
      element.classList.remove('completed');
      const button = element.querySelector('a');
      if (button) {
        button.textContent = 'Start';
        button.classList.remove('bg-green-600', 'hover:bg-green-700');
        button.classList.add('bg-blue-600', 'hover:bg-blue-700');
      }
    });
  }
}

// Initialize when DOM is ready
function initializeJourneyPage() {
  console.log('Journey page script loaded');
  window.journeyManager = new JourneyPageManager();
  console.log('Journey manager initialized:', window.journeyManager);
}

// Check if DOM is already loaded
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeJourneyPage);
} else {
  initializeJourneyPage();
}

// Global functions
declare global {
  interface Window {
    journeyManager: JourneyPageManager;
  }
}

export default JourneyPageManager;
