const fs = require('fs');
const path = require('path');
const os = require('os');
const { execFile } = require('child_process');
require('dotenv').config();

const ESC = 0x1B;
const GS  = 0x1D;

const CMD = {
  INIT:        Buffer.from([ESC, 0x40]),
  ALIGN_CT:    Buffer.from([ESC, 0x61, 0x01]),
  ALIGN_LT:    Buffer.from([ESC, 0x61, 0x00]),
  ALIGN_RT:    Buffer.from([ESC, 0x61, 0x02]),
  BOLD_ON:     Buffer.from([ESC, 0x45, 0x01]),
  BOLD_OFF:    Buffer.from([ESC, 0x45, 0x00]),
  FONT_LARGE:  Buffer.from([GS,  0x21, 0x11]),
  FONT_NORMAL: Buffer.from([GS,  0x21, 0x00]),
  CUT:         Buffer.from([GS,  0x56, 0x42, 0x00]),
  LF:          Buffer.from([0x0A]),
};

function txt(str) {
  return Buffer.from(str + '\n', 'latin1');
}

function linea() {
  return txt('-'.repeat(40));
}

function buildTicket(comanda, items) {
  const buffers = [];

  buffers.push(CMD.INIT);
  buffers.push(CMD.ALIGN_CT);
  buffers.push(CMD.BOLD_ON);
  buffers.push(CMD.FONT_LARGE);
  buffers.push(txt('COMANDA'));
  buffers.push(CMD.FONT_NORMAL);
  buffers.push(CMD.BOLD_OFF);
  buffers.push(linea());

  buffers.push(CMD.ALIGN_LT);
  buffers.push(txt(`#${comanda.id}  ${new Date(comanda.creado_en).toLocaleString('es-AR')}`));
  buffers.push(txt(`Cliente: ${comanda.cliente_nombre}`));
  buffers.push(txt(`Dir: ${comanda.cliente_direccion || '-'}`));
  buffers.push(txt(`Tel: ${comanda.cliente_celular || '-'}`));
  buffers.push(linea());

  items.forEach((it) => {
    const nombre = `${it.cantidad}x ${it.nombre_producto}`;
    const precio = `$${Number(it.subtotal).toFixed(2)}`;
    const espacios = Math.max(1, 40 - nombre.length - precio.length);
    buffers.push(txt(nombre + ' '.repeat(espacios) + precio));
  });

  buffers.push(linea());
  buffers.push(CMD.ALIGN_RT);
  buffers.push(CMD.BOLD_ON);
  buffers.push(txt(`TOTAL: $${Number(comanda.total).toFixed(2)}`));
  buffers.push(CMD.BOLD_OFF);
  buffers.push(CMD.ALIGN_LT);

  if (comanda.notas) {
    buffers.push(linea());
    buffers.push(txt(`Notas: ${comanda.notas}`));
  }

  buffers.push(CMD.LF);
  buffers.push(CMD.LF);
  buffers.push(CMD.CUT);

  return Buffer.concat(buffers);
}

async function imprimirComanda(comanda, items) {
  const ticket = buildTicket(comanda, items);
  const tmpFile = path.join(os.tmpdir(), `comanda-${comanda.id}.bin`);
  fs.writeFileSync(tmpFile, ticket);

  const psScript = path.join(__dirname, '../services/rawprint.ps1');

  return new Promise((resolve, reject) => {
    execFile('powershell.exe', [
      '-NoProfile',
      '-ExecutionPolicy', 'Bypass',
      '-File', psScript,
      '-printer', process.env.PRINTER_NAME,
      '-file', tmpFile,
    ], { timeout: 10000 }, (err, stdout, stderr) => {
      setTimeout(() => fs.unlink(tmpFile, () => {}), 3000);
      if (err) reject(new Error(stderr || err.message));
      else resolve();
    });
  });
}

module.exports = { imprimirComanda };