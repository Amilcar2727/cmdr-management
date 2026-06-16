// js/periodos.js — CRUD completo de periodos de reserva
import { apiFetch }  from './api.js';
import { state }     from './state.js';
import { toast, openModal, closeModal, setLoading, renderTable, formatDate } from './ui.js';

/* =============================================================
   CARGA Y RENDER
   ============================================================= */
export async function loadPeriodos() {
  setLoading('periodos');
  const { ok, data } = await apiFetch('GET', '/periodos');
  if (!ok) { toast('Error cargando periodos: ' + data.message, 'error'); return; }
  state.periodos.data     = data.data;
  state.periodos.filtered = [...data.data];
  state.periodos.page     = 1;
  renderTable('periodos', renderPeriodoRow);
}

export function filterPeriodos() {
  const q = document.getElementById('search-periodos').value.toLowerCase();
  state.periodos.filtered = state.periodos.data.filter(row =>
    Object.values(row).some(v => String(v).toLowerCase().includes(q))
  );
  state.periodos.page = 1;
  renderTable('periodos', renderPeriodoRow);
}

export function renderPeriodoRow(row) {
  const badge = row.activo
    ? `<span class="badge badge-green"><span class="badge-dot"></span>Activo</span>`
    : `<span class="badge badge-red"><span class="badge-dot"></span>Inactivo</span>`;
  const nombre = row.nombre_periodo.replace(/'/g, "\\'");
  return `<tr>
    <td class="td-code">#${row.id}</td>
    <td><strong>${row.nombre_periodo}</strong></td>
    <td class="td-muted">${formatDate(row.fecha_inicio)}</td>
    <td class="td-muted">${formatDate(row.fecha_fin)}</td>
    <td>${badge}</td>
    <td><div class="actions">
      <button class="btn btn-ghost btn-sm" onclick="openModalEdit('periodos',${row.id})">✏️ Editar</button>
      <button class="btn btn-danger btn-sm" onclick="askDelete('periodos',${row.id},'${nombre}')">🗑️ Eliminar</button>
    </div></td>
  </tr>`;
}

/* =============================================================
   MODAL — CREAR
   ============================================================= */
export function openCreatePeriodo() {
  state.editMode = { table: 'periodos', id: null };
  document.getElementById('modal-per-title').textContent    = 'Nuevo Periodo';
  document.getElementById('modal-per-subtitle').textContent = 'Define un bloque de reserva quincenal';
  document.getElementById('form-periodo').reset();
  document.getElementById('per-activo').checked             = true;
  document.getElementById('btn-submit-per').textContent     = 'Crear Periodo';
  openModal('modal-periodo');
}

/* =============================================================
   MODAL — EDITAR
   ============================================================= */
export async function openEditPeriodo(id) {
  const { ok, data } = await apiFetch('GET', `/periodos/${id}`);
  if (!ok) { toast('Error cargando datos', 'error'); return; }
  const p = data.data;
  state.editMode = { table: 'periodos', id: p.id };
  document.getElementById('modal-per-title').textContent    = 'Editar Periodo';
  document.getElementById('modal-per-subtitle').textContent = `ID: ${p.id}`;
  document.getElementById('per-nombre').value               = p.nombre_periodo;
  document.getElementById('per-inicio').value               = p.fecha_inicio;
  document.getElementById('per-fin').value                  = p.fecha_fin;
  document.getElementById('per-activo').checked             = p.activo;
  document.getElementById('btn-submit-per').textContent     = 'Guardar Cambios';
  openModal('modal-periodo');
}

/* =============================================================
   SUBMIT (crear / editar)
   ============================================================= */
export async function submitPeriodo(e) {
  e.preventDefault();
  const { id } = state.editMode;
  const body = {
    nombre_periodo: document.getElementById('per-nombre').value.trim(),
    fecha_inicio:   document.getElementById('per-inicio').value,
    fecha_fin:      document.getElementById('per-fin').value,
    activo:         document.getElementById('per-activo').checked,
  };
  if (body.fecha_fin <= body.fecha_inicio) {
    toast('La fecha fin debe ser posterior a la fecha inicio', 'error'); return;
  }
  const btn = document.getElementById('btn-submit-per');
  btn.disabled = true; btn.textContent = 'Guardando…';

  const { ok, data } = id
    ? await apiFetch('PUT',  `/periodos/${id}`, body)
    : await apiFetch('POST', '/periodos', body);

  btn.disabled = false;
  btn.textContent = id ? 'Guardar Cambios' : 'Crear Periodo';

  if (!ok) { toast(data.message || 'Error al guardar', 'error'); return; }
  toast(data.message, 'success');
  closeModal('modal-periodo');
  loadPeriodos();
}
