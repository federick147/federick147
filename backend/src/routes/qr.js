const express = require('express');
const router = express.Router();
const {
  generarQR,
  escanearQR,
  infoClienteQR,
  buscarClientePorCodigo,
  sumarPuntosManual,
} = require('../controllers/qrController');
const { autenticarUsuario, autenticarAdmin } = require('../middleware/auth');

// Cliente genera su QR
router.get('/generar', autenticarUsuario, generarQR);

// Admin consulta info del cliente por QR (sin consumirlo)
router.post('/info', autenticarAdmin, infoClienteQR);

// Admin escanea y suma puntos (consume el QR)
router.post('/escanear', autenticarAdmin, escanearQR);
router.post('/scan', autenticarAdmin, escanearQR); // alias

// Admin busca cliente por código único
router.get('/cliente/:codigo', autenticarAdmin, buscarClientePorCodigo);

// Admin suma puntos manualmente (sin QR)
router.post('/sumar-puntos', autenticarAdmin, sumarPuntosManual);

module.exports = router;
