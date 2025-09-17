import React from 'react';
import type { NavItem } from './navTypes';

// Example icon stubs (replace with real icons or Heroicons)
export function HomeIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg {...props} viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
      <path d="M10 2L2 8h2v8h4v-4h4v4h4V8h2L10 2z" />
    </svg>
  );
}
export function ChartBarIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg {...props} viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
      <rect x="3" y="10" width="3" height="7" />
      <rect x="8.5" y="6" width="3" height="11" />
      <rect x="14" y="13" width="3" height="4" />
    </svg>
  );
}
export function BellIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg {...props} viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
      <path d="M10 2a6 6 0 016 6v3.586l.707.707A1 1 0 0116.586 14H3.414a1 1 0 01-.707-1.707L3.414 11.586V8a6 6 0 016-6z" />
    </svg>
  );
}
export function UserCircleIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg {...props} viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
      <circle cx="10" cy="7" r="4" />
      <path d="M2 18a8 8 0 0116 0H2z" />
    </svg>
  );
}
export function CogIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg {...props} viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
      <circle cx="10" cy="10" r="3" />
      <path d="M4.22 4.22a8 8 0 0111.56 0M2 10a8 8 0 0116 0M4.22 15.78a8 8 0 0111.56 0" />
    </svg>
  );
}

export const navConfig: NavItem[] = [
  {
    id: 'home',
    label: 'Home',
    href: '/',
    icon: HomeIcon,
  },
  {
    id: 'analysis',
    label: 'Analysis',
    href: '/analysis',
    icon: ChartBarIcon,
    children: [
      { id: 'lease', label: 'Lease', href: '/analysis/lease' },
      { id: 'amortization', label: 'Amortization', href: '/analysis/amortization' },
    ],
  },
  {
    id: 'models',
    label: 'Models',
    href: '/models',
    icon: CogIcon,
  },
  {
    id: 'notifications',
    label: 'Notifications',
    icon: BellIcon,
    href: '/notifications',
    badgeCount: 3,
    rightSlot: null,
  },
  {
    id: 'account',
    label: 'Account',
    icon: UserCircleIcon,
    children: [
      { id: 'profile', label: 'Profile', href: '/account/profile' },
      { id: 'settings', label: 'Settings', href: '/account/settings' },
      { id: 'signout', label: 'Sign Out', href: '#', rightSlot: null },
    ],
    requiresAuth: true,
  },
];
