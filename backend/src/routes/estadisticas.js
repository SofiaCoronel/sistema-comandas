const express = require('express');
const pool = require('../config/db');
const verificarToken = require('../middlewares/auth');

const router = express.Router();

// Ventas por día (últimos 30 días)
router.get('/ventas-por-dia', verificarToken, async (req, res) => {
  const result = await pool.query(`
    SELECT 
      DATE(creado_en) as fecha,
      COUNT(*) as total_pedidos,
      COALESCE(SUM(GREATEST(total - COALESCE(costo_envio, 0), 0)), 0) as total_ventas,
      COALESCE(SUM(COALESCE(costo_envio, 0)), 0) as total_envios
    FROM comandas
    WHERE creado_en > NOW() - INTERVAL '30 days'
      AND estado != 'cancelado'
    GROUP BY DATE(creado_en)
    ORDER BY fecha ASC
  `);
  res.json(result.rows);
});

// Productos más vendidos
router.get('/productos-top', verificarToken, async (req, res) => {
  const result = await pool.query(`
    SELECT 
      ci.nombre_producto,
      SUM(ci.cantidad) as total_vendido,
      SUM(ci.subtotal) as total_facturado
    FROM comanda_items ci
    JOIN comandas c ON c.id = ci.comanda_id
    WHERE c.estado != 'cancelado'
      AND c.creado_en > NOW() - INTERVAL '30 days'
    GROUP BY ci.nombre_producto
    ORDER BY total_vendido DESC
    LIMIT 8
  `);
  res.json(result.rows);
});

// Resumen general
router.get('/resumen', verificarToken, async (req, res) => {
  const hoy = await pool.query(`
    SELECT 
      COUNT(*) as pedidos_hoy,
      COALESCE(SUM(GREATEST(total - COALESCE(costo_envio, 0), 0)), 0) as ventas_hoy
    FROM comandas
    WHERE DATE(creado_en) = CURRENT_DATE
      AND estado != 'cancelado'
  `);

  const mes = await pool.query(`
    SELECT 
      COUNT(*) as pedidos_mes,
      COALESCE(SUM(GREATEST(total - COALESCE(costo_envio, 0), 0)), 0) as ventas_mes
    FROM comandas
    WHERE DATE_TRUNC('month', creado_en) = DATE_TRUNC('month', CURRENT_DATE)
      AND estado != 'cancelado'
  `);

  const cancelados = await pool.query(`
    SELECT COUNT(*) as cancelados_mes
    FROM comandas
    WHERE DATE_TRUNC('month', creado_en) = DATE_TRUNC('month', CURRENT_DATE)
      AND estado = 'cancelado'
  `);

  res.json({
    ...hoy.rows[0],
    ...mes.rows[0],
    ...cancelados.rows[0],
  });
});

module.exports = router;