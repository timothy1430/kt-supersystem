/* ==========================================================================
   KT-SUPERSYSTEM ERP - MODULE: EXECUTIVE MANAGEMENT REPORTING
   KPIs, Visual Analytics, Cash Flow Trends & Operational Health
   ========================================================================== */

const DashboardModule = {
  render() {
    const container = document.getElementById('view-dashboard');
    if (!container) return;

    const metrics = window.erpStore.getExecutiveMetrics();
    const pendingApprovals = window.erpStore.getApprovals().filter(a => a.status === 'Pending');
    const lowStockProducts = window.erpStore.getProducts().filter(p => p.totalStock <= p.minStock);
    const recentMovements = window.erpStore.getStockMovements().slice(0, 5);

    container.innerHTML = `
      <div class="view-header">
        <div class="view-title-group">
          <h1>
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="var(--brand-primary)" stroke-width="2.2"><rect x="3" y="3" width="7" height="9"/><rect x="14" y="3" width="7" height="5"/><rect x="14" y="12" width="7" height="9"/><rect x="3" y="16" width="7" height="5"/></svg>
            Executive Management Dashboard
          </h1>
          <p>Real-time cross-enterprise pulse across Procurement, Inventory, Sales & Governance</p>
        </div>
        <div class="view-actions">
          <button class="btn btn-secondary btn-sm" onclick="DashboardModule.exportExecutiveSummary()">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
            Export Brief (JSON)
          </button>
          <button class="btn btn-primary btn-sm" onclick="window.ProcurementModule.openNewPOModal()">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            + New PO
          </button>
        </div>
      </div>

      ${lowStockProducts.length > 0 ? `
        <div class="alerts-banner">
          <div class="alerts-content">
            <div style="background: var(--color-danger); color: white; width: 32px; height: 32px; border-radius: var(--radius-md); display: flex; align-items: center; justify-content: center; flex-shrink: 0;">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
            </div>
            <div>
              <div class="alerts-title">Inventory Safety Stock Alert</div>
              <div class="alerts-desc">${lowStockProducts.length} critical items have fallen below mandatory reorder thresholds (e.g. ${lowStockProducts.map(p => p.sku).join(', ')}).</div>
            </div>
          </div>
          <button class="btn btn-danger btn-sm" onclick="window.appRouter.navigate('inventory');">
            Review Stock Deficits &rarr;
          </button>
        </div>
      ` : ''}

      <!-- Top Metric Cards -->
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-header">
            <span class="stat-label">Total Realized Revenue</span>
            <div class="stat-icon-wrapper success">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
            </div>
          </div>
          <div class="stat-body">
            <div class="stat-value">${UI.formatCurrency(metrics.revenueDispatched)}</div>
          </div>
          <div class="stat-footer">
            <span class="trend-pill up">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="18 15 12 9 6 15"/></svg>
              +14.2%
            </span>
            <span>vs previous cycle</span>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-header">
            <span class="stat-label">Gross Margin %</span>
            <div class="stat-icon-wrapper info">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>
            </div>
          </div>
          <div class="stat-body">
            <div class="stat-value">${metrics.grossMarginPct}%</div>
          </div>
          <div class="stat-footer">
            <span class="trend-pill up">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="18 15 12 9 6 15"/></svg>
              +2.4%
            </span>
            <span>Est. Gross Profit: ${UI.formatCompactCurrency(metrics.grossProfit)}</span>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-header">
            <span class="stat-label">Inventory Asset Value</span>
            <div class="stat-icon-wrapper">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>
            </div>
          </div>
          <div class="stat-body">
            <div class="stat-value">${UI.formatCurrency(metrics.totalInventoryValuation)}</div>
          </div>
          <div class="stat-footer">
            <span>Across 3 warehouses · ${metrics.totalSKUs} active SKUs</span>
          </div>
        </div>

        <div class="stat-card" style="cursor: pointer;" onclick="window.appRouter.navigate('approvals');">
          <div class="stat-header">
            <span class="stat-label">Pending Governance</span>
            <div class="stat-icon-wrapper ${metrics.pendingApprovalsCount > 0 ? 'warning' : 'success'}">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
            </div>
          </div>
          <div class="stat-body">
            <div class="stat-value">${metrics.pendingApprovalsCount} <span style="font-size: 1rem; font-weight: 500; color: var(--text-muted);">requests</span></div>
          </div>
          <div class="stat-footer">
            <span class="text-warning" style="font-weight: 600;">${UI.formatCurrency(metrics.pendingApprovalsValue)}</span>
            <span>awaiting sign-off</span>
          </div>
        </div>
      </div>

      <!-- Charts Section -->
      <div class="dashboard-grid">
        <!-- Revenue vs Spend Bar/Line Combo -->
        <div class="chart-card">
          <div class="chart-header">
            <div>
              <h3>Enterprise Financial Trajectory</h3>
              <p style="font-size: 0.8rem; color: var(--text-muted); margin-top: 2px;">Monthly Revenue vs. Procurement Spend vs. Net Operational Margin</p>
            </div>
            <div class="chart-legend">
              <div class="legend-item">
                <span class="legend-color" style="background: #6366f1;"></span>
                <span>Revenue</span>
              </div>
              <div class="legend-item">
                <span class="legend-color" style="background: #f59e0b;"></span>
                <span>Procurement Spend</span>
              </div>
              <div class="legend-item">
                <span class="legend-color" style="background: #10b981; border-radius: 50%;"></span>
                <span>Net Margin</span>
              </div>
            </div>
          </div>
          <div class="chart-body" id="chart-rev-spend-container"></div>
        </div>

        <!-- Inventory Valuation Donut -->
        <div class="chart-card">
          <div class="chart-header">
            <div>
              <h3>Inventory Valuation by Category</h3>
              <p style="font-size: 0.8rem; color: var(--text-muted); margin-top: 2px;">Asset allocation across active lines</p>
            </div>
          </div>
          <div class="chart-body" id="chart-inv-donut-container"></div>
        </div>
      </div>

      <!-- Department Health & Recent Audit Feed Grid -->
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
        <!-- Cross-Module Operational KPI Matrix -->
        <div class="card-container">
          <div class="card-header-bar">
            <div class="card-title-group">
              <h2>Operational Performance Matrix</h2>
              <p>Key cross-functional execution metrics</p>
            </div>
          </div>
          <div style="padding: 20px; display: flex; flex-direction: column; gap: 16px;">
            <div class="metric-bar-group">
              <div class="metric-bar-header">
                <span>Supplier On-Time Delivery (OTIF)</span>
                <span class="text-success">${metrics.avgOTIF}% (Target: 95.0%)</span>
              </div>
              <div class="progress-track">
                <div class="progress-fill" style="width: ${metrics.avgOTIF}%; background: var(--color-success);"></div>
              </div>
            </div>

            <div class="metric-bar-group">
              <div class="metric-bar-header">
                <span>Warehouse Capacity Utilization</span>
                <span>74.2% (Healthy)</span>
              </div>
              <div class="progress-track">
                <div class="progress-fill" style="width: 74.2%; background: var(--brand-primary);"></div>
              </div>
            </div>

            <div class="metric-bar-group">
              <div class="metric-bar-header">
                <span>Order Fulfillment Velocity</span>
                <span>92.6% within 24h</span>
              </div>
              <div class="progress-track">
                <div class="progress-fill" style="width: 92.6%; background: var(--color-info);"></div>
              </div>
            </div>

            <div style="margin-top: 8px; display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; text-align: center;">
              <div style="background: var(--bg-surface-elevated); padding: 12px; border-radius: var(--radius-md);">
                <div style="font-size: 1.25rem; font-weight: 700; color: var(--text-primary);">${metrics.totalOpenSalesOrders}</div>
                <div style="font-size: 0.725rem; color: var(--text-muted); text-transform: uppercase;">Open Orders</div>
              </div>
              <div style="background: var(--bg-surface-elevated); padding: 12px; border-radius: var(--radius-md);">
                <div style="font-size: 1.25rem; font-weight: 700; color: var(--color-warning);">${metrics.lowStockCount}</div>
                <div style="font-size: 0.725rem; color: var(--text-muted); text-transform: uppercase;">Low Stock</div>
              </div>
              <div style="background: var(--bg-surface-elevated); padding: 12px; border-radius: var(--radius-md);">
                <div style="font-size: 1.25rem; font-weight: 700; color: var(--brand-primary);">${window.erpStore.getSuppliers().length}</div>
                <div style="font-size: 0.725rem; color: var(--text-muted); text-transform: uppercase;">Active Vendors</div>
              </div>
            </div>
          </div>
        </div>

        <!-- Recent Stock & Transaction Feed -->
        <div class="card-container">
          <div class="card-header-bar">
            <div class="card-title-group">
              <h2>Real-Time Operational Audit Feed</h2>
              <p>Latest verified material movements & fulfillments</p>
            </div>
            <button class="btn btn-outline btn-sm" onclick="window.appRouter.navigate('inventory');">View Log</button>
          </div>
          <div style="padding: 12px 20px;">
            ${recentMovements.map(m => `
              <div style="display: flex; align-items: flex-start; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid var(--border-subtle); gap: 12px;">
                <div style="display: flex; align-items: center; gap: 10px;">
                  <div style="width: 32px; height: 32px; border-radius: var(--radius-md); background: ${m.qtyChange > 0 ? 'var(--color-success-bg)' : 'var(--brand-primary-glow)'}; color: ${m.qtyChange > 0 ? 'var(--color-success)' : 'var(--brand-primary)'}; display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 0.75rem;">
                    ${m.qtyChange > 0 ? '+' : ''}${m.qtyChange}
                  </div>
                  <div>
                    <div style="font-weight: 600; font-size: 0.85rem; color: var(--text-primary);">${m.productName}</div>
                    <div style="font-size: 0.75rem; color: var(--text-muted);">${m.type} · Ref: <span class="text-mono" style="color: var(--brand-primary); font-weight: 600;">${m.referenceId}</span> · ${m.warehouseId}</div>
                  </div>
                </div>
                <div style="text-align: right; font-size: 0.725rem; color: var(--text-muted);">
                  <div>${m.timestamp.split(' ')[1] || m.timestamp}</div>
                  <div style="font-weight: 500;">${m.operator.split(' ')[0]}</div>
                </div>
              </div>
            `).join('')}
          </div>
        </div>
      </div>
    `;

    // Render charts
    setTimeout(() => {
      window.ERPCharts.renderRevenueExpenseChart('chart-rev-spend-container');
      window.ERPCharts.renderInventoryDonutChart('chart-inv-donut-container', metrics.categoryValuation);
    }, 50);
  },

  exportExecutiveSummary() {
    const metrics = window.erpStore.getExecutiveMetrics();
    const jsonStr = JSON.stringify({
      generatedAt: new Date().toISOString(),
      activeRole: window.erpStore.currentRole,
      summary: metrics
    }, null, 2);

    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `kt-erp-executive-summary-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    window.UI.showToast('success', 'Summary Exported', 'Executive briefing report downloaded as JSON.');
  }
};

window.DashboardModule = DashboardModule;
