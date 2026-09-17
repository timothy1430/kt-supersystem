/* ==========================================================================
   KT-SUPERSYSTEM ERP - LIGHTWEIGHT SVG CHARTS ENGINE
   Fast, Interactive, Responsive Visualizations with Zero External Dependencies
   ========================================================================== */

const ERPCharts = {
  // 1. Grouped Bar / Combo Chart for Revenue vs Procurement Spend
  renderRevenueExpenseChart(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;

    // Monthly data for Q2/Q3
    const months = ['May', 'Jun', 'Jul', 'Aug', 'Sep (Proj)'];
    const revenue = [42500, 58200, 64100, 71800, 84500];
    const spend =   [28000, 34500, 41200, 38900, 48200];
    const margin = revenue.map((r, i) => r - spend[i]);

    const width = 600;
    const height = 240;
    const padding = { top: 20, right: 30, bottom: 40, left: 50 };
    const chartW = width - padding.left - padding.right;
    const chartH = height - padding.top - padding.bottom;

    const maxVal = Math.max(...revenue) * 1.15;
    const groupW = chartW / months.length;
    const barW = groupW * 0.32;

    let svg = `<svg viewBox="0 0 ${width} ${height}" class="svg-chart" style="width: 100%; height: 100%; overflow: visible;">
      <defs>
        <linearGradient id="gradRev" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#6366f1" stop-opacity="0.9"/>
          <stop offset="100%" stop-color="#4f46e5" stop-opacity="0.4"/>
        </linearGradient>
        <linearGradient id="gradSpend" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#f59e0b" stop-opacity="0.9"/>
          <stop offset="100%" stop-color="#d97706" stop-opacity="0.4"/>
        </linearGradient>
      </defs>`;

    // Horizontal grid lines
    const gridSteps = 4;
    for (let i = 0; i <= gridSteps; i++) {
      const y = padding.top + (chartH / gridSteps) * i;
      const val = Math.round(maxVal - (maxVal / gridSteps) * i);
      svg += `<line x1="${padding.left}" y1="${y}" x2="${width - padding.right}" y2="${y}" stroke="var(--border-subtle)" stroke-dasharray="3 3"/>`;
      svg += `<text x="${padding.left - 8}" y="${y + 4}" fill="var(--text-muted)" font-size="10" text-anchor="end" font-family="var(--font-mono)">$${(val / 1000).toFixed(0)}k</text>`;
    }

    // Bars
    months.forEach((m, idx) => {
      const groupX = padding.left + idx * groupW;
      const revH = (revenue[idx] / maxVal) * chartH;
      const spendH = (spend[idx] / maxVal) * chartH;

      const revX = groupX + (groupW - barW * 2 - 6) / 2;
      const revY = padding.top + (chartH - revH);
      const spendX = revX + barW + 6;
      const spendY = padding.top + (chartH - spendH);

      // Revenue bar
      svg += `<rect x="${revX}" y="${revY}" width="${barW}" height="${revH}" rx="4" fill="url(#gradRev)" class="chart-bar">
        <title>${m} Revenue: $${revenue[idx].toLocaleString()}</title>
      </rect>`;

      // Spend bar
      svg += `<rect x="${spendX}" y="${spendY}" width="${barW}" height="${spendH}" rx="4" fill="url(#gradSpend)" class="chart-bar">
        <title>${m} Spend: $${spend[idx].toLocaleString()}</title>
      </rect>`;

      // Month label
      svg += `<text x="${groupX + groupW / 2}" y="${height - padding.bottom + 20}" fill="var(--text-secondary)" font-size="11" text-anchor="middle" font-weight="600">${m}</text>`;
    });

    // Net Margin Line overlay
    let linePoints = '';
    months.forEach((m, idx) => {
      const groupX = padding.left + idx * groupW;
      const centerX = groupX + groupW / 2;
      const marginH = (margin[idx] / maxVal) * chartH;
      const centerY = padding.top + (chartH - marginH);
      linePoints += `${centerX},${centerY} `;
    });

    svg += `<polyline points="${linePoints}" fill="none" stroke="#10b981" stroke-width="3" stroke-linecap="round"/>`;
    months.forEach((m, idx) => {
      const groupX = padding.left + idx * groupW;
      const centerX = groupX + groupW / 2;
      const marginH = (margin[idx] / maxVal) * chartH;
      const centerY = padding.top + (chartH - marginH);
      svg += `<circle cx="${centerX}" cy="${centerY}" r="4.5" fill="#10b981" stroke="var(--bg-surface)" stroke-width="2">
        <title>${m} Net Margin: $${margin[idx].toLocaleString()}</title>
      </circle>`;
    });

    svg += `</svg>`;
    container.innerHTML = svg;
  },

  // 2. Responsive Donut Chart for Inventory Valuation by Category
  renderInventoryDonutChart(containerId, categoryData) {
    const container = document.getElementById(containerId);
    if (!container) return;

    const entries = Object.entries(categoryData || {});
    const total = entries.reduce((s, [, val]) => s + val, 0);
    if (total === 0) {
      container.innerHTML = `<p class="text-muted" style="text-align:center; padding: 40px;">No inventory valuation data available</p>`;
      return;
    }

    const palette = ['#6366f1', '#10b981', '#f59e0b', '#06b6d4', '#ec4899', '#8b5cf6'];
    const size = 220;
    const strokeWidth = 32;
    const radius = (size - strokeWidth) / 2;
    const circumference = 2 * Math.PI * radius;

    let accumulatedPct = 0;
    let circlesSvg = '';
    let legendHtml = '<div style="display: flex; flex-direction: column; gap: 8px; flex: 1; padding-left: 20px;">';

    entries.forEach(([category, value], i) => {
      const color = palette[i % palette.length];
      const pct = value / total;
      const strokeDashoffset = circumference * (1 - pct);
      const rotation = accumulatedPct * 360 - 90;

      circlesSvg += `<circle cx="${size / 2}" cy="${size / 2}" r="${radius}" 
        fill="transparent" 
        stroke="${color}" 
        stroke-width="${strokeWidth}" 
        stroke-dasharray="${circumference}" 
        stroke-dashoffset="${strokeDashoffset}" 
        transform="rotate(${rotation} ${size / 2} ${size / 2})"
        style="transition: stroke-width 0.2s ease; cursor: pointer;">
        <title>${category}: $${Math.round(value).toLocaleString()} (${(pct * 100).toFixed(1)}%)</title>
      </circle>`;

      accumulatedPct += pct;

      legendHtml += `<div style="display: flex; align-items: center; justify-content: space-between; font-size: 0.8rem;">
        <span style="display: flex; align-items: center; gap: 8px;">
          <span style="width: 10px; height: 10px; border-radius: 2px; background: ${color}; display: inline-block;"></span>
          <span class="truncate" style="max-width: 140px; color: var(--text-primary); font-weight: 500;">${category}</span>
        </span>
        <span class="text-mono" style="font-weight: 700; color: var(--text-secondary);">$${(value / 1000).toFixed(1)}k</span>
      </div>`;
    });

    legendHtml += '</div>';

    const fullChartHtml = `
      <div style="display: flex; align-items: center; justify-content: space-around; width: 100%; flex-wrap: wrap; gap: 16px;">
        <div style="position: relative; width: ${size}px; height: ${size}px;">
          <svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
            <circle cx="${size / 2}" cy="${size / 2}" r="${radius}" fill="transparent" stroke="var(--bg-surface-elevated)" stroke-width="${strokeWidth}" />
            ${circlesSvg}
          </svg>
          <div style="position: absolute; inset: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; pointer-events: none;">
            <span style="font-size: 0.7rem; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.05em; font-weight: 600;">Total Value</span>
            <span style="font-size: 1.25rem; font-weight: 800; color: var(--text-primary);">$${(total / 1000).toFixed(1)}k</span>
          </div>
        </div>
        ${legendHtml}
      </div>
    `;

    container.innerHTML = fullChartHtml;
  }
};

window.ERPCharts = ERPCharts;
