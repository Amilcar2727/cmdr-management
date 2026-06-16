// js/ui.js — Utilidades de interfaz: toast, modales, badges, paginación
import { PAGE_SIZE } from './config.js';
import { state }     from './state.js';

/* =============================================================
   TOAST NOTIFICATIONS
   ============================================================= */
export function toast(msg, type = 'info') {
  const icons = { success: '✅', error: '❌', info: 'ℹ️' };
  const el = document.createElement('div');
  el.className = `toast ${type}`;
  el.innerHTML = `<span class="toast-icon">${icons[type]}</span>
                  <span class="toast-msg">${msg}</span>`;
  document.getElementById('toast-container').appendChild(el);
  setTimeout(() => {
    el.classList.add('hide');
    el.addEventListener('animationend', () => el.remove());
  }, 3800);
}

/* =============================================================
   MODALES
   ============================================================= */
export function openModal(id) {
  document.getElementById(id).classList.add('open');
  document.body.style.overflow = 'hidden';
}

export function closeModal(id) {
  document.getElementById(id).classList.remove('open');
  document.body.style.overflow = '';
}

// Cierra al hacer click fuera del modal
export function initModalListeners() {
  document.querySelectorAll('.modal-overlay').forEach(el => {
    el.addEventListener('click', e => { if (e.target === el) closeModal(el.id); });
  });
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape')
      document.querySelectorAll('.modal-overlay.open').forEach(m => closeModal(m.id));
  });
}

/* =============================================================
   BADGES
   ============================================================= */
export function badgeEstado(estado) {
  if (estado === 'Sacado')    return `<span class="badge badge-green"><span class="badge-dot"></span>Sacado</span>`;
  if (estado === 'No Sacado') return `<span class="badge badge-red"><span class="badge-dot"></span>No Sacado</span>`;
  return `<span class="badge badge-amber"><span class="badge-dot"></span>Pendiente</span>`;
}

/* =============================================================
   FORMATO DE FECHAS
   ============================================================= */
export function formatDate(isoDate) {
  if (!isoDate) return '—';
  const [y, m, d] = isoDate.split('-');
  return `${d}/${m}/${y}`;
}

/* =============================================================
   TABLA — render, filtro, paginación
   ============================================================= */
const COLS = { estudiantes: 5, periodos: 6, reservas: 7 };

export function setLoading(table) {
  document.getElementById('table-' + table).innerHTML =
    `<tr class="loading-row"><td colspan="${COLS[table]}"><div class="spinner"></div></td></tr>`;
}

export function renderTable(table, renderRowFn) {
  const { filtered, page } = state[table];
  const start = (page - 1) * PAGE_SIZE;
  const rows  = filtered.slice(start, start + PAGE_SIZE);
  const tbody = document.getElementById('table-' + table);

  if (!rows.length) {
    tbody.innerHTML = `<tr><td colspan="${COLS[table]}">
      <div class="empty-state">
        <div class="empty-icon">🔍</div>
        <h3>Sin resultados</h3>
        <p>No se encontraron registros que coincidan con los filtros</p>
      </div></td></tr>`;
  } else {
    tbody.innerHTML = rows.map(row => renderRowFn(row)).join('');
  }

  const total = filtered.length;
  const pages = Math.ceil(total / PAGE_SIZE);
  const infoEl = document.getElementById('info-' + table);
  if (infoEl) {
    infoEl.textContent = total === 0
      ? 'Sin resultados'
      : `Mostrando ${start + 1}–${Math.min(start + PAGE_SIZE, total)} de ${total} registros`;
  }
  renderPagination(table, pages, page);
}

export function renderPagination(table, pages, current) {
  const el = document.getElementById('pag-' + table);
  if (!el) return;
  if (pages <= 1) { el.innerHTML = ''; return; }

  let html = `<button class="page-btn" onclick="goPage('${table}',${current - 1})" ${current === 1 ? 'disabled' : ''}>‹</button>`;
  for (let i = 1; i <= pages; i++) {
    if (pages > 7 && Math.abs(i - current) > 1 && i !== 1 && i !== pages) {
      if (i === 2 || i === pages - 1) html += `<span class="page-btn" style="cursor:default">…</span>`;
      continue;
    }
    html += `<button class="page-btn ${i === current ? 'active' : ''}" onclick="goPage('${table}',${i})">${i}</button>`;
  }
  html += `<button class="page-btn" onclick="goPage('${table}',${current + 1})" ${current === pages ? 'disabled' : ''}>›</button>`;
  el.innerHTML = html;
}
