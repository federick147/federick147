import { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import QRCode from 'react-native-qrcode-svg';
import { Ionicons } from '@expo/vector-icons';
import { Colors, NivelColors } from '../../constants/colors';
import { qrAPI } from '../../services/api';

const { width } = Dimensions.get('window');
const CARD_WIDTH = width - 48;
const CARD_HEIGHT = 220;
const QR_EXPIRY = 30; // segundos

export default function DigitalCard({ usuario, tarjeta }) {
  const [mostrandoQR, setMostrandoQR] = useState(false);
  const [qrToken, setQrToken] = useState(null);
  const [segundosRestantes, setSegundosRestantes] = useState(QR_EXPIRY);
  const [cargandoQR, setCargandoQR] = useState(false);

  // Animación flip card
  const flipAnim = useRef(new Animated.Value(0)).current;
  const flipTimerRef = useRef(null);
  const countdownRef = useRef(null);

  const nivelInfo = NivelColors[tarjeta?.nivel || 'BRONZE'];

  // Voltear la tarjeta
  const voltearTarjeta = () => {
    if (!mostrandoQR) {
      cargarQR();
    } else {
      limpiarQR();
    }

    Animated.spring(flipAnim, {
      toValue: mostrandoQR ? 0 : 1,
      friction: 8,
      tension: 10,
      useNativeDriver: true,
    }).start();
    setMostrandoQR(!mostrandoQR);
  };

  const cargarQR = async () => {
    setCargandoQR(true);
    try {
      const { data } = await qrAPI.generarQR();
      setQrToken(data.qr_token);
      setSegundosRestantes(QR_EXPIRY);
      iniciarCountdown();
    } catch {
      setMostrandoQR(false);
    } finally {
      setCargandoQR(false);
    }
  };

  const limpiarQR = () => {
    setQrToken(null);
    clearInterval(flipTimerRef.current);
    clearInterval(countdownRef.current);
  };

  const iniciarCountdown = () => {
    clearInterval(countdownRef.current);
    clearInterval(flipTimerRef.current);

    // Countdown visual
    countdownRef.current = setInterval(() => {
      setSegundosRestantes((prev) => {
        if (prev <= 1) {
          clearInterval(countdownRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    // Auto-renovar QR al expirar
    flipTimerRef.current = setTimeout(async () => {
      if (mostrandoQR) {
        const { data } = await qrAPI.generarQR();
        setQrToken(data.qr_token);
        setSegundosRestantes(QR_EXPIRY);
        iniciarCountdown();
      }
    }, QR_EXPIRY * 1000);
  };

  useEffect(() => {
    return () => {
      clearInterval(flipTimerRef.current);
      clearInterval(countdownRef.current);
    };
  }, []);

  // Interpolaciones para el flip
  const rotacionFrente = flipAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '180deg'],
  });
  const rotacionDorso = flipAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['180deg', '360deg'],
  });

  const porcentajeQR = (segundosRestantes / QR_EXPIRY) * 100;

  return (
    <View style={styles.contenedor}>
      <TouchableOpacity onPress={voltearTarjeta} activeOpacity={0.95}>
        {/* FRENTE: Tarjeta */}
        <Animated.View
          style={[
            styles.tarjeta,
            { transform: [{ rotateY: rotacionFrente }] },
            mostrandoQR && styles.oculto,
          ]}
        >
          <LinearGradient
            colors={['#1E1E1E', '#0D0D0D', '#161616']}
            style={styles.gradiente}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            {/* Patrón decorativo */}
            <View style={styles.circuloDecoUno} />
            <View style={styles.circuloDecoDos} />

            {/* Header tarjeta */}
            <View style={styles.tarjetaHeader}>
              <Text style={styles.logoTarjeta}>VERIS</Text>
              <View style={[styles.badgeNivel, { borderColor: nivelInfo.color }]}>
                <Text style={[styles.badgeTexto, { color: nivelInfo.color }]}>
                  {nivelInfo.emoji} {nivelInfo.label}
                </Text>
              </View>
            </View>

            {/* Nombre del cliente */}
            <View style={styles.tarjetaCentro}>
              <Text style={styles.nombreCliente}>
                {usuario?.nombre?.toUpperCase()} {usuario?.apellido?.toUpperCase()}
              </Text>
              <Text style={styles.codigoUnico}>
                #{tarjeta?.codigo_unico?.split('-')[0]?.toUpperCase()}
              </Text>
            </View>

            {/* Footer: puntos */}
            <View style={styles.tarjetaFooter}>
              <View>
                <Text style={styles.etiquetaPuntos}>PUNTOS DISPONIBLES</Text>
                <Text style={styles.numeroPuntos}>
                  {(tarjeta?.puntos_actuales || 0).toLocaleString()}
                </Text>
              </View>
              <View style={styles.iconoQR}>
                <Ionicons name="qr-code-outline" size={28} color={Colors.gold} />
                <Text style={styles.textoTapear}>Toca para QR</Text>
              </View>
            </View>

            {/* Línea dorada inferior */}
            <LinearGradient
              colors={[Colors.gold + '00', Colors.gold, Colors.gold + '00']}
              style={styles.lineaDorada}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            />
          </LinearGradient>
        </Animated.View>

        {/* DORSO: QR */}
        <Animated.View
          style={[
            styles.tarjeta,
            styles.tarjetaDorso,
            { transform: [{ rotateY: rotacionDorso }] },
            !mostrandoQR && styles.oculto,
          ]}
        >
          <LinearGradient
            colors={['#0D0D0D', '#1A1A0A', '#0D0D0D']}
            style={styles.gradiente}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <View style={styles.qrContenedor}>
              <Text style={styles.qrTitulo}>
                {usuario?.nombre}, muestra este código
              </Text>

              {cargandoQR ? (
                <View style={styles.qrPlaceholder}>
                  <Ionicons name="qr-code" size={80} color={Colors.gold + '40'} />
                  <Text style={styles.cargandoTexto}>Generando QR...</Text>
                </View>
              ) : qrToken ? (
                <View style={styles.qrWrapper}>
                  <QRCode
                    value={qrToken}
                    size={140}
                    backgroundColor="transparent"
                    color={Colors.textPrimary}
                    quietZone={8}
                  />
                </View>
              ) : null}

              {/* Countdown */}
              <View style={styles.countdown}>
                <View style={styles.countdownBarra}>
                  <Animated.View
                    style={[
                      styles.countdownRelleno,
                      { width: `${porcentajeQR}%` },
                    ]}
                  />
                </View>
                <Text style={styles.countdownTexto}>
                  Se renueva en {segundosRestantes}s
                </Text>
              </View>

              <Text style={styles.qrSubtexto}>Toca para volver a tu tarjeta</Text>
            </View>
          </LinearGradient>
        </Animated.View>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  contenedor: { paddingHorizontal: 24, marginBottom: 24 },

  tarjeta: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    borderRadius: 24,
    overflow: 'hidden',
    backfaceVisibility: 'hidden',
    shadowColor: Colors.gold,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  tarjetaDorso: { position: 'absolute', top: 0, left: 0 },
  oculto: { opacity: 0 },

  gradiente: { flex: 1, padding: 24, position: 'relative' },

  // Decoración
  circuloDecoUno: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: Colors.gold + '08',
    top: -60,
    right: -60,
  },
  circuloDecoDos: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: Colors.gold + '05',
    bottom: -30,
    left: -20,
  },

  // Frente
  tarjetaHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  logoTarjeta: {
    fontFamily: 'SpaceGrotesk-Bold',
    fontSize: 18,
    color: Colors.gold,
    letterSpacing: 4,
  },
  badgeNivel: {
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  badgeTexto: { fontFamily: 'SpaceGrotesk-Bold', fontSize: 11 },

  tarjetaCentro: { flex: 1, justifyContent: 'center' },
  nombreCliente: {
    fontFamily: 'SpaceGrotesk-Bold',
    fontSize: 20,
    color: Colors.textPrimary,
    letterSpacing: 2,
    marginBottom: 4,
  },
  codigoUnico: {
    fontFamily: 'SpaceGrotesk-Regular',
    fontSize: 12,
    color: Colors.textMuted,
    letterSpacing: 2,
  },

  tarjetaFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' },
  etiquetaPuntos: {
    fontFamily: 'SpaceGrotesk-Regular',
    fontSize: 10,
    color: Colors.textMuted,
    letterSpacing: 1,
    marginBottom: 2,
  },
  numeroPuntos: { fontFamily: 'SpaceGrotesk-Bold', fontSize: 28, color: Colors.gold },
  iconoQR: { alignItems: 'center', gap: 4 },
  textoTapear: { fontFamily: 'SpaceGrotesk-Regular', fontSize: 9, color: Colors.textMuted },

  lineaDorada: { position: 'absolute', bottom: 0, left: 24, right: 24, height: 2 },

  // Dorso (QR)
  qrContenedor: { flex: 1, alignItems: 'center', justifyContent: 'space-between' },
  qrTitulo: {
    fontFamily: 'SpaceGrotesk-Bold',
    fontSize: 13,
    color: Colors.textPrimary,
    textAlign: 'center',
  },
  qrWrapper: {
    padding: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    shadowColor: Colors.gold,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  qrPlaceholder: { alignItems: 'center', gap: 8 },
  cargandoTexto: {
    fontFamily: 'SpaceGrotesk-Regular',
    fontSize: 12,
    color: Colors.textMuted,
  },

  countdown: { width: '100%', alignItems: 'center', gap: 4 },
  countdownBarra: {
    width: '80%',
    height: 3,
    backgroundColor: Colors.border,
    borderRadius: 2,
    overflow: 'hidden',
  },
  countdownRelleno: { height: '100%', backgroundColor: Colors.gold, borderRadius: 2 },
  countdownTexto: {
    fontFamily: 'SpaceGrotesk-Regular',
    fontSize: 11,
    color: Colors.textMuted,
  },
  qrSubtexto: {
    fontFamily: 'SpaceGrotesk-Regular',
    fontSize: 11,
    color: Colors.textMuted + '80',
  },
});
