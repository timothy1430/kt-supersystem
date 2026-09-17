/* ==========================================================================
   KT-SUPERSYSTEM ERP - MODULE: PROCUREMENT & PURCHASE ORDERS
   Vendor RFQs, PO Life-Cycle, 3-Way Matching & Goods Receipt Inbound (GRN)
   ========================================================================== */

const ProcurementModule = {
  currentTab: 'all',
  searchQuery: '',

  render() {
    const container = document.getElementById('view-procurement');
    if (!container) return;

    const allPOs = window.erpStore.getPurchaseOrders();
    const filteredPOs = allPOs.filter(po => {
      // Tab filter
      if (this.currentTab === 'pending' && po.status !== 'Pending Approval') return false;
      if (this.currentTab === 'approved' && po.status !== 'Approved') return false;
      if (this.currentTab === 'received' && po.status !== 'Fully Received' && po.status !== 'Partially Received') return false;

      // Search filter
      if (this.searchQuery) {
        const q = this.searchQuery.toLowerCase();
        return po.id.toLowerCase().includes(q) ||
               po.supplierName.toLowerCase().includes(q) ||
               po.items.some(i => i.sku.toLowerCase().includes(q) || i.name.toLowerCase().includes(q));
      }
      return true;
    });

    const pendingCount = allPOs.filter(p => p.status === 'Pending Approval').length;
    const approvedCount = allPOs.filter(p => p.status === 'Approved').length;
    const receivedCount = allPOs.filter(p => p.status.includes('Received')).length;
    const totalCommitted = allPOs.reduce((s, p) => s + p.totalAmount, 0);

    container.innerHTML = `
      <div class="view-header">
        <div class="view-title-group">
          <h1>
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="var(--brand-primary)" stroke-width="2.2"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>
            Procurement & Purchase Orders
          </h1>
          <p>Manage supplier orders, multi-tier spending approvals, 3-way matching and inbound dock receiving</p>
        </div>
        <div class="view-actions">
          <button class="btn btn-primary" onclick="ProcurementModule.openNewPOModal()">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            + Create Purchase Order
          </button>
        </div>
      </div>

      <!-- Quick Stats -->
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-header">
            <span class="stat-label">Active Orders</span>
            <div class="stat-icon-wrapper info">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
            </div>
          </div>
          <div class="stat-body">
            <div class="stat-value">${allPOs.length}</div>
          </div>
          <div class="stat-footer">
            <span>Committed Value: <strong>${UI.formatCurrency(totalCommitted)}</strong></span>
          </div>
        </div>

        <div class="stat-card" style="cursor: pointer;" onclick="ProcurementModule.setTab('pending');">
          <div class="stat-header">
            <span class="stat-label">Awaiting Approval</span>
            <div class="stat-icon-wrapper ${pendingCount > 0 ? 'warning' : 'success'}">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
            </div>
          </div>
          <div class="stat-body">
            <div class="stat-value">${pendingCount}</div>
          </div>
          <div class="stat-footer">
            <span class="${pendingCount > 0 ? 'text-warning' : 'text-success'} font-weight-bold">
              ${pendingCount > 0 ? 'Requires Director sign-off (> $5k)' : 'All cleared'}
            </span>
          </div>
        </div>

        <div class="stat-card" style="cursor: pointer;" onclick="ProcurementModule.setTab('approved');">
          <div class="stat-header">
            <span class="stat-label">Ready for Receiving</span>
            <div class="stat-icon-wrapper success">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>
            </div>
          </div>
          <div class="stat-body">
            <div class="stat-value">${approvedCount}</div>
          </div>
          <div class="stat-footer">
            <span>Inbound to warehouse dock</span>
          </div>
        </div>
      </div>

      <!-- Main Table Card -->
      <div class="card-container">
        <div class="card-header-bar">
          <div class="tabs-navigation" style="margin-bottom: 0; border-bottom: none;">
            <button class="tab-button ${this.currentTab === 'all' ? 'active' : ''}" onclick="ProcurementModule.setTab('all');">
              All Orders <span class="tab-counter">${allPOs.length}</span>
            </button>
            <button class="tab-button ${this.currentTab === 'pending' ? 'active' : ''}" onclick="ProcurementModule.setTab('pending');">
              Pending Approval <span class="tab-counter">${pendingCount}</span>
            </button>
            <button class="tab-button ${this.currentTab === 'approved' ? 'active' : ''}" onclick="ProcurementModule.setTab('approved');">
              Approved / Inbound <span class="tab-counter">${approvedCount}</span>
            </button>
            <button class="tab-button ${this.currentTab === 'received' ? 'active' : ''}" onclick="ProcurementModule.setTab('received');">
              Received <span class="tab-counter">${receivedCount}</span>
            </button>
          </div>

          <div class="filter-bar">
            <div class="search-input-box">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
              <input type="text" placeholder="Search PO or supplier..." value="${this.searchQuery}" oninput="ProcurementModule.handleSearch(this.value)">
            </div>
          </div>
        </div>

        <div class="table-responsive">
          <table class="data-table">
            <thead>
              <tr>
                <th>PO Number</th>
                <th>Supplier</th>
                <th>Order Date</th>
                <th>Destination</th>
                <th>Items</th>
                <th>Total Value</th>
                <th>3-Way Match</th>
                <th>Status</th>
                <th style="text-align: right;">Actions</th>
              </tr>
            </thead>
            <tbody>
              ${filteredPOs.length === 0 ? `
                <tr>
                  <td colspan="9" style="text-align: center; padding: 40px; color: var(--text-muted);">
                    No purchase orders found matching this view.
                  </td>
                </tr>
              ` : filteredPOs.map(po => `
                <tr onclick="ProcurementModule.inspectPO('${po.id}')">
                  <td class="text-mono" style="font-weight: 700; color: var(--brand-primary);">${po.id}</td>
                  <td>
                    <div style="font-weight: 600;">${po.supplierName}</div>
                    <div style="font-size: 0.75rem; color: var(--text-muted);">${po.paymentTerms}</div>
                  </td>
                  <td>${po.orderDate}</td>
                  <td><span class="location-badge">${po.targetWarehouseId}</span></td>
                  <td>
                    <span title="${po.items.map(i => `${i.qty}x ${i.name}`).join(', ')}">
                      ${po.items.reduce((s, i) => s + i.qty, 0)} units (${po.items.length} SKUs)
                    </span>
                  </td>
                  <td style="font-weight: 700;">${UI.formatCurrency(po.totalAmount)}</td>
                  <td>
                    ${po.threeWayMatched ? `
                      <span class="three-way-match-badge" title="PO items, physical goods receipt note, and invoice amounts match exactly.">
                        <span class="match-item matched">✓ 3-Way OK</span>
                      </span>
                    ` : `
                      <span class="three-way-match-badge" style="opacity: 0.7;">
                        <span class="match-item unmatched">Pending Inbound</span>
                      </span>
                    `}
                  </td>
                  <td>${UI.getStatusBadge(po.status)}</td>
                  <td style="text-align: right;" onclick="event.stopPropagation();">
                    <div style="display: inline-flex; gap: 6px;">
                      ${(po.status === 'Approved' || po.status === 'Partially Received') ? `
                        <button class="btn btn-success btn-sm" onclick="ProcurementModule.openReceiveGoodsModal('${po.id}')" title="Record Inbound Goods Receipt Note">
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                          Receive Dock
                        </button>
                      ` : ''}
                      ${po.status === 'Pending Approval' ? `
                        <button class="btn btn-warning btn-sm" onclick="window.appRouter.navigate('approvals');" title="Awaiting executive sign-off">
                          Review in Approvals
                        </button>
                      ` : ''}
                      <button class="btn btn-outline btn-sm" onclick="ProcurementModule.inspectPO('${po.id}')">
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
          <span>Showing ${filteredPOs.length} of ${allPOs.length} purchase orders</span>
          <span style="font-size: 0.75rem;">Orders over $5,000 require executive governance sign-off</span>
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

  inspectPO(poId) {
    const po = window.erpStore.getPurchaseOrder(poId);
    if (!po) return;

    const bodyHtml = `
      <div class="detail-grid">
        <div class="detail-item">
          <span class="lbl">PO Reference</span>
          <span class="val text-mono">${po.id}</span>
        </div>
        <div class="detail-item">
          <span class="lbl">Status</span>
          <span class="val">${UI.getStatusBadge(po.status)}</span>
        </div>
        <div class="detail-item">
          <span class="lbl">Supplier</span>
          <span class="val">${po.supplierName}</span>
        </div>
        <div class="detail-item">
          <span class="lbl">Target Warehouse</span>
          <span class="val">${po.targetWarehouseId}</span>
        </div>
        <div class="detail-item">
          <span class="lbl">Order Date</span>
          <span class="val">${po.orderDate}</span>
        </div>
        <div class="detail-item">
          <span class="lbl">Expected Inbound</span>
          <span class="val">${po.expectedDate}</span>
        </div>
      </div>

      <!-- Lifecycle Stepper -->
      <div class="lifecycle-stepper">
        <div class="step-node completed">
          <div class="step-circle">✓</div>
          <span class="step-label">Requisition</span>
        </div>
        <div class="step-node ${po.status !== 'Pending Approval' ? 'completed' : 'current'}">
          <div class="step-circle">${po.status !== 'Pending Approval' ? '✓' : '2'}</div>
          <span class="step-label">${po.status === 'Pending Approval' ? 'Pending Approval' : 'Approved'}</span>
        </div>
        <div class="step-node ${po.status.includes('Received') ? 'completed' : (po.status === 'Approved' ? 'current' : '')}">
          <div class="step-circle">${po.status.includes('Received') ? '✓' : '3'}</div>
          <span class="step-label">Goods Receipt</span>
        </div>
        <div class="step-node ${po.threeWayMatched ? 'completed' : ''}">
          <div class="step-circle">${po.threeWayMatched ? '✓' : '4'}</div>
          <span class="step-label">3-Way Match</span>
        </div>
      </div>

      <div>
        <h4 style="font-size: 0.9rem; font-weight: 700; margin-bottom: 8px;">Order Line Items & Receipt Status</h4>
        <table class="line-items-table">
          <thead>
            <tr>
              <th>SKU / Product</th>
              <th style="text-align: center;">Qty Ordered</th>
              <th style="text-align: center;">Received</th>
              <th style="text-align: right;">Unit Cost</th>
              <th style="text-align: right;">Total</th>
            </tr>
          </thead>
          <tbody>
            ${po.items.map(item => `
              <tr>
                <td>
                  <div style="font-weight: 600;">${item.name}</div>
                  <div class="text-mono" style="font-size: 0.75rem; color: var(--text-muted);">${item.sku}</div>
                </td>
                <td style="text-align: center; font-weight: 600;">${item.qty}</td>
                <td style="text-align: center;">
                  <span class="badge ${item.qtyReceived >= item.qty ? 'badge-completed' : (item.qtyReceived > 0 ? 'badge-partial' : 'badge-draft')}">
                    ${item.qtyReceived || 0} / ${item.qty}
                  </span>
                </td>
                <td style="text-align: right;" class="text-mono">${UI.formatCurrency(item.unitCost)}</td>
                <td style="text-align: right; font-weight: 700;" class="text-mono">${UI.formatCurrency(item.lineTotal)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>

      <div class="totals-summary-box">
        <div class="totals-row">
          <span>Subtotal:</span>
          <span class="text-mono">${UI.formatCurrency(po.subtotal)}</span>
        </div>
        <div class="totals-row">
          <span>Tax (8%):</span>
          <span class="text-mono">${UI.formatCurrency(po.tax)}</span>
        </div>
        <div class="totals-row">
          <span>Shipping & Freight:</span>
          <span class="text-mono">${UI.formatCurrency(po.shipping)}</span>
        </div>
        <div class="totals-row grand-total">
          <span>Total PO Value:</span>
          <span class="text-mono text-brand">${UI.formatCurrency(po.totalAmount)}</span>
        </div>
      </div>

      ${po.notes ? `
        <div style="background: var(--bg-surface-elevated); padding: 12px; border-radius: var(--radius-md); font-size: 0.825rem; color: var(--text-secondary);">
          <strong>Procurement Notes:</strong> ${po.notes}
        </div>
      ` : ''}
    `;

    let footerHtml = `
      <button class="btn btn-outline" onclick="UI.closeDrawer();">Close</button>
    `;

    if (po.status === 'Approved' || po.status === 'Partially Received') {
      footerHtml += `
        <button class="btn btn-success" onclick="UI.closeDrawer(); ProcurementModule.openReceiveGoodsModal('${po.id}');">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>
          Receive Inbound Goods (GRN)
        </button>
      `;
    }

    window.UI.openDrawer(`Purchase Order Details: ${po.id}`, bodyHtml, footerHtml);
  },

  // --- NEW PURCHASE ORDER MODAL ---
  openNewPOModal(preselectedSupplierId = null, preselectedProductId = null) {
    const suppliers = window.erpStore.getSuppliers();
    const warehouses = window.erpStore.getWarehouses();
    const products = window.erpStore.getProducts();

    const modalBody = document.getElementById('new-po-modal-body');
    if (!modalBody) return;

    modalBody.innerHTML = `
      <form id="new-po-form" onsubmit="event.preventDefault(); ProcurementModule.submitNewPO();">
        <div class="form-row">
          <div class="form-group">
            <label class="form-label">Vendor / Supplier <span class="req">*</span></label>
            <select class="form-control" id="po-supplier-select" required onchange="ProcurementModule.handleSupplierSelection(this.value)">
              <option value="">-- Choose Approved Supplier --</option>
              ${suppliers.map(s => `
                <option value="${s.id}" ${preselectedSupplierId === s.id ? 'selected' : ''}>${s.name} (${s.paymentTerms})</option>
              `).join('')}
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Destination Warehouse <span class="req">*</span></label>
            <select class="form-control" id="po-warehouse-select" required>
              ${warehouses.map(w => `
                <option value="${w.id}">${w.name}</option>
              `).join('')}
            </select>
          </div>
        </div>

        <div style="margin-top: 14px;">
          <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px;">
            <label class="form-label">Line Items <span class="req">*</span></label>
            <button type="button" class="btn btn-secondary btn-sm" onclick="ProcurementModule.addPOLineItem()">+ Add SKU</button>
          </div>

          <table class="line-items-table" id="po-lines-table">
            <thead>
              <tr>
                <th style="width: 45%;">Item / SKU</th>
                <th style="width: 20%;">Qty</th>
                <th style="width: 20%;">Unit Cost ($)</th>
                <th style="width: 15%; text-align: right;">Action</th>
              </tr>
            </thead>
            <tbody id="po-lines-tbody">
              <!-- Line items injected here -->
            </tbody>
          </table>
        </div>

        <!-- Live Totals Calculation & Governance Alert -->
        <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-top: 16px; flex-wrap: wrap; gap: 12px;">
          <div id="po-governance-alert" style="flex: 1; min-width: 240px; font-size: 0.8rem;"></div>

          <div class="totals-summary-box" style="margin-top: 0;">
            <div class="totals-row">
              <span>Subtotal:</span>
              <span class="text-mono" id="po-calc-subtotal">$0.00</span>
            </div>
            <div class="totals-row">
              <span>Tax (8%):</span>
              <span class="text-mono" id="po-calc-tax">$0.00</span>
            </div>
            <div class="totals-row">
              <span>Freight:</span>
              <span class="text-mono" id="po-calc-shipping">$150.00</span>
            </div>
            <div class="totals-row grand-total">
              <span>Grand Total:</span>
              <span class="text-mono text-brand" id="po-calc-total">$150.00</span>
            </div>
          </div>
        </div>

        <div class="form-group" style="margin-top: 16px;">
          <label class="form-label">Internal Requisition Notes</label>
          <textarea class="form-control" id="po-notes" placeholder="e.g. Q3 automated reorder, rush delivery required..."></textarea>
        </div>
      </form>
    `;

    window.UI.openModal('new-po-modal');
    // Add default line
    this.addPOLineItem(preselectedProductId);
    this.recalculatePOTotals();
  },

  addPOLineItem(preselectedProductId = null) {
    const tbody = document.getElementById('po-lines-tbody');
    if (!tbody) return;

    const products = window.erpStore.getProducts();
    const rowId = 'po-row-' + Date.now() + '-' + Math.floor(Math.random() * 100);

    const tr = document.createElement('tr');
    tr.id = rowId;
    tr.innerHTML = `
      <td>
        <select class="form-control po-item-select" required onchange="ProcurementModule.handlePOLineProductChange('${rowId}', this.value)">
          <option value="">-- Select SKU --</option>
          ${products.map(p => `
            <option value="${p.id}" ${preselectedProductId === p.id ? 'selected' : ''}>
              ${p.sku} - ${p.name}
            </option>
          `).join('')}
        </select>
      </td>
      <td>
        <input type="number" class="form-control po-item-qty" min="1" value="25" required oninput="ProcurementModule.recalculatePOTotals()">
      </td>
      <td>
        <input type="number" class="form-control po-item-cost" min="0.01" step="0.01" value="0.00" required oninput="ProcurementModule.recalculatePOTotals()">
      </td>
      <td style="text-align: right;">
        <button type="button" class="btn btn-outline btn-sm" onclick="this.closest('tr').remove(); ProcurementModule.recalculatePOTotals();" style="color: var(--color-danger);">
          ✕
        </button>
      </td>
    `;

    tbody.appendChild(tr);

    if (preselectedProductId) {
      this.handlePOLineProductChange(rowId, preselectedProductId);
    }
  },

  handlePOLineProductChange(rowId, productId) {
    const row = document.getElementById(rowId);
    if (!row) return;

    const product = window.erpStore.getProduct(productId);
    if (product) {
      const costInput = row.querySelector('.po-item-cost');
      if (costInput) {
        costInput.value = product.unitCost.toFixed(2);
      }
      const qtyInput = row.querySelector('.po-item-qty');
      if (qtyInput && qtyInput.value <= 1) {
        qtyInput.value = product.reorderQty || 50;
      }
    }
    this.recalculatePOTotals();
  },

  handleSupplierSelection(supplierId) {
    // If user picks a supplier, and lines are empty, we could suggest products
    this.recalculatePOTotals();
  },

  recalculatePOTotals() {
    let subtotal = 0;
    const rows = document.querySelectorAll('#po-lines-tbody tr');

    rows.forEach(row => {
      const qty = parseFloat(row.querySelector('.po-item-qty')?.value) || 0;
      const cost = parseFloat(row.querySelector('.po-item-cost')?.value) || 0;
      subtotal += (qty * cost);
    });

    const tax = Math.round(subtotal * 0.08 * 100) / 100;
    const shipping = subtotal > 0 ? (subtotal > 10000 ? 300 : 150) : 0;
    const total = subtotal + tax + shipping;

    const subtotalEl = document.getElementById('po-calc-subtotal');
    const taxEl = document.getElementById('po-calc-tax');
    const shippingEl = document.getElementById('po-calc-shipping');
    const totalEl = document.getElementById('po-calc-total');
    const alertEl = document.getElementById('po-governance-alert');

    if (subtotalEl) subtotalEl.innerText = UI.formatCurrency(subtotal);
    if (taxEl) taxEl.innerText = UI.formatCurrency(tax);
    if (shippingEl) shippingEl.innerText = UI.formatCurrency(shipping);
    if (totalEl) totalEl.innerText = UI.formatCurrency(total);

    if (alertEl) {
      if (total > 5000) {
        alertEl.innerHTML = `
          <div style="background: var(--color-warning-bg); border: 1px solid var(--color-warning-border); padding: 10px 14px; border-radius: var(--radius-md); color: var(--color-warning);">
            <strong>⚠️ Governance Approval Required:</strong> This PO total ($${total.toLocaleString()}) exceeds the $5,000 threshold. It will automatically route to the CFO approval inbox before transmission.
          </div>
        `;
      } else {
        alertEl.innerHTML = `
          <div style="background: var(--color-success-bg); border: 1px solid var(--color-success-border); padding: 10px 14px; border-radius: var(--radius-md); color: var(--color-success);">
            <strong>✓ Instant Clearance:</strong> PO total is within standard delegation of authority (&le; $5,000). Will be approved immediately.
          </div>
        `;
      }
    }
  },

  submitNewPO() {
    const supplierSelect = document.getElementById('po-supplier-select');
    const warehouseSelect = document.getElementById('po-warehouse-select');
    const notesInput = document.getElementById('po-notes');

    const supplierId = supplierSelect.value;
    const warehouseId = warehouseSelect.value;
    const notes = notesInput ? notesInput.value : '';

    const items = [];
    const rows = document.querySelectorAll('#po-lines-tbody tr');
    rows.forEach(row => {
      const productId = row.querySelector('.po-item-select')?.value;
      const qty = parseFloat(row.querySelector('.po-item-qty')?.value);
      const unitCost = parseFloat(row.querySelector('.po-item-cost')?.value);

      if (productId && qty > 0) {
        items.push({ productId, qty, unitCost });
      }
    });

    if (items.length === 0) {
      window.UI.showToast('danger', 'Validation Error', 'Please add at least one valid line item with quantity.');
      return;
    }

    try {
      const newPO = window.erpStore.createPurchaseOrder({
        supplierId,
        targetWarehouseId: warehouseId,
        items,
        notes
      });

      window.UI.closeModal('new-po-modal');

      if (newPO.requiresApproval) {
        window.UI.showToast('warning', 'Purchase Order Queued', `${newPO.id} created ($${newPO.totalAmount.toLocaleString()}). Transferred to Executive Approvals for sign-off.`);
      } else {
        window.UI.showToast('success', 'Purchase Order Approved', `${newPO.id} created and released to vendor.`);
      }

      this.render();
    } catch (e) {
      window.UI.showToast('danger', 'Creation Failed', e.message);
    }
  },

  // --- GOODS RECEIPT INBOUND (GRN) MODAL ---
  openReceiveGoodsModal(poId) {
    const po = window.erpStore.getPurchaseOrder(poId);
    if (!po) return;

    const warehouses = window.erpStore.getWarehouses();
    const modalBody = document.getElementById('receive-goods-modal-body');
    if (!modalBody) return;

    modalBody.innerHTML = `
      <form id="receive-goods-form" onsubmit="event.preventDefault(); ProcurementModule.submitGoodsReceipt('${po.id}');">
        <div style="background: var(--bg-surface-elevated); padding: 14px; border-radius: var(--radius-md); margin-bottom: 16px;">
          <div style="display: flex; justify-content: space-between; font-weight: 700;">
            <span>Inbound PO: <span class="text-mono text-brand">${po.id}</span></span>
            <span>Vendor: ${po.supplierName}</span>
          </div>
          <div style="font-size: 0.8rem; color: var(--text-muted); margin-top: 4px;">
            Target Facility: ${po.targetWarehouseId} · Date: ${po.orderDate}
          </div>
        </div>

        <div class="form-group">
          <label class="form-label">Receiving Facility / Dock <span class="req">*</span></label>
          <select class="form-control" id="grn-warehouse-select">
            ${warehouses.map(w => `
              <option value="${w.id}" ${w.id === po.targetWarehouseId ? 'selected' : ''}>${w.name}</option>
            `).join('')}
          </select>
        </div>

        <div style="margin-top: 14px;">
          <label class="form-label">Verify Physical Quantity Count</label>
          <table class="line-items-table" style="margin-top: 6px;">
            <thead>
              <tr>
                <th>Product SKU</th>
                <th style="text-align: center;">Ordered</th>
                <th style="text-align: center;">Already In</th>
                <th style="width: 140px; text-align: center;">Receiving Now</th>
              </tr>
            </thead>
            <tbody>
              ${po.items.map((item, idx) => {
                const remaining = item.qty - (item.qtyReceived || 0);
                return `
                  <tr data-product-id="${item.productId}">
                    <td>
                      <div style="font-weight: 600;">${item.name}</div>
                      <div class="text-mono" style="font-size: 0.75rem; color: var(--text-muted);">${item.sku}</div>
                    </td>
                    <td style="text-align: center; font-weight: 600;">${item.qty}</td>
                    <td style="text-align: center;">${item.qtyReceived || 0}</td>
                    <td>
                      <input type="number" class="form-control grn-item-qty" min="0" max="${remaining}" value="${remaining}" style="text-align: center; font-weight: 700; color: var(--color-success);" ${remaining <= 0 ? 'disabled' : ''}>
                    </td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        </div>

        <div class="form-group" style="margin-top: 16px;">
          <label class="form-label">Dock Inspection / Batch Notes</label>
          <input type="text" class="form-control" id="grn-notes" placeholder="e.g. Pallet seal verified, no external package damage...">
        </div>
      </form>
    `;

    window.UI.openModal('receive-goods-modal');
  },

  submitGoodsReceipt(poId) {
    const warehouseSelect = document.getElementById('grn-warehouse-select');
    const notesInput = document.getElementById('grn-notes');

    const warehouseId = warehouseSelect ? warehouseSelect.value : 'WH-MAIN';
    const notes = notesInput ? notesInput.value : '';

    const itemsToReceive = [];
    const rows = document.querySelectorAll('#receive-goods-modal-body tbody tr');

    rows.forEach(tr => {
      const productId = tr.getAttribute('data-product-id');
      const input = tr.querySelector('.grn-item-qty');
      const qty = input ? parseFloat(input.value) : 0;
      if (productId && qty > 0) {
        itemsToReceive.push({ productId, qty });
      }
    });

    if (itemsToReceive.length === 0) {
      window.UI.showToast('warning', 'Zero Items', 'No quantity specified for receiving.');
      return;
    }

    try {
      const updatedPO = window.erpStore.receiveGoods({
        poId,
        itemsToReceive,
        warehouseId,
        notes
      });

      window.UI.closeModal('receive-goods-modal');
      window.UI.showToast('success', 'Goods Receipt Posted!', `Items from ${poId} placed into ${warehouseId} inventory. Real-time stock counts updated.`);
      this.render();
    } catch (e) {
      window.UI.showToast('danger', 'Receipt Failed', e.message);
    }
  }
};

window.ProcurementModule = ProcurementModule;
