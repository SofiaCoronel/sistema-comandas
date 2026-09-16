const express = require('express');
const pool = require('../config/db');
const verificarToken = require('../middlewares/auth');

const router = express.Router();

// Buscar cliente por nombre o celular
router.get('/buscar', async (req, res) => {
  const { q } = req.query;
  if (!q || q.length < 2) return res.json([]);

  const result = await pool.query(
    `SELECT * FROM clientes 
     WHERE nombre ILIKE $1 OR celular ILIKE $1
     ORDER BY total_pedidos DESC
     LIMIT 5`,
    [`%${q}%`]
  );
  res.json(result.rows);
});

// Guardar o actualizar cliente
router.post('/', verificarToken, async (req, res) => {
  const { nombre, celular, direccion, lat, lng } = req.body;
  if (!nombre) return res.status(400).json({ error: 'Nombre requerido' });

  try {
    // Si ya existe por celular, actualizar
    const existente = await pool.query(
      'SELECT * FROM clientes WHERE celular = $1',
      [celular]
    );

    if (existente.rows.length > 0) {
      const result = await pool.query(
        `UPDATE clientes SET nombre=$1, direccion=$2, lat=$3, lng=$4, actualizado_en=NOW()
         WHERE celular=$5 RETURNING *`,
        [nombre, direccion, lat, lng, celular]
      );
      return res.json(result.rows[0]);
    }

    const result = await pool.query(
      `INSERT INTO clientes (nombre, celular, direccion, lat, lng)
       VALUES ($1,$2,$3,$4,$5) RETURNING *`,
      [nombre, celular, direccion, lat, lng]
    );
    res.status(201).json(result.rows[0]);
  } catch (e) {
    res.status(500).json({ error: 'Error al guardar cliente' });
  }
});

// Incrementar total pedidos (se llama al confirmar comanda)
router.post('/incrementar', async (req, res) => {
  const { celular } = req.body;
  if (!celular) return res.json({ ok: false });

  await pool.query(
    `UPDATE clientes SET total_pedidos = total_pedidos + 1, actualizado_en = NOW()
     WHERE celular = $1`,
    [celular]
  );
  res.json({ ok: true });
});

// Listar clientes frecuentes
router.get('/', verificarToken, async (req, res) => {
  const result = await pool.query(
    'SELECT * FROM clientes ORDER BY total_pedidos DESC, actualizado_en DESC LIMIT 50'
  );
  res.json(result.rows);
});

module.exports = router;