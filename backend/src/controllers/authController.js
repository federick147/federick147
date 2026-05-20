const bcrypt = require('bcrypt');
const { PrismaClient } = require('@prisma/client');
const { v4: uuidv4 } = require('uuid');
const {
  generarAccessToken,
  generarRefreshToken,
  verificarRefreshToken,
  guardarRefreshTokenUsuario,
  guardarRefreshTokenAdmin,
  revocarRefreshToken,
} = require('../services/jwtService');
const {
  incrementarIntentosLogin,
  resetearIntentosLogin,
  obtenerIntentosLogin,
} = require('../services/redisService');

const prisma = new PrismaClient();
const SALT_ROUNDS = 10;
const MAX_INTENTOS = 5;

// ─────────────────────────────────────────────
// REGISTRO DE USUARIO
// ─────────────────────────────────────────────
async function registrarUsuario(req, res) {
  try {
    const { nombre, apellido, email, telefono, contrasena } = req.body;

    if (!nombre || !apellido || !email || !telefono || !contrasena) {
      return res.status(400).json({ error: 'Todos los campos son obligatorios' });
    }

    if (contrasena.length < 8) {
      return res.status(400).json({ error: 'La contraseña debe tener al menos 8 caracteres' });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: 'Email inválido' });
    }

    const existente = await prisma.user.findFirst({
      where: { OR: [{ email }, { telefono }] },
    });

    if (existente) {
      return res.status(409).json({ error: 'El email o teléfono ya está registrado' });
    }

    const contrasena_hash = await bcrypt.hash(contrasena, SALT_ROUNDS);

    const usuario = await prisma.user.create({
      data: {
        nombre,
        apellido,
        email: email.toLowerCase(),
        telefono,
        contrasena_hash,
        tarjeta: {
          create: {
            codigo_unico: uuidv4(),
            puntos_totales: 0,
            puntos_actuales: 0,
            nivel: 'BRONZE',
          },
        },
      },
      include: { tarjeta: true },
    });

    const accessToken = generarAccessToken({
      sub: usuario.id,
      email: usuario.email,
      tipo: 'usuario',
    });
    const refreshToken = generarRefreshToken({
      sub: usuario.id,
      tipo: 'usuario',
    });

    await guardarRefreshTokenUsuario(usuario.id, refreshToken);

    res.cookie('refresh_token', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 30 * 24 * 60 * 60 * 1000,
    });

    return res.status(201).json({
      mensaje: '¡Bienvenido a Veris!',
      usuario: {
        id: usuario.id,
        nombre: usuario.nombre,
        apellido: usuario.apellido,
        email: usuario.email,
        telefono: usuario.telefono,
      },
      tarjeta: {
        id: usuario.tarjeta.id,
        puntos_actuales: usuario.tarjeta.puntos_actuales,
        nivel: usuario.tarjeta.nivel,
        codigo_unico: usuario.tarjeta.codigo_unico,
      },
      access_token: accessToken,
    });
  } catch (error) {
    console.error('Error en registro:', error);
    return res.status(500).json({ error: 'Error al registrar usuario' });
  }
}

// ─────────────────────────────────────────────
// LOGIN DE USUARIO
// ─────────────────────────────────────────────
async function loginUsuario(req, res) {
  try {
    const { email, contrasena } = req.body;

    if (!email || !contrasena) {
      return res.status(400).json({ error: 'Email y contraseña son obligatorios' });
    }

    const intentos = await obtenerIntentosLogin(email);
    if (intentos >= MAX_INTENTOS) {
      return res.status(429).json({
        error: 'Cuenta bloqueada temporalmente. Espera 15 minutos.',
      });
    }

    const usuario = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
      include: { tarjeta: true },
    });

    if (!usuario) {
      await incrementarIntentosLogin(email);
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    const contrasenaValida = await bcrypt.compare(contrasena, usuario.contrasena_hash);
    if (!contrasenaValida) {
      await incrementarIntentosLogin(email);
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    await resetearIntentosLogin(email);

    const accessToken = generarAccessToken({
      sub: usuario.id,
      email: usuario.email,
      tipo: 'usuario',
    });
    const refreshToken = generarRefreshToken({
      sub: usuario.id,
      tipo: 'usuario',
    });

    await guardarRefreshTokenUsuario(usuario.id, refreshToken);

    res.cookie('refresh_token', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 30 * 24 * 60 * 60 * 1000,
    });

    return res.json({
      mensaje: 'Login exitoso',
      usuario: {
        id: usuario.id,
        nombre: usuario.nombre,
        apellido: usuario.apellido,
        email: usuario.email,
        foto_url: usuario.foto_url,
      },
      tarjeta: usuario.tarjeta
        ? {
            id: usuario.tarjeta.id,
            puntos_actuales: usuario.tarjeta.puntos_actuales,
            puntos_totales: usuario.tarjeta.puntos_totales,
            nivel: usuario.tarjeta.nivel,
            codigo_unico: usuario.tarjeta.codigo_unico,
          }
        : null,
      access_token: accessToken,
    });
  } catch (error) {
    console.error('Error en login:', error);
    return res.status(500).json({ error: 'Error al iniciar sesión' });
  }
}

// ─────────────────────────────────────────────
// LOGIN DE ADMINISTRADOR
// ─────────────────────────────────────────────
async function loginAdmin(req, res) {
  try {
    const { email, contrasena } = req.body;

    if (!email || !contrasena) {
      return res.status(400).json({ error: 'Email y contraseña son obligatorios' });
    }

    const intentos = await obtenerIntentosLogin(`admin:${email}`);
    if (intentos >= MAX_INTENTOS) {
      return res.status(429).json({ error: 'Cuenta bloqueada. Espera 15 minutos.' });
    }

    const admin = await prisma.businessAdmin.findUnique({
      where: { email: email.toLowerCase() },
      include: { negocio: true },
    });

    if (!admin) {
      await incrementarIntentosLogin(`admin:${email}`);
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    const valido = await bcrypt.compare(contrasena, admin.contrasena_hash);
    if (!valido) {
      await incrementarIntentosLogin(`admin:${email}`);
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    await resetearIntentosLogin(`admin:${email}`);

    const accessToken = generarAccessToken({
      sub: admin.id,
      email: admin.email,
      business_id: admin.business_id,
      tipo: 'admin',
    });
    const refreshToken = generarRefreshToken({
      sub: admin.id,
      tipo: 'admin',
    });

    await guardarRefreshTokenAdmin(admin.id, refreshToken);

    res.cookie('refresh_token_admin', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 30 * 24 * 60 * 60 * 1000,
    });

    return res.json({
      mensaje: 'Login admin exitoso',
      admin: {
        id: admin.id,
        nombre: admin.nombre,
        email: admin.email,
        negocio: {
          id: admin.negocio.id,
          nombre: admin.negocio.nombre,
          logo_url: admin.negocio.logo_url,
          categoria: admin.negocio.categoria,
        },
      },
      access_token: accessToken,
    });
  } catch (error) {
    console.error('Error en login admin:', error);
    return res.status(500).json({ error: 'Error al iniciar sesión' });
  }
}

// ─────────────────────────────────────────────
// REFRESH TOKEN
// ─────────────────────────────────────────────
async function refrescarToken(req, res) {
  try {
    const token = req.cookies?.refresh_token;
    if (!token) {
      return res.status(401).json({ error: 'Refresh token no encontrado' });
    }

    const payload = verificarRefreshToken(token);

    const nuevoAccessToken = generarAccessToken({
      sub: payload.sub,
      email: payload.email,
      tipo: payload.tipo,
    });

    return res.json({ access_token: nuevoAccessToken });
  } catch (error) {
    return res.status(401).json({ error: 'Refresh token inválido o expirado' });
  }
}

// ─────────────────────────────────────────────
// LOGOUT
// ─────────────────────────────────────────────
async function logout(req, res) {
  try {
    const token = req.cookies?.refresh_token;
    if (token) {
      await revocarRefreshToken(token);
    }

    res.clearCookie('refresh_token');
    return res.json({ mensaje: 'Sesión cerrada correctamente' });
  } catch (error) {
    console.error('Error en logout:', error);
    return res.status(500).json({ error: 'Error al cerrar sesión' });
  }
}

// ─────────────────────────────────────────────
// PERFIL DEL USUARIO AUTENTICADO
// ─────────────────────────────────────────────
async function obtenerPerfil(req, res) {
  try {
    const usuario = await prisma.user.findUnique({
      where: { id: req.usuario.sub },
      include: {
        tarjeta: {
          include: {
            transacciones: {
              orderBy: { creado_en: 'desc' },
              take: 10,
              include: { negocio: { select: { nombre: true, logo_url: true } } },
            },
          },
        },
      },
    });

    if (!usuario) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    return res.json({
      id: usuario.id,
      nombre: usuario.nombre,
      apellido: usuario.apellido,
      email: usuario.email,
      telefono: usuario.telefono,
      foto_url: usuario.foto_url,
      creado_en: usuario.creado_en,
      tarjeta: usuario.tarjeta,
    });
  } catch (error) {
    console.error('Error al obtener perfil:', error);
    return res.status(500).json({ error: 'Error al obtener perfil' });
  }
}

module.exports = {
  registrarUsuario,
  loginUsuario,
  loginAdmin,
  refrescarToken,
  logout,
  obtenerPerfil,
};
