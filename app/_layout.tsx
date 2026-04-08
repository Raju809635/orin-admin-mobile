import "react-native-gesture-handler";
import React, { useEffect, useState } from "react";
import { Stack } from "expo-router";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { AuthProvider } from "@/context/AuthContext";
import { colors } from "@/constants/theme";
import { ActivityIndicator, Image, Pressable, StyleSheet, Text, View } from "react-native";
import { pingBackendReady } from "@/lib/api";

function BackendGate({ children }: { children: React.ReactNode }) {
  const [isChecking, setIsChecking] = useState(true);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    let active = true;

    async function checkBackend() {
      setIsChecking(true);
      try {
        for (let attempt = 0; attempt < 3; attempt += 1) {
          const ready = await pingBackendReady();
          if (!active) return;
          if (ready) {
            setIsReady(true);
            setIsChecking(false);
            return;
          }

          if (attempt < 2) {
            await new Promise((resolve) => setTimeout(resolve, 1500 * (attempt + 1)));
          }
        }
      } catch {}

      if (active) {
        setIsReady(false);
        setIsChecking(false);
      }
    }

    checkBackend();
    return () => {
      active = false;
    };
  }, []);

  if (isChecking || !isReady) {
    return (
      <View style={styles.wakeupWrap}>
        <Image source={require("../assets/images/orin-brand.png")} style={styles.wakeupLogo} resizeMode="contain" />
        <Text style={styles.wakeupTitle}>ORIN</Text>
        <Text style={styles.wakeupSubtitle}>
          {isChecking ? "Preparing ORIN Admin..." : "ORIN is waking up. Tap retry in a moment."}
        </Text>
        {isChecking ? (
          <ActivityIndicator size="small" color={colors.primaryDeep} />
        ) : (
          <Pressable
            style={styles.retryButton}
            onPress={async () => {
              setIsChecking(true);
              try {
                const ready = await pingBackendReady();
                setIsReady(Boolean(ready));
              } catch {
                setIsReady(false);
              } finally {
                setIsChecking(false);
              }
            }}
          >
            <Text style={styles.retryButtonText}>Retry Connection</Text>
          </Pressable>
        )}
      </View>
    );
  }

  return <>{children}</>;
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <BackendGate>
        <AuthProvider>
          <StatusBar style="light" />
          <Stack
            screenOptions={{
              headerShown: false,
              contentStyle: { backgroundColor: colors.bg }
            }}
          >
            <Stack.Screen name="index" />
            <Stack.Screen name="login" />
            <Stack.Screen name="(app)" />
          </Stack>
        </AuthProvider>
      </BackendGate>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  wakeupWrap: {
    flex: 1,
    backgroundColor: "#F6FAF8",
    alignItems: "center",
    justifyContent: "center",
    padding: 24
  },
  wakeupLogo: {
    width: 160,
    height: 160,
    marginBottom: 18
  },
  wakeupTitle: {
    color: "#17241D",
    fontSize: 32,
    fontWeight: "900",
    marginBottom: 10
  },
  wakeupSubtitle: {
    color: "#667085",
    fontSize: 16,
    lineHeight: 26,
    textAlign: "center",
    marginBottom: 22
  },
  retryButton: {
    backgroundColor: colors.primaryDeep,
    borderRadius: 18,
    paddingHorizontal: 28,
    paddingVertical: 16
  },
  retryButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: "800"
  }
});
