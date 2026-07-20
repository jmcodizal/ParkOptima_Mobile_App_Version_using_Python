import axios, { AxiosError, AxiosRequestConfig } from 'axios';
import { Platform } from 'react-native';
import Constants from 'expo-constants';

const api = axios.create({
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

const getExpoHostFromConstants = (): string | null => {
  const manifest = Constants.manifest || Constants.expoConfig || Constants.manifest2 || {};
  const debuggerHost = typeof manifest.debuggerHost === 'string' ? manifest.debuggerHost : null;
  const hostUri = typeof manifest.hostUri === 'string' ? manifest.hostUri : null;

  const resolveHost = (raw: string | null) => {
    if (!raw) {
      return null;
    }

    const hostString = raw.replace(/^https?:\/\//, '').replace(/^exp:\/\//, '').split(/[\s,;]+/)[0];
    const host = hostString.split(':')[0];

    if (!host || host === 'localhost' || host === '127.0.0.1') {
      return null;
    }
    if (host.endsWith('.exp.direct') || host.endsWith('.expo.dev') || host === 'exp.host') {
      return null;
    }
    return host;
  };

  const resolvedDebuggerHost = resolveHost(debuggerHost);
  if (resolvedDebuggerHost) {
    return resolvedDebuggerHost;
  }

  return resolveHost(hostUri);
};

const DEFAULT_API_BASE = (() => {
  if (Platform.OS === 'web') {
    return 'http://localhost:8000';
  }

  const expoHost = getExpoHostFromConstants();
  if (expoHost) {
    return `http://${expoHost}:8000`;
  }

  return Platform.OS === 'android' ? 'http://10.0.2.2:8001' : 'http://localhost:8001';
})();

const isExpoTunnelHost = (value: string) => {
  const host = value.replace(/^https?:\/\//, '').replace(/^exp:\/\//, '').split(':')[0];
  return host.endsWith('.exp.direct') || host.endsWith('.expo.dev') || host === 'exp.host';
};

export function getApiBaseUrl() {
  const envBase = process.env.EXPO_PUBLIC_API_BASE_URL || process.env.API_BASE_URL;
  if (envBase && !isExpoTunnelHost(envBase)) {
    return envBase.replace(/\/$/, '');
  }

  if (envBase) {
    console.warn('[apiRequest] ignoring Expo tunnel env base', envBase);
  }

  return DEFAULT_API_BASE.replace(/\/$/, '');
}

export async function apiRequest<T>(path: string, init: RequestInit = {}): Promise<T> {
  const url = `${getApiBaseUrl()}${path}`;
  const config: AxiosRequestConfig = {
    url,
    method: (init.method || 'GET').toUpperCase() as AxiosRequestConfig['method'],
    headers: {
      ...(init.headers as Record<string, string> | undefined),
    },
  };

  if (init.body !== undefined) {
    config.data = init.body;
  }

  try {
    const response = await api.request<T>(config);
    return response.data as T;
  } catch (error) {
    const axiosError = error as AxiosError<any>;
    const detail = axiosError.response?.data?.detail || axiosError.response?.data?.message || axiosError.message || 'Request failed';
    console.error('[apiRequest] network error', url, detail);
    throw new Error(typeof detail === 'string' ? detail : 'Request failed');
  }
}
