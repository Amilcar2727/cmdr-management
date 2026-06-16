// js/estudiantes.js — CRUD completo de estudiantes
import { apiFetch }  from './api.js';
import { state }     from './state.js';
import { toast, openModal, closeModal, setLoading, renderTable, formatDate } from './ui.js';

/* =============================================================
   CARGA Y RENDER
   ============================================================= */
export async function loadEstudiantes() {
  setLoading('estudiantes');
  const { ok, data } = await apiFetch('GET', '/estudiantes');
  if (!ok) { toast('Error cargando estudiantes: ' + data.message, 'error'); return; }
  state.estudiantes.data     = data.data;
  state.estudiantes.filtered = [...data.data];
  state.estudiantes.page     = 1;
  renderTable('estudiantes', renderEstudianteRow);
}

export function filterEstudiantes() {
  const q = document.getElementById('search-estudiantes').value.toLowerCase();
  state.estudiantes.filtered = state.estudiantes.data.filter(row =>
    Object.values(row).some(v => String(v).toLowerCase().includes(q))
  );
  state.estudiantes.page = 1;
  renderTable('estudiantes', renderEstudianteRow);
}

export function renderEstudianteRow(row) {
  return `<tr>
    <td class="td-code">${row.codigo}</td>
    <td><strong>${row.nombre}</strong></td>
    <td class="td-muted" style="font-family:monospace">${row.clave}</td>
    <td class="td-muted">${row.fecha_registro}</td>
    <td><div class="actions">
      <button class="btn btn-ghost btn-sm" onclick="openModalEdit('estudiantes','${row.codigo}')">✏️ Editar</button>
      <button class="btn btn-danger btn-sm"
        onclick="askDelete('estudiantes','${row.codigo}','${row.nombre.replace(/'/g,"\\'")}')">
        🗑️ Eliminar
      </button>
    </div></td>
  </tr>`;
}

/* =============================================================
   MODAL — CREAR
   ============================================================= */
export function openCreateEstudiante() {
  state.editMode = { table: 'estudiantes', id: null };
  document.getElementById('modal-est-title').textContent    = 'Nuevo Estudiante';
  document.getElementById('modal-est-subtitle').textContent = 'Complete los datos para registrar';
  document.getElementById('form-estudiante').reset();
  document.getElementById('est-codigo').disabled            = false;
  document.getElementById('btn-submit-est').textContent     = 'Crear Estudiante';
  openModal('modal-estudiante');
}

/* =============================================================
   MODAL — EDITAR
   ============================================================= */
export async function openEditEstudiante(codigo) {
  const { ok, data } = await apiFetch('GET', `/estudiantes/${codigo}`);
  if (!ok) { toast('Error cargando datos', 'error'); return; }
  const e = data.data;
  state.editMode = { table: 'estudiantes', id: e.codigo };
  document.getElementById('modal-est-title').textContent    = 'Editar Estudiante';
  document.getElementById('modal-est-subtitle').textContent = `Código: ${e.codigo}`;
  document.getElementById('est-codigo').value               = e.codigo;
  document.getElementById('est-codigo').disabled            = true;
  document.getElementById('est-nombre').value               = e.nombre;
  document.getElementById('est-clave').value                = e.clave;
  document.getElementById('btn-submit-est').textContent     = 'Guardar Cambios';
  openModal('modal-estudiante');
}

/* =============================================================
   SUBMIT (crear / editar)
   ============================================================= */
export async function submitEstudiante(e) {
  e.preventDefault();
  const { id } = state.editMode;
  const body = {
    codigo: document.getElementById('est-codigo').value.trim(),
    nombre: document.getElementById('est-nombre').value.trim(),
    clave:  document.getElementById('est-clave').value.trim(),
  };
  const btn = document.getElementById('btn-submit-est');
  btn.disabled = true; btn.textContent = 'Guardando…';

  const { ok, data } = id
    ? await apiFetch('PUT',  `/estudiantes/${id}`, body)
    : await apiFetch('POST', '/estudiantes', body);

  btn.disabled = false;
  btn.textContent = id ? 'Guardar Cambios' : 'Crear Estudiante';

  if (!ok) { toast(data.message || 'Error al guardar', 'error'); return; }
  toast(data.message, 'success');
  closeModal('modal-estudiante');
  loadEstudiantes();
}
