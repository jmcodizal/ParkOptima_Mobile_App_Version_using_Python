import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, StatusBar, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '@/constants/theme';
import { useRouter, usePathname } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';

const C = {
  navy: '#1E3A8A',
  white: Colors.light.background,
  amber: '#F59E0B',
  teal: '#14B8A6',
  tealSoft: '#E6FBF6',
  textMuted: '#8A93A6',
  red: '#EF4444',
};

import { useEffect } from 'react';
import { apiRequest } from '@/lib/api';
import { useAuth } from '@/lib/auth';

export default function TopBar({ role = 'Attendant' }: { role?: string }) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const { userId, role: authRole, signOut } = useAuth();

  const [displayName, setDisplayName] = useState('ParkOptima');
  useEffect(() => {
    let isMounted = true;
    const load = async () => {
      try {
        if (authRole === 'parking_owner') {
          const resp = await apiRequest<any>('/api/owner/profile');
          if (isMounted) setDisplayName(resp.full_name || 'Parking Owner');
        } else if (userId) {
          const resp = await apiRequest<any>(`/api/users/${userId}`);
          if (isMounted) setDisplayName(((resp.first_name || '') + ' ' + (resp.last_name || '')).trim() || 'ParkOptima');
        }
      } catch (err) {
        console.warn('Failed to load profile for topbar', err);
      }
    };
    load();
    return () => { isMounted = false };
  }, [userId, authRole]);

  const handleLogout = async () => {
    await signOut();
    setDrawerOpen(false);
    router.push('/attendant_login');
  };

  const initials = displayName.split(' ').map(s => s[0]).join('').slice(0,2).toUpperCase();

  const menuItems = [
    { key: 'monitor', label: 'Monitor', icon: 'flash-outline' as const, route: '/attendant/monitor' },
    { key: 'payments', label: 'Payments', icon: 'card-outline' as const, route: '/attendant/payments' },
    { key: 'profile', label: 'Profile', icon: 'person-outline' as const, route: '/attendant/profile' },
  ];

  return (
    <SafeAreaView edges={["top"]} style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor={C.navy} />
      <View style={styles.navbar}>
         
        <View style={styles.navLeft}>
          <TouchableOpacity onPress={() => setDrawerOpen(true)} style={styles.hamburger}>
            <Ionicons name="menu" size={22} color={C.white} />
          </TouchableOpacity>
          <View style={styles.navLogoMark}>
            <Ionicons name="car-sport" size={18} color={C.white} />
          </View>
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
            <View style={styles.drawerHeader}>
              <View style={styles.avatarCircle}>
                <Ionicons name="person" size={22} color="#fff" />
              </View>
              <View style={styles.headerTextWrap}>
                <Text style={styles.ownerName}>{displayName}</Text>
                <Text style={styles.ownerRole}>{authRole === 'parking_owner' ? 'Parking Owner' : role}</Text>
              </View>
            </View>

            <View style={styles.brandRowInner}>
              <View style={styles.brandLogoMark}>
                <Ionicons name="car-sport" size={14} color={C.white} />
              </View>
              <Text style={styles.brandTextInner}>ParkOptima</Text>
            </View>

            <Text style={styles.sectionTitle}>MENU</Text>

            {menuItems.map((item) => {
              const isActive = pathname === item.route;
              return (
                <TouchableOpacity
                  key={item.key}
                  style={[styles.drawerItem, isActive && styles.drawerItemActive]}
                  onPress={() => { setDrawerOpen(false); router.push(item.route as any); }}
                >
                  {isActive && <View style={styles.activeBar} />}
                  <Ionicons
                    name={item.icon}
                    size={18}
                    color={isActive ? C.teal : C.navy}
                    style={{ marginRight: 10 }}
                  />
                  <Text style={[styles.drawerItemText, isActive && styles.drawerItemTextActive]}>
                    {item.label}
                  </Text>
                </TouchableOpacity>
              );
            })}

            <View style={{ flex: 1 }} />

            <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
              <Ionicons name="log-out-outline" size={18} color={C.red} style={{ marginRight: 8 }} />
              <Text style={styles.logoutText}>Log out</Text>
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
    width: 28,
    height: 28,
    borderRadius: 7,
    backgroundColor: 'transparent',
    alignItems: 'center', justifyContent: 'center',
    marginRight: 6,
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
    backgroundColor: 'transparent',
    borderWidth: 0,
    borderRadius: 6,
  },
  drawerOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-start',
  },
  drawerContainer: {
    width: 260,
    backgroundColor: '#fff',
    paddingTop: 0,
    paddingHorizontal: 0,
    paddingBottom: 24,
    height: '100%',
  },
  drawerTitle: { fontSize: 18, fontWeight: '700', marginBottom: 12 },
  drawerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
    paddingHorizontal: 16,
    paddingVertical: 20,
    backgroundColor: C.navy,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  avatarCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: C.teal,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { color: '#fff', fontWeight: '700' },
  headerTextWrap: { marginLeft: 12, flex: 1 },
  ownerName: { fontSize: 15, fontWeight: '700', color: '#fff' },
  ownerRole: { fontSize: 12, color: '#D9E8FF', marginTop: 2 },
  brandRowInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 14,
    marginBottom: 14,
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#EEF0F3',
  },
  brandLogoMark: {
    width: 22,
    height: 22,
    borderRadius: 6,
    backgroundColor: C.navy,
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandTextInner: { fontWeight: '800', color: C.navy, fontSize: 14 },
  sectionTitle: { color: C.textMuted, fontSize: 11, fontWeight: '700', letterSpacing: 0.6, marginBottom: 8, marginTop: 0, paddingHorizontal: 16 },
  drawerItem: {
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginHorizontal: 10,
    marginBottom: 4,
    borderRadius: 10,
  },
  drawerItemActive: {
    backgroundColor: C.tealSoft,
  },
  activeBar: {
    position: 'absolute',
    left: 0,
    top: 8,
    bottom: 8,
    width: 3,
    borderRadius: 2,
    backgroundColor: C.teal,
  },
  drawerItemText: { fontSize: 15, color: C.navy, fontWeight: '500' },
  drawerItemTextActive: { fontWeight: '700', color: C.navy },
  logoutBtn: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, borderTopWidth: 1, borderTopColor: '#EEE', marginTop: 12, paddingHorizontal: 16 },
  logoutText: { color: C.red, fontWeight: '600' },
});