const express = require('express');
const router = express.Router();
const { historialCliente } = require('../controllers/transactionController');
const { autenticarUsuario } = require('../middleware/auth');

router.get('/historial', autenticarUsuario, historialCliente);

module.exports = router;
