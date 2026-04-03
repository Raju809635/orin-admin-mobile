import React from "react";
import { Redirect } from "expo-router";
import { ActivityIndicator, View } from "react-native";
import { useAuth } from "@/context/AuthContext";
import { colors } from "@/constants/theme";

export default function IndexScreen() {
  const { isBootstrapping, isAuthenticated } = useAuth();

  if (isBootstrapping) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.bg, alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  return <Redirect href={isAuthenticated ? "/overview" : "/login"} />;
}
