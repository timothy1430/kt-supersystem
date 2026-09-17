/* ==========================================================================
   KT-SUPERSYSTEM ERP - MODULE: CUSTOMER DIRECTORY & CREDIT CONTROL
   Accounts Receivable, Credit Limit Monitoring & Sales History
   ========================================================================== */

const CustomersModule = {
  searchQuery: '',

  render() {
    const container = document.getElementById('view-customers');
    if (!container) return;

    const allCustomers = window.erpStore.getCustomers();
    const filteredCustomers = allCustomers.filter(c => {
      if (this.searchQuery) {
        const q = this.searchQuery.toLowerCase();
        return c.name.toLowerCase().includes(q) ||
               c.code.toLowerCase().includes(q) ||
               c.contactPerson.toLowerCase().includes(q);
      }
      return true;
    });

    const totalReceivables = allCustomers.reduce((s, c) => s + c.outstandingBalance, 0);
    const totalCreditFacility = allCustomers.reduce((s, c) => s + c.creditLimit, 0);
    const totalLifetime = allCustomers.reduce((s, c) => s + (c.lifetimeRevenue || 0), 0);

    container.innerHTML = `
      <div class="view-header">
        <div class="view-title-group">
          <h1>
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="var(--brand-primary)" stroke-width="2.2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
            Customer Master & Credit Governance
          </h1>
          <p>Client credit facilities, accounts receivable aging, lifetime order metrics, and commercial accounts</p>
        </div>
        <div class="view-actions">
          <div class="search-input-box">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            <input type="text" placeholder="Search customers..." value="${this.searchQuery}" oninput="CustomersModule.handleSearch(this.value)">
          </div>
        </div>
      </div>

      <!-- Financial Health Cards -->
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-header">
            <span class="stat-label">Total Accounts Receivable</span>
            <div class="stat-icon-wrapper info">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
            </div>
          </div>
          <div class="stat-body">
            <div class="stat-value">${UI.formatCurrency(totalReceivables)}</div>
          </div>
          <div class="stat-footer">
            <span>Outstanding invoiced balance across active clients</span>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-header">
            <span class="stat-label">Total Credit Facility</span>
            <div class="stat-icon-wrapper">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="1" y="4" width="22" height="16" rx="2" ry="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>
            </div>
          </div>
          <div class="stat-body">
            <div class="stat-value">${UI.formatCurrency(totalCreditFacility)}</div>
          </div>
          <div class="stat-footer">
            <span>Overall network exposure cap</span>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-header">
            <span class="stat-label">Cumulative Lifetime Billings</span>
            <div class="stat-icon-wrapper success">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>
            </div>
          </div>
          <div class="stat-body">
            <div class="stat-value">${UI.formatCompactCurrency(totalLifetime)}</div>
          </div>
          <div class="stat-footer">
            <span class="text-success font-weight-bold">High customer lifetime retention</span>
          </div>
        </div>
      </div>

      <!-- Customer Cards Grid -->
      <div class="scorecard-grid">
        ${filteredCustomers.map(c => {
          const utilPct = Math.min(100, Math.round((c.outstandingBalance / c.creditLimit) * 100));
          const availableCredit = Math.max(0, c.creditLimit - c.outstandingBalance);
          const activeSOs = window.erpStore.getSalesOrders().filter(so => so.customerId === c.id);

          return `
            <div class="customer-card">
              <div class="card-top-row">
                <div class="card-title-meta">
                  <div style="font-size: 0.725rem; font-family: var(--font-mono); color: var(--brand-primary); font-weight: 700;">${c.code}</div>
                  <h3>${c.name}</h3>
                  <p>${c.tier} · ${c.billingAddress.split(',')[1] || c.billingAddress}</p>
                </div>
                <div>
                  ${UI.getStatusBadge(c.status)}
                </div>
              </div>

              <!-- Credit Limit Health Bar -->
              <div style="background: var(--bg-surface-elevated); padding: 12px; border-radius: var(--radius-md); display: flex; flex-direction: column; gap: 8px;">
                <div class="metric-bar-header" style="font-size: 0.775rem;">
                  <span>Credit Limit Utilization</span>
                  <span style="font-weight: 700; color: ${utilPct > 90 ? 'var(--color-danger)' : (utilPct > 70 ? 'var(--color-warning)' : 'var(--color-success)')};">
                    ${utilPct}%
                  </span>
                </div>
                <div class="progress-track">
                  <div class="progress-fill" style="width: ${utilPct}%; background: ${utilPct > 90 ? 'var(--color-danger)' : (utilPct > 70 ? 'var(--color-warning)' : 'var(--color-success)')};"></div>
                </div>
                <div style="display: flex; justify-content: space-between; font-size: 0.775rem; color: var(--text-muted); margin-top: 2px;">
                  <span>Balance: <strong>${UI.formatCurrency(c.outstandingBalance)}</strong></span>
                  <span>Limit: ${UI.formatCurrency(c.creditLimit)}</span>
                </div>
              </div>

              <div style="display: flex; justify-content: space-between; font-size: 0.8rem; color: var(--text-secondary);">
                <div>Available Credit: <strong class="text-success">${UI.formatCurrency(availableCredit)}</strong></div>
                <div>Terms: <strong>${c.paymentTerms}</strong></div>
              </div>

              <div style="display: flex; align-items: center; justify-content: space-between; margin-top: auto; padding-top: 12px; border-top: 1px solid var(--border-subtle);">
                <div style="font-size: 0.8rem; color: var(--text-muted);">
                  ${activeSOs.length} active order(s)
                </div>
                <div style="display: flex; gap: 8px;">
                  <button class="btn btn-outline btn-sm" onclick="CustomersModule.inspectCustomer('${c.id}')">
                    Inspect
                  </button>
                  <button class="btn btn-primary btn-sm" onclick="window.SalesModule.openNewSOModal('${c.id}')">
                    + New Order
                  </button>
                </div>
              </div>
            </div>
          `;
        }).join('')}
      </div>
    `;
  },

  handleSearch(val) {
    this.searchQuery = val;
    this.render();
  },

  inspectCustomer(customerId) {
    const c = window.erpStore.getCustomer(customerId);
    if (!c) return;

    const orders = window.erpStore.getSalesOrders().filter(so => so.customerId === c.id);
    const availableCredit = Math.max(0, c.creditLimit - c.outstandingBalance);

    const bodyHtml = `
      <div class="detail-grid">
        <div class="detail-item">
          <span class="lbl">Client Code</span>
          <span class="val text-mono text-brand">${c.code}</span>
        </div>
        <div class="detail-item">
          <span class="lbl">Standing Status</span>
          <span class="val">${UI.getStatusBadge(c.status)}</span>
        </div>
        <div class="detail-item">
          <span class="lbl">Primary Buyer</span>
          <span class="val">${c.contactPerson}</span>
        </div>
        <div class="detail-item">
          <span class="lbl">Direct Contact</span>
          <span class="val" style="font-size: 0.8rem;">${c.email}</span>
        </div>
        <div class="detail-item">
          <span class="lbl">Commercial Terms</span>
          <span class="val">${c.paymentTerms}</span>
        </div>
        <div class="detail-item">
          <span class="lbl">Account Classification</span>
          <span class="val">${c.tier}</span>
        </div>
      </div>

      <div style="background: var(--bg-surface-elevated); padding: 14px; border-radius: var(--radius-md); border: 1px solid var(--border-subtle);">
        <h4 style="font-size: 0.85rem; font-weight: 700; margin-bottom: 10px; text-transform: uppercase; color: var(--text-muted);">Credit Facility Summary</h4>
        <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; text-align: center;">
          <div style="background: var(--bg-surface); padding: 10px; border-radius: var(--radius-sm);">
            <div style="font-size: 1.1rem; font-weight: 700;">${UI.formatCurrency(c.creditLimit)}</div>
            <div style="font-size: 0.7rem; color: var(--text-muted); text-transform: uppercase;">Credit Limit</div>
          </div>
          <div style="background: var(--bg-surface); padding: 10px; border-radius: var(--radius-sm);">
            <div style="font-size: 1.1rem; font-weight: 700; color: var(--color-warning);">${UI.formatCurrency(c.outstandingBalance)}</div>
            <div style="font-size: 0.7rem; color: var(--text-muted); text-transform: uppercase;">Outstanding A/R</div>
          </div>
          <div style="background: var(--bg-surface); padding: 10px; border-radius: var(--radius-sm);">
            <div style="font-size: 1.1rem; font-weight: 700; color: var(--color-success);">${UI.formatCurrency(availableCredit)}</div>
            <div style="font-size: 0.7rem; color: var(--text-muted); text-transform: uppercase;">Available Credit</div>
          </div>
        </div>
      </div>

      <div style="display: flex; flex-direction: column; gap: 6px; font-size: 0.8rem; color: var(--text-secondary);">
        <div><strong>Billing Address:</strong> ${c.billingAddress}</div>
        <div><strong>Shipping Destination:</strong> ${c.shippingAddress}</div>
      </div>

      <div>
        <h4 style="font-size: 0.85rem; font-weight: 700; margin-bottom: 8px; text-transform: uppercase; color: var(--text-muted);">Sales Orders & Invoicing History (${orders.length})</h4>
        ${orders.length === 0 ? `<p class="text-muted" style="font-size: 0.8rem;">No active orders for this account.</p>` : `
          <table class="line-items-table">
            <thead>
              <tr>
                <th>Order ID</th>
                <th>Date</th>
                <th>Total</th>
                <th>Invoice</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              ${orders.map(so => `
                <tr style="cursor: pointer;" onclick="UI.closeDrawer(); window.appRouter.navigate('sales'); setTimeout(() => window.SalesModule.inspectSO('${so.id}'), 100);">
                  <td class="text-mono" style="font-weight: 700; color: var(--brand-primary);">${so.id}</td>
                  <td>${so.orderDate}</td>
                  <td class="text-mono">${UI.formatCurrency(so.totalAmount)}</td>
                  <td class="text-mono">${so.invoiceNumber || '—'}</td>
                  <td>${UI.getStatusBadge(so.status)}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        `}
      </div>
    `;

    const footerHtml = `
      <button class="btn btn-outline" onclick="UI.closeDrawer();">Close</button>
      <button class="btn btn-primary" onclick="UI.closeDrawer(); window.SalesModule.openNewSOModal('${c.id}');">
        + Create Sales Order for ${c.code}
      </button>
    `;

    window.UI.openDrawer(`Customer Profile: ${c.name}`, bodyHtml, footerHtml);
  }
};

window.CustomersModule = CustomersModule;
