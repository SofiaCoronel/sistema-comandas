const express = require('express');
const pool = require('../config/db');
const verificarToken = require('../middlewares/auth');

const router = express.Router();

// Obtener toda la config
router.get('/', async (req, res) => {
  const result = await pool.query('SELECT clave, valor FROM configuracion');
  const config = {};
  result.rows.forEach((r) => {
    try { config[r.clave] = JSON.parse(r.valor); }
    catch { config[r.clave] = r.valor; }
  });
  res.json(config);
});

// Actualizar una clave
router.put('/:clave', verificarToken, async (req, res) => {
  const { valor } = req.body;
  const valorStr = typeof valor === 'object' ? JSON.stringify(valor) : String(valor);
  await pool.query(
    `INSERT INTO configuracion (clave, valor) VALUES ($1, $2)
     ON CONFLICT (clave) DO UPDATE SET valor = $2`,
    [req.params.clave, valorStr]
  );
  res.json({ ok: true });
});

module.exports = router;