import React, { useState } from "react";
import { Image, KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { Redirect } from "expo-router";
import { useAuth } from "@/context/AuthContext";
import { colors, radii, spacing } from "@/constants/theme";

export default function LoginScreen() {
  const { login, isAuthenticated, isBootstrapping } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  if (!isBootstrapping && isAuthenticated) {
    return <Redirect href="/overview" />;
  }

  async function onSubmit() {
    setLoading(true);
    setError("");
    try {
      await login(email, password);
    } catch (err: any) {
      setError(err?.message || "Login failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.wrap}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <View style={styles.card}>
        <Image source={require("../assets/images/orin-brand.png")} style={styles.logo} resizeMode="contain" />
        <Text style={styles.eyebrow}>ORIN ADMIN</Text>
        <Text style={styles.title}>Secure control for programs, payments, and approvals.</Text>
        <Text style={styles.subtitle}>Use your existing backend admin account credentials.</Text>

        <TextInput
          placeholder="admin@email.com"
          placeholderTextColor={colors.textMuted}
          style={styles.input}
          value={email}
          autoCapitalize="none"
          keyboardType="email-address"
          onChangeText={setEmail}
        />
        <TextInput
          placeholder="Password"
          placeholderTextColor={colors.textMuted}
          style={styles.input}
          value={password}
          secureTextEntry
          onChangeText={setPassword}
        />

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <Pressable style={[styles.button, loading ? styles.buttonDisabled : null]} onPress={onSubmit} disabled={loading}>
          <Text style={styles.buttonText}>{loading ? "Signing in..." : "Sign In"}</Text>
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flex: 1,
    backgroundColor: colors.bg,
    padding: spacing.lg,
    justifyContent: "center"
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: radii.xl,
    padding: spacing.xl,
    borderWidth: 1,
    borderColor: colors.border
  },
  logo: {
    width: 68,
    height: 68,
    marginBottom: spacing.lg
  },
  eyebrow: {
    color: colors.primary,
    fontWeight: "800",
    letterSpacing: 1.1,
    marginBottom: spacing.sm
  },
  title: {
    color: colors.text,
    fontSize: 28,
    fontWeight: "800",
    lineHeight: 34
  },
  subtitle: {
    color: colors.textMuted,
    marginTop: spacing.sm,
    marginBottom: spacing.xl,
    lineHeight: 22
  },
  input: {
    backgroundColor: colors.bgSoft,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    color: colors.text,
    paddingHorizontal: spacing.md,
    paddingVertical: 14,
    marginBottom: spacing.md
  },
  error: {
    color: colors.danger,
    marginBottom: spacing.md
  },
  button: {
    backgroundColor: colors.primaryDeep,
    borderRadius: radii.md,
    paddingVertical: 15,
    alignItems: "center"
  },
  buttonDisabled: {
    opacity: 0.7
  },
  buttonText: {
    color: colors.white,
    fontWeight: "800",
    fontSize: 16
  }
});
