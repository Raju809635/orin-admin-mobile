import AsyncStorage from "@react-native-async-storage/async-storage";
import { AuthUser } from "./types";

const TOKEN_KEY = "orin_admin_mobile_token";
const REFRESH_TOKEN_KEY = "orin_admin_mobile_refresh_token";
const USER_KEY = "orin_admin_mobile_user";

export async function saveSession(token: string, refreshToken: string, user: AuthUser) {
  await AsyncStorage.multiSet([
    [TOKEN_KEY, token],
    [REFRESH_TOKEN_KEY, refreshToken],
    [USER_KEY, JSON.stringify(user)]
  ]);
}

export async function clearSessionStorage() {
  await AsyncStorage.multiRemove([TOKEN_KEY, REFRESH_TOKEN_KEY, USER_KEY]);
}

export async function getStoredSession() {
  const [token, refreshToken, userRaw] = await AsyncStorage.multiGet([TOKEN_KEY, REFRESH_TOKEN_KEY, USER_KEY]);
  const user = userRaw[1] ? (JSON.parse(userRaw[1]) as AuthUser) : null;
  return {
    token: token[1] || null,
    refreshToken: refreshToken[1] || null,
    user
  };
}

export async function setStoredToken(token: string) {
  await AsyncStorage.setItem(TOKEN_KEY, token);
}
