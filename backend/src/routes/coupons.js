const express = require('express');
const router = express.Router();
const {
  listarCupones,
  detalleCupon,
  canjearCupon,
  crearCupon,
  actualizarCupon,
} = require('../controllers/couponController');
const { autenticarUsuario, autenticarAdmin } = require('../middleware/auth');

// ─── Cliente ──────────────────────────────────
router.get('/', autenticarUsuario, listarCupones);
router.get('/:id', autenticarUsuario, detalleCupon);
router.post('/canjear', autenticarUsuario, canjearCupon);

// ─── Admin ────────────────────────────────────
router.post('/admin/crear', autenticarAdmin, crearCupon);
router.put('/admin/:id', autenticarAdmin, actualizarCupon);

module.exports = router;
