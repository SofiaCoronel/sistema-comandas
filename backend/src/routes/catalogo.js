const express = require('express');
const pool = require('../config/db');
const verificarToken = require('../middlewares/auth');

const router = express.Router();

// Listar productos (público, lo usa la app de comandas)
router.get('/', async (req, res) => {
  const result = await pool.query('SELECT * FROM productos WHERE activo = true ORDER BY categoria, nombre');
  res.json(result.rows);
});

// Crear producto (solo admin)
router.post('/', verificarToken, async (req, res) => {
  const { nombre, descripcion, precio, categoria } = req.body;
  const result = await pool.query(
    'INSERT INTO productos (nombre, descripcion, precio, categoria) VALUES ($1,$2,$3,$4) RETURNING *',
    [nombre, descripcion, precio, categoria]
  );
  res.status(201).json(result.rows[0]);
});

// Editar producto
router.put('/:id', verificarToken, async (req, res) => {
  const { nombre, descripcion, precio, categoria, activo } = req.body;
  const result = await pool.query(
    `UPDATE productos SET nombre=$1, descripcion=$2, precio=$3, categoria=$4, activo=$5 WHERE id=$6 RETURNING *`,
    [nombre, descripcion, precio, categoria, activo, req.params.id]
  );
  res.json(result.rows[0]);
});

// Eliminar (soft delete)
router.delete('/:id', verificarToken, async (req, res) => {
  await pool.query('UPDATE productos SET activo = false WHERE id = $1', [req.params.id]);
  res.json({ ok: true });
});

module.exports = router;