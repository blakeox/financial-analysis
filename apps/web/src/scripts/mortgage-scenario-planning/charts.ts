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
    <div class="bg-white/90 dark:bg-slate-950/40 rounded-lg shadow-md p-6 mb-6">
      <h2 class="text-xl font-semibold mb-2 flex items-center gap-2">
        <span>📊</span> Visual Payment Breakdown
      </h2>
      <p class="fa-script-copy-muted mb-4">See how your annual payments split between principal and interest over time</p>
      <canvas id="${canvasId}" class="w-full" style="max-width: 100%; height: 400px;"></canvas>
      <div class="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3 fa-script-note">
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

/**
 * Render total cost comparison horizontal bar chart
 */
export function renderTotalCostComparisonChart(scenarios: Scenario[]): string {
  const canvasId = `cost-comparison-${Date.now()}`;
  const bestScenario = scenarios.reduce((best, current) => 
    current.totalCost < best.totalCost ? current : best
  );
  
  setTimeout(() => {
    const canvas = document.getElementById(canvasId) as HTMLCanvasElement;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    const width = canvas.offsetWidth;
    const barHeight = 40;
    const spacing = 16;
    const height = scenarios.length * (barHeight + spacing) + 60;
    canvas.width = width;
    canvas.height = height;
    
    const isDarkMode = document.documentElement.classList.contains('dark');
    const padding = { left: 100, right: 120, top: 40, bottom: 20 };
    const chartWidth = width - padding.left - padding.right;
    
    // Clear canvas
    ctx.clearRect(0, 0, width, height);
    
    const maxCost = Math.max(...scenarios.map(s => s.totalCost));
    
    // Title
    ctx.fillStyle = isDarkMode ? '#f3f4f6' : '#1f2937';
    ctx.font = 'bold 14px system-ui, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('Total Cost Comparison', padding.left, 24);
    
    scenarios.forEach((scenario, idx) => {
      const y = padding.top + idx * (barHeight + spacing);
      const barWidth = (chartWidth * scenario.totalCost) / maxCost;
      const isBest = scenario.name === bestScenario.name;
      const colorSet = SCENARIO_COLORS[scenario.index ?? idx];
      const barColor = getColorHex(colorSet.bg, 'primary');
      
      // Scenario label
      ctx.fillStyle = isDarkMode ? '#d1d5db' : '#374151';
      ctx.font = '12px system-ui, sans-serif';
      ctx.textAlign = 'right';
      const label = scenario.name.length > 12 ? scenario.name.substring(0, 12) + '...' : scenario.name;
      ctx.fillText(label, padding.left - 10, y + barHeight / 2 + 4);
      
      // Bar background
      ctx.fillStyle = isDarkMode ? '#374151' : '#e5e7eb';
      ctx.fillRect(padding.left, y, chartWidth, barHeight);
      
      // Bar
      ctx.fillStyle = barColor;
      ctx.fillRect(padding.left, y, barWidth, barHeight);
      
      // Best badge
      if (isBest) {
        ctx.fillStyle = '#10b981';
        ctx.beginPath();
        ctx.arc(padding.left + barWidth + 16, y + barHeight / 2, 10, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 12px system-ui, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('✓', padding.left + barWidth + 16, y + barHeight / 2 + 4);
      }
      
      // Cost value
      ctx.fillStyle = isDarkMode ? '#f3f4f6' : '#1f2937';
      ctx.font = 'bold 11px system-ui, sans-serif';
      ctx.textAlign = 'left';
      const costText = `$${(scenario.totalCost / 1000).toFixed(0)}k`;
      ctx.fillText(costText, padding.left + barWidth + (isBest ? 32 : 8), y + barHeight / 2 + 4);
      
      // Savings indicator (compared to worst)
      if (!isBest) {
        const savings = scenario.totalCost - bestScenario.totalCost;
        ctx.fillStyle = '#ef4444';
        ctx.font = '10px system-ui, sans-serif';
        ctx.fillText(`+$${(savings / 1000).toFixed(0)}k`, width - padding.right + 50, y + barHeight / 2 + 4);
      }
    });
  }, 100);
  
  const chartHeight = scenarios.length * 56 + 60;
  
  return `
    <div class="bg-white/90 dark:bg-slate-950/40 rounded-lg shadow-md p-6 mb-6">
      <h2 class="text-xl font-semibold mb-2 flex items-center gap-2">
        <span>💰</span> Total Cost Comparison
      </h2>
      <p class="fa-script-copy-muted mb-4">Compare total costs including principal, interest, PMI, and closing costs</p>
      <canvas id="${canvasId}" class="w-full" style="height: ${chartHeight}px;"></canvas>
      <div class="mt-4 flex flex-wrap gap-4 fa-script-note">
        <div class="flex items-center gap-2">
          <span class="inline-block w-3 h-3 rounded-full bg-emerald-500"></span>
          <span>Best Value (Lowest Total Cost)</span>
        </div>
        <div class="flex items-center gap-2">
          <span class="text-rose-500 font-semibold">+$XXk</span>
          <span>Additional cost vs. best option</span>
        </div>
      </div>
    </div>
  `;
}

/**
 * Render payoff timeline comparison chart
 */
export function renderPayoffTimelineChart(scenarios: Scenario[]): string {
  const canvasId = `timeline-chart-${Date.now()}`;
  
  setTimeout(() => {
    const canvas = document.getElementById(canvasId) as HTMLCanvasElement;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    const width = canvas.offsetWidth;
    const height = 200;
    canvas.width = width;
    canvas.height = height;
    
    const isDarkMode = document.documentElement.classList.contains('dark');
    const padding = { left: 60, right: 40, top: 50, bottom: 40 };
    const chartWidth = width - padding.left - padding.right;
    
    // Clear canvas
    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = isDarkMode ? '#1f2937' : '#f9fafb';
    ctx.fillRect(0, 0, width, height);
    
    const maxMonths = Math.max(...scenarios.map(s => s.payoffMonths));
    const maxYears = Math.ceil(maxMonths / 12);
    
    // Draw year markers
    ctx.strokeStyle = isDarkMode ? '#374151' : '#e5e7eb';
    ctx.lineWidth = 1;
    ctx.fillStyle = isDarkMode ? '#9ca3af' : '#6b7280';
    ctx.font = '10px system-ui, sans-serif';
    ctx.textAlign = 'center';
    
    for (let year = 0; year <= maxYears; year += 5) {
      const x = padding.left + (chartWidth * year) / maxYears;
      ctx.beginPath();
      ctx.moveTo(x, padding.top);
      ctx.lineTo(x, height - padding.bottom);
      ctx.stroke();
      ctx.fillText(`${year}yr`, x, height - padding.bottom + 15);
    }
    
    // Draw timeline bars
    const barHeight = 24;
    const barSpacing = 12;
    const startY = padding.top + 10;
    
    scenarios.forEach((scenario, idx) => {
      const y = startY + idx * (barHeight + barSpacing);
      const barWidth = (chartWidth * scenario.payoffMonths) / (maxYears * 12);
      const colorSet = SCENARIO_COLORS[scenario.index ?? idx];
      const barColor = getColorHex(colorSet.bg, 'primary');
      
      // Draw bar
      ctx.fillStyle = barColor;
      const radius = 4;
      ctx.beginPath();
      ctx.roundRect(padding.left, y, barWidth, barHeight, [radius, radius, radius, radius]);
      ctx.fill();
      
      // Scenario label inside bar
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 11px system-ui, sans-serif';
      ctx.textAlign = 'left';
      const label = scenario.name.length > 15 ? scenario.name.substring(0, 15) + '...' : scenario.name;
      ctx.fillText(label, padding.left + 8, y + barHeight / 2 + 4);
      
      // Years at end of bar
      const years = Math.floor(scenario.payoffMonths / 12);
      const months = scenario.payoffMonths % 12;
      ctx.fillStyle = isDarkMode ? '#f3f4f6' : '#1f2937';
      ctx.font = '10px system-ui, sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText(`${years}y ${months}m`, padding.left + barWidth + 8, y + barHeight / 2 + 4);
    });
    
    // Title
    ctx.fillStyle = isDarkMode ? '#f3f4f6' : '#1f2937';
    ctx.font = 'bold 14px system-ui, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('Payoff Timeline', padding.left, 24);
  }, 100);
  
  return `
    <div class="bg-white/90 dark:bg-slate-950/40 rounded-lg shadow-md p-6 mb-6">
      <h2 class="text-xl font-semibold mb-2 flex items-center gap-2">
        <span>⏳</span> Payoff Timeline Comparison
      </h2>
      <p class="fa-script-copy-muted mb-4">See how long each scenario takes to pay off your mortgage</p>
      <canvas id="${canvasId}" class="w-full" style="height: 200px;"></canvas>
    </div>
  `;
}

/**
 * Render equity growth line chart
 */
export function renderEquityGrowthChart(scenarios: Scenario[]): string {
  const canvasId = `equity-chart-${Date.now()}`;
  
  setTimeout(() => {
    const canvas = document.getElementById(canvasId) as HTMLCanvasElement;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    const width = canvas.offsetWidth;
    const height = 320;
    canvas.width = width;
    canvas.height = height;
    
    const isDarkMode = document.documentElement.classList.contains('dark');
    const padding = { left: 80, right: 120, top: 50, bottom: 60 };
    const chartWidth = width - padding.left - padding.right;
    const chartHeight = height - padding.top - padding.bottom;
    
    // Clear canvas
    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = isDarkMode ? '#1f2937' : '#f9fafb';
    ctx.fillRect(0, 0, width, height);
    
    // Calculate equity data for each scenario
    const maxMonths = Math.max(...scenarios.map(s => s.payoffMonths));
    const maxYears = Math.ceil(maxMonths / 12);
    const displayScenarios = scenarios.slice(0, 6); // Limit for clarity
    
    const equityData = displayScenarios.map(scenario => {
      const points: { year: number; equity: number }[] = [];
      let balance = scenario.principal;
      const monthlyRate = scenario.rate / 100 / 12;
      const homeValue = scenario.principal + scenario.downPayment; // Approximate
      
      points.push({ year: 0, equity: scenario.downPayment });
      
      for (let year = 1; year <= maxYears; year++) {
        for (let m = 0; m < 12 && (year - 1) * 12 + m < scenario.payoffMonths; m++) {
          const interest = balance * monthlyRate;
          const principal = Math.min(scenario.monthlyPayment - interest, balance);
          balance = Math.max(0, balance - principal);
        }
        points.push({ year, equity: homeValue - balance });
      }
      
      return { scenario, points };
    });
    
    const maxEquity = Math.max(...equityData.flatMap(d => d.points.map(p => p.equity)));
    
    // Draw grid
    ctx.strokeStyle = isDarkMode ? '#374151' : '#e5e7eb';
    ctx.lineWidth = 1;
    
    for (let i = 0; i <= 5; i++) {
      const y = padding.top + (chartHeight * i) / 5;
      ctx.beginPath();
      ctx.moveTo(padding.left, y);
      ctx.lineTo(width - padding.right, y);
      ctx.stroke();
      
      // Y-axis labels
      const value = maxEquity * (1 - i / 5);
      ctx.fillStyle = isDarkMode ? '#9ca3af' : '#6b7280';
      ctx.font = '11px system-ui, sans-serif';
      ctx.textAlign = 'right';
      ctx.fillText(`$${(value / 1000).toFixed(0)}k`, padding.left - 10, y + 4);
    }
    
    // X-axis labels
    ctx.textAlign = 'center';
    for (let year = 0; year <= maxYears; year += 5) {
      const x = padding.left + (chartWidth * year) / maxYears;
      ctx.fillText(`${year}`, x, height - padding.bottom + 20);
    }
    
    // Axis labels
    ctx.fillStyle = isDarkMode ? '#d1d5db' : '#374151';
    ctx.font = '12px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Years', padding.left + chartWidth / 2, height - 10);
    
    ctx.save();
    ctx.translate(15, padding.top + chartHeight / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText('Equity', 0, 0);
    ctx.restore();
    
    // Draw lines for each scenario
    equityData.forEach((data, idx) => {
      const colorSet = SCENARIO_COLORS[data.scenario.index ?? idx];
      const lineColor = getColorHex(colorSet.bg, 'primary');
      
      ctx.strokeStyle = lineColor;
      ctx.lineWidth = 3;
      ctx.beginPath();
      
      data.points.forEach((point, i) => {
        const x = padding.left + (chartWidth * point.year) / maxYears;
        const y = padding.top + chartHeight - (chartHeight * point.equity) / maxEquity;
        
        if (i === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      });
      
      ctx.stroke();
      
      // End marker
      const lastPoint = data.points[data.points.length - 1];
      const endX = padding.left + (chartWidth * lastPoint.year) / maxYears;
      const endY = padding.top + chartHeight - (chartHeight * lastPoint.equity) / maxEquity;
      
      ctx.beginPath();
      ctx.arc(endX, endY, 5, 0, Math.PI * 2);
      ctx.fillStyle = lineColor;
      ctx.fill();
    });
    
    // Legend
    const legendX = width - padding.right + 10;
    let legendY = padding.top;
    
    ctx.font = 'bold 11px system-ui, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillStyle = isDarkMode ? '#f3f4f6' : '#1f2937';
    ctx.fillText('Scenarios', legendX, legendY);
    legendY += 20;
    
    equityData.forEach((data, idx) => {
      const colorSet = SCENARIO_COLORS[data.scenario.index ?? idx];
      const lineColor = getColorHex(colorSet.bg, 'primary');
      
      // Color line
      ctx.strokeStyle = lineColor;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(legendX, legendY);
      ctx.lineTo(legendX + 20, legendY);
      ctx.stroke();
      
      // Label
      ctx.fillStyle = isDarkMode ? '#d1d5db' : '#374151';
      ctx.font = '10px system-ui, sans-serif';
      const label = data.scenario.name.length > 10 ? data.scenario.name.substring(0, 10) + '...' : data.scenario.name;
      ctx.fillText(label, legendX + 26, legendY + 4);
      
      legendY += 20;
    });
    
    // Title
    ctx.fillStyle = isDarkMode ? '#f3f4f6' : '#1f2937';
    ctx.font = 'bold 14px system-ui, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('Equity Growth Over Time', padding.left, 24);
  }, 100);
  
  return `
    <div class="bg-white/90 dark:bg-slate-950/40 rounded-lg shadow-md p-6 mb-6">
      <h2 class="text-xl font-semibold mb-2 flex items-center gap-2">
        <span>📈</span> Equity Growth Over Time
      </h2>
      <p class="fa-script-copy-muted mb-4">Watch your home equity build as you pay down the mortgage</p>
      <canvas id="${canvasId}" class="w-full" style="height: 320px;"></canvas>
      <div class="mt-4 fa-script-note">
        <p>💡 Higher down payments and extra payments accelerate equity building</p>
      </div>
    </div>
  `;
}

/**
 * Render monthly payment breakdown donut charts
 */
export function renderMonthlyBreakdownCharts(scenarios: Scenario[]): string {
  const displayScenarios = scenarios.slice(0, 4); // Limit to 4 for visual clarity
  const charts = displayScenarios.map((scenario, idx) => {
    const canvasId = `donut-${Date.now()}-${idx}`;
    
    setTimeout(() => {
      const canvas = document.getElementById(canvasId) as HTMLCanvasElement;
      if (!canvas) return;
      
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      
      const size = Math.min(canvas.offsetWidth, 160);
      canvas.width = size;
      canvas.height = size;
      
      const isDarkMode = document.documentElement.classList.contains('dark');
      const centerX = size / 2;
      const centerY = size / 2;
      const radius = (size - 20) / 2;
      const innerRadius = radius * 0.6;
      
      // Calculate proportions
      const total = scenario.monthlyPaymentWithPMI;
      const monthlyRate = scenario.rate / 100 / 12;
      const interestPortion = scenario.principal * monthlyRate;
      const principalPortion = scenario.monthlyPayment - interestPortion;
      const pmiPortion = scenario.hasPMI ? scenario.pmiMonthly : 0;
      
      const segments = [
        { value: principalPortion, color: '#3b82f6', label: 'Principal' },
        { value: interestPortion, color: '#f59e0b', label: 'Interest' },
      ];
      
      if (pmiPortion > 0) {
        segments.push({ value: pmiPortion, color: '#ef4444', label: 'PMI' });
      }
      
      // Draw donut
      let startAngle = -Math.PI / 2;
      
      segments.forEach(segment => {
        const sliceAngle = (segment.value / total) * 2 * Math.PI;
        
        ctx.beginPath();
        ctx.moveTo(centerX, centerY);
        ctx.arc(centerX, centerY, radius, startAngle, startAngle + sliceAngle);
        ctx.closePath();
        ctx.fillStyle = segment.color;
        ctx.fill();
        
        startAngle += sliceAngle;
      });
      
      // Draw inner circle (donut hole)
      ctx.beginPath();
      ctx.arc(centerX, centerY, innerRadius, 0, Math.PI * 2);
      ctx.fillStyle = isDarkMode ? '#1f2937' : '#ffffff';
      ctx.fill();
      
      // Center text
      ctx.fillStyle = isDarkMode ? '#f3f4f6' : '#1f2937';
      ctx.font = 'bold 14px system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(`$${Math.round(total).toLocaleString()}`, centerX, centerY - 8);
      ctx.font = '10px system-ui, sans-serif';
      ctx.fillStyle = isDarkMode ? '#9ca3af' : '#6b7280';
      ctx.fillText('/month', centerX, centerY + 10);
    }, 100);
    
    const colorSet = SCENARIO_COLORS[scenario.index ?? idx];
    
    return `
      <div class="text-center">
        <h4 class="font-semibold text-sm mb-2 text-${colorSet.bg}-600 dark:text-${colorSet.bg}-400 truncate" title="${scenario.name}">${scenario.name}</h4>
        <canvas id="${canvasId}" class="mx-auto" style="width: 140px; height: 140px;"></canvas>
        <div class="mt-2 flex justify-center gap-3 text-xs">
          <span class="flex items-center gap-1">
            <span class="w-2 h-2 bg-violet-500 rounded-full"></span>
            Principal
          </span>
          <span class="flex items-center gap-1">
            <span class="w-2 h-2 bg-amber-500 rounded-full"></span>
            Interest
          </span>
          ${scenario.hasPMI ? `
            <span class="flex items-center gap-1">
              <span class="w-2 h-2 bg-rose-500 rounded-full"></span>
              PMI
            </span>
          ` : ''}
        </div>
      </div>
    `;
  }).join('');
  
  return `
    <div class="bg-white/90 dark:bg-slate-950/40 rounded-lg shadow-md p-6 mb-6">
      <h2 class="text-xl font-semibold mb-2 flex items-center gap-2">
        <span>🥧</span> Monthly Payment Breakdown
      </h2>
      <p class="fa-script-copy-muted mb-4">See where your monthly payment goes for each scenario</p>
      <div class="grid grid-cols-2 ${displayScenarios.length > 2 ? 'md:grid-cols-4' : 'md:grid-cols-2'} gap-6">
        ${charts}
      </div>
    </div>
  `;
}
