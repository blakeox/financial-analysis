/**
 * Personal Dashboard Client Script
 * Manages dashboard state and updates
 */

class PersonalDashboard {
  private updateInterval: number = 5000; // Update every 5 seconds
  private intervalId: NodeJS.Timeout | null = null;

  constructor() {
    this.init();
  }

  private init(): void {
    // Load and display initial data
    this.updateDashboard();

    // Set up periodic updates
    this.intervalId = setInterval(() => {
      this.updateDashboard();
    }, this.updateInterval);

    // Listen for journey state changes
    window.addEventListener('storage', () => {
      this.updateDashboard();
    });

    // Listen for custom journey updates
    document.addEventListener('journey-progress-updated', () => {
      this.updateDashboard();
    });
  }

  private updateDashboard(): void {
    this.updateActiveJourneys();
    this.updateRecentCalculations();
    this.updateAIRecommendations();
  }

  private updateActiveJourneys(): void {
    // Implementation moved to inline script in my-financial-dashboard.astro
    // This provides better SSR and removes hydration complexity
  }

  private updateRecentCalculations(): void {
    // Implementation moved to inline script
  }

  private updateAIRecommendations(): void {
    // Implementation moved to inline script
  }

  public destroy(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }
  }
}

// Initialize dashboard when DOM is ready
if (typeof window !== 'undefined') {
  let dashboardInstance: PersonalDashboard | null = null;

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      dashboardInstance = new PersonalDashboard();
    });
  } else {
    dashboardInstance = new PersonalDashboard();
  }

  // Clean up on navigation
  window.addEventListener('beforeunload', () => {
    if (dashboardInstance) {
      dashboardInstance.destroy();
    }
  });
}

export default PersonalDashboard;

