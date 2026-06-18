const jwt = require('jsonwebtoken');

function verificarToken(req, res, next) {
  const header = req.headers.authorization;
  if (!header) return res.status(401).json({ error: 'Token requerido' });

  const token = header.split(' ')[1];
  try {
    const data = jwt.verify(token, process.env.JWT_SECRET);
    req.usuario = data;
    next();
  } catch {
    res.status(401).json({ error: 'Token inválido' });
  }
}

module.exports = verificarToken;