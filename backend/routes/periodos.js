// routes/periodos.js — CRUD completo de periodos de reserva
const router = require('express').Router();
const pool   = require('../db');

// GET / — Listar todos
router.get('/', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, nombre_periodo,
              to_char(fecha_inicio, 'YYYY-MM-DD') AS fecha_inicio,
              to_char(fecha_fin,    'YYYY-MM-DD') AS fecha_fin,
              activo
       FROM periodos_reserva
       ORDER BY id DESC`
    );
    res.json({ success: true, data: result.rows });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /:id — Obtener uno
router.get('/:id', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, nombre_periodo,
              to_char(fecha_inicio, 'YYYY-MM-DD') AS fecha_inicio,
              to_char(fecha_fin,    'YYYY-MM-DD') AS fecha_fin,
              activo
       FROM periodos_reserva WHERE id = $1`,
      [req.params.id]
    );
    if (!result.rows.length)
      return res.status(404).json({ success: false, message: 'Periodo no encontrado' });
    res.json({ success: true, data: result.rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST / — Crear
router.post('/', async (req, res) => {
  const { nombre_periodo, fecha_inicio, fecha_fin, activo } = req.body;
  if (!nombre_periodo || !fecha_inicio || !fecha_fin)
    return res.status(400).json({ success: false, message: 'Faltan campos requeridos' });
  try {
    const result = await pool.query(
      `INSERT INTO periodos_reserva (nombre_periodo, fecha_inicio, fecha_fin, activo)
       VALUES ($1, $2, $3, $4) RETURNING id`,
      [nombre_periodo.trim(), fecha_inicio, fecha_fin, activo ?? true]
    );
    res.status(201).json({ success: true, message: 'Periodo creado correctamente', id: result.rows[0].id });
  } catch (err) {
    if (err.code === '23514')
      return res.status(400).json({ success: false, message: 'La fecha fin debe ser posterior a la fecha inicio' });
    res.status(500).json({ success: false, message: err.message });
  }
});

// PUT /:id — Editar
router.put('/:id', async (req, res) => {
  const { nombre_periodo, fecha_inicio, fecha_fin, activo } = req.body;
  if (!nombre_periodo || !fecha_inicio || !fecha_fin)
    return res.status(400).json({ success: false, message: 'Faltan campos requeridos' });
  try {
    const result = await pool.query(
      `UPDATE periodos_reserva
       SET nombre_periodo = $1, fecha_inicio = $2, fecha_fin = $3, activo = $4
       WHERE id = $5`,
      [nombre_periodo.trim(), fecha_inicio, fecha_fin, activo ?? true, req.params.id]
    );
    if (!result.rowCount)
      return res.status(404).json({ success: false, message: 'Periodo no encontrado' });
    res.json({ success: true, message: 'Periodo actualizado correctamente' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// DELETE /:id — Eliminar
router.delete('/:id', async (req, res) => {
  try {
    const result = await pool.query(
      'DELETE FROM periodos_reserva WHERE id = $1', [req.params.id]
    );
    if (!result.rowCount)
      return res.status(404).json({ success: false, message: 'Periodo no encontrado' });
    res.json({ success: true, message: 'Periodo eliminado correctamente' });
  } catch (err) {
    if (err.code === '23503')
      return res.status(409).json({ success: false, message: 'No se puede eliminar: hay reservas asociadas a este periodo' });
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
