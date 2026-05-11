/**
 * Calculator Quick Access Client Script
 *
 * Handles favorites, recent calculators, and quick access functionality
 * for the modular calculator system.
 */

import {
  CalculationHistoryManager,
  CalculatorFavorites,
  UserPreferencesManager,
  trackCalculatorUsage,
} from '../../components/CalculatorStorage';
import type { CalculatorConfig } from '../../components/CalculatorTemplate';
import { CALCULATOR_CONFIGS } from '../../components/CalculatorTemplate';

class CalculatorQuickAccess {
  private currentCalculatorId: string;
  private favoritesList: HTMLElement | null;
  private recentList: HTMLElement | null;
  private favoriteBtn: HTMLElement | null;
  private favoriteText: HTMLElement | null;

  constructor(calculatorId: string) {
    this.currentCalculatorId = calculatorId;
    this.favoritesList = document.getElementById('favorites-list');
    this.recentList = document.getElementById('recent-list');
    this.favoriteBtn = document.getElementById('favorite-btn');
    this.favoriteText = document.getElementById('favorite-text');

    this.init();
  }

  private init(): void {
    this.loadQuickAccess();
    this.setupEventListeners();
    this.updateFavoriteButton();
    this.trackUsage();
  }

  private loadQuickAccess(): void {
    this.loadFavorites();
    this.loadRecent();
  }

  private loadFavorites(): void {
    if (!this.favoritesList) return;

    const favorites = CalculatorFavorites.getFavoriteCalculators();

    if (favorites.length === 0) {
      this.favoritesList.innerHTML =
        '<p class="fa-script-copy-subtle">No favorites yet</p>';
      return;
    }

    this.favoritesList.innerHTML = favorites
      .filter((calc) => calc.id !== this.currentCalculatorId)
      .map((calc) => this.createCalculatorLink(calc))
      .join('');
  }

  private loadRecent(): void {
    if (!this.recentList) return;

    const recent = UserPreferencesManager.getRecentCalculators();

    if (recent.length === 0) {
      this.recentList.innerHTML =
        '<p class="fa-script-copy-subtle">No recent calculators</p>';
      return;
    }

    this.recentList.innerHTML = recent
      .filter((calc) => calc.id !== this.currentCalculatorId)
      .slice(0, 5)
      .map((calc) => this.createCalculatorLink(calc))
      .join('');
  }

  private createCalculatorLink(calculator: CalculatorConfig): string {
    return `
      <a 
        href="/calculator/${calculator.id}" 
        class="fa-surface-muted block rounded-md px-3 py-2 text-sm transition-colors duration-200 hover:bg-violet-50/70 dark:hover:bg-violet-950/20"
      >
        <div class="flex items-center">
          <span class="mr-2">${calculator.icon}</span>
          <span class="truncate">${calculator.title}</span>
        </div>
      </a>
    `;
  }

  private setupEventListeners(): void {
    if (this.favoriteBtn) {
      this.favoriteBtn.addEventListener('click', () => {
        this.toggleFavorite();
      });
    }

    // Track calculator usage when form is submitted
    const form = document.getElementById('calculator-form');
    if (form) {
      form.addEventListener('submit', () => {
        this.saveCalculation();
      });
    }
  }

  private toggleFavorite(): void {
    const isNowFavorite = CalculatorFavorites.toggleFavorite(this.currentCalculatorId);
    this.updateFavoriteButton();
    this.loadFavorites();

    // Show feedback
    this.showFeedback(isNowFavorite ? 'Added to favorites!' : 'Removed from favorites!');
  }

  private updateFavoriteButton(): void {
    if (!this.favoriteBtn || !this.favoriteText) return;

    const favoriteText = this.favoriteText;

    const isFavorite = CalculatorFavorites.isFavorite(this.currentCalculatorId);

    if (isFavorite) {
      this.favoriteBtn.classList.remove(
        'bg-slate-100',
        'hover:bg-slate-200',
        'dark:bg-slate-700',
        'dark:hover:bg-slate-600'
      );
      this.favoriteBtn.classList.add(
        'bg-yellow-100',
        'hover:bg-yellow-200',
        'dark:bg-yellow-900',
        'dark:hover:bg-yellow-800'
      );
      favoriteText.textContent = 'Remove from Favorites';
    } else {
      this.favoriteBtn.classList.remove(
        'bg-yellow-100',
        'hover:bg-yellow-200',
        'dark:bg-yellow-900',
        'dark:hover:bg-yellow-800'
      );
      this.favoriteBtn.classList.add(
        'bg-slate-100',
        'hover:bg-slate-200',
        'dark:bg-slate-700',
        'dark:hover:bg-slate-600'
      );
      favoriteText.textContent = 'Add to Favorites';
    }
  }

  private saveCalculation(): void {
    const form = document.getElementById('calculator-form') as HTMLFormElement;
    if (!form) return;

    const formData = new FormData(form);
    const inputs: Record<string, unknown> = {};

    for (const [key, value] of formData.entries()) {
      inputs[key] = value;
    }

    // Generate a name for the calculation
    const name = this.generateCalculationName(inputs);

    CalculationHistoryManager.addCalculation(
      this.currentCalculatorId,
      inputs,
      undefined, // Results will be added by the calculator script
      name
    );

    this.showFeedback('Calculation saved to history!');
  }

  private generateCalculationName(inputs: Record<string, unknown>): string {
    const config = CALCULATOR_CONFIGS[this.currentCalculatorId];
    if (!config) return 'Calculation';

    // Generate name based on calculator type and key inputs
    switch (this.currentCalculatorId) {
      case 'amortization':
        return `Mortgage: $${inputs.principal || '0'} @ ${inputs.annualRate || '0'}%`;
      case 'auto-loan':
        return `Auto Loan: $${inputs.vehiclePrice || '0'} @ ${inputs.interestRate || '0'}%`;
      case 'retirement':
        return `Retirement: Age ${inputs.currentAge || '0'} to ${inputs.retirementAge || '0'}`;
      case 'savings-goal':
        return `Savings Goal: $${inputs.goalAmount || '0'} in ${inputs.targetDate || '0'} years`;
      case 'budget':
        return `Budget: $${inputs.monthlyIncome || '0'} income`;
      default:
        return `${config.title} Calculation`;
    }
  }

  private showFeedback(message: string): void {
    // Create a temporary feedback element
    const feedback = document.createElement('div');
    feedback.className =
      'fa-toast-success fixed top-4 right-4 px-4 py-2 z-50 transition-all duration-300';
    feedback.textContent = message;

    document.body.appendChild(feedback);

    // Remove after 3 seconds
    setTimeout(() => {
      feedback.style.opacity = '0';
      setTimeout(() => {
        document.body.removeChild(feedback);
      }, 300);
    }, 3000);
  }

  private trackUsage(): void {
    trackCalculatorUsage(this.currentCalculatorId, 'open');
  }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  // Extract calculator ID from URL
  const pathParts = window.location.pathname.split('/');
  const calculatorId = pathParts[pathParts.length - 1];

  if (calculatorId && CALCULATOR_CONFIGS[calculatorId]) {
    new CalculatorQuickAccess(calculatorId);
  }
});

// Export for use in other scripts
export { CalculatorQuickAccess };
