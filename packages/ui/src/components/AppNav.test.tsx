import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { AppNav } from './AppNav';
import type { NavItem } from './navTypes';
// Minimal nav config for tests to avoid TSX imports
const navConfig: NavItem[] = [
  { id: 'home', label: 'Home', href: '/' },
  {
    id: 'analysis',
    label: 'Analysis',
    href: '/analysis',
    children: [
      { id: 'lease', label: 'Lease', href: '/analysis/lease' },
      { id: 'amortization', label: 'Amortization', href: '/analysis/amortization' },
    ],
  },
  { id: 'models', label: 'Models', href: '/models' },
  { id: 'notifications', label: 'Notifications', href: '/notifications', badgeCount: 3 },
  {
    id: 'account',
    label: 'Account',
    children: [
      { id: 'profile', label: 'Profile', href: '/account/profile' },
      { id: 'settings', label: 'Settings', href: '/account/settings' },
      { id: 'signout', label: 'Sign Out', href: '#' },
    ],
  },
];
import { axe, toHaveNoViolations } from 'jest-axe';
expect.extend(toHaveNoViolations);

describe('AppNav', () => {
  const renderNav = (path = '/'): void => {
    render(
      <AppNav items={navConfig} currentPath={path} onSignOut={vi.fn()} onSearch={vi.fn()} />
    );
  };

  it('renders all primary nav items', () => {
    renderNav();
    navConfig.forEach((item) => {
      if (!item.children) {
        expect(screen.getByText(item.label)).toBeInTheDocument();
      }
    });
  });

  it('shows dropdown on click and keyboard', () => {
    renderNav();
    const btn = screen.getByRole('button', { name: /analysis/i });
    fireEvent.click(btn);
    expect(screen.getByRole('menu', { name: /analysis/i })).toBeVisible();
    fireEvent.keyDown(btn, { key: 'Escape' });
    expect(screen.queryByRole('menu', { name: /analysis/i })).not.toBeInTheDocument();
  });

  it('mobile menu opens and traps focus', () => {
    renderNav();
    const hamburger = screen.getByLabelText(/open menu/i);
    fireEvent.click(hamburger);
    const drawer = screen.getByRole('dialog', { name: /mobile navigation/i });
    expect(drawer).toBeVisible();
    // Focus trap: tab cycles inside
    const first = drawer.querySelector('[tabindex="0"]');
    first && first.focus();
    fireEvent.keyDown(drawer, { key: 'Tab' });
    expect(document.activeElement).not.toBe(hamburger);
    fireEvent.keyDown(drawer, { key: 'Escape' });
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('dropdown menu supports arrow key navigation', () => {
    renderNav();
    const btn = screen.getByRole('button', { name: /analysis/i });
    fireEvent.keyDown(btn, { key: 'Enter' });
    const menu = screen.getByRole('menu', { name: /analysis/i });
    const items = menu.querySelectorAll('[role="menuitem"]');
    items[0].focus();
    fireEvent.keyDown(items[0], { key: 'ArrowDown' });
    expect(document.activeElement).toBe(items[1]);
    fireEvent.keyDown(items[1], { key: 'ArrowUp' });
    expect(document.activeElement).toBe(items[0]);
  });

  it('menu visibility toggles on open/close', () => {
    renderNav();
    const btn = screen.getByRole('button', { name: /analysis/i });
    expect(screen.queryByRole('menu', { name: /analysis/i })).not.toBeInTheDocument();
    fireEvent.click(btn);
    expect(screen.getByRole('menu', { name: /analysis/i })).toBeVisible();
    fireEvent.click(btn);
    expect(screen.queryByRole('menu', { name: /analysis/i })).not.toBeInTheDocument();
  });

  it('has no axe accessibility violations', async () => {
    const { container } = render(
      <AppNav items={navConfig} currentPath="/" onSignOut={vi.fn()} onSearch={vi.fn()} />
    );
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});

// Manual test script (see AppNav.tsx for details):
// 1. Tab through nav: logo → links → utilities → hamburger (mobile)
// 2. Arrow keys move between menu items; Esc closes dropdowns/drawer
// 3. Focus is visible and not lost on open/close
// 4. Screen reader announces menu open/close and active page
// 5. All links/buttons are reachable and operable by keyboard only
