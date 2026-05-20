import { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/colors';
import { transactionAPI } from '../../services/api';

export default function HistoryScreen() {
  const [transacciones, setTransacciones] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [pagina, setPagina] = useState(1);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    cargarHistorial(1);
  }, []);

  const cargarHistorial = async (p) => {
    try {
      const { data } = await transactionAPI.historial(p);
      if (p === 1) {
        setTransacciones(data.transacciones);
      } else {
        setTransacciones((prev) => [...prev, ...data.transacciones]);
      }
      setTotal(data.total);
      setPagina(p);
    } catch {
    } finally {
      setCargando(false);
    }
  };

  const renderItem = ({ item }) => {
    const esGanancia = item.tipo === 'GANANCIA';
    const fecha = new Date(item.creado_en);

    return (
      <View style={styles.item}>
        <View style={[styles.iconoCirculo, esGanancia ? styles.iconoGanancia : styles.iconoCanje]}>
          <Ionicons
            name={esGanancia ? 'add-circle' : 'gift'}
            size={22}
            color={esGanancia ? Colors.success : Colors.gold}
          />
        </View>

        <View style={styles.itemInfo}>
          <Text style={styles.itemNegocio}>{item.negocio?.nombre}</Text>
          <Text style={styles.itemDescripcion}>{item.descripcion}</Text>
          <Text style={styles.itemFecha}>
            {fecha.toLocaleDateString('es-EC', { day: 'numeric', month: 'short', year: 'numeric' })} •{' '}
            {fecha.toLocaleTimeString('es-EC', { hour: '2-digit', minute: '2-digit' })}
          </Text>
        </View>

        <Text style={[styles.itemPuntos, esGanancia ? styles.puntosGanancia : styles.puntosCanje]}>
          {esGanancia ? '+' : ''}{item.puntos.toLocaleString()}
          {'\n'}
          <Text style={styles.ptsSufijo}>pts</Text>
        </Text>
      </View>
    );
  };

  return (
    <LinearGradient colors={['#0A0A0A', '#0F0F0F']} style={styles.contenedor}>
      <View style={styles.header}>
        <Text style={styles.titulo}>Historial</Text>
        <Text style={styles.subtitulo}>{total} movimientos</Text>
      </View>

      {cargando ? (
        <View style={styles.cargando}>
          <ActivityIndicator size="large" color={Colors.gold} />
        </View>
      ) : (
        <FlatList
          data={transacciones}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.lista}
          showsVerticalScrollIndicator={false}
          onEndReached={() => {
            if (transacciones.length < total) {
              cargarHistorial(pagina + 1);
            }
          }}
          onEndReachedThreshold={0.3}
          ItemSeparatorComponent={() => <View style={styles.separador} />}
          ListEmptyComponent={
            <View style={styles.vacio}>
              <Ionicons name="time-outline" size={48} color={Colors.textMuted} />
              <Text style={styles.vacioTexto}>Aún no tienes movimientos</Text>
              <Text style={styles.vacioSubtexto}>Visita un negocio y gana puntos</Text>
            </View>
          }
        />
      )}
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  contenedor: { flex: 1 },
  header: { paddingHorizontal: 24, paddingTop: 60, paddingBottom: 20 },
  titulo: { fontFamily: 'SpaceGrotesk-Bold', fontSize: 28, color: Colors.textPrimary },
  subtitulo: { fontFamily: 'SpaceGrotesk-Regular', fontSize: 14, color: Colors.textSecondary, marginTop: 4 },

  cargando: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  lista: { paddingHorizontal: 24, paddingBottom: 32 },

  item: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingVertical: 14,
  },
  iconoCirculo: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  iconoGanancia: { backgroundColor: Colors.success + '20' },
  iconoCanje: { backgroundColor: Colors.gold + '20' },

  itemInfo: { flex: 1 },
  itemNegocio: { fontFamily: 'SpaceGrotesk-Bold', fontSize: 14, color: Colors.textPrimary },
  itemDescripcion: { fontFamily: 'SpaceGrotesk-Regular', fontSize: 13, color: Colors.textSecondary, marginTop: 2 },
  itemFecha: { fontFamily: 'SpaceGrotesk-Regular', fontSize: 11, color: Colors.textMuted, marginTop: 4 },

  itemPuntos: { fontFamily: 'SpaceGrotesk-Bold', fontSize: 18, textAlign: 'right' },
  puntosGanancia: { color: Colors.success },
  puntosCanje: { color: Colors.gold },
  ptsSufijo: { fontFamily: 'SpaceGrotesk-Regular', fontSize: 11, color: Colors.textMuted },

  separador: { height: 1, backgroundColor: Colors.border, marginLeft: 58 },

  vacio: { alignItems: 'center', paddingTop: 80, gap: 12 },
  vacioTexto: { fontFamily: 'SpaceGrotesk-Bold', fontSize: 18, color: Colors.textPrimary },
  vacioSubtexto: { fontFamily: 'SpaceGrotesk-Regular', fontSize: 14, color: Colors.textMuted },
});
