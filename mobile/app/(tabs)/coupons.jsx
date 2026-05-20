import { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  Modal,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/colors';
import { couponAPI } from '../../services/api';
import useAuthStore from '../../hooks/useAuth';

export default function CouponsScreen() {
  const { tarjeta, actualizarTarjeta } = useAuthStore();
  const [cupones, setCupones] = useState([]);
  const [cuponSeleccionado, setCuponSeleccionado] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [canjeando, setCanjeando] = useState(false);

  useEffect(() => {
    cargarCupones();
  }, []);

  const cargarCupones = async () => {
    try {
      const { data } = await couponAPI.listar();
      setCupones(data.cupones);
    } catch {
      Alert.alert('Error', 'No se pudieron cargar los cupones');
    } finally {
      setCargando(false);
    }
  };

  const canjear = async () => {
    if (!cuponSeleccionado) return;

    if ((tarjeta?.puntos_actuales || 0) < cuponSeleccionado.puntos_requeridos) {
      Alert.alert('Puntos insuficientes', 'No tienes suficientes puntos para este cupón');
      return;
    }

    setCanjeando(true);
    try {
      const { data } = await couponAPI.canjear(cuponSeleccionado.id);
      setCuponSeleccionado(null);

      // Actualizar puntos localmente
      if (tarjeta) {
        actualizarTarjeta({
          ...tarjeta,
          puntos_actuales: tarjeta.puntos_actuales - cuponSeleccionado.puntos_requeridos,
        });
      }

      Alert.alert('¡Cupón canjeado!', `Tu código: ${data.codigo_canje}`);
    } catch (error) {
      Alert.alert('Error', error.response?.data?.error || 'Error al canjear');
    } finally {
      setCanjeando(false);
    }
  };

  const renderCupon = ({ item }) => {
    const tienesPuntos = (tarjeta?.puntos_actuales || 0) >= item.puntos_requeridos;

    return (
      <TouchableOpacity
        style={styles.cuponCard}
        onPress={() => setCuponSeleccionado(item)}
        activeOpacity={0.8}
      >
        <LinearGradient
          colors={[Colors.surfaceElevated, Colors.card]}
          style={styles.cuponGradiente}
        >
          {/* Badges */}
          <View style={styles.badges}>
            {item.es_nuevo && (
              <View style={[styles.badge, styles.badgeNuevo]}>
                <Text style={styles.badgeTexto}>NUEVO</Text>
              </View>
            )}
            {item.vence_hoy && (
              <View style={[styles.badge, styles.badgeVence]}>
                <Text style={styles.badgeTexto}>VENCE HOY</Text>
              </View>
            )}
          </View>

          {/* Imagen */}
          <View style={styles.cuponImagen}>
            {item.imagen_url ? (
              <Image source={{ uri: item.imagen_url }} style={styles.imagen} />
            ) : (
              <View style={styles.imagenPlaceholder}>
                <Ionicons name="gift" size={32} color={Colors.gold} />
              </View>
            )}
          </View>

          {/* Info */}
          <View style={styles.cuponInfo}>
            <Text style={styles.cuponNegocio}>{item.negocio?.nombre}</Text>
            <Text style={styles.cuponTitulo} numberOfLines={2}>
              {item.titulo}
            </Text>

            {/* Puntos */}
            <View style={styles.puntosContenedor}>
              <Ionicons name="star" size={14} color={Colors.gold} />
              <Text style={[styles.puntos, !tienesPuntos && { color: Colors.textMuted }]}>
                {item.puntos_requeridos.toLocaleString()} pts
              </Text>
              {!tienesPuntos && (
                <Text style={styles.faltanPuntos}>
                  (faltan {(item.puntos_requeridos - (tarjeta?.puntos_actuales || 0)).toLocaleString()})
                </Text>
              )}
            </View>
          </View>
        </LinearGradient>
      </TouchableOpacity>
    );
  };

  return (
    <LinearGradient colors={['#0A0A0A', '#0F0F0F']} style={styles.contenedor}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.titulo}>Cupones</Text>
        <View style={styles.puntosDisponibles}>
          <Ionicons name="star" size={16} color={Colors.gold} />
          <Text style={styles.puntosTexto}>
            {(tarjeta?.puntos_actuales || 0).toLocaleString()} pts
          </Text>
        </View>
      </View>

      {cargando ? (
        <View style={styles.cargando}>
          <ActivityIndicator size="large" color={Colors.gold} />
        </View>
      ) : (
        <FlatList
          data={cupones}
          keyExtractor={(item) => item.id}
          renderItem={renderCupon}
          numColumns={2}
          columnWrapperStyle={styles.columnas}
          contentContainerStyle={styles.lista}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.vacio}>
              <Ionicons name="gift-outline" size={48} color={Colors.textMuted} />
              <Text style={styles.vacioTexto}>No hay cupones disponibles</Text>
            </View>
          }
        />
      )}

      {/* Modal detalle cupón */}
      <Modal
        visible={!!cuponSeleccionado}
        transparent
        animationType="slide"
        onRequestClose={() => setCuponSeleccionado(null)}
      >
        <View style={styles.modalOverlay}>
          <LinearGradient
            colors={[Colors.surfaceElevated, Colors.surface]}
            style={styles.modalContenido}
          >
            <TouchableOpacity
              style={styles.modalCerrar}
              onPress={() => setCuponSeleccionado(null)}
            >
              <Ionicons name="close" size={24} color={Colors.textPrimary} />
            </TouchableOpacity>

            {cuponSeleccionado?.imagen_url ? (
              <Image
                source={{ uri: cuponSeleccionado.imagen_url }}
                style={styles.modalImagen}
              />
            ) : (
              <View style={styles.modalImagenPlaceholder}>
                <Ionicons name="gift" size={60} color={Colors.gold} />
              </View>
            )}

            <Text style={styles.modalNegocio}>{cuponSeleccionado?.negocio?.nombre}</Text>
            <Text style={styles.modalTitulo}>{cuponSeleccionado?.titulo}</Text>
            {cuponSeleccionado?.descripcion && (
              <Text style={styles.modalDescripcion}>{cuponSeleccionado.descripcion}</Text>
            )}

            <View style={styles.modalPuntos}>
              <Ionicons name="star" size={20} color={Colors.gold} />
              <Text style={styles.modalPuntosTexto}>
                {cuponSeleccionado?.puntos_requeridos?.toLocaleString()} puntos
              </Text>
            </View>

            {cuponSeleccionado?.fecha_vencimiento && (
              <Text style={styles.modalVencimiento}>
                Vence: {new Date(cuponSeleccionado.fecha_vencimiento).toLocaleDateString('es-EC')}
              </Text>
            )}

            <TouchableOpacity
              style={[styles.botonCanjear, canjeando && { opacity: 0.7 }]}
              onPress={canjear}
              disabled={canjeando}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={[Colors.gold, Colors.goldDark]}
                style={styles.botonGradiente}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                <Text style={styles.botonTexto}>
                  {canjeando ? 'Canjeando...' : 'Canjear cupón'}
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          </LinearGradient>
        </View>
      </Modal>
    </LinearGradient>
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
    paddingBottom: 20,
  },
  titulo: { fontFamily: 'SpaceGrotesk-Bold', fontSize: 28, color: Colors.textPrimary },
  puntosDisponibles: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.surfaceElevated,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.gold + '40',
  },
  puntosTexto: { fontFamily: 'SpaceGrotesk-Bold', fontSize: 13, color: Colors.gold },

  cargando: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  lista: { paddingHorizontal: 20, paddingBottom: 24 },
  columnas: { gap: 12, marginBottom: 12 },

  cuponCard: { flex: 1, borderRadius: 16, overflow: 'hidden', borderWidth: 1, borderColor: Colors.border },
  cuponGradiente: { padding: 14 },

  badges: { flexDirection: 'row', gap: 4, marginBottom: 10 },
  badge: { borderRadius: 4, paddingHorizontal: 6, paddingVertical: 2 },
  badgeNuevo: { backgroundColor: Colors.gold },
  badgeVence: { backgroundColor: Colors.error },
  badgeTexto: { fontFamily: 'SpaceGrotesk-Bold', fontSize: 9, color: '#000' },

  cuponImagen: { borderRadius: 10, overflow: 'hidden', marginBottom: 12, height: 80, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.card },
  imagen: { width: '100%', height: '100%' },
  imagenPlaceholder: { width: '100%', height: '100%', justifyContent: 'center', alignItems: 'center' },

  cuponInfo: { gap: 4 },
  cuponNegocio: { fontFamily: 'SpaceGrotesk-Regular', fontSize: 11, color: Colors.textMuted },
  cuponTitulo: { fontFamily: 'SpaceGrotesk-Bold', fontSize: 14, color: Colors.textPrimary },
  puntosContenedor: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 6, flexWrap: 'wrap' },
  puntos: { fontFamily: 'SpaceGrotesk-Bold', fontSize: 13, color: Colors.gold },
  faltanPuntos: { fontFamily: 'SpaceGrotesk-Regular', fontSize: 11, color: Colors.error },

  vacio: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 80, gap: 12 },
  vacioTexto: { fontFamily: 'SpaceGrotesk-Regular', fontSize: 16, color: Colors.textMuted },

  // Modal
  modalOverlay: { flex: 1, backgroundColor: '#000000CC', justifyContent: 'flex-end' },
  modalContenido: { borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 28 },
  modalCerrar: { alignSelf: 'flex-end', marginBottom: 16 },
  modalImagen: { width: '100%', height: 180, borderRadius: 16, marginBottom: 16 },
  modalImagenPlaceholder: { width: '100%', height: 160, borderRadius: 16, backgroundColor: Colors.card, alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  modalNegocio: { fontFamily: 'SpaceGrotesk-Regular', fontSize: 13, color: Colors.textSecondary, marginBottom: 4 },
  modalTitulo: { fontFamily: 'SpaceGrotesk-Bold', fontSize: 22, color: Colors.textPrimary, marginBottom: 8 },
  modalDescripcion: { fontFamily: 'SpaceGrotesk-Regular', fontSize: 14, color: Colors.textSecondary, lineHeight: 22, marginBottom: 16 },
  modalPuntos: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  modalPuntosTexto: { fontFamily: 'SpaceGrotesk-Bold', fontSize: 18, color: Colors.gold },
  modalVencimiento: { fontFamily: 'SpaceGrotesk-Regular', fontSize: 12, color: Colors.textMuted, marginBottom: 24 },
  botonCanjear: { borderRadius: 14, overflow: 'hidden' },
  botonGradiente: { paddingVertical: 18, alignItems: 'center' },
  botonTexto: { fontFamily: 'SpaceGrotesk-Bold', fontSize: 16, color: '#000' },
});
