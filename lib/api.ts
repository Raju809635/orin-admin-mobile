import Constants from "expo-constants";
import { Platform } from "react-native";
import { clearSessionStorage, getStoredSession, setStoredSessionTokens } from "./auth-storage";

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
const RETRYABLE_STATUS = new Set([502, 503, 504, 521, 522, 523, 524]);

async function fetchWithRetry(url: string, options: RequestInit = {}, maxRetries = 2): Promise<Response> {
  let lastError: unknown = null;

  for (let attempt = 0; attempt <= maxRetries; attempt += 1) {
    try {
      const response = await fetch(url, options);
      if (!RETRYABLE_STATUS.has(response.status) || attempt === maxRetries) {
        return response;
      }
    } catch (error) {
      lastError = error;
      if (attempt === maxRetries) {
        throw error;
      }
    }

    await new Promise((resolve) => setTimeout(resolve, 1400 * (attempt + 1)));
  }

  throw lastError || new Error("Request failed");
}

async function refreshAccessToken(): Promise<string | null> {
  if (!refreshInFlight) {
    refreshInFlight = (async () => {
      const { refreshToken } = await getStoredSession();
      if (!refreshToken) return null;

      const response = await fetchWithRetry(`${apiBaseUrl}/api/auth/refresh`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refreshToken })
      });

      if (!response.ok) {
        if (response.status === 401) {
          await clearSessionStorage();
        }
        return null;
      }

      const data = await response.json();
      if (!data?.token) {
        await clearSessionStorage();
        return null;
      }

      await setStoredSessionTokens(data.token, data.refreshToken || refreshToken);
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

  let response = await fetchWithRetry(`${apiBaseUrl}${path}`, {
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
      response = await fetchWithRetry(`${apiBaseUrl}${path}`, {
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

export async function pingBackendReady() {
  const response = await fetchWithRetry(`${apiBaseUrl}/ready`, {
    method: "GET",
    headers: { Accept: "application/json" }
  });

  if (!response.ok) {
    return false;
  }

  try {
    const data = await response.json();
    return Boolean(data?.ready ?? data?.ok);
  } catch {
    return false;
  }
}
