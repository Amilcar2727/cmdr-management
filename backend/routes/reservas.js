// routes/reservas.js — CRUD completo de reservas
// Incluye campo fecha_reserva_iso (YYYY-MM-DD) para filtros en frontend
const router = require('express').Router();
const pool   = require('../db');

// GET / — Listar todas (con join a estudiantes y periodos)
router.get('/', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT r.id,
              r.codigo_estudiante,
              e.nombre                                          AS nombre_estudiante,
              r.periodo_id,
              p.nombre_periodo,
              r.estado_reserva,
              to_char(r.fecha_reserva, 'DD/MM/YYYY HH24:MI')  AS fecha_reserva,
              to_char(r.fecha_reserva, 'YYYY-MM-DD')           AS fecha_reserva_iso
       FROM reservas r
       JOIN estudiantes      e ON e.codigo = r.codigo_estudiante
       JOIN periodos_reserva p ON p.id     = r.periodo_id
       ORDER BY r.fecha_reserva DESC`
    );
    res.json({ success: true, data: result.rows });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /:id — Obtener una
router.get('/:id', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT r.*,
              to_char(r.fecha_reserva, 'DD/MM/YYYY HH24:MI') AS fecha_reserva_fmt
       FROM reservas r WHERE r.id = $1`,
      [req.params.id]
    );
    if (!result.rows.length)
      return res.status(404).json({ success: false, message: 'Reserva no encontrada' });
    res.json({ success: true, data: result.rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST / — Crear
router.post('/', async (req, res) => {
  const { codigo_estudiante, periodo_id, estado_reserva } = req.body;
  if (!codigo_estudiante || !periodo_id)
    return res.status(400).json({ success: false, message: 'Faltan campos requeridos (codigo_estudiante, periodo_id)' });
  try {
    const result = await pool.query(
      `INSERT INTO reservas (codigo_estudiante, periodo_id, estado_reserva)
       VALUES ($1, $2, $3) RETURNING id`,
      [codigo_estudiante.trim(), periodo_id, estado_reserva || 'Pendiente']
    );
    res.status(201).json({ success: true, message: 'Reserva creada correctamente', id: result.rows[0].id });
  } catch (err) {
    if (err.code === '23505')
      return res.status(409).json({ success: false, message: 'Este estudiante ya tiene una reserva en ese periodo' });
    if (err.code === '23503')
      return res.status(400).json({ success: false, message: 'El estudiante o periodo indicado no existe' });
    res.status(500).json({ success: false, message: err.message });
  }
});

// PUT /:id — Editar
router.put('/:id', async (req, res) => {
  const { codigo_estudiante, periodo_id, estado_reserva } = req.body;
  if (!codigo_estudiante || !periodo_id || !estado_reserva)
    return res.status(400).json({ success: false, message: 'Faltan campos requeridos' });
  try {
    const result = await pool.query(
      `UPDATE reservas
       SET codigo_estudiante = $1, periodo_id = $2, estado_reserva = $3
       WHERE id = $4`,
      [codigo_estudiante.trim(), periodo_id, estado_reserva, req.params.id]
    );
    if (!result.rowCount)
      return res.status(404).json({ success: false, message: 'Reserva no encontrada' });
    res.json({ success: true, message: 'Reserva actualizada correctamente' });
  } catch (err) {
    if (err.code === '23505')
      return res.status(409).json({ success: false, message: 'Este estudiante ya tiene una reserva en ese periodo' });
    res.status(500).json({ success: false, message: err.message });
  }
});

// DELETE /:id — Eliminar
router.delete('/:id', async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM reservas WHERE id = $1', [req.params.id]);
    if (!result.rowCount)
      return res.status(404).json({ success: false, message: 'Reserva no encontrada' });
    res.json({ success: true, message: 'Reserva eliminada correctamente' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
