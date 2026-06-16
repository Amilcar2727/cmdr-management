// js/reservas.js — CRUD + filtros por periodo, estado y fecha
import { apiFetch }  from './api.js';
import { state }     from './state.js';
import { toast, openModal, closeModal, setLoading, renderTable, badgeEstado } from './ui.js';

/* =============================================================
   CARGA Y RENDER
   ============================================================= */
export async function loadReservas() {
  setLoading('reservas');
  const { ok, data } = await apiFetch('GET', '/reservas');
  if (!ok) { toast('Error cargando reservas: ' + data.message, 'error'); return; }
  state.reservas.data     = data.data;
  state.reservas.filtered = [...data.data];
  state.reservas.page     = 1;

  // Poblar el select de periodos en la barra de filtros
  populateFilterPeriodos(data.data);
  applyReservaFilters();
}

function populateFilterPeriodos(reservas) {
  const sel = document.getElementById('filter-res-periodo');
  // Extraer periodos únicos del dataset cargado
  const seen = new Map();
  reservas.forEach(r => {
    if (!seen.has(r.periodo_id)) seen.set(r.periodo_id, r.nombre_periodo);
  });
  const current = sel.value;
  sel.innerHTML = '<option value="">Todos los periodos</option>';
  seen.forEach((nombre, id) => {
    sel.innerHTML += `<option value="${id}">${nombre}</option>`;
  });
  sel.value = current; // mantener selección previa si aún existe
}

function renderReservaRow(row) {
  const nombre = row.nombre_estudiante.replace(/'/g, "\\'");
  return `<tr>
    <td class="td-muted">#${row.id}</td>
    <td><strong>${row.nombre_estudiante}</strong></td>
    <td class="td-code">${row.codigo_estudiante}</td>
    <td class="td-muted td-ellipsis">${row.nombre_periodo}</td>
    <td>${badgeEstado(row.estado_reserva)}</td>
    <td class="td-muted">${row.fecha_reserva}</td>
    <td><div class="actions">
      <button class="btn btn-ghost btn-sm" onclick="openModalEdit('reservas',${row.id})">✏️ Editar</button>
      <button class="btn btn-danger btn-sm" onclick="askDelete('reservas',${row.id},'${nombre} — #${row.id}')">🗑️ Eliminar</button>
    </div></td>
  </tr>`;
}

/* =============================================================
   FILTROS
   ============================================================= */
export function applyReservaFilters() {
  const periodo = document.getElementById('filter-res-periodo')?.value || '';
  const estado  = document.getElementById('filter-res-estado')?.value  || '';
  const desde   = document.getElementById('filter-res-desde')?.value   || '';
  const hasta   = document.getElementById('filter-res-hasta')?.value   || '';
  const search  = document.getElementById('search-reservas')?.value.toLowerCase() || '';

  state.reservas.filtered = state.reservas.data.filter(r => {
    if (periodo && String(r.periodo_id) !== periodo) return false;
    if (estado  && r.estado_reserva !== estado)       return false;
    if (desde   && r.fecha_reserva_iso < desde)       return false;
    if (hasta   && r.fecha_reserva_iso > hasta)       return false;
    if (search  && !Object.values(r).some(v => String(v).toLowerCase().includes(search))) return false;
    return true;
  });
  state.reservas.page = 1;
  renderTable('reservas', renderReservaRow);
  updateReservaFilterBadge(periodo, estado, desde, hasta);
}

export function clearReservaFilters() {
  ['filter-res-periodo','filter-res-estado','filter-res-desde','filter-res-hasta','search-reservas']
    .forEach(id => { const el = document.getElementById(id); if (el) el.value = ''; });
  applyReservaFilters();
}

function updateReservaFilterBadge(periodo, estado, desde, hasta) {
  const badge = document.getElementById('reservas-filter-badge');
  if (!badge) return;
  const hasFilter = !!(periodo || estado || desde || hasta);
  badge.style.display = hasFilter ? 'inline-flex' : 'none';
  if (hasFilter) {
    badge.textContent = `${state.reservas.filtered.length} resultado${state.reservas.filtered.length !== 1 ? 's' : ''}`;
  }
}

/* =============================================================
   MODAL — CREAR
   ============================================================= */
export async function openCreateReserva() {
  state.editMode = { table: 'reservas', id: null };
  document.getElementById('modal-res-title').textContent    = 'Nueva Reserva';
  document.getElementById('modal-res-subtitle').textContent = 'Asigna una reserva a un estudiante';
  document.getElementById('form-reserva').reset();
  document.getElementById('btn-submit-res').textContent     = 'Crear Reserva';
  await populateModalSelects();
  openModal('modal-reserva');
}

/* =============================================================
   MODAL — EDITAR
   ============================================================= */
export async function openEditReserva(id) {
  const { ok, data } = await apiFetch('GET', `/reservas/${id}`);
  if (!ok) { toast('Error cargando datos', 'error'); return; }
  const r = data.data;
  state.editMode = { table: 'reservas', id: r.id };
  document.getElementById('modal-res-title').textContent    = 'Editar Reserva';
  document.getElementById('modal-res-subtitle').textContent = `ID: #${r.id}`;
  document.getElementById('btn-submit-res').textContent     = 'Guardar Cambios';
  await populateModalSelects();
  document.getElementById('res-estudiante').value = r.codigo_estudiante;
  document.getElementById('res-periodo').value    = r.periodo_id;
  document.getElementById('res-estado').value     = r.estado_reserva;
  openModal('modal-reserva');
}

async function populateModalSelects() {
  const [resE, resP] = await Promise.all([
    apiFetch('GET', '/estudiantes'),
    apiFetch('GET', '/periodos'),
  ]);
  const selE = document.getElementById('res-estudiante');
  const selP = document.getElementById('res-periodo');
  selE.innerHTML = '<option value="">— Seleccionar estudiante —</option>';
  selP.innerHTML = '<option value="">— Seleccionar periodo —</option>';
  if (resE.ok) resE.data.data.forEach(e => {
    selE.innerHTML += `<option value="${e.codigo}">${e.nombre} (${e.codigo})</option>`;
  });
  if (resP.ok) resP.data.data.forEach(p => {
    const tag = p.activo ? ' ✅' : '';
    selP.innerHTML += `<option value="${p.id}">${p.nombre_periodo}${tag}</option>`;
  });
}

/* =============================================================
   SUBMIT (crear / editar)
   ============================================================= */
export async function submitReserva(e) {
  e.preventDefault();
  const { id } = state.editMode;
  const body = {
    codigo_estudiante: document.getElementById('res-estudiante').value,
    periodo_id:        parseInt(document.getElementById('res-periodo').value),
    estado_reserva:    document.getElementById('res-estado').value,
  };
  const btn = document.getElementById('btn-submit-res');
  btn.disabled = true; btn.textContent = 'Guardando…';

  const { ok, data } = id
    ? await apiFetch('PUT',  `/reservas/${id}`, body)
    : await apiFetch('POST', '/reservas', body);

  btn.disabled = false;
  btn.textContent = id ? 'Guardar Cambios' : 'Crear Reserva';

  if (!ok) { toast(data.message || 'Error al guardar', 'error'); return; }
  toast(data.message, 'success');
  closeModal('modal-reserva');
  loadReservas();
}
