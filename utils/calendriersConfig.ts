import Constants from 'expo-constants';
import { Platform } from 'react-native';

export function serveurCalendriers() {
  if (process.env.EXPO_PUBLIC_CALENDRIERS_API_URL) return process.env.EXPO_PUBLIC_CALENDRIERS_API_URL;
  const host = Platform.OS === 'web' && typeof window !== 'undefined' ? window.location.hostname
    : Constants.expoConfig?.hostUri?.split(':')[0] || (Platform.OS === 'android' ? '10.0.2.2' : 'localhost');
  return `http://${host}:8082/api`;
}
