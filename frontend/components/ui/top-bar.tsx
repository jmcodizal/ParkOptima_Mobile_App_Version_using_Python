import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, StatusBar, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/theme';
import { useRouter } from 'expo-router';

const C = {
  navy: '#1E3A8A',
  white: Colors.light.background,
  amber: '#F59E0B',
};

export default function TopBar({ role = 'Attendant' }: { role?: string }) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const router = useRouter();

  return (
    <SafeAreaView edges={["top"]} style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor={C.navy} />
      <View style={styles.navbar}>
        <View style={styles.navLeft}>
          <TouchableOpacity onPress={() => setDrawerOpen(true)} style={styles.hamburger}>
            <Ionicons name="menu" size={20} color={C.white} />
          </TouchableOpacity>
          <Text style={styles.navBrand}>ParkOptima</Text>
        </View>
        <TouchableOpacity style={styles.bellWrap}>
          <Text style={styles.bellIcon}>🔔</Text>
          <View style={styles.bellDot} />
        </TouchableOpacity>
      </View>

      <Modal visible={drawerOpen} animationType="slide" transparent onRequestClose={() => setDrawerOpen(false)}>
        <TouchableOpacity style={styles.drawerOverlay} onPress={() => setDrawerOpen(false)} activeOpacity={1}>
          <View style={styles.drawerContainer}>
            <Text style={styles.drawerTitle}>Menu</Text>
            <TouchableOpacity style={styles.drawerItem} onPress={() => { setDrawerOpen(false); router.push('/attendant/monitor'); }}>
              <Text style={styles.drawerItemText}>Monitor</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.drawerItem} onPress={() => { setDrawerOpen(false); router.push('/attendant/payments'); }}>
              <Text style={styles.drawerItemText}>Payments</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.drawerItem} onPress={() => { setDrawerOpen(false); router.push('/attendant/profile'); }}>
              <Text style={styles.drawerItemText}>Profile</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { backgroundColor: C.navy },

  // Navbar
  navbar: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: C.navy,
    paddingHorizontal: 16, paddingVertical: 10,
  },
  navLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  navLogoMark: {
    width: 24, height: 24, borderRadius: 7,
    backgroundColor: C.white,
    alignItems: 'center', justifyContent: 'center',
  },
  navBrand: { color: C.white, fontWeight: '700', fontSize: 16 },
  bellWrap: { position: 'relative', padding: 4 },
  bellIcon: { fontSize: 18 },
  bellDot: {
    position: 'absolute', top: 4, right: 4,
    width: 8, height: 8, borderRadius: 4,
    backgroundColor: C.amber,
    borderWidth: 1.5, borderColor: C.navy,
  },
  hamburger: {
    padding: 6,
    marginRight: 8,
  },
  drawerOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-start',
  },
  drawerContainer: {
    width: 260,
    backgroundColor: '#fff',
    paddingTop: 40,
    paddingHorizontal: 16,
    paddingBottom: 24,
    height: '100%',
    
  },
  drawerTitle: { fontSize: 18, fontWeight: '700', marginBottom: 12 },
  drawerItem: { paddingVertical: 12 },
  drawerItemText: { fontSize: 16 },
});

