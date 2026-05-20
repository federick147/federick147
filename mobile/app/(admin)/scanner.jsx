import { useState, useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, TextInput,
  Alert, Modal, ActivityIndicator,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Colors, NivelColors } from '../../constants/colors';
import { qrAPI } from '../../services/api';

export default function ScannerScreen() {
  const router = useRouter();
  const [permission, requestPermission] = useCameraPermissions();
  const [escaneado, setEscaneado] = useState(false);
  const [cargando, setCargando] = useState(false);
  const [cliente, setCliente] = useState(null);
  const [monto, setMonto] = useState('');
  const [procesando, setProcesando] = useState(false);

  const procesarQR = async (tokenQR) => {
    if (escaneado || cargando) return;
    setEscaneado(true);
    setCargando(true);

    try {
      const { data } = await qrAPI.infoCliente({ qr_token: tokenQR });
      setCliente({ ...data.cliente, ...data.tarjeta, qr_token: tokenQR });
    } catch (error) {
      Alert.alert('QR Inválido', error.response?.data?.error || 'Código QR no válido', [
        { text: 'Intentar de nuevo', onPress: () => setEscaneado(false) },
      ]);
    } finally {
      setCargando(false);
    }
  };

  const sumarPuntos = async () => {
    if (!monto || parseFloat(monto) <= 0) {
      Alert.alert('Error', 'Ingresa el monto de compra');
      return;
    }

    setProcesando(true);
    try {
      const { data } = await qrAPI.escanear({
        qr_token: cliente.qr_token,
        monto_compra: parseFloat(monto),
      });

      Alert.alert(
        '¡Listo!',
        `${data.puntos_ganados} puntos agregados a ${data.cliente.nombre}\n\nPuntos ahora: ${data.tarjeta.puntos_actuales}`,
        [{ text: 'Nuevo escaneo', onPress: resetear }]
      );
    } catch (error) {
      Alert.alert('Error', error.response?.data?.error || 'Error al procesar', [
        { text: 'Intentar de nuevo', onPress: resetear },
      ]);
    } finally {
      setProcesando(false);
    }
  };

  const resetear = () => {
    setEscaneado(false);
    setCliente(null);
    setMonto('');
  };

  if (!permission) return <View style={styles.contenedor} />;

  if (!permission.granted) {
    return (
      <LinearGradient colors={['#0A0A0A', '#0F0F0F']} style={styles.contenedor}>
        <View style={styles.permisoContenedor}>
          <Ionicons name="camera-outline" size={64} color={Colors.gold} />
          <Text style={styles.permisoTitulo}>Cámara requerida</Text>
          <Text style={styles.permisoTexto}>Necesitamos acceso a la cámara para escanear los QR de los clientes</Text>
          <TouchableOpacity style={styles.botonPermiso} onPress={requestPermission}>
            <LinearGradient colors={[Colors.gold, Colors.goldDark]} style={styles.botonGradiente}>
              <Text style={styles.botonTexto}>Permitir cámara</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </LinearGradient>
    );
  }

  return (
    <View style={styles.contenedor}>
      {/* Cámara */}
      <CameraView
        style={StyleSheet.absoluteFill}
        facing="back"
        onBarcodeScanned={escaneado ? undefined : ({ data }) => procesarQR(data)}
        barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
      />

      {/* Overlay oscuro */}
      <View style={styles.overlay}>
        {/* Header */}
        <View style={styles.headerEscaneo}>
          <TouchableOpacity style={styles.botonVolver} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color="#FFF" />
          </TouchableOpacity>
          <Text style={styles.tituloEscaneo}>Escanear QR</Text>
          <View style={{ width: 40 }} />
        </View>

        {/* Marco del QR */}
        <View style={styles.marcoCentro}>
          <View style={styles.marco}>
            <View style={[styles.esquina, styles.esquinaTopLeft]} />
            <View style={[styles.esquina, styles.esquinaTopRight]} />
            <View style={[styles.esquina, styles.esquinaBottomLeft]} />
            <View style={[styles.esquina, styles.esquinaBottomRight]} />
            {cargando && <ActivityIndicator size="large" color={Colors.gold} />}
          </View>
          <Text style={styles.instruccion}>
            {cargando ? 'Verificando...' : 'Apunta al código QR del cliente'}
          </Text>
        </View>
      </View>

      {/* Modal: info del cliente + ingreso de monto */}
      <Modal visible={!!cliente} transparent animationType="slide" onRequestClose={resetear}>
        <View style={styles.modalOverlay}>
          <LinearGradient colors={[Colors.surfaceElevated, Colors.surface]} style={styles.modalContenido}>
            {/* Info cliente */}
            <View style={styles.clienteHeader}>
              <View style={styles.clienteAvatar}>
                <Text style={styles.clienteLetra}>
                  {cliente?.nombre?.charAt(0)?.toUpperCase()}
                </Text>
              </View>
              <View>
                <Text style={styles.clienteNombre}>{cliente?.nombre}</Text>
                <Text style={[styles.clienteNivel, { color: NivelColors[cliente?.nivel || 'BRONZE']?.color }]}>
                  {NivelColors[cliente?.nivel || 'BRONZE']?.emoji} Nivel {NivelColors[cliente?.nivel || 'BRONZE']?.label}
                </Text>
              </View>
              <View style={styles.clientePuntos}>
                <Text style={styles.clientePuntosNum}>{cliente?.puntos_actuales?.toLocaleString()}</Text>
                <Text style={styles.clientePuntosLbl}>puntos</Text>
              </View>
            </View>

            {/* Monto de compra */}
            <View style={styles.montoSeccion}>
              <Text style={styles.montoEtiqueta}>MONTO DE COMPRA ($)</Text>
              <View style={styles.montoInput}>
                <Text style={styles.montoSimbolo}>$</Text>
                <TextInput
                  style={styles.montoTexto}
                  placeholder="0.00"
                  placeholderTextColor={Colors.textMuted}
                  value={monto}
                  onChangeText={setMonto}
                  keyboardType="decimal-pad"
                  autoFocus
                />
              </View>
              {monto && parseFloat(monto) > 0 && (
                <Text style={styles.puntosPreview}>
                  = {Math.floor(parseFloat(monto) * 10).toLocaleString()} puntos
                </Text>
              )}
            </View>

            {/* Botones */}
            <View style={styles.modalBotones}>
              <TouchableOpacity style={styles.botonCancelar} onPress={resetear}>
                <Text style={styles.botonCancelarTexto}>Cancelar</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.botonSumar, procesando && { opacity: 0.7 }]}
                onPress={sumarPuntos}
                disabled={procesando}
              >
                <LinearGradient colors={[Colors.gold, Colors.goldDark]} style={styles.botonGradiente}>
                  <Text style={styles.botonTexto}>
                    {procesando ? 'Procesando...' : 'Sumar puntos'}
                  </Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </LinearGradient>
        </View>
      </Modal>
    </View>
  );
}

const MARCO = 240;
const ESQUINA = 24;

const styles = StyleSheet.create({
  contenedor: { flex: 1, backgroundColor: '#000' },

  overlay: { flex: 1, backgroundColor: '#00000088' },

  headerEscaneo: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingTop: 60, paddingBottom: 20,
  },
  botonVolver: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center', backgroundColor: '#00000060', borderRadius: 20 },
  tituloEscaneo: { fontFamily: 'SpaceGrotesk-Bold', fontSize: 18, color: '#FFF' },

  marcoCentro: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 24 },
  marco: {
    width: MARCO, height: MARCO,
    alignItems: 'center', justifyContent: 'center',
    position: 'relative',
  },
  esquina: { position: 'absolute', width: ESQUINA, height: ESQUINA, borderColor: Colors.gold, borderWidth: 3 },
  esquinaTopLeft: { top: 0, left: 0, borderRightWidth: 0, borderBottomWidth: 0 },
  esquinaTopRight: { top: 0, right: 0, borderLeftWidth: 0, borderBottomWidth: 0 },
  esquinaBottomLeft: { bottom: 0, left: 0, borderRightWidth: 0, borderTopWidth: 0 },
  esquinaBottomRight: { bottom: 0, right: 0, borderLeftWidth: 0, borderTopWidth: 0 },
  instruccion: { fontFamily: 'SpaceGrotesk-Regular', fontSize: 15, color: '#FFFFFFCC', textAlign: 'center' },

  permisoContenedor: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32, gap: 16 },
  permisoTitulo: { fontFamily: 'SpaceGrotesk-Bold', fontSize: 24, color: Colors.textPrimary, textAlign: 'center' },
  permisoTexto: { fontFamily: 'SpaceGrotesk-Regular', fontSize: 15, color: Colors.textSecondary, textAlign: 'center', lineHeight: 24 },
  botonPermiso: { borderRadius: 14, overflow: 'hidden', width: '100%', marginTop: 8 },

  modalOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: '#000000CC' },
  modalContenido: { borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 28, paddingBottom: 40 },

  clienteHeader: { flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 24, padding: 16, backgroundColor: Colors.card, borderRadius: 16, borderWidth: 1, borderColor: Colors.border },
  clienteAvatar: { width: 50, height: 50, borderRadius: 25, backgroundColor: Colors.gold + '20', alignItems: 'center', justifyContent: 'center' },
  clienteLetra: { fontFamily: 'SpaceGrotesk-Bold', fontSize: 24, color: Colors.gold },
  clienteNombre: { fontFamily: 'SpaceGrotesk-Bold', fontSize: 16, color: Colors.textPrimary },
  clienteNivel: { fontFamily: 'SpaceGrotesk-Regular', fontSize: 13, marginTop: 2 },
  clientePuntos: { marginLeft: 'auto', alignItems: 'flex-end' },
  clientePuntosNum: { fontFamily: 'SpaceGrotesk-Bold', fontSize: 22, color: Colors.gold },
  clientePuntosLbl: { fontFamily: 'SpaceGrotesk-Regular', fontSize: 11, color: Colors.textMuted },

  montoSeccion: { marginBottom: 24 },
  montoEtiqueta: { fontFamily: 'SpaceGrotesk-Bold', fontSize: 12, color: Colors.textSecondary, letterSpacing: 1, marginBottom: 10 },
  montoInput: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.surfaceElevated, borderRadius: 14, paddingHorizontal: 16, paddingVertical: 14, borderWidth: 1, borderColor: Colors.gold + '60', gap: 8 },
  montoSimbolo: { fontFamily: 'SpaceGrotesk-Bold', fontSize: 24, color: Colors.gold },
  montoTexto: { flex: 1, fontFamily: 'SpaceGrotesk-Bold', fontSize: 28, color: Colors.textPrimary },
  puntosPreview: { fontFamily: 'SpaceGrotesk-Regular', fontSize: 14, color: Colors.gold, marginTop: 8, textAlign: 'right' },

  modalBotones: { flexDirection: 'row', gap: 12 },
  botonCancelar: { flex: 1, paddingVertical: 16, borderRadius: 14, borderWidth: 1, borderColor: Colors.border, alignItems: 'center' },
  botonCancelarTexto: { fontFamily: 'SpaceGrotesk-Bold', fontSize: 15, color: Colors.textSecondary },
  botonSumar: { flex: 2, borderRadius: 14, overflow: 'hidden' },
  botonGradiente: { paddingVertical: 16, alignItems: 'center' },
  botonTexto: { fontFamily: 'SpaceGrotesk-Bold', fontSize: 16, color: '#000' },
});
