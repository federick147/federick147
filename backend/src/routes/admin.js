const express = require('express');
const router = express.Router();
const {
  dashboard,
  listarCuponesAdmin,
  historialDelDia,
} = require('../controllers/adminController');
const { autenticarAdmin } = require('../middleware/auth');

router.get('/dashboard', autenticarAdmin, dashboard);
router.get('/cupones', autenticarAdmin, listarCuponesAdmin);
router.get('/historial', autenticarAdmin, historialDelDia);

module.exports = router;
