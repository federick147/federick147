const express = require('express');
const router = express.Router();
const {
  registrarUsuario,
  loginUsuario,
  loginAdmin,
  refrescarToken,
  logout,
  obtenerPerfil,
} = require('../controllers/authController');
const { autenticarUsuario } = require('../middleware/auth');
const { loginRateLimiter, registroRateLimiter } = require('../middleware/rateLimit');

// ─── Rutas públicas ───────────────────────────
router.post('/registro', registroRateLimiter, registrarUsuario);
router.post('/login', loginRateLimiter, loginUsuario);
router.post('/admin/login', loginRateLimiter, loginAdmin);
router.post('/refresh', refrescarToken);

// ─── Rutas protegidas ─────────────────────────
router.post('/logout', autenticarUsuario, logout);
router.get('/perfil', autenticarUsuario, obtenerPerfil);

module.exports = router;
