import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/theme';
import { getApiBaseUrl } from '@/lib/api';

const C = {
  navy: '#1E3A8A',
  white: Colors.light.background,
  surface: '#F4F6F9',
  border: '#E4E7EC',
  textPrimary: Colors.light.text,
  textSecondary: '#6B7A8D',
  textMuted: '#9AA5B8',
  red: '#EF4444',
  redLight: '#FEE2E2',
  amber: '#F59E0B',
  amberLight: '#FEF3E2',
  blue: '#3B82F6',
  blueLight: '#EFF6FF',
  green: '#10B981',
  greenLight: '#DCFCE9',
};

interface Notification {
  id: number;
  notification_type: string;
  title: string;
  message: string;
  severity: 'info' | 'warning' | 'critical';
  is_read: boolean;
  created_at: string;
}

interface NotificationCenterProps {
  ownerId: number;
  focusedNotificationId?: number | null;
  onRefresh?: () => void;
}

export const NotificationCenter: React.FC<NotificationCenterProps> = ({
  ownerId,
  focusedNotificationId = null,
  onRefresh,
}) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const listRef = useRef<FlatList<Notification> | null>(null);

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, [ownerId]);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const baseUrl = getApiBaseUrl();
      const response = await fetch(
        `${baseUrl}/api/notifications?owner_id=${ownerId}&limit=20`
      );
      const data = await response.json();
      setNotifications(data.notifications || []);
      setUnreadCount(data.unread_count || 0);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchNotifications();
    setRefreshing(false);
    onRefresh?.();
  };

  const markAsRead = async (notificationId: number) => {
    try {
      const baseUrl = getApiBaseUrl();
      await fetch(`${baseUrl}/api/notifications/${notificationId}/read`, {
        method: 'POST',
      });
      fetchNotifications();
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      const baseUrl = getApiBaseUrl();
      await fetch(`${baseUrl}/api/notifications/mark-all-read?owner_id=${ownerId}`, {
        method: 'POST',
      });
      fetchNotifications();
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  };

  const deleteNotification = async (notificationId: number) => {
    try {
      const baseUrl = getApiBaseUrl();
      await fetch(`${baseUrl}/api/notifications/${notificationId}`, {
        method: 'DELETE',
      });
      fetchNotifications();
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  };

  useEffect(() => {
    if (!loading && focusedNotificationId && notifications.length > 0 && listRef.current) {
      const index = notifications.findIndex((notification) => notification.id === focusedNotificationId);
      if (index >= 0) {
        listRef.current.scrollToIndex({ index, animated: true });
      }
    }
  }, [loading, focusedNotificationId, notifications]);

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return { bg: C.redLight, border: C.red, icon: C.red };
      case 'warning':
        return { bg: C.amberLight, border: C.amber, icon: C.amber };
      case 'info':
      default:
        return { bg: C.blueLight, border: C.blue, icon: C.blue };
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'alert-circle';
      case 'warning':
        return 'warning';
      case 'info':
      default:
        return 'information-circle';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;

    return date.toLocaleDateString();
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color={C.blue} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Notifications</Text>
        {unreadCount > 0 && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{unreadCount}</Text>
          </View>
        )}
      </View>

      {/* Mark All as Read Button */}
      {unreadCount > 0 && (
        <TouchableOpacity style={styles.markAllButton} onPress={markAllAsRead}>
          <Text style={styles.markAllButtonText}>Mark all as read</Text>
        </TouchableOpacity>
      )}

      {/* Notifications List */}
      {notifications.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="notifications-off-outline" size={48} color={C.textSecondary} />
          <Text style={styles.emptyText}>No notifications</Text>
        </View>
      ) : (
        <FlatList
          ref={listRef}
          data={notifications}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item }) => {
            const colors = getSeverityColor(item.severity);
            const isFocused = focusedNotificationId === item.id;
            return (
              <TouchableOpacity
                style={[
                  styles.notificationItem,
                  { borderLeftColor: colors.border },
                  !item.is_read && { backgroundColor: C.surface },
                  isFocused && styles.focusedNotification,
                ]}
                onPress={() => !item.is_read && markAsRead(item.id)}
              >
                <View style={[styles.iconContainer, { backgroundColor: colors.bg }]}>
                  <Ionicons
                    name={getSeverityIcon(item.severity) as any}
                    size={24}
                    color={colors.icon}
                  />
                </View>

                <View style={styles.contentContainer}>
                  <View style={styles.titleRow}>
                    <Text style={styles.title}>{item.title}</Text>
                    {!item.is_read && <View style={styles.unreadDot} />}
                  </View>
                  <Text style={styles.message} numberOfLines={2}>
                    {item.message}
                  </Text>
                  <Text style={styles.timestamp}>{formatDate(item.created_at)}</Text>
                </View>

                <TouchableOpacity
                  style={styles.deleteButton}
                  onPress={() => deleteNotification(item.id)}
                >
                  <Ionicons name="trash-outline" size={20} color={C.textSecondary} />
                </TouchableOpacity>
              </TouchableOpacity>
            );
          }}
          scrollEnabled={true}
          onRefresh={handleRefresh}
          refreshing={refreshing}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: C.white,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: C.textPrimary,
  },
  badge: {
    backgroundColor: C.red,
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    minWidth: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeText: {
    color: C.white,
    fontSize: 12,
    fontWeight: '600',
  },
  markAllButton: {
    marginHorizontal: 16,
    marginVertical: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: C.blueLight,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  markAllButtonText: {
    color: C.blue,
    fontSize: 12,
    fontWeight: '500',
  },
  notificationItem: {
    flexDirection: 'row',
    padding: 12,
    marginHorizontal: 8,
    marginVertical: 4,
    borderRadius: 8,
    borderLeftWidth: 4,
    backgroundColor: C.white,
    alignItems: 'flex-start',
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  contentContainer: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  title: {
    fontSize: 14,
    fontWeight: '600',
    color: C.textPrimary,
    flex: 1,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: C.blue,
    marginLeft: 8,
  },
  message: {
    fontSize: 12,
    color: C.textSecondary,
    lineHeight: 18,
    marginBottom: 4,
  },
  timestamp: {
    fontSize: 11,
    color: C.textMuted,
  },
  deleteButton: {
    padding: 8,
    marginLeft: 8,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: C.textSecondary,
    marginTop: 8,
  },
  focusedNotification: {
    backgroundColor: '#FEF3C7',
    borderLeftColor: C.amber,
  },
});
