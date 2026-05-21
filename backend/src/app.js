const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const cookieParser = require('cookie-parser');

const authRoutes = require('./routes/auth');
const qrRoutes = require('./routes/qr');
const couponRoutes = require('./routes/coupons');
const transactionRoutes = require('./routes/transactions');
const adminRoutes = require('./routes/admin');
const walletRoutes = require('./routes/wallet');
const { globalRateLimiter } = require('./middleware/rateLimit');

const app = express();

// ─── Seguridad ───────────────────────────────
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || '*',
  credentials: true,
}));

// ─── Parsers ──────────────────────────────────
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(compression());

// ─── Rate limiting global ────────────────────
app.use(globalRateLimiter);

// ─── Rutas ───────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/qr', qrRoutes);
app.use('/api/coupons', couponRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/wallet', walletRoutes);

// ─── Health check ────────────────────────────
app.get('/health', (req, res) => {
  res.json({ status: 'ok', app: 'Veris Loyalty', version: '1.0.0' });
});

// ─── Manejo de errores global ────────────────
app.use((err, req, res, next) => {
  console.error('Error no manejado:', err);
  res.status(err.status || 500).json({
    error: err.message || 'Error interno del servidor',
  });
});

module.exports = app;
