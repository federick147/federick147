# Veris Loyalty — Tarjeta de Fidelización Digital

App móvil de tarjeta de fidelización digital para restaurantes, cafeterías y heladerías. Desarrollada para **veris.com.ec**.

Diseño: fondo oscuro `#0A0A0A`, acentos dorado `#F5C518`, tipografía Space Grotesk — inspirado en Digital Zeta.

---

## Estructura del proyecto

```
veris-loyalty/
├── backend/              # Node.js + Express + Prisma
│   ├── prisma/
│   │   └── schema.prisma # Esquema de la base de datos
│   ├── src/
│   │   ├── controllers/  # authController, qrController, couponController, adminController
│   │   ├── middleware/   # auth.js, rateLimit.js
│   │   ├── routes/       # auth, qr, coupons, transactions, admin
│   │   └── services/     # jwtService, redisService
│   ├── server.js
│   └── .env.example
└── mobile/               # React Native + Expo Router
    ├── app/
    │   ├── (auth)/       # Onboarding, Login, Registro
    │   ├── (tabs)/       # Home (tarjeta+QR), Cupones, Historial, Perfil
    │   └── (admin)/      # Login admin, Dashboard, Escáner QR, Cupones
    ├── components/cards/ # DigitalCard con flip animation + QR
    ├── constants/        # colors.js
    ├── hooks/            # useAuth (Zustand)
    └── services/         # api.js (axios + auto-refresh)
```

---

## Instalación

### Requisitos previos

- Node.js 18+
- PostgreSQL 15+
- Redis 7+
- Expo CLI (`npm install -g expo-cli`)

---

### 1. Backend

```bash
cd backend

# Instalar dependencias
npm install

# Configurar variables de entorno
cp .env.example .env
# Editar .env con tus credenciales

# Generar cliente Prisma y ejecutar migraciones
npm run db:generate
npm run db:migrate

# Iniciar en desarrollo
npm run dev
```

**Variables de entorno requeridas** (`.env`):
```env
DATABASE_URL="postgresql://usuario:contrasena@localhost:5432/veris_loyalty"
REDIS_URL="redis://localhost:6379"
JWT_ACCESS_SECRET="secreto_muy_seguro"
JWT_REFRESH_SECRET="otro_secreto_muy_seguro"
JWT_QR_SECRET="secreto_qr_muy_seguro"
PORT=3000
```

---

### 2. Mobile (React Native + Expo)

```bash
cd mobile

# Instalar dependencias
npm install

# Configurar URL del backend
# Crear archivo .env en /mobile:
echo 'EXPO_PUBLIC_API_URL=http://TU_IP:3000/api' > .env

# Iniciar Expo
npm start

# Escanea el QR con Expo Go en tu teléfono
```

---

## Flujo de la aplicación

### Cliente
1. **Onboarding**: 3 slides animados explicando los beneficios
2. **Registro/Login**: validación completa, JWT httpOnly cookies
3. **Home**: tarjeta digital con flip animation → QR dinámico (renueva cada 30s)
4. **Cupones**: grid de cupones con badges NUEVO / VENCE HOY, canje con puntos
5. **Historial**: paginado, tipo GANANCIA / CANJE con colores
6. **Perfil**: stats, nivel, configuración, logout

### Admin (negocio)
1. **Login seguro** con bloqueo tras 5 intentos fallidos
2. **Escáner QR** con cámara → muestra info del cliente → ingresa monto → suma puntos
3. **Dashboard**: total clientes, visitas del día, canjes del día, actividad reciente
4. **Gestión de cupones**: crear, editar, activar/desactivar

---

## Seguridad

| Característica | Implementación |
|---|---|
| QR dinámico | JWT firmado con `JWT_QR_SECRET`, TTL 30s en Redis, one-time use |
| Contraseñas | bcrypt con 10 rondas de salt |
| Sesiones | Access Token (15 min) + Refresh Token (30 días) en httpOnly cookie |
| Rate limiting | 5 intentos de login por 15 min por IP/email |
| Anti-captura | QR se consume en Redis al ser escaneado |
| Cupones | campo `canjeado_en` con timestamp único, no se puede canjear dos veces |

---

## API Endpoints principales

```
POST   /api/auth/registro          Registro de nuevo usuario
POST   /api/auth/login             Login usuario
POST   /api/auth/admin/login       Login admin negocio
POST   /api/auth/refresh           Refrescar access token
GET    /api/auth/perfil            Perfil usuario autenticado

GET    /api/qr/generar             Genera QR token (cliente)
POST   /api/qr/info                Info del cliente por QR (admin)
POST   /api/qr/escanear            Escanear QR y sumar puntos (admin)

GET    /api/coupons                Listar cupones disponibles
POST   /api/coupons/canjear        Canjear cupón con puntos
POST   /api/coupons/admin/crear    Crear cupón (admin)

GET    /api/transactions/historial Historial del cliente
GET    /api/admin/dashboard        Dashboard del negocio
```

---

## Stack técnico

| Capa | Tecnología |
|---|---|
| Mobile | React Native + Expo Router |
| Backend | Node.js + Express |
| ORM | Prisma |
| Base de datos | PostgreSQL |
| Cache/QR tokens | Redis |
| Auth | JWT (access + refresh) + bcrypt |
| Imágenes | Supabase Storage |
| Estado global | Zustand |
| Notificaciones | Expo Push Notifications |

---

## veris.com.ec — Digital Zeta
