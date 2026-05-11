import { createContext, useContext, useState, type ReactNode } from 'react';
import { cn } from '../lib/utils';
import { cardVariants, textColors } from '../lib/classNames';

interface TabsContextValue {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

const TabsContext = createContext<TabsContextValue | undefined>(undefined);

function useTabs() {
  const context = useContext(TabsContext);
  if (!context) {
    throw new Error('useTabs must be used within a Tabs component');
  }
  return context;
}

interface TabsProps {
  defaultValue: string;
  className?: string;
  children: ReactNode;
}

export function Tabs({ defaultValue, className = '', children }: TabsProps) {
  const [activeTab, setActiveTab] = useState(defaultValue);

  return (
    <TabsContext.Provider value={{ activeTab, setActiveTab }}>
      <div className={className}>{children}</div>
    </TabsContext.Provider>
  );
}

interface TabsListProps {
  className?: string;
  children: ReactNode;
}

export function TabsList({ className = '', children }: TabsListProps) {
  return (
    <div
      role="tablist"
      className={cn(
        cn(cardVariants.subtle, 'inline-flex h-11 items-center justify-center p-1 text-slate-500 shadow-sm dark:text-slate-400'),
        className
      )}
    >
      {children}
    </div>
  );
}

interface TabsTriggerProps {
  value: string;
  className?: string;
  children: ReactNode;
}

export function TabsTrigger({ value, className = '', children }: TabsTriggerProps) {
  const { activeTab, setActiveTab } = useTabs();
  const isActive = activeTab === value;

  const handleSelect = () => {
    setActiveTab(value);
  };

  return (
    <button
      type="button"
      role="tab"
      aria-selected={isActive}
      className={cn(
        'inline-flex items-center justify-center whitespace-nowrap rounded-xl px-3.5 py-2 text-sm font-medium ring-offset-white transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500/70 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
        isActive
          ? 'bg-white/95 text-slate-950 shadow-sm dark:bg-slate-950 dark:text-slate-50'
          : 'text-slate-600 hover:bg-violet-50/70 hover:text-violet-700 dark:text-slate-300 dark:hover:bg-violet-950/40 dark:hover:text-violet-200',
        className
      )}
      onClick={handleSelect}
      onPointerDown={() => {
        handleSelect();
      }}
    >
      {children}
    </button>
  );
}

interface TabsContentProps {
  value: string;
  className?: string;
  children: ReactNode;
}

export function TabsContent({ value, className = '', children }: TabsContentProps) {
  const { activeTab } = useTabs();

  if (activeTab !== value) {
    return null;
  }

  return (
    <div
        role="tabpanel"
        className={cn(
          cn('mt-3 ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500/70 focus-visible:ring-offset-2', textColors.primary),
          className
        )}
      >
      {children}
    </div>
  );
}
