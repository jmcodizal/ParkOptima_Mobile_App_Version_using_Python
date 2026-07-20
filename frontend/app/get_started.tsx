import React from 'react';
import { useRouter } from 'expo-router';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  ImageBackground,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const COLORS = {
  navyDark: '#0D1B2E',
  navy: '#1A2E4A',
  navyMid: '#152538',
  teal: '#1D9E75',
  tealDark: '#0F8B62',
  white: '#FFFFFF',
  whiteAlpha60: 'rgba(255,255,255,0.6)',
  whiteAlpha40: 'rgba(255,255,255,0.4)',
  whiteAlpha15: 'rgba(255,255,255,0.12)',
  whiteAlpha20: 'rgba(255,255,255,0.18)',
};

export default function GetStartedScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.navyDark} />

      <ImageBackground source={require('@/assets/images/ParkOptimaBg.jpg')} style={styles.container} imageStyle={styles.backgroundImage} resizeMode="cover">
        <View style={styles.textBlock}>
          <Text style={styles.brandName}>ParkOptima</Text>
          <Text style={styles.brandTagline}>SMART PARKING MANAGEMENT{ '\n' }SYSTEM</Text>
        </View>

        <TouchableOpacity
          style={styles.getStartedBtn}
          activeOpacity={0.85}
          onPress={() => router.push('/modal_login')}
        >
          <Text style={styles.getStartedText}>Get Started</Text>
        </TouchableOpacity>
      </ImageBackground>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.navyDark,
  },
  container: {
    flex: 1,
    width: '100%',
    minHeight: '100%',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingTop: 56,
    paddingBottom: 48,
  },
  backgroundImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },

  textBlock: {
    alignItems: 'center',
    marginBottom: 32,
    width: '100%',
    maxWidth: 320,
  },

  brandName: {
    fontSize: 26,
    fontWeight: '800',
    color: COLORS.white,
    letterSpacing: 0.5,
    marginBottom: 10,
    marginTop: 300
  },
  brandTagline: {
    fontSize: 10,
    fontWeight: '600',
    color: COLORS.whiteAlpha60,
    letterSpacing: 1.5,
    textAlign: 'center',

  },

  getStartedBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.teal,
    borderRadius: 14,
    paddingVertical: 15,
    marginBottom: 600,
    width: 320,
    alignSelf: 'center',
  },
  getStartedText: {
    textAlign: 'center',
    color: COLORS.white,
    fontWeight: '700',
    fontSize: 16,
    letterSpacing: 0.3,
  },

  signInText: {
    fontSize: 12,
    color: COLORS.whiteAlpha60,
  },
  signInLink: {
    color: COLORS.teal,
    fontWeight: '700',
    textDecorationLine: 'underline',
  },
});