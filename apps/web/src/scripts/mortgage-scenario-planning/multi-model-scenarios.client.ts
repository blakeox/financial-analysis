/**
 * Multi-Model Financial Analysis Scenarios
 *
 * This module handles the selection and integration of multiple financial models
 * for comprehensive scenario-based analysis.
 */

export interface ScenarioModel {
  id: string;
  name: string;
  description: string;
  url: string;
  order: number;
  required: boolean;
}

export interface FinancialScenario {
  id: string;
  name: string;
  description: string;
  category: 'life-stage' | 'major-purchase' | 'debt-investment' | 'retirement' | 'business';
  ageRange?: string;
  models: ScenarioModel[];
  workflow: string[];
  estimatedDuration: string;
  complexity: 'beginner' | 'intermediate' | 'advanced';
}

type ScenarioTabCategory = 'personal' | 'business';

export class MultiModelScenarioManager {
  private static readonly TAB_CATEGORIES: readonly ScenarioTabCategory[] = ['personal', 'business'];

  private static isSupportedTabCategory(value: string): value is ScenarioTabCategory {
    return (MultiModelScenarioManager.TAB_CATEGORIES as readonly string[]).includes(value);
  }

  private scenarios: Map<string, FinancialScenario> = new Map();
  private selectedScenario: FinancialScenario | null = null;
  private completedModels: Set<string> = new Set();

  constructor() {
    this.initializeScenarios();
    this.setupEventListeners();
  }

  /**
   * Initialize all available financial scenarios
   */
  private initializeScenarios(): void {
    const scenarios: FinancialScenario[] = [
      {
        id: 'young-professional',
        name: 'Young Professional Journey',
        description:
          'Complete financial planning for early career professionals focusing on debt management, emergency funds, and retirement planning.',
        category: 'life-stage',
        ageRange: 'Ages 25-35',
        models: [
          {
            id: 'student-loan',
            name: 'Student Loan Analyzer',
            description: 'Optimize student loan repayment strategies',
            url: '/student-loans',
            order: 1,
            required: true,
          },
          {
            id: 'budget',
            name: 'Budget Optimizer',
            description: 'Create emergency fund and budget planning',
            url: '/budget',
            order: 2,
            required: true,
          },
          {
            id: 'retirement',
            name: 'Retirement Planning Engine',
            description: 'Early retirement planning and 401(k) optimization',
            url: '/retirement-planning',
            order: 3,
            required: true,
          },
          {
            id: 'insurance-needs',
            name: 'Insurance Needs Calculator',
            description: 'Assess life and disability insurance needs',
            url: '/insurance-needs',
            order: 4,
            required: false,
          },
        ],
        workflow: [
          'Assess current financial situation and debt load',
          'Create emergency fund strategy',
          'Optimize student loan repayment',
          'Start retirement planning early',
          'Evaluate insurance needs',
        ],
        estimatedDuration: '2-3 hours',
        complexity: 'beginner',
      },
      {
        id: 'family-planning',
        name: 'Family Planning Journey',
        description:
          'Comprehensive family financial planning including home buying, education funding, and family protection strategies.',
        category: 'life-stage',
        ageRange: 'Ages 30-45',
        models: [
          {
            id: 'home-buying-affordability',
            name: 'Home Buying Affordability Calculator',
            description: 'Analyze home buying readiness and affordability',
            url: '/home-buying-affordability',
            order: 1,
            required: true,
          },
          {
            id: 'college-savings',
            name: 'College Savings Planner',
            description: "Plan for children's education funding",
            url: '/college-savings',
            order: 2,
            required: true,
          },
          {
            id: 'insurance-needs',
            name: 'Insurance Needs Calculator',
            description: 'Comprehensive family insurance analysis',
            url: '/insurance-needs',
            order: 3,
            required: true,
          },
          {
            id: 'tax-optimization',
            name: 'Tax Optimization Planner',
            description: 'Optimize tax strategy for family finances',
            url: '/tax-optimization',
            order: 4,
            required: false,
          },
        ],
        workflow: [
          'Evaluate home buying readiness',
          "Plan for children's education costs",
          'Assess family insurance needs',
          'Optimize tax strategy',
          'Create comprehensive family budget',
        ],
        estimatedDuration: '3-4 hours',
        complexity: 'intermediate',
      },
      {
        id: 'home-buying',
        name: 'Home Buying Journey',
        description:
          'Complete home buying analysis from affordability assessment to mortgage optimization and ongoing cost planning.',
        category: 'major-purchase',
        models: [
          {
            id: 'home-buying-affordability',
            name: 'Home Buying Affordability Calculator',
            description: 'Analyze maximum affordable home price',
            url: '/home-buying-affordability',
            order: 1,
            required: true,
          },
          {
            id: 'amortization',
            name: 'Residential Mortgage Calculator',
            description: 'Compare mortgage options and terms',
            url: '/amortization',
            order: 2,
            required: true,
          },
          {
            id: 'budget',
            name: 'Budget Optimizer',
            description: 'Plan for ongoing homeownership costs',
            url: '/budget',
            order: 3,
            required: true,
          },
          {
            id: 'savings-goal',
            name: 'Savings Goal Planner',
            description: 'Plan for down payment and closing costs',
            url: '/savings-goal',
            order: 4,
            required: false,
          },
        ],
        workflow: [
          'Determine home buying affordability',
          'Compare mortgage options',
          'Plan for down payment and closing costs',
          'Budget for ongoing homeownership expenses',
          'Create home buying timeline',
        ],
        estimatedDuration: '2-3 hours',
        complexity: 'intermediate',
      },
      {
        id: 'auto-lease-decision',
        name: 'Auto Lease Decision Journey',
        description:
          'Compare finishing your lease, buying out, or switching to a new lease or financed vs cash new car with clear total cost, cash needs, and risk checks.',
        category: 'major-purchase',
        models: [
          {
            id: 'lease-profile',
            name: 'Existing Lease Snapshot',
            description: 'Capture lease terms, mileage, cash position, and priorities',
            url: '/journey/auto-lease-decision/step/lease-profile',
            order: 1,
            required: true,
          },
          {
            id: 'lease-vs-buyout',
            name: 'Buyout Math & Equity Check',
            description: 'Compare finishing the lease vs buying out now or later with taxes and fees',
            url: '/journey/auto-lease-decision/step/lease-vs-buyout',
            order: 2,
            required: true,
          },
          {
            id: 'replacement-options',
            name: 'New Lease vs Finance vs Cash',
            description: 'Enter new lease terms, financed new car terms, and cash purchase (mark cash not an option if short)',
            url: '/journey/auto-lease-decision/step/replacement-options',
            order: 3,
            required: true,
          },
          {
            id: 'decision-review',
            name: 'Decision Scorecard & Next Steps',
            description: 'Summarize tradeoffs, risks, and action plan',
            url: '/journey/auto-lease-decision/step/decision-review',
            order: 4,
            required: true,
          },
        ],
        workflow: [
          'Capture lease details, cash position, and goals',
          'Model lease buyout cash flows and equity',
          'Compare replacement options (new lease vs finance vs cash purchase)',
          'Create decision scorecard with risks and next steps',
        ],
        estimatedDuration: '60-90 minutes',
        complexity: 'intermediate',
      },
      {
        id: 'debt-elimination',
        name: 'Debt Elimination Strategy',
        description:
          'Comprehensive debt payoff strategy combining multiple debt types with investment optimization for maximum financial growth.',
        category: 'debt-investment',
        models: [
          {
            id: 'student-loan',
            name: 'Student Loan Analyzer',
            description: 'Optimize student loan repayment',
            url: '/student-loans',
            order: 1,
            required: true,
          },
          {
            id: 'debt-payoff',
            name: 'Debt Payoff Optimizer',
            description: 'Create comprehensive debt elimination plan',
            url: '/debt-payoff',
            order: 2,
            required: true,
          },
          {
            id: 'auto-loan',
            name: 'Auto Loan Calculator',
            description: 'Analyze vehicle financing options',
            url: '/auto-loan',
            order: 3,
            required: false,
          },
          {
            id: 'investment-portfolio',
            name: 'Investment Portfolio Analyzer',
            description: 'Balance debt payoff with investment growth',
            url: '/investment-portfolio',
            order: 4,
            required: false,
          },
        ],
        workflow: [
          'Assess all debt types and balances',
          'Create debt elimination timeline',
          'Optimize payoff strategies',
          'Balance debt payoff with investments',
          'Monitor progress and adjust strategy',
        ],
        estimatedDuration: '2-3 hours',
        complexity: 'intermediate',
      },
      {
        id: 'investment-portfolio',
        name: 'Investment Portfolio Build',
        description:
          'Build and optimize investment portfolios with tax-efficient strategies and risk management for long-term wealth building.',
        category: 'debt-investment',
        models: [
          {
            id: 'retirement-planning',
            name: 'Retirement Planning Engine',
            description: 'Optimize retirement account contributions',
            url: '/retirement-planning',
            order: 1,
            required: true,
          },
          {
            id: 'investment-portfolio',
            name: 'Investment Portfolio Analyzer',
            description: 'Build diversified investment portfolio',
            url: '/investment-portfolio',
            order: 2,
            required: true,
          },
          {
            id: 'tax-optimization',
            name: 'Tax Optimization Planner',
            description: 'Implement tax-efficient investment strategies',
            url: '/tax-optimization',
            order: 3,
            required: true,
          },
          {
            id: 'budget',
            name: 'Budget Optimizer',
            description: 'Allocate budget for investment contributions',
            url: '/budget',
            order: 4,
            required: false,
          },
        ],
        workflow: [
          'Assess current investment situation',
          'Optimize retirement account strategy',
          'Build diversified portfolio',
          'Implement tax-efficient strategies',
          'Create ongoing investment plan',
        ],
        estimatedDuration: '3-4 hours',
        complexity: 'advanced',
      },
      {
        id: 'pre-retirement',
        name: 'Pre-Retirement Planning',
        description:
          'Comprehensive pre-retirement planning focusing on catch-up contributions, tax optimization, and retirement readiness assessment.',
        category: 'retirement',
        ageRange: 'Ages 50-65',
        models: [
          {
            id: 'retirement-planning',
            name: 'Retirement Planning Engine',
            description: 'Catch-up contributions and retirement readiness',
            url: '/retirement-planning',
            order: 1,
            required: true,
          },
          {
            id: 'tax-optimization',
            name: 'Tax Optimization Planner',
            description: 'Optimize tax strategy for retirement transition',
            url: '/tax-optimization',
            order: 2,
            required: true,
          },
          {
            id: 'investment-portfolio',
            name: 'Investment Portfolio Analyzer',
            description: 'Adjust portfolio for retirement timeline',
            url: '/investment-portfolio',
            order: 3,
            required: true,
          },
          {
            id: 'insurance-needs',
            name: 'Insurance Needs Calculator',
            description: 'Evaluate long-term care and health insurance',
            url: '/insurance-needs',
            order: 4,
            required: false,
          },
        ],
        workflow: [
          'Assess retirement readiness',
          'Maximize catch-up contributions',
          'Optimize tax diversification',
          'Adjust investment strategy',
          'Plan for healthcare costs',
        ],
        estimatedDuration: '3-4 hours',
        complexity: 'advanced',
      },
      // Business Finance Journey Scenarios
      {
        id: 'startup-planning',
        name: 'Startup Financial Planning',
        description:
          'Complete financial planning journey for startups including cash flow projections, funding analysis, and growth planning',
        category: 'business',
        models: [
          {
            id: 'budget',
            name: 'Budget Calculator',
            description: 'Create startup budget and cash flow projections',
            url: '/calculator/budget',
            order: 1,
            required: true,
          },
          {
            id: 'savings-goal',
            name: 'Savings Goal Calculator',
            description: 'Plan funding milestones and runway',
            url: '/calculator/savings-goal',
            order: 2,
            required: true,
          },
        ],
        workflow: [
          'Create initial budget and cash flow projections',
          'Plan funding milestones and runway',
          'Analyze growth scenarios',
          'Optimize resource allocation',
          'Monitor financial health',
        ],
        estimatedDuration: '2-3 hours',
        complexity: 'beginner',
      },
      {
        id: 'ma-analysis-journey',
        name: 'M&A Analysis Journey',
        description:
          'Comprehensive M&A analysis journey including valuation, synergy assessment, risk analysis, and integration planning',
        category: 'business',
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
        workflow: [
          'Analyze acquirer and target financials',
          'Perform DCF valuation of target',
          'Calculate transaction metrics and synergies',
          'Assess integration risks',
          'Create integration timeline',
        ],
        estimatedDuration: '4-5 hours',
        complexity: 'advanced',
      },
      {
        id: 'investment-analysis-journey',
        name: 'Investment Analysis Journey',
        description:
          'Complete investment analysis journey including DCF valuation, comparable analysis, risk assessment, and portfolio optimization',
        category: 'business',
        models: [
          {
            id: 'dcf-valuation',
            name: 'DCF Valuation Calculator',
            description: 'Detailed DCF analysis for investment valuation',
            url: '/calculator/dcf-valuation',
            order: 1,
            required: true,
          },
          {
            id: 'risk-management',
            name: 'Risk Management Calculator',
            description: 'Assess investment risks and portfolio impact',
            url: '/calculator/risk-management',
            order: 2,
            required: true,
          },
        ],
        workflow: [
          'Perform DCF valuation analysis',
          'Assess investment risks',
          'Analyze portfolio impact',
          'Optimize investment allocation',
          'Monitor performance',
        ],
        estimatedDuration: '3-4 hours',
        complexity: 'intermediate',
      },
      {
        id: 'risk-management-journey',
        name: 'Risk Management Journey',
        description:
          'Comprehensive risk management journey including VaR analysis, stress testing, credit risk assessment, and portfolio optimization',
        category: 'business',
        models: [
          {
            id: 'risk-management',
            name: 'Risk Management Calculator',
            description: 'Complete risk analysis with VaR and stress testing',
            url: '/calculator/risk-management',
            order: 1,
            required: true,
          },
        ],
        workflow: [
          'Calculate Value at Risk (VaR)',
          'Perform stress testing scenarios',
          'Analyze portfolio risk metrics',
          'Run Monte Carlo simulations',
          'Generate risk reports',
        ],
        estimatedDuration: '3-4 hours',
        complexity: 'intermediate',
      },
      {
        id: 'capital-structure-journey',
        name: 'Capital Structure Journey',
        description:
          'Complete capital structure optimization journey including debt analysis, cost of capital, and optimal financing mix',
        category: 'business',
        models: [
          {
            id: 'budget',
            name: 'Budget Calculator',
            description: 'Analyze current capital structure and cash flows',
            url: '/calculator/budget',
            order: 1,
            required: true,
          },
          {
            id: 'risk-management',
            name: 'Risk Management Calculator',
            description: 'Assess capital structure risks',
            url: '/calculator/risk-management',
            order: 2,
            required: true,
          },
        ],
        workflow: [
          'Analyze current capital structure',
          'Calculate cost of capital',
          'Assess capital structure risks',
          'Optimize debt-to-equity ratio',
          'Plan financing strategy',
        ],
        estimatedDuration: '3-4 hours',
        complexity: 'advanced',
      },
      {
        id: 'project-finance-journey',
        name: 'Project Finance Journey',
        description:
          'Comprehensive project finance journey for infrastructure projects including feasibility analysis, risk assessment, and financing optimization',
        category: 'business',
        models: [
          {
            id: 'dcf-valuation',
            name: 'DCF Valuation Calculator',
            description: 'Project cash flow analysis and NPV calculation',
            url: '/calculator/dcf-valuation',
            order: 1,
            required: true,
          },
          {
            id: 'risk-management',
            name: 'Risk Management Calculator',
            description: 'Project risk assessment and mitigation',
            url: '/calculator/risk-management',
            order: 2,
            required: true,
          },
        ],
        workflow: [
          'Analyze project cash flows',
          'Calculate project NPV and IRR',
          'Assess project risks',
          'Optimize financing structure',
          'Monitor project performance',
        ],
        estimatedDuration: '4-5 hours',
        complexity: 'advanced',
      },
    ];

    // Store scenarios in map for easy access
    scenarios.forEach((scenario) => {
      this.scenarios.set(scenario.id, scenario);
    });
  }

  /**
   * Setup event listeners for scenario interactions
   */
  private setupEventListeners(): void {
    console.log('Setting up event listeners for scenario cards');

    // Listen for tab button clicks
    document.addEventListener('click', (event) => {
      const target = event.target as HTMLElement;
      const tabButton = target.closest('.tab-button');

      if (tabButton) {
        const category = tabButton.getAttribute('data-category');
        if (category && MultiModelScenarioManager.isSupportedTabCategory(category)) {
          this.switchCategory(category);
        }
      }
    });

    // Listen for scenario card clicks
    document.addEventListener('click', (event) => {
      const target = event.target as HTMLElement;
      const scenarioCard = target.closest('.scenario-card');

      if (scenarioCard) {
        const scenarioId = scenarioCard.getAttribute('data-scenario');
        console.log('Scenario card clicked:', scenarioId);
        if (scenarioId) {
          // Call the global function to ensure console logging
          if (window.selectScenario) {
            window.selectScenario(scenarioId);
          } else {
            this.selectScenario(scenarioId);
          }
        }
      }
    });

    // Listen for model completion events
    document.addEventListener('model-completed', (event: CustomEvent) => {
      const modelId = event.detail.modelId;
      this.markModelCompleted(modelId);
    });

    // Listen for analysis result updates
    document.addEventListener('analysis-result-updated', () => {
      this.updateScenarioProgress();
    });
  }

  /**
   * Switch between personal and business categories
   */
  private switchCategory(category: ScenarioTabCategory): void {
    console.log('Switching to category:', category);

    // Update tab buttons
    const tabButtons = document.querySelectorAll('.tab-button');
    tabButtons.forEach((button) => {
      button.classList.remove('active');
    });

    const activeTab = document.querySelector(`[data-category="${category}"]`);
    if (activeTab) {
      activeTab.classList.add('active');
    }

    // Show/hide scenario categories
    const personalScenarios = document.getElementById('personal-scenarios');
    const businessScenarios = document.getElementById('business-scenarios');

    if (category === 'personal') {
      personalScenarios?.classList.remove('hidden');
      businessScenarios?.classList.add('hidden');
    } else {
      personalScenarios?.classList.add('hidden');
      businessScenarios?.classList.remove('hidden');
    }
  }

  /**
   * Select a financial scenario
   */
  public selectScenario(scenarioId: string): void {
    const scenario = this.scenarios.get(scenarioId);
    if (!scenario) {
      console.error(`Scenario ${scenarioId} not found`);
      return;
    }

    console.log(`Navigating to journey page for scenario: ${scenarioId}`);

    // All scenarios on analysis page should go to journey pages (multi-step)
    // Business calculators are standalone tools accessed from /models/business
    window.location.href = `/journey/${scenarioId}`;
  }

  /**
   * Display selected scenario information
   */
  private displayScenarioInfo(scenario: FinancialScenario): void {
    const titleElement = document.getElementById('selected-scenario-title');
    const descriptionElement = document.getElementById('selected-scenario-description');
    const modelsElement = document.getElementById('scenario-models');
    const infoElement = document.getElementById('selected-scenario-info');

    if (titleElement) {
      titleElement.textContent = scenario.name;
    }

    if (descriptionElement) {
      descriptionElement.textContent = scenario.description;
    }

    if (modelsElement) {
      modelsElement.innerHTML = this.generateModelsHTML(scenario);
    }

    if (infoElement) {
      infoElement.classList.remove('hidden');
    }

    // Update scenario cards visual state
    this.updateScenarioCardsState(scenario.id);
  }

  /**
   * Generate HTML for scenario models
   */
  private generateModelsHTML(scenario: FinancialScenario): string {
    const modelsHTML = scenario.models
      .map((model) => {
        const isCompleted = this.completedModels.has(model.id);
        const statusClass = isCompleted
          ? 'text-emerald-600 dark:text-emerald-400'
          : 'text-slate-600 dark:text-slate-400';
        const statusIcon = isCompleted ? '✓' : '○';

        return `
        <div class="flex items-center justify-between p-3 fa-table-head rounded-lg mb-2">
          <div class="flex items-center">
            <span class="text-lg mr-3 ${statusClass}">${statusIcon}</span>
            <div>
              <h4 class="fa-script-title-sm">${model.name}</h4>
              <p class="fa-script-copy-muted">${model.description}</p>
            </div>
          </div>
          <div class="flex items-center space-x-2">
            ${model.required ? '<span class="fa-badge-danger">Required</span>' : ''}
            <a href="${model.url}" class="fa-button-info-compact">
              ${isCompleted ? 'Review' : 'Start'}
            </a>
          </div>
        </div>
      `;
      })
      .join('');

    return `
      <div class="mb-4">
        <h4 class="text-lg fa-list-copy-strong mb-3">Models in this Scenario</h4>
        <div class="space-y-2">
          ${modelsHTML}
        </div>
      </div>
      <div class="bg-violet-50 dark:bg-violet-900/20 border border-violet-200 dark:border-violet-700 rounded-lg p-4">
        <h5 class="font-medium text-violet-900 dark:text-violet-300 mb-2">Workflow Steps:</h5>
        <ol class="list-decimal list-inside space-y-1 text-sm text-violet-800 dark:text-violet-400">
          ${scenario.workflow.map((step) => `<li>${step}</li>`).join('')}
        </ol>
        <div class="mt-3 flex items-center justify-between text-sm text-violet-700 dark:text-violet-300">
          <span>Estimated Duration: ${scenario.estimatedDuration}</span>
          <span>Complexity: ${scenario.complexity.charAt(0).toUpperCase() + scenario.complexity.slice(1)}</span>
        </div>
      </div>
    `;
  }

  /**
   * Update visual state of scenario cards
   */
  private updateScenarioCardsState(selectedId: string): void {
    const scenarioCards = document.querySelectorAll('.scenario-card');
    scenarioCards.forEach((card) => {
      const cardId = card.getAttribute('data-scenario');
      if (cardId === selectedId) {
        card.classList.add('fa-scenario-card-selected');
      } else {
        card.classList.remove('fa-scenario-card-selected');
      }
    });
  }

  /**
   * Mark a model as completed
   */
  public markModelCompleted(modelId: string): void {
    this.completedModels.add(modelId);

    if (this.selectedScenario) {
      this.displayScenarioInfo(this.selectedScenario);
    }
  }

  /**
   * Update scenario progress
   */
  private updateScenarioProgress(): void {
    if (this.selectedScenario) {
      this.displayScenarioInfo(this.selectedScenario);
    }
  }

  /**
   * Clear scenario selection
   */
  public clearScenarioSelection(): void {
    this.selectedScenario = null;
    this.completedModels.clear();

    const infoElement = document.getElementById('selected-scenario-info');
    if (infoElement) {
      infoElement.classList.add('hidden');
    }

    // Clear visual state
    const scenarioCards = document.querySelectorAll('.scenario-card');
    scenarioCards.forEach((card) => {
      card.classList.remove('fa-scenario-card-selected');
    });

    // Clear chatbot context
    if (typeof window !== 'undefined') {
      window.currentScenario = null;
    }
  }

  /**
   * Get scenario by ID
   */
  public getScenario(scenarioId: string): FinancialScenario | undefined {
    return this.scenarios.get(scenarioId);
  }

  /**
   * Get all scenarios
   */
  public getAllScenarios(): FinancialScenario[] {
    return Array.from(this.scenarios.values());
  }

  /**
   * Get scenarios by category
   */
  public getScenariosByCategory(category: string): FinancialScenario[] {
    return Array.from(this.scenarios.values()).filter((scenario) => scenario.category === category);
  }

  /**
   * Get scenario progress
   */
  public getScenarioProgress(scenarioId: string): {
    completed: number;
    total: number;
    percentage: number;
  } {
    const scenario = this.scenarios.get(scenarioId);
    if (!scenario) {
      return { completed: 0, total: 0, percentage: 0 };
    }

    const completed = scenario.models.filter((model) => this.completedModels.has(model.id)).length;

    const total = scenario.models.length;
    const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;

    return { completed, total, percentage };
  }
}

// Global functions for HTML onclick handlers
declare global {
  interface Window {
    selectScenario: (scenarioId: string) => void;
    clearScenarioSelection: () => void;
    scenarioManager: MultiModelScenarioManager;
    currentScenario?: {
      id: string;
      name: string;
      description: string;
      models: Array<{ id: string; name: string; url: string }>;
      workflow: string[];
    } | null;
  }
}

// Initialize scenario manager when DOM is loaded
function initializeScenarioManager() {
  console.log('Multi-model scenarios script loaded');
  window.scenarioManager = new MultiModelScenarioManager();
  console.log('Scenario manager initialized:', window.scenarioManager);

  // Make functions globally available
  window.selectScenario = (scenarioId: string) => {
    console.log('selectScenario called with:', scenarioId);
    window.scenarioManager.selectScenario(scenarioId);
  };

  window.clearScenarioSelection = () => {
    console.log('clearScenarioSelection called');
    window.scenarioManager.clearScenarioSelection();
  };

  console.log('Global functions registered');
}

// Check if DOM is already loaded
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeScenarioManager);
} else {
  // DOM is already loaded, initialize immediately
  initializeScenarioManager();
}

export default MultiModelScenarioManager;
