// test-print.js
require('dotenv').config();
const { imprimirComanda } = require('./src/services/printer');

imprimirComanda(
  { id: 1, creado_en: new Date(), cliente_nombre: 'Juan Pérez', cliente_direccion: 'Calle 123', cliente_celular: '3624000000', total: 4500, notas: 'Sin cebolla' },
  [{ cantidad: 1, nombre_producto: 'Hamburguesa Doble', subtotal: 3800 }, { cantidad: 1, nombre_producto: 'Coca-Cola', subtotal: 900 }]
)
  .then(() => console.log('Impreso OK'))
  .catch((e) => console.error('Error:', e.message));