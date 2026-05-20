import { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  RefreshControl, ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/colors';
import useAuthStore from '../../hooks/useAuth';
import { adminAPI } from '../../services/api';

export default function AdminDashboard() {
  const router = useRouter();
  const { admin, logout } = useAuthStore();
  const [datos, setDatos] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [refrescando, setRefrescando] = useState(false);

  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    try {
      const { data } = await adminAPI.dashboard();
      setDatos(data);
    } catch {}
    finally {
      setCargando(false);
      setRefrescando(false);
    }
  };

  const StatCard = ({ icono, valor, etiqueta, color }) => (
    <View style={styles.statCard}>
      <View style={[styles.statIcono, { backgroundColor: color + '20' }]}>
        <Ionicons name={icono} size={22} color={color} />
      </View>
      <Text style={styles.statValor}>{valor}</Text>
      <Text style={styles.statEtiqueta}>{etiqueta}</Text>
    </View>
  );

  return (
    <LinearGradient colors={['#0A0A0A', '#0F0F0F']} style={styles.contenedor}>
      <ScrollView
        refreshControl={<RefreshControl refreshing={refrescando} onRefresh={() => { setRefrescando(true); cargarDatos(); }} tintColor={Colors.gold} />}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.negocioNombre}>{admin?.negocio?.nombre}</Text>
            <Text style={styles.adminNombre}>Hola, {admin?.nombre}</Text>
          </View>
          <TouchableOpacity
            style={styles.logoutBtn}
            onPress={async () => { await logout(); router.replace('/(auth)'); }}
          >
            <Ionicons name="log-out-outline" size={22} color={Colors.error} />
          </TouchableOpacity>
        </View>

        {/* Botón principal: Escanear QR */}
        <TouchableOpacity
          style={styles.botonEscanear}
          onPress={() => router.push('/(admin)/scanner')}
          activeOpacity={0.85}
        >
          <LinearGradient colors={[Colors.gold, Colors.goldDark]} style={styles.escanearGradiente} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
            <Ionicons name="qr-code-outline" size={32} color="#000" />
            <Text style={styles.escanearTexto}>Escanear QR del Cliente</Text>
          </LinearGradient>
        </TouchableOpacity>

        {cargando ? (
          <ActivityIndicator size="large" color={Colors.gold} style={{ marginTop: 40 }} />
        ) : (
          <>
            {/* Stats */}
            <View style={styles.statsGrid}>
              <StatCard
                icono="people-outline"
                valor={datos?.resumen?.total_clientes || 0}
                etiqueta="Clientes totales"
                color={Colors.info}
              />
              <StatCard
                icono="walk-outline"
                valor={datos?.resumen?.visitas_hoy || 0}
                etiqueta="Visitas hoy"
                color={Colors.success}
              />
              <StatCard
                icono="gift-outline"
                valor={datos?.resumen?.canjes_hoy || 0}
                etiqueta="Canjes hoy"
                color={Colors.gold}
              />
            </View>

            {/* Actividad del día */}
            <View style={styles.seccion}>
              <View style={styles.seccionHeader}>
                <Text style={styles.tituloSeccion}>Actividad de hoy</Text>
                <TouchableOpacity onPress={() => router.push('/(admin)/coupons')}>
                  <Text style={styles.verTodo}>Cupones →</Text>
                </TouchableOpacity>
              </View>

              {datos?.transacciones_hoy?.length === 0 ? (
                <View style={styles.vacio}>
                  <Ionicons name="calendar-outline" size={40} color={Colors.textMuted} />
                  <Text style={styles.vacioTexto}>Sin actividad hoy</Text>
                </View>
              ) : (
                datos?.transacciones_hoy?.map((t) => (
                  <View key={t.id} style={styles.transItem}>
                    <View style={[
                      styles.transIcono,
                      { backgroundColor: t.tipo === 'GANANCIA' ? Colors.success + '20' : Colors.gold + '20' }
                    ]}>
                      <Ionicons
                        name={t.tipo === 'GANANCIA' ? 'add-circle' : 'gift'}
                        size={18}
                        color={t.tipo === 'GANANCIA' ? Colors.success : Colors.gold}
                      />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.transCliente}>{t.cliente}</Text>
                      <Text style={styles.transHora}>
                        {new Date(t.hora).toLocaleTimeString('es-EC', { hour: '2-digit', minute: '2-digit' })}
                        {t.monto_compra ? ` • $${parseFloat(t.monto_compra).toFixed(2)}` : ''}
                      </Text>
                    </View>
                    <Text style={[styles.transPuntos, { color: t.tipo === 'GANANCIA' ? Colors.success : Colors.gold }]}>
                      {t.tipo === 'GANANCIA' ? '+' : ''}{t.puntos} pts
                    </Text>
                  </View>
                ))
              )}
            </View>
          </>
        )}

        <View style={{ height: 32 }} />
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  contenedor: { flex: 1 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', paddingHorizontal: 24, paddingTop: 60, paddingBottom: 20 },
  negocioNombre: { fontFamily: 'SpaceGrotesk-Bold', fontSize: 22, color: Colors.gold },
  adminNombre: { fontFamily: 'SpaceGrotesk-Regular', fontSize: 14, color: Colors.textSecondary, marginTop: 4 },
  logoutBtn: { padding: 8 },

  botonEscanear: { marginHorizontal: 24, borderRadius: 20, overflow: 'hidden', marginBottom: 28 },
  escanearGradiente: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 14, paddingVertical: 22 },
  escanearTexto: { fontFamily: 'SpaceGrotesk-Bold', fontSize: 18, color: '#000' },

  statsGrid: { flexDirection: 'row', paddingHorizontal: 24, gap: 10, marginBottom: 28 },
  statCard: { flex: 1, backgroundColor: Colors.surfaceElevated, borderRadius: 16, padding: 14, alignItems: 'center', borderWidth: 1, borderColor: Colors.border, gap: 8 },
  statIcono: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  statValor: { fontFamily: 'SpaceGrotesk-Bold', fontSize: 24, color: Colors.textPrimary },
  statEtiqueta: { fontFamily: 'SpaceGrotesk-Regular', fontSize: 11, color: Colors.textSecondary, textAlign: 'center' },

  seccion: { paddingHorizontal: 24 },
  seccionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  tituloSeccion: { fontFamily: 'SpaceGrotesk-Bold', fontSize: 18, color: Colors.textPrimary },
  verTodo: { fontFamily: 'SpaceGrotesk-Regular', fontSize: 14, color: Colors.gold },

  transItem: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: Colors.border },
  transIcono: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center' },
  transCliente: { fontFamily: 'SpaceGrotesk-Bold', fontSize: 14, color: Colors.textPrimary },
  transHora: { fontFamily: 'SpaceGrotesk-Regular', fontSize: 12, color: Colors.textMuted, marginTop: 2 },
  transPuntos: { fontFamily: 'SpaceGrotesk-Bold', fontSize: 15 },

  vacio: { alignItems: 'center', paddingVertical: 32, gap: 12 },
  vacioTexto: { fontFamily: 'SpaceGrotesk-Regular', fontSize: 14, color: Colors.textMuted },
});
