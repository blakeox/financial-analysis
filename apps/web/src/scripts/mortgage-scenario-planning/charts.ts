/**
 * Chart rendering for Mortgage Scenario Planning Calculator
 */

import type { Scenario } from './types';
import { SCENARIO_COLORS } from './constants';

/**
 * Render a payment breakdown chart (principal vs interest over time)
 */
export function renderPaymentBreakdownChart(scenarios: Scenario[]): string {
  const canvasId = `payment-chart-${Date.now()}`;
  
  // Defer canvas rendering to next tick
  setTimeout(() => {
    const canvas = document.getElementById(canvasId) as HTMLCanvasElement;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Calculate chart data for scenarios (max 4 for clarity)
    const displayScenarios = scenarios.slice(0, 4);
    const chartData = displayScenarios.map(scenario => {
      const years = Math.ceil(scenario.payoffMonths / 12);
      const points: { year: number; principal: number; interest: number }[] = [];
      
      const monthlyRate = scenario.rate / 100 / 12;
      let remainingPrincipal = scenario.principal;
      
      for (let year = 0; year <= Math.min(years, 30); year++) {
        const month = year * 12;
        if (month >= scenario.payoffMonths) break;
        
        let yearPrincipal = 0;
        let yearInterest = 0;
        
        for (let m = 0; m < 12 && (month + m) < scenario.payoffMonths; m++) {
          const interestPayment = remainingPrincipal * monthlyRate;
          const principalPayment = Math.min(scenario.monthlyPayment - interestPayment, remainingPrincipal);
          
          yearPrincipal += principalPayment;
          yearInterest += interestPayment;
          remainingPrincipal = Math.max(0, remainingPrincipal - principalPayment);
        }
        
        points.push({ year, principal: yearPrincipal, interest: yearInterest });
      }
      
      return { scenario, points };
    });
    
    // Set canvas dimensions
    const width = canvas.offsetWidth;
    const height = 400;
    canvas.width = width;
    canvas.height = height;
    
    // Chart settings
    const padding = { top: 60, right: 40, bottom: 60, left: 80 };
    const chartWidth = width - padding.left - padding.right;
    const chartHeight = height - padding.top - padding.bottom;
    
    // Find max values for scaling
    const allPoints = chartData.flatMap(d => d.points);
    const maxPayment = Math.max(...allPoints.map(p => p.principal + p.interest));
    const maxYear = Math.max(...allPoints.map(p => p.year));
    
    // Detect dark mode
    const isDarkMode = document.documentElement.classList.contains('dark') || 
      window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    // Clear canvas
    ctx.clearRect(0, 0, width, height);
    
    // Draw background
    ctx.fillStyle = isDarkMode ? '#1f2937' : '#f9fafb';
    ctx.fillRect(0, 0, width, height);
    
    // Draw grid lines
    ctx.strokeStyle = isDarkMode ? '#374151' : '#e5e7eb';
    ctx.lineWidth = 1;
    for (let i = 0; i <= 5; i++) {
      const y = padding.top + (chartHeight * i) / 5;
      ctx.beginPath();
      ctx.moveTo(padding.left, y);
      ctx.lineTo(width - padding.right, y);
      ctx.stroke();
      
      // Y-axis labels
      const value = maxPayment * (1 - i / 5);
      ctx.fillStyle = isDarkMode ? '#9ca3af' : '#6b7280';
      ctx.font = '12px sans-serif';
      ctx.textAlign = 'right';
      ctx.fillText(`$${(value / 1000).toFixed(0)}k`, padding.left - 10, y + 4);
    }
    
    // Draw X-axis labels
    ctx.textAlign = 'center';
    const step = Math.max(1, Math.ceil(maxYear / 10));
    for (let year = 0; year <= maxYear; year += step) {
      const x = padding.left + (chartWidth * year) / maxYear;
      ctx.fillText(`Y${year}`, x, height - padding.bottom + 25);
    }
    
    // Draw bars for each scenario - use dynamic colors based on scenario index
    const barGroupWidth = chartWidth / maxYear;
    const barWidth = (barGroupWidth / (chartData.length + 1)) - 2;
    
    chartData.forEach((data, scenarioIdx) => {
      const colorSet = SCENARIO_COLORS[data.scenario.index ?? scenarioIdx];
      const colors = {
        principal: getColorHex(colorSet.bg, 'primary'),
        interest: getColorHex(colorSet.bg, 'light'),
      };
      
      data.points.forEach(point => {
        const xBase = padding.left + (chartWidth * point.year) / maxYear;
        const x = xBase + (scenarioIdx * barWidth);
        const totalPayment = point.principal + point.interest;
        
        if (totalPayment === 0) return;
        
        // Draw interest (top part)
        const interestHeight = (chartHeight * point.interest) / maxPayment;
        const interestY = padding.top + chartHeight - (chartHeight * totalPayment) / maxPayment;
        ctx.fillStyle = colors.interest;
        ctx.fillRect(x, interestY, barWidth, interestHeight);
        
        // Draw principal (bottom part)
        const principalHeight = (chartHeight * point.principal) / maxPayment;
        const principalY = padding.top + chartHeight - (chartHeight * point.principal) / maxPayment;
        ctx.fillStyle = colors.principal;
        ctx.fillRect(x, principalY, barWidth, principalHeight);
      });
    });
    
    // Draw legend
    const legendY = 20;
    ctx.textAlign = 'left';
    const legendSpacing = Math.floor(width / chartData.length);
    
    chartData.forEach((data, idx) => {
      const colorSet = SCENARIO_COLORS[data.scenario.index ?? idx];
      const label = String.fromCharCode(65 + (data.scenario.index ?? idx));
      const startX = padding.left + idx * legendSpacing;
      
      // Principal box
      ctx.fillStyle = getColorHex(colorSet.bg, 'primary');
      ctx.fillRect(startX, legendY, 12, 12);
      ctx.fillStyle = isDarkMode ? '#f3f4f6' : '#1f2937';
      ctx.font = '10px sans-serif';
      ctx.fillText(`${label} Principal`, startX + 16, legendY + 10);
      
      // Interest box
      ctx.fillStyle = getColorHex(colorSet.bg, 'light');
      ctx.fillRect(startX + 80, legendY, 12, 12);
      ctx.fillStyle = isDarkMode ? '#f3f4f6' : '#1f2937';
      ctx.fillText('Interest', startX + 96, legendY + 10);
    });
  }, 100);
  
  return `
    <div class="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6">
      <h2 class="text-xl font-semibold mb-2 flex items-center gap-2">
        <span>📊</span> Visual Payment Breakdown
      </h2>
      <p class="text-sm text-gray-600 dark:text-gray-400 mb-4">See how your annual payments split between principal and interest over time</p>
      <canvas id="${canvasId}" class="w-full" style="max-width: 100%; height: 400px;"></canvas>
      <div class="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3 text-xs text-gray-600 dark:text-gray-400">
        <div class="flex gap-2">
          <span>💡</span>
          <p>Interest payments decrease and principal payments increase over time</p>
        </div>
        <div class="flex gap-2">
          <span>📈</span>
          <p>Compare scenarios side-by-side: Each color represents a different option</p>
        </div>
      </div>
    </div>
  `;
}

/**
 * Helper to get hex color from Tailwind color name
 */
function getColorHex(colorName: string, shade: 'primary' | 'light'): string {
  const colors: Record<string, { primary: string; light: string }> = {
    blue: { primary: '#3b82f6', light: '#93c5fd' },
    green: { primary: '#10b981', light: '#6ee7b7' },
    purple: { primary: '#8b5cf6', light: '#c4b5fd' },
    orange: { primary: '#f97316', light: '#fdba74' },
    pink: { primary: '#ec4899', light: '#f9a8d4' },
    teal: { primary: '#14b8a6', light: '#5eead4' },
    yellow: { primary: '#eab308', light: '#fde047' },
    red: { primary: '#ef4444', light: '#fca5a5' },
    indigo: { primary: '#6366f1', light: '#a5b4fc' },
    cyan: { primary: '#06b6d4', light: '#67e8f9' },
  };
  
  return colors[colorName]?.[shade] ?? colors.blue[shade];
}

/**
 * Render an amortization mini-chart inline
 */
export function renderAmortizationMiniChart(scenario: Scenario): string {
  const canvasId = `amort-mini-${Date.now()}-${scenario.index ?? 0}`;
  
  setTimeout(() => {
    const canvas = document.getElementById(canvasId) as HTMLCanvasElement;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    const width = canvas.offsetWidth;
    const height = 100;
    canvas.width = width;
    canvas.height = height;
    
    const isDarkMode = document.documentElement.classList.contains('dark');
    
    // Draw simple balance line
    ctx.strokeStyle = isDarkMode ? '#60a5fa' : '#3b82f6';
    ctx.lineWidth = 2;
    ctx.beginPath();
    
    let balance = scenario.principal;
    const monthlyRate = scenario.rate / 100 / 12;
    const points: number[] = [];
    
    for (let month = 0; month <= scenario.payoffMonths; month += 12) {
      points.push(balance);
      for (let m = 0; m < 12 && month + m < scenario.payoffMonths; m++) {
        const interest = balance * monthlyRate;
        const principal = Math.min(scenario.monthlyPayment - interest, balance);
        balance = Math.max(0, balance - principal);
      }
    }
    
    const maxBalance = Math.max(...points);
    points.forEach((p, i) => {
      const x = (width * i) / (points.length - 1);
      const y = height - (height * p) / maxBalance;
      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    });
    
    ctx.stroke();
  }, 50);
  
  return `
    <canvas id="${canvasId}" class="w-full h-24"></canvas>
  `;
}
