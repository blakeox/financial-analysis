/**
 * Journey Analysis Page Client Script
 * Handles AI analysis generation and display of journey results
 */

interface JourneyAnalysisData {
  scenarioId: string;
  scenarioName: string;
  journeyData: Record<string, unknown>;
  completedSteps: string[];
}

interface AIAnalysisResponse {
  summary: string;
  insights: string[];
  recommendations: string[];
  keyMetrics: Array<{ label: string; value: string; trend?: string }>;
  actionItems: Array<{ task: string; priority: 'high' | 'medium' | 'low'; timeline: string }>;
}

class JourneyAnalysisManager {
  private analysisData: JourneyAnalysisData | null = null;

  constructor() {
    this.loadJourneyData();
    this.initializeUI();
    this.setupEventListeners();
    this.generateAnalysis();
  }

  /**
   * Load journey data from session storage
   */
  private loadJourneyData(): void {
    try {
      const storedData = sessionStorage.getItem('journey-analysis-data');
      if (storedData) {
        this.analysisData = JSON.parse(storedData);
        sessionStorage.removeItem('journey-analysis-data'); // Clean up
      }
    } catch (error) {
      console.error('Failed to load journey data:', error);
      this.handleError('Failed to load journey data');
    }
  }

  /**
   * Initialize the UI with journey data
   */
  private initializeUI(): void {
    if (!this.analysisData) {
      this.handleError('No journey data available');
      return;
    }

    // Update page title
    document.title = `${this.analysisData.scenarioName} - Analysis Complete`;

    // Populate journey summary
    this.populateJourneySummary();

    // Populate progress overview
    this.populateProgressOverview();
  }

  /**
   * Populate journey summary section
   */
  private populateJourneySummary(): void {
    const summaryContainer = document.getElementById('journey-summary');
    if (!summaryContainer || !this.analysisData) return;

    const completedSteps = this.analysisData.completedSteps.length;
    const totalSteps = Object.keys(this.analysisData.journeyData).length;
    const completionPercentage = totalSteps > 0 ? Math.round((completedSteps / totalSteps) * 100) : 0;

    summaryContainer.innerHTML = `
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div class="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
          <div class="text-2xl font-bold text-blue-600 dark:text-blue-400">${completedSteps}/${totalSteps}</div>
          <div class="text-sm text-blue-800 dark:text-blue-200">Steps Completed</div>
        </div>
        <div class="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
          <div class="text-2xl font-bold text-green-600 dark:text-green-400">${this.analysisData.scenarioName}</div>
          <div class="text-sm text-green-800 dark:text-green-200">Journey Type</div>
        </div>
        <div class="text-center p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
          <div class="text-2xl font-bold text-purple-600 dark:text-purple-400">${completionPercentage}%</div>
          <div class="text-sm text-purple-800 dark:text-purple-200">Complete</div>
        </div>
      </div>
      
      <div class="mt-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
        <h4 class="font-medium text-gray-900 dark:text-white mb-2">Completed Steps:</h4>
        <div class="flex flex-wrap gap-2">
          ${this.analysisData.completedSteps
            .map(
              (step) => `
            <span class="px-2 py-1 bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 text-xs rounded-full">
              ${this.formatStepName(step)}
            </span>
          `
            )
            .join('')}
        </div>
      </div>
    `;
  }

  /**
   * Populate progress overview
   */
  private populateProgressOverview(): void {
    const progressContainer = document.getElementById('progress-overview');
    if (!progressContainer || !this.analysisData) return;

    const completedSteps = this.analysisData.completedSteps.length;
    const totalSteps = Object.keys(this.analysisData.journeyData).length;
    const percentage = Math.round((completedSteps / totalSteps) * 100);

    progressContainer.innerHTML = `
      <div class="space-y-3">
        <div class="flex justify-between items-center">
          <span class="text-sm font-medium text-gray-700 dark:text-gray-300">Progress</span>
          <span class="text-sm text-gray-500 dark:text-gray-400">${percentage}%</span>
        </div>
        <div class="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
          <div class="bg-green-600 h-2 rounded-full transition-all duration-500" style="width: ${percentage}%"></div>
        </div>
        <div class="text-sm text-gray-600 dark:text-gray-400">
          ${completedSteps} of ${totalSteps} steps completed
        </div>
      </div>
    `;
  }

  /**
   * Generate AI analysis
   */
  private async generateAnalysis(): Promise<void> {
    if (!this.analysisData) return;

    try {
      // Show loading state
      this.showLoadingState();

      // Generate AI analysis
      const analysis = await this.callAIAnalysis();

      // Display analysis
      this.displayAnalysis(analysis);
    } catch (error) {
      console.error('Failed to generate analysis:', error);
      this.handleError('Failed to generate AI analysis');
    }
  }

  /**
   * Call AI analysis API
   */
  private async callAIAnalysis(): Promise<AIAnalysisResponse> {
    const response = await fetch('/api/v1/journey-analysis', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        scenarioId: this.analysisData?.scenarioId,
        scenarioName: this.analysisData?.scenarioName,
        journeyData: this.analysisData?.journeyData,
        completedSteps: this.analysisData?.completedSteps,
      }),
    });

    if (!response.ok) {
      throw new Error(`Analysis API error: ${response.status}`);
    }

    return await response.json();
  }

  /**
   * Display AI analysis results
   */
  private displayAnalysis(analysis: AIAnalysisResponse): void {
    // Display main analysis
    this.displayMainAnalysis(analysis);

    // Display detailed insights
    this.displayDetailedInsights(analysis);

    // Display key metrics
    this.displayKeyMetrics(analysis);

    // Display action items
    this.displayActionItems(analysis);
  }

  /**
   * Display main analysis content
   */
  private displayMainAnalysis(analysis: AIAnalysisResponse): void {
    const analysisContainer = document.getElementById('ai-analysis-content');
    if (!analysisContainer) return;

    analysisContainer.innerHTML = `
      <div class="prose dark:prose-invert max-w-none">
        <div class="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg mb-6">
          <h4 class="font-semibold text-blue-900 dark:text-blue-100 mb-2">Executive Summary</h4>
          <p class="text-blue-800 dark:text-blue-200">${analysis.summary}</p>
        </div>
        
        <div class="space-y-4">
          <h4 class="font-semibold text-gray-900 dark:text-white">Key Recommendations</h4>
          <ul class="space-y-2">
            ${analysis.recommendations
              .map(
                (rec) => `
              <li class="flex items-start">
                <div class="shrink-0 w-2 h-2 bg-blue-600 rounded-full mt-2 mr-3"></div>
                <span class="text-gray-700 dark:text-gray-300">${rec}</span>
              </li>
            `
              )
              .join('')}
          </ul>
        </div>
      </div>
    `;
  }

  /**
   * Display detailed insights
   */
  private displayDetailedInsights(analysis: AIAnalysisResponse): void {
    const insightsContainer = document.getElementById('detailed-insights');
    if (!insightsContainer) return;

    insightsContainer.innerHTML = `
      <div class="space-y-4">
        ${analysis.insights
          .map(
            (insight) => `
          <div class="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <div class="flex items-start">
              <div class="shrink-0 w-6 h-6 bg-purple-600 text-white rounded-full flex items-center justify-center text-sm font-medium mr-3">
                💡
              </div>
              <div class="text-gray-700 dark:text-gray-300">${insight}</div>
            </div>
          </div>
        `
          )
          .join('')}
      </div>
    `;
  }

  /**
   * Display key metrics
   */
  private displayKeyMetrics(analysis: AIAnalysisResponse): void {
    const metricsContainer = document.getElementById('key-metrics');
    if (!metricsContainer) return;

    metricsContainer.innerHTML = `
      <div class="space-y-3">
        ${analysis.keyMetrics
          .map(
            (metric) => `
          <div class="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <span class="text-sm font-medium text-gray-700 dark:text-gray-300">${metric.label}</span>
            <div class="flex items-center space-x-2">
              <span class="text-sm font-semibold text-gray-900 dark:text-white">${metric.value}</span>
              ${
                metric.trend
                  ? `
                <span class="text-xs px-2 py-1 rounded-full ${
                  metric.trend === 'up'
                    ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                    : metric.trend === 'down'
                      ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                      : 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
                }">
                  ${metric.trend === 'up' ? '↗' : metric.trend === 'down' ? '↘' : '→'}
                </span>
              `
                  : ''
              }
            </div>
          </div>
        `
          )
          .join('')}
      </div>
    `;
  }

  /**
   * Display action items
   */
  private displayActionItems(analysis: AIAnalysisResponse): void {
    const actionContainer = document.getElementById('action-items');
    if (!actionContainer) return;

    actionContainer.innerHTML = `
      <div class="space-y-3">
        ${analysis.actionItems
          .map(
            (item) => `
          <div class="p-3 border-l-4 ${
            item.priority === 'high'
              ? 'border-red-500 bg-red-50 dark:bg-red-900/20'
              : item.priority === 'medium'
                ? 'border-yellow-500 bg-yellow-50 dark:bg-yellow-900/20'
                : 'border-green-500 bg-green-50 dark:bg-green-900/20'
          } rounded-r-lg">
            <div class="flex justify-between items-start">
              <div class="flex-1">
                <p class="text-sm font-medium text-gray-900 dark:text-white">${item.task}</p>
                <p class="text-xs text-gray-600 dark:text-gray-400 mt-1">Timeline: ${item.timeline}</p>
              </div>
              <span class="text-xs px-2 py-1 rounded-full ${
                item.priority === 'high'
                  ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                  : item.priority === 'medium'
                    ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                    : 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
              }">
                ${item.priority.toUpperCase()}
              </span>
            </div>
          </div>
        `
          )
          .join('')}
      </div>
    `;
  }

  /**
   * Show loading state
   */
  private showLoadingState(): void {
    // Loading states are already handled by the skeleton UI in the HTML
    // This method can be used for additional loading indicators if needed
  }

  /**
   * Handle errors
   */
  private handleError(message: string): void {
    console.error(message);

    // Show error message to user
    const analysisContainer = document.getElementById('ai-analysis-content');
    if (analysisContainer) {
      analysisContainer.innerHTML = `
        <div class="text-center py-8">
          <div class="text-red-600 dark:text-red-400 mb-4">
            <svg class="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"></path>
            </svg>
          </div>
          <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-2">Analysis Error</h3>
          <p class="text-gray-600 dark:text-gray-400">${message}</p>
          <button 
            onclick="location.reload()" 
            class="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      `;
    }
  }

  /**
   * Format step name for display
   */
  private formatStepName(stepId: string): string {
    return stepId
      .split('-')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }

  /**
   * Setup event listeners
   */
  private setupEventListeners(): void {
    // Chat with AI button
    const chatButton = document.getElementById('chat-with-ai-btn');
    chatButton?.addEventListener('click', () => {
      this.openAIChat();
    });

    // Export PDF button
    const exportButton = document.getElementById('export-pdf-btn');
    exportButton?.addEventListener('click', () => {
      this.exportToPDF();
    });

    // Share results button
    const shareButton = document.getElementById('share-results-btn');
    shareButton?.addEventListener('click', () => {
      this.shareResults();
    });
  }

  /**
   * Open AI chat
   */
  private openAIChat(): void {
    // This would integrate with the existing chat system
    // For now, we'll show a placeholder
    alert('AI Chat feature coming soon! This will allow you to ask questions about your analysis.');
  }

  /**
   * Export to PDF
   */
  private exportToPDF(): void {
    // This would generate a PDF report
    alert(
      'PDF export feature coming soon! This will generate a comprehensive report of your analysis.'
    );
  }

  /**
   * Share results
   */
  private shareResults(): void {
    if (navigator.share) {
      navigator.share({
        title: `${this.analysisData?.scenarioName} Analysis`,
        text: 'Check out my financial journey analysis results!',
        url: window.location.href,
      });
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(window.location.href);
      alert('Link copied to clipboard!');
    }
  }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  new JourneyAnalysisManager();
});

// Export to make this a proper module
export {};
