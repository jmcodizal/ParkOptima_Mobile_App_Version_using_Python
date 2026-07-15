import React from 'react';
import { View, StyleSheet, TouchableOpacity, Platform, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from '@/components/themed-text';
import { useAuth } from '@/lib/auth';

export default function TopBar({ role = 'Attendant' }: { role?: string }) {
  const { signOut } = useAuth();

  return (
    <SafeAreaView edges={["top"]} style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor="#1D3D8A" />
      <View style={styles.container}>
        <View style={styles.left}>
          <Ionicons name="car" size={18} color="#ffffff" style={styles.icon} />
          <ThemedText style={styles.title} numberOfLines={1} ellipsizeMode="tail">
            ParkOptima
          </ThemedText>
        </View>

        <View style={styles.right}>
          <View style={styles.badge}>
            <ThemedText style={styles.badgeText}>{role}</ThemedText>
          </View>

          <TouchableOpacity onPress={() => signOut()} style={styles.logout} activeOpacity={0.75}>
            <Ionicons name="log-out-outline" size={18} color="#c8d5f7" />
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#1D3D8A',
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  left: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    minWidth: 0,
  },
  icon: { marginRight: 8 },
  title: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 16,
    marginLeft: 6,
    flexShrink: 1,
  },
  right: { flexDirection: 'row', alignItems: 'center' },
  badge: { backgroundColor: '#13B4AA', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12, marginRight: 10 },
  badgeText: { color: '#ffffff', fontSize: 12, fontWeight: '700' },
  logout: { padding: 6, borderRadius: 8 },
  safeArea: {
    backgroundColor: '#1D3D8A',
  },
});
