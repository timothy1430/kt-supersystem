/* ==========================================================================
   KT-SUPERSYSTEM ERP - CENTRAL STATE STORE
   Reactive Operational Engine, Cross-Module Logic & LocalStorage Persistence
   ========================================================================== */

class ERPStore {
  constructor() {
    this.STORAGE_KEY = 'KT_ERP_STATE_V1';
    this.listeners = [];
    this.currentRole = 'CFO / Finance Director';
    this.currentUser = 'Jonathan Sterling';
    this.init();
  }

  init() {
    const saved = localStorage.getItem(this.STORAGE_KEY);
    if (saved) {
      try {
        this.data = JSON.parse(saved);
        // Ensure all top-level arrays exist
        if (!this.data.products || !this.data.purchaseOrders || !this.data.salesOrders) {
          throw new Error('Incomplete local storage data');
        }
      } catch (e) {
        console.warn('Failed to parse saved ERP state. Resetting to initial seed data.', e);
        this.resetToDemoData(false);
      }
    } else {
      this.resetToDemoData(false);
    }
  }

  resetToDemoData(notify = true) {
    this.data = JSON.parse(JSON.stringify(INITIAL_ERP_DATA));
    this.save();
    if (notify) {
      this.emit('STATE_RESET', { message: 'ERP database reset to baseline demo records.' });
    }
  }

  save() {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.data));
    } catch (e) {
      console.error('Storage quota exceeded or storage disabled', e);
    }
  }

  subscribe(listener) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  emit(event, payload = {}) {
    this.save();
    this.listeners.forEach(fn => {
      try {
        fn(event, payload);
      } catch (err) {
        console.error('Listener execution error:', err);
      }
    });
  }

  setRole(newRole) {
    this.currentRole = newRole;
    this.emit('ROLE_CHANGED', { role: newRole });
  }

  // --- GETTERS ---
  getProducts() { return this.data.products || []; }
  getProduct(id) { return this.data.products.find(p => p.id === id || p.sku === id); }
  getSuppliers() { return this.data.suppliers || []; }
  getSupplier(id) { return this.data.suppliers.find(s => s.id === id); }
  getCustomers() { return this.data.customers || []; }
  getCustomer(id) { return this.data.customers.find(c => c.id === id); }
  getWarehouses() { return this.data.warehouses || []; }
  getWarehouse(id) { return this.data.warehouses.find(w => w.id === id); }
  getPurchaseOrders() { return this.data.purchaseOrders || []; }
  getPurchaseOrder(id) { return this.data.purchaseOrders.find(p => p.id === id); }
  getSalesOrders() { return this.data.salesOrders || []; }
  getSalesOrder(id) { return this.data.salesOrders.find(s => s.id === id); }
  getApprovals() { return this.data.approvals || []; }
  getStockMovements() { return this.data.stockMovements || []; }

  // --- PROCUREMENT BUSINESS LOGIC ---
  createPurchaseOrder({ supplierId, targetWarehouseId, items, notes, paymentTerms = 'Net 30' }) {
    const supplier = this.getSupplier(supplierId);
    if (!supplier) throw new Error('Invalid supplier selected.');

    let subtotal = 0;
    const poItems = items.map(item => {
      const product = this.getProduct(item.productId);
      const unitCost = Number(item.unitCost || product.unitCost);
      const qty = Number(item.qty);
      const lineTotal = unitCost * qty;
      subtotal += lineTotal;
      return {
        productId: product.id,
        sku: product.sku,
        name: product.name,
        qty: qty,
        unitCost: unitCost,
        lineTotal: lineTotal,
        qtyReceived: 0
      };
    });

    const tax = Math.round(subtotal * 0.08 * 100) / 100;
    const shipping = subtotal > 10000 ? 300 : 150;
    const totalAmount = Math.round((subtotal + tax + shipping) * 100) / 100;

    const poId = `PO-2026-${String(this.data.purchaseOrders.length + 1).padStart(3, '0')}`;
    const today = new Date().toISOString().split('T')[0];
    const expDate = new Date(Date.now() + (supplier.avgLeadTimeDays || 7) * 86400000).toISOString().split('T')[0];

    const requiresApproval = totalAmount > 5000;
    const newPO = {
      id: poId,
      supplierId: supplier.id,
      supplierName: supplier.name,
      targetWarehouseId: targetWarehouseId || 'WH-MAIN',
      orderDate: today,
      expectedDate: expDate,
      status: requiresApproval ? 'Pending Approval' : 'Approved',
      requiresApproval: requiresApproval,
      approvalStatus: requiresApproval ? 'Pending' : 'Approved',
      approvedBy: requiresApproval ? null : `${this.currentUser} (${this.currentRole})`,
      approvedAt: requiresApproval ? null : today,
      paymentTerms: paymentTerms,
      items: poItems,
      subtotal: subtotal,
      tax: tax,
      shipping: shipping,
      totalAmount: totalAmount,
      threeWayMatched: false,
      notes: notes || 'Standard procurement order.'
    };

    this.data.purchaseOrders.unshift(newPO);

    // Update on-order stock tally
    poItems.forEach(item => {
      const prd = this.getProduct(item.productId);
      if (prd) {
        prd.onOrderStock = (prd.onOrderStock || 0) + item.qty;
      }
    });

    // Auto-create approval item if threshold exceeded
    if (requiresApproval) {
      const approvalId = `APR-2026-${String(this.data.approvals.length + 1).padStart(2, '0')}`;
      this.data.approvals.unshift({
        id: approvalId,
        category: 'Procurement',
        targetId: poId,
        targetRef: `${poId} (${supplier.name})`,
        amount: totalAmount,
        requester: `${this.currentUser} (Procurement)`,
        requiredRole: 'CFO / Finance Director',
        reason: `PO value ($${totalAmount.toLocaleString()}) exceeds the corporate governance limit of $5,000.00.`,
        status: 'Pending',
        submittedAt: new Date().toLocaleString(),
        decidedAt: null,
        decidedBy: null,
        comments: ''
      });
    }

    this.emit('PO_CREATED', { po: newPO, requiresApproval });
    return newPO;
  }

  receiveGoods({ poId, itemsToReceive, warehouseId, notes }) {
    const po = this.getPurchaseOrder(poId);
    if (!po) throw new Error('Purchase Order not found.');
    if (po.status === 'Pending Approval') {
      throw new Error('Cannot receive items for a PO that is still pending approval!');
    }

    const whId = warehouseId || po.targetWarehouseId || 'WH-MAIN';
    let allFullyReceived = true;
    const now = new Date().toLocaleString();

    itemsToReceive.forEach(received => {
      const poItem = po.items.find(i => i.productId === received.productId);
      if (!poItem) return;

      const qty = Number(received.qty);
      if (qty <= 0) return;

      poItem.qtyReceived = (poItem.qtyReceived || 0) + qty;
      if (poItem.qtyReceived < poItem.qty) {
        allFullyReceived = false;
      }

      // Update product inventory in warehouse
      const product = this.getProduct(poItem.productId);
      if (product) {
        product.stockByWarehouse[whId] = (product.stockByWarehouse[whId] || 0) + qty;
        product.totalStock = Object.values(product.stockByWarehouse).reduce((a, b) => a + b, 0);
        product.onOrderStock = Math.max(0, (product.onOrderStock || 0) - qty);

        // Record stock movement
        const movId = `MOV-2026-${String(this.data.stockMovements.length + 1).padStart(3, '0')}`;
        this.data.stockMovements.unshift({
          id: movId,
          timestamp: now,
          type: 'Goods Receipt (PO)',
          referenceId: po.id,
          productId: product.id,
          sku: product.sku,
          productName: product.name,
          warehouseId: whId,
          qtyChange: +qty,
          balanceAfter: product.totalStock,
          operator: `${this.currentUser} (${this.currentRole})`,
          notes: notes || `Received against ${po.id}`
        });
      }
    });

    if (allFullyReceived) {
      po.status = 'Fully Received';
      po.threeWayMatched = true; // Match complete
    } else {
      po.status = 'Partially Received';
    }

    this.emit('GOODS_RECEIVED', { po, warehouseId: whId });
    return po;
  }

  // --- SALES ORDERS BUSINESS LOGIC ---
  createSalesOrder({ customerId, sourceWarehouseId, items, discountPct = 0, paymentTerms = 'Net 30' }) {
    const customer = this.getCustomer(customerId);
    if (!customer) throw new Error('Invalid customer selected.');

    const whId = sourceWarehouseId || 'WH-MAIN';
    let subtotal = 0;

    // Check stock availability
    for (const item of items) {
      const prd = this.getProduct(item.productId);
      const whStock = (prd.stockByWarehouse && prd.stockByWarehouse[whId]) || 0;
      const available = prd.totalStock - (prd.reservedStock || 0);
      if (available < item.qty) {
        throw new Error(`Insufficient available stock for ${prd.name}. Available: ${available}, Requested: ${item.qty}`);
      }
    }

    const soItems = items.map(item => {
      const prd = this.getProduct(item.productId);
      const unitPrice = Number(item.unitPrice || prd.sellingPrice);
      const qty = Number(item.qty);
      const lineTotal = unitPrice * qty;
      subtotal += lineTotal;
      return {
        productId: prd.id,
        sku: prd.sku,
        name: prd.name,
        qty: qty,
        unitPrice: unitPrice,
        lineTotal: lineTotal
      };
    });

    const discountAmount = Math.round(subtotal * (discountPct / 100) * 100) / 100;
    const discountedTotal = subtotal - discountAmount;
    const tax = Math.round(discountedTotal * 0.08 * 100) / 100;
    const shipping = 180.00;
    const totalAmount = Math.round((discountedTotal + tax + shipping) * 100) / 100;

    // Approval rules:
    // 1. Discount > 15% requires Sales Director approval
    // 2. Total order brings customer over credit limit requires CFO approval
    const exceedsCredit = (customer.outstandingBalance + totalAmount) > customer.creditLimit;
    const highDiscount = discountPct > 15;
    const requiresApproval = highDiscount || exceedsCredit;

    const soId = `SO-2026-${String(this.data.salesOrders.length + 101)}`;
    const today = new Date().toISOString().split('T')[0];

    const newSO = {
      id: soId,
      customerId: customer.id,
      customerName: customer.name,
      sourceWarehouseId: whId,
      orderDate: today,
      status: requiresApproval ? 'Pending Approval' : 'Confirmed - Stock Reserved',
      paymentTerms: paymentTerms,
      requiresApproval: requiresApproval,
      approvalType: highDiscount ? 'Sales Discount > 15%' : (exceedsCredit ? 'Credit Limit Override' : null),
      approvalStatus: requiresApproval ? 'Pending' : 'Approved',
      items: soItems,
      subtotal: subtotal,
      discountPct: discountPct,
      discountAmount: discountAmount,
      tax: tax,
      shipping: shipping,
      totalAmount: totalAmount,
      trackingNumber: null,
      invoiceNumber: null,
      invoiceStatus: requiresApproval ? 'Blocked by Approval' : 'Pending Dispatch'
    };

    this.data.salesOrders.unshift(newSO);

    // Reserve stock immediately
    soItems.forEach(item => {
      const prd = this.getProduct(item.productId);
      if (prd) {
        prd.reservedStock = (prd.reservedStock || 0) + item.qty;
      }
    });

    if (requiresApproval) {
      const approvalId = `APR-2026-${String(this.data.approvals.length + 1).padStart(2, '0')}`;
      this.data.approvals.unshift({
        id: approvalId,
        category: highDiscount ? 'Sales Discount' : 'Credit Limit',
        targetId: soId,
        targetRef: `${soId} (${customer.name})`,
        amount: totalAmount,
        requester: `${this.currentUser} (Sales Lead)`,
        requiredRole: highDiscount ? 'Sales Director' : 'CFO / Finance Director',
        reason: highDiscount 
          ? `Discretionary discount of ${discountPct}% requested (Threshold is 15%).`
          : `Order value ($${totalAmount.toLocaleString()}) pushes balance ($${(customer.outstandingBalance + totalAmount).toLocaleString()}) beyond limit of $${customer.creditLimit.toLocaleString()}.`,
        status: 'Pending',
        submittedAt: new Date().toLocaleString(),
        decidedAt: null,
        decidedBy: null,
        comments: ''
      });
    }

    this.emit('SO_CREATED', { so: newSO, requiresApproval });
    return newSO;
  }

  dispatchSalesOrder(soId, trackingNum) {
    const so = this.getSalesOrder(soId);
    if (!so) throw new Error('Sales order not found.');
    if (so.status === 'Pending Approval') {
      throw new Error('Cannot dispatch an order that is pending executive approval!');
    }
    if (so.status === 'Dispatched & Invoiced') {
      throw new Error('This order has already been fulfilled and invoiced.');
    }

    const whId = so.sourceWarehouseId || 'WH-MAIN';
    const now = new Date().toLocaleString();

    // Deduct stock and release reservations
    so.items.forEach(item => {
      const product = this.getProduct(item.productId);
      if (product) {
        product.reservedStock = Math.max(0, (product.reservedStock || 0) - item.qty);
        product.stockByWarehouse[whId] = Math.max(0, (product.stockByWarehouse[whId] || 0) - item.qty);
        product.totalStock = Object.values(product.stockByWarehouse).reduce((a, b) => a + b, 0);

        // Record stock movement
        const movId = `MOV-2026-${String(this.data.stockMovements.length + 1).padStart(3, '0')}`;
        this.data.stockMovements.unshift({
          id: movId,
          timestamp: now,
          type: 'Sales Fulfillment',
          referenceId: so.id,
          productId: product.id,
          sku: product.sku,
          productName: product.name,
          warehouseId: whId,
          qtyChange: -item.qty,
          balanceAfter: product.totalStock,
          operator: `${this.currentUser} (${this.currentRole})`,
          notes: `Fulfillment dispatch for ${so.customerName}`
        });
      }
    });

    // Update customer financials
    const customer = this.getCustomer(so.customerId);
    if (customer) {
      customer.outstandingBalance = (customer.outstandingBalance || 0) + so.totalAmount;
      customer.lifetimeRevenue = (customer.lifetimeRevenue || 0) + so.totalAmount;
      customer.totalOrdersCount = (customer.totalOrdersCount || 0) + 1;
    }

    so.status = 'Dispatched & Invoiced';
    so.trackingNumber = trackingNum || `TRK-EXP-${Math.floor(1000000 + Math.random() * 9000000)}`;
    so.invoiceNumber = `INV-2026-${String(Math.floor(100 + Math.random() * 900))}`;
    so.invoiceStatus = 'Issued';

    this.emit('SO_DISPATCHED', { so });
    return so;
  }

  // --- WAREHOUSE & INVENTORY LOGIC ---
  transferStock({ productId, sourceWarehouseId, targetWarehouseId, qty }) {
    if (sourceWarehouseId === targetWarehouseId) {
      throw new Error('Source and destination warehouse cannot be the same.');
    }
    const prd = this.getProduct(productId);
    if (!prd) throw new Error('Product not found.');

    const available = (prd.stockByWarehouse[sourceWarehouseId] || 0);
    if (available < qty) {
      throw new Error(`Insufficient stock in ${sourceWarehouseId}. Available: ${available}`);
    }

    prd.stockByWarehouse[sourceWarehouseId] -= qty;
    prd.stockByWarehouse[targetWarehouseId] = (prd.stockByWarehouse[targetWarehouseId] || 0) + qty;
    prd.totalStock = Object.values(prd.stockByWarehouse).reduce((a, b) => a + b, 0);

    const movId = `MOV-2026-${String(this.data.stockMovements.length + 1).padStart(3, '0')}`;
    this.data.stockMovements.unshift({
      id: movId,
      timestamp: new Date().toLocaleString(),
      type: 'Inter-Warehouse Transfer',
      referenceId: `XFER-${Date.now().toString().slice(-4)}`,
      productId: prd.id,
      sku: prd.sku,
      productName: prd.name,
      warehouseId: `${sourceWarehouseId} -> ${targetWarehouseId}`,
      qtyChange: qty,
      balanceAfter: prd.totalStock,
      operator: `${this.currentUser} (${this.currentRole})`,
      notes: `Warehouse balancing transfer`
    });

    this.emit('STOCK_TRANSFERRED', { product: prd, source: sourceWarehouseId, target: targetWarehouseId, qty });
    return prd;
  }

  adjustStock({ productId, warehouseId, newQty, reason }) {
    const prd = this.getProduct(productId);
    if (!prd) throw new Error('Product not found.');

    const currentWhQty = prd.stockByWarehouse[warehouseId] || 0;
    const delta = newQty - currentWhQty;

    prd.stockByWarehouse[warehouseId] = newQty;
    prd.totalStock = Object.values(prd.stockByWarehouse).reduce((a, b) => a + b, 0);

    const movId = `MOV-2026-${String(this.data.stockMovements.length + 1).padStart(3, '0')}`;
    this.data.stockMovements.unshift({
      id: movId,
      timestamp: new Date().toLocaleString(),
      type: 'Physical Stock Adjustment',
      referenceId: `ADJ-${Date.now().toString().slice(-4)}`,
      productId: prd.id,
      sku: prd.sku,
      productName: prd.name,
      warehouseId: warehouseId,
      qtyChange: delta,
      balanceAfter: prd.totalStock,
      operator: `${this.currentUser} (${this.currentRole})`,
      notes: reason || 'Routine inventory audit reconciliation'
    });

    this.emit('STOCK_ADJUSTED', { product: prd, warehouseId, delta, newQty });
    return prd;
  }

  reorderLowStock(productId) {
    const prd = this.getProduct(productId);
    if (!prd) throw new Error('Product not found.');

    const supplierId = prd.preferredSupplierId || (this.data.suppliers[0] && this.data.suppliers[0].id);
    const qty = prd.reorderQty || 100;

    return this.createPurchaseOrder({
      supplierId: supplierId,
      targetWarehouseId: 'WH-MAIN',
      items: [{ productId: prd.id, qty: qty, unitCost: prd.unitCost }],
      notes: `Auto-generated reorder for low stock threshold replenishment (${prd.sku}).`
    });
  }

  // --- APPROVALS ENGINE ---
  processApproval(approvalId, decision, comments = '') {
    const approval = this.data.approvals.find(a => a.id === approvalId);
    if (!approval) throw new Error('Approval request not found.');

    approval.status = decision; // 'Approved' or 'Rejected'
    approval.decidedAt = new Date().toLocaleString();
    approval.decidedBy = `${this.currentUser} (${this.currentRole})`;
    approval.comments = comments;

    // Cross-module state reflection
    if (approval.category === 'Procurement') {
      const po = this.getPurchaseOrder(approval.targetId);
      if (po) {
        po.approvalStatus = decision;
        po.status = decision === 'Approved' ? 'Approved' : 'Rejected';
        po.approvedBy = approval.decidedBy;
        po.approvedAt = approval.decidedAt;
      }
    } else if (approval.category === 'Sales Discount' || approval.category === 'Credit Limit') {
      const so = this.getSalesOrder(approval.targetId);
      if (so) {
        so.approvalStatus = decision;
        so.status = decision === 'Approved' ? 'Confirmed - Stock Reserved' : 'Rejected / Cancelled';
        so.invoiceStatus = decision === 'Approved' ? 'Pending Dispatch' : 'Cancelled';

        // If rejected, release reserved stock
        if (decision === 'Rejected') {
          so.items.forEach(item => {
            const prd = this.getProduct(item.productId);
            if (prd) {
              prd.reservedStock = Math.max(0, (prd.reservedStock || 0) - item.qty);
            }
          });
        }
      }
    }

    this.emit('APPROVAL_PROCESSED', { approval, decision });
    return approval;
  }

  // --- EXECUTIVE REPORTING & METRICS ENGINE ---
  getExecutiveMetrics() {
    const products = this.getProducts();
    const salesOrders = this.getSalesOrders();
    const purchaseOrders = this.getPurchaseOrders();
    const approvals = this.getApprovals();
    const suppliers = this.getSuppliers();

    // 1. Total Inventory Valuation
    const totalInventoryValuation = products.reduce((sum, p) => sum + (p.totalStock * p.unitCost), 0);
    const totalPotentialRetailVal = products.reduce((sum, p) => sum + (p.totalStock * p.sellingPrice), 0);

    // 2. Revenue from dispatched/invoiced sales
    const revenueDispatched = salesOrders
      .filter(s => s.status === 'Dispatched & Invoiced')
      .reduce((sum, s) => sum + s.totalAmount, 0);

    // 3. Total Procurement Spend
    const totalProcurementSpend = purchaseOrders
      .filter(p => p.status === 'Fully Received' || p.status === 'Approved' || p.status === 'Partially Received')
      .reduce((sum, p) => sum + p.totalAmount, 0);

    // 4. Gross Margin % calculation
    // Calculate cost of goods sold for fulfilled orders
    let cogs = 0;
    salesOrders.filter(s => s.status === 'Dispatched & Invoiced').forEach(so => {
      so.items.forEach(item => {
        const prd = this.getProduct(item.productId);
        if (prd) cogs += (prd.unitCost * item.qty);
      });
    });
    const grossProfit = revenueDispatched - cogs;
    const grossMarginPct = revenueDispatched > 0 ? ((grossProfit / revenueDispatched) * 100).toFixed(1) : '48.5';

    // 5. Pending approvals count & total value
    const pendingApprovals = approvals.filter(a => a.status === 'Pending');
    const pendingApprovalsCount = pendingApprovals.length;
    const pendingApprovalsValue = pendingApprovals.reduce((sum, a) => sum + a.amount, 0);

    // 6. Stock health stats
    const lowStockItems = products.filter(p => p.totalStock <= p.minStock);
    const criticalStockItems = products.filter(p => p.totalStock < (p.minStock * 0.4));

    // 7. Supplier OTIF average
    const avgOTIF = suppliers.length 
      ? (suppliers.reduce((sum, s) => sum + s.onTimeDeliveryPct, 0) / suppliers.length).toFixed(1)
      : '97.2';

    // 8. Valuation by Category
    const categoryValuation = {};
    products.forEach(p => {
      const val = p.totalStock * p.unitCost;
      categoryValuation[p.category] = (categoryValuation[p.category] || 0) + val;
    });

    return {
      totalInventoryValuation,
      totalPotentialRetailVal,
      revenueDispatched,
      totalProcurementSpend,
      grossProfit,
      grossMarginPct,
      pendingApprovalsCount,
      pendingApprovalsValue,
      lowStockCount: lowStockItems.length,
      criticalStockCount: criticalStockItems.length,
      avgOTIF,
      categoryValuation,
      totalSKUs: products.length,
      totalOpenSalesOrders: salesOrders.filter(s => s.status.includes('Confirmed') || s.status.includes('Reserved')).length
    };
  }
}

// Instantiate global store
window.erpStore = new ERPStore();
