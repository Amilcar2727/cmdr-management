// db.js — Pool de conexión a PostgreSQL
// Las variables de entorno ya deben estar cargadas por server.js
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  // Esto es crucial para que Render acepte la conexión segura SSL
  ssl: process.env.DATABASE_URL.includes('render.com') 
    ? { rejectUnauthorized: false } 
    : false
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
