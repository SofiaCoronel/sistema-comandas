const express = require('express');
const cors = require('cors');
const cron = require('node-cron');
require('dotenv').config();

const pool = require('./config/db');
const authRoutes = require('./routes/auth');
const catalogoRoutes = require('./routes/catalogo');
const comandasRoutes = require('./routes/comandas');

const app = express();
app.use(cors());
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/catalogo', catalogoRoutes);
app.use('/api/comandas', comandasRoutes);

// Limpieza automática de comandas > 60 días (todos los días a las 3am)
cron.schedule('0 3 * * *', async () => {
  await pool.query(`DELETE FROM comandas WHERE creado_en < NOW() - INTERVAL '60 days'`);
  console.log('Historial antiguo limpiado');
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Servidor corriendo en http://0.0.0.0:${PORT}`);
});