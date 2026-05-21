const { PrismaClient } = require('@prisma/client');
const { generarURLWallet, actualizarTarjeta } = require('../services/walletService');

const prisma = new PrismaClient();

// POST /api/wallet/google/crear
async function crearPaseGoogle(req, res) {
  try {
    const usuarioId = req.usuario.sub;

    const usuario = await prisma.user.findUnique({
      where: { id: usuarioId },
      include: { tarjeta: true },
    });

    if (!usuario) return res.status(404).json({ error: 'Usuario no encontrado' });
    if (!usuario.tarjeta) return res.status(404).json({ error: 'El usuario no tiene tarjeta de fidelización' });

    const url = await generarURLWallet(usuario, usuario.tarjeta);
    res.json({ url });
  } catch (err) {
    console.error('Error generando pase Google Wallet:', err);
    res.status(500).json({ error: 'No se pudo generar el pase de Google Wallet' });
  }
}

// POST /api/wallet/google/actualizar/:cardId
async function actualizarPaseGoogle(req, res) {
  try {
    const { cardId } = req.params;

    const tarjeta = await prisma.loyaltyCard.findUnique({
      where: { id: cardId },
    });

    if (!tarjeta) return res.status(404).json({ error: 'Tarjeta no encontrada' });

    await actualizarTarjeta(tarjeta);
    res.json({ ok: true });
  } catch (err) {
    console.error('Error actualizando pase Google Wallet:', err);
    res.status(500).json({ error: 'No se pudo actualizar el pase de Google Wallet' });
  }
}

module.exports = { crearPaseGoogle, actualizarPaseGoogle };
