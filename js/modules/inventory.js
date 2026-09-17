/* ==========================================================================
   KT-SUPERSYSTEM ERP - MODULE: WAREHOUSE & INVENTORY MANAGEMENT
   Multi-Facility Stock, Bin Matrix, Lot Tracking, Transfers & 1-Click Reorder
   ========================================================================== */

const InventoryModule = {
  currentTab: 'all',
  categoryFilter: 'all',
  warehouseFilter: 'all',
  searchQuery: '',

  render() {
    const container = document.getElementById('view-inventory');
    if (!container) return;

    const products = window.erpStore.getProducts();
    const warehouses = window.erpStore.getWarehouses();
    const categories = Array.from(new Set(products.map(p => p.category)));

    // Filter products
    const filteredProducts = products.filter(p => {
      // Tab filter
      if (this.currentTab === 'low-stock' && p.totalStock > p.minStock) return false;

      // Category filter
      if (this.categoryFilter !== 'all' && p.category !== this.categoryFilter) return false;

      // Warehouse filter
      if (this.warehouseFilter !== 'all' && !(p.stockByWarehouse[this.warehouseFilter] > 0)) return false;

      // Search filter
      if (this.searchQuery) {
        const q = this.searchQuery.toLowerCase();
        return p.sku.toLowerCase().includes(q) ||
               p.name.toLowerCase().includes(q) ||
               p.binLocation.toLowerCase().includes(q);
      }
      return true;
    });

    const totalValuation = products.reduce((s, p) => s + (p.totalStock * p.unitCost), 0);
    const totalUnits = products.reduce((s, p) => s + p.totalStock, 0);
    const lowStockCount = products.filter(p => p.totalStock <= p.minStock).length;
    const reservedUnits = products.reduce((s, p) => s + (p.reservedStock || 0), 0);

    container.innerHTML = `
      <div class="view-header">
        <div class="view-title-group">
          <h1>
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="var(--brand-primary)" stroke-width="2.2"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>
            Warehouse Inventory & Stock Master
          </h1>
          <p>Real-time multi-depot stock control, bin allocations, safety buffer triggers and transfer logistics</p>
        </div>
        <div class="view-actions">
          <button class="btn btn-secondary" onclick="InventoryModule.openTransferModal()">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="17 1 21 5 17 9"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/><polyline points="7 23 3 19 7 15"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/></svg>
            Transfer Stock
          </button>
          <button class="btn btn-primary" onclick="InventoryModule.openAdjustmentModal()">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
            Cycle Count Audit
          </button>
        </div>
      </div>

      <!-- Inventory KPI Cards -->
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-header">
            <span class="stat-label">Total Stocked Volume</span>
            <div class="stat-icon-wrapper info">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="7" width="20" height="14" rx="2" ry="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>
            </div>
          </div>
          <div class="stat-body">
            <div class="stat-value">${totalUnits.toLocaleString()} <span style="font-size: 1rem; color: var(--text-muted);">units</span></div>
          </div>
          <div class="stat-footer">
            <span>Valued at: <strong>${UI.formatCurrency(totalValuation)}</strong></span>
          </div>
        </div>

        <div class="stat-card" style="cursor: pointer;" onclick="InventoryModule.setTab('low-stock');">
          <div class="stat-header">
            <span class="stat-label">Safety Buffer Deficits</span>
            <div class="stat-icon-wrapper ${lowStockCount > 0 ? 'danger' : 'success'}">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
            </div>
          </div>
          <div class="stat-body">
            <div class="stat-value">${lowStockCount} <span style="font-size: 1rem; color: var(--text-muted);">SKUs</span></div>
          </div>
          <div class="stat-footer">
            <span class="${lowStockCount > 0 ? 'text-danger' : 'text-success'} font-weight-bold">
              ${lowStockCount > 0 ? 'Action required: 1-Click Reorder available' : 'All SKUs optimal'}
            </span>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-header">
            <span class="stat-label">Stock Reserved for Sales</span>
            <div class="stat-icon-wrapper">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 14 14"/></svg>
            </div>
          </div>
          <div class="stat-body">
            <div class="stat-value">${reservedUnits} <span style="font-size: 1rem; color: var(--text-muted);">units</span></div>
          </div>
          <div class="stat-footer">
            <span>Allocated to confirmed sales orders</span>
          </div>
        </div>
      </div>

      <!-- Inventory Grid Container -->
      <div class="card-container">
        <div class="card-header-bar">
          <div class="tabs-navigation" style="margin-bottom: 0; border-bottom: none;">
            <button class="tab-button ${this.currentTab === 'all' ? 'active' : ''}" onclick="InventoryModule.setTab('all');">
              All SKUs <span class="tab-counter">${products.length}</span>
            </button>
            <button class="tab-button ${this.currentTab === 'low-stock' ? 'active' : ''}" onclick="InventoryModule.setTab('low-stock');">
              Low Stock Alert <span class="tab-counter" style="background: var(--color-danger-bg); color: var(--color-danger);">${lowStockCount}</span>
            </button>
            <button class="tab-button ${this.currentTab === 'movements' ? 'active' : ''}" onclick="InventoryModule.setTab('movements');">
              Movement Audit Log
            </button>
          </div>

          <div class="filter-bar">
            ${this.currentTab !== 'movements' ? `
              <select class="form-control" style="width: 150px; padding: 6px 10px; font-size: 0.8125rem;" onchange="InventoryModule.handleCategoryFilter(this.value)">
                <option value="all">All Categories</option>
                ${categories.map(c => `<option value="${c}" ${this.categoryFilter === c ? 'selected' : ''}>${c}</option>`).join('')}
              </select>

              <select class="form-control" style="width: 160px; padding: 6px 10px; font-size: 0.8125rem;" onchange="InventoryModule.handleWarehouseFilter(this.value)">
                <option value="all">All Warehouses</option>
                ${warehouses.map(w => `<option value="${w.id}" ${this.warehouseFilter === w.id ? 'selected' : ''}>${w.code} (${w.id})</option>`).join('')}
              </select>
            ` : ''}

            <div class="search-input-box">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
              <input type="text" placeholder="Search SKU, name, bin..." value="${this.searchQuery}" oninput="InventoryModule.handleSearch(this.value)">
            </div>
          </div>
        </div>

        ${this.currentTab === 'movements' ? this.renderMovementsTable() : this.renderProductsTable(filteredProducts)}
      </div>
    `;
  },

  renderProductsTable(filteredProducts) {
    return `
      <div class="table-responsive">
        <table class="data-table">
          <thead>
            <tr>
              <th>SKU & Description</th>
              <th>Category</th>
              <th>Bin Location</th>
              <th>Health / Status</th>
              <th>Depot Distribution</th>
              <th style="text-align: right;">Available</th>
              <th style="text-align: right;">Total Stock</th>
              <th style="text-align: right;">Unit Cost</th>
              <th style="text-align: right;">Asset Valuation</th>
              <th style="text-align: right;">Actions</th>
            </tr>
          </thead>
          <tbody>
            ${filteredProducts.length === 0 ? `
              <tr>
                <td colspan="10" style="text-align: center; padding: 40px; color: var(--text-muted);">
                  No items match the selected filter.
                </td>
              </tr>
            ` : filteredProducts.map(p => {
              const available = p.totalStock - (p.reservedStock || 0);
              const isLow = p.totalStock <= p.minStock;
              const isCritical = p.totalStock < (p.minStock * 0.4);
              const healthPct = Math.min(100, Math.round((p.totalStock / (p.minStock * 2)) * 100));
              const valuation = p.totalStock * p.unitCost;

              let healthClass = 'optimal';
              let statusLabel = 'Optimal';
              if (isCritical) { healthClass = 'danger'; statusLabel = 'Critical Low'; }
              else if (isLow) { healthClass = 'warning'; statusLabel = 'Reorder Level'; }

              return `
                <tr onclick="InventoryModule.inspectProduct('${p.id}')">
                  <td>
                    <div style="font-weight: 700; color: var(--brand-primary);">${p.sku}</div>
                    <div style="font-size: 0.8125rem; font-weight: 500; color: var(--text-primary); max-width: 240px;" class="truncate">${p.name}</div>
                  </td>
                  <td><span style="font-size: 0.8rem; color: var(--text-secondary);">${p.category}</span></td>
                  <td><span class="bin-tag">${p.binLocation}</span></td>
                  <td style="min-width: 130px;">
                    <div style="display: flex; align-items: center; justify-content: space-between; font-size: 0.725rem;">
                      <span class="${isLow ? (isCritical ? 'text-danger' : 'text-warning') : 'text-success'}" style="font-weight: 700;">
                        ${statusLabel}
                      </span>
                      <span style="color: var(--text-muted);">${p.totalStock}/${p.minStock} min</span>
                    </div>
                    <div class="stock-health-bar">
                      <div class="stock-health-fill ${healthClass}" style="width: ${healthPct}%;"></div>
                    </div>
                  </td>
                  <td>
                    <div style="font-size: 0.75rem; color: var(--text-muted); display: flex; gap: 6px;">
                      <span>Main: <strong>${p.stockByWarehouse['WH-MAIN'] || 0}</strong></span>
                      <span>Bay-B: <strong>${p.stockByWarehouse['WH-BAYB'] || 0}</strong></span>
                      <span>Cold: <strong>${p.stockByWarehouse['WH-COLD'] || 0}</strong></span>
                    </div>
                  </td>
                  <td style="text-align: right; font-weight: 700; color: ${available > 0 ? 'var(--color-success)' : 'var(--color-danger)'};">
                    ${available}
                    ${p.reservedStock > 0 ? `<div style="font-size: 0.7rem; color: var(--text-muted); font-weight: normal;">(${p.reservedStock} res)</div>` : ''}
                  </td>
                  <td style="text-align: right; font-weight: 700;">
                    ${p.totalStock}
                    ${p.onOrderStock > 0 ? `<div style="font-size: 0.7rem; color: var(--brand-primary); font-weight: 600;">+${p.onOrderStock} on PO</div>` : ''}
                  </td>
                  <td style="text-align: right;" class="text-mono">${UI.formatCurrency(p.unitCost)}</td>
                  <td style="text-align: right; font-weight: 700;" class="text-mono">${UI.formatCurrency(valuation)}</td>
                  <td style="text-align: right;" onclick="event.stopPropagation();">
                    <div style="display: inline-flex; gap: 6px;">
                      ${isLow ? `
                        <button class="btn btn-primary btn-sm" onclick="InventoryModule.triggerReorder('${p.id}')" title="1-Click Reorder from Preferred Supplier">
                          Reorder
                        </button>
                      ` : ''}
                      <button class="btn btn-outline btn-sm" onclick="InventoryModule.inspectProduct('${p.id}')">
                        Inspect
                      </button>
                    </div>
                  </td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>
      </div>
      <div class="data-table-footer">
        <span>Showing ${filteredProducts.length} items</span>
        <span style="font-size: 0.75rem;">Minimum safety stock dynamically controls reorder queue triggers</span>
      </div>
    `;
  },

  renderMovementsTable() {
    const movements = window.erpStore.getStockMovements();
    return `
      <div class="table-responsive">
        <table class="data-table">
          <thead>
            <tr>
              <th>Timestamp</th>
              <th>Movement Type</th>
              <th>Reference ID</th>
              <th>SKU / Product</th>
              <th>Warehouse Facility</th>
              <th style="text-align: center;">Change</th>
              <th style="text-align: right;">Balance After</th>
              <th>Operator</th>
              <th>Audit Notes</th>
            </tr>
          </thead>
          <tbody>
            ${movements.map(m => `
              <tr>
                <td style="font-size: 0.8rem; color: var(--text-muted); white-space: nowrap;">${m.timestamp}</td>
                <td>
                  <span class="badge ${m.type.includes('Receipt') ? 'badge-completed' : (m.type.includes('Sales') ? 'badge-approved' : 'badge-draft')}">
                    ${m.type}
                  </span>
                </td>
                <td class="text-mono" style="font-weight: 700; color: var(--brand-primary);">${m.referenceId}</td>
                <td>
                  <div style="font-weight: 600;">${m.productName}</div>
                  <div class="text-mono" style="font-size: 0.75rem; color: var(--text-muted);">${m.sku}</div>
                </td>
                <td><span class="location-badge">${m.warehouseId}</span></td>
                <td style="text-align: center; font-weight: 700; color: ${m.qtyChange > 0 ? 'var(--color-success)' : 'var(--color-danger)'};">
                  ${m.qtyChange > 0 ? '+' : ''}${m.qtyChange}
                </td>
                <td style="text-align: right; font-weight: 700;">${m.balanceAfter}</td>
                <td style="font-size: 0.8rem;">${m.operator}</td>
                <td style="font-size: 0.8rem; color: var(--text-secondary);">${m.notes || '—'}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `;
  },

  setTab(tab) {
    this.currentTab = tab;
    this.render();
  },

  handleCategoryFilter(val) {
    this.categoryFilter = val;
    this.render();
  },

  handleWarehouseFilter(val) {
    this.warehouseFilter = val;
    this.render();
  },

  handleSearch(val) {
    this.searchQuery = val;
    this.render();
  },

  inspectProduct(productId) {
    const p = window.erpStore.getProduct(productId);
    if (!p) return;

    const supplier = window.erpStore.getSupplier(p.preferredSupplierId);
    const available = p.totalStock - (p.reservedStock || 0);

    const bodyHtml = `
      <div class="detail-grid">
        <div class="detail-item">
          <span class="lbl">SKU Code</span>
          <span class="val text-mono text-brand">${p.sku}</span>
        </div>
        <div class="detail-item">
          <span class="lbl">Category</span>
          <span class="val">${p.category}</span>
        </div>
        <div class="detail-item">
          <span class="lbl">Bin Location</span>
          <span class="val text-mono">${p.binLocation}</span>
        </div>
        <div class="detail-item">
          <span class="lbl">Lot / Serial</span>
          <span class="val text-mono">${p.lotNumber}</span>
        </div>
        <div class="detail-item">
          <span class="lbl">Expiry Date</span>
          <span class="val">${p.expiryDate || 'N/A'}</span>
        </div>
        <div class="detail-item">
          <span class="lbl">Preferred Vendor</span>
          <span class="val">${supplier ? supplier.name : 'Unassigned'}</span>
        </div>
      </div>

      <div style="background: var(--bg-surface-elevated); padding: 16px; border-radius: var(--radius-md); border: 1px solid var(--border-subtle);">
        <h4 style="font-size: 0.85rem; font-weight: 700; margin-bottom: 12px; text-transform: uppercase; color: var(--text-muted);">Stock Accounting Summary</h4>
        <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; text-align: center;">
          <div style="background: var(--bg-surface); padding: 10px; border-radius: var(--radius-sm);">
            <div style="font-size: 1.3rem; font-weight: 800; color: var(--text-primary);">${p.totalStock}</div>
            <div style="font-size: 0.7rem; color: var(--text-muted); text-transform: uppercase;">Total On Hand</div>
          </div>
          <div style="background: var(--bg-surface); padding: 10px; border-radius: var(--radius-sm);">
            <div style="font-size: 1.3rem; font-weight: 800; color: var(--color-warning);">${p.reservedStock || 0}</div>
            <div style="font-size: 0.7rem; color: var(--text-muted); text-transform: uppercase;">Sales Reserved</div>
          </div>
          <div style="background: var(--bg-surface); padding: 10px; border-radius: var(--radius-sm);">
            <div style="font-size: 1.3rem; font-weight: 800; color: var(--color-success);">${available}</div>
            <div style="font-size: 0.7rem; color: var(--text-muted); text-transform: uppercase;">Uncommitted Available</div>
          </div>
        </div>
      </div>

      <div>
        <h4 style="font-size: 0.85rem; font-weight: 700; margin-bottom: 10px; text-transform: uppercase; color: var(--text-muted);">Warehouse Breakdown</h4>
        <table class="line-items-table">
          <thead>
            <tr>
              <th>Facility</th>
              <th style="text-align: right;">Quantity</th>
              <th style="text-align: right;">Valuation</th>
            </tr>
          </thead>
          <tbody>
            ${Object.entries(p.stockByWarehouse).map(([whId, qty]) => {
              const wh = window.erpStore.getWarehouse(whId);
              return `
                <tr>
                  <td>
                    <strong>${wh ? wh.name : whId}</strong>
                    <div style="font-size: 0.75rem; color: var(--text-muted);">${whId}</div>
                  </td>
                  <td style="text-align: right; font-weight: 700;">${qty} units</td>
                  <td style="text-align: right;" class="text-mono">${UI.formatCurrency(qty * p.unitCost)}</td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>
      </div>

      <div class="totals-summary-box">
        <div class="totals-row">
          <span>Unit Purchase Cost:</span>
          <span class="text-mono">${UI.formatCurrency(p.unitCost)}</span>
        </div>
        <div class="totals-row">
          <span>List Selling Price:</span>
          <span class="text-mono">${UI.formatCurrency(p.sellingPrice)}</span>
        </div>
        <div class="totals-row">
          <span>Target Safety Stock:</span>
          <span class="text-mono">${p.minStock} units</span>
        </div>
        <div class="totals-row grand-total">
          <span>Total Asset Valuation:</span>
          <span class="text-mono text-brand">${UI.formatCurrency(p.totalStock * p.unitCost)}</span>
        </div>
      </div>
    `;

    const footerHtml = `
      <button class="btn btn-outline" onclick="UI.closeDrawer();">Close</button>
      <button class="btn btn-secondary" onclick="UI.closeDrawer(); InventoryModule.openTransferModal('${p.id}');">
        Transfer Stock
      </button>
      <button class="btn btn-primary" onclick="UI.closeDrawer(); InventoryModule.triggerReorder('${p.id}');">
        Reorder Replenishment
      </button>
    `;

    window.UI.openDrawer(`Inventory Item: ${p.sku}`, bodyHtml, footerHtml);
  },

  triggerReorder(productId) {
    try {
      const newPO = window.erpStore.reorderLowStock(productId);
      window.UI.showToast('success', '1-Click Reorder Executed', `Created Purchase Order ${newPO.id} for preferred vendor. Auto-calculated batch replenishment.`);
      window.appRouter.navigate('procurement');
    } catch (e) {
      window.UI.showToast('danger', 'Reorder Failed', e.message);
    }
  },

  // --- INTER-WAREHOUSE TRANSFER MODAL ---
  openTransferModal(preselectedProductId = null) {
    const products = window.erpStore.getProducts();
    const warehouses = window.erpStore.getWarehouses();

    const modalBody = document.getElementById('transfer-stock-modal-body');
    if (!modalBody) return;

    modalBody.innerHTML = `
      <form id="transfer-stock-form" onsubmit="event.preventDefault(); InventoryModule.submitTransfer();">
        <div class="form-group">
          <label class="form-label">Material / SKU <span class="req">*</span></label>
          <select class="form-control" id="xfer-product-select" required onchange="InventoryModule.updateTransferMaxQty()">
            ${products.map(p => `
              <option value="${p.id}" ${preselectedProductId === p.id ? 'selected' : ''}>
                ${p.sku} - ${p.name} (Total: ${p.totalStock})
              </option>
            `).join('')}
          </select>
        </div>

        <div class="form-row" style="margin-top: 14px;">
          <div class="form-group">
            <label class="form-label">Source Facility <span class="req">*</span></label>
            <select class="form-control" id="xfer-source-select" required onchange="InventoryModule.updateTransferMaxQty()">
              ${warehouses.map(w => `<option value="${w.id}">${w.name}</option>`).join('')}
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Destination Facility <span class="req">*</span></label>
            <select class="form-control" id="xfer-target-select" required>
              ${warehouses.map((w, idx) => `<option value="${w.id}" ${idx === 1 ? 'selected' : ''}>${w.name}</option>`).join('')}
            </select>
          </div>
        </div>

        <div class="form-group" style="margin-top: 14px;">
          <div style="display: flex; justify-content: space-between;">
            <label class="form-label">Transfer Quantity <span class="req">*</span></label>
            <span id="xfer-avail-hint" style="font-size: 0.775rem; color: var(--brand-primary); font-weight: 600;"></span>
          </div>
          <input type="number" class="form-control" id="xfer-qty" min="1" value="10" required>
        </div>
      </form>
    `;

    window.UI.openModal('transfer-stock-modal');
    this.updateTransferMaxQty();
  },

  updateTransferMaxQty() {
    const productSelect = document.getElementById('xfer-product-select');
    const sourceSelect = document.getElementById('xfer-source-select');
    const qtyInput = document.getElementById('xfer-qty');
    const hint = document.getElementById('xfer-avail-hint');

    if (!productSelect || !sourceSelect) return;

    const p = window.erpStore.getProduct(productSelect.value);
    const sourceWh = sourceSelect.value;
    const availableInSource = (p && p.stockByWarehouse && p.stockByWarehouse[sourceWh]) || 0;

    if (hint) hint.innerText = `Available at Source: ${availableInSource} units`;
    if (qtyInput) {
      qtyInput.max = availableInSource;
      if (parseInt(qtyInput.value) > availableInSource) qtyInput.value = availableInSource;
    }
  },

  submitTransfer() {
    const productSelect = document.getElementById('xfer-product-select');
    const sourceSelect = document.getElementById('xfer-source-select');
    const targetSelect = document.getElementById('xfer-target-select');
    const qtyInput = document.getElementById('xfer-qty');

    const productId = productSelect.value;
    const sourceWarehouseId = sourceSelect.value;
    const targetWarehouseId = targetSelect.value;
    const qty = parseInt(qtyInput.value);

    try {
      window.erpStore.transferStock({
        productId,
        sourceWarehouseId,
        targetWarehouseId,
        qty
      });

      window.UI.closeModal('transfer-stock-modal');
      window.UI.showToast('success', 'Transfer Completed', `Transferred ${qty} units from ${sourceWarehouseId} to ${targetWarehouseId}.`);
      this.render();
    } catch (e) {
      window.UI.showToast('danger', 'Transfer Error', e.message);
    }
  },

  // --- PHYSICAL CYCLE COUNT ADJUSTMENT MODAL ---
  openAdjustmentModal() {
    const products = window.erpStore.getProducts();
    const warehouses = window.erpStore.getWarehouses();

    const modalBody = document.getElementById('adjust-stock-modal-body');
    if (!modalBody) return;

    modalBody.innerHTML = `
      <form id="adjust-stock-form" onsubmit="event.preventDefault(); InventoryModule.submitAdjustment();">
        <div class="form-group">
          <label class="form-label">Material / SKU <span class="req">*</span></label>
          <select class="form-control" id="adj-product-select" required onchange="InventoryModule.updateAdjustmentCurrentCount()">
            ${products.map(p => `<option value="${p.id}">${p.sku} - ${p.name}</option>`).join('')}
          </select>
        </div>

        <div class="form-group" style="margin-top: 14px;">
          <label class="form-label">Facility Counted <span class="req">*</span></label>
          <select class="form-control" id="adj-warehouse-select" required onchange="InventoryModule.updateAdjustmentCurrentCount()">
            ${warehouses.map(w => `<option value="${w.id}">${w.name}</option>`).join('')}
          </select>
        </div>

        <div class="form-row" style="margin-top: 14px;">
          <div class="form-group">
            <label class="form-label">System Recorded Qty</label>
            <input type="text" class="form-control" id="adj-sys-qty" readonly style="background: var(--bg-surface-elevated); color: var(--text-muted);">
          </div>
          <div class="form-group">
            <label class="form-label">Actual Physical Count <span class="req">*</span></label>
            <input type="number" class="form-control" id="adj-new-qty" min="0" required>
          </div>
        </div>

        <div class="form-group" style="margin-top: 14px;">
          <label class="form-label">Audit Reason / Justification <span class="req">*</span></label>
          <input type="text" class="form-control" id="adj-reason" placeholder="e.g. Annual physical count variance, damaged pallet..." required>
        </div>
      </form>
    `;

    window.UI.openModal('adjust-stock-modal');
    this.updateAdjustmentCurrentCount();
  },

  updateAdjustmentCurrentCount() {
    const productSelect = document.getElementById('adj-product-select');
    const warehouseSelect = document.getElementById('adj-warehouse-select');
    const sysQtyInput = document.getElementById('adj-sys-qty');
    const newQtyInput = document.getElementById('adj-new-qty');

    if (!productSelect || !warehouseSelect) return;

    const p = window.erpStore.getProduct(productSelect.value);
    const whId = warehouseSelect.value;
    const currentQty = (p && p.stockByWarehouse && p.stockByWarehouse[whId]) || 0;

    if (sysQtyInput) sysQtyInput.value = currentQty;
    if (newQtyInput) newQtyInput.value = currentQty;
  },

  submitAdjustment() {
    const productSelect = document.getElementById('adj-product-select');
    const warehouseSelect = document.getElementById('adj-warehouse-select');
    const newQtyInput = document.getElementById('adj-new-qty');
    const reasonInput = document.getElementById('adj-reason');

    const productId = productSelect.value;
    const warehouseId = warehouseSelect.value;
    const newQty = parseInt(newQtyInput.value);
    const reason = reasonInput.value;

    try {
      window.erpStore.adjustStock({
        productId,
        warehouseId,
        newQty,
        reason
      });

      window.UI.closeModal('adjust-stock-modal');
      window.UI.showToast('success', 'Physical Count Saved', `Adjusted inventory count in ${warehouseId}. Stock movement audit trail recorded.`);
      this.render();
    } catch (e) {
      window.UI.showToast('danger', 'Adjustment Error', e.message);
    }
  }
};

window.InventoryModule = InventoryModule;
