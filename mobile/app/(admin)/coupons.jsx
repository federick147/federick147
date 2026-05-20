import { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  TextInput, Modal, Alert, Switch, ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/colors';
import { adminAPI } from '../../services/api';

const FORM_VACIO = {
  titulo: '', descripcion: '', puntos_requeridos: '',
  stock: '', fecha_vencimiento: '', activo: true,
};

export default function AdminCouponsScreen() {
  const router = useRouter();
  const [cupones, setCupones] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [form, setForm] = useState(FORM_VACIO);
  const [guardando, setGuardando] = useState(false);
  const [editandoId, setEditandoId] = useState(null);

  useEffect(() => { cargarCupones(); }, []);

  const cargarCupones = async () => {
    try {
      const { data } = await adminAPI.cupones();
      setCupones(data.cupones);
    } catch {}
    finally { setCargando(false); }
  };

  const guardar = async () => {
    if (!form.titulo || !form.puntos_requeridos) {
      Alert.alert('Error', 'Título y puntos son obligatorios');
      return;
    }
    setGuardando(true);
    try {
      if (editandoId) {
        await adminAPI.actualizarCupon(editandoId, form);
      } else {
        await adminAPI.crearCupon(form);
      }
      setModalVisible(false);
      setForm(FORM_VACIO);
      setEditandoId(null);
      cargarCupones();
    } catch (error) {
      Alert.alert('Error', error.response?.data?.error || 'Error al guardar');
    } finally {
      setGuardando(false);
    }
  };

  const editar = (cupon) => {
    setForm({ titulo: cupon.titulo, descripcion: cupon.descripcion || '', puntos_requeridos: String(cupon.puntos_requeridos), stock: cupon.stock > 0 ? String(cupon.stock) : '', fecha_vencimiento: '', activo: cupon.activo });
    setEditandoId(cupon.id);
    setModalVisible(true);
  };

  const renderCupon = ({ item }) => (
    <View style={styles.cuponItem}>
      <View style={styles.cuponInfo}>
        <View style={[styles.activoBadge, { backgroundColor: item.activo ? Colors.success + '20' : Colors.error + '20' }]}>
          <Text style={[styles.activoTexto, { color: item.activo ? Colors.success : Colors.error }]}>
            {item.activo ? 'Activo' : 'Inactivo'}
          </Text>
        </View>
        <Text style={styles.cuponTitulo}>{item.titulo}</Text>
        <Text style={styles.cuponDetalle}>
          {item.puntos_requeridos} pts • {item._count?.user_coupons || 0} canjeados
        </Text>
      </View>
      <TouchableOpacity onPress={() => editar(item)} style={styles.editarBtn}>
        <Ionicons name="pencil-outline" size={18} color={Colors.gold} />
      </TouchableOpacity>
    </View>
  );

  return (
    <LinearGradient colors={['#0A0A0A', '#0F0F0F']} style={styles.contenedor}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.titulo}>Cupones</Text>
        <TouchableOpacity style={styles.botonCrear} onPress={() => { setForm(FORM_VACIO); setEditandoId(null); setModalVisible(true); }}>
          <Ionicons name="add" size={24} color={Colors.gold} />
        </TouchableOpacity>
      </View>

      <FlatList
        data={cupones}
        keyExtractor={(item) => item.id}
        renderItem={renderCupon}
        contentContainerStyle={styles.lista}
        showsVerticalScrollIndicator={false}
        ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
        ListEmptyComponent={
          <View style={styles.vacio}>
            <Ionicons name="gift-outline" size={48} color={Colors.textMuted} />
            <Text style={styles.vacioTexto}>No hay cupones</Text>
            <Text style={styles.vacioSub}>Crea tu primer cupón con el botón +</Text>
          </View>
        }
      />

      {/* Modal crear/editar */}
      <Modal visible={modalVisible} transparent animationType="slide" onRequestClose={() => setModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <LinearGradient colors={[Colors.surfaceElevated, Colors.surface]} style={styles.modalContenido}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitulo}>{editandoId ? 'Editar cupón' : 'Nuevo cupón'}</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={24} color={Colors.textPrimary} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {[
                { campo: 'titulo', etiqueta: 'Título', placeholder: 'Ej: Café gratis' },
                { campo: 'descripcion', etiqueta: 'Descripción', placeholder: 'Descripción del cupón' },
                { campo: 'puntos_requeridos', etiqueta: 'Puntos requeridos', placeholder: '100', keyboard: 'numeric' },
                { campo: 'stock', etiqueta: 'Stock (vacío = ilimitado)', placeholder: '50', keyboard: 'numeric' },
                { campo: 'fecha_vencimiento', etiqueta: 'Fecha vencimiento (YYYY-MM-DD)', placeholder: '2025-12-31' },
              ].map(({ campo, etiqueta, placeholder, keyboard }) => (
                <View key={campo} style={styles.formCampo}>
                  <Text style={styles.formEtiqueta}>{etiqueta}</Text>
                  <TextInput
                    style={styles.formInput}
                    placeholder={placeholder}
                    placeholderTextColor={Colors.textMuted}
                    value={form[campo]}
                    onChangeText={(v) => setForm((p) => ({ ...p, [campo]: v }))}
                    keyboardType={keyboard || 'default'}
                  />
                </View>
              ))}

              <View style={styles.formCampo}>
                <Text style={styles.formEtiqueta}>Activo</Text>
                <Switch
                  value={form.activo}
                  onValueChange={(v) => setForm((p) => ({ ...p, activo: v }))}
                  trackColor={{ false: Colors.border, true: Colors.gold + '80' }}
                  thumbColor={form.activo ? Colors.gold : Colors.textMuted}
                />
              </View>

              <TouchableOpacity
                style={[styles.botonGuardar, guardando && { opacity: 0.7 }]}
                onPress={guardar}
                disabled={guardando}
              >
                <LinearGradient colors={[Colors.gold, Colors.goldDark]} style={styles.botonGradiente}>
                  <Text style={styles.botonTexto}>{guardando ? 'Guardando...' : editandoId ? 'Actualizar' : 'Crear cupón'}</Text>
                </LinearGradient>
              </TouchableOpacity>

              <View style={{ height: 40 }} />
            </ScrollView>
          </LinearGradient>
        </View>
      </Modal>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  contenedor: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 24, paddingTop: 60, paddingBottom: 20 },
  titulo: { fontFamily: 'SpaceGrotesk-Bold', fontSize: 22, color: Colors.textPrimary },
  botonCrear: { width: 40, height: 40, borderRadius: 20, backgroundColor: Colors.gold + '20', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: Colors.gold + '40' },

  lista: { paddingHorizontal: 24, paddingBottom: 32 },
  cuponItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.surfaceElevated, borderRadius: 14, padding: 16, borderWidth: 1, borderColor: Colors.border },
  cuponInfo: { flex: 1, gap: 4 },
  activoBadge: { alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, marginBottom: 4 },
  activoTexto: { fontFamily: 'SpaceGrotesk-Bold', fontSize: 11 },
  cuponTitulo: { fontFamily: 'SpaceGrotesk-Bold', fontSize: 15, color: Colors.textPrimary },
  cuponDetalle: { fontFamily: 'SpaceGrotesk-Regular', fontSize: 12, color: Colors.textSecondary },
  editarBtn: { padding: 8 },

  vacio: { alignItems: 'center', paddingTop: 80, gap: 10 },
  vacioTexto: { fontFamily: 'SpaceGrotesk-Bold', fontSize: 18, color: Colors.textPrimary },
  vacioSub: { fontFamily: 'SpaceGrotesk-Regular', fontSize: 14, color: Colors.textMuted },

  modalOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: '#000000CC' },
  modalContenido: { borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 28, maxHeight: '90%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  modalTitulo: { fontFamily: 'SpaceGrotesk-Bold', fontSize: 20, color: Colors.textPrimary },

  formCampo: { marginBottom: 16 },
  formEtiqueta: { fontFamily: 'SpaceGrotesk-Bold', fontSize: 12, color: Colors.textSecondary, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 },
  formInput: { backgroundColor: Colors.card, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, fontFamily: 'SpaceGrotesk-Regular', fontSize: 15, color: Colors.textPrimary, borderWidth: 1, borderColor: Colors.border },

  botonGuardar: { borderRadius: 14, overflow: 'hidden', marginTop: 8 },
  botonGradiente: { paddingVertical: 18, alignItems: 'center' },
  botonTexto: { fontFamily: 'SpaceGrotesk-Bold', fontSize: 16, color: '#000' },
});
