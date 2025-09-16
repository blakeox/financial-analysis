import React from 'react';
import { AppNav } from './AppNav';
import { navConfig } from './navConfig';

// Example: get current path (simulate router)
const useCurrentPath = (): string => {
  // In real app, use React Router's useLocation().pathname
  const path: string = typeof window !== 'undefined' ? String(window.location.pathname) : '/';
  return path;
};

const App: React.FC = () => {
  const currentPath = useCurrentPath();
  return (
    <div className="min-h-screen bg-nav-bg text-nav-fg">
      <AppNav items={navConfig} currentPath={currentPath} />
      <main className="p-8">
        <h1 className="text-3xl font-bold mb-4">Welcome to FinAnalysis</h1>
        <p className="text-lg">This is a demo of the accessible, responsive navigation bar.</p>
      </main>
    </div>
  );
};

export default App;
