/* ==========================================================================
   KT-SUPERSYSTEM ERP - MODULE: SALES ORDERS & FULFILLMENT
   Quotes, Stock Reservation, Credit Limit Checks, Dispatch & Invoicing
   ========================================================================== */

const SalesModule = {
  currentTab: 'all',
  searchQuery: '',

  render() {
    const container = document.getElementById('view-sales');
    if (!container) return;

    const allSOs = window.erpStore.getSalesOrders();
    const filteredSOs = allSOs.filter(so => {
      // Tab filter
      if (this.currentTab === 'pending' && so.status !== 'Pending Approval') return false;
      if (this.currentTab === 'ready' && !so.status.includes('Confirmed')) return false;
      if (this.currentTab === 'dispatched' && so.status !== 'Dispatched & Invoiced') return false;

      // Search filter
      if (this.searchQuery) {
        const q = this.searchQuery.toLowerCase();
        return so.id.toLowerCase().includes(q) ||
               so.customerName.toLowerCase().includes(q) ||
               (so.invoiceNumber && so.invoiceNumber.toLowerCase().includes(q));
      }
      return true;
    });

    const pendingCount = allSOs.filter(s => s.status === 'Pending Approval').length;
    const readyCount = allSOs.filter(s => s.status.includes('Confirmed')).length;
    const dispatchedCount = allSOs.filter(s => s.status === 'Dispatched & Invoiced').length;
    const totalPipelineValue = allSOs.reduce((s, o) => s + o.totalAmount, 0);

    container.innerHTML = `
      <div class="view-header">
        <div class="view-title-group">
          <h1>
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="var(--brand-primary)" stroke-width="2.2"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>
            Sales Orders & Fulfillment
          </h1>
          <p>Customer quotations, real-time inventory reservations, discount governance, and dispatch invoicing</p>
        </div>
        <div class="view-actions">
          <button class="btn btn-primary" onclick="SalesModule.openNewSOModal()">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            + Create Sales Order
          </button>
        </div>
      </div>

      <!-- Quick KPI Stats -->
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-header">
            <span class="stat-label">Total Sales Orders</span>
            <div class="stat-icon-wrapper info">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/></svg>
            </div>
          </div>
          <div class="stat-body">
            <div class="stat-value">${allSOs.length}</div>
          </div>
          <div class="stat-footer">
            <span>Pipeline: <strong>${UI.formatCurrency(totalPipelineValue)}</strong></span>
          </div>
        </div>

        <div class="stat-card" style="cursor: pointer;" onclick="SalesModule.setTab('ready');">
          <div class="stat-header">
            <span class="stat-label">Ready to Dispatch</span>
            <div class="stat-icon-wrapper success">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>
            </div>
          </div>
          <div class="stat-body">
            <div class="stat-value">${readyCount} <span style="font-size: 1rem; color: var(--text-muted);">orders</span></div>
          </div>
          <div class="stat-footer">
            <span class="text-success font-weight-bold">Stock reserved in warehouse</span>
          </div>
        </div>

        <div class="stat-card" style="cursor: pointer;" onclick="SalesModule.setTab('pending');">
          <div class="stat-header">
            <span class="stat-label">Governance Held</span>
            <div class="stat-icon-wrapper ${pendingCount > 0 ? 'warning' : 'success'}">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
            </div>
          </div>
          <div class="stat-body">
            <div class="stat-value">${pendingCount}</div>
          </div>
          <div class="stat-footer">
            <span class="${pendingCount > 0 ? 'text-warning' : 'text-success'}">
              ${pendingCount > 0 ? 'Discount >15% or Credit Limit breach' : 'Zero approval bottlenecks'}
            </span>
          </div>
        </div>
      </div>

      <!-- Sales Orders Table Card -->
      <div class="card-container">
        <div class="card-header-bar">
          <div class="tabs-navigation" style="margin-bottom: 0; border-bottom: none;">
            <button class="tab-button ${this.currentTab === 'all' ? 'active' : ''}" onclick="SalesModule.setTab('all');">
              All Orders <span class="tab-counter">${allSOs.length}</span>
            </button>
            <button class="tab-button ${this.currentTab === 'ready' ? 'active' : ''}" onclick="SalesModule.setTab('ready');">
              Confirmed / Reserved <span class="tab-counter">${readyCount}</span>
            </button>
            <button class="tab-button ${this.currentTab === 'pending' ? 'active' : ''}" onclick="SalesModule.setTab('pending');">
              Pending Approval <span class="tab-counter">${pendingCount}</span>
            </button>
            <button class="tab-button ${this.currentTab === 'dispatched' ? 'active' : ''}" onclick="SalesModule.setTab('dispatched');">
              Dispatched & Invoiced <span class="tab-counter">${dispatchedCount}</span>
            </button>
          </div>

          <div class="filter-bar">
            <div class="search-input-box">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
              <input type="text" placeholder="Search order, customer, invoice..." value="${this.searchQuery}" oninput="SalesModule.handleSearch(this.value)">
            </div>
          </div>
        </div>

        <div class="table-responsive">
          <table class="data-table">
            <thead>
              <tr>
                <th>Order Number</th>
                <th>Customer</th>
                <th>Order Date</th>
                <th>Warehouse</th>
                <th>Items Ordered</th>
                <th>Discount</th>
                <th>Total Value</th>
                <th>Invoice</th>
                <th>Status</th>
                <th style="text-align: right;">Actions</th>
              </tr>
            </thead>
            <tbody>
              ${filteredSOs.length === 0 ? `
                <tr>
                  <td colspan="10" style="text-align: center; padding: 40px; color: var(--text-muted);">
                    No sales orders found matching this view.
                  </td>
                </tr>
              ` : filteredSOs.map(so => `
                <tr onclick="SalesModule.inspectSO('${so.id}')">
                  <td class="text-mono" style="font-weight: 700; color: var(--brand-primary);">${so.id}</td>
                  <td>
                    <div style="font-weight: 600;">${so.customerName}</div>
                    <div style="font-size: 0.75rem; color: var(--text-muted);">${so.paymentTerms}</div>
                  </td>
                  <td>${so.orderDate}</td>
                  <td><span class="location-badge">${so.sourceWarehouseId}</span></td>
                  <td>
                    <span>${so.items.reduce((s, i) => s + i.qty, 0)} units (${so.items.length} lines)</span>
                  </td>
                  <td>
                    ${so.discountPct > 0 ? `<span class="badge ${so.discountPct > 15 ? 'badge-rejected' : 'badge-draft'}">${so.discountPct}% off</span>` : '—'}
                  </td>
                  <td style="font-weight: 700;">${UI.formatCurrency(so.totalAmount)}</td>
                  <td>
                    ${so.invoiceNumber ? `
                      <span class="text-mono" style="font-weight: 600; font-size: 0.8rem; color: var(--color-success);">${so.invoiceNumber}</span>
                    ` : `<span style="font-size: 0.75rem; color: var(--text-muted);">${so.invoiceStatus || 'Uninvoiced'}</span>`}
                  </td>
                  <td>${UI.getStatusBadge(so.status)}</td>
                  <td style="text-align: right;" onclick="event.stopPropagation();">
                    <div style="display: inline-flex; gap: 6px;">
                      ${so.status.includes('Confirmed') ? `
                        <button class="btn btn-success btn-sm" onclick="SalesModule.dispatchOrder('${so.id}')" title="Pick, pack, deduct warehouse stock and generate invoice">
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                          Dispatch & Invoice
                        </button>
                      ` : ''}
                      ${so.status === 'Pending Approval' ? `
                        <button class="btn btn-warning btn-sm" onclick="window.appRouter.navigate('approvals');">
                          Review Approval
                        </button>
                      ` : ''}
                      <button class="btn btn-outline btn-sm" onclick="SalesModule.inspectSO('${so.id}')">
                        Inspect
                      </button>
                    </div>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
        <div class="data-table-footer">
          <span>Showing ${filteredSOs.length} of ${allSOs.length} sales orders</span>
          <span style="font-size: 0.75rem;">Discounts > 15% and credit limit overrides require Director approval</span>
        </div>
      </div>
    `;
  },

  setTab(tab) {
    this.currentTab = tab;
    this.render();
  },

  handleSearch(val) {
    this.searchQuery = val;
    this.render();
  },

  inspectSO(soId) {
    const so = window.erpStore.getSalesOrder(soId);
    if (!so) return;

    const customer = window.erpStore.getCustomer(so.customerId);

    const bodyHtml = `
      <div class="detail-grid">
        <div class="detail-item">
          <span class="lbl">Order Number</span>
          <span class="val text-mono">${so.id}</span>
        </div>
        <div class="detail-item">
          <span class="lbl">Status</span>
          <span class="val">${UI.getStatusBadge(so.status)}</span>
        </div>
        <div class="detail-item">
          <span class="lbl">Customer Client</span>
          <span class="val">${so.customerName}</span>
        </div>
        <div class="detail-item">
          <span class="lbl">Fulfillment Depot</span>
          <span class="val">${so.sourceWarehouseId}</span>
        </div>
        <div class="detail-item">
          <span class="lbl">Order Date</span>
          <span class="val">${so.orderDate}</span>
        </div>
        <div class="detail-item">
          <span class="lbl">Invoice Number</span>
          <span class="val text-mono">${so.invoiceNumber || 'Pending Dispatch'}</span>
        </div>
      </div>

      <!-- Lifecycle Stepper -->
      <div class="lifecycle-stepper">
        <div class="step-node completed">
          <div class="step-circle">✓</div>
          <span class="step-label">Quote Created</span>
        </div>
        <div class="step-node ${so.status !== 'Pending Approval' ? 'completed' : 'current'}">
          <div class="step-circle">${so.status !== 'Pending Approval' ? '✓' : '2'}</div>
          <span class="step-label">${so.status === 'Pending Approval' ? 'Approval Gate' : 'Confirmed'}</span>
        </div>
        <div class="step-node ${so.status === 'Dispatched & Invoiced' ? 'completed' : (so.status.includes('Confirmed') ? 'current' : '')}">
          <div class="step-circle">${so.status === 'Dispatched & Invoiced' ? '✓' : '3'}</div>
          <span class="step-label">Stock Reserved</span>
        </div>
        <div class="step-node ${so.status === 'Dispatched & Invoiced' ? 'completed' : ''}">
          <div class="step-circle">${so.status === 'Dispatched & Invoiced' ? '✓' : '4'}</div>
          <span class="step-label">Dispatched & Invoiced</span>
        </div>
      </div>

      ${so.trackingNumber ? `
        <div style="background: var(--color-success-bg); border: 1px solid var(--color-success-border); padding: 12px 16px; border-radius: var(--radius-md); display: flex; justify-content: space-between; align-items: center;">
          <div>
            <div style="font-size: 0.75rem; color: var(--color-success); font-weight: 700; text-transform: uppercase;">Shipment Carrier Tracking</div>
            <div class="text-mono" style="font-size: 0.95rem; font-weight: 700; color: var(--text-primary);">${so.trackingNumber}</div>
          </div>
          <span class="badge badge-completed">In Transit</span>
        </div>
      ` : ''}

      <div>
        <h4 style="font-size: 0.9rem; font-weight: 700; margin-bottom: 8px;">Order Line Items</h4>
        <table class="line-items-table">
          <thead>
            <tr>
              <th>SKU / Product</th>
              <th style="text-align: center;">Qty</th>
              <th style="text-align: right;">Unit Price</th>
              <th style="text-align: right;">Total</th>
            </tr>
          </thead>
          <tbody>
            ${so.items.map(item => `
              <tr>
                <td>
                  <div style="font-weight: 600;">${item.name}</div>
                  <div class="text-mono" style="font-size: 0.75rem; color: var(--text-muted);">${item.sku}</div>
                </td>
                <td style="text-align: center; font-weight: 600;">${item.qty}</td>
                <td style="text-align: right;" class="text-mono">${UI.formatCurrency(item.unitPrice)}</td>
                <td style="text-align: right; font-weight: 700;" class="text-mono">${UI.formatCurrency(item.lineTotal)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>

      <div class="totals-summary-box">
        <div class="totals-row">
          <span>Gross Subtotal:</span>
          <span class="text-mono">${UI.formatCurrency(so.subtotal)}</span>
        </div>
        ${so.discountAmount > 0 ? `
          <div class="totals-row text-warning">
            <span>Special Discount (${so.discountPct}%):</span>
            <span class="text-mono">-${UI.formatCurrency(so.discountAmount)}</span>
          </div>
        ` : ''}
        <div class="totals-row">
          <span>Sales Tax (8%):</span>
          <span class="text-mono">${UI.formatCurrency(so.tax)}</span>
        </div>
        <div class="totals-row">
          <span>Freight & Handling:</span>
          <span class="text-mono">${UI.formatCurrency(so.shipping)}</span>
        </div>
        <div class="totals-row grand-total">
          <span>Grand Invoiced Total:</span>
          <span class="text-mono text-brand">${UI.formatCurrency(so.totalAmount)}</span>
        </div>
      </div>

      ${customer ? `
        <div style="background: var(--bg-surface-elevated); padding: 14px; border-radius: var(--radius-md); font-size: 0.825rem; border: 1px solid var(--border-subtle);">
          <div style="font-weight: 700; margin-bottom: 4px; color: var(--text-primary);">Customer Financial Health Check</div>
          <div style="display: flex; justify-content: space-between; color: var(--text-muted);">
            <span>Credit Limit: ${UI.formatCurrency(customer.creditLimit)}</span>
            <span>Current Outstanding: ${UI.formatCurrency(customer.outstandingBalance)}</span>
          </div>
        </div>
      ` : ''}
    `;

    let footerHtml = `
      <button class="btn btn-outline" onclick="UI.closeDrawer();">Close</button>
    `;

    if (so.status.includes('Confirmed')) {
      footerHtml += `
        <button class="btn btn-success" onclick="UI.closeDrawer(); SalesModule.dispatchOrder('${so.id}');">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>
          Confirm Dispatch & Generate Invoice
        </button>
      `;
    }

    window.UI.openDrawer(`Sales Order: ${so.id}`, bodyHtml, footerHtml);
  },

  dispatchOrder(soId) {
    try {
      const so = window.erpStore.dispatchSalesOrder(soId);
      window.UI.showToast('success', 'Order Dispatched & Invoiced!', `${so.id} fulfilled. Inventory deducted from warehouse dock, invoice ${so.invoiceNumber} generated.`);
      this.render();
    } catch (e) {
      window.UI.showToast('danger', 'Dispatch Error', e.message);
    }
  },

  // --- NEW SALES ORDER MODAL ---
  openNewSOModal(preselectedCustomerId = null) {
    const customers = window.erpStore.getCustomers();
    const warehouses = window.erpStore.getWarehouses();
    const products = window.erpStore.getProducts();

    const modalBody = document.getElementById('new-so-modal-body');
    if (!modalBody) return;

    modalBody.innerHTML = `
      <form id="new-so-form" onsubmit="event.preventDefault(); SalesModule.submitNewSO();">
        <div class="form-row">
          <div class="form-group">
            <label class="form-label">Client / Customer <span class="req">*</span></label>
            <select class="form-control" id="so-customer-select" required onchange="SalesModule.handleCustomerChange(this.value)">
              <option value="">-- Choose Corporate Client --</option>
              ${customers.map(c => `
                <option value="${c.id}" ${preselectedCustomerId === c.id ? 'selected' : ''}>${c.name} (${c.tier})</option>
              `).join('')}
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Fulfillment Facility <span class="req">*</span></label>
            <select class="form-control" id="so-warehouse-select" required onchange="SalesModule.updateAvailableStockHints()">
              ${warehouses.map(w => `<option value="${w.id}">${w.name}</option>`).join('')}
            </select>
          </div>
        </div>

        <div id="so-customer-credit-bar" style="margin-top: 10px;"></div>

        <div style="margin-top: 14px;">
          <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px;">
            <label class="form-label">Order Items (Checks Stock Availability) <span class="req">*</span></label>
            <button type="button" class="btn btn-secondary btn-sm" onclick="SalesModule.addSOLineItem()">+ Add SKU</button>
          </div>

          <table class="line-items-table" id="so-lines-table">
            <thead>
              <tr>
                <th style="width: 45%;">Item / SKU</th>
                <th style="width: 20%;">Qty</th>
                <th style="width: 20%;">Price ($)</th>
                <th style="width: 15%; text-align: right;">Action</th>
              </tr>
            </thead>
            <tbody id="so-lines-tbody">
              <!-- Injected rows -->
            </tbody>
          </table>
        </div>

        <div class="form-row" style="margin-top: 14px;">
          <div class="form-group">
            <label class="form-label">Commercial Discount (%)</label>
            <input type="number" class="form-control" id="so-discount-pct" min="0" max="50" step="1" value="0" oninput="SalesModule.recalculateSOTotals()">
          </div>
          <div class="form-group">
            <label class="form-label">Billing Payment Terms</label>
            <select class="form-control" id="so-terms-select">
              <option value="Net 30">Net 30 Days</option>
              <option value="Net 45">Net 45 Days</option>
              <option value="Net 60">Net 60 Days</option>
              <option value="Prepaid">Prepaid / Wire</option>
            </select>
          </div>
        </div>

        <!-- Live Totals Calculation & Governance Alert -->
        <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-top: 16px; flex-wrap: wrap; gap: 12px;">
          <div id="so-governance-alert" style="flex: 1; min-width: 240px; font-size: 0.8rem;"></div>

          <div class="totals-summary-box" style="margin-top: 0;">
            <div class="totals-row">
              <span>Subtotal:</span>
              <span class="text-mono" id="so-calc-subtotal">$0.00</span>
            </div>
            <div class="totals-row text-warning" id="so-calc-discount-row" style="display: none;">
              <span>Discount:</span>
              <span class="text-mono" id="so-calc-discount">-$0.00</span>
            </div>
            <div class="totals-row">
              <span>Tax (8%):</span>
              <span class="text-mono" id="so-calc-tax">$0.00</span>
            </div>
            <div class="totals-row">
              <span>Delivery Freight:</span>
              <span class="text-mono" id="so-calc-shipping">$180.00</span>
            </div>
            <div class="totals-row grand-total">
              <span>Grand Total:</span>
              <span class="text-mono text-brand" id="so-calc-total">$180.00</span>
            </div>
          </div>
        </div>
      </form>
    `;

    window.UI.openModal('new-so-modal');
    this.addSOLineItem();
    if (preselectedCustomerId) {
      this.handleCustomerChange(preselectedCustomerId);
    }
    this.recalculateSOTotals();
  },

  handleCustomerChange(customerId) {
    const customer = window.erpStore.getCustomer(customerId);
    const creditBar = document.getElementById('so-customer-credit-bar');
    if (!creditBar) return;

    if (!customer) {
      creditBar.innerHTML = '';
      return;
    }

    const availableCredit = Math.max(0, customer.creditLimit - customer.outstandingBalance);
    const utilPct = Math.min(100, Math.round((customer.outstandingBalance / customer.creditLimit) * 100));

    creditBar.innerHTML = `
      <div style="background: var(--bg-surface-elevated); padding: 10px 14px; border-radius: var(--radius-md); border: 1px solid var(--border-subtle); font-size: 0.775rem;">
        <div style="display: flex; justify-content: space-between; font-weight: 600; margin-bottom: 4px;">
          <span>Credit Utilization: <strong>${utilPct}%</strong> (${UI.formatCurrency(customer.outstandingBalance)} / ${UI.formatCurrency(customer.creditLimit)})</span>
          <span style="color: ${availableCredit > 0 ? 'var(--color-success)' : 'var(--color-danger)'};">Available: ${UI.formatCurrency(availableCredit)}</span>
        </div>
        <div class="progress-track">
          <div class="progress-fill" style="width: ${utilPct}%; background: ${utilPct > 90 ? 'var(--color-danger)' : (utilPct > 70 ? 'var(--color-warning)' : 'var(--color-success)')};"></div>
        </div>
      </div>
    `;

    this.recalculateSOTotals();
  },

  addSOLineItem() {
    const tbody = document.getElementById('so-lines-tbody');
    if (!tbody) return;

    const products = window.erpStore.getProducts();
    const rowId = 'so-row-' + Date.now() + '-' + Math.floor(Math.random() * 100);

    const tr = document.createElement('tr');
    tr.id = rowId;
    tr.innerHTML = `
      <td>
        <select class="form-control so-item-select" required onchange="SalesModule.handleSOLineProductChange('${rowId}', this.value)">
          <option value="">-- Select SKU --</option>
          ${products.map(p => {
            const avail = p.totalStock - (p.reservedStock || 0);
            return `<option value="${p.id}">${p.sku} - ${p.name} (Avail: ${avail})</option>`;
          }).join('')}
        </select>
        <div class="so-avail-tag" style="font-size: 0.7rem; color: var(--text-muted); margin-top: 2px;"></div>
      </td>
      <td>
        <input type="number" class="form-control so-item-qty" min="1" value="5" required oninput="SalesModule.recalculateSOTotals()">
      </td>
      <td>
        <input type="number" class="form-control so-item-price" min="0.01" step="0.01" value="0.00" required oninput="SalesModule.recalculateSOTotals()">
      </td>
      <td style="text-align: right;">
        <button type="button" class="btn btn-outline btn-sm" onclick="this.closest('tr').remove(); SalesModule.recalculateSOTotals();" style="color: var(--color-danger);">
          ✕
        </button>
      </td>
    `;

    tbody.appendChild(tr);
    this.recalculateSOTotals();
  },

  handleSOLineProductChange(rowId, productId) {
    const row = document.getElementById(rowId);
    if (!row) return;

    const product = window.erpStore.getProduct(productId);
    if (product) {
      const priceInput = row.querySelector('.so-item-price');
      if (priceInput) priceInput.value = product.sellingPrice.toFixed(2);

      const availTag = row.querySelector('.so-avail-tag');
      const avail = product.totalStock - (product.reservedStock || 0);
      if (availTag) {
        availTag.innerHTML = `Avail: <strong>${avail}</strong> | Total: ${product.totalStock} | Res: ${product.reservedStock || 0}`;
        availTag.style.color = avail > 0 ? 'var(--color-success)' : 'var(--color-danger)';
      }
    }
    this.recalculateSOTotals();
  },

  updateAvailableStockHints() {
    document.querySelectorAll('#so-lines-tbody tr').forEach(row => {
      const select = row.querySelector('.so-item-select');
      if (select && select.value) {
        this.handleSOLineProductChange(row.id, select.value);
      }
    });
  },

  recalculateSOTotals() {
    let subtotal = 0;
    const rows = document.querySelectorAll('#so-lines-tbody tr');

    rows.forEach(row => {
      const qty = parseFloat(row.querySelector('.so-item-qty')?.value) || 0;
      const price = parseFloat(row.querySelector('.so-item-price')?.value) || 0;
      subtotal += (qty * price);
    });

    const discountPct = parseFloat(document.getElementById('so-discount-pct')?.value) || 0;
    const discountAmount = Math.round(subtotal * (discountPct / 100) * 100) / 100;
    const discountedSubtotal = subtotal - discountAmount;
    const tax = Math.round(discountedSubtotal * 0.08 * 100) / 100;
    const shipping = subtotal > 0 ? 180 : 0;
    const total = discountedSubtotal + tax + shipping;

    const subtotalEl = document.getElementById('so-calc-subtotal');
    const discountRow = document.getElementById('so-calc-discount-row');
    const discountEl = document.getElementById('so-calc-discount');
    const taxEl = document.getElementById('so-calc-tax');
    const shippingEl = document.getElementById('so-calc-shipping');
    const totalEl = document.getElementById('so-calc-total');
    const alertEl = document.getElementById('so-governance-alert');

    if (subtotalEl) subtotalEl.innerText = UI.formatCurrency(subtotal);
    if (discountRow) discountRow.style.display = discountAmount > 0 ? 'flex' : 'none';
    if (discountEl) discountEl.innerText = '-' + UI.formatCurrency(discountAmount);
    if (taxEl) taxEl.innerText = UI.formatCurrency(tax);
    if (shippingEl) shippingEl.innerText = UI.formatCurrency(shipping);
    if (totalEl) totalEl.innerText = UI.formatCurrency(total);

    // Customer credit limit check
    const customerId = document.getElementById('so-customer-select')?.value;
    const customer = window.erpStore.getCustomer(customerId);

    if (alertEl) {
      if (discountPct > 15) {
        alertEl.innerHTML = `
          <div style="background: var(--color-warning-bg); border: 1px solid var(--color-warning-border); padding: 10px 14px; border-radius: var(--radius-md); color: var(--color-warning);">
            <strong>⚠️ Governance Warning:</strong> Commercial discount of ${discountPct}% exceeds company threshold (15.0%). Order requires Sales Director sign-off before dispatch.
          </div>
        `;
      } else if (customer && (customer.outstandingBalance + total) > customer.creditLimit) {
        alertEl.innerHTML = `
          <div style="background: var(--color-danger-bg); border: 1px solid var(--color-danger-border); padding: 10px 14px; border-radius: var(--radius-md); color: var(--color-danger);">
            <strong>⚠️ Credit Limit Breach:</strong> Order brings total balance to ${UI.formatCurrency(customer.outstandingBalance + total)}, exceeding approved limit of ${UI.formatCurrency(customer.creditLimit)}. Requires CFO sign-off.
          </div>
        `;
      } else {
        alertEl.innerHTML = `
          <div style="background: var(--color-success-bg); border: 1px solid var(--color-success-border); padding: 10px 14px; border-radius: var(--radius-md); color: var(--color-success);">
            <strong>✓ Clean Order:</strong> Pricing and credit parameters verified. Warehouse stock will be reserved immediately upon confirmation.
          </div>
        `;
      }
    }
  },

  submitNewSO() {
    const customerSelect = document.getElementById('so-customer-select');
    const warehouseSelect = document.getElementById('so-warehouse-select');
    const discountInput = document.getElementById('so-discount-pct');
    const termsSelect = document.getElementById('so-terms-select');

    const customerId = customerSelect.value;
    const warehouseId = warehouseSelect.value;
    const discountPct = parseFloat(discountInput ? discountInput.value : 0) || 0;
    const paymentTerms = termsSelect ? termsSelect.value : 'Net 30';

    const items = [];
    const rows = document.querySelectorAll('#so-lines-tbody tr');
    rows.forEach(row => {
      const productId = row.querySelector('.so-item-select')?.value;
      const qty = parseFloat(row.querySelector('.so-item-qty')?.value);
      const unitPrice = parseFloat(row.querySelector('.so-item-price')?.value);

      if (productId && qty > 0) {
        items.push({ productId, qty, unitPrice });
      }
    });

    if (items.length === 0) {
      window.UI.showToast('danger', 'Validation Error', 'Please select at least one item.');
      return;
    }

    try {
      const newSO = window.erpStore.createSalesOrder({
        customerId,
        sourceWarehouseId: warehouseId,
        items,
        discountPct,
        paymentTerms
      });

      window.UI.closeModal('new-so-modal');

      if (newSO.requiresApproval) {
        window.UI.showToast('warning', 'Order Routed for Governance', `${newSO.id} created. Transferred to Approvals inbox (${newSO.approvalType}).`);
      } else {
        window.UI.showToast('success', 'Sales Order Confirmed!', `${newSO.id} confirmed. Warehouse stock reserved and ready for dispatch.`);
      }

      this.render();
    } catch (e) {
      window.UI.showToast('danger', 'Order Failed', e.message);
    }
  }
};

window.SalesModule = SalesModule;
