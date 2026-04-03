import "react-native-gesture-handler";
import React from "react";
import { Stack } from "expo-router";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { AuthProvider } from "@/context/AuthContext";
import { colors } from "@/constants/theme";

export default function RootLayout() {
  return (
    <SafeAreaProvider>
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
    </SafeAreaProvider>
  );
}
