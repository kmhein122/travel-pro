/* ===== TRAVEL PRO - ADMIN JAVASCRIPT ===== */

function adminBackendUrl(endpoint) {
  // admin pages live at /admin/* so backend is ../backend/admin/
  return '../backend/admin/' + endpoint;
}

async function adminFetch(endpoint, opts = {}) {
  const res = await fetch(adminBackendUrl(endpoint), {
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', ...(opts.headers || {}) },
    ...opts,
  });
  const text = await res.text();
  let data = null;
  try { data = text ? JSON.parse(text) : null; } catch { data = null; }
  if (!res.ok) {
    const msg = data?.message || `Request failed (${res.status})`;
    throw new Error(msg);
  }
  return data;
}

function $(sel) { return document.querySelector(sel); }

function setMsg(el, type, text) {
  if (!el) return;
  el.style.display = 'block';
  el.className = `form-message ${type === 'success' ? 'success' : 'error-msg'}`;
  el.textContent = text;
}

function setPill(el, text, kind = 'info') {
  if (!el) return;
  el.style.display = '';
  el.textContent = text;
  el.className = 'pill-mini';
  if (kind === 'error') {
    el.style.borderColor = 'rgba(220,38,38,0.35)';
    el.style.color = 'rgba(220,38,38,0.9)';
  } else if (kind === 'success') {
    el.style.borderColor = 'rgba(34,197,94,0.35)';
    el.style.color = 'rgba(34,197,94,0.9)';
  } else {
    el.style.borderColor = '';
    el.style.color = '';
  }
}

async function loadImageGalleryOptions() {
  const select = $('#pkg-image-select');
  if (!select) return;
  select.innerHTML = `<option value="">Select from gallery…</option>`;
  try {
    const data = await adminFetch('packages/images_list.php', { method: 'GET' });
    const images = data.images || [];
    images.forEach((img) => {
      const opt = document.createElement('option');
      opt.value = img;
      opt.textContent = img;
      select.appendChild(opt);
    });
  } catch {
    // ignore
  }
}

async function uploadSelectedImage() {
  const fileInput = $('#pkg-image-file');
  const status = $('#pkg-image-upload-status');
  const form = $('#pkg-form');
  if (!fileInput || !form) return;
  const file = fileInput.files?.[0];
  if (!file) { setPill(status, 'Choose a file first', 'error'); return; }
  setPill(status, 'Uploading…', 'info');
  const fd = new FormData();
  fd.append('image', file);

  const res = await fetch(adminBackendUrl('packages/upload_image.php'), {
    method: 'POST',
    credentials: 'include',
    body: fd,
  });
  const data = await res.json().catch(() => null);
  if (!res.ok || !data?.success) {
    setPill(status, data?.message || 'Upload failed', 'error');
    return;
  }
  form.image.value = data.path; // relative to /images/
  setPill(status, `Uploaded: ${data.path}`, 'success');
  await loadImageGalleryOptions();
  const select = $('#pkg-image-select');
  if (select) select.value = data.path;
  updatePkgImagePreview();
}

function updatePkgImagePreview() {
  const img = $('#pkg-image-preview');
  const form = $('#pkg-form');
  if (!img || !form) return;
  const val = (form.image.value || '').trim();
  if (!val) { img.removeAttribute('src'); return; }
  if (val.startsWith('http://') || val.startsWith('https://')) {
    img.src = val;
    return;
  }
  img.src = '../images/' + val.replace(/^\/+/, '');
}

async function initAdminLogin() {
  const form = $('#admin-login-form');
  if (!form) return;

  // If already logged in, go straight to dashboard
  try {
    const s = await adminFetch('auth/session_check.php', { method: 'GET' });
    if (s?.loggedIn) window.location.href = 'dashboard.html';
  } catch { /* ignore */ }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = form.querySelector('[name="email"]')?.value.trim();
    const password = form.querySelector('[name="password"]')?.value || '';
    const msgEl = $('#admin-login-msg');
    if (!email || !password) { setMsg(msgEl, 'error', 'Email and password are required.'); return; }
    try {
      await adminFetch('auth/login.php', { method: 'POST', body: JSON.stringify({ email, password }) });
      setMsg(msgEl, 'success', 'Logged in. Redirecting…');
      window.location.href = 'dashboard.html';
    } catch (err) {
      setMsg(msgEl, 'error', err.message || 'Login failed.');
    }
  });
}

function showAdminTab(tab) {
  const ids = ['packages', 'reviews', 'messages', 'users'];
  ids.forEach((t) => {
    const el = $(`#admin-tab-${t}`);
    if (el) el.style.display = (t === tab) ? '' : 'none';
  });
}

function escapeHtml(s) {
  return String(s ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

async function loadStats() {
  const grid = $('#admin-stats-grid');
  if (!grid) return;
  try {
    const data = await adminFetch('stats.php', { method: 'GET' });
    const s = data.stats || {};
    const cards = [
      { label: 'Users', value: s.users_total, sub: `${s.users_disabled} disabled` },
      { label: 'Packages', value: s.packages_total, sub: `${s.packages_active} active` },
      { label: 'Reviews', value: s.reviews_total, sub: `${s.reviews_unreplied} unreplied` },
      { label: 'Messages', value: s.messages_total, sub: `${s.messages_new} new` },
    ];
    grid.innerHTML = cards.map(c => `
      <div style="border:1px solid var(--border);border-radius:14px;padding:14px;">
        <div style="color:var(--text-light);font-size:.85rem;font-weight:800;">${escapeHtml(c.label)}</div>
        <div style="font-size:1.55rem;font-weight:950;margin-top:4px;">${Number(c.value || 0).toLocaleString()}</div>
        <div style="color:var(--text-light);font-size:.85rem;margin-top:4px;">${escapeHtml(c.sub)}</div>
      </div>
    `).join('');
  } catch (err) {
    grid.innerHTML = `
      <div style="grid-column:1/-1;border:1px solid var(--border);border-radius:14px;padding:14px;">
        <div style="font-weight:950;">Database not initialized</div>
        <div style="color:var(--text-light);margin-top:6px;">${escapeHtml(err.message || 'Stats failed to load.')}</div>
        <div style="display:flex;gap:10px;flex-wrap:wrap;margin-top:10px;">
          <button class="btn btn-primary btn-sm" id="admin-setup-btn">Run Admin Setup</button>
          <span class="pill-mini">or import <strong>database/travel_pro.sql</strong></span>
        </div>
      </div>
    `;
    $('#admin-setup-btn')?.addEventListener('click', async () => {
      try {
        await adminFetch('setup.php', { method: 'POST', body: '{}' });
        if (typeof showToast === 'function') showToast('Setup completed. Reloading…', 'success');
        await loadStats();
        await loadPackages();
      } catch (e) {
        if (typeof showToast === 'function') showToast(e.message || 'Setup failed', 'error');
      }
    });
  }
}

async function loadPackages() {
  const body = $('#pkg-table-body');
  if (!body) return;
  let data;
  try {
    data = await adminFetch('packages/list.php', { method: 'GET' });
  } catch (err) {
    body.innerHTML = `<tr><td colspan="6" style="color:var(--text-light);">${escapeHtml(err.message || 'Failed to load packages.')}</td></tr>`;
    throw err;
  }
  const pkgs = data.packages || [];
  window.__adminPkgs = pkgs;
  const q = ($('#pkg-search')?.value || '').trim().toLowerCase();
  const filtered = q
    ? pkgs.filter(p =>
      String(p.id).includes(q) ||
      String(p.title || '').toLowerCase().includes(q) ||
      String(p.location || '').toLowerCase().includes(q) ||
      String(p.category || '').toLowerCase().includes(q) ||
      String(p.badge || '').toLowerCase().includes(q)
    )
    : pkgs;

  if (filtered.length === 0) {
    body.innerHTML = `<tr><td colspan="6" style="color:var(--text-light);">No packages yet.</td></tr>`;
    return;
  }
  body.innerHTML = filtered.map(p => `
    <tr>
      <td>${p.id}</td>
      <td><strong>${escapeHtml(p.title)}</strong><br><span style="color:var(--text-light);">${escapeHtml(p.location)}</span></td>
      <td>${escapeHtml(p.category)} ${p.badge ? `<span class="pill-mini" style="margin-left:6px;">${escapeHtml(p.badge)}</span>` : ''}</td>
      <td>฿${Number(p.price).toLocaleString()}</td>
      <td>${p.is_active ? '<span class="pill-mini">Active</span>' : '<span class="pill-mini">Hidden</span>'}</td>
      <td>
        <div class="admin-actions">
          <button class="btn btn-outline btn-sm" data-pkg-edit="${p.id}">Edit</button>
          <button class="btn btn-outline btn-sm" data-pkg-toggle="${p.id}" data-pkg-active="${p.is_active ? 1 : 0}">
            ${p.is_active ? 'Hide' : 'Show'}
          </button>
          <button class="btn btn-outline btn-sm" data-pkg-del="${p.id}">Delete</button>
        </div>
      </td>
    </tr>
  `).join('');

  body.querySelectorAll('[data-pkg-edit]').forEach(btn => {
    btn.addEventListener('click', () => editPackage(pkgs.find(x => String(x.id) === String(btn.dataset.pkgEdit))));
  });
  body.querySelectorAll('[data-pkg-toggle]').forEach(btn => {
    btn.addEventListener('click', async () => {
      const id = Number(btn.dataset.pkgToggle);
      const current = Number(btn.dataset.pkgActive) === 1;
      await adminFetch('packages/set_active.php', { method: 'POST', body: JSON.stringify({ id, is_active: !current }) });
      await loadPackages();
      if (typeof showToast === 'function') showToast('Package status updated', 'success');
    });
  });
  body.querySelectorAll('[data-pkg-del]').forEach(btn => {
    btn.addEventListener('click', async () => {
      const id = Number(btn.dataset.pkgDel);
      if (!confirm(`Delete package #${id}?`)) return;
      await adminFetch('packages/delete.php', { method: 'POST', body: JSON.stringify({ id }) });
      await loadPackages();
      if (typeof showToast === 'function') showToast('Package deleted', 'success');
    });
  });
}

function openPkgForm() { $('#pkg-form-wrap')?.style && ($('#pkg-form-wrap').style.display = ''); }
function closePkgForm() { $('#pkg-form-wrap')?.style && ($('#pkg-form-wrap').style.display = 'none'); }

function editPackage(pkg) {
  if (!pkg) return;
  const form = $('#pkg-form');
  if (!form) return;
  form.id.value = pkg.id;
  form.title.value = pkg.title || '';
  form.location.value = pkg.location || '';
  form.category.value = pkg.category || '';
  form.badge.value = pkg.badge || '';
  form.price.value = pkg.price || '';
  form.image.value = pkg.image || '';
  const imageSelect = $('#pkg-image-select');
  if (imageSelect) imageSelect.value = form.image.value || '';
  form.description.value = pkg.description || '';
  form.is_active.value = String(pkg.is_active ? 1 : 0);
  openPkgForm();
  form.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function clearPkgForm() {
  const form = $('#pkg-form');
  if (!form) return;
  form.reset();
  form.id.value = '';
  form.is_active.value = '1';
}

async function initPackagesTab() {
  const newBtn = $('#pkg-new-btn');
  const cancelBtn = $('#pkg-cancel-btn');
  const form = $('#pkg-form');
  const search = $('#pkg-search');
  const imageSelect = $('#pkg-image-select');
  const uploadBtn = $('#pkg-image-upload-btn');
  const seedBtn = $('#pkg-seed-demo-btn');
  const assignBtn = $('#pkg-assign-images-btn');
  if (newBtn) newBtn.addEventListener('click', () => { clearPkgForm(); openPkgForm(); });
  if (cancelBtn) cancelBtn.addEventListener('click', () => { closePkgForm(); clearPkgForm(); });
  if (search && !search.__wired) {
    search.__wired = true;
    search.addEventListener('input', () => loadPackages());
  }
  if (imageSelect && !imageSelect.__wired) {
    imageSelect.__wired = true;
    imageSelect.addEventListener('change', () => {
      if (!form) return;
      if (imageSelect.value) form.image.value = imageSelect.value;
      updatePkgImagePreview();
    });
  }
  if (uploadBtn && !uploadBtn.__wired) {
    uploadBtn.__wired = true;
    uploadBtn.addEventListener('click', () => uploadSelectedImage());
  }
  if (seedBtn && !seedBtn.__wired) {
    seedBtn.__wired = true;
    seedBtn.addEventListener('click', async () => {
      if (!confirm('Insert demo packages? (Only runs if no packages exist)')) return;
      const r = await adminFetch('packages/seed_demo.php', { method: 'POST', body: '{}' });
      if (typeof showToast === 'function') showToast(r.message || 'Done', 'success');
      await loadPackages();
    });
  }
  if (assignBtn && !assignBtn.__wired) {
    assignBtn.__wired = true;
    assignBtn.addEventListener('click', async () => {
      const r = await adminFetch('packages/assign_demo_images.php', { method: 'POST', body: '{}' });
      if (typeof showToast === 'function') showToast(r.message || 'Done', 'success');
      await loadPackages();
    });
  }
  await loadImageGalleryOptions();
  if (form) {
    if (!form.__imgPreviewWired) {
      form.__imgPreviewWired = true;
      form.image?.addEventListener('input', () => updatePkgImagePreview());
    }
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const payload = {
        id: form.id.value ? Number(form.id.value) : undefined,
        title: form.title.value.trim(),
        location: form.location.value.trim(),
        category: form.category.value.trim(),
        badge: form.badge.value.trim(),
        price: Number(form.price.value || 0),
        image: form.image.value.trim(),
        description: form.description.value.trim(),
        is_active: form.is_active.value === '1',
      };
      try {
        if (!payload.title || !payload.location || !payload.category || !payload.price) throw new Error('Please fill Title, Location, Category, and Price.');
        if (payload.id) {
          await adminFetch('packages/update.php', { method: 'POST', body: JSON.stringify(payload) });
          if (typeof showToast === 'function') showToast('Package updated', 'success');
        } else {
          await adminFetch('packages/create.php', { method: 'POST', body: JSON.stringify(payload) });
          if (typeof showToast === 'function') showToast('Package created', 'success');
        }
        closePkgForm();
        clearPkgForm();
        await loadPackages();
      } catch (err) {
        if (typeof showToast === 'function') showToast(err.message || 'Save failed', 'error');
      }
    });
  }
  await loadPackages();
}

async function loadReviews() {
  const wrap = $('#reviews-wrap');
  if (!wrap) return;
  const data = await adminFetch('reviews/list.php', { method: 'GET' });
  const reviews = data.reviews || [];
  window.__adminReviews = reviews;
  const q = ($('#review-search')?.value || '').trim().toLowerCase();
  const filtered = q ? reviews.filter(r =>
    String(r.user_name || '').toLowerCase().includes(q) ||
    String(r.user_email || '').toLowerCase().includes(q) ||
    String(r.text || '').toLowerCase().includes(q) ||
    String(r.package_title || '').toLowerCase().includes(q) ||
    String(r.admin_reply || '').toLowerCase().includes(q)
  ) : reviews;

  if (filtered.length === 0) {
    wrap.innerHTML = `<div style="color:var(--text-light);">No reviews yet.</div>`;
    return;
  }
  wrap.innerHTML = filtered.map(r => `
    <div style="border:1px solid var(--border);border-radius:14px;padding:14px;">
      <div style="display:flex;justify-content:space-between;gap:10px;flex-wrap:wrap;">
        <div>
          <strong>${escapeHtml(r.user_name)}</strong> <span style="color:var(--text-light);">(${escapeHtml(r.user_email)})</span>
          ${r.package_title ? `<div style="color:var(--text-light);font-size:.85rem;margin-top:2px;">Package: ${escapeHtml(r.package_title)}</div>` : ''}
        </div>
        <div class="pill-mini">${'★'.repeat(Number(r.rating || 0))}${'☆'.repeat(5 - Number(r.rating || 0))}</div>
      </div>
      <div style="margin-top:10px;">${escapeHtml(r.text)}</div>
      <div style="margin-top:10px;background:var(--bg-light);border:1px solid var(--border);border-radius:12px;padding:12px;">
        <div style="font-weight:900;margin-bottom:8px;">Admin reply</div>
        <textarea class="form-input" rows="3" data-reply-text="${r.id}" placeholder="Write a reply...">${escapeHtml(r.admin_reply || '')}</textarea>
        <div style="display:flex;gap:10px;justify-content:flex-end;margin-top:10px;">
          <button class="btn btn-primary btn-sm" data-reply-save="${r.id}">Save reply</button>
        </div>
      </div>
    </div>
  `).join('');

  wrap.querySelectorAll('[data-reply-save]').forEach(btn => {
    btn.addEventListener('click', async () => {
      const id = Number(btn.dataset.replySave);
      const ta = wrap.querySelector(`[data-reply-text="${id}"]`);
      const reply = ta?.value?.trim() || '';
      if (!reply) { if (typeof showToast === 'function') showToast('Reply cannot be empty', 'error'); return; }
      await adminFetch('reviews/reply.php', { method: 'POST', body: JSON.stringify({ id, reply }) });
      if (typeof showToast === 'function') showToast('Reply saved', 'success');
    });
  });
}

async function loadMessages() {
  const body = $('#msg-table-body');
  if (!body) return;
  const data = await adminFetch('messages/list.php', { method: 'GET' });
  const msgs = data.messages || [];
  window.__adminMsgs = msgs;
  const q = ($('#msg-search')?.value || '').trim().toLowerCase();
  const filtered = q ? msgs.filter(m =>
    String(m.name || '').toLowerCase().includes(q) ||
    String(m.email || '').toLowerCase().includes(q) ||
    String(m.subject || '').toLowerCase().includes(q) ||
    String(m.message || '').toLowerCase().includes(q) ||
    String(m.status || '').toLowerCase().includes(q)
  ) : msgs;

  if (filtered.length === 0) {
    body.innerHTML = `<tr><td colspan="5" style="color:var(--text-light);">No messages yet.</td></tr>`;
    return;
  }
  body.innerHTML = filtered.map(m => `
    <tr>
      <td>${escapeHtml(m.created_at)}</td>
      <td><strong>${escapeHtml(m.name)}</strong><br><span style="color:var(--text-light);">${escapeHtml(m.email)}</span></td>
      <td>${escapeHtml(m.subject)}</td>
      <td><span class="pill-mini">${escapeHtml(m.status)}</span></td>
      <td>
        <div class="admin-actions">
          <button class="btn btn-outline btn-sm" data-msg-view="${m.id}">View</button>
          <button class="btn btn-outline btn-sm" data-msg-read="${m.id}">Mark read</button>
          <button class="btn btn-outline btn-sm" data-msg-arch="${m.id}">Archive</button>
        </div>
      </td>
    </tr>
  `).join('');

  const detail = $('#msg-detail');
  body.querySelectorAll('[data-msg-view]').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = Number(btn.dataset.msgView);
      const m = msgs.find(x => Number(x.id) === id);
      if (!m || !detail) return;
      detail.style.display = '';
      detail.className = 'admin-card';
      detail.innerHTML = `
        <h3 style="margin:0 0 8px;font-size:1.05rem;font-weight:900;">${escapeHtml(m.subject)}</h3>
        <div style="color:var(--text-light);font-size:.9rem;margin-bottom:12px;">
          From <strong>${escapeHtml(m.name)}</strong> (${escapeHtml(m.email)}) · ${escapeHtml(m.created_at)}
        </div>
        <div style="white-space:pre-wrap;">${escapeHtml(m.message)}</div>
      `;
      detail.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  });

  async function setStatus(id, status) {
    await adminFetch('messages/set_status.php', { method: 'POST', body: JSON.stringify({ id, status }) });
    await loadMessages();
    if (typeof showToast === 'function') showToast('Status updated', 'success');
  }
  body.querySelectorAll('[data-msg-read]').forEach(btn => btn.addEventListener('click', () => setStatus(Number(btn.dataset.msgRead), 'read')));
  body.querySelectorAll('[data-msg-arch]').forEach(btn => btn.addEventListener('click', () => setStatus(Number(btn.dataset.msgArch), 'archived')));
}

async function loadUsers() {
  const body = $('#user-table-body');
  if (!body) return;
  const data = await adminFetch('users/list.php', { method: 'GET' });
  const users = data.users || [];
  window.__adminUsers = users;
  const q = ($('#user-search')?.value || '').trim().toLowerCase();
  const filtered = q ? users.filter(u =>
    String(u.id).includes(q) ||
    String(u.name || '').toLowerCase().includes(q) ||
    String(u.email || '').toLowerCase().includes(q) ||
    String(u.created_at || '').toLowerCase().includes(q) ||
    String(u.is_disabled ? 'disabled' : 'active').includes(q)
  ) : users;

  if (filtered.length === 0) {
    body.innerHTML = `<tr><td colspan="6" style="color:var(--text-light);">No users yet.</td></tr>`;
    return;
  }
  body.innerHTML = filtered.map(u => `
    <tr>
      <td>${u.id}</td>
      <td>${escapeHtml(u.name)}</td>
      <td>${escapeHtml(u.email)}</td>
      <td>${escapeHtml(u.created_at)}</td>
      <td>${u.is_disabled ? '<span class="pill-mini">Disabled</span>' : '<span class="pill-mini">Active</span>'}</td>
      <td>
        <div class="admin-actions">
          <button class="btn btn-outline btn-sm" data-user-toggle="${u.id}" data-user-disabled="${u.is_disabled ? 1 : 0}">
            ${u.is_disabled ? 'Enable' : 'Disable'}
          </button>
          <button class="btn btn-outline btn-sm" data-user-pw="${u.id}">Reset Password</button>
          <button class="btn btn-outline btn-sm" data-user-del="${u.id}">Delete</button>
        </div>
      </td>
    </tr>
  `).join('');

  body.querySelectorAll('[data-user-toggle]').forEach(btn => {
    btn.addEventListener('click', async () => {
      const id = Number(btn.dataset.userToggle);
      const current = Number(btn.dataset.userDisabled) === 1;
      await adminFetch('users/set_disabled.php', { method: 'POST', body: JSON.stringify({ id, is_disabled: !current }) });
      await loadUsers();
      if (typeof showToast === 'function') showToast('User updated', 'success');
    });
  });
  body.querySelectorAll('[data-user-pw]').forEach(btn => {
    btn.addEventListener('click', async () => {
      const id = Number(btn.dataset.userPw);
      const pw = prompt('Set a new password for this user (min 6 chars):');
      if (pw === null) return;
      if (pw.trim().length < 6) { if (typeof showToast === 'function') showToast('Password must be at least 6 characters', 'error'); return; }
      await adminFetch('users/reset_password.php', { method: 'POST', body: JSON.stringify({ id, new_password: pw.trim() }) });
      if (typeof showToast === 'function') showToast('Password reset', 'success');
    });
  });
  body.querySelectorAll('[data-user-del]').forEach(btn => {
    btn.addEventListener('click', async () => {
      const id = Number(btn.dataset.userDel);
      if (!confirm(`Delete user #${id}? This also deletes their reviews.`)) return;
      await adminFetch('users/delete.php', { method: 'POST', body: JSON.stringify({ id }) });
      await loadUsers();
      if (typeof showToast === 'function') showToast('User deleted', 'success');
    });
  });
}

async function initAdminDashboard() {
  const pill = $('#admin-status-pill');
  const logoutBtn = $('#admin-logout-btn');
  const navBtns = document.querySelectorAll('[data-admin-tab]');
  const refreshBtn = $('#admin-refresh-btn');
  if (!pill) return;

  try {
    const s = await adminFetch('auth/session_check.php', { method: 'GET' });
    if (!s?.loggedIn) throw new Error('Not logged in');
    pill.textContent = 'Session active';
    const admin = s.admin || {};
    $('#admin-name').textContent = admin.name || 'Admin';
    $('#admin-email').textContent = admin.email || '';
  } catch {
    window.location.href = 'login.html';
    return;
  }

  if (logoutBtn) {
    logoutBtn.addEventListener('click', async () => {
      await adminFetch('auth/logout.php', { method: 'POST' });
      window.location.href = 'login.html';
    });
  }

  if (refreshBtn) {
    refreshBtn.addEventListener('click', async () => {
      try {
        await loadStats();
        const visible = ['packages', 'reviews', 'messages', 'users'].find(t => $(`#admin-tab-${t}`)?.style?.display !== 'none');
        if (visible === 'packages') await loadPackages();
        if (visible === 'reviews') await loadReviews();
        if (visible === 'messages') await loadMessages();
        if (visible === 'users') await loadUsers();
        if (typeof showToast === 'function') showToast('Refreshed', 'success');
      } catch (err) {
        if (typeof showToast === 'function') showToast(err.message || 'Refresh failed', 'error');
      }
    });
  }

  navBtns.forEach(btn => btn.addEventListener('click', async () => {
    const tab = btn.dataset.adminTab;
    showAdminTab(tab);
    try {
      if (tab === 'packages') await initPackagesTab();
      if (tab === 'reviews') await loadReviews();
      if (tab === 'messages') await loadMessages();
      if (tab === 'users') await loadUsers();
    } catch (err) {
      if (typeof showToast === 'function') showToast(err.message || 'Failed to load', 'error');
    }
  }));

  const reviewSearch = $('#review-search');
  if (reviewSearch && !reviewSearch.__wired) { reviewSearch.__wired = true; reviewSearch.addEventListener('input', () => loadReviews()); }
  const msgSearch = $('#msg-search');
  if (msgSearch && !msgSearch.__wired) { msgSearch.__wired = true; msgSearch.addEventListener('input', () => loadMessages()); }
  const userSearch = $('#user-search');
  if (userSearch && !userSearch.__wired) { userSearch.__wired = true; userSearch.addEventListener('input', () => loadUsers()); }

  await loadStats();

  // Default tab
  showAdminTab('packages');
  try {
    await initPackagesTab();
  } catch (err) {
    if (typeof showToast === 'function') showToast(err.message || 'Failed to load packages', 'error');
  }
}

document.addEventListener('DOMContentLoaded', () => {
  initAdminLogin();
  initAdminDashboard();
});

