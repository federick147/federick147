const rateLimit = require('express-rate-limit');

// Límite global: 100 peticiones por 15 minutos por IP
const globalRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { error: 'Demasiadas peticiones. Intenta más tarde.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Límite estricto para login: 5 intentos por 15 minutos
const loginRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: { error: 'Demasiados intentos de login. Espera 15 minutos.' },
  skipSuccessfulRequests: true,
  standardHeaders: true,
  legacyHeaders: false,
});

// Límite para registro: 3 por hora por IP
const registroRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 3,
  message: { error: 'Demasiados registros desde esta IP. Espera 1 hora.' },
  standardHeaders: true,
  legacyHeaders: false,
});

module.exports = { globalRateLimiter, loginRateLimiter, registroRateLimiter };
