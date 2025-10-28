export interface MAAnalysisInput {
  transactionInfo: {
    acquirer: string;
    target: string;
    transactionType: 'acquisition' | 'merger' | 'divestiture' | 'spin-off' | 'joint-venture';
    purchasePrice: number;
    premium: number;
    dealSize: 'small' | 'medium' | 'large' | 'mega';
  };
  financialData: {
    acquirerRevenue: number;
    acquirerEbitda: number;
    targetRevenue: number;
    targetEbitda: number;
    synergies: number;
    integrationCosts: number;
  };
  assumptions: {
    synergyProbability: number;
    integrationTimeline: number;
    revenueSynergies: number;
    costSynergies: number;
  };
  goals: {
    analysisType: 'accretion-dilution' | 'synergy-analysis' | 'value-creation';
    includeSensitivity: boolean;
    includeIntegrationPlanning: boolean;
  };
}

export interface MAAnalysisResult {
  summary: {
    transactionValue: number;
    synergyValue: number;
    netValueCreation: number;
    epsAccretion: number;
  };
  recommendations: string[];
  insights: string[];
}
