const WebSocket = require('ws');
const express = require('express');
const http = require('http');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const { imprimirComanda } = require('./printer');

// Rutas base según si corre como .exe o como script
const BASE_DIR = process.pkg
  ? path.dirname(process.execPath)
  : path.join(__dirname, '..');

const CONFIG_PATH = path.join(BASE_DIR, 'config.json');

const BACKEND_WS = 'wss://sistema-comandas-backend.onrender.com';
const PANEL_PORT = 4000;

// Cargar/guardar config de impresoras
function cargarConfig() {
  if (!fs.existsSync(CONFIG_PATH)) {
    fs.writeFileSync(CONFIG_PATH, JSON.stringify({ impresoras: [] }, null, 2));
  }
  return JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf8'));
}

function guardarConfig(config) {
  fs.writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2));
}

// Listar impresoras instaladas en Windows
function listarImpresoras() {
  try {
    const output = execSync(
      'powershell -Command "Get-Printer | Select-Object Name, PortName | ConvertTo-Json"',
      { encoding: 'utf8' }
    );
    const parsed = JSON.parse(output);
    return Array.isArray(parsed) ? parsed : [parsed];
  } catch {
    return [];
  }
}

// Panel web de configuración
const app = express();
app.use(express.json());

const PUBLIC_DIR = process.pkg
  ? path.join(__dirname, '../public')
  : path.join(__dirname, '../public');
app.use(express.static(PUBLIC_DIR));

app.get('/api/impresoras', (req, res) => {
  res.json(listarImpresoras());
});

app.get('/api/config', (req, res) => {
  res.json(cargarConfig());
});

app.get('/api/health', (req, res) => {
  res.json({ ok: true, timestamp: new Date().toISOString() });
});

app.post('/api/config', (req, res) => {
  guardarConfig(req.body);
  res.json({ ok: true });
});

app.get('*', (req, res) => {
  res.sendFile(path.join(PUBLIC_DIR, 'index.html'));
});

const server = http.createServer(app);
server.listen(PANEL_PORT, () => {
  console.log(`Panel de config en http://localhost:${PANEL_PORT}`);
});

// WebSocket al backend
function conectar() {
  console.log(`Conectando a ${BACKEND_WS}...`);
  const ws = new WebSocket(BACKEND_WS);
  let pingInterval = null;

  ws.on('open', () => {
    console.log('Print Agent conectado al backend');

    // Enviar ping cada 20 segundos para mantener la conexión viva
    pingInterval = setInterval(() => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.ping();
      }
    }, 20000);
  });

  ws.on('pong', () => {
    // Conexión sigue viva
  });

  ws.on('message', async (data) => {
    try {
      const msg = JSON.parse(data);
      if (msg.type === 'nueva_comanda' || msg.type === 'reimprimir') {
        console.log(`Imprimiendo comanda #${msg.comanda.id}...`);
        const config = cargarConfig();
        for (const imp of config.impresoras) {
          try {
            await imprimirComanda(msg.comanda, msg.items, imp.PRINTER_NAME, imp.PRINTER_PORT);
            console.log(`✓ Impreso en ${imp.nombre}`);
          } catch (e) {
            console.error(`✗ Error en ${imp.nombre}:`, e.message);
          }
        }
      }
    } catch (e) {
      console.error('Error procesando mensaje:', e.message);
    }
  });

  ws.on('close', (code, reason) => {
    clearInterval(pingInterval);
    console.log(`Desconectado. Reconectando en 5s...`);
    setTimeout(conectar, 5000);
  });

  ws.on('error', (err) => {
    clearInterval(pingInterval);
    console.error('Error WS:', err.message);
  });
}

conectar();