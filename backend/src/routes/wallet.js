const express = require('express');
const router = express.Router();
const { autenticarUsuario, autenticarAdmin } = require('../middleware/auth');
const { crearPaseGoogle, actualizarPaseGoogle } = require('../controllers/walletController');

// Usuario autenticado obtiene su URL "Añadir a Google Wallet"
router.post('/google/crear', autenticarUsuario, crearPaseGoogle);

// Admin (o proceso interno) actualiza el pase tras un escaneo
router.post('/google/actualizar/:cardId', autenticarAdmin, actualizarPaseGoogle);

module.exports = router;
