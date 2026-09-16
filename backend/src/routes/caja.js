const express = require('express');
const pool = require('../config/db');
const verificarToken = require('../middlewares/auth');

const router = express.Router();

// Estado actual de la caja
router.get('/estado', verificarToken, async (req, res) => {
  const sesion = await pool.query(
    `SELECT * FROM sesiones_caja WHERE estado = 'abierta' ORDER BY abierta_en DESC LIMIT 1`
  );
  res.json(sesion.rows[0] || null);
});

// Abrir caja
router.post('/abrir', verificarToken, async (req, res) => {
  // Verificar que no haya una sesión abierta
  const abierta = await pool.query(
    `SELECT id FROM sesiones_caja WHERE estado = 'abierta'`
  );
  if (abierta.rows.length > 0) {
    return res.status(400).json({ error: 'Ya hay una sesión abierta' });
  }

  const result = await pool.query(
    `INSERT INTO sesiones_caja (abierta_en) VALUES (NOW()) RETURNING *`
  );
  res.status(201).json(result.rows[0]);
});

// Cerrar caja — calcula totales de comandas desde que se abrió
router.post('/cerrar', verificarToken, async (req, res) => {
  const sesion = await pool.query(
    `SELECT * FROM sesiones_caja WHERE estado = 'abierta' ORDER BY abierta_en DESC LIMIT 1`
  );
  if (!sesion.rows.length) {
    return res.status(400).json({ error: 'No hay sesión abierta' });
  }

  const s = sesion.rows[0];

  // Calcular ventas del período (sin incluir costo de envío, sin cancelados)
  const totales = await pool.query(
    `SELECT 
     COUNT(*) as total_pedidos,
     COALESCE(SUM(GREATEST(total - COALESCE(costo_envio, 0), 0)), 0) as total_ventas,
     COUNT(*) FILTER (WHERE tipo_entrega = 'domicilio') as total_envios,
     COALESCE(SUM(CASE WHEN tipo_entrega = 'domicilio' THEN COALESCE(costo_envio, 0) ELSE 0 END), 0) as monto_envios
   FROM comandas
   WHERE creado_en >= $1
     AND estado != 'cancelado'`,
    [s.abierta_en]
  );

  const { total_pedidos, total_ventas, total_envios, monto_envios } = totales.rows[0];

  const result = await pool.query(
    `UPDATE sesiones_caja 
   SET cerrada_en = NOW(), estado = 'cerrada', 
       total_pedidos = $1, total_ventas = $2,
       total_envios = $3, monto_envios = $4
   WHERE id = $5 RETURNING *`,
    [total_pedidos, total_ventas, total_envios, monto_envios, s.id]
  );

  res.json(result.rows[0]);
});

// Resumen en tiempo real de la sesión actual
router.get('/resumen-actual', verificarToken, async (req, res) => {
  const sesion = await pool.query(
    `SELECT * FROM sesiones_caja WHERE estado = 'abierta' ORDER BY abierta_en DESC LIMIT 1`
  );
  if (!sesion.rows.length) return res.json(null);

  const s = sesion.rows[0];
  const totales = await pool.query(
    `SELECT 
     COUNT(*) as total_pedidos,
     COALESCE(SUM(GREATEST(total - COALESCE(costo_envio, 0), 0)), 0) as total_ventas,
     COUNT(*) FILTER (WHERE tipo_entrega = 'domicilio') as total_envios,
     COALESCE(SUM(CASE WHEN tipo_entrega = 'domicilio' THEN COALESCE(costo_envio, 0) ELSE 0 END), 0) as monto_envios
   FROM comandas
   WHERE creado_en >= $1
     AND estado != 'cancelado'`,
    [s.abierta_en]
  );

  const { total_pedidos, total_ventas, total_envios, monto_envios } = totales.rows[0];

  res.json({
    ...s,
    total_pedidos: parseInt(totales.rows[0].total_pedidos),
    total_ventas: parseFloat(totales.rows[0].total_ventas),
    total_envios: parseInt(totales.rows[0].total_envios),
    monto_envios: parseFloat(totales.rows[0].monto_envios),
  });
});

// Historial de cierres
router.get('/historial', verificarToken, async (req, res) => {
  const result = await pool.query(
    `SELECT * FROM sesiones_caja 
     WHERE estado = 'cerrada' 
     ORDER BY cerrada_en DESC 
     LIMIT 30`
  );
  res.json(result.rows);
});

module.exports = router;