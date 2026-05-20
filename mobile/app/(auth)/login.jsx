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

export default function LoginScreen() {
  const router = useRouter();
  const { login } = useAuthStore();

  const [email, setEmail] = useState('');
  const [contrasena, setContrasena] = useState('');
  const [verContrasena, setVerContrasena] = useState(false);
  const [cargando, setCargando] = useState(false);

  const handleLogin = async () => {
    if (!email.trim() || !contrasena.trim()) {
      Alert.alert('Error', 'Completa todos los campos');
      return;
    }

    setCargando(true);
    try {
      await login(email.trim().toLowerCase(), contrasena);
      router.replace('/(tabs)');
    } catch (error) {
      const mensaje = error.response?.data?.error || 'Error al iniciar sesión';
      Alert.alert('Error de acceso', mensaje);
    } finally {
      setCargando(false);
    }
  };

  return (
    <LinearGradient colors={['#0A0A0A', '#111111']} style={styles.contenedor}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          {/* Header */}
          <TouchableOpacity style={styles.botonVolver} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
          </TouchableOpacity>

          <View style={styles.header}>
            <Text style={styles.logoTexto}>VERIS</Text>
            <Text style={styles.titulo}>Bienvenido de vuelta</Text>
            <Text style={styles.subtitulo}>Ingresa a tu cuenta para ver tus puntos</Text>
          </View>

          {/* Formulario */}
          <View style={styles.formulario}>
            <View style={styles.campoContenedor}>
              <Text style={styles.etiqueta}>Email</Text>
              <View style={styles.inputContenedor}>
                <Ionicons name="mail-outline" size={20} color={Colors.textMuted} />
                <TextInput
                  style={styles.input}
                  placeholder="tu@email.com"
                  placeholderTextColor={Colors.textMuted}
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>
            </View>

            <View style={styles.campoContenedor}>
              <Text style={styles.etiqueta}>Contraseña</Text>
              <View style={styles.inputContenedor}>
                <Ionicons name="lock-closed-outline" size={20} color={Colors.textMuted} />
                <TextInput
                  style={styles.input}
                  placeholder="••••••••"
                  placeholderTextColor={Colors.textMuted}
                  value={contrasena}
                  onChangeText={setContrasena}
                  secureTextEntry={!verContrasena}
                />
                <TouchableOpacity onPress={() => setVerContrasena(!verContrasena)}>
                  <Ionicons
                    name={verContrasena ? 'eye-off-outline' : 'eye-outline'}
                    size={20}
                    color={Colors.textMuted}
                  />
                </TouchableOpacity>
              </View>
            </View>

            {/* Botón login */}
            <TouchableOpacity
              style={[styles.botonLogin, cargando && { opacity: 0.7 }]}
              onPress={handleLogin}
              disabled={cargando}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={[Colors.gold, Colors.goldDark]}
                style={styles.botonGradiente}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                <Text style={styles.botonTexto}>
                  {cargando ? 'Ingresando...' : 'Ingresar'}
                </Text>
              </LinearGradient>
            </TouchableOpacity>

            {/* Divider */}
            <View style={styles.divider}>
              <View style={styles.dividerLinea} />
              <Text style={styles.dividerTexto}>o</Text>
              <View style={styles.dividerLinea} />
            </View>

            {/* Registro */}
            <TouchableOpacity
              style={styles.botonRegistro}
              onPress={() => router.push('/(auth)/register')}
            >
              <Text style={styles.botonRegistroTexto}>Crear cuenta nueva</Text>
            </TouchableOpacity>

            {/* Admin */}
            <TouchableOpacity
              style={styles.enlaceAdmin}
              onPress={() => router.push('/(admin)/login')}
            >
              <Text style={styles.enlaceAdminTexto}>Acceso administradores →</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  contenedor: { flex: 1 },
  scroll: { flexGrow: 1, paddingHorizontal: 28, paddingTop: 60, paddingBottom: 40 },

  botonVolver: { marginBottom: 24 },

  header: { marginBottom: 40 },
  logoTexto: {
    fontFamily: 'SpaceGrotesk-Bold',
    fontSize: 14,
    color: Colors.gold,
    letterSpacing: 6,
    marginBottom: 16,
  },
  titulo: {
    fontFamily: 'SpaceGrotesk-Bold',
    fontSize: 32,
    color: Colors.textPrimary,
    marginBottom: 8,
  },
  subtitulo: {
    fontFamily: 'SpaceGrotesk-Regular',
    fontSize: 15,
    color: Colors.textSecondary,
  },

  formulario: { flex: 1 },

  campoContenedor: { marginBottom: 20 },
  etiqueta: {
    fontFamily: 'SpaceGrotesk-Bold',
    fontSize: 13,
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
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 12,
  },
  input: {
    flex: 1,
    fontFamily: 'SpaceGrotesk-Regular',
    fontSize: 16,
    color: Colors.textPrimary,
  },

  botonLogin: { borderRadius: 14, overflow: 'hidden', marginTop: 8, marginBottom: 24 },
  botonGradiente: { paddingVertical: 18, alignItems: 'center' },
  botonTexto: { fontFamily: 'SpaceGrotesk-Bold', fontSize: 16, color: '#000' },

  divider: { flexDirection: 'row', alignItems: 'center', marginBottom: 20, gap: 12 },
  dividerLinea: { flex: 1, height: 1, backgroundColor: Colors.border },
  dividerTexto: {
    fontFamily: 'SpaceGrotesk-Regular',
    fontSize: 14,
    color: Colors.textMuted,
  },

  botonRegistro: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.gold,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 20,
  },
  botonRegistroTexto: {
    fontFamily: 'SpaceGrotesk-Bold',
    fontSize: 15,
    color: Colors.gold,
  },

  enlaceAdmin: { alignItems: 'center', paddingVertical: 8 },
  enlaceAdminTexto: {
    fontFamily: 'SpaceGrotesk-Regular',
    fontSize: 13,
    color: Colors.textMuted,
  },
});
