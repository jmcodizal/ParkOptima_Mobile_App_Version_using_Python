import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/theme';
import { getApiBaseUrl } from '@/lib/api';

const C = {
  navy: '#1E3A8A',
  white: Colors.light.background,
  textPrimary: Colors.light.text,
  textSecondary: '#6B7A8D',
  red: '#EF4444',
  amber: '#F59E0B',
  blue: '#3B82F6',
  green: '#10B981',
};

interface NotificationBadgeProps {
  ownerId: number;
  onPress: () => void;
}

export const NotificationBadge: React.FC<NotificationBadgeProps> = ({ ownerId, onPress }) => {
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, [ownerId]);

  const fetchUnreadCount = async () => {
    try {
      const baseUrl = getApiBaseUrl();
      const response = await fetch(`${baseUrl}/api/notifications/unread-count/${ownerId}`);
      const data = await response.json();
      setUnreadCount(data.unread_count || 0);
    } catch (error) {
      console.error('Error fetching unread count:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <TouchableOpacity style={styles.badge} onPress={onPress}>
        <ActivityIndicator size="small" color={C.blue} />
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity style={styles.badge} onPress={onPress}>
      <Ionicons name="notifications-outline" size={24} color={C.navy} />
      {unreadCount > 0 && (
        <View style={styles.badgeCount}>
          <Text style={styles.badgeCountText}>
            {unreadCount > 9 ? '9+' : unreadCount}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  badge: {
    width: 44,
    height: 44,
    borderRadius: 8,
    backgroundColor: C.white,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  badgeCount: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: C.red,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: C.white,
  },
  badgeCountText: {
    color: C.white,
    fontSize: 10,
    fontWeight: 'bold',
  },
});
