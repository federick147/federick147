const express = require('express');
const router = express.Router();
const { autenticarUsuario, autenticarAdmin } = require('../middleware/auth');
const { crearPaseGoogle, actualizarPaseGoogle, callbackWallet, actualizarOferta } = require('../controllers/walletController');

router.post('/google/crear', autenticarUsuario, crearPaseGoogle);
router.post('/google/actualizar/:cardId', autenticarAdmin, actualizarPaseGoogle);

// Callbacks de Google Wallet (sin autenticación — vienen de Google)
router.post('/callback', callbackWallet);
router.post('/callback/oferta', callbackWallet);
router.get('/actualizar-oferta/:objectId', actualizarOferta);

module.exports = router;
