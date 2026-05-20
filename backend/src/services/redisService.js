const { createClient } = require('redis');

let client;

async function connectRedis() {
  client = createClient({ url: process.env.REDIS_URL || 'redis://localhost:6379' });

  client.on('error', (err) => console.error('Redis error:', err));

  await client.connect();
  console.log('✅ Redis conectado');
  return client;
}

function getRedis() {
  if (!client) throw new Error('Redis no inicializado');
  return client;
}

// Guarda un token QR con TTL de 30 segundos
async function guardarQRToken(tokenHash, payload) {
  const redis = getRedis();
  const ttl = parseInt(process.env.QR_TOKEN_TTL_SECONDS || '30');
  await redis.setEx(`qr:${tokenHash}`, ttl, JSON.stringify(payload));
}

// Verifica y consume el token QR (one-time use)
async function consumirQRToken(tokenHash) {
  const redis = getRedis();
  const key = `qr:${tokenHash}`;
  const data = await redis.get(key);
  if (!data) return null;
  await redis.del(key); // Elimina el token tras usarlo
  return JSON.parse(data);
}

// Rate limiting de login por email
async function incrementarIntentosLogin(email) {
  const redis = getRedis();
  const key = `login_intentos:${email}`;
  const intentos = await redis.incr(key);
  if (intentos === 1) {
    await redis.expire(key, 900); // Bloqueo de 15 minutos
  }
  return intentos;
}

async function resetearIntentosLogin(email) {
  const redis = getRedis();
  await redis.del(`login_intentos:${email}`);
}

async function obtenerIntentosLogin(email) {
  const redis = getRedis();
  const val = await redis.get(`login_intentos:${email}`);
  return val ? parseInt(val) : 0;
}

module.exports = {
  connectRedis,
  getRedis,
  guardarQRToken,
  consumirQRToken,
  incrementarIntentosLogin,
  resetearIntentosLogin,
  obtenerIntentosLogin,
};
