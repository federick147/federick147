import { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Dimensions,
  TouchableOpacity,
  Animated,
} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/colors';

const { width, height } = Dimensions.get('window');

const SLIDES = [
  {
    id: '1',
    icono: 'card-outline',
    titulo: 'Tu tarjeta siempre contigo',
    descripcion:
      'Lleva tu tarjeta de fidelización digital en tu bolsillo. Sin plásticos, sin pérdidas.',
  },
  {
    id: '2',
    icono: 'gift-outline',
    titulo: 'Acumula y gana premios',
    descripcion:
      'Gana puntos en cada visita a tus restaurantes, cafeterías y heladerías favoritas.',
  },
  {
    id: '3',
    icono: 'qr-code-outline',
    titulo: 'Solo muestra tu QR',
    descripcion:
      'Presenta tu código QR dinámico al pagar y los puntos se acreditan automáticamente.',
  },
];

export default function OnboardingScreen() {
  const router = useRouter();
  const [slideActual, setSlideActual] = useState(0);
  const flatListRef = useRef(null);
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handleScroll = (event) => {
    const index = Math.round(event.nativeEvent.contentOffset.x / width);
    setSlideActual(index);
  };

  const pulsar = () => {
    Animated.sequence([
      Animated.timing(scaleAnim, { toValue: 0.95, duration: 100, useNativeDriver: true }),
      Animated.timing(scaleAnim, { toValue: 1, duration: 100, useNativeDriver: true }),
    ]).start();
  };

  const irSiguiente = () => {
    pulsar();
    if (slideActual < SLIDES.length - 1) {
      flatListRef.current?.scrollToIndex({ index: slideActual + 1 });
    } else {
      router.replace('/(auth)/register');
    }
  };

  return (
    <LinearGradient colors={['#0A0A0A', '#111111']} style={styles.contenedor}>
      {/* Logo */}
      <View style={styles.logoContenedor}>
        <Text style={styles.logoTexto}>VERIS</Text>
        <View style={styles.logoLinea} />
        <Text style={styles.logoSubtexto}>LOYALTY</Text>
      </View>

      {/* Slides */}
      <FlatList
        ref={flatListRef}
        data={SLIDES}
        keyExtractor={(item) => item.id}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        renderItem={({ item }) => (
          <View style={styles.slide}>
            <View style={styles.iconoCirculo}>
              <Ionicons name={item.icono} size={56} color={Colors.gold} />
            </View>
            <Text style={styles.slideTitulo}>{item.titulo}</Text>
            <Text style={styles.slideDescripcion}>{item.descripcion}</Text>
          </View>
        )}
      />

      {/* Indicadores de página */}
      <View style={styles.indicadores}>
        {SLIDES.map((_, i) => (
          <View
            key={i}
            style={[
              styles.punto,
              i === slideActual ? styles.puntoActivo : styles.puntoInactivo,
            ]}
          />
        ))}
      </View>

      {/* Botón siguiente */}
      <View style={styles.botonesContenedor}>
        <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
          <TouchableOpacity style={styles.botonPrincipal} onPress={irSiguiente} activeOpacity={0.8}>
            <LinearGradient
              colors={[Colors.gold, Colors.goldDark]}
              style={styles.botonGradiente}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              <Text style={styles.botonTexto}>
                {slideActual === SLIDES.length - 1 ? 'Comenzar' : 'Siguiente'}
              </Text>
              <Ionicons name="arrow-forward" size={20} color="#000" />
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>

        <TouchableOpacity
          style={styles.botonSecundario}
          onPress={() => router.push('/(auth)/login')}
        >
          <Text style={styles.botonSecundarioTexto}>Ya tengo cuenta</Text>
        </TouchableOpacity>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  contenedor: { flex: 1, paddingTop: 60 },

  logoContenedor: { alignItems: 'center', marginBottom: 20 },
  logoTexto: {
    fontFamily: 'SpaceGrotesk-Bold',
    fontSize: 32,
    color: Colors.gold,
    letterSpacing: 8,
  },
  logoLinea: {
    width: 40,
    height: 2,
    backgroundColor: Colors.gold,
    marginVertical: 4,
  },
  logoSubtexto: {
    fontFamily: 'SpaceGrotesk-Regular',
    fontSize: 11,
    color: Colors.textSecondary,
    letterSpacing: 6,
  },

  slide: {
    width,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
    paddingVertical: 20,
  },
  iconoCirculo: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: Colors.surfaceElevated,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.gold + '40',
    marginBottom: 32,
    shadowColor: Colors.gold,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  slideTitulo: {
    fontFamily: 'SpaceGrotesk-Bold',
    fontSize: 26,
    color: Colors.textPrimary,
    textAlign: 'center',
    marginBottom: 16,
  },
  slideDescripcion: {
    fontFamily: 'SpaceGrotesk-Regular',
    fontSize: 16,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
  },

  indicadores: { flexDirection: 'row', justifyContent: 'center', marginBottom: 32 },
  punto: { width: 8, height: 8, borderRadius: 4, marginHorizontal: 4 },
  puntoActivo: { backgroundColor: Colors.gold, width: 24 },
  puntoInactivo: { backgroundColor: Colors.border },

  botonesContenedor: { paddingHorizontal: 32, paddingBottom: 48 },
  botonPrincipal: { borderRadius: 16, overflow: 'hidden', marginBottom: 16 },
  botonGradiente: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    gap: 8,
  },
  botonTexto: {
    fontFamily: 'SpaceGrotesk-Bold',
    fontSize: 16,
    color: '#000',
  },
  botonSecundario: { alignItems: 'center', paddingVertical: 12 },
  botonSecundarioTexto: {
    fontFamily: 'SpaceGrotesk-Regular',
    fontSize: 14,
    color: Colors.textSecondary,
  },
});
