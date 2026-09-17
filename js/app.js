/* ==========================================================================
   KT-SUPERSYSTEM ERP - APP ROUTER & BOOTSTRAPPER
   View Transitions, Global Event Bus, Reactive Subscriptions & Shortcuts
   ========================================================================== */

class AppRouter {
  constructor() {
    this.currentView = 'dashboard';
    this.modules = {
      dashboard: window.DashboardModule,
      procurement: window.ProcurementModule,
      inventory: window.InventoryModule,
      sales: window.SalesModule,
      suppliers: window.SuppliersModule,
      customers: window.CustomersModule,
      approvals: window.ApprovalsModule
    };
  }

  init() {
    // Check URL hash for initial route
    const hash = window.location.hash.replace('#', '');
    if (this.modules[hash]) {
      this.currentView = hash;
    }

    this.setupNavClicks();
    this.setupRoleSwitcher();
    this.subscribeToStore();
    this.navigate(this.currentView, false);
    this.updateBadges();
  }

  setupNavClicks() {
    document.querySelectorAll('.nav-item[data-view]').forEach(item => {
      item.addEventListener('click', (e) => {
        e.preventDefault();
        const view = item.getAttribute('data-view');
        this.navigate(view);
      });
    });
  }

  setupRoleSwitcher() {
    const select = document.getElementById('header-role-select');
    if (!select) return;

    select.value = window.erpStore.currentRole;
    select.addEventListener('change', (e) => {
      const newRole = e.target.value;
      window.erpStore.setRole(newRole);
      window.UI.showToast('info', 'Sign-Off Authority Switched', `Active perspective set to ${newRole}.`);
      this.navigate(this.currentView, false);
    });
  }

  navigate(viewName, updateHistory = true) {
    if (!this.modules[viewName]) viewName = 'dashboard';
    this.currentView = viewName;

    // Update active class on nav items
    document.querySelectorAll('.nav-item').forEach(el => {
      if (el.getAttribute('data-view') === viewName) {
        el.classList.add('active');
      } else {
        el.classList.remove('active');
      }
    });

    // Hide all module containers, show current
    document.querySelectorAll('.module-container').forEach(el => {
      el.classList.remove('active');
    });

    const targetContainer = document.getElementById(`view-${viewName}`);
    if (targetContainer) {
      targetContainer.classList.add('active');
    }

    // Render module
    if (this.modules[viewName] && typeof this.modules[viewName].render === 'function') {
      this.modules[viewName].render();
    }

    if (updateHistory) {
      window.location.hash = viewName;
    }
  }

  subscribeToStore() {
    window.erpStore.subscribe((event, payload) => {
      this.updateBadges();

      // If active module is affected, re-render it
      if (this.modules[this.currentView] && typeof this.modules[this.currentView].render === 'function') {
        this.modules[this.currentView].render();
      }
    });
  }

  updateBadges() {
    const approvals = window.erpStore.getApprovals();
    const pendingApprovals = approvals.filter(a => a.status === 'Pending').length;
    const lowStockCount = window.erpStore.getProducts().filter(p => p.totalStock <= p.minStock).length;

    // Approvals nav badge
    const appBadge = document.getElementById('nav-badge-approvals');
    if (appBadge) {
      if (pendingApprovals > 0) {
        appBadge.innerText = pendingApprovals;
        appBadge.className = 'nav-badge warning';
        appBadge.classList.remove('hidden');
      } else {
        appBadge.classList.add('hidden');
      }
    }

    // Inventory nav badge
    const invBadge = document.getElementById('nav-badge-inventory');
    if (invBadge) {
      if (lowStockCount > 0) {
        invBadge.innerText = lowStockCount;
        invBadge.className = 'nav-badge danger';
        invBadge.classList.remove('hidden');
      } else {
        invBadge.classList.add('hidden');
      }
    }

    // Top bar notification badge
    const notifBadge = document.getElementById('header-notif-badge');
    const totalAlerts = pendingApprovals + lowStockCount;
    if (notifBadge) {
      if (totalAlerts > 0) {
        notifBadge.innerText = totalAlerts;
        notifBadge.classList.remove('hidden');
      } else {
        notifBadge.classList.add('hidden');
      }
    }
  }

  resetDemoData() {
    if (confirm('Reset entire ERP database to factory demonstration seed data? All custom transactions will revert.')) {
      window.erpStore.resetToDemoData(true);
      window.UI.showToast('success', 'Database Reset', 'Demo database restored to default seed state.');
      this.navigate('dashboard');
    }
  }
}

// Global bootstrap on DOM ready
document.addEventListener('DOMContentLoaded', () => {
  window.UI.init();
  window.appRouter = new AppRouter();
  window.appRouter.init();
});
