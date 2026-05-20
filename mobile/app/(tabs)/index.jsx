import { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  useWindowDimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import useAuthStore from '../../hooks/useAuth';
import DigitalCard from '../../components/cards/DigitalCard';
import { Colors, NivelColors } from '../../constants/colors';
import { authAPI } from '../../services/api';

const PUNTOS_SIGUIENTE_NIVEL = { BRONZE: 500, SILVER: 2000, GOLD: 2000 };

export default function HomeScreen() {
  const router = useRouter();
  const { usuario, tarjeta, actualizarTarjeta } = useAuthStore();
  const [refrescando, setRefrescando] = useState(false);

  if (!usuario) {
    router.replace('/(auth)');
    return null;
  }

  const nivelInfo = NivelColors[tarjeta?.nivel || 'BRONZE'];
  const puntosNivel = PUNTOS_SIGUIENTE_NIVEL[tarjeta?.nivel || 'BRONZE'];
  const progresoNivel =
    tarjeta?.nivel === 'GOLD'
      ? 1
      : Math.min((tarjeta?.puntos_totales || 0) / puntosNivel, 1);

  const refrescar = async () => {
    setRefrescando(true);
    try {
      const { data } = await authAPI.perfil();
      actualizarTarjeta(data.tarjeta);
    } catch {}
    setRefrescando(false);
  };

  return (
    <LinearGradient colors={['#0A0A0A', '#0F0F0F']} style={styles.contenedor}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refrescando}
            onRefresh={refrescar}
            tintColor={Colors.gold}
          />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.saludo}>Hola, {usuario.nombre} 👋</Text>
            <Text style={styles.fecha}>
              {new Date().toLocaleDateString('es-EC', {
                weekday: 'long',
                day: 'numeric',
                month: 'long',
              })}
            </Text>
          </View>
          <TouchableOpacity style={styles.notifBoton}>
            <Ionicons name="notifications-outline" size={24} color={Colors.textPrimary} />
          </TouchableOpacity>
        </View>

        {/* Tarjeta Digital */}
        <DigitalCard usuario={usuario} tarjeta={tarjeta} />

        {/* Progreso de nivel */}
        <View style={styles.seccion}>
          <View style={styles.nivelHeader}>
            <View style={styles.nivelInfo}>
              <Text style={[styles.nivelBadge, { color: nivelInfo.color }]}>
                {nivelInfo.emoji} Nivel {nivelInfo.label}
              </Text>
              <Text style={styles.puntosTotal}>
                {(tarjeta?.puntos_totales || 0).toLocaleString()} pts totales
              </Text>
            </View>
            {tarjeta?.nivel !== 'GOLD' && (
              <Text style={styles.puntosRestantes}>
                {(puntosNivel - (tarjeta?.puntos_totales || 0)).toLocaleString()} pts para{' '}
                {tarjeta?.nivel === 'BRONZE' ? 'Plata' : 'Oro'}
              </Text>
            )}
          </View>

          <View style={styles.barraProgreso}>
            <View
              style={[
                styles.barraRelleno,
                {
                  width: `${progresoNivel * 100}%`,
                  backgroundColor: nivelInfo.color,
                },
              ]}
            />
          </View>
          <View style={styles.nivelEtiquetas}>
            <Text style={styles.etiquetaNivel}>
              {tarjeta?.nivel === 'BRONZE' ? 'Bronce' : tarjeta?.nivel === 'SILVER' ? 'Plata' : 'Oro'}
            </Text>
            {tarjeta?.nivel !== 'GOLD' && (
              <Text style={styles.etiquetaNivel}>
                {tarjeta?.nivel === 'BRONZE' ? 'Plata' : 'Oro'}
              </Text>
            )}
          </View>
        </View>

        {/* Beneficios por nivel */}
        <View style={styles.seccion}>
          <Text style={styles.tituloSeccion}>Beneficios de tu nivel</Text>
          <View style={styles.beneficiosGrid}>
            <BeneficioCard
              icono="ribbon-outline"
              titulo="Sin costo de membresía"
              activo
            />
            <BeneficioCard
              icono="flash-outline"
              titulo="2x puntos en eventos"
              activo={tarjeta?.nivel !== 'BRONZE'}
            />
            <BeneficioCard
              icono="star-outline"
              titulo="Cupones exclusivos"
              activo={tarjeta?.nivel === 'GOLD'}
            />
            <BeneficioCard
              icono="diamond-outline"
              titulo="Acceso prioritario"
              activo={tarjeta?.nivel === 'GOLD'}
            />
          </View>
        </View>

        {/* CTA cupones */}
        <TouchableOpacity
          style={styles.ctaCupones}
          onPress={() => router.push('/(tabs)/coupons')}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={[Colors.surfaceElevated, Colors.surface]}
            style={styles.ctaGradiente}
          >
            <Ionicons name="gift" size={24} color={Colors.gold} />
            <View style={{ flex: 1 }}>
              <Text style={styles.ctaTitulo}>Cupones disponibles</Text>
              <Text style={styles.ctaSubtitulo}>Ver todos los premios</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={Colors.textMuted} />
          </LinearGradient>
        </TouchableOpacity>

        <View style={{ height: 32 }} />
      </ScrollView>
    </LinearGradient>
  );
}

function BeneficioCard({ icono, titulo, activo }) {
  return (
    <View style={[benefStyles.card, !activo && benefStyles.inactivo]}>
      <Ionicons
        name={icono}
        size={22}
        color={activo ? Colors.gold : Colors.textMuted}
      />
      <Text style={[benefStyles.texto, !activo && { color: Colors.textMuted }]}>
        {titulo}
      </Text>
      {!activo && (
        <Ionicons name="lock-closed" size={12} color={Colors.textMuted} style={benefStyles.lock} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  contenedor: { flex: 1 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 24,
  },
  saludo: { fontFamily: 'SpaceGrotesk-Bold', fontSize: 24, color: Colors.textPrimary },
  fecha: { fontFamily: 'SpaceGrotesk-Regular', fontSize: 13, color: Colors.textSecondary, marginTop: 2 },
  notifBoton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.surfaceElevated,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },

  seccion: {
    paddingHorizontal: 24,
    marginBottom: 28,
  },
  tituloSeccion: {
    fontFamily: 'SpaceGrotesk-Bold',
    fontSize: 16,
    color: Colors.textPrimary,
    marginBottom: 16,
  },

  nivelHeader: { marginBottom: 12 },
  nivelInfo: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  nivelBadge: { fontFamily: 'SpaceGrotesk-Bold', fontSize: 15 },
  puntosTotal: { fontFamily: 'SpaceGrotesk-Regular', fontSize: 13, color: Colors.textSecondary },
  puntosRestantes: { fontFamily: 'SpaceGrotesk-Regular', fontSize: 12, color: Colors.textMuted },

  barraProgreso: {
    height: 6,
    backgroundColor: Colors.border,
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 6,
  },
  barraRelleno: { height: '100%', borderRadius: 3 },
  nivelEtiquetas: { flexDirection: 'row', justifyContent: 'space-between' },
  etiquetaNivel: { fontFamily: 'SpaceGrotesk-Regular', fontSize: 11, color: Colors.textMuted },

  beneficiosGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },

  ctaCupones: { marginHorizontal: 24, borderRadius: 16, overflow: 'hidden', borderWidth: 1, borderColor: Colors.border },
  ctaGradiente: { flexDirection: 'row', alignItems: 'center', padding: 16, gap: 12 },
  ctaTitulo: { fontFamily: 'SpaceGrotesk-Bold', fontSize: 15, color: Colors.textPrimary },
  ctaSubtitulo: { fontFamily: 'SpaceGrotesk-Regular', fontSize: 12, color: Colors.textSecondary },
});

const benefStyles = StyleSheet.create({
  card: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: Colors.surfaceElevated,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 8,
    position: 'relative',
  },
  inactivo: { borderColor: Colors.border, opacity: 0.5 },
  texto: { fontFamily: 'SpaceGrotesk-Regular', fontSize: 13, color: Colors.textPrimary },
  lock: { position: 'absolute', top: 10, right: 10 },
});
