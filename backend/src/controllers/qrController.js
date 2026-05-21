const crypto = require('crypto');
const { PrismaClient } = require('@prisma/client');
const {
  generarQRToken,
  verificarQRToken,
} = require('../services/jwtService');
const {
  guardarQRToken,
  consumirQRToken,
} = require('../services/redisService');

const prisma = new PrismaClient();

const PUNTOS_POR_VISITA = parseInt(process.env.PUNTOS_POR_VISITA || '10');
const PUNTOS_PLATA = parseInt(process.env.PUNTOS_PLATA || '500');
const PUNTOS_ORO = parseInt(process.env.PUNTOS_ORO || '2000');
const VISITAS_PARA_GRATIS = 4;

// ─────────────────────────────────────────────
// GENERAR TOKEN QR (cliente solicita nuevo QR)
// ─────────────────────────────────────────────
async function generarQR(req, res) {
  try {
    const userId = req.usuario.sub;

    const tarjeta = await prisma.loyaltyCard.findUnique({
      where: { user_id: userId },
    });

    if (!tarjeta || !tarjeta.activa) {
      return res.status(404).json({ error: 'Tarjeta no encontrada o inactiva' });
    }

    const { token, hash } = generarQRToken(userId);

    // Guardar en Redis con TTL 30s
    await guardarQRToken(hash, {
      user_id: userId,
      card_id: tarjeta.id,
      generado_en: Date.now(),
    });

    return res.json({
      qr_token: token,
      expira_en: 30,
    });
  } catch (error) {
    console.error('Error al generar QR:', error);
    return res.status(500).json({ error: 'Error al generar código QR' });
  }
}

// ─────────────────────────────────────────────
// ESCANEAR QR (admin escanea el código del cliente)
// ─────────────────────────────────────────────
async function escanearQR(req, res) {
  try {
    const { qr_token, monto_compra, dispositivo_id, latitud, longitud } = req.body;
    const businessId = req.admin.business_id;

    if (!qr_token) {
      return res.status(400).json({ error: 'Token QR es obligatorio' });
    }

    // 1. Verificar firma JWT del QR
    let payload;
    try {
      payload = verificarQRToken(qr_token);
    } catch {
      return res.status(400).json({ error: 'Código QR inválido o expirado' });
    }

    // 2. Calcular hash del token para buscarlo en Redis
    const tokenHash = crypto.createHash('sha256').update(qr_token).digest('hex');

    // 3. Consumir el token en Redis (one-time use, evita capturas de pantalla)
    const redisData = await consumirQRToken(tokenHash);
    if (!redisData) {
      return res.status(400).json({ error: 'El código QR ya fue usado o expiró' });
    }

    // 4. Verificar que el user_id del JWT coincide con el de Redis
    if (payload.user_id !== redisData.user_id) {
      return res.status(400).json({ error: 'QR inválido: inconsistencia de datos' });
    }

    const userId = redisData.user_id;
    const cardId = redisData.card_id;

    // 5. Calcular puntos (fijos por visita) y lógica de visita gratis
    const monto = monto_compra ? parseFloat(monto_compra) : 0;
    const puntosGanados = PUNTOS_POR_VISITA;

    // 6. Actualizar tarjeta con transacción atómica
    const [transaccion, tarjetaActualizada, esVisitaGratis] = await prisma.$transaction(async (tx) => {
      const tarjeta = await tx.loyaltyCard.findUnique({ where: { id: cardId } });
      if (!tarjeta) throw new Error('Tarjeta no encontrada');

      // Punch card: al llegar a VISITAS_PARA_GRATIS, la siguiente es gratis y reinicia
      const visitasActuales = tarjeta.visitas_ciclo || 0;
      const estaVisitaEsGratis = visitasActuales >= VISITAS_PARA_GRATIS;
      const nuevasVisitasCiclo = estaVisitaEsGratis ? 0 : visitasActuales + 1;
      const nuevasVisitasTotales = (tarjeta.visitas_totales || 0) + 1;

      // Solo suma puntos en visitas pagadas
      const puntosASumar = estaVisitaEsGratis ? 0 : puntosGanados;
      const nuevosPuntosActuales = tarjeta.puntos_actuales + puntosASumar;
      const nuevosPuntosTotales = tarjeta.puntos_totales + puntosASumar;

      let nuevoNivel = 'BRONZE';
      if (nuevosPuntosTotales >= PUNTOS_ORO) nuevoNivel = 'GOLD';
      else if (nuevosPuntosTotales >= PUNTOS_PLATA) nuevoNivel = 'SILVER';

      const tarjetaActual = await tx.loyaltyCard.update({
        where: { id: cardId },
        data: {
          puntos_actuales: nuevosPuntosActuales,
          puntos_totales: nuevosPuntosTotales,
          nivel: nuevoNivel,
          visitas_ciclo: nuevasVisitasCiclo,
          visitas_totales: nuevasVisitasTotales,
        },
      });

      const trans = await tx.transaction.create({
        data: {
          card_id: cardId,
          business_id: businessId,
          tipo: 'GANANCIA',
          puntos: puntosASumar,
          monto_compra: monto > 0 ? monto : null,
          descripcion: estaVisitaEsGratis ? 'Consulta gratis (beneficio fidelización)' : 'Consulta registrada',
          dispositivo_id: dispositivo_id || null,
          latitud: latitud ? parseFloat(latitud) : null,
          longitud: longitud ? parseFloat(longitud) : null,
        },
      });

      return [trans, tarjetaActual, estaVisitaEsGratis];
    });

    // 7. Obtener info del usuario para mostrar al admin
    const usuario = await prisma.user.findUnique({
      where: { id: userId },
      select: { nombre: true, apellido: true, foto_url: true },
    });

    const visitasNuevas = tarjetaActualizada.visitas_ciclo;
    const proximaGratis = visitasNuevas >= VISITAS_PARA_GRATIS;

    return res.json({
      mensaje: esVisitaGratis
        ? '¡Consulta GRATIS aplicada!'
        : `¡Consulta ${visitasNuevas} de ${VISITAS_PARA_GRATIS} registrada!`,
      es_visita_gratis: esVisitaGratis,
      proxima_gratis: proximaGratis,
      cliente: {
        nombre: `${usuario.nombre} ${usuario.apellido}`,
        foto_url: usuario.foto_url,
      },
      tarjeta: {
        puntos_actuales: tarjetaActualizada.puntos_actuales,
        puntos_totales: tarjetaActualizada.puntos_totales,
        nivel: tarjetaActualizada.nivel,
        visitas_ciclo: tarjetaActualizada.visitas_ciclo,
        visitas_totales: tarjetaActualizada.visitas_totales,
      },
      puntos_ganados: esVisitaGratis ? 0 : puntosGanados,
      transaccion_id: transaccion.id,
    });
  } catch (error) {
    console.error('Error al escanear QR:', error);
    return res.status(500).json({ error: 'Error al procesar escaneo' });
  }
}

// ─────────────────────────────────────────────
// OBTENER INFO DEL CLIENTE (previa al escaneo)
// ─────────────────────────────────────────────
async function infoClienteQR(req, res) {
  try {
    const { qr_token } = req.body;

    if (!qr_token) {
      return res.status(400).json({ error: 'Token QR requerido' });
    }

    let payload;
    try {
      payload = verificarQRToken(qr_token);
    } catch {
      return res.status(400).json({ error: 'Código QR inválido o expirado' });
    }

    const usuario = await prisma.user.findUnique({
      where: { id: payload.user_id },
      include: {
        tarjeta: true,
      },
    });

    if (!usuario) {
      return res.status(404).json({ error: 'Cliente no encontrado' });
    }

    return res.json({
      cliente: {
        nombre: `${usuario.nombre} ${usuario.apellido}`,
        foto_url: usuario.foto_url,
      },
      tarjeta: {
        puntos_actuales: usuario.tarjeta?.puntos_actuales || 0,
        nivel: usuario.tarjeta?.nivel || 'BRONZE',
      },
    });
  } catch (error) {
    console.error('Error al obtener info del cliente:', error);
    return res.status(500).json({ error: 'Error interno' });
  }
}

// ─────────────────────────────────────────────
// BUSCAR CLIENTE POR CÓDIGO ÚNICO (admin lookup manual)
// ─────────────────────────────────────────────
async function buscarClientePorCodigo(req, res) {
  try {
    const { codigo } = req.params;

    const tarjeta = await prisma.loyaltyCard.findUnique({
      where: { codigo_unico: codigo },
      include: { usuario: { select: { nombre: true, apellido: true, email: true } } },
    });

    if (!tarjeta) {
      return res.status(404).json({ error: 'Cliente no encontrado' });
    }

    return res.json({
      nombre: tarjeta.usuario.nombre,
      apellido: tarjeta.usuario.apellido,
      tarjeta: {
        id: tarjeta.id,
        codigo_unico: tarjeta.codigo_unico,
        puntos_actuales: tarjeta.puntos_actuales,
        puntos_totales: tarjeta.puntos_totales,
        nivel: tarjeta.nivel,
        visitas_ciclo: tarjeta.visitas_ciclo || 0,
        visitas_totales: tarjeta.visitas_totales || 0,
      },
    });
  } catch (error) {
    console.error('Error buscando cliente:', error);
    return res.status(500).json({ error: 'Error interno' });
  }
}

// ─────────────────────────────────────────────
// SUMAR PUNTOS MANUAL (sin QR, admin lookup directo)
// ─────────────────────────────────────────────
async function sumarPuntosManual(req, res) {
  try {
    const { tarjetaId, puntos } = req.body;
    const businessId = req.admin.business_id;

    if (!tarjetaId || !puntos || puntos <= 0) {
      return res.status(400).json({ error: 'tarjetaId y puntos son obligatorios' });
    }

    const puntosNum = parseInt(puntos);

    const [transaccion, tarjetaActualizada] = await prisma.$transaction(async (tx) => {
      const tarjeta = await tx.loyaltyCard.findUnique({ where: { id: tarjetaId } });
      if (!tarjeta) throw new Error('Tarjeta no encontrada');

      const nuevosPuntosActuales = tarjeta.puntos_actuales + puntosNum;
      const nuevosPuntosTotales = tarjeta.puntos_totales + puntosNum;

      let nuevoNivel = 'BRONZE';
      if (nuevosPuntosTotales >= PUNTOS_ORO) nuevoNivel = 'GOLD';
      else if (nuevosPuntosTotales >= PUNTOS_PLATA) nuevoNivel = 'SILVER';

      const tarjetaActual = await tx.loyaltyCard.update({
        where: { id: tarjetaId },
        data: {
          puntos_actuales: nuevosPuntosActuales,
          puntos_totales: nuevosPuntosTotales,
          nivel: nuevoNivel,
        },
      });

      const trans = await tx.transaction.create({
        data: {
          card_id: tarjetaId,
          business_id: businessId,
          tipo: 'GANANCIA',
          puntos: puntosNum,
          descripcion: 'Puntos agregados manualmente',
        },
      });

      return [trans, tarjetaActual];
    });

    return res.json({
      ok: true,
      puntos_actuales: tarjetaActualizada.puntos_actuales,
      nivel: tarjetaActualizada.nivel,
      transaccion_id: transaccion.id,
    });
  } catch (error) {
    console.error('Error al sumar puntos manual:', error);
    return res.status(500).json({ error: 'Error al sumar puntos' });
  }
}

module.exports = { generarQR, escanearQR, infoClienteQR, buscarClientePorCodigo, sumarPuntosManual };
