require('dotenv').config();
const app = require('./src/app');
const { connectRedis } = require('./src/services/redisService');

const PORT = process.env.PORT || 3000;

async function iniciar() {
  try {
    await connectRedis();
    app.listen(PORT, () => {
      console.log(`✅ Servidor Veris corriendo en puerto ${PORT}`);
      console.log(`🌍 Entorno: ${process.env.NODE_ENV}`);
    });
  } catch (error) {
    console.error('❌ Error al iniciar el servidor:', error);
    process.exit(1);
  }
}

iniciar();
