const { imprimirComanda } = require('./src/printer');

imprimirComanda(
  {
    id: 99,
    creado_en: new Date(),
    cliente_nombre: 'Juan Pérez',
    cliente_direccion: 'Av. Sarmiento 1234, Resistencia',
    cliente_celular: '3624000000',
    total: 26800,
    costo_envio: 3000,
    tipo_entrega: 'domicilio',
    envio_pagado: false,
    notas: 'Sin cebolla'
  },
  [
    { cantidad: 1, nombre_producto: 'Hamburguesa', precio_unitario: 3800, subtotal: 3800 },
    { cantidad: 2, nombre_producto: 'Promo Pizza', precio_unitario: 10000, subtotal: 20000 },
  ],
  'POS-80',
  'USB001'
)
  .then(() => console.log('Impreso OK'))
  .catch((e) => console.error('Error:', e.message));