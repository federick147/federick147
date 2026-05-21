const express = require('express');
const router = express.Router();
const {
  dashboard,
  listarClientes,
  listarCuponesAdmin,
  crearCupon,
  historialDelDia,
} = require('../controllers/adminController');
const { autenticarAdmin } = require('../middleware/auth');

router.get('/dashboard', autenticarAdmin, dashboard);
router.get('/clientes', autenticarAdmin, listarClientes);
router.get('/cupones', autenticarAdmin, listarCuponesAdmin);
router.post('/cupones', autenticarAdmin, crearCupon);
router.get('/historial', autenticarAdmin, historialDelDia);

module.exports = router;
