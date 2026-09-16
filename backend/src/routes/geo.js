const express = require('express');
const pool = require('../config/db');

const router = express.Router();

// Calcular precio de envío según distancia ingresada manualmente
router.post('/calcular-envio', async (req, res) => {
  const { distancia_km } = req.body;

  if (!distancia_km || isNaN(distancia_km) || distancia_km < 0) {
    return res.status(400).json({ error: 'Distancia inválida' });
  }

  try {
    const cfg = await pool.query(
      "SELECT valor FROM configuracion WHERE clave = 'envio_tabla'"
    );
    const tabla = JSON.parse(cfg.rows[0].valor);

    let precio;
    const distancia = parseFloat(distancia_km);

    // Buscar en la tabla hasta 5.5km
    const tramo = tabla.find((t) => distancia <= t.hasta_km);

    if (tramo && tramo.hasta_km < 99) {
      // Está dentro de la tabla normal
      precio = tramo.precio;
    } else {
      // Más de 5.5km — calcular dinámicamente
      // Base: $3900 (precio de 5.5km)
      // Cada 500m (0.5km) adicionales = +$200
      const BASE_PRECIO = 3900;
      const BASE_KM = 5.5;
      const PRECIO_POR_500M = 200;

      const kmExtra = distancia - BASE_KM;
      const tramos500m = Math.ceil(kmExtra / 0.5);
      precio = BASE_PRECIO + (tramos500m * PRECIO_POR_500M);
    }

    res.json({ distancia_km: distancia, precio });
  } catch (e) {
    res.status(500).json({ error: 'Error al calcular envío' });
  }
});

// Estado del contador (ya no aplica, pero lo dejamos para no romper el frontend)
router.get('/estado', async (req, res) => {
  res.json({ requests_hoy: 0, limite: 0, restantes: 0 });
});

module.exports = router;