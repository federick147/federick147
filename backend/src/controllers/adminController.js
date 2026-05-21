const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// ─── DASHBOARD ────────────────────────────────
async function dashboard(req, res) {
  try {
    const businessId = req.admin.business_id;
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);

    const [totalClientes, escaneosDia, cuponesActivos, puntosHoyAgg, actividadReciente] =
      await Promise.all([
        prisma.transaction.groupBy({
          by: ['card_id'],
          where: { business_id: businessId, tipo: 'GANANCIA' },
        }).then((r) => r.length),

        prisma.transaction.count({
          where: { business_id: businessId, tipo: 'GANANCIA', creado_en: { gte: hoy } },
        }),

        prisma.coupon.count({
          where: { business_id: businessId, activo: true },
        }),

        prisma.transaction.aggregate({
          _sum: { puntos: true },
          where: { business_id: businessId, tipo: 'GANANCIA', creado_en: { gte: hoy } },
        }),

        prisma.transaction.findMany({
          where: { business_id: businessId, creado_en: { gte: hoy } },
          include: {
            tarjeta: {
              include: { usuario: { select: { nombre: true, apellido: true } } },
            },
          },
          orderBy: { creado_en: 'desc' },
          take: 20,
        }),
      ]);

    return res.json({
      totalClientes,
      escaneosDia,
      cuponesActivos,
      puntosOtorgadosDia: puntosHoyAgg._sum.puntos || 0,
      actividadReciente: actividadReciente.map((t) => ({
        id: t.id,
        tipo: t.tipo,
        puntos: t.puntos,
        clienteNombre: `${t.tarjeta.usuario.nombre} ${t.tarjeta.usuario.apellido}`,
        fecha: t.creado_en,
      })),
    });
  } catch (error) {
    console.error('Error en dashboard:', error);
    return res.status(500).json({ error: 'Error al cargar dashboard' });
  }
}

// ─── LISTAR CLIENTES ──────────────────────────
async function listarClientes(req, res) {
  try {
    const usuarios = await prisma.user.findMany({
      include: { tarjeta: true },
      orderBy: { creado_en: 'desc' },
      take: 200,
    });

    return res.json({
      clientes: usuarios.map((u) => ({
        id: u.id,
        nombre: u.nombre,
        apellido: u.apellido,
        email: u.email,
        telefono: u.telefono,
        activo: true,
        creado_en: u.creado_en,
        tarjetas: u.tarjeta ? [u.tarjeta] : [],
      })),
    });
  } catch (error) {
    console.error('Error al listar clientes:', error);
    return res.status(500).json({ error: 'Error al obtener clientes' });
  }
}

// ─── LISTAR CUPONES (admin) ───────────────────
async function listarCuponesAdmin(req, res) {
  try {
    const businessId = req.admin.business_id;
    const cupones = await prisma.coupon.findMany({
      where: { business_id: businessId },
      include: { _count: { select: { user_coupons: true } } },
      orderBy: { creado_en: 'desc' },
    });

    return res.json({
      cupones: cupones.map((c) => ({
        id: c.id,
        titulo: c.titulo,
        descripcion: c.descripcion,
        puntos_requeridos: c.puntos_requeridos,
        stock: c.stock,
        fecha_expiracion: c.fecha_vencimiento,
        activo: c.activo,
        canjes: c._count.user_coupons,
        creado_en: c.creado_en,
      })),
    });
  } catch (error) {
    console.error('Error al listar cupones admin:', error);
    return res.status(500).json({ error: 'Error al obtener cupones' });
  }
}

// ─── CREAR CUPÓN ──────────────────────────────
async function crearCupon(req, res) {
  try {
    const businessId = req.admin.business_id;
    const { titulo, descripcion, puntos_requeridos, fecha_expiracion, stock } = req.body;

    if (!titulo || puntos_requeridos === undefined) {
      return res.status(400).json({ error: 'titulo y puntos_requeridos son obligatorios' });
    }

    const cupon = await prisma.coupon.create({
      data: {
        business_id: businessId,
        titulo,
        descripcion: descripcion || '',
        puntos_requeridos: parseInt(puntos_requeridos) || 0,
        stock: stock ? parseInt(stock) : -1,
        fecha_vencimiento: fecha_expiracion ? new Date(fecha_expiracion) : null,
        activo: true,
      },
    });

    return res.status(201).json({ cupon });
  } catch (error) {
    console.error('Error al crear cupón:', error);
    return res.status(500).json({ error: 'Error al crear cupón' });
  }
}

// ─── HISTORIAL DEL DÍA ────────────────────────
async function historialDelDia(req, res) {
  try {
    const businessId = req.admin.business_id;
    const { fecha } = req.query;

    const dia = fecha ? new Date(fecha) : new Date();
    dia.setHours(0, 0, 0, 0);
    const diaSiguiente = new Date(dia);
    diaSiguiente.setDate(dia.getDate() + 1);

    const transacciones = await prisma.transaction.findMany({
      where: { business_id: businessId, creado_en: { gte: dia, lt: diaSiguiente } },
      include: {
        tarjeta: {
          include: {
            usuario: { select: { nombre: true, apellido: true, telefono: true } },
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

module.exports = { dashboard, listarClientes, listarCuponesAdmin, crearCupon, historialDelDia };
