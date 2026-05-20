const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// ─────────────────────────────────────────────
// HISTORIAL DEL CLIENTE
// ─────────────────────────────────────────────
async function historialCliente(req, res) {
  try {
    const userId = req.usuario.sub;
    const { pagina = 1, limite = 20 } = req.query;
    const skip = (parseInt(pagina) - 1) * parseInt(limite);

    const tarjeta = await prisma.loyaltyCard.findUnique({
      where: { user_id: userId },
    });

    if (!tarjeta) {
      return res.status(404).json({ error: 'Tarjeta no encontrada' });
    }

    const [total, transacciones] = await Promise.all([
      prisma.transaction.count({ where: { card_id: tarjeta.id } }),
      prisma.transaction.findMany({
        where: { card_id: tarjeta.id },
        include: {
          negocio: { select: { nombre: true, logo_url: true } },
        },
        orderBy: { creado_en: 'desc' },
        skip,
        take: parseInt(limite),
      }),
    ]);

    return res.json({
      total,
      pagina: parseInt(pagina),
      total_paginas: Math.ceil(total / parseInt(limite)),
      transacciones,
    });
  } catch (error) {
    console.error('Error al obtener historial:', error);
    return res.status(500).json({ error: 'Error al obtener historial' });
  }
}

module.exports = { historialCliente };
