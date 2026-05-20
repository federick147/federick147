import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import useAuthStore from '../../hooks/useAuth';
import { Colors } from '../../constants/colors';

export default function RegisterScreen() {
  const router = useRouter();
  const { registro } = useAuthStore();

  const [form, setForm] = useState({
    nombre: '',
    apellido: '',
    email: '',
    telefono: '',
    contrasena: '',
    confirmarContrasena: '',
  });
  const [verContrasena, setVerContrasena] = useState(false);
  const [cargando, setCargando] = useState(false);

  const actualizar = (campo, valor) => setForm((prev) => ({ ...prev, [campo]: valor }));

  const validar = () => {
    if (!form.nombre || !form.apellido || !form.email || !form.telefono || !form.contrasena) {
      Alert.alert('Error', 'Todos los campos son obligatorios');
      return false;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(form.email)) {
      Alert.alert('Error', 'Ingresa un email válido');
      return false;
    }
    if (form.contrasena.length < 8) {
      Alert.alert('Error', 'La contraseña debe tener al menos 8 caracteres');
      return false;
    }
    if (form.contrasena !== form.confirmarContrasena) {
      Alert.alert('Error', 'Las contraseñas no coinciden');
      return false;
    }
    return true;
  };

  const handleRegistro = async () => {
    if (!validar()) return;

    setCargando(true);
    try {
      await registro({
        nombre: form.nombre.trim(),
        apellido: form.apellido.trim(),
        email: form.email.trim().toLowerCase(),
        telefono: form.telefono.trim(),
        contrasena: form.contrasena,
      });
      router.replace('/(tabs)');
    } catch (error) {
      const mensaje = error.response?.data?.error || 'Error al crear cuenta';
      Alert.alert('Error', mensaje);
    } finally {
      setCargando(false);
    }
  };

  const Campo = ({ icono, placeholder, campo, keyboard, secure, valor }) => (
    <View style={styles.inputContenedor}>
      <Ionicons name={icono} size={20} color={Colors.textMuted} />
      <TextInput
        style={styles.input}
        placeholder={placeholder}
        placeholderTextColor={Colors.textMuted}
        value={valor || form[campo]}
        onChangeText={(v) => actualizar(campo, v)}
        keyboardType={keyboard || 'default'}
        autoCapitalize="none"
        secureTextEntry={secure && !verContrasena}
      />
      {secure && (
        <TouchableOpacity onPress={() => setVerContrasena(!verContrasena)}>
          <Ionicons
            name={verContrasena ? 'eye-off-outline' : 'eye-outline'}
            size={20}
            color={Colors.textMuted}
          />
        </TouchableOpacity>
      )}
    </View>
  );

  return (
    <LinearGradient colors={['#0A0A0A', '#111111']} style={styles.contenedor}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          <TouchableOpacity style={styles.botonVolver} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
          </TouchableOpacity>

          <Text style={styles.titulo}>Crear cuenta</Text>
          <Text style={styles.subtitulo}>Únete y empieza a acumular puntos hoy</Text>

          <View style={styles.fila}>
            <View style={[styles.campoMitad]}>
              <Text style={styles.etiqueta}>Nombre</Text>
              <Campo icono="person-outline" placeholder="Juan" campo="nombre" />
            </View>
            <View style={[styles.campoMitad]}>
              <Text style={styles.etiqueta}>Apellido</Text>
              <Campo icono="person-outline" placeholder="Pérez" campo="apellido" />
            </View>
          </View>

          <View style={styles.campo}>
            <Text style={styles.etiqueta}>Email</Text>
            <Campo icono="mail-outline" placeholder="tu@email.com" campo="email" keyboard="email-address" />
          </View>

          <View style={styles.campo}>
            <Text style={styles.etiqueta}>Teléfono</Text>
            <Campo icono="call-outline" placeholder="+593 99 999 9999" campo="telefono" keyboard="phone-pad" />
          </View>

          <View style={styles.campo}>
            <Text style={styles.etiqueta}>Contraseña</Text>
            <Campo icono="lock-closed-outline" placeholder="Mínimo 8 caracteres" campo="contrasena" secure />
          </View>

          <View style={styles.campo}>
            <Text style={styles.etiqueta}>Confirmar contraseña</Text>
            <Campo icono="lock-closed-outline" placeholder="Repite tu contraseña" campo="confirmarContrasena" secure />
          </View>

          <TouchableOpacity
            style={[styles.boton, cargando && { opacity: 0.7 }]}
            onPress={handleRegistro}
            disabled={cargando}
            activeOpacity={0.8}
          >
            <LinearGradient colors={[Colors.gold, Colors.goldDark]} style={styles.botonGradiente} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
              <Text style={styles.botonTexto}>{cargando ? 'Creando cuenta...' : 'Crear cuenta'}</Text>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity style={styles.enlace} onPress={() => router.push('/(auth)/login')}>
            <Text style={styles.enlaceTexto}>¿Ya tienes cuenta? Ingresar</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  contenedor: { flex: 1 },
  scroll: { flexGrow: 1, paddingHorizontal: 28, paddingTop: 60, paddingBottom: 40 },
  botonVolver: { marginBottom: 24 },
  titulo: { fontFamily: 'SpaceGrotesk-Bold', fontSize: 32, color: Colors.textPrimary, marginBottom: 8 },
  subtitulo: { fontFamily: 'SpaceGrotesk-Regular', fontSize: 15, color: Colors.textSecondary, marginBottom: 32 },

  fila: { flexDirection: 'row', gap: 12, marginBottom: 0 },
  campoMitad: { flex: 1, marginBottom: 20 },
  campo: { marginBottom: 20 },
  etiqueta: {
    fontFamily: 'SpaceGrotesk-Bold',
    fontSize: 12,
    color: Colors.textSecondary,
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  inputContenedor: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surfaceElevated,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 13,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 10,
  },
  input: { flex: 1, fontFamily: 'SpaceGrotesk-Regular', fontSize: 15, color: Colors.textPrimary },

  boton: { borderRadius: 14, overflow: 'hidden', marginTop: 8, marginBottom: 20 },
  botonGradiente: { paddingVertical: 18, alignItems: 'center' },
  botonTexto: { fontFamily: 'SpaceGrotesk-Bold', fontSize: 16, color: '#000' },

  enlace: { alignItems: 'center' },
  enlaceTexto: { fontFamily: 'SpaceGrotesk-Regular', fontSize: 14, color: Colors.textSecondary },
});
