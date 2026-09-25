const express = require('express');
const cors = require('cors');
const http = require('http');
const WebSocket = require('ws');
const cron = require('node-cron');
require('dotenv').config();

const pool = require('./config/db');

const authRoutes = require('./routes/auth');
const catalogoRoutes = require('./routes/catalogo');
const comandasRoutes = require('./routes/comandas');
const usuariosRoutes = require('./routes/usuarios');
const configuracionRoutes = require('./routes/configuracion');
const geoRoutes = require('./routes/geo');
const clientesRoutes = require('./routes/clientes');
const cajaRoutes = require('./routes/caja');
const estadisticasRoutes = require('./routes/estadisticas');

const app = express();

app.use(cors());
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/catalogo', catalogoRoutes);
app.use('/api/comandas', comandasRoutes);
app.use('/api/usuarios', usuariosRoutes);
app.use('/api/configuracion', configuracionRoutes);
app.use('/api/geo', geoRoutes);
app.use('/api/clientes', clientesRoutes);
app.use('/api/caja', cajaRoutes);
app.use('/api/estadisticas', estadisticasRoutes);

// Health check
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    websocket: 'active'
  });
});

// Servidor HTTP
const server = http.createServer(app);

// WebSocket
const wss = new WebSocket.Server({ server });

app.set('wss', wss);

wss.on('connection', (ws, req) => {
  console.log('🟢 Print Agent conectado');
  console.log('IP:', req.socket.remoteAddress);

  // Confirmar conexión
  ws.send(JSON.stringify({
    tipo: 'conexion_ok',
    mensaje: 'Print Agent conectado correctamente'
  }));

  ws.on('message', (message) => {
    console.log('📨 Mensaje del Print Agent:', message.toString());
  });

  ws.on('error', (error) => {
    console.error('❌ Error WebSocket:', error);
  });

  ws.on('close', (code, reason) => {
    console.log('🔴 Print Agent desconectado');
    console.log('Código:', code);
    console.log('Razón:', reason.toString());
  });
});

// Cron
cron.schedule('0 0 * * *', async () => {
  await pool.query(
    "UPDATE configuracion SET valor = '0' WHERE clave = 'osrm_requests_hoy'"
  );

  console.log('Contador OSRM reseteado');
});

// Puerto
const PORT = process.env.PORT || 3000;

server.listen(PORT, '0.0.0.0', () => {
  console.log(`Servidor corriendo en http://0.0.0.0:${PORT}`);
});