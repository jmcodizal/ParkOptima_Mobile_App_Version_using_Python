import AsyncStorage from '@react-native-async-storage/async-storage';

export async function loadRememberedCredentials<T>(key: string): Promise<T | null> {
  try {
    const raw = await AsyncStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch (error) {
    console.warn('[remember-me] failed to load', error);
    return null;
  }
}

export async function saveRememberedCredentials<T>(key: string, value: T): Promise<void> {
  try {
    await AsyncStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.warn('[remember-me] failed to save', error);
  }
}

export async function clearRememberedCredentials(key: string): Promise<void> {
  try {
    await AsyncStorage.removeItem(key);
  } catch (error) {
    console.warn('[remember-me] failed to clear', error);
  }
}
