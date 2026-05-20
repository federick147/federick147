const express = require('express');
const router = express.Router();
const { generarQR, escanearQR, infoClienteQR } = require('../controllers/qrController');
const { autenticarUsuario, autenticarAdmin } = require('../middleware/auth');

// Cliente genera su QR
router.get('/generar', autenticarUsuario, generarQR);

// Admin consulta info del cliente por QR (sin consumirlo)
router.post('/info', autenticarAdmin, infoClienteQR);

// Admin escanea y suma puntos (consume el QR)
router.post('/escanear', autenticarAdmin, escanearQR);

module.exports = router;
