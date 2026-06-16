// js/api.js — Helper para llamadas a la API REST
import { API_BASE } from './config.js';

/**
 * Realiza una petición a la API.
 * @param {'GET'|'POST'|'PUT'|'DELETE'} method
 * @param {string} path  — ruta relativa, ej: '/estudiantes'
 * @param {object} [body] — cuerpo JSON para POST/PUT
 * @returns {{ ok: boolean, data: object }}
 */
export async function apiFetch(method, path, body) {
  const opts = { method, headers: { 'Content-Type': 'application/json' } };
  if (body) opts.body = JSON.stringify(body);
  try {
    const res  = await fetch(API_BASE + path, opts);
    const data = await res.json();
    return { ok: res.ok, data };
  } catch (err) {
    return { ok: false, data: { message: 'Sin conexión con el servidor' } };
  }
}
