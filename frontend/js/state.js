// js/state.js — Estado global compartido entre módulos
export const state = {
  currentSection: 'dashboard',

  estudiantes: { data: [], filtered: [], page: 1 },
  periodos:    { data: [], filtered: [], page: 1 },
  reservas:    { data: [], filtered: [], page: 1 },

  // Cache de reservas completas para el dashboard (sin paginar)
  dashReservas: [],

  // Contexto del modal de edición
  editMode: { table: null, id: null },

  // Contexto del diálogo de confirmación de borrado
  deleteTarget: { table: null, id: null, label: '' },
};
