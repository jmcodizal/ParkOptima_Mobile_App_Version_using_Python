import { Alert } from 'react-native';

export function notifySuccess(
  message: string,
  title = 'Success',
  buttons?: Array<{ text: string; onPress?: () => void; style?: 'default' | 'cancel' | 'destructive' }>,
) {
  Alert.alert(title, message, buttons);
}

export function notifyError(
  message: string,
  title = 'Error',
  buttons?: Array<{ text: string; onPress?: () => void; style?: 'default' | 'cancel' | 'destructive' }>,
) {
  Alert.alert(title, message, buttons);
}

export function notifyInfo(
  message: string,
  title = 'Info',
  buttons?: Array<{ text: string; onPress?: () => void; style?: 'default' | 'cancel' | 'destructive' }>,
) {
  Alert.alert(title, message, buttons);
}

export function confirmAction(
  message: string,
  onConfirm: () => void,
  title = 'Confirm',
  confirmText = 'OK',
  cancelText = 'Cancel'
) {
  Alert.alert(title, message, [
    { text: cancelText, style: 'cancel' },
    { text: confirmText, onPress: onConfirm },
  ]);
}

export function confirmLogout(onConfirm: () => void) {
  Alert.alert('Logout', 'Are you sure you want to logout?', [
    { text: 'Cancel', style: 'cancel' },
    { text: 'Logout', style: 'destructive', onPress: onConfirm },
  ]);
}
