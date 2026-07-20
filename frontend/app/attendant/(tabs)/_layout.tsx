import { Redirect, Tabs, useRouter } from 'expo-router';
import React, { useState } from 'react';
import { StyleSheet, Modal, View, Text, TouchableOpacity } from 'react-native';

import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useAuth } from '@/lib/auth';

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const { isAuthenticated } = useAuth();
  const router = useRouter();
  const [scanModalVisible, setScanModalVisible] = useState(false);

  if (!isAuthenticated) {
    return <Redirect href="/login" />;
  }

  return (
    <View style={styles.container}>
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarStyle: {
            display: 'none',
          },
        }}>
        <Tabs.Screen
          name="monitor"
          options={{
            title: 'Monitor',
            tabBarButton: () => null,
          }}
        />
        <Tabs.Screen
          name="payments"
          options={{
            title: 'Payments',
            tabBarButton: () => null,
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            title: 'Profile',
            tabBarButton: () => null,
          }}
        />
      </Tabs>

      <TouchableOpacity
        activeOpacity={0.8}
        onPress={() => setScanModalVisible(true)}
        style={styles.centerButton}
      >
        <IconSymbol size={28} name="camera" color="#ffffff" />
      </TouchableOpacity>

      <Modal
        visible={scanModalVisible}
        animationType="fade"
        transparent
        onRequestClose={() => setScanModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Choose scan type</Text>
            <View style={styles.modalButtonsRow}>
              <TouchableOpacity
                style={styles.modalButton}
                onPress={() => {
                  setScanModalVisible(false);
                  router.push('/attendant/scan');
                }}
              >
                <IconSymbol name="qrcode" size={28} color={Colors.light.tint} />
                <Text style={styles.modalButtonText}>Entry</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalButton}
                onPress={() => {
                  setScanModalVisible(false);
                  router.push('/attendant/scan-out');
                }}
              >
                <IconSymbol name="qrcode" size={28} color={Colors.light.tint} />
                <Text style={styles.modalButtonText}>Exit</Text>
              </TouchableOpacity>
            </View>
            <TouchableOpacity onPress={() => setScanModalVisible(false)} style={styles.modalClose}>
              <Text style={styles.modalCloseText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centerButton: {
    position: 'absolute',
    bottom: 18,
    left: '50%',
    transform: [{ translateX: -32 }],
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: Colors.light.tint,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 6,
    zIndex: 10,
    marginBottom: 20,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalContainer: {
    width: '100%',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 18,
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 12,
  },
  modalButtonsRow: {
    flexDirection: 'row',
    width: '100%',
    justifyContent: 'space-around',
    marginBottom: 12,
  },
  modalButton: {
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderRadius: 8,
    backgroundColor: '#fff',
    minWidth: 110,
  },
  modalButtonText: {
    marginTop: 8,
    fontWeight: '600',
    color: '#333',
  },
  modalClose: {
    marginTop: 6,
    paddingVertical: 8,
  },
  modalCloseText: {
    color: Colors.light.tabIconDefault,
    fontWeight: '600',
  },
});
