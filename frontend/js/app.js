// js/app.js — Punto de entrada principal
// Gestiona la navegación, inicialización y expone funciones al scope global (window)
// para permitir el uso de onclick="" en el HTML.

import { apiFetch }   from './api.js';
import { state }      from './state.js';
import { toast, openModal, closeModal, initModalListeners, renderTable } from './ui.js';

import { loadDashboard, applyDashFilters, clearDashFilters } from './dashboard.js';

import {
  loadEstudiantes, filterEstudiantes,
  openCreateEstudiante, openEditEstudiante, submitEstudiante,
  renderEstudianteRow,
} from './estudiantes.js';

import {
  loadPeriodos, filterPeriodos,
  openCreatePeriodo, openEditPeriodo, submitPeriodo,
  renderPeriodoRow,
} from './periodos.js';

import {
  loadReservas, applyReservaFilters, clearReservaFilters,
  openCreateReserva, openEditReserva, submitReserva,
} from './reservas.js';

/* =============================================================
   NAVEGACIÓN
   ============================================================= */
const SECTIONS = ['dashboard','estudiantes','periodos','reservas'];
const TITLES = {
  dashboard:   ['Resumen General',        'Vista general del sistema de comedor'],
  estudiantes: ['Estudiantes',            'Gestión de estudiantes registrados'],
  periodos:    ['Periodos de Reserva',    'Bloques quincenales del comedor'],
  reservas:    ['Reservas del Comedor',   'Historial y gestión de reservas'],
};

function navigate(sec) {
  state.currentSection = sec;
  SECTIONS.forEach(s => {
    document.getElementById('section-' + s)?.classList.toggle('active', s === sec);
    document.getElementById('nav-' + s)?.classList.toggle('active', s === sec);
  });
  const [title, sub] = TITLES[sec];
  document.getElementById('topbar-title').textContent    = title;
  document.getElementById('topbar-subtitle').textContent = sub;

  if (sec === 'dashboard')   loadDashboard();
  if (sec === 'estudiantes') loadEstudiantes();
  if (sec === 'periodos')    loadPeriodos();
  if (sec === 'reservas')    loadReservas();
}

function refreshCurrent() { navigate(state.currentSection); }

/* =============================================================
   PAGINACIÓN — re-renderiza desde caché sin llamar a la API
   ============================================================= */
function goPage(table, page) {
  const total = state[table].filtered.length;
  const pages = Math.ceil(total / 10);
  if (page < 1 || page > pages) return;
  state[table].page = page;

  if (table === 'estudiantes') renderTable('estudiantes', renderEstudianteRow);
  else if (table === 'periodos') renderTable('periodos', renderPeriodoRow);
  else if (table === 'reservas') applyReservaFilters();
}

/* =============================================================
   MODAL DISPATCHER — abre el modal correcto según la tabla
   ============================================================= */
async function openModalCreate(table) {
  if (table === 'estudiantes') openCreateEstudiante();
  if (table === 'periodos')    openCreatePeriodo();
  if (table === 'reservas')    openCreateReserva();
}

async function openModalEdit(table, id) {
  if (table === 'estudiantes') openEditEstudiante(id);
  if (table === 'periodos')    openEditPeriodo(id);
  if (table === 'reservas')    openEditReserva(id);
}

/* =============================================================
   ELIMINAR
   ============================================================= */
function askDelete(table, id, label) {
  state.deleteTarget = { table, id, label };
  document.getElementById('confirm-msg').textContent =
    `¿Deseas eliminar "${label}"?`;
  openModal('modal-confirm');
}

async function confirmDelete() {
  const { table, id } = state.deleteTarget;
  const pathMap = { estudiantes: 'estudiantes', periodos: 'periodos', reservas: 'reservas' };
  const btn = document.getElementById('btn-confirm-delete');
  btn.disabled = true; btn.textContent = 'Eliminando…';

  const { ok, data } = await apiFetch('DELETE', `/${pathMap[table]}/${id}`);
  btn.disabled = false; btn.textContent = 'Eliminar';

  if (!ok) { toast(data.message || 'Error al eliminar', 'error'); closeModal('modal-confirm'); return; }
  toast(data.message, 'success');
  closeModal('modal-confirm');
  navigate(state.currentSection);
}

/* =============================================================
   ESTADO DE CONEXIÓN A BD
   ============================================================= */
async function checkConnection() {
  const dot  = document.getElementById('db-status-dot');
  const text = document.getElementById('db-status-text');
  try {
    const { ok } = await apiFetch('GET', '/estudiantes');
    dot.className    = 'status-dot ' + (ok ? 'connected' : 'error');
    text.textContent = ok ? 'PostgreSQL conectado' : 'Error de conexión';
  } catch {
    dot.className    = 'status-dot error';
    text.textContent = 'Sin conexión';
  }
}

/* =============================================================
   EXPONER AL SCOPE GLOBAL (requerido para onclick en HTML)
   ============================================================= */
Object.assign(window, {
  // Navegación
  navigate, refreshCurrent,

  // Paginación local (sin rellamada a API)
  goPage,

  // Modales CRUD
  openModalCreate, openModalEdit,

  // Formularios
  submitEstudiante, submitPeriodo, submitReserva,

  // Eliminar
  askDelete, confirmDelete,

  // Cerrar modales
  closeModal,

  // Filtros Dashboard
  applyDashFilters, clearDashFilters,

  // Filtros Reservas
  applyReservaFilters, clearReservaFilters,

  // Búsqueda de texto en tablas
  filterEstudiantes, filterPeriodos,
});

/* =============================================================
   INICIALIZACIÓN
   ============================================================= */
(async () => {
  initModalListeners();
  await checkConnection();
  navigate('dashboard');
})();
