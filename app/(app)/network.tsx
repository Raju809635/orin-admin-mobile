import React, { useEffect, useMemo, useState } from "react";
import { Alert, StyleSheet, Text, View } from "react-native";
import { ActionButton, Card, ChipTabs, EmptyState, HeroCard, Label, LoadingState, Screen, SectionTitle, StatGrid, Value } from "@/components/ui";
import { colors, spacing } from "@/constants/theme";
import { useAuth } from "@/context/AuthContext";
import { apiRequest } from "@/lib/api";
import { AdminConnectionRecord, AdminFollowRecord, AdminMentorGroupRecord, AuditLogResponse } from "@/lib/types";
import { AdminTopBar } from "@/components/admin-nav";

type NetworkTab = "connections" | "follows" | "groups" | "audit";

export default function NetworkScreen() {
  const { token } = useAuth();
  const [tab, setTab] = useState<NetworkTab>("connections");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [connections, setConnections] = useState<AdminConnectionRecord[]>([]);
  const [follows, setFollows] = useState<AdminFollowRecord[]>([]);
  const [groups, setGroups] = useState<AdminMentorGroupRecord[]>([]);
  const [audit, setAudit] = useState<AuditLogResponse | null>(null);

  async function load() {
    if (!token) return;
    try {
      setLoading(true);
      setError("");
      const [connectionData, followData, groupData, auditData] = await Promise.all([
        apiRequest<AdminConnectionRecord[]>("/api/admin/network/connections", {}, token),
        apiRequest<AdminFollowRecord[]>("/api/admin/network/follows", {}, token),
        apiRequest<AdminMentorGroupRecord[]>("/api/admin/network/mentor-groups", {}, token),
        apiRequest<AuditLogResponse>("/api/admin/audit-logs", {}, token)
      ]);
      setConnections(connectionData);
      setFollows(followData);
      setGroups(groupData);
      setAudit(auditData);
    } catch (err: any) {
      setError(err?.message || "Failed to load network controls");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, [token]);

  async function toggleGroup(id: string) {
    if (!token) return;
    try {
      await apiRequest(`/api/admin/network/mentor-groups/${id}/toggle`, { method: "PATCH" }, token);
      await load();
      Alert.alert("Updated", "Mentor group status changed.");
    } catch (err: any) {
      Alert.alert("Update failed", err?.message || "Please try again.");
    }
  }

  const stats = useMemo(
    () => [
      { label: "Connections", value: connections.length, tone: "accent" as const },
      { label: "Follows", value: follows.length, tone: "primary" as const },
      { label: "Mentor Groups", value: groups.filter((item) => item.isActive).length, tone: "warning" as const },
      { label: "Audit Logs", value: audit?.total || 0, tone: "danger" as const }
    ],
    [connections, follows, groups, audit]
  );

  const emptyTitle =
    tab === "connections"
      ? "No connections"
      : tab === "follows"
        ? "No follows"
        : tab === "groups"
          ? "No mentor groups"
          : "No audit logs";

  if (loading && !connections.length && !follows.length && !groups.length && !audit) {
    return <LoadingState label="Loading network controls..." />;
  }

  return (
    <Screen>
      <AdminTopBar title="Network" />
      <HeroCard
        title="Network Control"
        subtitle="Inspect social graph movement, mentor groups, and admin actions from one mobile control surface."
        rightLabel="Network"
      />
      <StatGrid items={stats} />

      <SectionTitle title="Network lanes" subtitle="Connections, follows, mentor groups, and audit visibility belong here." />
      <ChipTabs
        value={tab}
        onChange={setTab}
        options={[
          { label: "Connections", value: "connections" },
          { label: "Follows", value: "follows" },
          { label: "Groups", value: "groups" },
          { label: "Audit", value: "audit" }
        ]}
      />

      {error ? (
        <Card>
          <Text style={styles.errorText}>{error}</Text>
          <ActionButton label="Retry" tone="warning" onPress={load} />
        </Card>
      ) : null}

      {tab === "connections" && !connections.length ? <EmptyState title={emptyTitle} subtitle="Connection records will appear here for admin visibility." /> : null}
      {tab === "follows" && !follows.length ? <EmptyState title={emptyTitle} subtitle="Follow records will appear here for admin visibility." /> : null}
      {tab === "groups" && !groups.length ? <EmptyState title={emptyTitle} subtitle="Mentor groups will appear here for activation control." /> : null}
      {tab === "audit" && !audit?.logs?.length ? <EmptyState title={emptyTitle} subtitle="Audit records will appear here when admin actions are logged." /> : null}

      {tab === "connections"
        ? connections.map((item) => (
            <Card key={item._id}>
              <Text style={styles.title}>
                {(item.requesterId?.name || "Unknown") + " to " + (item.recipientId?.name || "Unknown")}
              </Text>
              <Text style={styles.subtitle}>{item.status || "pending"} | {item.updatedAt ? new Date(item.updatedAt).toLocaleString() : "Unknown"}</Text>
              <View style={styles.row}>
                <View style={styles.flexOne}>
                  <Label>Requester</Label>
                  <Value muted>{item.requesterId?.email || "No email"}</Value>
                </View>
                <View style={styles.flexOne}>
                  <Label>Recipient</Label>
                  <Value muted>{item.recipientId?.email || "No email"}</Value>
                </View>
              </View>
            </Card>
          ))
        : null}

      {tab === "follows"
        ? follows.map((item) => (
            <Card key={item._id}>
              <Text style={styles.title}>{item.followerId?.name || "Unknown"} follows {item.followingId?.name || "Unknown"}</Text>
              <Text style={styles.subtitle}>{item.createdAt ? new Date(item.createdAt).toLocaleString() : "Unknown time"}</Text>
              <View style={styles.row}>
                <View style={styles.flexOne}>
                  <Label>Follower</Label>
                  <Value muted>{item.followerId?.email || "No email"}</Value>
                </View>
                <View style={styles.flexOne}>
                  <Label>Following</Label>
                  <Value muted>{item.followingId?.email || "No email"}</Value>
                </View>
              </View>
            </Card>
          ))
        : null}

      {tab === "groups"
        ? groups.map((item) => (
            <Card key={item._id}>
              <Text style={styles.title}>{item.title || item.name || "Mentor Group"}</Text>
              <Text style={styles.subtitle}>{item.mentorId?.name || "Mentor"} | {item.isActive ? "active" : "inactive"}</Text>
              <Label>Description</Label>
              <Value muted>{item.description || "No description"}</Value>
              <View style={styles.row}>
                <View style={styles.flexOne}>
                  <Label>Members</Label>
                  <Value muted>{item.members?.length || 0}</Value>
                </View>
                <View style={styles.flexOne}>
                  <Label>Updated</Label>
                  <Value muted>{item.updatedAt ? new Date(item.updatedAt).toLocaleDateString() : "Unknown"}</Value>
                </View>
              </View>
              <View style={styles.actions}>
                <ActionButton label={item.isActive ? "Disable" : "Activate"} tone="warning" onPress={() => toggleGroup(item._id)} />
              </View>
            </Card>
          ))
        : null}

      {tab === "audit"
        ? audit?.logs?.map((item) => (
            <Card key={item._id}>
              <Text style={styles.title}>{item.action || "Admin action"}</Text>
              <Text style={styles.subtitle}>{item.entityType || "entity"} | {item.status || "done"} | {item.createdAt ? new Date(item.createdAt).toLocaleString() : "Unknown"}</Text>
              <View style={styles.row}>
                <View style={styles.flexOne}>
                  <Label>Actor</Label>
                  <Value muted>{item.actorId?.name || "System"}</Value>
                </View>
                <View style={styles.flexOne}>
                  <Label>Entity</Label>
                  <Value muted>{item.entityId || "N/A"}</Value>
                </View>
              </View>
            </Card>
          ))
        : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: {
    color: colors.text,
    fontSize: 19,
    fontWeight: "800"
  },
  subtitle: {
    color: colors.textMuted,
    marginTop: 4,
    marginBottom: spacing.md
  },
  row: {
    flexDirection: "row",
    gap: spacing.md,
    marginBottom: spacing.md
  },
  flexOne: {
    flex: 1
  },
  actions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm
  },
  errorText: {
    color: colors.danger,
    fontWeight: "700",
    marginBottom: spacing.sm
  }
});
