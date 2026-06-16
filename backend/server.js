// backend/server.js — Entrada principal del servidor
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });

const express = require('express');
const cors    = require('cors');
const path    = require('path');

const app  = express();
const PORT = process.env.PORT || 3000;

// ── Middlewares ──────────────────────────────────────────────
app.use(cors());
app.use(express.json());

// Servir frontend estático
app.use(express.static(path.join(__dirname, '..', 'frontend')));

// ── Rutas API ────────────────────────────────────────────────
app.use('/api/estudiantes', require('./routes/estudiantes'));
app.use('/api/periodos',    require('./routes/periodos'));
app.use('/api/reservas',    require('./routes/reservas'));

// ── Ruta raíz ────────────────────────────────────────────────
app.get('/', (_req, res) =>
  res.sendFile(path.join(__dirname, '..', 'frontend', 'index.html'))
);

// ── Arrancar servidor ────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
  console.log(`📋 API disponible en http://localhost:${PORT}/api`);
});
