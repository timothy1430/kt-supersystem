/* ==========================================================================
   KT-SUPERSYSTEM ERP - MODULE: APPROVALS & GOVERNANCE ENGINE
   Cross-Functional Multi-Tier Approvals (Capex, Pricing, Credit & Scraps)
   ========================================================================== */

const ApprovalsModule = {
  currentTab: 'pending',
  categoryFilter: 'all',

  render() {
    const container = document.getElementById('view-approvals');
    if (!container) return;

    const allApprovals = window.erpStore.getApprovals();
    const filtered = allApprovals.filter(a => {
      // Tab filter
      if (this.currentTab === 'pending' && a.status !== 'Pending') return false;
      if (this.currentTab === 'approved' && a.status !== 'Approved') return false;
      if (this.currentTab === 'rejected' && a.status !== 'Rejected') return false;

      // Category filter
      if (this.categoryFilter !== 'all' && a.category !== this.categoryFilter) return false;

      return true;
    });

    const pendingCount = allApprovals.filter(a => a.status === 'Pending').length;
    const approvedCount = allApprovals.filter(a => a.status === 'Approved').length;
    const rejectedCount = allApprovals.filter(a => a.status === 'Rejected').length;
    const pendingValue = allApprovals.filter(a => a.status === 'Pending').reduce((s, a) => s + a.amount, 0);

    container.innerHTML = `
      <div class="view-header">
        <div class="view-title-group">
          <h1>
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="var(--brand-primary)" stroke-width="2.2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
            Governance & Cross-Department Approvals
          </h1>
          <p>Multi-tier operational authorization queue for high-value Capex, discount overrides, and credit exceptions</p>
        </div>
        <div class="view-actions">
          <span style="font-size: 0.8125rem; color: var(--text-muted);">
            Active Sign-Off Role: <strong style="color: var(--brand-primary);">${window.erpStore.currentRole}</strong>
          </span>
        </div>
      </div>

      <!-- Quick Stats -->
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-header">
            <span class="stat-label">Pending Approval Queue</span>
            <div class="stat-icon-wrapper ${pendingCount > 0 ? 'warning' : 'success'}">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
            </div>
          </div>
          <div class="stat-body">
            <div class="stat-value">${pendingCount} <span style="font-size: 1rem; color: var(--text-muted);">items</span></div>
          </div>
          <div class="stat-footer">
            <span class="text-warning font-weight-bold">${UI.formatCurrency(pendingValue)}</span>
            <span>in financial commitments</span>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-header">
            <span class="stat-label">Approved Transactions</span>
            <div class="stat-icon-wrapper success">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>
            </div>
          </div>
          <div class="stat-body">
            <div class="stat-value">${approvedCount}</div>
          </div>
          <div class="stat-footer">
            <span>Cleared for execution</span>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-header">
            <span class="stat-label">Rejected / Blocked</span>
            <div class="stat-icon-wrapper ${rejectedCount > 0 ? 'danger' : 'info'}">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
            </div>
          </div>
          <div class="stat-body">
            <div class="stat-value">${rejectedCount}</div>
          </div>
          <div class="stat-footer">
            <span>Exceptions denied by policy</span>
          </div>
        </div>
      </div>

      <!-- Main Approvals Filter & Queue Card -->
      <div class="card-container">
        <div class="card-header-bar">
          <div class="tabs-navigation" style="margin-bottom: 0; border-bottom: none;">
            <button class="tab-button ${this.currentTab === 'pending' ? 'active' : ''}" onclick="ApprovalsModule.setTab('pending');">
              Action Required <span class="tab-counter" style="background: var(--color-warning-bg); color: var(--color-warning);">${pendingCount}</span>
            </button>
            <button class="tab-button ${this.currentTab === 'approved' ? 'active' : ''}" onclick="ApprovalsModule.setTab('approved');">
              Approved Log <span class="tab-counter">${approvedCount}</span>
            </button>
            <button class="tab-button ${this.currentTab === 'rejected' ? 'active' : ''}" onclick="ApprovalsModule.setTab('rejected');">
              Rejected Log <span class="tab-counter">${rejectedCount}</span>
            </button>
            <button class="tab-button ${this.currentTab === 'all' ? 'active' : ''}" onclick="ApprovalsModule.setTab('all');">
              All History <span class="tab-counter">${allApprovals.length}</span>
            </button>
          </div>

          <div class="filter-bar">
            <select class="form-control" style="width: 170px; padding: 6px 10px; font-size: 0.8125rem;" onchange="ApprovalsModule.handleCategoryFilter(this.value)">
              <option value="all">All Categories</option>
              <option value="Procurement" ${this.categoryFilter === 'Procurement' ? 'selected' : ''}>Procurement (PO > $5k)</option>
              <option value="Sales Discount" ${this.categoryFilter === 'Sales Discount' ? 'selected' : ''}>Sales Discount (> 15%)</option>
              <option value="Credit Limit" ${this.categoryFilter === 'Credit Limit' ? 'selected' : ''}>Credit Limit Breach</option>
              <option value="Inventory Write-Off" ${this.categoryFilter === 'Inventory Write-Off' ? 'selected' : ''}>Inventory Write-Off</option>
            </select>
          </div>
        </div>

        <div style="padding: 20px;">
          ${filtered.length === 0 ? `
            <div style="text-align: center; padding: 60px 20px; color: var(--text-muted);">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" style="margin: 0 auto 12px auto; opacity: 0.5; display: block;"><polyline points="20 6 9 17 4 12"/></svg>
              <div style="font-size: 1rem; font-weight: 600;">No Approval Items in this view</div>
              <p style="font-size: 0.825rem; margin-top: 4px;">All governance queues are cleared and compliant.</p>
            </div>
          ` : filtered.map(app => {
            const isPending = app.status === 'Pending';
            let iconSvg = '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/></svg>';
            if (app.category.includes('Sales')) {
              iconSvg = '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>';
            } else if (app.category.includes('Inventory')) {
              iconSvg = '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="7" width="20" height="14" rx="2" ry="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>';
            }

            return `
              <div class="approval-card ${isPending ? (app.amount > 10000 ? 'priority-high' : 'priority-medium') : ''}">
                <div class="approval-main">
                  <div class="approval-icon">
                    ${iconSvg}
                  </div>
                  <div class="approval-details">
                    <div style="display: flex; align-items: center; gap: 10px; flex-wrap: wrap;">
                      <span class="approval-title">${app.category}: ${app.targetRef}</span>
                      <span class="text-mono" style="font-weight: 800; font-size: 1rem; color: var(--text-primary);">${UI.formatCurrency(app.amount)}</span>
                      ${UI.getStatusBadge(app.status)}
                    </div>
                    <div class="approval-meta">
                      <span>Submitted by: <strong>${app.requester}</strong></span>
                      <span>Required Signer: <strong style="color: var(--brand-primary);">${app.requiredRole}</strong></span>
                      <span>Date: ${app.submittedAt}</span>
                    </div>
                    <div class="approval-justification">
                      <strong>Policy Trigger:</strong> ${app.reason}
                    </div>
                    ${app.comments ? `
                      <div style="font-size: 0.8rem; color: var(--text-secondary); margin-top: 4px;">
                        <strong>Approver Remarks:</strong> "${app.comments}" (${app.decidedBy} at ${app.decidedAt})
                      </div>
                    ` : ''}
                  </div>
                </div>

                <div class="approval-actions">
                  ${isPending ? `
                    <button class="btn btn-outline btn-sm" onclick="ApprovalsModule.promptDecision('${app.id}', 'Rejected')" style="color: var(--color-danger); border-color: var(--color-danger-border);">
                      Reject
                    </button>
                    <button class="btn btn-success btn-sm" onclick="ApprovalsModule.promptDecision('${app.id}', 'Approved')">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                      Approve & Release
                    </button>
                  ` : `
                    <div style="text-align: right; font-size: 0.775rem; color: var(--text-muted);">
                      <div>Decided by: <strong>${app.decidedBy ? app.decidedBy.split(' ')[0] : 'System'}</strong></div>
                      <div>${app.decidedAt || ''}</div>
                    </div>
                  `}
                </div>
              </div>
            `;
          }).join('')}
        </div>
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

  promptDecision(approvalId, decision) {
    const approval = window.erpStore.getApprovals().find(a => a.id === approvalId);
    if (!approval) return;

    const modalBody = document.getElementById('approval-decision-modal-body');
    if (!modalBody) return;

    modalBody.innerHTML = `
      <form id="approval-decision-form" onsubmit="event.preventDefault(); ApprovalsModule.submitDecision('${approval.id}', '${decision}');">
        <div style="background: var(--bg-surface-elevated); padding: 16px; border-radius: var(--radius-md); margin-bottom: 16px;">
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <span style="font-weight: 700; font-size: 1rem;">${approval.targetRef}</span>
            <span class="text-mono" style="font-weight: 800; font-size: 1.1rem;">${UI.formatCurrency(approval.amount)}</span>
          </div>
          <div style="font-size: 0.8rem; color: var(--text-muted); margin-top: 4px;">
            Trigger: ${approval.reason}
          </div>
        </div>

        <div style="margin-bottom: 14px;">
          <div style="font-size: 0.875rem; margin-bottom: 6px;">
            You are about to <strong style="color: ${decision === 'Approved' ? 'var(--color-success)' : 'var(--color-danger)'};">${decision.toUpperCase()}</strong> this request as:
          </div>
          <div style="background: var(--bg-surface-elevated); padding: 10px 14px; border-radius: var(--radius-md); font-weight: 600; color: var(--brand-primary); font-size: 0.875rem;">
            ${window.erpStore.currentUser} · ${window.erpStore.currentRole}
          </div>
        </div>

        <div class="form-group">
          <label class="form-label">Governance Comments / Audit Notes ${decision === 'Rejected' ? '<span class="req">*</span>' : ''}</label>
          <textarea class="form-control" id="decision-comments" placeholder="${decision === 'Approved' ? 'e.g. Budget verified against Q3 forecast; approved.' : 'e.g. Discount exceeds target margin; renegotiate terms.'}" ${decision === 'Rejected' ? 'required' : ''}></textarea>
        </div>
      </form>
    `;

    const titleEl = document.getElementById('approval-decision-modal-title');
    if (titleEl) titleEl.innerText = `${decision} Authorization Request`;

    const submitBtn = document.getElementById('approval-decision-submit-btn');
    if (submitBtn) {
      submitBtn.innerText = `Confirm ${decision}`;
      submitBtn.className = `btn ${decision === 'Approved' ? 'btn-success' : 'btn-danger'}`;
      submitBtn.onclick = () => ApprovalsModule.submitDecision(approval.id, decision);
    }

    window.UI.openModal('approval-decision-modal');
  },

  submitDecision(approvalId, decision) {
    const commentsInput = document.getElementById('decision-comments');
    const comments = commentsInput ? commentsInput.value : '';

    try {
      window.erpStore.processApproval(approvalId, decision, comments);
      window.UI.closeModal('approval-decision-modal');
      window.UI.showToast(
        decision === 'Approved' ? 'success' : 'warning',
        `Request ${decision}!`,
        `Cross-module workflow updated. Linked transaction state is now ${decision}.`
      );
      this.render();
    } catch (e) {
      window.UI.showToast('danger', 'Execution Error', e.message);
    }
  }
};

window.ApprovalsModule = ApprovalsModule;
