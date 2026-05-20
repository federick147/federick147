import { useState } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  KeyboardAvoidingView, Platform, Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import useAuthStore from '../../hooks/useAuth';
import { Colors } from '../../constants/colors';

export default function AdminLoginScreen() {
  const router = useRouter();
  const { loginAdmin } = useAuthStore();
  const [email, setEmail] = useState('');
  const [contrasena, setContrasena] = useState('');
  const [verContrasena, setVerContrasena] = useState(false);
  const [cargando, setCargando] = useState(false);

  const handleLogin = async () => {
    if (!email || !contrasena) {
      Alert.alert('Error', 'Completa todos los campos');
      return;
    }
    setCargando(true);
    try {
      await loginAdmin(email.trim().toLowerCase(), contrasena);
      router.replace('/(admin)/dashboard');
    } catch (error) {
      Alert.alert('Error', error.response?.data?.error || 'Credenciales inválidas');
    } finally {
      setCargando(false);
    }
  };

  return (
    <LinearGradient colors={['#0A0A0A', '#111111']} style={styles.contenedor}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <View style={styles.inner}>
          <TouchableOpacity style={styles.volver} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
          </TouchableOpacity>

          <View style={styles.iconoContenedor}>
            <Ionicons name="storefront-outline" size={48} color={Colors.gold} />
          </View>

          <Text style={styles.titulo}>Panel Negocio</Text>
          <Text style={styles.subtitulo}>Acceso exclusivo para administradores</Text>

          <View style={styles.campo}>
            <Text style={styles.etiqueta}>Email</Text>
            <View style={styles.inputContenedor}>
              <Ionicons name="mail-outline" size={20} color={Colors.textMuted} />
              <TextInput
                style={styles.input}
                placeholder="admin@negocio.com"
                placeholderTextColor={Colors.textMuted}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>
          </View>

          <View style={styles.campo}>
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

          <TouchableOpacity
            style={[styles.boton, cargando && { opacity: 0.7 }]}
            onPress={handleLogin}
            disabled={cargando}
          >
            <LinearGradient colors={[Colors.gold, Colors.goldDark]} style={styles.botonGradiente} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
              <Text style={styles.botonTexto}>{cargando ? 'Ingresando...' : 'Ingresar'}</Text>
            </LinearGradient>
          </TouchableOpacity>

          <View style={styles.avisoSeguridad}>
            <Ionicons name="shield-checkmark-outline" size={14} color={Colors.textMuted} />
            <Text style={styles.avisoTexto}>Acceso monitoreado y seguro</Text>
          </View>
        </View>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  contenedor: { flex: 1 },
  inner: { flex: 1, paddingHorizontal: 28, paddingTop: 60, paddingBottom: 40 },
  volver: { marginBottom: 32 },
  iconoContenedor: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: Colors.surfaceElevated,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: Colors.gold + '40',
    marginBottom: 24,
  },
  titulo: { fontFamily: 'SpaceGrotesk-Bold', fontSize: 30, color: Colors.textPrimary, marginBottom: 8 },
  subtitulo: { fontFamily: 'SpaceGrotesk-Regular', fontSize: 14, color: Colors.textSecondary, marginBottom: 36 },
  campo: { marginBottom: 20 },
  etiqueta: { fontFamily: 'SpaceGrotesk-Bold', fontSize: 12, color: Colors.textSecondary, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 },
  inputContenedor: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.surfaceElevated, borderRadius: 14, paddingHorizontal: 16, paddingVertical: 14, borderWidth: 1, borderColor: Colors.border, gap: 12 },
  input: { flex: 1, fontFamily: 'SpaceGrotesk-Regular', fontSize: 16, color: Colors.textPrimary },
  boton: { borderRadius: 14, overflow: 'hidden', marginTop: 8, marginBottom: 20 },
  botonGradiente: { paddingVertical: 18, alignItems: 'center' },
  botonTexto: { fontFamily: 'SpaceGrotesk-Bold', fontSize: 16, color: '#000' },
  avisoSeguridad: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 },
  avisoTexto: { fontFamily: 'SpaceGrotesk-Regular', fontSize: 12, color: Colors.textMuted },
});
