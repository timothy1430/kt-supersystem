/* ==========================================================================
   KT-SUPERSYSTEM ERP - MODULE: SUPPLIER / VENDOR MASTER DIRECTORY
   Scorecards, Lead Times, Performance Metrics & Direct Procurement Link
   ========================================================================== */

const SuppliersModule = {
  searchQuery: '',

  render() {
    const container = document.getElementById('view-suppliers');
    if (!container) return;

    const allSuppliers = window.erpStore.getSuppliers();
    const filteredSuppliers = allSuppliers.filter(s => {
      if (this.searchQuery) {
        const q = this.searchQuery.toLowerCase();
        return s.name.toLowerCase().includes(q) ||
               s.code.toLowerCase().includes(q) ||
               s.category.toLowerCase().includes(q) ||
               s.contactPerson.toLowerCase().includes(q);
      }
      return true;
    });

    const avgOTIF = (allSuppliers.reduce((sum, s) => sum + s.onTimeDeliveryPct, 0) / allSuppliers.length).toFixed(1);
    const avgLead = (allSuppliers.reduce((sum, s) => sum + s.avgLeadTimeDays, 0) / allSuppliers.length).toFixed(0);

    container.innerHTML = `
      <div class="view-header">
        <div class="view-title-group">
          <h1>
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="var(--brand-primary)" stroke-width="2.2"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="8.5" cy="7.5" r="4"/><line x1="20" y1="8" x2="20" y2="14"/><line x1="23" y1="11" x2="17" y2="11"/></svg>
            Suppliers & Vendor Directory
          </h1>
          <p>Global supply base scorecards, contractual terms, on-time delivery KPIs, and direct purchase ordering</p>
        </div>
        <div class="view-actions">
          <div class="search-input-box">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            <input type="text" placeholder="Search suppliers..." value="${this.searchQuery}" oninput="SuppliersModule.handleSearch(this.value)">
          </div>
        </div>
      </div>

      <!-- Quick KPI Stats -->
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-header">
            <span class="stat-label">Active Approved Vendors</span>
            <div class="stat-icon-wrapper info">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
            </div>
          </div>
          <div class="stat-body">
            <div class="stat-value">${allSuppliers.length}</div>
          </div>
          <div class="stat-footer">
            <span>Global tier-1 certified manufacturing partners</span>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-header">
            <span class="stat-label">Network On-Time Delivery</span>
            <div class="stat-icon-wrapper success">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>
            </div>
          </div>
          <div class="stat-body">
            <div class="stat-value">${avgOTIF}%</div>
          </div>
          <div class="stat-footer">
            <span class="text-success font-weight-bold">Benchmark: 95.0% SLA</span>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-header">
            <span class="stat-label">Avg Freight Lead Time</span>
            <div class="stat-icon-wrapper warning">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
            </div>
          </div>
          <div class="stat-body">
            <div class="stat-value">${avgLead} <span style="font-size: 1rem; color: var(--text-muted);">calendar days</span></div>
          </div>
          <div class="stat-footer">
            <span>From order issuance to dock delivery</span>
          </div>
        </div>
      </div>

      <!-- Supplier Scorecards Grid -->
      <div class="scorecard-grid">
        ${filteredSuppliers.map(s => {
          const suppliedProducts = (s.suppliedProductIds || []).map(id => window.erpStore.getProduct(id)).filter(Boolean);
          const activePOs = window.erpStore.getPurchaseOrders().filter(po => po.supplierId === s.id && po.status !== 'Fully Received');

          return `
            <div class="supplier-card">
              <div class="card-top-row">
                <div class="card-title-meta">
                  <div style="font-size: 0.725rem; font-family: var(--font-mono); color: var(--brand-primary); font-weight: 700;">${s.code}</div>
                  <h3>${s.name}</h3>
                  <p>${s.category} · ${s.address.split(',')[1] || s.address}</p>
                </div>
                <div class="rating-stars" title="Supplier Quality Rating: ${s.rating}/5.0">
                  ★ ${s.rating}
                </div>
              </div>

              <!-- Scorecard Metrics -->
              <div style="background: var(--bg-surface-elevated); padding: 12px; border-radius: var(--radius-md); display: flex; flex-direction: column; gap: 10px;">
                <div class="metric-bar-group">
                  <div class="metric-bar-header">
                    <span>On-Time Delivery (OTIF)</span>
                    <span class="text-success">${s.onTimeDeliveryPct}%</span>
                  </div>
                  <div class="progress-track">
                    <div class="progress-fill" style="width: ${s.onTimeDeliveryPct}%; background: ${s.onTimeDeliveryPct > 95 ? 'var(--color-success)' : 'var(--color-warning)'};"></div>
                  </div>
                </div>

                <div style="display: flex; justify-content: space-between; font-size: 0.8rem; color: var(--text-secondary);">
                  <div>Avg Lead Time: <strong>${s.avgLeadTimeDays} days</strong></div>
                  <div>Terms: <strong>${s.paymentTerms}</strong></div>
                </div>
              </div>

              <div>
                <div style="font-size: 0.75rem; color: var(--text-muted); font-weight: 600; text-transform: uppercase; margin-bottom: 6px;">Supplied Component Lines</div>
                <div style="display: flex; flex-wrap: wrap; gap: 6px;">
                  ${suppliedProducts.map(p => `
                    <span class="bin-tag" title="${p.name}" style="cursor: pointer;" onclick="window.appRouter.navigate('inventory'); setTimeout(() => window.InventoryModule.inspectProduct('${p.id}'), 100);">
                      ${p.sku}
                    </span>
                  `).join('')}
                </div>
              </div>

              <div style="display: flex; align-items: center; justify-content: space-between; margin-top: auto; padding-top: 12px; border-top: 1px solid var(--border-subtle);">
                <div style="font-size: 0.8rem; color: var(--text-muted);">
                  ${activePOs.length} active PO(s)
                </div>
                <div style="display: flex; gap: 8px;">
                  <button class="btn btn-outline btn-sm" onclick="SuppliersModule.inspectSupplier('${s.id}')">
                    Inspect
                  </button>
                  <button class="btn btn-primary btn-sm" onclick="window.ProcurementModule.openNewPOModal('${s.id}')">
                    + Order
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

  inspectSupplier(supplierId) {
    const s = window.erpStore.getSupplier(supplierId);
    if (!s) return;

    const activePOs = window.erpStore.getPurchaseOrders().filter(po => po.supplierId === s.id);
    const suppliedProducts = (s.suppliedProductIds || []).map(id => window.erpStore.getProduct(id)).filter(Boolean);

    const bodyHtml = `
      <div class="detail-grid">
        <div class="detail-item">
          <span class="lbl">Vendor Code</span>
          <span class="val text-mono text-brand">${s.code}</span>
        </div>
        <div class="detail-item">
          <span class="lbl">Performance Rating</span>
          <span class="val text-warning">★ ${s.rating} / 5.0</span>
        </div>
        <div class="detail-item">
          <span class="lbl">Primary Contact</span>
          <span class="val">${s.contactPerson}</span>
        </div>
        <div class="detail-item">
          <span class="lbl">Phone / Email</span>
          <span class="val" style="font-size: 0.8rem;">${s.email}</span>
        </div>
        <div class="detail-item">
          <span class="lbl">Contract Payment Terms</span>
          <span class="val">${s.paymentTerms}</span>
        </div>
        <div class="detail-item">
          <span class="lbl">Typical Freight Lead Time</span>
          <span class="val">${s.avgLeadTimeDays} days</span>
        </div>
      </div>

      <div style="background: var(--bg-surface-elevated); padding: 12px; border-radius: var(--radius-md); font-size: 0.825rem; color: var(--text-secondary);">
        <strong>Corporate Facility Address:</strong> ${s.address}
      </div>

      <div>
        <h4 style="font-size: 0.85rem; font-weight: 700; margin-bottom: 8px; text-transform: uppercase; color: var(--text-muted);">Contracted Catalog SKUs</h4>
        <table class="line-items-table">
          <thead>
            <tr>
              <th>SKU</th>
              <th>Description</th>
              <th style="text-align: right;">Contracted Cost</th>
            </tr>
          </thead>
          <tbody>
            ${suppliedProducts.map(p => `
              <tr>
                <td class="text-mono" style="font-weight: 700; color: var(--brand-primary);">${p.sku}</td>
                <td>${p.name}</td>
                <td style="text-align: right;" class="text-mono">${UI.formatCurrency(p.unitCost)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>

      <div>
        <h4 style="font-size: 0.85rem; font-weight: 700; margin-bottom: 8px; text-transform: uppercase; color: var(--text-muted);">Purchase Order History (${activePOs.length})</h4>
        ${activePOs.length === 0 ? `<p class="text-muted" style="font-size: 0.8rem;">No historical orders for this vendor.</p>` : `
          <table class="line-items-table">
            <thead>
              <tr>
                <th>PO ID</th>
                <th>Date</th>
                <th>Amount</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              ${activePOs.map(po => `
                <tr style="cursor: pointer;" onclick="UI.closeDrawer(); window.appRouter.navigate('procurement'); setTimeout(() => window.ProcurementModule.inspectPO('${po.id}'), 100);">
                  <td class="text-mono" style="font-weight: 700; color: var(--brand-primary);">${po.id}</td>
                  <td>${po.orderDate}</td>
                  <td class="text-mono">${UI.formatCurrency(po.totalAmount)}</td>
                  <td>${UI.getStatusBadge(po.status)}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        `}
      </div>
    `;

    const footerHtml = `
      <button class="btn btn-outline" onclick="UI.closeDrawer();">Close</button>
      <button class="btn btn-primary" onclick="UI.closeDrawer(); window.ProcurementModule.openNewPOModal('${s.id}');">
        + Create Purchase Order for ${s.code}
      </button>
    `;

    window.UI.openDrawer(`Vendor Master: ${s.name}`, bodyHtml, footerHtml);
  }
};

window.SuppliersModule = SuppliersModule;
