export type InteractionType = 'pointer' | 'keyboard' | 'programmatic';

export type ModelMetadata = {
  id: string | null;
  name: string | null;
  description: string | null;
  status: 'available' | 'coming-soon';
  ctaHref: string | null;
  ctaLabel: string | null;
  features: string[];
};

export type ModelSelectionContext = {
  id: string | null;
  name: string | null;
  status: 'available' | 'coming-soon';
};
