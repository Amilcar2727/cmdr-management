// js/dashboard.js — Carga y filtros del panel de resumen
import { apiFetch }    from './api.js';
import { state }       from './state.js';
import { toast, badgeEstado } from './ui.js';

/* =============================================================
   CARGA PRINCIPAL
   ============================================================= */
export async function loadDashboard() {
  const [resE, resP, resR] = await Promise.all([
    apiFetch('GET', '/estudiantes'),
    apiFetch('GET', '/periodos'),
    apiFetch('GET', '/reservas'),
  ]);

  if (resE.ok) document.getElementById('stat-estudiantes').textContent = resE.data.data.length;
  if (resP.ok) document.getElementById('stat-periodos').textContent    = resP.data.data.length;

  if (resR.ok) {
    state.dashReservas = resR.data.data;
    document.getElementById('stat-reservas').textContent   = state.dashReservas.length;
    const pend = state.dashReservas.filter(r =>
      r.estado_reserva === 'Pendiente' || r.estado_reserva === 'No Sacado'
    ).length;
    document.getElementById('stat-pendientes').textContent = pend;
    applyDashFilters();
  }
}

/* =============================================================
   FILTROS DEL DASHBOARD
   ============================================================= */
export function applyDashFilters() {
  const estado = document.getElementById('filter-dash-estado')?.value || '';
  const desde  = document.getElementById('filter-dash-desde')?.value  || '';
  const hasta  = document.getElementById('filter-dash-hasta')?.value  || '';

  let filtered = [...state.dashReservas];
  if (estado) filtered = filtered.filter(r => r.estado_reserva === estado);
  if (desde)  filtered = filtered.filter(r => r.fecha_reserva_iso >= desde);
  if (hasta)  filtered = filtered.filter(r => r.fecha_reserva_iso <= hasta);

  renderDashReservas(filtered.slice(0, 10));
  updateDashFilterTags(estado, desde, hasta, filtered.length, state.dashReservas.length);
}

export function clearDashFilters() {
  const fields = ['filter-dash-estado', 'filter-dash-desde', 'filter-dash-hasta'];
  fields.forEach(id => { const el = document.getElementById(id); if (el) el.value = ''; });
  applyDashFilters();
}

function updateDashFilterTags(estado, desde, hasta, shown, total) {
  const el = document.getElementById('dash-filter-count');
  if (!el) return;
  const active = !!(estado || desde || hasta);
  el.textContent = active ? `${shown} de ${total} reservas` : `${total} reservas`;
  el.parentElement.style.display = active ? 'inline-flex' : 'none';
}

/* =============================================================
   RENDER TABLA DASHBOARD
   ============================================================= */
function renderDashReservas(reservas) {
  const tbody = document.getElementById('dash-reservas-body');
  if (!reservas.length) {
    tbody.innerHTML = `<tr><td colspan="6">
      <div class="empty-state">
        <div class="empty-icon">🍱</div>
        <h3>Sin resultados</h3>
        <p>No hay reservas que coincidan con los filtros</p>
      </div></td></tr>`;
    return;
  }
  tbody.innerHTML = reservas.map(r => `
    <tr>
      <td class="td-muted">#${r.id}</td>
      <td><strong>${r.nombre_estudiante}</strong></td>
      <td class="td-code">${r.codigo_estudiante}</td>
      <td class="td-muted td-ellipsis">${r.nombre_periodo}</td>
      <td>${badgeEstado(r.estado_reserva)}</td>
      <td class="td-muted">${r.fecha_reserva}</td>
    </tr>`).join('');
}
