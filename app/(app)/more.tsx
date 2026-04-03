import React, { useEffect, useState } from "react";
import { Alert, StyleSheet, Text, TextInput, View } from "react-native";
import { ActionButton, Card, HeroCard, Label, LoadingState, Screen, SectionTitle, Value } from "@/components/ui";
import { colors, spacing } from "@/constants/theme";
import { useAuth } from "@/context/AuthContext";
import { apiBaseUrl, apiRequest } from "@/lib/api";
import { AdminNotificationRecord } from "@/lib/types";

export default function MoreScreen() {
  const { user, logout, token } = useAuth();
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState<AdminNotificationRecord[]>([]);
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function load() {
    if (!token) return;
    try {
      setLoading(true);
      setError("");
      const data = await apiRequest<AdminNotificationRecord[]>("/api/admin/notifications", {}, token);
      setNotifications(data);
    } catch (err: any) {
      setError(err?.message || "Failed to load notifications");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, [token]);

  async function sendBroadcast() {
    if (!token) return;
    if (!title.trim() || !message.trim()) {
      Alert.alert("Missing details", "Add both a title and message before sending.");
      return;
    }

    try {
      await apiRequest(
        "/api/admin/notifications",
        {
          method: "POST",
          body: JSON.stringify({
            title: title.trim(),
            message: message.trim(),
            type: "broadcast",
            targetRole: "all"
          })
        },
        token
      );
      setTitle("");
      setMessage("");
      await load();
      Alert.alert("Sent", "Broadcast notification sent successfully.");
    } catch (err: any) {
      Alert.alert("Send failed", err?.message || "Please try again.");
    }
  }

  if (loading && !notifications.length) {
    return <LoadingState label="Loading admin utilities..." />;
  }

  return (
    <Screen>
      <View style={{ height: spacing.lg }} />
      <HeroCard
        title="Admin Settings"
        subtitle="Mobile control should stay secure, simple, and transparent. This tab keeps identity and environment details close."
        rightLabel="Secure"
      />

      <SectionTitle title="Your access" subtitle="This app only works for backend users with admin access." />
      <Card>
        <View style={styles.profileRow}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{user?.name?.slice(0, 1)?.toUpperCase() || "A"}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.name}>{user?.name || "Admin"}</Text>
            <Text style={styles.email}>{user?.email || "No email"}</Text>
          </View>
        </View>
        <View style={styles.infoRow}>
          <View style={styles.infoCol}>
            <Label>Role</Label>
            <Value>{user?.role || "admin"}</Value>
          </View>
          <View style={styles.infoCol}>
            <Label>Category</Label>
            <Value muted>{user?.primaryCategory || "Control"}</Value>
          </View>
        </View>
      </Card>

      <SectionTitle title="Environment" subtitle="Useful when you are testing builds, APIs, and deployment state from mobile." />
      <Card>
        <Label>Backend URL</Label>
        <Value muted>{apiBaseUrl}</Value>
        <View style={{ height: spacing.md }} />
        <Label>App purpose</Label>
        <Value muted>Programs moderation, payments control, approvals, and operational visibility for ORIN.</Value>
      </Card>

      <SectionTitle title="Notifications" subtitle="Broadcast important updates without needing the web dashboard." />
      <Card>
        <TextInput
          value={title}
          onChangeText={setTitle}
          placeholder="Notification title"
          placeholderTextColor={colors.textMuted}
          style={styles.input}
        />
        <TextInput
          value={message}
          onChangeText={setMessage}
          placeholder="Broadcast message"
          placeholderTextColor={colors.textMuted}
          style={[styles.input, styles.multiInput]}
          multiline
        />
        <ActionButton label="Send Broadcast" tone="primary" onPress={sendBroadcast} />
      </Card>

      {error ? (
        <Card>
          <Text style={styles.errorText}>{error}</Text>
          <ActionButton label="Retry" tone="warning" onPress={load} />
        </Card>
      ) : null}

      <SectionTitle title="Recent notifications" subtitle="The last admin messages sent across ORIN." />
      {notifications.slice(0, 10).map((item) => (
        <Card key={item._id}>
          <Text style={styles.notificationTitle}>{item.title}</Text>
          <Text style={styles.notificationMeta}>
            {item.targetRole || "all"} | {new Date(item.createdAt).toLocaleString()}
          </Text>
          <Text style={styles.notificationBody}>{item.message}</Text>
        </Card>
      ))}

      <SectionTitle title="Security" subtitle="Keep the admin device trusted and logged out when you hand it off." />
      <Card>
        <ActionButton label="Logout" tone="danger" onPress={logout} />
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  profileRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    marginBottom: spacing.md
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "rgba(73,209,141,0.14)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(73,209,141,0.35)"
  },
  avatarText: {
    color: colors.primary,
    fontSize: 22,
    fontWeight: "800"
  },
  name: {
    color: colors.text,
    fontSize: 20,
    fontWeight: "800"
  },
  email: {
    color: colors.textMuted,
    marginTop: 4
  },
  infoRow: {
    flexDirection: "row",
    gap: spacing.md
  },
  infoCol: {
    flex: 1
  },
  input: {
    backgroundColor: colors.cardAlt,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: colors.text,
    marginBottom: spacing.md
  },
  multiInput: {
    minHeight: 90,
    textAlignVertical: "top"
  },
  notificationTitle: {
    color: colors.text,
    fontSize: 17,
    fontWeight: "800",
    marginBottom: 6
  },
  notificationMeta: {
    color: colors.textMuted,
    marginBottom: spacing.sm
  },
  notificationBody: {
    color: colors.text,
    lineHeight: 21
  },
  errorText: {
    color: colors.danger,
    fontWeight: "700",
    marginBottom: spacing.sm
  }
});
