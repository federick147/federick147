const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// ─── Access Token (15 min) ────────────────────
function generarAccessToken(payload) {
  return jwt.sign(payload, process.env.JWT_ACCESS_SECRET, {
    expiresIn: process.env.JWT_ACCESS_EXPIRES || '15m',
  });
}

// ─── Refresh Token (30 días) ──────────────────
function generarRefreshToken(payload) {
  return jwt.sign(payload, process.env.JWT_REFRESH_SECRET, {
    expiresIn: process.env.JWT_REFRESH_EXPIRES || '30d',
  });
}

// ─── Token QR firmado (30 segundos) ──────────
function generarQRToken(userId) {
  const timestamp = Date.now();
  const token = jwt.sign(
    { user_id: userId, timestamp, tipo: 'qr' },
    process.env.JWT_QR_SECRET,
    { expiresIn: '30s' }
  );
  const hash = crypto.createHash('sha256').update(token).digest('hex');
  return { token, hash };
}

function verificarQRToken(token) {
  return jwt.verify(token, process.env.JWT_QR_SECRET);
}

function verificarAccessToken(token) {
  return jwt.verify(token, process.env.JWT_ACCESS_SECRET);
}

function verificarRefreshToken(token) {
  return jwt.verify(token, process.env.JWT_REFRESH_SECRET);
}

// ─── Guardar refresh token en BD ──────────────
async function guardarRefreshTokenUsuario(userId, token) {
  const hash = crypto.createHash('sha256').update(token).digest('hex');
  const expira = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 días

  await prisma.refreshToken.upsert({
    where: { token_hash: hash },
    update: { expira_en: expira },
    create: { user_id: userId, token_hash: hash, expira_en: expira },
  });
}

async function guardarRefreshTokenAdmin(adminId, token) {
  const hash = crypto.createHash('sha256').update(token).digest('hex');
  const expira = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

  await prisma.adminRefreshToken.upsert({
    where: { token_hash: hash },
    update: { expira_en: expira },
    create: { admin_id: adminId, token_hash: hash, expira_en: expira },
  });
}

async function revocarRefreshToken(token) {
  const hash = crypto.createHash('sha256').update(token).digest('hex');
  await prisma.refreshToken.deleteMany({ where: { token_hash: hash } });
}

module.exports = {
  generarAccessToken,
  generarRefreshToken,
  generarQRToken,
  verificarQRToken,
  verificarAccessToken,
  verificarRefreshToken,
  guardarRefreshTokenUsuario,
  guardarRefreshTokenAdmin,
  revocarRefreshToken,
};
