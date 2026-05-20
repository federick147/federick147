import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Colors, NivelColors } from '../../constants/colors';
import useAuthStore from '../../hooks/useAuth';

export default function ProfileScreen() {
  const router = useRouter();
  const { usuario, tarjeta, logout } = useAuthStore();

  const nivelInfo = NivelColors[tarjeta?.nivel || 'BRONZE'];

  const handleLogout = () => {
    Alert.alert('Cerrar sesión', '¿Seguro que deseas salir?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Salir',
        style: 'destructive',
        onPress: async () => {
          await logout();
          router.replace('/(auth)');
        },
      },
    ]);
  };

  const InfoFila = ({ icono, etiqueta, valor }) => (
    <View style={styles.infoFila}>
      <View style={styles.infoIcono}>
        <Ionicons name={icono} size={18} color={Colors.gold} />
      </View>
      <View style={styles.infoTextos}>
        <Text style={styles.infoEtiqueta}>{etiqueta}</Text>
        <Text style={styles.infoValor}>{valor}</Text>
      </View>
    </View>
  );

  return (
    <LinearGradient colors={['#0A0A0A', '#0F0F0F']} style={styles.contenedor}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.titulo}>Perfil</Text>
        </View>

        {/* Avatar + nombre */}
        <View style={styles.avatarSeccion}>
          <LinearGradient
            colors={[nivelInfo.color + '30', Colors.surfaceElevated]}
            style={styles.avatarCirculo}
          >
            {usuario?.foto_url ? (
              <Image source={{ uri: usuario.foto_url }} style={styles.avatarImg} />
            ) : (
              <Text style={styles.avatarLetra}>
                {usuario?.nombre?.charAt(0)?.toUpperCase()}
              </Text>
            )}
          </LinearGradient>

          <Text style={styles.nombreCompleto}>
            {usuario?.nombre} {usuario?.apellido}
          </Text>

          <View style={[styles.nivelBadge, { borderColor: nivelInfo.color }]}>
            <Text style={[styles.nivelTexto, { color: nivelInfo.color }]}>
              {nivelInfo.emoji} Nivel {nivelInfo.label}
            </Text>
          </View>
        </View>

        {/* Stats */}
        <View style={styles.stats}>
          <View style={styles.statItem}>
            <Text style={styles.statNumero}>{(tarjeta?.puntos_actuales || 0).toLocaleString()}</Text>
            <Text style={styles.statEtiqueta}>Puntos disponibles</Text>
          </View>
          <View style={styles.statDivisor} />
          <View style={styles.statItem}>
            <Text style={styles.statNumero}>{(tarjeta?.puntos_totales || 0).toLocaleString()}</Text>
            <Text style={styles.statEtiqueta}>Puntos ganados</Text>
          </View>
        </View>

        {/* Info personal */}
        <View style={styles.seccion}>
          <Text style={styles.tituloSeccion}>Información personal</Text>

          <View style={styles.tarjetaInfo}>
            <InfoFila icono="person-outline" etiqueta="Nombre" valor={`${usuario?.nombre} ${usuario?.apellido}`} />
            <View style={styles.separador} />
            <InfoFila icono="mail-outline" etiqueta="Email" valor={usuario?.email} />
            <View style={styles.separador} />
            <InfoFila icono="call-outline" etiqueta="Teléfono" valor={usuario?.telefono} />
            <View style={styles.separador} />
            <InfoFila
              icono="calendar-outline"
              etiqueta="Miembro desde"
              valor={
                usuario?.creado_en
                  ? new Date(usuario.creado_en).toLocaleDateString('es-EC', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                    })
                  : '-'
              }
            />
          </View>
        </View>

        {/* Opciones */}
        <View style={styles.seccion}>
          <Text style={styles.tituloSeccion}>Configuración</Text>

          <TouchableOpacity style={styles.opcion}>
            <Ionicons name="notifications-outline" size={20} color={Colors.textPrimary} />
            <Text style={styles.opcionTexto}>Notificaciones</Text>
            <Ionicons name="chevron-forward" size={18} color={Colors.textMuted} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.opcion}>
            <Ionicons name="help-circle-outline" size={20} color={Colors.textPrimary} />
            <Text style={styles.opcionTexto}>Ayuda y soporte</Text>
            <Ionicons name="chevron-forward" size={18} color={Colors.textMuted} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.opcion}>
            <Ionicons name="shield-outline" size={20} color={Colors.textPrimary} />
            <Text style={styles.opcionTexto}>Privacidad</Text>
            <Ionicons name="chevron-forward" size={18} color={Colors.textMuted} />
          </TouchableOpacity>
        </View>

        {/* Logout */}
        <TouchableOpacity style={styles.botonLogout} onPress={handleLogout} activeOpacity={0.8}>
          <Ionicons name="log-out-outline" size={20} color={Colors.error} />
          <Text style={styles.logoutTexto}>Cerrar sesión</Text>
        </TouchableOpacity>

        <Text style={styles.version}>Veris v1.0.0 — veris.com.ec</Text>

        <View style={{ height: 40 }} />
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  contenedor: { flex: 1 },
  header: { paddingHorizontal: 24, paddingTop: 60, paddingBottom: 8 },
  titulo: { fontFamily: 'SpaceGrotesk-Bold', fontSize: 28, color: Colors.textPrimary },

  avatarSeccion: { alignItems: 'center', paddingVertical: 28 },
  avatarCirculo: {
    width: 90,
    height: 90,
    borderRadius: 45,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  avatarImg: { width: 90, height: 90, borderRadius: 45 },
  avatarLetra: { fontFamily: 'SpaceGrotesk-Bold', fontSize: 40, color: Colors.textPrimary },
  nombreCompleto: { fontFamily: 'SpaceGrotesk-Bold', fontSize: 22, color: Colors.textPrimary, marginBottom: 10 },
  nivelBadge: { borderWidth: 1, borderRadius: 20, paddingHorizontal: 14, paddingVertical: 6 },
  nivelTexto: { fontFamily: 'SpaceGrotesk-Bold', fontSize: 13 },

  stats: {
    flexDirection: 'row',
    backgroundColor: Colors.surfaceElevated,
    marginHorizontal: 24,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 28,
  },
  statItem: { flex: 1, alignItems: 'center' },
  statNumero: { fontFamily: 'SpaceGrotesk-Bold', fontSize: 24, color: Colors.gold },
  statEtiqueta: { fontFamily: 'SpaceGrotesk-Regular', fontSize: 12, color: Colors.textSecondary, marginTop: 4, textAlign: 'center' },
  statDivisor: { width: 1, backgroundColor: Colors.border },

  seccion: { paddingHorizontal: 24, marginBottom: 24 },
  tituloSeccion: { fontFamily: 'SpaceGrotesk-Bold', fontSize: 16, color: Colors.textPrimary, marginBottom: 12 },

  tarjetaInfo: {
    backgroundColor: Colors.surfaceElevated,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
  },
  infoFila: { flexDirection: 'row', alignItems: 'center', padding: 16, gap: 14 },
  infoIcono: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.gold + '15',
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoTextos: { flex: 1 },
  infoEtiqueta: { fontFamily: 'SpaceGrotesk-Regular', fontSize: 12, color: Colors.textMuted },
  infoValor: { fontFamily: 'SpaceGrotesk-Bold', fontSize: 14, color: Colors.textPrimary, marginTop: 2 },
  separador: { height: 1, backgroundColor: Colors.border, marginLeft: 66 },

  opcion: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: Colors.surfaceElevated,
    borderRadius: 14,
    padding: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  opcionTexto: { flex: 1, fontFamily: 'SpaceGrotesk-Regular', fontSize: 15, color: Colors.textPrimary },

  botonLogout: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    marginHorizontal: 24,
    paddingVertical: 16,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.error + '40',
    marginBottom: 16,
  },
  logoutTexto: { fontFamily: 'SpaceGrotesk-Bold', fontSize: 15, color: Colors.error },

  version: { fontFamily: 'SpaceGrotesk-Regular', fontSize: 12, color: Colors.textMuted, textAlign: 'center' },
});
