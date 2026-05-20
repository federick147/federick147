const { PrismaClient } = require('@prisma/client');
const { v4: uuidv4 } = require('uuid');

const prisma = new PrismaClient();

// ─────────────────────────────────────────────
// LISTAR CUPONES DISPONIBLES (para el cliente)
// ─────────────────────────────────────────────
async function listarCupones(req, res) {
  try {
    const ahora = new Date();

    const cupones = await prisma.coupon.findMany({
      where: {
        activo: true,
        OR: [
          { fecha_vencimiento: null },
          { fecha_vencimiento: { gt: ahora } },
        ],
        fecha_inicio: { lte: ahora },
      },
      include: {
        negocio: { select: { nombre: true, logo_url: true } },
      },
      orderBy: { creado_en: 'desc' },
    });

    // Marcar si vence hoy
    const cuponesConBadge = cupones.map((c) => {
      const venceHoy =
        c.fecha_vencimiento &&
        c.fecha_vencimiento.toDateString() === ahora.toDateString();
      return { ...c, vence_hoy: venceHoy };
    });

    return res.json({ cupones: cuponesConBadge });
  } catch (error) {
    console.error('Error al listar cupones:', error);
    return res.status(500).json({ error: 'Error al obtener cupones' });
  }
}

// ─────────────────────────────────────────────
// DETALLE DE UN CUPÓN
// ─────────────────────────────────────────────
async function detalleCupon(req, res) {
  try {
    const { id } = req.params;

    const cupon = await prisma.coupon.findUnique({
      where: { id },
      include: {
        negocio: { select: { nombre: true, logo_url: true, direccion: true } },
      },
    });

    if (!cupon || !cupon.activo) {
      return res.status(404).json({ error: 'Cupón no encontrado' });
    }

    return res.json({ cupon });
  } catch (error) {
    console.error('Error al obtener detalle del cupón:', error);
    return res.status(500).json({ error: 'Error interno' });
  }
}

// ─────────────────────────────────────────────
// CANJEAR CUPÓN (cliente)
// ─────────────────────────────────────────────
async function canjearCupon(req, res) {
  try {
    const { coupon_id } = req.body;
    const userId = req.usuario.sub;

    if (!coupon_id) {
      return res.status(400).json({ error: 'ID de cupón requerido' });
    }

    const resultado = await prisma.$transaction(async (tx) => {
      // Verificar cupón existe y está activo
      const cupon = await tx.coupon.findUnique({ where: { id: coupon_id } });
      if (!cupon || !cupon.activo) {
        throw { status: 404, message: 'Cupón no disponible' };
      }

      const ahora = new Date();
      if (cupon.fecha_vencimiento && cupon.fecha_vencimiento < ahora) {
        throw { status: 400, message: 'Cupón vencido' };
      }

      // Verificar si el usuario ya canjeó este cupón
      const yaCanjeado = await tx.userCoupon.findFirst({
        where: { user_id: userId, coupon_id, canjeado: true },
      });

      if (yaCanjeado) {
        throw { status: 400, message: 'Este cupón ya fue canjeado' };
      }

      // Verificar puntos suficientes
      const tarjeta = await tx.loyaltyCard.findUnique({
        where: { user_id: userId },
      });

      if (!tarjeta || tarjeta.puntos_actuales < cupon.puntos_requeridos) {
        throw { status: 400, message: 'Puntos insuficientes para este cupón' };
      }

      // Descontar puntos
      await tx.loyaltyCard.update({
        where: { user_id: userId },
        data: {
          puntos_actuales: { decrement: cupon.puntos_requeridos },
        },
      });

      // Registrar transacción de canje
      await tx.transaction.create({
        data: {
          card_id: tarjeta.id,
          business_id: cupon.business_id,
          tipo: 'CANJE',
          puntos: -cupon.puntos_requeridos,
          descripcion: `Canje de cupón: ${cupon.titulo}`,
        },
      });

      // Crear o actualizar UserCoupon con timestamp único
      const userCoupon = await tx.userCoupon.upsert({
        where: {
          user_id_coupon_id: { user_id: userId, coupon_id },
        },
        update: {
          canjeado: true,
          canjeado_en: ahora,
          codigo_canje_unico: uuidv4(),
        },
        create: {
          user_id: userId,
          coupon_id,
          canjeado: true,
          canjeado_en: ahora,
          codigo_canje_unico: uuidv4(),
        },
      });

      // Reducir stock si aplica
      if (cupon.stock > 0) {
        await tx.coupon.update({
          where: { id: coupon_id },
          data: { stock: { decrement: 1 } },
        });
      }

      return userCoupon;
    });

    return res.json({
      mensaje: '¡Cupón canjeado exitosamente!',
      codigo_canje: resultado.codigo_canje_unico,
      canjeado_en: resultado.canjeado_en,
    });
  } catch (error) {
    if (error.status) {
      return res.status(error.status).json({ error: error.message });
    }
    console.error('Error al canjear cupón:', error);
    return res.status(500).json({ error: 'Error al canjear cupón' });
  }
}

// ─────────────────────────────────────────────
// ADMIN: CREAR CUPÓN
// ─────────────────────────────────────────────
async function crearCupon(req, res) {
  try {
    const businessId = req.admin.business_id;
    const {
      titulo,
      descripcion,
      imagen_url,
      puntos_requeridos,
      stock,
      fecha_inicio,
      fecha_vencimiento,
    } = req.body;

    if (!titulo || !puntos_requeridos) {
      return res.status(400).json({ error: 'Título y puntos requeridos son obligatorios' });
    }

    const cupon = await prisma.coupon.create({
      data: {
        business_id: businessId,
        titulo,
        descripcion,
        imagen_url,
        puntos_requeridos: parseInt(puntos_requeridos),
        stock: stock ? parseInt(stock) : -1,
        fecha_inicio: fecha_inicio ? new Date(fecha_inicio) : new Date(),
        fecha_vencimiento: fecha_vencimiento ? new Date(fecha_vencimiento) : null,
        es_nuevo: true,
      },
    });

    return res.status(201).json({ mensaje: 'Cupón creado', cupon });
  } catch (error) {
    console.error('Error al crear cupón:', error);
    return res.status(500).json({ error: 'Error al crear cupón' });
  }
}

// ─────────────────────────────────────────────
// ADMIN: ACTUALIZAR CUPÓN
// ─────────────────────────────────────────────
async function actualizarCupon(req, res) {
  try {
    const { id } = req.params;
    const businessId = req.admin.business_id;

    const cupon = await prisma.coupon.findFirst({
      where: { id, business_id: businessId },
    });

    if (!cupon) {
      return res.status(404).json({ error: 'Cupón no encontrado' });
    }

    const actualizado = await prisma.coupon.update({
      where: { id },
      data: { ...req.body },
    });

    return res.json({ mensaje: 'Cupón actualizado', cupon: actualizado });
  } catch (error) {
    console.error('Error al actualizar cupón:', error);
    return res.status(500).json({ error: 'Error al actualizar cupón' });
  }
}

module.exports = {
  listarCupones,
  detalleCupon,
  canjearCupon,
  crearCupon,
  actualizarCupon,
};
