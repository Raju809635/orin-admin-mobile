import React from "react";
import { Redirect, Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "@/context/AuthContext";
import { colors } from "@/constants/theme";
import { LoadingState } from "@/components/ui";

export default function AppLayout() {
  const { isAuthenticated, isBootstrapping } = useAuth();

  if (isBootstrapping) {
    return <LoadingState label="Preparing admin workspace..." />;
  }

  if (!isAuthenticated) {
    return <Redirect href="/login" />;
  }

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: colors.bgSoft,
          borderTopColor: colors.border,
          height: 74,
          paddingBottom: 10,
          paddingTop: 10
        },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted
      }}
    >
      <Tabs.Screen
        name="overview"
        options={{
          title: "Overview",
          tabBarIcon: ({ color, size }) => <Ionicons name="grid" color={color} size={size} />
        }}
      />
      <Tabs.Screen
        name="operations"
        options={{
          title: "Operations",
          tabBarIcon: ({ color, size }) => <Ionicons name="flash" color={color} size={size} />
        }}
      />
      <Tabs.Screen
        name="mentorship"
        options={{
          title: "Mentorship",
          tabBarIcon: ({ color, size }) => <Ionicons name="school" color={color} size={size} />
        }}
      />
      <Tabs.Screen
        name="community"
        options={{
          title: "Community",
          tabBarIcon: ({ color, size }) => <Ionicons name="people" color={color} size={size} />
        }}
      />
      <Tabs.Screen
        name="more"
        options={{
          title: "More",
          tabBarIcon: ({ color, size }) => <Ionicons name="menu" color={color} size={size} />
        }}
      />
      <Tabs.Screen
        name="payments"
        options={{
          href: null
        }}
      />
      <Tabs.Screen
        name="programs"
        options={{
          href: null
        }}
      />
      <Tabs.Screen
        name="students"
        options={{
          href: null
        }}
      />
      <Tabs.Screen
        name="platform"
        options={{
          href: null
        }}
      />
      <Tabs.Screen
        name="network"
        options={{
          href: null
        }}
      />
    </Tabs>
  );
}
