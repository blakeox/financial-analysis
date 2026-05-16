import React, { useEffect, useId, useMemo, useState } from 'react';
import { cn } from '../lib/utils';
import { Menu, X, Coffee } from 'lucide-react';
import { Button } from './Button';

interface NavItem {
  name: string;
  href: string;
  current?: boolean;
}

interface NavbarProps {
  className?: string;
  /**
   * Optional override for nav items.
   */
  items?: NavItem[];
  /**
   * Current path (e.g. "/analysis"). If provided, we'll highlight the matching nav item.
   */
  currentPath?: string;
  /**
   * Make the header sticky at the top.
   */
  sticky?: boolean;
  /**
   * Optional CTA button rendered on the right in desktop and in the mobile sheet.
   */
  cta?: { label: string; href: string };
}

const defaultNavigation: NavItem[] = [
  { name: 'Home', href: '/', current: true },
  { name: 'Models', href: '/models' },
  { name: 'Analysis', href: '/analysis' },
];

export const Navbar: React.FC<NavbarProps> = ({ className, items, currentPath, sticky, cta }) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const reactId = useId();
  const menuId = `primary-navigation-${reactId}`;

  const navItems = useMemo<NavItem[]>(() => items ?? defaultNavigation, [items]);

  // Close menu on Escape and add shadow on scroll for better UX
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMobileMenuOpen(false);
    };
    const onScroll = () => setScrolled(window.scrollY > 0);
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('scroll', onScroll);
    };
  }, []);

  // Prevent background scroll when mobile menu is open
  useEffect(() => {
    const original = document.body.style.overflow;
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = original || '';
    }
    return () => {
      document.body.style.overflow = original || '';
    };
  }, [mobileMenuOpen]);

  const isActive = (href: string, current?: boolean) =>
    currentPath ? (href === '/' ? currentPath === '/' : currentPath.startsWith(href)) : !!current;

  return (
    <nav
      className={cn(
        'supports-backdrop-blur:bg-white/70 border-b border-slate-200/70 bg-white/80 backdrop-blur dark:border-slate-800/60 dark:bg-slate-950/70',
        sticky && 'sticky top-0 z-50',
        scrolled && 'shadow-sm',
        className
      )}
      role="navigation"
      aria-label="Primary"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand */}
          <div className="flex items-center gap-3">
            <a
              href="/"
              aria-label="Home"
              className="inline-flex h-9 w-9 items-center justify-center rounded-xl transition-colors hover:bg-slate-100 dark:hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500/70"
            >
              <Coffee className="h-5 w-5 text-slate-900 dark:text-white" aria-hidden="true" />
            </a>
            {/* Desktop nav (md and up) */}
            <div className="hidden md:flex items-center gap-1 ml-2">
              {navItems.map((item) => {
                const active = isActive(item.href, item.current);
                return (
                  <a
                    key={item.name}
                    href={item.href}
                    aria-current={active ? 'page' : undefined}
                    className={cn(
                      'rounded-xl px-3 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500/70',
                      active
                        ? 'bg-violet-50 text-violet-700 dark:bg-violet-950/30 dark:text-violet-300'
                        : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white'
                    )}
                  >
                    {item.name}
                  </a>
                );
              })}
            </div>
          </div>

          {/* Right actions */}
          <div className="flex items-center gap-2">
            {cta ? (
              <div className="hidden md:flex items-center">
                <a href={cta.href} aria-label={cta.label} className="ml-2">
                  <Button>{cta.label}</Button>
                </a>
              </div>
            ) : null}

            {/* Mobile menu button (hidden on md and up) */}
            <div className="flex md:hidden">
              <button
                type="button"
                className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-300/70 text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:border-slate-700/60 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500/70"
                onClick={() => setMobileMenuOpen((v) => !v)}
                aria-controls={menuId}
                aria-expanded={mobileMenuOpen ? 'true' : 'false'}
                aria-label={mobileMenuOpen ? 'Close main menu' : 'Open main menu'}
              >
                <span className="sr-only">{mobileMenuOpen ? 'Close menu' : 'Open menu'}</span>
                {mobileMenuOpen ? (
                  <X className="h-5 w-5" aria-hidden="true" />
                ) : (
                  <Menu className="h-5 w-5" aria-hidden="true" />
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile menu overlay (only on small screens) */}
      {mobileMenuOpen && (
        <div
          id={menuId}
          className="fixed inset-x-0 top-16 bottom-0 z-40 border-t border-slate-200 bg-white/95 backdrop-blur-sm dark:border-slate-800 dark:bg-slate-950/95 md:hidden"
          role="region"
          aria-label="Mobile primary navigation"
        >
          <div className="px-4 py-4 space-y-1 overflow-y-auto">
            {navItems.map((item) => {
              const active = isActive(item.href, item.current);
              return (
                <a
                  key={item.name}
                  href={item.href}
                  aria-current={active ? 'page' : undefined}
                  className={cn(
                    'block rounded-xl px-3 py-2 text-base font-medium transition-colors',
                    active
                      ? 'bg-violet-50 text-violet-700 dark:bg-violet-950/30 dark:text-violet-300'
                      : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white'
                  )}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {item.name}
                </a>
              );
            })}

            {cta ? (
              <div className="pt-2">
                <a
                  href={cta.href}
                  aria-label={cta.label}
                  onClick={() => setMobileMenuOpen(false)}
                  className="block"
                >
                  <Button className="w-full">{cta.label}</Button>
                </a>
              </div>
            ) : null}
          </div>
        </div>
      )}
    </nav>
  );
};
