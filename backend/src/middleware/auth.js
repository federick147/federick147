const { verificarAccessToken } = require('../services/jwtService');

// Middleware para rutas de usuario
function autenticarUsuario(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Token de acceso requerido' });
    }

    const token = authHeader.split(' ')[1];
    const payload = verificarAccessToken(token);

    if (payload.tipo !== 'usuario') {
      return res.status(403).json({ error: 'Acceso no autorizado' });
    }

    req.usuario = payload;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Token inválido o expirado' });
  }
}

// Middleware para rutas de administrador de negocio
function autenticarAdmin(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Token de acceso requerido' });
    }

    const token = authHeader.split(' ')[1];
    const payload = verificarAccessToken(token);

    if (payload.tipo !== 'admin') {
      return res.status(403).json({ error: 'Acceso no autorizado' });
    }

    req.admin = payload;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Token inválido o expirado' });
  }
}

module.exports = { autenticarUsuario, autenticarAdmin };
