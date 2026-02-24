// ===== MAIN APPLICATION =====

// ---- Authentication & User State ----
let currentUser = null;

function checkAuth() {
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

    // Default to Dashboard tab
    switchTab('dashboard');
  } else {
    window.location.href = 'login.html';
  }
}

function handleLogout() {
  if (confirm('ยืนยันการออกจากระบบ?')) {
    localStorage.removeItem('pb_currentUser');
    currentUser = null;
    window.location.href = 'login.html';
  }
}

// ---- Utility: Format currency ----
function formatBudget(n) {
  return Number(n || 0).toLocaleString('th-TH') + ' บาท';
}

function formatBudgetShort(n) {
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
function showToast(msg, type = 'info') {
  const container = document.getElementById('toastContainer');
  if (!container) return;
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.innerHTML = `<span class="toast-icon">${type === 'success' ? '✅' : type === 'error' ? '❌' : type === 'warning' ? '⚠️' : 'ℹ️'}</span> ${msg}`;
  container.appendChild(toast);
  setTimeout(() => { toast.classList.add('hide'); setTimeout(() => toast.remove(), 300); }, 3000);
}

// ==== Multi-Select Dropdown Helpers ====
function toggleMultiSelect(containerId) {
  const container = document.getElementById(containerId);
  if (!container) return;
  container.classList.toggle('open');
}

// Close dropdowns when clicking outside
document.addEventListener('click', (e) => {
  const dropdowns = document.querySelectorAll('.multi-select-dropdown');
  dropdowns.forEach(dropdown => {
    if (!dropdown.contains(e.target)) {
      dropdown.classList.remove('open');
    }
  });
});

function toggleMsOption(e, containerId, value, label) {
  const container = document.getElementById(containerId);
  if (!container) return;
  if (e) e.stopPropagation();

  let selected = container.hasAttribute('data-selected')
    ? container.getAttribute('data-selected').split(',').filter(Boolean)
    : [];

  let selectedLabels = container.hasAttribute('data-labels')
    ? container.getAttribute('data-labels').split(',').filter(Boolean)
    : [];

  const valIdx = selected.indexOf(value);
  if (valIdx > -1) {
    selected.splice(valIdx, 1);
    selectedLabels.splice(valIdx, 1);
  } else {
    selected.push(value);
    selectedLabels.push(label);
  }

  container.setAttribute('data-selected', selected.join(','));
  container.setAttribute('data-labels', selectedLabels.join(','));

  // Update UI manually to avoid full rebuild immediately if desired, 
  // but trigger event will do it anyway
  updateMsDisplayText(containerId);
  container.dispatchEvent(new Event('ms-change'));
}

function clearMsSelection(e, containerId) {
  const container = document.getElementById(containerId);
  if (!container) return;
  if (e) e.stopPropagation();

  container.setAttribute('data-selected', '');
  container.setAttribute('data-labels', '');

  updateMsDisplayText(containerId);
  container.dispatchEvent(new Event('ms-change'));
}

function updateMsDisplayText(containerId) {
  const container = document.getElementById(containerId);
  if (!container) return;

  const textSpan = container.querySelector('.ms-text');
  if (!textSpan) return;

  const selected = container.hasAttribute('data-selected')
    ? container.getAttribute('data-selected').split(',').filter(Boolean)
    : [];

  if (selected.length === 0) {
    textSpan.textContent = 'ทุกสถานะ';
    textSpan.innerHTML = 'ทุกสถานะ'; // Clear any HTML from tags
  } else if (selected.length <= 2) {
    // Show icons/labels for 1-2 items
    const allStatuses = [
      { id: 'pending', label: 'รอการพิจารณา', icon: '⏳' },
      ...REVIEW_STATUSES
    ];

    let html = '<div class="ms-tags">';
    selected.forEach(val => {
      const sinfo = allStatuses.find(s => s.id === val);
      if (sinfo) {
        let sc = sinfo.id === 'green' ? '#10b981' : (sinfo.id === 'red' ? '#ef4444' : (sinfo.id === 'pending' ? '#94a3b8' : '#f59e0b'));
        html += `<span class="ms-tag" style="color:${sc};border-color:${sc}40;background:${sc}15">${sinfo.icon} ${sinfo.label.split(' ')[0]}</span>`;
      }
    });
    html += '</div>';
    textSpan.innerHTML = html;
  } else {
    textSpan.innerHTML = `<span style="color:#60a5fa;font-weight:500">เลือก ${selected.length} สถานะ</span>`;
  }
}


// ---- Tab Navigation ----
function switchTab(tabId) {
  // Role-Based Access Control
  if (currentUser) {
    if (currentUser.role === 'super user' && tabId === 'users') {
      showToast('ไม่มีสิทธิ์เข้าถึงหน้านี้', 'error');
      tabId = 'dashboard';
    }
    if (currentUser.role === 'user' && (tabId === 'users' || tabId === 'dbmanage')) {
      showToast('ไม่มีสิทธิ์เข้าถึงหน้านี้', 'error');
      tabId = 'dashboard';
    }
  }

  // Clear all filter inputs and selects across all pages to ensure a fresh view
  document.querySelectorAll('.filter-bar input').forEach(el => {
    el.value = '';
  });
  document.querySelectorAll('.filter-bar select').forEach(el => {
    el.value = '';
  });

  document.querySelectorAll('.nav-tab').forEach(t => t.classList.toggle('active', t.dataset.tab === tabId));
  document.querySelectorAll('.page').forEach(p => p.classList.toggle('active', p.id === 'page-' + tabId));
  if (tabId === 'dashboard') renderDashboard();
  if (tabId === 'projects') renderProjectsPage();
  if (tabId === 'review') renderReviewPage();
  if (tabId === 'report') renderReportPage();
  if (tabId === 'dbmanage') renderDbManagePage();
  if (tabId === 'users') renderUsersPage();
}

// ===== PAGE 1: DASHBOARD =====
// ===== PAGE 1: DASHBOARD =====
function renderDashboard() {
  const agencyFilter = document.getElementById('dashAgencyFilter').value;
  const typeFilter = document.getElementById('dashTypeFilter').value;
  const stats = DB.getStats(agencyFilter, typeFilter);

  // Stat cards
  const passed = stats.byStatus['green'] || 0;
  const reviewed = stats.total - (stats.byStatus['pending'] || 0);

  document.getElementById('statTotal').textContent = stats.total.toLocaleString();
  document.getElementById('statBudget').textContent = formatBudgetShort(stats.totalBudget);
  document.getElementById('statReviewed').textContent = reviewed.toLocaleString();
  document.getElementById('statPassed').textContent = passed.toLocaleString();

  // Type breakdown cards
  const typeGrid = document.getElementById('typeBreakdownGrid');
  typeGrid.innerHTML = PROJECT_TYPES.map(t => {
    const count = stats.byType[t.id] || 0;
    const typeBudget = stats.budgetByType[t.id] || 0;
    const pct = stats.total > 0 ? Math.round((count / stats.total) * 100) : 0;
    return `
      <div class="stat-card" style="border-width: 2px; border-color: ${t.color}40; background: linear-gradient(135deg, rgba(255,255,255,0.02), ${t.color}10); display: flex; flex-direction: column;">
        <div style="display:flex; justify-content: space-between; align-items: flex-start; margin-bottom: 8px;">
          <div class="stat-icon" style="background: ${t.color}20; color: ${t.color}; padding: 10px; border-radius: 12px; font-size: 24px; box-shadow: 0 4px 12px ${t.color}20;">${typeIcon(t.id)}</div>
          <div class="stat-value" style="color:${t.color}; font-size: 28px; text-shadow: 0 2px 4px rgba(0,0,0,0.2);">${count}</div>
        </div>
        <div class="stat-label" style="font-weight: 600; font-size: 15px; margin-bottom: 4px; color: var(--text-primary);">${t.label}</div>
        <div style="font-size:14px;color:var(--text-secondary);margin-top:auto; font-weight: 500;">
          <span style="opacity:0.8">งบประมาณ:</span> <span style="color:var(--text-primary)">${formatBudget(typeBudget)}</span>
        </div>
        <div class="progress-bar" style="margin-top:12px; height: 6px; background: rgba(255,255,255,0.05); border-radius: 3px; overflow: hidden;">
          <div class="progress-fill" style="width:${pct}%;background:linear-gradient(90deg, ${t.color}80, ${t.color}); border-radius: 3px; box-shadow: 0 0 8px ${t.color};"></div>
        </div>
      </div>`;
  }).join('');

  // Status donut
  renderStatusDonut(stats.byStatus, stats.total);

  // Agency table
  renderAgencyTable(stats.byAgency);
}

// ===== UTILS =====
function getMaxRound(projects) {
  return projects.reduce((max, p) => Math.max(max, p.round || 1), 1);
}

function typeIcon(id) {
  return { 'งานก่อสร้างเส้นทางคมนาคม': '🛣️', 'งานจัดหาน้ำกินน้ำใช้': '💧', 'งานพัฒนาและช่วยเหลือประชาชน': '🏘️', 'งานเกษตรผสมผสาน': '🌾' }[id] || '📋';
}

function statusBadge(status) {
  const map = {
    green: '<span class="badge badge-green">🟢 ผ่านการพิจารณา</span>',
    adjust: '<span class="badge badge-yellow">🟡 ปรับประมาณการ</span>',
    docs: '<span class="badge badge-orange">🟠 ส่งเอกสารเพิ่มเติม</span>',
    red: '<span class="badge badge-red">🔴 ไม่ผ่านการพิจารณา</span>',
    '': '<span class="badge badge-gray">⏳ รอการพิจารณา</span>'
  };
  return map[status] || map[''];
}

function typeBadge(typeId) {
  const t = PROJECT_TYPES.find(x => x.id === typeId);
  if (!t) return `<span class="badge type-${typeId}">${typeIcon(typeId)} ${typeId}</span>`;
  return `<span class="badge type-${typeId}" style="border-color:${t.color}; color:${t.color}; background:${t.color}10;">${typeIcon(typeId)} ${t.label}</span>`;
}

function renderStatusDonut(byStatus, total) {
  const statuses = [
    { key: 'green', label: 'ผ่านการพิจารณา', color: '#10b981' },
    { key: 'adjust', label: 'ปรับประมาณการ', color: '#f59e0b' },
    { key: 'docs', label: 'ส่งเอกสารเพิ่มเติม', color: '#f97316' },
    { key: 'red', label: 'ไม่ผ่านการพิจารณา', color: '#ef4444' },
    { key: 'pending', label: 'รอการพิจารณา', color: '#64748b' },
  ];

  const counts = statuses.map(s => ({ ...s, count: byStatus[s.key] || 0 }));
  const r = 54, cx = 70, cy = 70, stroke = 16;
  const circumference = 2 * Math.PI * r;
  let offset = 0;

  const segments = counts.map(s => {
    const pct = total > 0 ? s.count / total : 0;
    const dash = pct * circumference;
    const seg = `<circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="${s.color}" stroke-width="${stroke}"
      stroke-dasharray="${dash} ${circumference - dash}" stroke-dashoffset="${-offset}" opacity="${s.count > 0 ? 0.85 : 0}"/>`;
    offset += dash;
    return seg;
  }).join('');

  document.getElementById('statusDonut').innerHTML = `
    <div class="chart-container">
      <div class="donut-chart">
        <svg width="140" height="140" viewBox="0 0 140 140">
          <circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="#e2e8f0" stroke-width="${stroke}"/>
          ${segments}
        </svg>
        <div class="donut-center">
          <div class="value">${total.toLocaleString()}</div>
          <div class="label">โครงการ</div>
        </div>
      </div>
      <div class="chart-legend">
        ${counts.map(s => `
          <div class="legend-item">
            <div class="legend-dot" style="background:${s.color}"></div>
            <span class="legend-label">${s.label}</span>
            <span class="legend-value">${s.count}</span>
            <span class="legend-pct">${total > 0 ? Math.round(s.count / total * 100) : 0}%</span>
          </div>`).join('')}
      </div>
    </div>`;
}

function renderAgencyTable(byAgency) {
  const offices = Object.keys(byAgency).sort();
  if (offices.length === 0) {
    document.getElementById('agencyTableBody').innerHTML = `<tr><td colspan="7" class="td-muted" style="text-align:center;padding:30px">ไม่พบข้อมูล</td></tr>`;
    return;
  }
  document.getElementById('agencyTableBody').innerHTML = offices.map(ag => {
    const data = byAgency[ag];
    return `<tr>
      <td><strong>${ag}</strong></td>
      <td style="text-align:center">${data.total}</td>
      ${PROJECT_TYPES.map(t => `<td style="text-align:center">${data.byType[t.id] || 0}</td>`).join('')}
      <td class="budget-num">${formatBudget(data.budget)}</td>
    </tr>`;
  }).join('');
}

function initDashboardFilters() {
  const agSel = document.getElementById('dashAgencyFilter');
  const typeSel = document.getElementById('dashTypeFilter');

  const rebuildDashboardFilters = () => {
    let currentAg = agSel.value;
    if (currentAg === 'ทุกภาค') currentAg = '';
    const currentType = typeSel.value;

    const allProjects = DB.getProjects();
    const useMasterOffices = [...new Set(allProjects.map(p => p.regionalOffice).filter(Boolean))].sort();
    const useMasterTypes = [...new Set(allProjects.map(p => p.type).filter(Boolean))].map(t => {
      const pt = PROJECT_TYPES.find(x => x.id === t);
      return pt ? pt : { id: t, label: t, color: '#666' };
    }).sort((a, b) => a.label.localeCompare(b.label));

    // Calculate available Agencies (ignoring Agency filter)
    let agencyProjects = allProjects;
    if (currentType) agencyProjects = agencyProjects.filter(p => p.type === currentType);
    const availableAgencies = [...new Set(agencyProjects.map(p => p.regionalOffice).filter(Boolean))];

    // Calculate available Types (ignoring Type filter)
    let typeProjects = allProjects;
    let effectiveAgency = agSel.value;
    if (effectiveAgency) typeProjects = typeProjects.filter(p => p.regionalOffice === effectiveAgency);
    const availableTypes = [...new Set(typeProjects.map(p => p.type).filter(Boolean))];

    // Update Agency Select — all users see full dropdown
    agSel.innerHTML = '<option value="">ทุกสำนักงานภาค</option>' + useMasterOffices.map(a => {
      const count = availableAgencies.includes(a) ? 1 : 0;
      const disabledAttr = count === 0 ? 'class="txt-muted"' : '';
      return `<option value="${a}" ${disabledAttr}>${a}</option>`;
    }).join('');
    agSel.disabled = false;
    if (currentAg && useMasterOffices.includes(currentAg)) agSel.value = currentAg;
    else agSel.value = "";

    // Update Type Select
    typeSel.innerHTML = '<option value="">ทุกประเภทงาน</option>' + useMasterTypes.map(tObj => {
      const t = tObj.id;
      const count = availableTypes.includes(t) ? 1 : 0;
      const disabledAttr = count === 0 ? 'class="txt-muted"' : '';
      const label = tObj.label;
      return `<option value="${t}" ${disabledAttr}>${label}</option>`;
    }).join('');
    if (currentType && useMasterTypes.find(tObj => tObj.id === currentType)) typeSel.value = currentType;
    else typeSel.value = "";

  };

  // Initial build
  rebuildDashboardFilters();

  agSel.addEventListener('change', () => { rebuildDashboardFilters(); renderDashboard(); });
  typeSel.addEventListener('change', () => { rebuildDashboardFilters(); renderDashboard(); });
}

// ---- Utility: Get Filtered Projects ----
function getFilteredProjects(searchId, agencyId, unitId, fiscalYearId, typeId = null, budgetTypeId = null, statusId = null) {
  const projects = DB.getProjects();
  const search = document.getElementById(searchId)?.value.trim().toLowerCase();

  let agency = document.getElementById(agencyId)?.value;
  // Treat "ทุกภาค" as no filter
  if (agency === 'ทุกภาค') agency = '';

  const unit = document.getElementById(unitId)?.value;
  const fiscalYear = fiscalYearId ? document.getElementById(fiscalYearId)?.value : '';
  const type = typeId ? document.getElementById(typeId)?.value : '';
  const budgetType = budgetTypeId ? document.getElementById(budgetTypeId)?.value : '';

  // For multi-select status, get from our custom attribute
  let statusFilter = '';
  const statusContainer = document.getElementById(statusId + 'Container');
  const statusEl = document.getElementById(statusId);

  if (statusContainer && statusContainer.hasAttribute('data-selected')) {
    statusFilter = statusContainer.getAttribute('data-selected');
  } else if (statusEl) {
    statusFilter = statusEl.value;
  }

  return projects.filter(p => {
    if (fiscalYear && String(p.fiscalYear) !== fiscalYear) return false;
    if (agency && p.regionalOffice !== agency) return false;
    if (unit && p.unitOrg !== unit) return false;
    if (type && p.type !== type) return false;
    if (budgetType && p.budgetType !== budgetType) return false;

    if (statusFilter) {
      const selectedStatuses = statusFilter.split(',').filter(Boolean);
      if (selectedStatuses.length > 0) {
        const pStatus = p.reviewStatus || 'pending';
        if (!selectedStatuses.includes(pStatus)) return false;
      }
    }

    if (search) {
      const s = search;
      const match = (p.subItem && String(p.subItem).toLowerCase().includes(s)) ||
        (p.province && String(p.province).toLowerCase().includes(s)) ||
        (p.village && String(p.village).toLowerCase().includes(s)) ||
        (p.moo && String(p.moo).toLowerCase().includes(s)) ||
        (p.amphoe && String(p.amphoe).toLowerCase().includes(s)) ||
        (p.tambon && String(p.tambon).toLowerCase().includes(s)) ||
        (p.budget && String(p.budget).includes(s)) ||
        (p.quantity && String(p.quantity).includes(s)) ||
        (p.id && String(p.id).toLowerCase().includes(s)) ||
        (p.unitOrg && String(p.unitOrg).toLowerCase().includes(s)) ||
        (p.regionalOffice && String(p.regionalOffice).toLowerCase().includes(s)) ||
        (p.type && String(p.type).toLowerCase().includes(s)) ||
        (p.budgetType && String(p.budgetType).toLowerCase().includes(s)) ||
        (p.dimension && String(p.dimension).toLowerCase().includes(s));
      if (!match) return false;
    }

    return true;
  });
}

// ---- Utility: Populate Fiscal Year Filter from project data ----
function populateFiscalYearFilter(selectId) {
  const sel = document.getElementById(selectId);
  if (!sel) return;
  const projects = DB.getProjects();
  const years = [...new Set(projects.map(p => p.fiscalYear).filter(Boolean))].sort();
  const current = sel.value;
  sel.innerHTML = '<option value="">ทุกปีงบประมาณ</option>' + years.map(y => `<option value="${y}">พ.ศ. ${y}</option>`).join('');
  if (current && years.map(String).includes(current)) sel.value = current;
}

// ---- Utility: Init Filters for Page ----
function initPageFilters(searchId, agencyId, unitId, renderFunc, fiscalYearId, typeId, budgetTypeId, statusId) {
  const agSel = document.getElementById(agencyId);
  const unitSel = document.getElementById(unitId);
  const searchIn = document.getElementById(searchId);
  const fySel = fiscalYearId ? document.getElementById(fiscalYearId) : null;
  const typeSel = typeId ? document.getElementById(typeId) : null;
  const budgetTypeSel = budgetTypeId ? document.getElementById(budgetTypeId) : null;
  const statusSel = statusId ? document.getElementById(statusId) : null;

  if (!agSel || !unitSel || !searchIn) return;

  // Helper to safely get value
  const getFilterVal = (id) => {
    return document.getElementById(id) ? document.getElementById(id).value : '';
  };

  const rebuildFilters = () => {
    const allProjects = DB.getProjects();

    let agencyVal = getFilterVal(agencyId);
    if (agencyVal === 'ทุกภาค') agencyVal = '';

    const currentVals = {
      agency: agencyVal,
      unit: getFilterVal(unitId),
      fy: fiscalYearId ? getFilterVal(fiscalYearId) : '',
      type: typeId ? getFilterVal(typeId) : '',
      budget: budgetTypeId ? getFilterVal(budgetTypeId) : '',
      status: statusId ? getFilterVal(statusId) : ''
    };

    // Helper: filter projects ignoring ONE specific field
    const getSubset = (ignoreField) => {
      let filtered = allProjects.filter(p => {
        if (ignoreField !== 'fy' && currentVals.fy && String(p.fiscalYear) !== currentVals.fy) return false;
        if (ignoreField !== 'agency' && currentVals.agency && p.regionalOffice !== currentVals.agency) return false;
        if (ignoreField !== 'unit' && currentVals.unit && p.unitOrg !== currentVals.unit) return false;
        if (ignoreField !== 'type' && currentVals.type && p.type !== currentVals.type) return false;
        if (ignoreField !== 'budget' && currentVals.budget && p.budgetType !== currentVals.budget) return false;
        if (ignoreField !== 'status' && currentVals.status) {
          const selectedStatuses = currentVals.status.split(',').filter(Boolean);
          if (selectedStatuses.length > 0) {
            const pStatus = p.reviewStatus || 'pending';
            if (!selectedStatuses.includes(pStatus)) return false;
          }
        }
        return true;
      });
      return filtered;
    };

    // 1. MASTER LISTS: Derive from project data per user request
    const masterOffices = [...new Set(allProjects.map(p => p.regionalOffice).filter(Boolean))].sort();
    const masterUnits = currentVals.agency ?
      [...new Set(allProjects.filter(p => p.regionalOffice === currentVals.agency).map(p => p.unitOrg).filter(Boolean))].sort() :
      [...new Set(allProjects.map(p => p.unitOrg).filter(Boolean))].sort();

    const masterFy = [...new Set(allProjects.map(p => p.fiscalYear).filter(Boolean))].sort();
    const masterTypes = [...new Set(allProjects.map(p => p.type).filter(Boolean))].map(t => {
      const pt = PROJECT_TYPES.find(x => x.id === t);
      return pt ? pt : { id: t, label: t, color: '#666' };
    }).sort((a, b) => a.label.localeCompare(b.label));
    const budgetTypes = [...new Set(allProjects.map(p => p.budgetType).filter(Boolean))].sort();




    // Filter helper with error safety
    const safeInclude = (arr, val) => arr && arr.includes(val);

    // 1. Rebuild Agencies — all users see full dropdown
    const agencySubset = getSubset('agency');
    const availableAgencies = [...new Set(agencySubset.map(p => p.regionalOffice).filter(Boolean))];
    agSel.innerHTML = '<option value="">ทุกสำนักงานภาค</option>' + masterOffices.map(a => {
      const count = availableAgencies.includes(a) ? 1 : 0;
      const cls = count === 0 ? 'class="txt-muted"' : '';
      return `<option value="${a}" ${cls}>${a}</option>`;
    }).join('');
    agSel.disabled = false;
    if (currentVals.agency && masterOffices.includes(currentVals.agency)) agSel.value = currentVals.agency;
    else agSel.value = "";

    // 2. Rebuild Units
    const unitSubset = getSubset('unit');
    const availableUnits = [...new Set(unitSubset.map(p => p.unitOrg).filter(Boolean))];
    unitSel.innerHTML = '<option value="">ทุกหน่วย</option>' + masterUnits.map(u => {
      const count = availableUnits.includes(u) ? 1 : 0;
      const cls = count === 0 ? 'class="txt-muted"' : '';
      const label = u;
      return `<option value="${u}" ${cls}>${label}</option>`;
    }).join('');
    if (currentVals.unit && masterUnits.includes(currentVals.unit)) unitSel.value = currentVals.unit;
    else unitSel.value = "";

    // 3. Rebuild Fiscal Year
    if (fySel) {
      const fySubset = getSubset('fy');
      const availableFys = [...new Set(fySubset.map(p => p.fiscalYear).filter(Boolean))];
      fySel.innerHTML = '<option value="">ทุกปีงบประมาณ</option>' + masterFy.map(y => {
        const count = availableFys.includes(y) ? 1 : 0;
        const cls = count === 0 ? 'class="txt-muted"' : '';
        const label = `พ.ศ. ${y}`;
        return `<option value="${y}" ${cls}>${label}</option>`;
      }).join('');
      if (currentVals.fy && masterFy.map(String).includes(currentVals.fy)) fySel.value = currentVals.fy;
      else fySel.value = "";
    }

    // 4. Rebuild Types
    if (typeSel) {
      const typeSubset = getSubset('type');
      const availableTypes = [...new Set(typeSubset.map(p => p.type).filter(Boolean))];
      typeSel.innerHTML = '<option value="">ทุกประเภทงาน</option>' + masterTypes.map(tObj => {
        const t = tObj.id;
        const count = availableTypes.includes(t) ? 1 : 0;
        const cls = count === 0 ? 'class="txt-muted"' : '';
        const label = tObj.label;
        return `<option value="${t}" ${cls}>${label}</option>`;
      }).join('');
      if (currentVals.type && masterTypes.find(tObj => tObj.id === currentVals.type)) typeSel.value = currentVals.type;
      else typeSel.value = "";
    }

    // 5. Rebuild Budget Types
    if (budgetTypeSel) {
      const budgetSubset = getSubset('budget');
      const availableBudgets = [...new Set(budgetSubset.map(p => p.budgetType).filter(Boolean))];
      budgetTypeSel.innerHTML = '<option value="">ทุกประเภทงบ</option>' + budgetTypes.map(b => {
        const count = availableBudgets.includes(b) ? 1 : 0;
        const cls = count === 0 ? 'class="txt-muted"' : '';
        const label = b;
        return `<option value="${b}" ${cls}>${label}</option>`;
      }).join('');
      if (currentVals.budget && budgetTypes.includes(currentVals.budget)) budgetTypeSel.value = currentVals.budget;
      else budgetTypeSel.value = "";
    }

    // 6. Rebuild Statuses
    if (statusSel) {
      const statusSubset = getSubset('status');
      const availableStatuses = [...new Set(statusSubset.map(p => p.reviewStatus || 'pending'))];

      const allStatuses = [
        { id: 'pending', label: 'รอการพิจารณา', icon: '⏳' },
        ...REVIEW_STATUSES.filter(s => s.id !== 'pending')
      ];

      // Regular select
      let optionsHTML = '<option value="">ทุกสถานะ</option>';
      allStatuses.forEach(s => {
        if (availableStatuses.includes(s.id)) {
          optionsHTML += `<option value="${s.id}">${s.icon} ${s.label}</option>`;
        }
      });
      statusSel.innerHTML = optionsHTML;

      if (currentVals.status && availableStatuses.includes(currentVals.status)) {
        statusSel.value = currentVals.status;
      } else {
        statusSel.value = "";
      }
    }
  };

  // Setup Event Listeners
  const onChangeHandler = () => { rebuildFilters(); renderFunc(); };

  agSel.addEventListener('change', onChangeHandler);
  unitSel.addEventListener('change', onChangeHandler);
  if (fySel) fySel.addEventListener('change', onChangeHandler);
  if (typeSel) typeSel.addEventListener('change', onChangeHandler);
  if (budgetTypeSel) budgetTypeSel.addEventListener('change', onChangeHandler);

  // Expose handler for multi-select custom events
  if (statusId) {
    const sEl = document.getElementById(statusId);
    if (sEl) sEl.addEventListener('change', onChangeHandler);

    const tc = document.getElementById(statusId + 'Container');
    if (tc) tc.addEventListener('ms-change', onChangeHandler);
  }

  searchIn.addEventListener('input', debounce(() => {
    rebuildFilters();
    renderFunc();
  }, 300));

  // Initial build and SMART DEFAULT for Fiscal Year
  rebuildFilters();

  if (fySel && !fySel.value) {
    // Default to the latest year that actually has projects
    const allProjects = DB.getProjects();
    const availableFys = [...new Set(allProjects.map(p => p.fiscalYear).filter(Boolean))].sort((a, b) => b - a);
    if (availableFys.length > 0) {
      fySel.value = availableFys[0];
      // Trigger update for the newly set default
      onChangeHandler();
    }
  }
}

// ===== PAGE 2: PROJECTS =====
let editingProjectId = null;
let selectedProjectIds = new Set();
let currentReviewRound = 1; // Default to round 1

// Generate fiscal year options starting from 2571
// Generate fiscal year options around current year (2569 BE / 2026 AD)
function generateFiscalYearOptions(selectedYear) {
  const currentBE = new Date().getFullYear() + 543;
  const startYear = currentBE - 2; // e.g., 2567 if current is 2569
  const endYear = currentBE + 6;   // e.g., 2575

  // Ensure the selected year is included if it's outside the range
  let years = [];
  for (let y = startYear; y <= endYear; y++) years.push(y);
  if (selectedYear && !years.includes(Number(selectedYear))) {
    years.push(Number(selectedYear));
    years.sort((a, b) => a - b);
  }

  return years.map(y => `<option value="${y}" ${y === Number(selectedYear) ? 'selected' : ''}>พ.ศ. ${y}</option>`)
    .join('');
}

// Download template with selected fiscal year
function downloadTemplateWithFY() {
  const year = Number(document.getElementById('fiscalYearSelect').value);
  ExcelUtils.exportTemplate(year);
}

// Import with selected fiscal year
function importWithFY() {
  const year = document.getElementById('fiscalYearSelect').value;
  localStorage.setItem('pendingFiscalYear', year);
  document.getElementById('importFileInput').click();
}

function renderProjectsPage() {
  const projects = getFilteredProjects(
    'projectSearch',
    'projectAgencyFilter',
    'projectUnitFilter',
    'projectFiscalYearFilter',
    'projectTypeFilter',
    'projectBudgetTypeFilter'
  );
  const tbody = document.getElementById('projectsTableBody');

  // Update Bulk Action Header
  const bulkHeader = document.getElementById('bulkActionHeader');
  const selectedCount = document.getElementById('selectedCount');
  const selectAll = document.getElementById('selectAllProjects');

  if (selectedProjectIds.size > 0) {
    bulkHeader.style.display = 'block';
    selectedCount.textContent = selectedProjectIds.size;
  } else {
    // Hide header and uncheck select all
    bulkHeader.style.display = 'none';
    if (selectAll) selectAll.checked = false;
  }

  if (projects.length === 0) {
    tbody.innerHTML = `<tr><td colspan="9"><div class="empty-state"><div class="empty-icon">📋</div><h3>ยังไม่มีโครงการ</h3><p>เพิ่มโครงการด้วยปุ่ม "เพิ่มโครงการ" หรือ "นำเข้า Excel"</p></div></td></tr>`;
    return;
  }
  const displayProjects = projects.slice(0, 50);
  let html = displayProjects.map(p => {
    const location = [p.moo ? `หมู่ ${p.moo}` : '', p.village, p.tambon, p.amphoe, p.province].filter(Boolean).join(' ');
    const isSelected = selectedProjectIds.has(p.id);
    return `
    <tr class="${isSelected ? 'selected-row' : ''}">
      <td style="text-align:center"><input type="checkbox" onchange="toggleProjectSelection('${p.id}')" ${isSelected ? 'checked' : ''}></td>
      <td><span class="td-muted">${p.id}</span></td>
      <td>${typeBadge(p.type)}</td>
      <td><strong>${p.subItem}</strong><br><span class="td-muted">${p.dimension}</span></td>
      <td class="td-muted" style="font-size:12px">${location || '-'}</td>
      <td class="td-muted">${p.quantity.toLocaleString()} ${p.unit}</td>
      <td class="budget-num">${formatBudget(p.budget)}</td>
      <td><span class="badge badge-blue">${p.budgetType}</span></td>
      <td><span class="badge badge-purple">${p.regionalOffice || '-'}</span><br><span class="td-muted" style="font-size:11px">${p.unitOrg || ''}</span></td>
      <td>
        <div class="btn-group">
          <button class="btn btn-outline btn-sm" onclick="editProject('${p.id}')">✏️</button>
          <button class="btn btn-outline btn-sm" onclick="deleteProject('${p.id}')">&#128465;</button>
        </div>
      </td>
    </tr>`;
  }).join('');

  if (projects.length > 50) {
    html += `<tr><td colspan="10" style="text-align:center;padding:15px;color:var(--text-muted)">แสดง 50 รายการจากทั้งหมด ${projects.length} รายการ (กรุณาใช้ค้นหาเพื่อดูเพิ่มเติม)</td></tr>`;
  }
  tbody.innerHTML = html;
}

function openProjectModal(mode = 'add', project = null) {
  const fTypeEl = document.getElementById('fType');
  const fRegionalOfficeEl = document.getElementById('fRegionalOffice');
  const fBudgetTypeEl = document.getElementById('fBudgetType');

  // Refresh master dropdowns
  if (fTypeEl) {
    fTypeEl.innerHTML = DB.getProjectTypes().map(t => `<option value="${t.id}">${t.label}</option>`).join('');
  }
  if (fRegionalOfficeEl) {
    fRegionalOfficeEl.innerHTML = DB.getRegionalOffices().map(r => `<option value="${r}">${r}</option>`).join('');
  }
  if (fBudgetTypeEl) {
    fBudgetTypeEl.innerHTML = BUDGET_TYPES.map(b => `<option value="${b}">${b}</option>`).join('');
  }

  document.getElementById('projectForm').reset();
  const regSelect = document.getElementById('fRegionalOffice');
  regSelect.disabled = false;

  const modal = document.getElementById('projectModal');
  const title = document.getElementById('modalTitle');

  // Populate sub-item dropdown based on type
  const updateSubItemDropdown = () => {
    const typeId = fTypeEl.value;
    const subItems = DB.getSubItemsForType(typeId);
    const fSubItem = document.getElementById('fSubItem');
    const customGroup = document.getElementById('fSubItemCustomGroup');
    fSubItem.innerHTML = '<option value="">-- เลือกรายการย่อย --</option>' +
      subItems.map(s => `<option value="${s}">${s}</option>`).join('') +
      '<option value="__other__">อื่นๆ (ระบุเอง)</option>';
    customGroup.style.display = 'none';
    document.getElementById('fSubItemCustom').value = '';
  };
  fTypeEl.onchange = updateSubItemDropdown;
  updateSubItemDropdown();

  // Show/hide custom sub-item input
  document.getElementById('fSubItem').onchange = () => {
    const customGroup = document.getElementById('fSubItemCustomGroup');
    customGroup.style.display = document.getElementById('fSubItem').value === '__other__' ? 'flex' : 'none';
  };

  // Dynamic unit dropdown based on selected regional office
  const updateUnitDropdown = () => {
    const office = fRegionalOfficeEl.value;
    const units = DB.getUnitsForOffice(office);
    const fUnitOrg = document.getElementById('fUnitOrg');
    fUnitOrg.innerHTML = '<option value="">-- เลือกหน่วย --</option>' +
      units.map(u => `<option value="${u}">${u}</option>`).join('');
  };

  // Live Title Update
  const updateModalTitle = () => {
    const typeLabel = fTypeEl.options[fTypeEl.selectedIndex]?.text || '';
    const officeLabel = fRegionalOfficeEl.value || '';
    const modeText = mode === 'edit' ? 'แก้ไขโครงการ' : 'เพิ่มโครงการใหม่';
    const idText = project ? ` ${project.id}` : '';
    title.textContent = `${modeText}${idText}: ${typeLabel} ${officeLabel ? `(${officeLabel})` : ''}`;
  };

  fTypeEl.onchange = () => {
    updateSubItemDropdown();
    updateModalTitle();
  };
  fRegionalOfficeEl.onchange = () => {
    updateUnitDropdown();
    updateModalTitle();
  };

  updateSubItemDropdown();
  updateUnitDropdown();
  updateModalTitle();

  if (mode === 'edit' && project) {
    editingProjectId = project.id;
    title.textContent = `แก้ไขโครงการ ${project.id} (รอบที่ ${project.round || 1})`;

    // Fill form
    document.getElementById('fFiscalYear').value = project.fiscalYear || 2571;
    document.getElementById('fType').value = project.type;
    // Re-update sub-item dropdown for this type
    updateSubItemDropdown();
    // Try to set value, if not in list use custom
    const fSubItem = document.getElementById('fSubItem');
    const options = Array.from(fSubItem.options).map(o => o.value);
    if (options.includes(project.subItem)) {
      fSubItem.value = project.subItem;
    } else {
      fSubItem.value = '__other__';
      document.getElementById('fSubItemCustomGroup').style.display = 'flex';
      document.getElementById('fSubItemCustom').value = project.subItem;
    }
    document.getElementById('fDimension').value = project.dimension;
    document.getElementById('fMoo').value = project.moo;
    document.getElementById('fVillage').value = project.village;
    document.getElementById('fTambon').value = project.tambon;
    document.getElementById('fAmphoe').value = project.amphoe;
    document.getElementById('fProvince').value = project.province;
    document.getElementById('fQuantity').value = project.quantity;
    document.getElementById('fUnit').value = project.unit;
    document.getElementById('fBudget').value = project.budget;
    document.getElementById('fBudgetType').value = project.budgetType;
    // Set regional office first, then refresh units, then set unit
    document.getElementById('fRegionalOffice').value = project.regionalOffice;
    updateUnitDropdown();
    document.getElementById('fUnitOrg').value = project.unitOrg;
  } else {
    editingProjectId = null;
    title.textContent = 'เพิ่มโครงการใหม่';
  }

  modal.classList.add('active');
}

function closeProjectModal() {
  document.getElementById('projectModal').classList.remove('active');
}

function saveProject() {
  const data = {
    fiscalYear: Number(document.getElementById('fFiscalYear').value),
    type: document.getElementById('fType').value,
    subItem: document.getElementById('fSubItem').value === '__other__'
      ? document.getElementById('fSubItemCustom').value.trim()
      : document.getElementById('fSubItem').value,
    dimension: document.getElementById('fDimension').value.trim() || '-',
    moo: document.getElementById('fMoo').value.trim(),
    village: document.getElementById('fVillage').value.trim(),
    tambon: document.getElementById('fTambon').value.trim(),
    amphoe: document.getElementById('fAmphoe').value.trim(),
    province: document.getElementById('fProvince').value.trim(),
    quantity: Number(document.getElementById('fQuantity').value) || 0,
    unit: document.getElementById('fUnit').value.trim(),
    budget: Number(document.getElementById('fBudget').value) || 0,
    budgetType: document.getElementById('fBudgetType').value,
    regionalOffice: document.getElementById('fRegionalOffice').value,
    unitOrg: document.getElementById('fUnitOrg').value.trim(),
  };

  if (!data.subItem || !data.unit || !data.budget) {
    showToast('กรุณากรอกข้อมูลที่จำเป็นให้ครบถ้วน', 'error');
    return;
  }

  if (editingProjectId) {
    DB.updateProject(editingProjectId, data);
    showToast('แก้ไขโครงการสำเร็จ', 'success');
  } else {
    DB.addProject(data);
    showToast('เพิ่มโครงการสำเร็จ', 'success');
  }

  closeProjectModal();

  // Update UI based on active tab
  if (document.getElementById('page-projects').classList.contains('active')) {
    renderProjectsPage();
  } else if (document.getElementById('page-review').classList.contains('active')) {
    renderReviewPage();
  } else if (document.getElementById('page-dashboard').classList.contains('active')) {
    renderDashboard();
  }

  // Always update stats
  initDashboardFilters();
}

function editProject(id) {
  const project = DB.getProjects().find(p => p.id === id);
  if (!project) return;
  openProjectModal('edit', project);
}

function deleteProject(id) {
  if (!confirm('ยืนยันการลบโครงการนี้?')) return;
  DB.deleteProject(id);
  // Remove from selection if exists
  if (selectedProjectIds.has(id)) selectedProjectIds.delete(id);
  renderProjectsPage();
  showToast('ลบโครงการแล้ว', 'info');
}

function toggleProjectSelection(id) {
  if (selectedProjectIds.has(id)) {
    selectedProjectIds.delete(id);
  } else {
    selectedProjectIds.add(id);
  }
  renderProjectsPage();
}

function toggleSelectAll() {
  const projects = getFilteredProjects('projectSearch', 'projectAgencyFilter', 'projectUnitFilter');
  const selectAll = document.getElementById('selectAllProjects');

  if (selectAll.checked) {
    projects.forEach(p => selectedProjectIds.add(p.id));
  } else {
    projects.forEach(p => selectedProjectIds.delete(p.id));
  }
  renderProjectsPage();
}

function deleteSelectedProjects() {
  const count = selectedProjectIds.size;
  if (count === 0) return;

  if (!confirm(`ยืนยันการลบโครงการที่เลือกจำนวน ${count} โครงการ?`)) return;

  const ids = Array.from(selectedProjectIds);
  ids.forEach(id => DB.deleteProject(id));

  selectedProjectIds.clear();
  renderProjectsPage();
  initDashboardFilters(); // Update stats
  showToast(`ลบ ${count} โครงการเรียบร้อย`, 'success');
}

function clearAllProjects() {
  const count = DB.getProjects().length;
  if (count === 0) return;

  if (!confirm('⚠️ คำเตือน: คุณต้องการลบข้อมูลโครงการ "ทั้งหมด" ใช่หรือไม่?\n\nการกระทำนี้ไม่สามารถเรียกคืนข้อมูลได้')) return;
  if (!confirm('ยืนยันอีกครั้ง: ลบข้อมูลทั้งหมดจริงหรือไม่?')) return;

  DB.saveProjects([]);
  selectedProjectIds.clear();
  renderProjectsPage();
  renderDashboard();
  renderReviewPage();
  showToast('ล้างข้อมูลทั้งหมดเรียบร้อย', 'success');
}

function handleImportExcel(event) {
  const file = event.target.files[0];
  if (!file) return;
  const fiscalYear = Number(localStorage.getItem('pendingFiscalYear') || 2571);
  ExcelUtils.importExcel(file, (projects) => {
    // Assign fiscal year to all imported projects
    projects.forEach(p => p.fiscalYear = fiscalYear);
    DB.addProjects(projects);
    renderProjectsPage();
    initDashboardFilters();
    showToast(`นำเข้า ${projects.length} โครงการ (ปีงบประมาณ พ.ศ. ${fiscalYear}) สำเร็จ`, 'success');
    localStorage.removeItem('pendingFiscalYear');
  });
  event.target.value = '';
}

// ===== PAGE 3: REVIEW =====
function renderReviewPage() {
  const allProjects = getFilteredProjects(
    'reviewSearch',
    'reviewAgencyFilter',
    'reviewUnitFilter',
    'reviewFiscalYearFilter',
    'reviewTypeFilter',
    'reviewBudgetTypeFilter',
    'reviewStatusFilter'
  );
  const maxRound = getMaxRound(DB.getProjects());

  // Ensure current round is valid (allow maxRound + 1 for starting a new round)
  if (currentReviewRound > maxRound + 1) currentReviewRound = maxRound + 1;
  if (currentReviewRound < 1) currentReviewRound = 1;

  // Filter by round (use == in case of string vs number)
  const projects = allProjects.filter(p => (p.round || 1) == currentReviewRound);
  const container = document.getElementById('reviewContainer');

  // Header Controls (Round Selector & Pull Button)
  let headerControls = `
    <div class="review-controls" style="margin-bottom:20px;display:flex;gap:15px;align-items:center;background:var(--bg-card);padding:15px;border-radius:var(--radius);border:1px solid var(--border)">
      <div style="display:flex;align-items:center;gap:10px">
        <label style="font-weight:600">รอบการพิจารณา:</label>
        <select id="roundSelector" style="width:auto;min-width:120px" onchange="changeReviewRound(this.value)">
          ${Array.from({ length: maxRound }, (_, i) => i + 1).map(r =>
    `<option value="${r}" ${r === currentReviewRound ? 'selected' : ''}>ครั้งที่ ${r}</option>`
  ).join('')}
          <option value="${maxRound + 1}" ${currentReviewRound === (maxRound + 1) ? 'selected' : ''}>+ สู่รอบที่ ${maxRound + 1}</option>
        </select>
      </div>
  `;

  // Show "Pull Failed Projects" only if looking at a new/latest round
  if (currentReviewRound > 1) {
    headerControls += `
      <div style="margin-left:auto">
        <button class="btn btn-warning btn-sm" onclick="pullFailedProjects()">
          📥 ดึงโครงการ (🔴ไม่ผ่าน / 🟡ชี้แจงใหม่) มาพิจารณา
        </button>
      </div>
    `;
  }

  headerControls += `</div>`;

  let content = headerControls;

  if (projects.length === 0) {
    content += `<div class="empty-state"><div class="empty-icon">🔍</div><h3>ไม่พบโครงการในรอบที่ ${currentReviewRound}</h3><p>เลือก "สู่รอบถัดไป" และกด "ดึงโครงการ" เพื่อเริ่มพิจารณารอบใหม่</p></div>`;
    container.innerHTML = content;
    return;
  }

  const displayProjects = projects.slice(0, 50);
  content += displayProjects.map(p => {
    const t = PROJECT_TYPES.find(x => x.id === p.type);

    // History / Comparison Display — show all previous rounds
    let historyHtml = '';
    if (p.history && p.history.length > 0) {
      historyHtml = `
        <div class="history-info" style="margin-top:10px;padding:14px;background:#fefce8;border-radius:10px;font-size:13px;border:1px solid rgba(245,158,11,0.2)">
          <div style="font-weight:600;margin-bottom:10px;color:var(--accent-yellow);display:flex;align-items:center;gap:8px;cursor:pointer" onclick="this.nextElementSibling.style.display=this.nextElementSibling.style.display==='none'?'block':'none';this.querySelector('.toggle-icon').textContent=this.nextElementSibling.style.display==='none'?'▶':'▼'">
            <span class="toggle-icon">▼</span> 📜 ประวัติการพิจารณา (${p.history.length} รอบ)
          </div>
          <div>
      `;

      // Show each history entry as a timeline
      p.history.forEach((prev, idx) => {
        const prevStatus = REVIEW_STATUSES.find(s => s.id === prev.reviewStatus);
        const revisedDate = prev.revisedAt ? new Date(prev.revisedAt).toLocaleDateString('th-TH') : '-';

        // Build change details comparing to current project data
        let changes = [];

        // Budget change
        if (prev.budget !== undefined && prev.budget !== p.budget) {
          changes.push(`<span style="color:var(--text-muted)">งบประมาณ:</span> ${formatBudget(prev.budget)} <span style="color:var(--accent-yellow)">➡️</span> <span style="color:var(--accent-green)">${formatBudget(p.budget)}</span>`);
        }

        // Quantity change
        if (prev.quantity !== undefined && prev.quantity !== p.quantity) {
          const prevUnit = prev.unit || p.unit;
          changes.push(`<span style="color:var(--text-muted)">ปริมาณงาน:</span> ${Number(prev.quantity).toLocaleString()} ${prevUnit} <span style="color:var(--accent-yellow)">➡️</span> <span style="color:var(--accent-green)">${Number(p.quantity).toLocaleString()} ${p.unit}</span>`);
        }

        // SubItem change
        if (prev.subItem && prev.subItem !== p.subItem) {
          changes.push(`<span style="color:var(--text-muted)">รายการย่อย:</span> ${prev.subItem} <span style="color:var(--accent-yellow)">➡️</span> <span style="color:var(--accent-green)">${p.subItem}</span>`);
        }

        // Dimension change
        if (prev.dimension && prev.dimension !== p.dimension) {
          changes.push(`<span style="color:var(--text-muted)">มิติงาน:</span> ${prev.dimension} <span style="color:var(--accent-yellow)">➡️</span> <span style="color:var(--accent-green)">${p.dimension}</span>`);
        }

        // Location change
        const prevLoc = [prev.tambon, prev.amphoe, prev.province].filter(Boolean).join(' ');
        const currLoc = [p.tambon, p.amphoe, p.province].filter(Boolean).join(' ');
        if (prevLoc && prevLoc !== currLoc) {
          changes.push(`<span style="color:var(--text-muted)">พื้นที่:</span> ${prevLoc} <span style="color:var(--accent-yellow)">➡️</span> <span style="color:var(--accent-green)">${currLoc}</span>`);
        }

        const changesHtml = changes.length > 0
          ? changes.map(c => `<div style="padding:2px 0">📌 ${c}</div>`).join('')
          : '<div style="color:var(--text-muted);font-style:italic">ไม่มีการแก้ไขข้อมูลโครงการ</div>';

        historyHtml += `
          <div style="padding:10px 12px;margin-bottom:8px;background:#f8fafc;border-radius:8px;border-left:3px solid ${prevStatus?.color || '#64748b'}">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;flex-wrap:wrap;gap:6px">
              <div style="font-weight:600;color:var(--text-primary)">
                รอบที่ ${prev.round}
                <span class="badge" style="margin-left:6px;background:${(prevStatus?.color || '#64748b')}20;color:${prevStatus?.color || '#64748b'};border:1px solid ${(prevStatus?.color || '#64748b')}40;font-size:11px">
                  ${prevStatus?.icon || '⏳'} ${prevStatus?.label || 'รอการพิจารณา'}
                </span>
              </div>
              <span style="font-size:11px;color:var(--text-muted)">📅 ${revisedDate}</span>
            </div>
            ${prev.comment ? `<div style="margin-bottom:6px"><span style="color:var(--text-muted)">💬 ความเห็น:</span> <span style="color:var(--text-secondary)">"${prev.comment}"</span></div>` : ''}
            <div style="margin-top:6px;padding-top:6px;border-top:1px solid #e2e8f0">
              <div style="font-weight:500;color:var(--text-secondary);margin-bottom:4px">การเปลี่ยนแปลงข้อมูล:</div>
              ${changesHtml}
            </div>
          </div>
        `;
      });

      historyHtml += `</div></div>`;
    }

    return `
    <div class="review-card" data-id="${p.id}" id="rc-${p.id}" style="${p.reviewStatus ? `border-left: 5px solid ${REVIEW_STATUSES.find(s => s.id === p.reviewStatus)?.color || '#64748b'}` : 'border-left: 5px solid #64748b'}">
      <div class="review-card-header">
        <div>
          <div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap">
            <div class="review-card-title">${p.subItem}</div>
            <button class="btn btn-outline btn-sm" style="padding:2px 8px;font-size:11px" onclick="editProject('${p.id}')">✏️ แก้ไขข้อมูล</button>
            <span class="badge review-status-badge" style="background:${(REVIEW_STATUSES.find(s => s.id === p.reviewStatus)?.color || '#64748b')}20;color:${(REVIEW_STATUSES.find(s => s.id === p.reviewStatus)?.color || '#64748b')};border:1px solid ${(REVIEW_STATUSES.find(s => s.id === p.reviewStatus)?.color || '#64748b')}40">
              ${(REVIEW_STATUSES.find(s => s.id === p.reviewStatus)?.icon || '⏳')} ${(REVIEW_STATUSES.find(s => s.id === p.reviewStatus)?.label || 'รอการพิจารณา')}
            </span>
          </div>
          <div class="review-card-meta">
            ${typeBadge(p.type)} &nbsp; 
            <span class="badge badge-purple">${p.regionalOffice || '-'}</span> &nbsp;
            <span class="badge badge-gray">${p.unitOrg || '-'}</span> &nbsp;
            <span class="td-muted">${[p.moo ? `หมู่ ${p.moo}` : '', p.village, p.tambon, p.amphoe, p.province].filter(Boolean).join(' ')} | ${p.quantity.toLocaleString()} ${p.unit}</span>
          </div>
        </div>
        <div class="review-card-budget">${formatBudget(p.budget)}</div>
      </div>

      ${historyHtml}

      <div class="form-group" style="margin-bottom:12px;margin-top:12px">
        <div class="form-label">สถานะการพิจารณา (รอบที่ ${p.round || 1})</div>
        <div class="status-options">
          ${REVIEW_STATUSES.filter(s => s.id !== 'pending').map(s => `
            <label class="status-option opt-${s.id === 'green' ? 'green' : (s.id === 'adjust' || s.id === 'docs' || s.id === 'clarify') ? 'yellow' : 'red'}">
              <input type="radio" name="status-${p.id}" value="${s.id}" ${p.reviewStatus === s.id ? 'checked' : ''}>
              ${s.icon} ${s.label}
            </label>`).join('')}
        </div>
      </div>

      <div class="form-group">
        <div class="form-label">ข้อคิดเห็นของคณะกรรมการ</div>
        <textarea id="comment-${p.id}" placeholder="กรอกข้อคิดเห็น คำแนะนำ หรือเงื่อนไขการพิจารณา...">${p.comment || ''}</textarea>
      </div>

      <div style="margin-top:12px;display:flex;justify-content:flex-end">
        <button class="btn btn-primary btn-sm" onclick="saveReview('${p.id}')">💾 บันทึกการพิจารณา</button>
      </div>
    </div>`;
  }).join('');

  if (projects.length > 50) {
    content += `<div style="text-align:center;padding:15px;color:var(--text-muted)">แสดง 50 รายการจากทั้งหมด ${projects.length} รายการ (กรุณาใช้ค้นหาเพื่อดูเพิ่มเติม)</div>`;
  }

  container.innerHTML = content;

  // Update logic to handle visual updates
  displayProjects.forEach(p => {
    updateStatusOptionStyles(p.id);
    const radios = document.querySelectorAll(`input[name="status-${p.id}"]`);
    radios.forEach(r => r.addEventListener('change', () => {
      const statusId = r.value;
      const statusInfo = REVIEW_STATUSES.find(s => s.id === statusId);
      const card = document.getElementById(`rc-${p.id}`);
      const badge = card?.querySelector('.review-status-badge');

      if (card && statusInfo) {
        card.style.borderLeftColor = statusInfo.color;
      }
      if (badge && statusInfo) {
        badge.style.color = statusInfo.color;
        badge.style.background = `${statusInfo.color}20`;
        badge.style.borderColor = `${statusInfo.color}40`;
        badge.innerHTML = `${statusInfo.icon} ${statusInfo.label}`;
      }
      updateStatusOptionStyles(p.id);
    }));
  });
}

function changeReviewRound(round) {
  currentReviewRound = Number(round);
  renderReviewPage();
}

function pullFailedProjects() {
  if (currentReviewRound < 2) return;

  const allProjects = DB.getProjects();

  // Find projects in ANY previous round that have red or clarify status
  // and haven't already been pulled into the current round or later
  const candidates = allProjects.filter(p => {
    const pRound = p.round || 1;
    // Must be from a previous round
    if (pRound >= currentReviewRound) return false;

    // Must have a status that requires further review (red, clarify)
    if (!['red', 'clarify'].includes(p.reviewStatus)) return false;

    // Check history to ensure this exact iteration hasn't already been pulled to this target round
    // If we are pulling to round 3, and history shows it was already pulled to round 3 or later, skip it.
    if (p.history && p.history.some(h => (h.round || 1) >= currentReviewRound)) return false;

    return true;
  });

  if (candidates.length === 0) {
    showToast(`ไม่พบโครงการที่ต้องพิจารณาใหม่ (แดง/ชี้แจงใหม่) จากรอบก่อนหน้า`, 'info');
    return;
  }

  // Group by round for the confirmation message 
  const byRound = {};
  candidates.forEach(p => {
    const r = p.round || 1;
    if (!byRound[r]) byRound[r] = [];
    byRound[r].push(p);
  });

  let detail = Object.entries(byRound).map(([r, ps]) => {
    const redCount = ps.filter(p => p.reviewStatus === 'red').length;
    const clarifyCount = ps.filter(p => p.reviewStatus === 'clarify').length;

    let parts = [];
    if (redCount > 0) parts.push(`🔴 ไม่ผ่าน ${redCount}`);
    if (clarifyCount > 0) parts.push(`🟡 ชี้แจงใหม่ ${clarifyCount}`);
    return `  รอบที่ ${r}: ${parts.join(', ')}`;
  }).join('\n');

  if (!confirm(`พบ ${candidates.length} โครงการที่พร้อมพิจารณาใหม่:\n\n${detail}\n\nต้องการนำมาพิจารณาในรอบที่ ${currentReviewRound} หรือไม่?`)) return;

  let count = 0;
  // Use the same copy of projects for updates
  const projectsToSave = DB.getProjects();

  candidates.forEach(p => {
    const idx = projectsToSave.findIndex(x => x.id === p.id);
    if (idx !== -1) {
      const proj = projectsToSave[idx];
      // Save current state to history
      const historyItem = {
        round: proj.round || 1,
        reviewStatus: proj.reviewStatus,
        comment: proj.comment,
        budget: proj.budget,
        quantity: proj.quantity,
        unit: proj.unit,
        subItem: proj.subItem,
        type: proj.type,
        dimension: proj.dimension,
        province: proj.province,
        amphoe: proj.amphoe,
        tambon: proj.tambon,
        revisedAt: new Date().toISOString(),
        // Record which round it was pulled TO
        pulledToRound: currentReviewRound
      };
      if (!proj.history) proj.history = [];
      proj.history.push(historyItem);

      // Update for the target round
      proj.round = currentReviewRound;
      proj.reviewStatus = 'pending';
      proj.comment = '';
      count++;
    }
  });

  // Save all at once
  if (count > 0) {
    DB.saveProjects(projectsToSave);
  }

  renderReviewPage();
  showToast(`ดึง ${count} โครงการมาพิจารณาใหม่ในรอบที่ ${currentReviewRound} สำเร็จ`, 'success');
}

function updateStatusOptionStyles(projectId) {
  const selected = document.querySelector(`input[name="status-${projectId}"]:checked`);
  const options = document.querySelectorAll(`input[name="status-${projectId}"]`);
  options.forEach(opt => {
    const label = opt.closest('.status-option');
    if (!label) return;
    if (opt.checked) {
      label.style.fontWeight = '600';
      label.style.background = 'var(--bg-card-hover)';
    } else {
      label.style.fontWeight = '400';
      label.style.background = 'transparent';
    }
  });
}

function saveReview(projectId) {
  const selected = document.querySelector(`input[name="status-${projectId}"]:checked`);
  const comment = document.getElementById(`comment-${projectId}`).value;
  const status = selected ? selected.value : (DB.getProjects().find(p => p.id === projectId)?.reviewStatus || 'pending');

  DB.updateReview(projectId, status, comment);
  showToast('บันทึกการพิจารณาสำเร็จ', 'success');

  // Update only this card's UI instead of full re-render to avoid losing other unsaved inputs
  updateReviewCardUI(projectId, status);
}

function updateReviewCardUI(projectId, status) {
  const statusData = REVIEW_STATUSES.find(s => s.id === status) || { id: 'pending', label: 'รอการพิจารณา', color: '#64748b', icon: '⏳' };

  // Find card by data-id
  const container = document.querySelector(`.review-card[data-id="${projectId}"]`);
  if (container) {
    // 1. Update Badge
    const badge = container.querySelector('.review-status-badge');
    if (badge) {
      badge.innerHTML = `${statusData.icon} ${statusData.label}`;
      badge.style.background = `${statusData.color}20`;
      badge.style.color = statusData.color;
      badge.style.borderColor = `${statusData.color}40`;
    }

    // 2. Update Card Border
    container.style.borderLeft = `5px solid ${statusData.color}`;
  }
}

function saveAllReviews() {
  // To ensure we capture ALL changes made in the current round (even if some are currently filtered out of view),
  // we could iterate through all projects in the round. 
  // However, the DOM only contains elements for projects that are CURRENTLY RENDERED/MATCHING FILTERS.
  // Thus, it is more reliable to iterate ALL projects in the current round and check if their elements exist.
  const allInRound = DB.getProjects().filter(p => (p.round || 1) == currentReviewRound);

  const updates = [];
  allInRound.forEach(p => {
    // Check if the project card inputs exist in the DOM
    const selected = document.querySelector(`input[name="status-${p.id}"]:checked`);
    const commentEl = document.getElementById(`comment-${p.id}`);

    // If neither exists, this project wasn't rendered (likely filtered out or beyond the 50 limit)
    // We skip it because we can't reliably read "new" unsaved browser state for it.
    if (!selected && !commentEl) return;

    // Status: selected value, or current status if not selected (e.g. still pending)
    const status = selected ? selected.value : p.reviewStatus;
    const comment = commentEl ? commentEl.value : p.comment;

    if (status !== p.reviewStatus || comment !== p.comment) {
      updates.push({ id: p.id, status, comment });
    }
  });

  if (updates.length > 0) {
    DB.updateReviews(updates);

    // Realtime UI Update: Update each card individually instead of full re-render
    updates.forEach(upd => {
      updateReviewCardUI(upd.id, upd.status);
    });

    showToast(`บันทึกการพิจารณา ${updates.length} โครงการสำเร็จ`, 'success');
  } else {
    showToast('ไม่มีการเปลี่ยนแปลง', 'info');
  }
}

// ===== PAGE 4: REPORT =====
function renderReportPage() {
  const fySel = document.getElementById('reportFiscalYearFilter');
  const agSel = document.getElementById('reportAgencyFilter');
  const unitSel = document.getElementById('reportUnitFilter');
  const roundSel = document.getElementById('reportRoundFilter');

  const rebuildReportFilters = () => {
    const allProjects = DB.getProjects();
    let currentAgency = agSel.value;
    if (currentUser && currentUser.role === 'user') currentAgency = currentUser.responsibility;
    if (currentAgency === 'ทุกภาค') currentAgency = '';

    const currentVals = {
      fy: fySel.value,
      agency: currentAgency,
      unit: unitSel.value,
      round: roundSel.value
    };

    const getSubset = (ignoreField) => {
      let filtered = allProjects.filter(p => {
        if (ignoreField !== 'fy' && currentVals.fy && String(p.fiscalYear) !== currentVals.fy) return false;
        if (ignoreField !== 'agency' && currentVals.agency && p.regionalOffice !== currentVals.agency) return false;
        if (ignoreField !== 'unit' && currentVals.unit && p.unitOrg !== currentVals.unit) return false;
        if (ignoreField !== 'round' && currentVals.round && String(p.round || 1) !== currentVals.round) return false;
        return true;
      });
      return filtered;
    };

    // 1. MASTER LISTS: Derive from project data
    let masterOffices = [...new Set(allProjects.map(p => p.regionalOffice).filter(Boolean))].sort();
    let masterFy = [...new Set(allProjects.map(p => p.fiscalYear).filter(Boolean))].sort();
    let masterRounds = [...new Set(allProjects.map(p => p.round || 1))];
    if (masterRounds.length === 0) masterRounds.push(1);
    masterRounds.sort((a, b) => a - b);

    let masterUnits = currentVals.agency ?
      [...new Set(allProjects.filter(p => p.regionalOffice === currentVals.agency).map(p => p.unitOrg).filter(Boolean))].sort() :
      [...new Set(allProjects.map(p => p.unitOrg).filter(Boolean))].sort();


    // 2. Rebuild Agency
    if (!currentUser || currentUser.role !== 'user') {
      const agSubset = getSubset('agency');
      const availableAgencies = [...new Set(agSubset.map(p => p.regionalOffice).filter(Boolean))];
      agSel.innerHTML = '<option value="">ภาพรวมทั้งหมด</option>' + masterOffices.map(a => {
        const count = availableAgencies.includes(a) ? 1 : 0;
        const cls = count === 0 ? 'class="txt-muted"' : '';
        const label = a;
        return `<option value="${a}" ${cls}>${label}</option>`;
      }).join('');
      if (currentVals.agency && masterOffices.includes(currentVals.agency)) agSel.value = currentVals.agency;
      else agSel.value = "";
      agSel.disabled = false;
    } else {
      agSel.innerHTML = `<option value="${currentUser.responsibility}">${currentUser.responsibility}</option>`;
      agSel.value = currentUser.responsibility;
      agSel.disabled = true;
    }

    // 3. Rebuild Unit
    const unitSubset = getSubset('unit');
    const availableUnits = [...new Set(unitSubset.map(p => p.unitOrg).filter(Boolean))];
    unitSel.innerHTML = '<option value="">ทุกหน่วย</option>' + masterUnits.map(u => {
      const count = availableUnits.includes(u) ? 1 : 0;
      const cls = count === 0 ? 'class="txt-muted"' : '';
      const label = u;
      return `<option value="${u}" ${cls}>${label}</option>`;
    }).join('');
    if (currentVals.unit && masterUnits.includes(currentVals.unit)) unitSel.value = currentVals.unit;
    else unitSel.value = "";

    // 4. Rebuild Rounds
    const roundSubset = getSubset('round');
    const availableRounds = [...new Set(roundSubset.map(p => p.round || 1))];
    roundSel.innerHTML = '<option value="">ทุกรอบการพิจารณา</option>' + masterRounds.map(r => {
      const count = availableRounds.includes(r) ? 1 : 0;
      const cls = count === 0 ? 'class="txt-muted"' : '';
      const label = `ครั้งที่ ${r}`;
      return `<option value="${r}" ${cls}>${label}</option>`;
    }).join('');
    if (currentVals.round && masterRounds.map(String).includes(currentVals.round)) roundSel.value = currentVals.round;
    else roundSel.value = "";
  };

  const onReportChange = () => { rebuildReportFilters(); updateReportPreview(); };

  fySel.onchange = onReportChange;
  agSel.onchange = onReportChange;
  unitSel.onchange = onReportChange;
  roundSel.onchange = onReportChange;

  // Initial build and SMART DEFAULT
  rebuildReportFilters();

  if (!fySel.value) {
    const allProjects = DB.getProjects();
    const availableFys = [...new Set(allProjects.map(p => p.fiscalYear).filter(Boolean))].sort((a, b) => b - a);
    if (availableFys.length > 0) {
      fySel.value = availableFys[0];
      rebuildReportFilters();
    }
  }

  updateReportPreview();
}

function updateReportPreview() {
  const fyFilter = document.getElementById('reportFiscalYearFilter').value;
  let officeFilter = document.getElementById('reportAgencyFilter').value;
  if (currentUser && currentUser.role === 'user') officeFilter = currentUser.responsibility;

  const unitFilter = document.getElementById('reportUnitFilter').value;
  const roundFilter = document.getElementById('reportRoundFilter').value;

  let projects = DB.getProjects();
  if (fyFilter) projects = projects.filter(p => String(p.fiscalYear) === fyFilter);
  if (officeFilter) projects = projects.filter(p => p.regionalOffice === officeFilter);
  if (unitFilter) projects = projects.filter(p => p.unitOrg === unitFilter);
  if (roundFilter) projects = projects.filter(p => (p.round || 1) === Number(roundFilter));

  const totalBudget = projects.reduce((s, p) => s + Number(p.budget || 0), 0);

  let title = 'รายงานสรุปโครงการทั้งหมด';
  if (fyFilter) title = `รายงานสรุป พ.ศ. ${fyFilter}`;
  else title = 'รายงานสรุปโครงการทั้งหมด';
  if (officeFilter && unitFilter) title += ` - ${officeFilter} (${unitFilter})`;
  else if (officeFilter) title += ` - ${officeFilter}`;
  else if (unitFilter) title += ` - ${unitFilter}`;
  if (roundFilter) title += ` (ครั้งที่ ${roundFilter})`;

  document.getElementById('reportTitle').textContent = title;
  document.getElementById('reportTotal').textContent = projects.length + ' โครงการ';
  document.getElementById('reportBudget').textContent = formatBudget(totalBudget);

  // Type summary
  const typeSummary = document.getElementById('reportTypeSummary');
  typeSummary.innerHTML = PROJECT_TYPES.map(t => {
    const tp = projects.filter(p => p.type === t.id);
    const tb = tp.reduce((s, p) => s + Number(p.budget || 0), 0);
    return `<tr>
      <td>${typeBadge(t.id)}</td>
      <td style="text-align:center">${tp.length}</td>
      <td class="budget-num">${formatBudget(tb)}</td>
    </tr>`;
  }).join('');

  // Status summary
  const statusSummary = document.getElementById('reportStatusSummary');
  // Include Clarify in summary
  const allStatuses = [...REVIEW_STATUSES, { id: 'pending', label: 'รอการพิจารณา', icon: '⏳' }];
  statusSummary.innerHTML = allStatuses.map(s => {
    // Check pending 
    const isPending = s.id === 'pending';
    const sp = projects.filter(p => isPending ? !p.reviewStatus || p.reviewStatus === 'pending' : p.reviewStatus === s.id);

    const sb = sp.reduce((sum, p) => sum + Number(p.budget || 0), 0);
    return `<tr>
      <td>${s.icon} ${s.label}</td>
      <td style="text-align:center">${sp.length}</td>
      <td class="budget-num">${formatBudget(sb)}</td>
    </tr>`;
  }).join('');
}

function exportReport() {
  const fyFilter = document.getElementById('reportFiscalYearFilter').value;
  const officeFilter = document.getElementById('reportAgencyFilter').value;
  const unitFilter = document.getElementById('reportUnitFilter').value;
  const roundFilter = document.getElementById('reportRoundFilter').value;
  let projects = DB.getProjects();
  if (fyFilter) projects = projects.filter(p => String(p.fiscalYear) === fyFilter);
  if (officeFilter) projects = projects.filter(p => p.regionalOffice === officeFilter);
  if (unitFilter) projects = projects.filter(p => p.unitOrg === unitFilter);
  if (roundFilter) projects = projects.filter(p => (p.round || 1) === Number(roundFilter));

  if (projects.length === 0) {
    showToast('ไม่มีข้อมูลสำหรับออกรายงาน', 'error');
    return;
  }
  const roundLabel = roundFilter ? ` (ครั้งที่ ${roundFilter})` : '';
  ExcelUtils.exportReport(projects, officeFilter, unitFilter, roundLabel);
  showToast('ออกรายงาน Excel สำเร็จ', 'success');
}

// ===== INIT =====




// ===== CLEAR ALL =====

// ===== PAGE 5: DATABASE MANAGEMENT =====
let selectedTypeId = null;
let selectedOfficeId = null;

function renderDbManagePage() {
  DB.getProjectTypes(); // refresh
  DB.getRegionalOffices(); // refresh
  renderTypeList();
  if (selectedTypeId) {
    renderSubItemList(selectedTypeId);
  }
  renderOfficeList();
  if (selectedOfficeId) {
    renderUnitList(selectedOfficeId);
  }
}

function renderTypeList() {
  const types = DB.getProjectTypes();
  const list = document.getElementById('typeList');

  if (types.length === 0) {
    list.innerHTML = '<div class="empty-state" style="padding:40px"><div class="empty-icon">📁</div><h3>ยังไม่มีประเภทโครงการ</h3><p>กดปุ่ม "เพิ่มประเภท" เพื่อเริ่มต้น</p></div>';
    return;
  }

  list.innerHTML = types.map(t => {
    const subCount = DB.getSubItemsForType(t.id).length;
    const isActive = selectedTypeId === t.id;
    return `
    <div class="db-item ${isActive ? 'active' : ''}" onclick="selectType('${t.id}')">
      <div class="db-item-color" style="background:${t.color}"></div>
      <div class="db-item-info">
        <div class="db-item-id">${t.id}</div>
        <div class="db-item-label">${t.label}</div>
      </div>
      <div class="db-item-count">${subCount} รายการย่อย</div>
      <div class="db-item-actions">
        <button class="db-action-btn" onclick="event.stopPropagation();editType('${t.id}')" title="แก้ไข">✏️</button>
        <button class="db-action-btn delete" onclick="event.stopPropagation();removeType('${t.id}')" title="ลบ">🗑</button>
      </div>
    </div>`;
  }).join('');
}

function selectType(typeId) {
  selectedTypeId = typeId;
  renderTypeList();
  renderSubItemList(typeId);
  document.getElementById('addSubItemBtn').style.display = 'inline-flex';
}

function renderSubItemList(typeId) {
  const type = PROJECT_TYPES.find(t => t.id === typeId);
  const subItems = DB.getSubItemsForType(typeId);
  const list = document.getElementById('subItemList');
  const titleEl = document.getElementById('subItemTitle');

  titleEl.innerHTML = `📋 รายการย่อย: <span style="color:${type?.color || '#fff'}">${type?.label || typeId}</span>`;

  if (subItems.length === 0) {
    list.innerHTML = '<div class="empty-state" style="padding:40px"><div class="empty-icon">📝</div><h3>ยังไม่มีรายการย่อย</h3><p>กดปุ่ม "เพิ่มรายการย่อย" เพื่อเริ่มต้น</p></div>';
    return;
  }

  list.innerHTML = subItems.map((s, i) => `
    <div class="db-subitem">
      <div class="db-subitem-num">${i + 1}</div>
      <div class="db-subitem-name">${s}</div>
      <div class="db-item-actions">
        <button class="db-action-btn" onclick="editSubItem('${typeId}','${s.replace(/'/g, "\\'")}')" title="แก้ไข">✏️</button>
        <button class="db-action-btn delete" onclick="removeSubItem('${typeId}','${s.replace(/'/g, "\\'")}')" title="ลบ">🗑</button>
      </div>
    </div>`).join('');
}

// ---- Type CRUD ----
function showAddTypeForm() {
  document.getElementById('addTypeForm').style.display = 'block';
  document.getElementById('newTypeId').value = '';
  document.getElementById('newTypeLabel').value = '';
  document.getElementById('newTypeId').focus();
}

function hideAddTypeForm() {
  document.getElementById('addTypeForm').style.display = 'none';
}

function confirmAddType() {
  const id = document.getElementById('newTypeId').value.trim();
  const label = document.getElementById('newTypeLabel').value.trim();
  const color = document.getElementById('newTypeColor').value;

  if (!id || !label) {
    showToast('กรุณากรอกรหัสและชื่อประเภท', 'error');
    return;
  }

  if (!DB.addProjectType({ id, label, color })) {
    showToast('รหัสนี้มีอยู่แล้ว', 'error');
    return;
  }

  hideAddTypeForm();
  renderTypeList();
  showToast('เพิ่มประเภทโครงการสำเร็จ', 'success');
}

function editType(id) {
  const type = PROJECT_TYPES.find(t => t.id === id);
  if (!type) return;

  const newLabel = prompt('แก้ไขชื่อประเภทโครงการ:', type.label);
  if (newLabel === null) return;
  if (!newLabel.trim()) {
    showToast('ชื่อประเภทต้องไม่เป็นค่าว่าง', 'error');
    return;
  }

  DB.updateProjectType(id, { label: newLabel.trim() });
  renderTypeList();
  if (selectedTypeId === id) renderSubItemList(id);
  showToast('แก้ไขประเภทโครงการสำเร็จ', 'success');
}

function removeType(id) {
  const type = PROJECT_TYPES.find(t => t.id === id);
  if (!type) return;

  // Check if any projects are using this type
  const projects = DB.getProjects();
  const usedCount = projects.filter(p => p.type === id).length;
  let msg = `ยืนยันการลบประเภท "${type.label}"?`;
  if (usedCount > 0) {
    msg += `\n\n⚠️ มีโครงการที่ใช้ประเภทนี้อยู่ ${usedCount} โครงการ`;
  }
  if (!confirm(msg)) return;

  DB.deleteProjectType(id);
  if (selectedTypeId === id) {
    selectedTypeId = null;
    document.getElementById('subItemList').innerHTML = '<div class="empty-state" style="padding:40px"><div class="empty-icon">👈</div><h3>เลือกประเภทโครงการ</h3><p>เลือกประเภทโครงการทางซ้ายเพื่อดูและจัดการรายการย่อย</p></div>';
    document.getElementById('subItemTitle').textContent = '📋 รายการย่อย';
    document.getElementById('addSubItemBtn').style.display = 'none';
  }
  renderTypeList();
  showToast('ลบประเภทโครงการสำเร็จ', 'success');
}

// ---- Sub-Item CRUD ----
function showAddSubItemForm() {
  document.getElementById('addSubItemForm').style.display = 'block';
  document.getElementById('newSubItemName').value = '';
  document.getElementById('newSubItemName').focus();
}

function hideAddSubItemForm() {
  document.getElementById('addSubItemForm').style.display = 'none';
}

function confirmAddSubItem() {
  if (!selectedTypeId) {
    showToast('กรุณาเลือกประเภทโครงการก่อน', 'error');
    return;
  }
  const name = document.getElementById('newSubItemName').value.trim();
  if (!name) {
    showToast('กรุณากรอกชื่อรายการย่อย', 'error');
    return;
  }

  if (!DB.addSubItem(selectedTypeId, name)) {
    showToast('รายการนี้มีอยู่แล้ว', 'error');
    return;
  }

  hideAddSubItemForm();
  renderSubItemList(selectedTypeId);
  renderTypeList(); // update count
  showToast('เพิ่มรายการย่อยสำเร็จ', 'success');
}

function editSubItem(typeId, oldName) {
  const newName = prompt('แก้ไขรายการย่อย:', oldName);
  if (newName === null) return;
  if (!newName.trim()) {
    showToast('ชื่อรายการย่อยต้องไม่เป็นค่าว่าง', 'error');
    return;
  }
  if (!DB.updateSubItem(typeId, oldName, newName.trim())) {
    showToast('ชื่อนี้ซ้ำกับรายการที่มีอยู่แล้ว', 'error');
    return;
  }
  renderSubItemList(typeId);
  showToast('แก้ไขรายการย่อยสำเร็จ', 'success');
}

function removeSubItem(typeId, name) {
  if (!confirm(`ยืนยันการลบ "${name}"?`)) return;
  DB.deleteSubItem(typeId, name);
  renderSubItemList(typeId);
  renderTypeList(); // update count
  showToast('ลบรายการย่อยสำเร็จ', 'success');
}

// ===== REGIONAL OFFICE MANAGEMENT =====
function renderOfficeList() {
  const offices = DB.getRegionalOffices();
  const list = document.getElementById('officeList');

  if (offices.length === 0) {
    list.innerHTML = '<div class="empty-state" style="padding:40px"><div class="empty-icon">🏢</div><h3>ยังไม่มีภาค</h3><p>กดปุ่ม "เพิ่มภาค" เพื่อเริ่มต้น</p></div>';
    return;
  }

  list.innerHTML = offices.map(name => {
    const unitCount = DB.getUnitsForOffice(name).length;
    const isActive = selectedOfficeId === name;
    return `
    <div class="db-item ${isActive ? 'active' : ''}" onclick="selectOffice('${name.replace(/'/g, "\\'")}')">
      <div class="db-item-color" style="background:#6366f1"></div>
      <div class="db-item-info">
        <div class="db-item-label">${name}</div>
      </div>
      <div class="db-item-count">${unitCount} หน่วย</div>
      <div class="db-item-actions">
        <button class="db-action-btn" onclick="event.stopPropagation();editOffice('${name.replace(/'/g, "\\'")}')" title="แก้ไข">✏️</button>
        <button class="db-action-btn delete" onclick="event.stopPropagation();removeOffice('${name.replace(/'/g, "\\'")}')" title="ลบ">🗑</button>
      </div>
    </div>`;
  }).join('');
}

function selectOffice(name) {
  selectedOfficeId = name;
  renderOfficeList();
  renderUnitList(name);
  document.getElementById('addUnitBtn').style.display = 'inline-flex';
}

function renderUnitList(officeName) {
  const units = DB.getUnitsForOffice(officeName);
  const list = document.getElementById('unitList');
  const titleEl = document.getElementById('unitTitle');

  titleEl.innerHTML = `📋 หน่วย: <span style="color:#818cf8">${officeName}</span>`;

  if (units.length === 0) {
    list.innerHTML = '<div class="empty-state" style="padding:40px"><div class="empty-icon">📝</div><h3>ยังไม่มีหน่วย</h3><p>กดปุ่ม "เพิ่มหน่วย" เพื่อเริ่มต้น</p></div>';
    return;
  }

  list.innerHTML = units.map((u, i) => `
    <div class="db-subitem">
      <div class="db-subitem-num">${i + 1}</div>
      <div class="db-subitem-name">${u}</div>
      <div class="db-item-actions">
        <button class="db-action-btn" onclick="editUnit('${officeName.replace(/'/g, "\\'")}','${u.replace(/'/g, "\\'")}')" title="แก้ไข">✏️</button>
        <button class="db-action-btn delete" onclick="removeUnit('${officeName.replace(/'/g, "\\'")}','${u.replace(/'/g, "\\'")}')" title="ลบ">🗑</button>
      </div>
    </div>`).join('');
}

// ---- Office CRUD ----
function showAddOfficeForm() {
  document.getElementById('addOfficeForm').style.display = 'block';
  document.getElementById('newOfficeName').value = '';
  document.getElementById('newOfficeName').focus();
}

function hideAddOfficeForm() {
  document.getElementById('addOfficeForm').style.display = 'none';
}

function confirmAddOffice() {
  const name = document.getElementById('newOfficeName').value.trim();
  if (!name) {
    showToast('กรุณากรอกชื่อภาค', 'error');
    return;
  }
  if (!DB.addRegionalOffice(name)) {
    showToast('ภาคนี้มีอยู่แล้ว', 'error');
    return;
  }
  hideAddOfficeForm();
  renderOfficeList();
  // Refresh the regional office dropdown in the project form
  refreshRegionalOfficeDropdown();
  showToast('เพิ่มภาคสำเร็จ', 'success');
}

function editOffice(oldName) {
  const newName = prompt('แก้ไขชื่อภาค:', oldName);
  if (newName === null) return;
  if (!newName.trim()) {
    showToast('ชื่อภาคต้องไม่เป็นค่าว่าง', 'error');
    return;
  }
  if (!DB.updateRegionalOffice(oldName, newName.trim())) {
    showToast('ชื่อนี้ซ้ำกับภาคที่มีอยู่แล้ว', 'error');
    return;
  }
  if (selectedOfficeId === oldName) selectedOfficeId = newName.trim();
  renderOfficeList();
  if (selectedOfficeId === newName.trim()) renderUnitList(newName.trim());
  refreshRegionalOfficeDropdown();
  showToast('แก้ไขภาคสำเร็จ', 'success');
}

function removeOffice(name) {
  const projects = DB.getProjects();
  const usedCount = projects.filter(p => p.regionalOffice === name).length;
  let msg = `ยืนยันการลบ "${name}"?`;
  if (usedCount > 0) {
    msg += `\n\n⚠️ มีโครงการที่ใช้ภาคนี้อยู่ ${usedCount} โครงการ`;
  }
  if (!confirm(msg)) return;

  DB.deleteRegionalOffice(name);
  if (selectedOfficeId === name) {
    selectedOfficeId = null;
    document.getElementById('unitList').innerHTML = '<div class="empty-state" style="padding:40px"><div class="empty-icon">👈</div><h3>เลือกภาค</h3><p>เลือกภาคทางซ้ายเพื่อดูและจัดการหน่วย</p></div>';
    document.getElementById('unitTitle').textContent = '📋 หน่วย';
    document.getElementById('addUnitBtn').style.display = 'none';
  }
  renderOfficeList();
  refreshRegionalOfficeDropdown();
  showToast('ลบภาคสำเร็จ', 'success');
}

// ---- Unit CRUD ----
function showAddUnitForm() {
  document.getElementById('addUnitForm').style.display = 'block';
  document.getElementById('newUnitName').value = '';
  document.getElementById('newUnitName').focus();
}

function hideAddUnitForm() {
  document.getElementById('addUnitForm').style.display = 'none';
}

function confirmAddUnit() {
  if (!selectedOfficeId) {
    showToast('กรุณาเลือกภาคก่อน', 'error');
    return;
  }
  const name = document.getElementById('newUnitName').value.trim();
  if (!name) {
    showToast('กรุณากรอกชื่อหน่วย', 'error');
    return;
  }
  if (!DB.addUnit(selectedOfficeId, name)) {
    showToast('หน่วยนี้มีอยู่แล้ว', 'error');
    return;
  }
  hideAddUnitForm();
  renderUnitList(selectedOfficeId);
  renderOfficeList(); // update count
  showToast('เพิ่มหน่วยสำเร็จ', 'success');
}

function editUnit(officeName, oldName) {
  const newName = prompt('แก้ไขหน่วย:', oldName);
  if (newName === null) return;
  if (!newName.trim()) {
    showToast('ชื่อหน่วยต้องไม่เป็นค่าว่าง', 'error');
    return;
  }
  if (!DB.updateUnit(officeName, oldName, newName.trim())) {
    showToast('ชื่อนี้ซ้ำกับหน่วยที่มีอยู่แล้ว', 'error');
    return;
  }
  renderUnitList(officeName);
  showToast('แก้ไขหน่วยสำเร็จ', 'success');
}

function removeUnit(officeName, name) {
  if (!confirm(`ยืนยันการลบ "${name}"?`)) return;
  DB.deleteUnit(officeName, name);
  renderUnitList(officeName);
  renderOfficeList(); // update count
  showToast('ลบหน่วยสำเร็จ', 'success');
}

// Refresh regional office dropdown(s) when offices are modified
function refreshRegionalOfficeDropdown() {
  const offices = DB.getRegionalOffices();
  const fRegionalOffice = document.getElementById('fRegionalOffice');
  if (fRegionalOffice) {
    fRegionalOffice.innerHTML = offices.map(r => `<option value="${r}">${r}</option>`).join('');
  }
}

// ---- Export/Import DB ----
function downloadDbTemplate() {
  ExcelUtils.exportDbTemplate();
}

function handleImportDbExcel(event) {
  const file = event.target.files[0];
  if (!file) return;

  ExcelUtils.importDbExcel(file, (parsedData) => {
    if (parsedData.types && parsedData.types.length > 0) {
      if (confirm('พบข้อมูลในไฟล์ Excel ต้องการนำเข้าแล้วทับข้อมูลเดิมหรือไม่?')) {
        DB.saveProjectTypes(parsedData.types);
        DB.saveSubItems(parsedData.subs);
        DB.saveRegionalOffices(parsedData.offices);
        DB.saveUnits(parsedData.units);

        selectedTypeId = null;
        selectedOfficeId = null;
        renderDbManagePage();
        refreshRegionalOfficeDropdown();
        showToast('นำเข้าข้อมูลฐานข้อมูลสำเร็จ', 'success');
      }
    } else {
      showToast('ไม่พบข้อมูลที่ถูกต้องในไฟล์ (ต้องการชีท "ประเภทโครงการ")', 'error');
    }
  });

  // reset file input
  event.target.value = '';
}

// ===== PAGE 6: USERS MANAGEMENT =====
function renderUsersPage() {
  const users = DB.getUsers();
  const tbody = document.querySelector('#usersTable tbody');

  if (users.length === 0) {
    tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;padding:20px;color:var(--text-muted)">ไม่พบข้อมูลผู้ใช้งาน</td></tr>';
    return;
  }

  tbody.innerHTML = users.map(u => {
    let roleBadge = '';
    if (u.role === 'admin') roleBadge = '<span class="badge badge-purple">Admin</span>';
    else if (u.role === 'super user') roleBadge = '<span class="badge badge-blue">Super User</span>';
    else roleBadge = '<span class="badge badge-gray">User</span>';

    return `
      <tr>
        <td><strong>${u.username}</strong></td>
        <td>${u.name}</td>
        <td>${roleBadge}</td>
        <td>${u.responsibility || 'ทุกภาค'}</td>
        <td class="td-muted">${u.createdAt || '-'}</td>
        <td>
          <button class="btn btn-outline btn-sm" onclick="editUser('${u.id}')">✏️ แก้ไข</button>
          ${u.id !== 'U001' ? `<button class="btn btn-danger btn-sm" onclick="removeUser('${u.id}')">🗑️ ลบ</button>` : ''}
        </td>
      </tr>
    `;
  }).join('');
}

function openUserModal(user = null) {
  const modal = document.getElementById('userModal');
  const title = document.getElementById('userModalTitle');
  const form = document.getElementById('userForm');

  // Populate Responsibility dropdown
  const respSelect = document.getElementById('fUserResponsibility');
  const offices = DB.getRegionalOffices();
  respSelect.innerHTML = '<option value="ทุกภาค">ทุกภาค (ไม่มีการกรอง)</option>' +
    offices.map(o => `<option value="${o}">${o}</option>`).join('');

  if (user) {
    title.textContent = 'แก้ไขข้อมูลผู้ใช้งาน';
    document.getElementById('fUserId').value = user.id;
    document.getElementById('fUserUsername').value = user.username;
    document.getElementById('fUserPassword').value = user.password;
    document.getElementById('fUserRole').value = user.role;
    document.getElementById('fUserName').value = user.name;
    document.getElementById('fUserResponsibility').value = user.responsibility || 'ทุกภาค';
  } else {
    title.textContent = 'เพิ่มผู้ใช้งานใหม่';
    form.reset();
    document.getElementById('fUserId').value = '';
    document.getElementById('fUserRole').value = 'user';
    document.getElementById('fUserResponsibility').value = 'ทุกภาค';
  }

  handleUserRoleChange();
  modal.classList.add('active');
}

function closeUserModal() {
  document.getElementById('userModal').classList.remove('active');
}

function handleUserRoleChange() {
  const role = document.getElementById('fUserRole').value;
  const respSelect = document.getElementById('fUserResponsibility');

  if (role === 'user') {
    // Normal users shouldn't have 'ทุกภาค', select the first office instead
    if (respSelect.value === 'ทุกภาค' && respSelect.options.length > 1) {
      respSelect.selectedIndex = 1;
    }
  } else {
    // Admins / Super Users have 'ทุกภาค'
    respSelect.value = 'ทุกภาค';
  }
}

function saveUser() {
  const id = document.getElementById('fUserId').value;
  const userData = {
    username: document.getElementById('fUserUsername').value.trim(),
    password: document.getElementById('fUserPassword').value.trim(),
    role: document.getElementById('fUserRole').value,
    name: document.getElementById('fUserName').value.trim(),
    responsibility: document.getElementById('fUserResponsibility').value
  };

  if (!userData.username || !userData.password || !userData.name) {
    showToast('กรุณากรอกข้อมูลให้ครบถ้วน', 'error');
    return;
  }

  let res;
  if (id) {
    res = DB.updateUser(id, userData);
  } else {
    res = DB.addUser(userData);
  }

  if (res.success) {
    showToast(id ? 'อัปเดตข้อมูลผู้ใช้งานสำเร็จ' : 'เพิ่มผู้ใช้งานสำเร็จ', 'success');
    closeUserModal();
    renderUsersPage();

    // Auto logout if the user edited their own profile and changed role/responsibility
    if (id && currentUser && currentUser.id === id) {
      localStorage.setItem('pb_currentUser', JSON.stringify(res.user));
      checkAuth();
    }
  } else {
    showToast(res.message || 'เกิดข้อผิดพลาด', 'error');
  }
}

function editUser(id) {
  const user = DB.getUsers().find(u => u.id === id);
  if (user) {
    openUserModal(user);
  }
}

function removeUser(id) {
  if (confirm('ยืนยันลบผู้ใช้งานรายนี้?')) {
    const res = DB.deleteUser(id);
    if (res.success) {
      showToast('ลบข้อมูลผู้ใช้งานสำเร็จ', 'success');
      renderUsersPage();
    } else {
      showToast(res.message, 'error');
    }
  }
}

function resetDbDefaults() {
  if (!confirm('⚠️ รีเซ็ตข้อมูลประเภทโครงการ รายการย่อย ภาค และหน่วย เป็นค่าเริ่มต้น?\n\nข้อมูลที่แก้ไขจะหายไป')) return;
  localStorage.removeItem('pb_project_types');
  localStorage.removeItem('pb_sub_items');
  localStorage.removeItem('pb_regional_offices');
  localStorage.removeItem('pb_units');
  DB.getProjectTypes(); // refresh
  DB.getRegionalOffices(); // refresh
  selectedTypeId = null;
  selectedOfficeId = null;
  renderDbManagePage();
  document.getElementById('subItemList').innerHTML = '<div class="empty-state" style="padding:40px"><div class="empty-icon">👈</div><h3>เลือกประเภทโครงการ</h3><p>เลือกประเภทโครงการทางซ้ายเพื่อดูและจัดการรายการย่อย</p></div>';
  document.getElementById('subItemTitle').textContent = '📋 รายการย่อย';
  document.getElementById('addSubItemBtn').style.display = 'none';
  document.getElementById('unitList').innerHTML = '<div class="empty-state" style="padding:40px"><div class="empty-icon">👈</div><h3>เลือกภาค</h3><p>เลือกภาคทางซ้ายเพื่อดูและจัดการหน่วย</p></div>';
  document.getElementById('unitTitle').textContent = '📋 หน่วย';
  document.getElementById('addUnitBtn').style.display = 'none';
  refreshRegionalOfficeDropdown();
  showToast('รีเซ็ตเป็นค่าเริ่มต้นสำเร็จ', 'success');
}

// ===== INITIALIZE =====
document.addEventListener('DOMContentLoaded', async () => {
  // Use cached data to allow INSTANT UI rendering, while loading fresh database in the background
  const hasCache = localStorage.getItem('pb_projects') !== null;

  if (!hasCache) {
    // Show a simple loading indicator ONLY on first cold start without cache
    const loadingDiv = document.createElement('div');
    loadingDiv.id = 'dbLoadingOverlay';
    loadingDiv.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(15,23,42,0.95);display:flex;align-items:center;justify-content:center;z-index:9999;color:#fff;font-size:20px;flex-direction:column;gap:15px;';
    loadingDiv.innerHTML = '<div class="spinner" style="width:40px;height:40px;border:4px solid rgba(255,255,255,0.1);border-left-color:#3b82f6;border-radius:50%;animation:spin 1s linear infinite;"></div><div>กำลังเชื่อมต่อระบบฐานข้อมูล...</div><style>@keyframes spin { 100% { transform: rotate(360deg); } }</style>';
    document.body.appendChild(loadingDiv);
  }

  // Define an async IIFE to run non-blocking DB.init
  (async () => {
    try {
      if (typeof DB !== 'undefined' && DB.init) {
        await DB.init();
        // If we had a cache, re-render the active tab transparently after fresh data arrives.
        if (hasCache) {
          const activeTab = document.querySelector('.nav-tab.active');
          if (activeTab) {
            switchTab(activeTab.dataset.tab);
            initDashboardFilters(); // Make sure dashboard counts refresh
          }
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      if (document.getElementById('dbLoadingOverlay')) {
        document.getElementById('dbLoadingOverlay').remove();
      }
    }
  })();

  // --- Start UI Initialization ---
  checkAuth();

  // Set date
  const dateEl = document.getElementById('headerDate');
  if (dateEl) {
    const now = new Date();
    dateEl.textContent = now.toLocaleDateString('th-TH', {
      year: 'numeric', month: 'long', day: 'numeric'
    });
  }

  // Tab clicks
  document.querySelectorAll('.nav-tab').forEach(btn => {
    btn.addEventListener('click', (e) => {
      let cur = e.target;
      while (cur && !cur.classList.contains('nav-tab')) {
        cur = cur.parentElement;
      }
      if (cur) switchTab(cur.dataset.tab);
    });
  });

  // Init project form selects
  const fFiscalYear = document.getElementById('fFiscalYear');
  const currentBE = new Date().getFullYear() + 543;
  if (fFiscalYear) fFiscalYear.innerHTML = generateFiscalYearOptions(currentBE);

  const fyInline = document.getElementById('fiscalYearSelect');
  if (fyInline) fyInline.innerHTML = generateFiscalYearOptions(currentBE);

  const fType = document.getElementById('fType');
  if (fType) fType.innerHTML = PROJECT_TYPES.map(t => `<option value="${t.id}">${t.label}</option>`).join('');

  const fBudgetType = document.getElementById('fBudgetType');
  if (fBudgetType) fBudgetType.innerHTML = BUDGET_TYPES.map(b => `<option value="${b}">${b}</option>`).join('');

  const fRegionalOffice = document.getElementById('fRegionalOffice');
  if (fRegionalOffice) fRegionalOffice.innerHTML = DB.getRegionalOffices().map(r => `<option value="${r}">${r}</option>`).join('');

  // Init filters
  initDashboardFilters();
  initPageFilters(
    'projectSearch',
    'projectAgencyFilter',
    'projectUnitFilter',
    renderProjectsPage,
    'projectFiscalYearFilter',
    'projectTypeFilter',
    'projectBudgetTypeFilter'
  );
  initPageFilters(
    'reviewSearch',
    'reviewAgencyFilter',
    'reviewUnitFilter',
    renderReviewPage,
    'reviewFiscalYearFilter',
    'reviewTypeFilter',
    'reviewBudgetTypeFilter',
    'reviewStatusFilter'
  );

  // Render initial page
  renderDashboard();

  // Mobile Menu Logic
  const mobileMenuBtn = document.getElementById('mobileMenuBtn');
  const navTabs = document.querySelector('.nav-tabs');
  if (mobileMenuBtn && navTabs) {
    mobileMenuBtn.addEventListener('click', () => {
      navTabs.classList.toggle('active');
    });

    document.querySelectorAll('.nav-tab').forEach(tab => {
      tab.addEventListener('click', () => {
        if (window.innerWidth <= 600) {
          navTabs.classList.remove('active');
        }
      });
    });
  }

  // Render secondary pages/stats if needed
  renderUsersPage();
});
