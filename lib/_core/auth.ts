import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";
import { SESSION_TOKEN_KEY, USER_INFO_KEY } from "@/constants/oauth";

export type User = {
  id: number;
  openId: string;
  name: string | null;
  email: string | null;
  loginMethod: string | null;
  lastSignedIn: Date;
};

/**
 * Native session credentials are persisted only in the platform secure store.
 * Web sessions are cookie-based and must not be mirrored into browser storage.
 */
export async function getSessionToken(): Promise<string | null> {
  if (Platform.OS === "web") return null;

  try {
    return await SecureStore.getItemAsync(SESSION_TOKEN_KEY);
  } catch (error) {
    console.error("[Auth] Failed to read the native session credential", error);
    return null;
  }
}

export async function setSessionToken(token: string): Promise<void> {
  if (Platform.OS === "web") return;

  try {
    await SecureStore.setItemAsync(SESSION_TOKEN_KEY, token);
  } catch (error) {
    console.error("[Auth] Failed to store the native session credential", error);
    throw error;
  }
}

export async function removeSessionToken(): Promise<void> {
  if (Platform.OS === "web") return;

  try {
    await SecureStore.deleteItemAsync(SESSION_TOKEN_KEY);
  } catch (error) {
    console.error("[Auth] Failed to clear the native session credential", error);
  }
}

export async function getUserInfo(): Promise<User | null> {
  if (Platform.OS === "web") return null;

  try {
    const info = await SecureStore.getItemAsync(USER_INFO_KEY);
    return info ? (JSON.parse(info) as User) : null;
  } catch (error) {
    console.error("[Auth] Failed to read the native user profile", error);
    return null;
  }
}

export async function setUserInfo(user: User): Promise<void> {
  if (Platform.OS === "web") return;

  try {
    await SecureStore.setItemAsync(USER_INFO_KEY, JSON.stringify(user));
  } catch (error) {
    console.error("[Auth] Failed to store the native user profile", error);
  }
}

export async function clearUserInfo(): Promise<void> {
  if (Platform.OS === "web") return;

  try {
    await SecureStore.deleteItemAsync(USER_INFO_KEY);
  } catch (error) {
    console.error("[Auth] Failed to clear the native user profile", error);
  }
}
