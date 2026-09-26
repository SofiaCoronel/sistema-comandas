const fs = require('fs');
const path = require('path');
const os = require('os');
const { execFile } = require('child_process');

const ESC = 0x1B;
const GS = 0x1D;

const CMD = {
  INIT: Buffer.from([ESC, 0x40]),
  ALIGN_CT: Buffer.from([ESC, 0x61, 0x01]),
  ALIGN_LT: Buffer.from([ESC, 0x61, 0x00]),
  ALIGN_RT: Buffer.from([ESC, 0x61, 0x02]),
  BOLD_ON: Buffer.from([ESC, 0x45, 0x01]),
  BOLD_OFF: Buffer.from([ESC, 0x45, 0x00]),
  FONT_LARGE: Buffer.from([GS, 0x21, 0x11]),
  FONT_NORMAL: Buffer.from([GS, 0x21, 0x00]),
  CUT: Buffer.from([GS, 0x56, 0x42, 0x00]),
  LF: Buffer.from([0x0A]),
};

function txt(str) {
  return Buffer.from(str + '\n', 'latin1');
}

function linea() {
  return txt('-'.repeat(40));
}

function limpiarDireccion(dir) {
  if (!dir) return '-';
  const partes = dir.split(',').map(p => p.trim());
  const numero = partes[0]; // "150"
  const calle = partes[1];  // "Avenida Laprida"
  if (!isNaN(numero) && calle) {
    return `${calle} ${numero}`;
  }
  return partes.slice(0, 2).join(', ');
}

function buildTicket(comanda, items) {
  const buffers = [];

  buffers.push(CMD.INIT);

  // Título
  buffers.push(CMD.ALIGN_CT);
  buffers.push(CMD.BOLD_ON);
  buffers.push(CMD.FONT_LARGE);
  buffers.push(txt('PEDIDO'));
  buffers.push(CMD.FONT_NORMAL);
  buffers.push(CMD.BOLD_OFF);
  buffers.push(linea());

  // Datos del cliente
  buffers.push(CMD.ALIGN_LT);
  buffers.push(txt(`ID: #${comanda.id}`));
  const fecha = new Date(comanda.creado_en);
  buffers.push(txt(`Fecha: ${fecha.toLocaleDateString('es-AR')}`));
  buffers.push(txt(`Hora:  ${fecha.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}`));
  buffers.push(txt(`Cliente: ${comanda.cliente_nombre}`));
  buffers.push(txt(`Direccion: ${limpiarDireccion(comanda.cliente_direccion)}`)); buffers.push(txt(`Telefono: ${comanda.cliente_celular || '-'}`));
  buffers.push(linea());

  // Items
  const subtotal = items.reduce((acc, it) => acc + Number(it.subtotal), 0);

  items.forEach((it) => {
    const cant = `${it.cantidad}x`;
    const nombre = it.nombre_producto.toUpperCase().substring(0, 20);
    const precio = `$${Number(it.subtotal).toFixed(2)}`;
    const espacios = Math.max(1, 40 - cant.length - nombre.length - precio.length);
    buffers.push(txt(`${cant} ${nombre}${' '.repeat(espacios)}${precio}`));
  });

  buffers.push(CMD.LF);

  // Tipo de entrega
  if (comanda.tipo_entrega === 'domicilio') {
    const estadoPago = comanda.envio_pagado ? 'PAGADO' : 'PAGA AL RECIBIR';
    buffers.push(CMD.BOLD_ON);
    buffers.push(txt(`ENVIO A DOMICILIO - ${estadoPago}`));
    buffers.push(CMD.BOLD_OFF);
  } else {
    const estadoPago = comanda.envio_pagado ? 'PAGADO' : 'PAGA AL RETIRAR';
    buffers.push(CMD.BOLD_ON);
    buffers.push(txt(`RETIRO EN TIENDA - ${estadoPago}`));
    buffers.push(CMD.BOLD_OFF);
  }

  if (comanda.notas) {
    buffers.push(txt(`Notas: ${comanda.notas}`));
  }

  buffers.push(linea());

  // Subtotal, envío y total
  const costoEnvio = Number(comanda.costo_envio || 0);

  const lineaSubtotal = `Subtotal:`;
  const valSubtotal = `$${subtotal.toFixed(2)}`;
  buffers.push(txt(`${lineaSubtotal}${' '.repeat(Math.max(1, 40 - lineaSubtotal.length - valSubtotal.length))}${valSubtotal}`));

  if (comanda.tipo_entrega === 'domicilio') {
    const lineaEnvio = `Envio:`;
    const valEnvio = `$${costoEnvio.toFixed(2)}`;
    buffers.push(txt(`${lineaEnvio}${' '.repeat(Math.max(1, 40 - lineaEnvio.length - valEnvio.length))}${valEnvio}`));
  }

  const lineaTotal = `TOTAL:`;
  const valTotal = `$${Number(comanda.total).toFixed(2)}`;
  buffers.push(CMD.BOLD_ON);
  buffers.push(txt(`${lineaTotal}${' '.repeat(Math.max(1, 40 - lineaTotal.length - valTotal.length))}${valTotal}`));
  buffers.push(CMD.BOLD_OFF);

  buffers.push(CMD.LF);
  buffers.push(CMD.LF);
  buffers.push(CMD.CUT);

  return Buffer.concat(buffers);
}

async function imprimirComanda(comanda, items, printerName, printerPort) {
  const ticket = buildTicket(comanda, items);
  const tmpFile = path.join(os.tmpdir(), `comanda-${comanda.id}.bin`);
  fs.writeFileSync(tmpFile, ticket);

  // Extraer rawprint.ps1 del snapshot pkg a una ruta física real
  const psDestino = path.join(os.tmpdir(), 'rawprint.ps1');
  if (!fs.existsSync(psDestino)) {
    const psOrigen = path.join(__dirname, 'rawprint.ps1');
    fs.copyFileSync(psOrigen, psDestino);
  }

  return new Promise((resolve, reject) => {
    execFile('powershell.exe', [
      '-NoProfile',
      '-ExecutionPolicy', 'Bypass',
      '-File', psDestino,
      '-printer', printerName,
      '-file', tmpFile,
    ], { timeout: 10000 }, (err, stdout, stderr) => {
      setTimeout(() => fs.unlink(tmpFile, () => {}), 3000);
      if (err) reject(new Error(stderr || err.message));
      else resolve();
    });
  });
}

module.exports = { imprimirComanda };