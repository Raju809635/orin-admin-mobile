import React, { useEffect, useMemo, useState } from "react";
import { Alert, Linking, StyleSheet, Text, View } from "react-native";
import { ActionButton, Card, ChipTabs, EmptyState, HeroCard, Label, LoadingState, Screen, SectionTitle, StatGrid, Value } from "@/components/ui";
import { colors, spacing } from "@/constants/theme";
import { useAuth } from "@/context/AuthContext";
import { apiRequest } from "@/lib/api";
import { AdminLiveSessionRecord, AdminSprintRecord } from "@/lib/types";

type ProgramTab = "live" | "sprint";

export default function ProgramsScreen() {
  const { token } = useAuth();
  const [programTab, setProgramTab] = useState<ProgramTab>("live");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [liveSessions, setLiveSessions] = useState<AdminLiveSessionRecord[]>([]);
  const [sprints, setSprints] = useState<AdminSprintRecord[]>([]);

  async function load() {
    if (!token) return;
    try {
      setLoading(true);
      setError("");
      const [liveData, sprintData] = await Promise.all([
        apiRequest<AdminLiveSessionRecord[]>("/api/admin/network/live-sessions", {}, token),
        apiRequest<AdminSprintRecord[]>("/api/admin/network/sprints", {}, token)
      ]);
      setLiveSessions(liveData);
      setSprints(sprintData);
    } catch (err: any) {
      setError(err?.message || "Failed to load programs");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, [token]);

  async function reviewLiveSession(id: string, action: "approve" | "reject") {
    if (!token) return;
    try {
      await apiRequest(`/api/admin/network/live-sessions/${id}/review`, {
        method: "PATCH",
        body: JSON.stringify({ action, note: `Reviewed from ORIN Admin Mobile: ${action}` })
      }, token);
      await load();
      Alert.alert("Updated", `Live session ${action}d successfully.`);
    } catch (err: any) {
      Alert.alert("Update failed", err?.message || "Please try again.");
    }
  }

  async function toggleLiveSession(id: string) {
    if (!token) return;
    try {
      await apiRequest(`/api/admin/network/live-sessions/${id}/toggle`, { method: "PATCH" }, token);
      await load();
    } catch (err: any) {
      Alert.alert("Action failed", err?.message || "Please try again.");
    }
  }

  async function reviewSprint(id: string, action: "approve" | "reject") {
    if (!token) return;
    try {
      await apiRequest(`/api/admin/network/sprints/${id}/review`, {
        method: "PATCH",
        body: JSON.stringify({ action, note: `Reviewed from ORIN Admin Mobile: ${action}` })
      }, token);
      await load();
      Alert.alert("Updated", `Sprint ${action}d successfully.`);
    } catch (err: any) {
      Alert.alert("Update failed", err?.message || "Please try again.");
    }
  }

  async function toggleSprint(id: string) {
    if (!token) return;
    try {
      await apiRequest(`/api/admin/network/sprints/${id}/toggle`, { method: "PATCH" }, token);
      await load();
    } catch (err: any) {
      Alert.alert("Action failed", err?.message || "Please try again.");
    }
  }

  const stats = useMemo(() => {
    const pendingLive = liveSessions.filter((item) => item.approvalStatus === "pending").length;
    const pendingSprints = sprints.filter((item) => item.approvalStatus === "pending").length;
    const paidLive = liveSessions.filter((item) => item.sessionMode === "paid").length;
    const paidSprints = sprints.filter((item) => item.sessionMode === "paid").length;

    return [
      { label: "Live Pending", value: pendingLive, tone: "warning" as const },
      { label: "Sprints Pending", value: pendingSprints, tone: "warning" as const },
      { label: "Paid Live", value: paidLive, tone: "accent" as const },
      { label: "Paid Sprints", value: paidSprints, tone: "primary" as const }
    ];
  }, [liveSessions, sprints]);

  const visibleItems = programTab === "live" ? liveSessions : sprints;

  if (loading && !liveSessions.length && !sprints.length) {
    return <LoadingState label="Loading programs..." />;
  }

  return (
    <Screen>
      <View style={{ height: spacing.lg }} />
      <HeroCard
        title="Programs Control"
        subtitle="Moderate live sessions and sprints, review media, and decide what goes visible to students."
        rightLabel="Programs"
      />
      <StatGrid items={stats} />
      <SectionTitle title="Program queues" subtitle="Switch between live sessions and cohort sprints without leaving the mobile flow." />
      <ChipTabs
        value={programTab}
        onChange={setProgramTab}
        options={[
          { label: "Live Sessions", value: "live" },
          { label: "Sprints", value: "sprint" }
        ]}
      />

      {error ? (
        <Card>
          <Text style={{ color: colors.danger, fontWeight: "700", marginBottom: spacing.sm }}>{error}</Text>
          <ActionButton label="Retry" onPress={load} tone="warning" />
        </Card>
      ) : null}

      {!visibleItems.length ? (
        <EmptyState
          title={programTab === "live" ? "No live sessions yet" : "No sprints yet"}
          subtitle="When mentors submit programs, they’ll appear here for approval and control."
        />
      ) : null}

      {programTab === "live"
        ? liveSessions.map((item) => (
            <Card key={item._id}>
              <Text style={styles.title}>{item.title}</Text>
              <Text style={styles.subtitle}>
                {item.mentorId?.name || "Mentor"} | {new Date(item.startsAt).toLocaleString()}
              </Text>
              <View style={styles.row}>
                <View style={styles.flexOne}>
                  <Label>Status</Label>
                  <Value>{item.approvalStatus || "pending"} {item.isCancelled ? "| cancelled" : ""}</Value>
                </View>
                <View style={styles.flexOne}>
                  <Label>Price & seats</Label>
                  <Value>
                    {item.sessionMode === "paid" ? `INR ${item.price || 0}` : "Free"} | {item.maxParticipants || 0} seats
                  </Value>
                </View>
              </View>
              <View style={styles.row}>
                <View style={styles.flexOne}>
                  <Label>Bookings</Label>
                  <Value>
                    Total {item.bookingStats?.totalBookings || 0} | Paid {item.bookingStats?.paidBookings || 0}
                  </Value>
                </View>
                <View style={styles.flexOne}>
                  <Label>Topic</Label>
                  <Value muted>{item.topic || item.description || "No topic shared yet."}</Value>
                </View>
              </View>
              <View style={styles.actions}>
                {item.approvalStatus !== "approved" ? (
                  <ActionButton label="Approve" tone="primary" onPress={() => reviewLiveSession(item._id, "approve")} />
                ) : null}
                {item.approvalStatus !== "rejected" ? (
                  <ActionButton label="Reject" tone="danger" onPress={() => reviewLiveSession(item._id, "reject")} />
                ) : null}
                <ActionButton
                  label={item.isCancelled ? "Reopen" : "Cancel"}
                  tone="warning"
                  onPress={() => toggleLiveSession(item._id)}
                />
              </View>
            </Card>
          ))
        : sprints.map((item) => (
            <Card key={item._id}>
              <Text style={styles.title}>{item.title}</Text>
              <Text style={styles.subtitle}>
                {item.mentorId?.name || "Mentor"} | {new Date(item.startDate).toLocaleDateString()} - {new Date(item.endDate).toLocaleDateString()}
              </Text>
              <View style={styles.row}>
                <View style={styles.flexOne}>
                  <Label>Status</Label>
                  <Value>{item.approvalStatus || "pending"} {item.isCancelled ? "| cancelled" : ""}</Value>
                </View>
                <View style={styles.flexOne}>
                  <Label>Price & seats</Label>
                  <Value>
                    {item.sessionMode === "paid" ? `INR ${item.price || 0}` : "Free"} | {item.maxParticipants || 0} max
                  </Value>
                </View>
              </View>
              <View style={styles.row}>
                <View style={styles.flexOne}>
                  <Label>Enrollment</Label>
                  <Value>
                    Total {item.enrollmentStats?.totalEnrollments || 0} | Paid {item.enrollmentStats?.paidEnrollments || 0}
                  </Value>
                </View>
                <View style={styles.flexOne}>
                  <Label>Revenue</Label>
                  <Value>
                    Gross INR {item.enrollmentStats?.grossRevenue || 0} | ORIN INR {item.enrollmentStats?.orinRevenue || 0}
                  </Value>
                </View>
              </View>
              <View style={styles.actions}>
                {item.posterImageUrl ? (
                  <ActionButton label="Preview Poster" onPress={() => Linking.openURL(item.posterImageUrl!)} />
                ) : null}
                {item.curriculumDocumentUrl ? (
                  <ActionButton label="Curriculum" onPress={() => Linking.openURL(item.curriculumDocumentUrl!)} />
                ) : null}
                {item.approvalStatus !== "approved" ? (
                  <ActionButton label="Approve" tone="primary" onPress={() => reviewSprint(item._id, "approve")} />
                ) : null}
                {item.approvalStatus !== "rejected" ? (
                  <ActionButton label="Reject" tone="danger" onPress={() => reviewSprint(item._id, "reject")} />
                ) : null}
                <ActionButton
                  label={item.isCancelled ? "Reopen" : "Cancel"}
                  tone="warning"
                  onPress={() => toggleSprint(item._id)}
                />
              </View>
            </Card>
          ))}
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: {
    color: colors.text,
    fontSize: 18,
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
  }
});
