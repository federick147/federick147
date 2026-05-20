const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// ─────────────────────────────────────────────
// DASHBOARD DEL NEGOCIO
// ─────────────────────────────────────────────
async function dashboard(req, res) {
  try {
    const businessId = req.admin.business_id;
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);

    const [totalClientes, visitasHoy, canjesHoy, transaccionesHoy] =
      await Promise.all([
        // Total de clientes únicos que han visitado
        prisma.transaction.groupBy({
          by: ['card_id'],
          where: { business_id: businessId, tipo: 'GANANCIA' },
        }).then((r) => r.length),

        // Visitas de hoy
        prisma.transaction.count({
          where: {
            business_id: businessId,
            tipo: 'GANANCIA',
            creado_en: { gte: hoy },
          },
        }),

        // Cupones canjeados hoy
        prisma.transaction.count({
          where: {
            business_id: businessId,
            tipo: 'CANJE',
            creado_en: { gte: hoy },
          },
        }),

        // Transacciones de hoy con info del cliente
        prisma.transaction.findMany({
          where: {
            business_id: businessId,
            creado_en: { gte: hoy },
          },
          include: {
            tarjeta: {
              include: {
                usuario: { select: { nombre: true, apellido: true } },
              },
            },
          },
          orderBy: { creado_en: 'desc' },
          take: 20,
        }),
      ]);

    return res.json({
      resumen: {
        total_clientes: totalClientes,
        visitas_hoy: visitasHoy,
        canjes_hoy: canjesHoy,
      },
      transacciones_hoy: transaccionesHoy.map((t) => ({
        id: t.id,
        tipo: t.tipo,
        puntos: t.puntos,
        monto_compra: t.monto_compra,
        cliente: `${t.tarjeta.usuario.nombre} ${t.tarjeta.usuario.apellido}`,
        hora: t.creado_en,
      })),
    });
  } catch (error) {
    console.error('Error en dashboard:', error);
    return res.status(500).json({ error: 'Error al cargar dashboard' });
  }
}

// ─────────────────────────────────────────────
// LISTAR CUPONES DEL NEGOCIO (admin)
// ─────────────────────────────────────────────
async function listarCuponesAdmin(req, res) {
  try {
    const businessId = req.admin.business_id;

    const cupones = await prisma.coupon.findMany({
      where: { business_id: businessId },
      include: {
        _count: { select: { user_coupons: true } },
      },
      orderBy: { creado_en: 'desc' },
    });

    return res.json({ cupones });
  } catch (error) {
    console.error('Error al listar cupones admin:', error);
    return res.status(500).json({ error: 'Error al obtener cupones' });
  }
}

// ─────────────────────────────────────────────
// HISTORIAL DE TRANSACCIONES DEL DÍA
// ─────────────────────────────────────────────
async function historialDelDia(req, res) {
  try {
    const businessId = req.admin.business_id;
    const { fecha } = req.query;

    const dia = fecha ? new Date(fecha) : new Date();
    dia.setHours(0, 0, 0, 0);
    const diaSiguiente = new Date(dia);
    diaSiguiente.setDate(dia.getDate() + 1);

    const transacciones = await prisma.transaction.findMany({
      where: {
        business_id: businessId,
        creado_en: { gte: dia, lt: diaSiguiente },
      },
      include: {
        tarjeta: {
          include: {
            usuario: {
              select: { nombre: true, apellido: true, telefono: true },
            },
          },
        },
      },
      orderBy: { creado_en: 'desc' },
    });

    return res.json({ transacciones });
  } catch (error) {
    console.error('Error al obtener historial del día:', error);
    return res.status(500).json({ error: 'Error interno' });
  }
}

module.exports = { dashboard, listarCuponesAdmin, historialDelDia };
