import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, Pressable, Text, View } from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { getApiBaseUrl } from "@/constants/oauth";
import { useAuth } from "@/lib/auth-context";
import { setSessionToken, type User } from "@/lib/_core/auth";

type OAuthExchangeResponse = {
  app_session_id?: unknown;
  user?: unknown;
};

function readString(value: string | string[] | undefined): string | null {
  return typeof value === "string" && value.length > 0 ? value : null;
}

function readUser(value: unknown): User | null {
  if (!value || typeof value !== "object") return null;
  const candidate = value as Partial<User>;
  if (typeof candidate.id !== "number" || typeof candidate.openId !== "string") return null;

  return {
    id: candidate.id,
    openId: candidate.openId,
    name: candidate.name ?? null,
    email: candidate.email ?? null,
    loginMethod: candidate.loginMethod ?? null,
    lastSignedIn: candidate.lastSignedIn ? new Date(candidate.lastSignedIn) : new Date(),
  };
}

export default function OAuthCallbackScreen() {
  const router = useRouter();
  const { completeOAuthLogin } = useAuth();
  const params = useLocalSearchParams<{ code?: string | string[]; state?: string | string[] }>();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    const exchangeCode = async () => {
      const code = readString(params.code);
      const state = readString(params.state);
      const apiBaseUrl = getApiBaseUrl();
      if (!code || !state || !apiBaseUrl) {
        throw new Error("The secure sign-in callback is incomplete or the API URL is not configured.");
      }

      const response = await fetch(
        `${apiBaseUrl}/api/oauth/mobile?code=${encodeURIComponent(code)}&state=${encodeURIComponent(state)}`,
        { credentials: "include" },
      );
      const payload = (await response.json()) as OAuthExchangeResponse;
      const sessionToken = typeof payload.app_session_id === "string" ? payload.app_session_id : null;
      const user = readUser(payload.user);
      if (!response.ok || !sessionToken || !user) {
        throw new Error("The secure sign-in provider did not return a valid session.");
      }

      await setSessionToken(sessionToken);
      await completeOAuthLogin(user);
      if (active) router.replace("/role-select");
    };

    exchangeCode().catch((cause: unknown) => {
      console.error("[Auth] OAuth callback failed", cause);
      if (active) {
        setError("We could not complete secure sign-in. Please return to the sign-in screen and try again.");
      }
    });

    return () => {
      active = false;
    };
  }, [completeOAuthLogin, params.code, params.state, router]);

  return (
    <ScreenContainer className="flex-1 items-center justify-center gap-5 p-6">
      {error ? (
        <>
          <Text className="text-center text-base text-red-700">{error}</Text>
          <Pressable
            accessibilityRole="button"
            onPress={() => router.replace("/login")}
            className="rounded-xl bg-pink-500 px-5 py-3"
          >
            <Text className="font-semibold text-white">Return to sign-in</Text>
          </Pressable>
        </>
      ) : (
        <View className="items-center gap-4">
          <ActivityIndicator size="large" color="#FF69B4" />
          <Text className="text-center text-base text-stone-700">Completing secure sign-in…</Text>
        </View>
      )}
    </ScreenContainer>
  );
}
