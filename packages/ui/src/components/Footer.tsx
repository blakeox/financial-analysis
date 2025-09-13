import React from 'react';
import { cn } from '../lib/utils';

interface FooterProps {
  className?: string;
}

export const Footer: React.FC<FooterProps> = ({ className }) => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className={cn('bg-white border-t border-gray-200', className)}>
      <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:py-16 lg:px-8">
        <div className="xl:grid xl:grid-cols-3 xl:gap-8">
          <div className="space-y-8 xl:col-span-1">
            <h3 className="text-sm font-semibold text-gray-400 tracking-wider uppercase">
              Financial Analysis
            </h3>
            <p className="text-gray-500 text-base">
              Advanced financial analysis tools powered by AI and deterministic calculations.
              Built for precision and reliability in financial decision making.
            </p>
          </div>
          <div className="mt-12 grid grid-cols-2 gap-8 xl:mt-0 xl:col-span-2">
            <div className="md:grid md:grid-cols-2 md:gap-8">
              <div>
                <h3 className="text-sm font-semibold text-gray-400 tracking-wider uppercase">
                  Analysis Tools
                </h3>
                <ul className="mt-4 space-y-4">
                  <li>
                    <a href="/models" className="text-base text-gray-500 hover:text-gray-900">
                      Financial Models
                    </a>
                  </li>
                  <li>
                    <a href="/analysis" className="text-base text-gray-500 hover:text-gray-900">
                      Analysis Engine
                    </a>
                  </li>
                  <li>
                    <a href="/lease" className="text-base text-gray-500 hover:text-gray-900">
                      Lease Analysis
                    </a>
                  </li>
                </ul>
              </div>
              <div className="mt-12 md:mt-0">
                <h3 className="text-sm font-semibold text-gray-400 tracking-wider uppercase">
                  Resources
                </h3>
                <ul className="mt-4 space-y-4">
                  <li>
                    <a href="/docs" className="text-base text-gray-500 hover:text-gray-900">
                      Documentation
                    </a>
                  </li>
                  <li>
                    <a href="/api" className="text-base text-gray-500 hover:text-gray-900">
                      API Reference
                    </a>
                  </li>
                  <li>
                    <a href="/health" className="text-base text-gray-500 hover:text-gray-900">
                      System Status
                    </a>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
        <div className="mt-12 border-t border-gray-200 pt-8">
          <p className="text-base text-gray-400 xl:text-center">
            &copy; {currentYear} Financial Analysis. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};