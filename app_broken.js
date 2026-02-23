// ===== MAIN APPLICATION =====
import { initFirebaseData } from './data.js';

// ---- Authentication & User State ----
let currentUser = null;

async function initApp() {
  // Check auth first
  const storedUser = localStorage.getItem('pb_currentUser');
  if (storedUser) {
    currentUser = JSON.parse(storedUser);
    document.body.classList.remove('not-authenticated');
    document.body.setAttribute('data-role', currentUser.role);

    // Update header UI
    document.getElementById('headerUserInfo').style.display = 'flex';
    document.getElementById('headerUserName').textContent = currentUser.name;
    document.getElementById('headerUserRole').textContent =
      currentUser.role === 'admin' ? 'Administrator' :
        currentUser.role === 'super user' ? 'Super User' : 'User';
    document.getElementById('headerUserAvatar').textContent = currentUser.name.charAt(0).toUpperCase();

    // Start fetching firebase data. Pass a callback to re-render when projects change
    await initFirebaseData(() => {
      // Callback whenever projects get a new snapshot
      const tab = document.querySelector('.nav-tab.active')?.dataset.tab;
      if (tab === 'dashboard') renderDashboard();
      if (tab === 'projects') renderProjectsPage();
      if (tab === 'review') renderReviewPage();
      if (tab === 'report') renderReportPage();
    });

    // Default to Dashboard tab
    switchTab('dashboard');
  } else {
    window.location.href = 'login.html';
  }
}

// Start app
window.addEventListener('DOMContentLoaded', initApp);

// Globalize window functions used in HTML onClick
window.handleLogout = function () {
  if (confirm('ยืนยันการออกจากระบบ?')) {
    localStorage.removeItem('pb_currentUser');
    currentUser = null;
    window.location.href = 'login.html';
  }
}

// ---- Utility: Format currency ----
window.formatBudget = function (n) {
  return Number(n || 0).toLocaleString('th-TH') + ' บาท';
}

window.formatBudgetShort = function (n) {
  const v = Number(n || 0);
  if (v >= 1000000) return (v / 1000000).toFixed(2) + ' ล้าน';
  if (v >= 1000) return (v / 1000).toFixed(0) + ' พัน';
  return v.toLocaleString('th-TH');
}

// ---- Utility: Debounce ----
function debounce(func, wait) {
  let timeout;
  return function (...args) {
    const context = this;
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(context, args), wait);
  };
}

// ---- Toast ----
window.showToast = function (msg, type = 'info') {
  const icons = { success: '✅', error: '❌', info: 'ℹ️' };
  const container = document.getElementById('toastContainer');
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.innerHTML = `<span>${icons[type]}</span><span>${msg}</span>`;
  container.appendChild(toast);
  setTimeout(() => toast.remove(), 3200);
}

// ---- Tab Navigation ----
window.switchTab = function (tabId) {
  if (currentUser) {
    if (currentUser.role === 'super user' && tabId === 'users') {
      window.showToast('ไม่มีสิทธิ์เข้าถึงหน้านี้', 'error');
      tabId = 'dashboard';
    }
    if (currentUser.role === 'user' && (tabId === 'users' || tabId === 'dbmanage')) {
      window.showToast('ไม่มีสิทธิ์เข้าถึงหน้านี้', 'error');
      tabId = 'dashboard';
    }
  }

  document.querySelectorAll('.nav-tab').forEach(t => t.classList.toggle('active', t.dataset.tab === tabId));
  document.querySelectorAll('.page').forEach(p => p.classList.toggle('active', p.id === 'page-' + tabId));

  if (tabId === 'dashboard') renderDashboard();
  if (tabId === 'projects') renderProjectsPage();
  if (tabId === 'review') renderReviewPage();
  if (tabId === 'report') renderReportPage();
  if (tabId === 'dbmanage') renderDbManagePage();
  if (tabId === 'users') renderUsersPage();
}

// Map switchTab globally
document.querySelectorAll('.nav-tab').forEach(btn => {
  btn.onclick = () => window.switchTab(btn.dataset.tab);
});

// Build the rest of app.js similarly...
