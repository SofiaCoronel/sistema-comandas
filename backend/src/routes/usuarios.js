const express = require('express');
const bcrypt = require('bcryptjs');
const pool = require('../config/db');
const verificarToken = require('../middlewares/auth');

const router = express.Router();

// Listar usuarios
router.get('/', verificarToken, async (req, res) => {
  const result = await pool.query(
    'SELECT id, nombre, email, creado_en FROM usuarios ORDER BY creado_en DESC'
  );
  res.json(result.rows);
});

// Crear usuario
router.post('/', verificarToken, async (req, res) => {
  const { nombre, email, password } = req.body;
  if (!nombre || !email || !password) {
    return res.status(400).json({ error: 'Todos los campos son requeridos' });
  }
  try {
    const hash = await bcrypt.hash(password, 10);
    const result = await pool.query(
      'INSERT INTO usuarios (nombre, email, password) VALUES ($1,$2,$3) RETURNING id, nombre, email, creado_en',
      [nombre, email, hash]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    if (err.code === '23505') return res.status(400).json({ error: 'El email ya existe' });
    res.status(500).json({ error: 'Error al crear usuario' });
  }
});

// Eliminar usuario
router.delete('/:id', verificarToken, async (req, res) => {
  if (parseInt(req.params.id) === req.usuario.id) {
    return res.status(400).json({ error: 'No podés eliminarte a vos mismo' });
  }
  await pool.query('DELETE FROM usuarios WHERE id = $1', [req.params.id]);
  res.json({ ok: true });
});

// Cambiar contraseña propia
router.patch('/password', verificarToken, async (req, res) => {
  const { password_actual, password_nuevo } = req.body;
  const result = await pool.query('SELECT * FROM usuarios WHERE id = $1', [req.usuario.id]);
  const usuario = result.rows[0];

  const valido = await bcrypt.compare(password_actual, usuario.password);
  if (!valido) return res.status(401).json({ error: 'Contraseña actual incorrecta' });

  const hash = await bcrypt.hash(password_nuevo, 10);
  await pool.query('UPDATE usuarios SET password = $1 WHERE id = $2', [hash, req.usuario.id]);
  res.json({ ok: true });
});

module.exports = router;