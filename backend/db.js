// db.js — Pool de conexión a PostgreSQL
// Las variables de entorno ya deben estar cargadas por server.js
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

pool.connect((err, client, release) => {
  if (err) {
    console.error('❌ Error conectando a PostgreSQL:', err.message);
  } else {
    console.log('✅ PostgreSQL conectado correctamente');
    release();
  }
});

module.exports = pool;
