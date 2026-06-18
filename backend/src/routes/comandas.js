const express = require('express');
const pool = require('../config/db');
const verificarToken = require('../middlewares/auth');
const { imprimirComanda } = require('../services/printer');

const router = express.Router();

// Crear comanda + items, e imprimir automáticamente
router.post('/', async (req, res) => {
  const { cliente_nombre, cliente_direccion, cliente_celular, items, notas } = req.body;

  if (!items || items.length === 0) {
    return res.status(400).json({ error: 'La comanda debe tener al menos un producto' });
  }

  const total = items.reduce((acc, it) => acc + it.precio_unitario * it.cantidad, 0);

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const comandaResult = await client.query(
      `INSERT INTO comandas (cliente_nombre, cliente_direccion, cliente_celular, total, notas)
       VALUES ($1,$2,$3,$4,$5) RETURNING *`,
      [cliente_nombre, cliente_direccion, cliente_celular, total, notas]
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

    // Imprimir en cocina (no bloquea la respuesta si falla)
    let impreso = true;
    let errorImpresion = null;
    try {
      await imprimirComanda(comanda, itemsGuardados);
    } catch (e) {
      impreso = false;
      errorImpresion = e.message;
      console.error('Error de impresión:', e.message);
    }

    res.status(201).json({ comanda, items: itemsGuardados, impreso, errorImpresion });
  } catch (err) {
    await client.query('ROLLBACK');
    res.status(500).json({ error: 'Error al crear la comanda' });
  } finally {
    client.release();
  }
});

// Listar comandas (historial, últimos 60 días)
router.get('/', verificarToken, async (req, res) => {
  const result = await pool.query(
    `SELECT * FROM comandas WHERE creado_en > NOW() - INTERVAL '60 days' ORDER BY creado_en DESC`
  );
  res.json(result.rows);
});

// Ver una comanda con sus items
router.get('/:id', verificarToken, async (req, res) => {
  const comanda = await pool.query('SELECT * FROM comandas WHERE id = $1', [req.params.id]);
  const items = await pool.query('SELECT * FROM comanda_items WHERE comanda_id = $1', [req.params.id]);
  res.json({ comanda: comanda.rows[0], items: items.rows });
});

// Reimprimir
router.post('/:id/reimprimir', verificarToken, async (req, res) => {
  const comanda = await pool.query('SELECT * FROM comandas WHERE id = $1', [req.params.id]);
  const items = await pool.query('SELECT * FROM comanda_items WHERE comanda_id = $1', [req.params.id]);
  try {
    await imprimirComanda(comanda.rows[0], items.rows);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Cambiar estado
router.patch('/:id/estado', verificarToken, async (req, res) => {
  const { estado } = req.body;
  const result = await pool.query(
    'UPDATE comandas SET estado = $1 WHERE id = $2 RETURNING *',
    [estado, req.params.id]
  );
  res.json(result.rows[0]);
});

module.exports = router;