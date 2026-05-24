'use strict';

document.addEventListener('DOMContentLoaded', () => {
  const dashboard = document.body.dataset.dashboard;
  if (!dashboard || !window.VibePass) return;

  if (dashboard === 'customer') loadCustomerDashboard();
  if (dashboard === 'organizer') loadOrganizerDashboard();
  if (dashboard === 'admin') loadAdminDashboard();
  if (dashboard === 'scanner') initScanner();
});

async function loadCustomerDashboard() {
  const user = await VibePass.requireAuth();
  if (!user) return;
  setText('dashboardName', user.name || 'VibePass member');

  try {
    const data = await VibePass.request('/dashboard/customer');
    setText('ticketCount', data.orders.length);
    setText('inviteCount', data.invitations.length);
    setText('noticeCount', data.notifications.length);
    renderOrders(data.orders);
    renderInvitations(data.invitations);
    renderNotifications(data.notifications);
  } catch (error) {
    console.error('Customer dashboard failed to load:', error);
    renderDashboardError('ordersList', 'Could not load your tickets right now.');
    renderDashboardError('invitationsList', 'Could not load your invitations right now.');
    renderDashboardError('notificationsList', 'Could not load notifications right now.');
    VibePass.toast(error.message, 'error');
  }
}

async function loadOrganizerDashboard() {
  const user = await VibePass.requireAuth(['organizer', 'super_admin']);
  if (!user) return;
  setText('dashboardName', user.name || 'Organizer');

  try {
    const data = await VibePass.request('/dashboard/organizer');
    const stats = data.stats || {};
    setText('orgRevenue', VibePass.money(stats.gross_revenue));
    setText('orgBalance', VibePass.money(stats.withdrawal_balance));
    setText('orgEvents', stats.total_events || 0);
    setText('orgTickets', stats.total_tickets || 0);
    renderOrganizerEvents(data.events || []);
    renderOrders(data.orders || []);
  } catch (error) {
    console.error('Organizer dashboard failed to load:', error);
    renderDashboardError('organizerEventsList', 'Could not load organizer events right now.');
    renderDashboardError('ordersList', 'Could not load organizer orders right now.');
    VibePass.toast(error.message, 'error');
  }
}

async function loadAdminDashboard() {
  const user = await VibePass.requireAuth(['super_admin']);
  if (!user) return;
  setText('dashboardName', user.name || 'Super Admin');

  try {
    const data = await VibePass.request('/dashboard/admin');
    const widgets = data.widgets || {};
    setText('adminRevenue', VibePass.money(widgets.gross_revenue));
    setText('adminCommission', VibePass.money(widgets.platform_commission));
    setText('adminTickets', widgets.total_tickets || 0);
    setText('adminEvents', widgets.active_events || 0);
    setText('adminReviews', widgets.pending_reviews || 0);
    setText('adminWithdrawals', widgets.pending_withdrawals || 0);

    const events = await VibePass.request('/events/admin/review-queue?limit=8');
    renderAdminEvents(events.events || []);
    const organizers = await VibePass.request('/admin/organizers?limit=8');
    renderAdminOrganizers(organizers.organizers || []);
    const withdrawals = await VibePass.request('/withdrawals/admin?limit=8');
    renderWithdrawals(withdrawals.withdrawals || []);
  } catch (error) {
    console.error('Super admin dashboard failed to load:', error);
    renderDashboardError('adminEventsList', 'Could not load event reviews right now.');
    renderDashboardError('adminOrganizersList', 'Could not load organizer reviews right now.');
    renderDashboardError('adminWithdrawalsList', 'Could not load withdrawals right now.');
    VibePass.toast(error.message, 'error');
  }
}

function renderDashboardError(id, message) {
  const el = document.getElementById(id);
  if (el) el.innerHTML = `<div class="empty-state">${escapeHtml(message)}</div>`;
}

function initScanner() {
  VibePass.requireAuth(['organizer', 'super_admin', 'staff']);
  const form = document.getElementById('scannerForm');
  if (!form) return;

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const code = form.qr_code.value.trim();
    if (!code) return;
    const resultEl = document.getElementById('scannerResult');
    resultEl.className = 'scan-result is-waiting';
    resultEl.textContent = 'Checking ticket...';
    try {
      const data = await VibePass.request('/scanner/validate', {
        method: 'POST',
        body: { qr_code: code }
      });
      resultEl.className = `scan-result ${data.approved ? 'is-approved' : 'is-denied'}`;
      resultEl.textContent = data.approved ? 'Access approved' : `Access denied: ${data.reason}`;
      form.reset();
    } catch (error) {
      resultEl.className = 'scan-result is-denied';
      resultEl.textContent = error.message;
    }
  });
}

function renderOrders(orders) {
  const el = document.getElementById('ordersList');
  if (!el) return;
  if (!orders.length) {
    el.innerHTML = emptyState('No ticket orders yet.');
    return;
  }
  el.innerHTML = orders.map((order) => `
    <article class="dash-row">
      <div>
        <strong>${escapeHtml(order.event_title || 'Event')}</strong>
        <span>${formatDate(order.start_date)} - ${escapeHtml(order.venue || 'Venue pending')}</span>
      </div>
      <div class="row-actions">
        <span class="status-chip ${order.payment_status}">${order.payment_status}</span>
        <a class="btn btn-ghost" href="checkout.html?order=${order.id}">View</a>
      </div>
    </article>
  `).join('');
}

function renderInvitations(invitations) {
  const el = document.getElementById('invitationsList');
  if (!el) return;
  if (!invitations.length) {
    el.innerHTML = emptyState('No invitations created yet.');
    return;
  }
  el.innerHTML = invitations.map((invite) => `
    <article class="dash-row">
      <div>
        <strong>${escapeHtml(invite.title)}</strong>
        <span>${formatDate(invite.event_date)} - ${escapeHtml(invite.venue || 'Venue pending')}</span>
      </div>
      <a class="btn btn-ghost" href="invitation.html?i=${invite.share_link}">Open</a>
    </article>
  `).join('');
}

function renderNotifications(notifications) {
  const el = document.getElementById('notificationsList');
  if (!el) return;
  if (!notifications.length) {
    el.innerHTML = emptyState('No notifications yet.');
    return;
  }
  el.innerHTML = notifications.map((notice) => `
    <article class="dash-row">
      <div>
        <strong>${escapeHtml(notice.title)}</strong>
        <span>${escapeHtml(notice.body || '')}</span>
      </div>
    </article>
  `).join('');
}

function renderOrganizerEvents(events) {
  const el = document.getElementById('organizerEventsList');
  if (!el) return;
  if (!events.length) {
    el.innerHTML = emptyState('No events created yet.');
    return;
  }
  el.innerHTML = events.map((event) => `
    <article class="dash-row">
      <div>
        <strong>${escapeHtml(event.title)}</strong>
        <span>${formatDate(event.start_date)} - ${escapeHtml(event.venue || 'Venue pending')}</span>
      </div>
      <div class="row-actions">
        <span class="status-chip ${event.status}">${event.status}</span>
        <a class="btn btn-ghost" href="event-detail.html?id=${event.id}">View</a>
      </div>
    </article>
  `).join('');
}

function renderAdminEvents(events) {
  const el = document.getElementById('adminEventsList');
  if (!el) return;
  if (!events.length) {
    el.innerHTML = emptyState('No events in review queue.');
    return;
  }
  el.innerHTML = events.map((event) => `
    <article class="dash-row">
      <div>
        <strong>${escapeHtml(event.title)}</strong>
        <span>${escapeHtml(event.organizer_name || '')} - ${formatDate(event.created_at)}</span>
      </div>
      <span class="status-chip ${event.status}">${event.status}</span>
    </article>
  `).join('');
}

function renderAdminOrganizers(organizers) {
  const el = document.getElementById('adminOrganizersList');
  if (!el) return;
  if (!organizers.length) {
    el.innerHTML = emptyState('No organizers found.');
    return;
  }
  el.innerHTML = organizers.map((organizer) => `
    <article class="dash-row">
      <div>
        <strong>${escapeHtml(organizer.organization_name || organizer.name)}</strong>
        <span>${escapeHtml(organizer.email)} - ${escapeHtml(organizer.organizer_type)}</span>
      </div>
      <span class="status-chip ${organizer.status}">${organizer.status}</span>
    </article>
  `).join('');
}

function renderWithdrawals(withdrawals) {
  const el = document.getElementById('adminWithdrawalsList');
  if (!el) return;
  if (!withdrawals.length) {
    el.innerHTML = emptyState('No withdrawal requests.');
    return;
  }
  el.innerHTML = withdrawals.map((withdrawal) => `
    <article class="dash-row">
      <div>
        <strong>${VibePass.money(withdrawal.amount)}</strong>
        <span>${escapeHtml(withdrawal.organizer_name || '')} - ${formatDate(withdrawal.created_at)}</span>
      </div>
      <span class="status-chip ${withdrawal.status}">${withdrawal.status}</span>
    </article>
  `).join('');
}

function setText(id, value) {
  const el = document.getElementById(id);
  if (el) el.textContent = value;
}

function emptyState(message) {
  return `<div class="empty-state">${escapeHtml(message)}</div>`;
}

function formatDate(value) {
  if (!value) return 'Date pending';
  return new Date(value).toLocaleDateString('en-LK', { month: 'short', day: 'numeric', year: 'numeric' });
}

function escapeHtml(value) {
  return String(value || '').replace(/[&<>"']/g, (char) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  }[char]));
}
