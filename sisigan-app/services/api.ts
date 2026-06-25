import { Platform } from 'react-native';
import Constants from 'expo-constants';

// API Configuration
// Update the backend host or IP address as needed.
// For Expo Go, the app can derive the host from the Expo manifest.
// Otherwise, use your machine's local network IP.
// Example: http://192.168.1.100:8000
// Find your IP with: ipconfig (Windows) or ifconfig (Mac/Linux)

// ⚠️ UPDATE THIS with your actual machine IP (run: ipconfig in terminal)
const DEFAULT_BACKEND_HOST = 'localhost';
const BACKEND_PORT = '8000';

const getExpoHost = () => {
  const hostUri =
    Constants.manifest2?.hostUri ??
    Constants.manifest?.hostUri ??
    Constants.expoConfig?.hostUri;

  const debuggerHost =
    Constants.manifest?.debuggerHost ??
    (typeof Constants.manifest2?.debuggerHost === 'string'
      ? Constants.manifest2.debuggerHost
      : undefined);

  const source = hostUri ?? debuggerHost;
  if (!source) return null;

  return source.split(':')[0];
};

const expoHost = getExpoHost();
const backendHost = expoHost ?? DEFAULT_BACKEND_HOST;

export const API_BASE_URL = `http://${backendHost}:${BACKEND_PORT}`;

export const API_ENDPOINTS = {
  // Inventory endpoints
  INVENTORY_LIST: '/api/inventory',
  INVENTORY_CREATE: '/api/inventory',
  INVENTORY_UPDATE: (id: number) => `/api/inventory/${id}`,
  INVENTORY_DELETE: (id: number) => `/api/inventory/${id}`,
  INVENTORY_LOW_STOCK: '/api/inventory/low-stock',

  // Orders endpoints
  ORDERS_LIST: '/api/orders',
  ORDERS_CREATE: '/api/orders',
  ORDERS_UPDATE: (id: number) => `/api/orders/${id}`,

  // Dashboard endpoints
  DASHBOARD_STATS: '/api/dashboard/stats',
};

export const apiClient = async (
  endpoint: string,
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' = 'GET',
  data?: any
) => {
  const url = `${API_BASE_URL}${endpoint}`;

  const options: RequestInit = {
    method,
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
  };

  if (data && (method === 'POST' || method === 'PUT')) {
    options.body = JSON.stringify(data);
  }

  try {
    console.log(`[API] ${method} ${url}`, data ? `\nData: ${JSON.stringify(data)}` : '');
    
    const response = await fetch(url, options);
    const responseData = await response.json();

    console.log(`[API] Response (${response.status}):`, responseData);

    if (!response.ok) {
      const errorMessage = responseData?.message || responseData?.error || `API Error: ${response.status}`;
      throw new Error(errorMessage);
    }

    return responseData;
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.error(`[API] Error on ${method} ${endpoint}:`, errorMsg);
    throw error;
  }
};
