import type { ComponentType, ReactNode, SVGProps } from 'react';

export type NavItem = {
  id: string;
  label: string;
  href?: string;
  icon?: ComponentType<SVGProps<SVGSVGElement>>;
  children?: NavItem[];
  badgeCount?: number;
  external?: boolean;
  rightSlot?: ReactNode;
  requiresAuth?: boolean;
};
