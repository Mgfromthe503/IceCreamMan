import { ActivityIndicator, Alert, KeyboardAvoidingView, Platform, Pressable, Text, View } from "react-native";
import { useState } from "react";
import { LinearGradient } from "expo-linear-gradient";
import { ScreenContainer } from "@/components/screen-container";
import { API_BASE_URL, OAUTH_PORTAL_URL, startOAuthLogin } from "@/constants/oauth";

export default function LoginScreen() {
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async () => {
    if (!OAUTH_PORTAL_URL || !API_BASE_URL) {
      Alert.alert(
        "Sign-in is unavailable",
        "This release is missing its secure sign-in configuration. Please contact support or try again after the app has been configured.",
      );
      return;
    }

    setIsLoading(true);
    try {
      await startOAuthLogin();
    } catch (error) {
      console.error("[Auth] Failed to start OAuth login", error);
      Alert.alert("Sign-in failed", "Unable to open secure sign-in. Please try again.");
      setIsLoading(false);
    }
  };

  return (
    <View style={{ flex: 1 }}>
      <LinearGradient
        colors={["#FFF8DC", "#FFE4E1", "#FFB6D9", "#FF69B4"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{ flex: 1 }}
      >
        <ScreenContainer className="p-6" containerClassName="bg-transparent">
          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            style={{ flex: 1, justifyContent: "center" }}
          >
            <View style={{ gap: 24 }}>
              <View style={{ alignItems: "center", gap: 8 }}>
                <Text style={{ fontSize: 48 }}>🍦</Text>
                <Text style={{ fontSize: 28, fontWeight: "800", color: "#8B4513" }}>
                  The Ice Cream Man
                </Text>
                <Text style={{ fontSize: 14, color: "#A0522D", textAlign: "center" }}>
                  Sign in securely to request or serve ice cream.
                </Text>
              </View>

              <View
                style={{
                  gap: 16,
                  backgroundColor: "rgba(255,255,255,0.9)",
                  borderRadius: 20,
                  padding: 24,
                }}
              >
                <Text style={{ color: "#555", fontSize: 14, lineHeight: 20, textAlign: "center" }}>
                  Your identity is verified by the secure sign-in provider. The app never stores a password or treats a device-only role as permission to access vendor features.
                </Text>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Sign in securely"
                  onPress={handleLogin}
                  disabled={isLoading}
                  style={({ pressed }) => [
                    {
                      backgroundColor: "#FF69B4",
                      paddingVertical: 16,
                      borderRadius: 14,
                      alignItems: "center",
                      opacity: pressed ? 0.9 : isLoading ? 0.6 : 1,
                    },
                  ]}
                >
                  {isLoading ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text style={{ color: "#fff", fontSize: 17, fontWeight: "700" }}>
                      Continue to secure sign-in
                    </Text>
                  )}
                </Pressable>
              </View>
            </View>
          </KeyboardAvoidingView>
        </ScreenContainer>
      </LinearGradient>
    </View>
  );
}
