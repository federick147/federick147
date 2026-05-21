const { GoogleAuth } = require('google-auth-library');
const jwt = require('jsonwebtoken');

const ISSUER_ID = process.env.GOOGLE_WALLET_ISSUER_ID;
const CLASS_ID = `${ISSUER_ID}.veris_loyalty`;

// Lee las credenciales desde el JSON completo o variables individuales
function getCredentials() {
  if (process.env.GOOGLE_SERVICE_ACCOUNT_JSON) {
    return JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_JSON);
  }
  return {
    client_email: process.env.GOOGLE_CLIENT_EMAIL,
    private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  };
}

function getAuth() {
  return new GoogleAuth({
    credentials: getCredentials(),
    scopes: ['https://www.googleapis.com/auth/wallet_object.issuer'],
  });
}

// ─── Crear la clase de tarjeta (plantilla visual) ────────
async function crearClaseLoyalty() {
  const auth = getAuth();
  const client = await auth.getClient();

  const clase = {
    id: CLASS_ID,
    issuerName: 'Veris',
    programName: 'Veris Loyalty',
    programLogo: {
      sourceUri: { uri: 'https://federick147.github.io/federick147/logo.svg' },
      contentDescription: { defaultValue: { language: 'es', value: 'Veris Logo' } },
    },
    hexBackgroundColor: '#0071CE',
    heroImage: {
      sourceUri: { uri: 'https://federick147.github.io/federick147/hero.svg' },
      contentDescription: { defaultValue: { language: 'es', value: 'Veris Centrales Médicas' } },
    },
    wordMark: {
      sourceUri: { uri: 'https://veris.com.ec' },
    },
    rewardsTier: 'Bronce',
    rewardsTierLabel: 'Nivel',
    loyaltyPointsLabel: 'Puntos',
    accountNameLabel: 'Titular',
    accountIdLabel: 'Código',
    reviewStatus: 'UNDER_REVIEW',
    multipleDevicesAndHoldersAllowedStatus: 'ONE_USER_ALL_DEVICES',
    countryCode: 'EC',
    linksModuleData: {
      uris: [
        {
          uri: 'https://veris.com.ec',
          description: 'Sitio web Veris',
          id: 'website',
        },
      ],
    },
    textModulesData: [
      {
        id: 'como_ganar',
        header: 'CÓMO GANAR PUNTOS',
        body: 'Presenta tu tarjeta en cada visita a Veris Centrales Médicas y acumula puntos automáticamente en todas las sedes.',
      },
      {
        id: 'niveles',
        header: 'NIVELES DE BENEFICIOS',
        body: 'Bronce: 0–499 pts · Plata: 500–1999 pts · Oro: 2000+ pts',
      },
    ],
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

function buildStamps(visitas) {
  const TOTAL = 4;
  const llenas = Math.min(visitas, TOTAL);
  const gratis = visitas >= TOTAL;
  let stamps = '';
  for (let i = 0; i < TOTAL; i++) stamps += i < llenas ? '● ' : '○ ';
  stamps += gratis ? '★ ¡GRATIS!' : '★';
  return stamps.trim();
}

// ─── Crear objeto de tarjeta para un usuario ─────────────
async function crearObjetoLoyalty(usuario, tarjeta) {
  const auth = getAuth();
  const client = await auth.getClient();
  const objectId = `${ISSUER_ID}.${tarjeta.id}`;

  const nivelLabel = { BRONZE: 'Bronce', SILVER: 'Plata', GOLD: 'Oro' };
  const visitas = tarjeta.visitas_ciclo || 0;
  const proximaGratis = visitas >= 4;

  const objeto = {
    id: objectId,
    classId: CLASS_ID,
    state: 'ACTIVE',
    accountId: tarjeta.codigo_unico,
    accountName: `${usuario.nombre} ${usuario.apellido}`,
    loyaltyPoints: {
      balance: { string: `${visitas} / 4` },
      label: 'Consultas',
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
        id: 'sellos',
        header: 'PROGRESO',
        body: buildStamps(visitas),
      },
      {
        id: 'estado',
        header: proximaGratis ? '¡BENEFICIO DISPONIBLE!' : 'SIGUIENTE BENEFICIO',
        body: proximaGratis
          ? '¡Tu próxima consulta es GRATIS!'
          : `Te faltan ${4 - visitas} consulta${4 - visitas !== 1 ? 's' : ''} para tu consulta gratis`,
      },
    ],
    hexBackgroundColor: '#0071CE',
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
  const visitas = tarjeta.visitas_ciclo || 0;
  const proximaGratis = visitas >= 4;

  await client.request({
    url: `https://walletobjects.googleapis.com/walletobjects/v1/loyaltyObject/${objectId}`,
    method: 'PATCH',
    data: {
      loyaltyPoints: {
        balance: { string: `${visitas} / 4` },
        label: 'Consultas',
      },
      secondaryLoyaltyPoints: {
        balance: { string: nivelLabel[tarjeta.nivel] || 'Bronce' },
        label: 'Nivel',
      },
      textModulesData: [
        { id: 'sellos', header: 'PROGRESO', body: buildStamps(visitas) },
        {
          id: 'estado',
          header: proximaGratis ? '¡BENEFICIO DISPONIBLE!' : 'SIGUIENTE BENEFICIO',
          body: proximaGratis
            ? '¡Tu próxima consulta es GRATIS!'
            : `Te faltan ${4 - visitas} consulta${4 - visitas !== 1 ? 's' : ''} para tu consulta gratis`,
        },
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

  const creds = getCredentials();

  const claims = {
    iss: creds.client_email,
    aud: 'google',
    origins: ['*'],
    typ: 'savetowallet',
    payload: {
      loyaltyObjects: [{ id: objectId }],
    },
  };

  const privateKey = creds.private_key.replace(/\\n/g, '\n');
  const token = jwt.sign(claims, privateKey, { algorithm: 'RS256' });

  return `https://pay.google.com/gp/v/save/${token}`;
}

module.exports = { generarURLWallet, actualizarTarjeta, crearClaseLoyalty };
