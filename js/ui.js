/* ==========================================================================
   KT-SUPERSYSTEM ERP - UI CONTROLLER
   Modals, Slide-over Inspector, Toasts, Omni-Search & Theme Manager
   ========================================================================== */

const UI = {
  init() {
    this.setupTheme();
    this.setupKeyboardShortcuts();
    this.setupModalClosers();
    this.setupDrawerClosers();
  },

  // --- THEME MANAGEMENT ---
  setupTheme() {
    const savedTheme = localStorage.getItem('KT_ERP_THEME') || 'dark';
    document.documentElement.setAttribute('data-theme', savedTheme);
    this.updateThemeButton(savedTheme);
  },

  toggleTheme() {
    const current = document.documentElement.getAttribute('data-theme') || 'dark';
    const next = current === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    localStorage.setItem('KT_ERP_THEME', next);
    this.updateThemeButton(next);
    // Re-render charts to update colors
    window.erpStore.emit('THEME_CHANGED', { theme: next });
  },

  updateThemeButton(theme) {
    const btn = document.getElementById('theme-toggle-btn');
    if (!btn) return;
    btn.innerHTML = theme === 'dark' 
      ? `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="5"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg>`
      : `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>`;
    btn.setAttribute('title', `Switch to ${theme === 'dark' ? 'Light' : 'Dark'} mode`);
  },

  // --- TOAST NOTIFICATIONS ---
  showToast(type, title, desc, duration = 4000) {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;

    let iconSvg = '';
    if (type === 'success') {
      iconSvg = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--color-success)" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>`;
    } else if (type === 'warning') {
      iconSvg = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--color-warning)" stroke-width="2.5"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>`;
    } else if (type === 'danger') {
      iconSvg = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--color-danger)" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>`;
    } else {
      iconSvg = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--color-info)" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>`;
    }

    toast.innerHTML = `
      <div style="flex-shrink: 0; display: flex; align-items: center;">${iconSvg}</div>
      <div class="toast-content">
        <div class="toast-title">${title}</div>
        ${desc ? `<div class="toast-desc">${desc}</div>` : ''}
      </div>
      <button class="icon-button" style="width: 24px; height: 24px; border: none;" onclick="this.parentElement.remove()">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
      </button>
    `;

    container.appendChild(toast);

    setTimeout(() => {
      if (toast.parentElement) {
        toast.style.opacity = '0';
        toast.style.transform = 'translateX(20px)';
        toast.style.transition = 'all 0.25s ease';
        setTimeout(() => toast.remove(), 250);
      }
    }, duration);
  },

  // --- UNIVERSAL MODAL SYSTEM ---
  openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
      modal.classList.add('open');
      const firstInput = modal.querySelector('input:not([type="hidden"]), select, textarea');
      if (firstInput) setTimeout(() => firstInput.focus(), 100);
    }
  },

  closeModal(modalId) {
    if (modalId) {
      const modal = document.getElementById(modalId);
      if (modal) modal.classList.remove('open');
    } else {
      document.querySelectorAll('.modal-overlay.open').forEach(m => m.classList.remove('open'));
    }
  },

  setupModalClosers() {
    document.addEventListener('click', (e) => {
      if (e.target.classList.contains('modal-overlay')) {
        UI.closeModal();
      }
    });
  },

  // --- SLIDE-OVER INSPECTOR DRAWER ---
  openDrawer(title, bodyHtml, footerHtml = '') {
    const overlay = document.getElementById('inspector-drawer-overlay');
    const titleEl = document.getElementById('inspector-drawer-title');
    const bodyEl = document.getElementById('inspector-drawer-body');
    const footerEl = document.getElementById('inspector-drawer-footer');

    if (!overlay || !bodyEl) return;

    if (titleEl) titleEl.innerText = title;
    bodyEl.innerHTML = bodyHtml;

    if (footerEl) {
      if (footerHtml) {
        footerEl.innerHTML = footerHtml;
        footerEl.classList.remove('hidden');
      } else {
        footerEl.classList.add('hidden');
      }
    }

    overlay.classList.add('open');
  },

  closeDrawer() {
    const overlay = document.getElementById('inspector-drawer-overlay');
    if (overlay) overlay.classList.remove('open');
  },

  setupDrawerClosers() {
    document.addEventListener('click', (e) => {
      if (e.target.classList.contains('drawer-overlay')) {
        UI.closeDrawer();
      }
    });
  },

  // --- OMNI SEARCH DIALOG ---
  setupKeyboardShortcuts() {
    document.addEventListener('keydown', (e) => {
      // Ctrl+K or / opens omni-search
      if ((e.ctrlKey && e.key === 'k') || (e.key === '/' && !['INPUT', 'TEXTAREA', 'SELECT'].includes(e.target.tagName))) {
        e.preventDefault();
        UI.openOmniSearch();
      }
      // Esc closes modals and drawer
      if (e.key === 'Escape') {
        UI.closeModal();
        UI.closeDrawer();
      }
    });
  },

  openOmniSearch() {
    UI.openModal('omni-search-modal');
    const input = document.getElementById('omni-search-input');
    if (input) {
      input.value = '';
      input.focus();
      this.handleOmniSearchQuery('');
    }
  },

  handleOmniSearchQuery(query) {
    const resultsContainer = document.getElementById('omni-search-results');
    if (!resultsContainer) return;

    const q = (query || '').toLowerCase().trim();
    const products = window.erpStore.getProducts();
    const pos = window.erpStore.getPurchaseOrders();
    const sos = window.erpStore.getSalesOrders();
    const suppliers = window.erpStore.getSuppliers();
    const customers = window.erpStore.getCustomers();

    let html = '';

    // Filter across records
    const matchedProducts = products.filter(p => p.sku.toLowerCase().includes(q) || p.name.toLowerCase().includes(q) || p.category.toLowerCase().includes(q)).slice(0, 4);
    const matchedPOs = pos.filter(p => p.id.toLowerCase().includes(q) || p.supplierName.toLowerCase().includes(q)).slice(0, 3);
    const matchedSOs = sos.filter(s => s.id.toLowerCase().includes(q) || s.customerName.toLowerCase().includes(q)).slice(0, 3);
    const matchedVendors = suppliers.filter(s => s.name.toLowerCase().includes(q) || s.code.toLowerCase().includes(q)).slice(0, 3);
    const matchedClients = customers.filter(c => c.name.toLowerCase().includes(q) || c.code.toLowerCase().includes(q)).slice(0, 3);

    const hasResults = matchedProducts.length || matchedPOs.length || matchedSOs.length || matchedVendors.length || matchedClients.length;

    if (!hasResults) {
      resultsContainer.innerHTML = `<div style="text-align: center; padding: 30px; color: var(--text-muted); font-size: 0.875rem;">No records matching "${query}"</div>`;
      return;
    }

    if (matchedProducts.length) {
      html += `<div style="font-size: 0.725rem; font-weight: 700; color: var(--text-muted); text-transform: uppercase; margin-bottom: 6px;">Inventory SKUs</div>`;
      matchedProducts.forEach(p => {
        html += `
          <div class="search-result-row" onclick="window.appRouter.navigate('inventory'); UI.closeModal(); setTimeout(() => window.InventoryModule.inspectProduct('${p.id}'), 100);" style="display: flex; align-items: center; justify-content: space-between; padding: 10px 12px; border-radius: var(--radius-md); background: var(--bg-surface-elevated); margin-bottom: 6px; cursor: pointer;">
            <div>
              <div style="font-weight: 600; font-size: 0.875rem;">${p.name}</div>
              <div style="font-size: 0.75rem; color: var(--text-muted); font-family: var(--font-mono);">${p.sku} · ${p.category} · Bin: ${p.binLocation}</div>
            </div>
            <div style="text-align: right;">
              <div style="font-weight: 700; font-size: 0.875rem;">${p.totalStock} in stock</div>
              <div style="font-size: 0.75rem; color: var(--color-success); font-weight: 600;">$${p.sellingPrice.toFixed(2)}</div>
            </div>
          </div>
        `;
      });
    }

    if (matchedPOs.length) {
      html += `<div style="font-size: 0.725rem; font-weight: 700; color: var(--text-muted); text-transform: uppercase; margin: 12px 0 6px 0;">Purchase Orders</div>`;
      matchedPOs.forEach(p => {
        html += `
          <div class="search-result-row" onclick="window.appRouter.navigate('procurement'); UI.closeModal(); setTimeout(() => window.ProcurementModule.inspectPO('${p.id}'), 100);" style="display: flex; align-items: center; justify-content: space-between; padding: 10px 12px; border-radius: var(--radius-md); background: var(--bg-surface-elevated); margin-bottom: 6px; cursor: pointer;">
            <div>
              <div style="font-weight: 600; font-size: 0.875rem;">${p.id} · ${p.supplierName}</div>
              <div style="font-size: 0.75rem; color: var(--text-muted);">${p.items.length} items · Expected: ${p.expectedDate}</div>
            </div>
            <div>
              ${UI.getStatusBadge(p.status)}
            </div>
          </div>
        `;
      });
    }

    if (matchedSOs.length) {
      html += `<div style="font-size: 0.725rem; font-weight: 700; color: var(--text-muted); text-transform: uppercase; margin: 12px 0 6px 0;">Sales Orders</div>`;
      matchedSOs.forEach(s => {
        html += `
          <div class="search-result-row" onclick="window.appRouter.navigate('sales'); UI.closeModal(); setTimeout(() => window.SalesModule.inspectSO('${s.id}'), 100);" style="display: flex; align-items: center; justify-content: space-between; padding: 10px 12px; border-radius: var(--radius-md); background: var(--bg-surface-elevated); margin-bottom: 6px; cursor: pointer;">
            <div>
              <div style="font-weight: 600; font-size: 0.875rem;">${s.id} · ${s.customerName}</div>
              <div style="font-size: 0.75rem; color: var(--text-muted);">$${s.totalAmount.toLocaleString()} · ${s.items.length} items</div>
            </div>
            <div>
              ${UI.getStatusBadge(s.status)}
            </div>
          </div>
        `;
      });
    }

    resultsContainer.innerHTML = html;
  },

  // --- HELPERS ---
  formatCurrency(amount) {
    const num = Number(amount || 0);
    return '$' + num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  },

  formatCompactCurrency(amount) {
    const num = Number(amount || 0);
    if (num >= 1000000) return '$' + (num / 1000000).toFixed(2) + 'M';
    if (num >= 1000) return '$' + (num / 1000).toFixed(1) + 'k';
    return '$' + num.toFixed(0);
  },

  getStatusBadge(status) {
    const s = String(status || '').toLowerCase();
    let badgeClass = 'badge-draft';

    if (s.includes('pending') || s.includes('blocked') || s.includes('warning')) badgeClass = 'badge-pending';
    else if (s.includes('approved') || s.includes('confirmed') || s.includes('good')) badgeClass = 'badge-approved';
    else if (s.includes('received') || s.includes('invoiced') || s.includes('fulfilled') || s.includes('dispatched') || s.includes('optimal')) badgeClass = 'badge-completed';
    else if (s.includes('partial')) badgeClass = 'badge-partial';
    else if (s.includes('rejected') || s.includes('cancelled') || s.includes('critical') || s.includes('overdue')) badgeClass = 'badge-rejected';

    return `<span class="badge ${badgeClass}"><span class="badge-dot"></span>${status}</span>`;
  }
};

window.UI = UI;
