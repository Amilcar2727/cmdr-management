// routes/estudiantes.js — CRUD completo de estudiantes
const router = require('express').Router();
const pool   = require('../db');

// GET / — Listar todos
router.get('/', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT codigo, nombre, clave,
              to_char(fecha_registro, 'DD/MM/YYYY HH24:MI') AS fecha_registro
       FROM estudiantes
       ORDER BY nombre`
    );
    res.json({ success: true, data: result.rows });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /:codigo — Obtener uno
router.get('/:codigo', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM estudiantes WHERE codigo = $1',
      [req.params.codigo]
    );
    if (!result.rows.length)
      return res.status(404).json({ success: false, message: 'Estudiante no encontrado' });
    res.json({ success: true, data: result.rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST / — Crear
router.post('/', async (req, res) => {
  const { codigo, nombre, clave } = req.body;
  if (!codigo || !nombre || !clave)
    return res.status(400).json({ success: false, message: 'Faltan campos requeridos (codigo, nombre, clave)' });
  try {
    await pool.query(
      'INSERT INTO estudiantes (codigo, nombre, clave) VALUES ($1, $2, $3)',
      [codigo.trim(), nombre.trim(), clave.trim()]
    );
    res.status(201).json({ success: true, message: 'Estudiante creado correctamente' });
  } catch (err) {
    if (err.code === '23505')
      return res.status(409).json({ success: false, message: 'Ya existe un estudiante con ese código' });
    res.status(500).json({ success: false, message: err.message });
  }
});

// PUT /:codigo — Editar
router.put('/:codigo', async (req, res) => {
  const { nombre, clave } = req.body;
  if (!nombre || !clave)
    return res.status(400).json({ success: false, message: 'Faltan campos: nombre y clave' });
  try {
    const result = await pool.query(
      'UPDATE estudiantes SET nombre = $1, clave = $2 WHERE codigo = $3',
      [nombre.trim(), clave.trim(), req.params.codigo]
    );
    if (!result.rowCount)
      return res.status(404).json({ success: false, message: 'Estudiante no encontrado' });
    res.json({ success: true, message: 'Estudiante actualizado correctamente' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// DELETE /:codigo — Eliminar
router.delete('/:codigo', async (req, res) => {
  try {
    const result = await pool.query(
      'DELETE FROM estudiantes WHERE codigo = $1', [req.params.codigo]
    );
    if (!result.rowCount)
      return res.status(404).json({ success: false, message: 'Estudiante no encontrado' });
    res.json({ success: true, message: 'Estudiante eliminado correctamente' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
