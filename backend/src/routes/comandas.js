const express = require('express');
const pool = require('../config/db');
const verificarToken = require('../middlewares/auth');

const router = express.Router();

router.post('/', async (req, res) => {
  const { cliente_nombre, cliente_direccion, cliente_celular, items, notas, tipo_entrega, envio_pagado, costo_envio } = req.body;

  if (!items || items.length === 0) {
    return res.status(400).json({ error: 'La comanda debe tener al menos un producto' });
  }

  const total = items.reduce((acc, it) => acc + it.precio_unitario * it.cantidad, 0) + (tipo_entrega === 'domicilio' ? Number(costo_envio || 0) : 0);
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const comandaResult = await client.query(
    `INSERT INTO comandas (cliente_nombre, cliente_direccion, cliente_celular, total, notas, tipo_entrega, envio_pagado, costo_envio)
    VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
    [cliente_nombre, cliente_direccion, cliente_celular, total, notas, tipo_entrega || 'domicilio', envio_pagado || false, costo_envio || 0]
    );
    const comanda = comandaResult.rows[0];

    const itemsGuardados = [];
    for (const it of items) {
      const subtotal = it.precio_unitario * it.cantidad;
      const r = await client.query(
        `INSERT INTO comanda_items (comanda_id, producto_id, nombre_producto, precio_unitario, cantidad, subtotal)
         VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
        [comanda.id, it.producto_id, it.nombre_producto, it.precio_unitario, it.cantidad, subtotal]
      );
      itemsGuardados.push(r.rows[0]);
    }

    await client.query('COMMIT');

    // Notificar al Print Agent via WebSocket
    const wss = req.app.get('wss');
    if (wss) {
      const payload = JSON.stringify({ type: 'nueva_comanda', comanda, items: itemsGuardados });
      wss.clients.forEach((ws) => {
        if (ws.readyState === 1) ws.send(payload);
      });
    }

    res.status(201).json({ comanda, items: itemsGuardados });
  } catch (err) {
    await client.query('ROLLBACK');
    res.status(500).json({ error: 'Error al crear la comanda' });
  } finally {
    client.release();
  }
});

router.get('/', verificarToken, async (req, res) => {
  const { fecha } = req.query;

  if (fecha) {
    // Buscar por día específico
    const result = await pool.query(
      `SELECT * FROM comandas 
       WHERE DATE(creado_en) = $1 
       ORDER BY creado_en DESC`,
      [fecha]
    );
    return res.json(result.rows);
  }

  // Solo mostrar pedidos de la sesión actual
  const sesion = await pool.query(
    `SELECT abierta_en FROM sesiones_caja WHERE estado = 'abierta' ORDER BY abierta_en DESC LIMIT 1`
  );

  if (!sesion.rows.length) {
    return res.json([]);
  }

  const result = await pool.query(
    `SELECT * FROM comandas 
     WHERE creado_en >= $1 
     ORDER BY creado_en DESC`,
    [sesion.rows[0].abierta_en]
  );
  res.json(result.rows);
});

router.get('/:id', verificarToken, async (req, res) => {
  const comanda = await pool.query('SELECT * FROM comandas WHERE id = $1', [req.params.id]);
  const items = await pool.query('SELECT * FROM comanda_items WHERE comanda_id = $1', [req.params.id]);
  res.json({ comanda: comanda.rows[0], items: items.rows });
});

router.post('/:id/reimprimir', verificarToken, async (req, res) => {
  const comanda = await pool.query('SELECT * FROM comandas WHERE id = $1', [req.params.id]);
  const items = await pool.query('SELECT * FROM comanda_items WHERE comanda_id = $1', [req.params.id]);

  // Notificar al agent para reimprimir
  const wss = req.app.get('wss');
  if (wss) {
    const payload = JSON.stringify({ type: 'reimprimir', comanda: comanda.rows[0], items: items.rows });
    wss.clients.forEach((ws) => {
      if (ws.readyState === 1) ws.send(payload);
    });
  }
  res.json({ ok: true });
});

router.patch('/:id/estado', verificarToken, async (req, res) => {
  const { estado } = req.body;
  const result = await pool.query(
    'UPDATE comandas SET estado = $1 WHERE id = $2 RETURNING *',
    [estado, req.params.id]
  );

  // Notificar a todos los clientes WS
  const wss = req.app.get('wss');
  if (wss) {
    const payload = JSON.stringify({ type: 'estado_actualizado', comanda: result.rows[0] });
    wss.clients.forEach((ws) => {
      if (ws.readyState === 1) ws.send(payload);
    });
  }

  res.json(result.rows[0]);
});

module.exports = router;