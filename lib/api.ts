import Constants from "expo-constants";
import { Platform } from "react-native";
import { clearSessionStorage, getStoredSession, setStoredToken } from "./auth-storage";

function getApiBaseUrl() {
  const extraApiUrl = (Constants.expoConfig?.extra as any)?.apiBaseUrl as string | undefined;
  const explicitUrl = process.env.EXPO_PUBLIC_API_BASE_URL || extraApiUrl;
  const isDev = typeof __DEV__ !== "undefined" ? __DEV__ : process.env.NODE_ENV !== "production";

  if (explicitUrl) {
    return explicitUrl;
  }

  if (!isDev) {
    return "https://orin-backend.onrender.com";
  }

  if (Platform.OS === "android") {
    return "http://10.0.2.2:5000";
  }

  const hostUri = Constants.expoConfig?.hostUri;
  const host = hostUri?.split(":")[0];
  return host ? `http://${host}:5000` : "http://localhost:5000";
}

export const apiBaseUrl = getApiBaseUrl();

let refreshInFlight: Promise<string | null> | null = null;

async function refreshAccessToken(): Promise<string | null> {
  if (!refreshInFlight) {
    refreshInFlight = (async () => {
      const { refreshToken } = await getStoredSession();
      if (!refreshToken) return null;

      const response = await fetch(`${apiBaseUrl}/api/auth/refresh`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refreshToken })
      });

      if (!response.ok) {
        await clearSessionStorage();
        return null;
      }

      const data = await response.json();
      if (!data?.token) {
        await clearSessionStorage();
        return null;
      }

      await setStoredToken(data.token);
      return data.token as string;
    })().finally(() => {
      refreshInFlight = null;
    });
  }

  return refreshInFlight;
}

export async function apiRequest<T>(
  path: string,
  options: RequestInit = {},
  explicitToken?: string | null
): Promise<T> {
  const headers = new Headers(options.headers);
  headers.set("Content-Type", "application/json");

  const { token: storedToken } = await getStoredSession();
  const token = explicitToken || storedToken;
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  let response = await fetch(`${apiBaseUrl}${path}`, {
    ...options,
    headers
  });

  const shouldRefresh =
    response.status === 401 &&
    path !== "/api/auth/login" &&
    path !== "/api/auth/refresh";

  if (shouldRefresh) {
    const nextToken = await refreshAccessToken();
    if (nextToken) {
      headers.set("Authorization", `Bearer ${nextToken}`);
      response = await fetch(`${apiBaseUrl}${path}`, {
        ...options,
        headers
      });
    }
  }

  let payload: any = null;
  try {
    payload = await response.json();
  } catch {
    payload = null;
  }

  if (!response.ok) {
    throw new Error(payload?.message || `Request failed (${response.status})`);
  }

  return payload as T;
}
