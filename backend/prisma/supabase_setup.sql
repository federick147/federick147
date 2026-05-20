-- ═══════════════════════════════════════════════
-- VERIS LOYALTY — Script de creación de tablas
-- Ejecutar en: Supabase → SQL Editor
-- ═══════════════════════════════════════════════

-- Tipos enumerados
CREATE TYPE IF NOT EXISTS "Nivel" AS ENUM ('BRONZE', 'SILVER', 'GOLD');
CREATE TYPE IF NOT EXISTS "TipoTransaccion" AS ENUM ('GANANCIA', 'CANJE');

-- ─── Usuarios ────────────────────────────────
CREATE TABLE IF NOT EXISTS usuarios (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre          TEXT NOT NULL,
  apellido        TEXT NOT NULL,
  email           TEXT UNIQUE NOT NULL,
  telefono        TEXT UNIQUE NOT NULL,
  contrasena_hash TEXT NOT NULL,
  foto_url        TEXT,
  creado_en       TIMESTAMPTZ DEFAULT NOW(),
  actualizado_en  TIMESTAMPTZ DEFAULT NOW()
);

-- ─── Tarjetas de fidelización ─────────────────
CREATE TABLE IF NOT EXISTS tarjetas_fidelidad (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID UNIQUE NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  puntos_totales  INT DEFAULT 0,
  puntos_actuales INT DEFAULT 0,
  nivel           "Nivel" DEFAULT 'BRONZE',
  codigo_unico    UUID UNIQUE DEFAULT gen_random_uuid(),
  activa          BOOLEAN DEFAULT TRUE,
  creado_en       TIMESTAMPTZ DEFAULT NOW(),
  actualizado_en  TIMESTAMPTZ DEFAULT NOW()
);

-- ─── Negocios ─────────────────────────────────
CREATE TABLE IF NOT EXISTS negocios (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre         TEXT NOT NULL,
  logo_url       TEXT,
  categoria      TEXT NOT NULL,
  direccion      TEXT,
  api_key_hash   TEXT UNIQUE NOT NULL,
  propietario_id TEXT NOT NULL,
  activo         BOOLEAN DEFAULT TRUE,
  creado_en      TIMESTAMPTZ DEFAULT NOW()
);

-- ─── Administradores de negocio ───────────────
CREATE TABLE IF NOT EXISTS administradores (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email           TEXT UNIQUE NOT NULL,
  contrasena_hash TEXT NOT NULL,
  nombre          TEXT NOT NULL,
  business_id     UUID NOT NULL REFERENCES negocios(id) ON DELETE CASCADE,
  intentos_login  INT DEFAULT 0,
  bloqueado_hasta TIMESTAMPTZ,
  creado_en       TIMESTAMPTZ DEFAULT NOW()
);

-- ─── Transacciones ────────────────────────────
CREATE TABLE IF NOT EXISTS transacciones (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  card_id        UUID NOT NULL REFERENCES tarjetas_fidelidad(id) ON DELETE CASCADE,
  business_id    UUID NOT NULL REFERENCES negocios(id),
  tipo           "TipoTransaccion" NOT NULL,
  puntos         INT NOT NULL,
  monto_compra   DECIMAL(10,2),
  descripcion    TEXT,
  dispositivo_id TEXT,
  latitud        DECIMAL(10,6),
  longitud       DECIMAL(10,6),
  creado_en      TIMESTAMPTZ DEFAULT NOW()
);

-- ─── Cupones ──────────────────────────────────
CREATE TABLE IF NOT EXISTS cupones (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id       UUID NOT NULL REFERENCES negocios(id) ON DELETE CASCADE,
  titulo            TEXT NOT NULL,
  descripcion       TEXT,
  imagen_url        TEXT,
  puntos_requeridos INT NOT NULL,
  stock             INT DEFAULT -1,
  fecha_inicio      TIMESTAMPTZ DEFAULT NOW(),
  fecha_vencimiento TIMESTAMPTZ,
  activo            BOOLEAN DEFAULT TRUE,
  es_nuevo          BOOLEAN DEFAULT TRUE,
  creado_en         TIMESTAMPTZ DEFAULT NOW(),
  actualizado_en    TIMESTAMPTZ DEFAULT NOW()
);

-- ─── Cupones de usuario ───────────────────────
CREATE TABLE IF NOT EXISTS user_cupones (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id              UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  coupon_id            UUID NOT NULL REFERENCES cupones(id) ON DELETE CASCADE,
  canjeado             BOOLEAN DEFAULT FALSE,
  canjeado_en          TIMESTAMPTZ,
  codigo_canje_unico   UUID UNIQUE DEFAULT gen_random_uuid(),
  creado_en            TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, coupon_id)
);

-- ─── Refresh tokens usuarios ──────────────────
CREATE TABLE IF NOT EXISTS refresh_tokens (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  token_hash TEXT UNIQUE NOT NULL,
  expira_en  TIMESTAMPTZ NOT NULL,
  creado_en  TIMESTAMPTZ DEFAULT NOW()
);

-- ─── Refresh tokens admins ────────────────────
CREATE TABLE IF NOT EXISTS admin_refresh_tokens (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id   UUID NOT NULL REFERENCES administradores(id) ON DELETE CASCADE,
  token_hash TEXT UNIQUE NOT NULL,
  expira_en  TIMESTAMPTZ NOT NULL,
  creado_en  TIMESTAMPTZ DEFAULT NOW()
);

-- ═══════════════════════════════════════════════
-- Negocio de prueba para empezar
-- ═══════════════════════════════════════════════
INSERT INTO negocios (nombre, logo_url, categoria, direccion, api_key_hash, propietario_id)
VALUES ('Veris Demo', NULL, 'Cafetería', 'Quito, Ecuador', 'demo-api-key-hash-001', 'owner-demo-001')
ON CONFLICT DO NOTHING;
