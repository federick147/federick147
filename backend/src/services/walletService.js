const { GoogleAuth } = require('google-auth-library');
const jwt = require('jsonwebtoken');

const ISSUER_ID = process.env.GOOGLE_WALLET_ISSUER_ID;
const CLASS_ID = `${ISSUER_ID}.veris_loyalty`;

// Autenticación con la cuenta de servicio
function getAuth() {
  return new GoogleAuth({
    credentials: {
      client_email: process.env.GOOGLE_CLIENT_EMAIL,
      private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    },
    scopes: ['https://www.googleapis.com/auth/wallet_object.issuer'],
  });
}

// ─── Crear la clase de tarjeta (plantilla visual) ────────
async function crearClaseLoyalty() {
  const auth = getAuth();
  const client = await auth.getClient();

  const clase = {
    id: CLASS_ID,
    issuerName: 'Veris Loyalty',
    programName: 'Veris Loyalty',
    programLogo: {
      sourceUri: { uri: 'https://veris.com.ec/logo.png' },
      contentDescription: { defaultValue: { language: 'es', value: 'Veris Logo' } },
    },
    hexBackgroundColor: '#0A0A0A',
    heroImage: {
      sourceUri: { uri: 'https://veris.com.ec/hero.png' },
      contentDescription: { defaultValue: { language: 'es', value: 'Veris' } },
    },
    rewardsTier: 'Bronce',
    rewardsTierLabel: 'Nivel',
    loyaltyPointsLabel: 'Puntos',
    secondaryLoyaltyPoints: {
      label: 'Visitas',
      balance: { string: '0' },
    },
    reviewStatus: 'UNDER_REVIEW',
    multipleDevicesAndHoldersAllowedStatus: 'ONE_USER_ALL_DEVICES',
  };

  try {
    const res = await client.request({
      url: `https://walletobjects.googleapis.com/walletobjects/v1/loyaltyClass`,
      method: 'POST',
      data: clase,
    });
    console.log('✅ Clase de tarjeta creada:', res.data.id);
    return res.data;
  } catch (err) {
    if (err.response?.status === 409) {
      console.log('ℹ️  La clase ya existe');
      return { id: CLASS_ID };
    }
    throw err;
  }
}

// ─── Crear objeto de tarjeta para un usuario ─────────────
async function crearObjetoLoyalty(usuario, tarjeta) {
  const auth = getAuth();
  const client = await auth.getClient();
  const objectId = `${ISSUER_ID}.${tarjeta.id}`;

  const nivelLabel = { BRONZE: 'Bronce', SILVER: 'Plata', GOLD: 'Oro' };

  const objeto = {
    id: objectId,
    classId: CLASS_ID,
    state: 'ACTIVE',
    accountId: tarjeta.codigo_unico,
    accountName: `${usuario.nombre} ${usuario.apellido}`,
    loyaltyPoints: {
      balance: { int: tarjeta.puntos_actuales },
      label: 'Puntos disponibles',
    },
    secondaryLoyaltyPoints: {
      balance: { string: nivelLabel[tarjeta.nivel] || 'Bronce' },
      label: 'Nivel',
    },
    barcode: {
      type: 'QR_CODE',
      value: tarjeta.codigo_unico,
      alternateText: tarjeta.codigo_unico.substring(0, 8).toUpperCase(),
    },
    textModulesData: [
      {
        id: 'puntos',
        header: 'PUNTOS DISPONIBLES',
        body: tarjeta.puntos_actuales.toString(),
      },
      {
        id: 'nivel',
        header: 'NIVEL',
        body: nivelLabel[tarjeta.nivel] || 'Bronce',
      },
    ],
    hexBackgroundColor: '#0A0A0A',
  };

  try {
    const res = await client.request({
      url: `https://walletobjects.googleapis.com/walletobjects/v1/loyaltyObject`,
      method: 'POST',
      data: objeto,
    });
    return res.data;
  } catch (err) {
    if (err.response?.status === 409) {
      // Ya existe, actualizarlo
      await actualizarTarjeta(tarjeta);
      return { id: objectId };
    }
    throw err;
  }
}

// ─── Actualizar puntos y nivel en la tarjeta ─────────────
async function actualizarTarjeta(tarjeta) {
  const auth = getAuth();
  const client = await auth.getClient();
  const objectId = `${ISSUER_ID}.${tarjeta.id}`;
  const nivelLabel = { BRONZE: 'Bronce', SILVER: 'Plata', GOLD: 'Oro' };

  await client.request({
    url: `https://walletobjects.googleapis.com/walletobjects/v1/loyaltyObject/${objectId}`,
    method: 'PATCH',
    data: {
      loyaltyPoints: {
        balance: { int: tarjeta.puntos_actuales },
        label: 'Puntos disponibles',
      },
      secondaryLoyaltyPoints: {
        balance: { string: nivelLabel[tarjeta.nivel] || 'Bronce' },
        label: 'Nivel',
      },
      textModulesData: [
        { id: 'puntos', header: 'PUNTOS DISPONIBLES', body: tarjeta.puntos_actuales.toString() },
        { id: 'nivel', header: 'NIVEL', body: nivelLabel[tarjeta.nivel] || 'Bronce' },
      ],
    },
  });
}

// ─── Generar URL "Añadir a Google Wallet" ────────────────
async function generarURLWallet(usuario, tarjeta) {
  // Asegura que existe la clase
  await crearClaseLoyalty();
  // Crea el objeto para este usuario
  await crearObjetoLoyalty(usuario, tarjeta);

  const objectId = `${ISSUER_ID}.${tarjeta.id}`;

  const claims = {
    iss: process.env.GOOGLE_CLIENT_EMAIL,
    aud: 'google',
    origins: ['*'],
    typ: 'savetowallet',
    payload: {
      loyaltyObjects: [{ id: objectId }],
    },
  };

  const privateKey = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n');
  const token = jwt.sign(claims, privateKey, { algorithm: 'RS256' });

  return `https://pay.google.com/gp/v/save/${token}`;
}

module.exports = { generarURLWallet, actualizarTarjeta, crearClaseLoyalty };
