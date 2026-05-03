import React, { useEffect, useMemo, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { Card, HeroCard, ActionButton, Label, LoadingState, Screen, SectionTitle, StatGrid, Value } from "@/components/ui";
import { colors, spacing } from "@/constants/theme";
import { useAuth } from "@/context/AuthContext";
import { apiRequest } from "@/lib/api";
import { Demographics, NetworkAdminOverview } from "@/lib/types";
import { AdminTopBar } from "@/components/admin-nav";

export default function OverviewScreen() {
  const router = useRouter();
  const { token, user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [demographics, setDemographics] = useState<Demographics | null>(null);
  const [networkOverview, setNetworkOverview] = useState<NetworkAdminOverview | null>(null);

  async function load() {
    if (!token) return;
    try {
      setLoading(true);
      setError("");
      const [demographicData, networkData] = await Promise.all([
        apiRequest<Demographics>("/api/admin/demographics", {}, token),
        apiRequest<NetworkAdminOverview>("/api/admin/network/overview", {}, token)
      ]);
      setDemographics(demographicData);
      setNetworkOverview(networkData);
    } catch (err: any) {
      setError(err?.message || "Failed to load overview");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, [token]);

  const quickStats = useMemo(() => {
    if (!demographics || !networkOverview) return [];
    return [
      { label: "Users", value: demographics.totals.users, tone: "primary" as const },
      { label: "Pending Mentors", value: demographics.totals.pendingMentors, tone: "warning" as const },
      { label: "Revenue", value: `INR ${Math.round(demographics.totals.revenue || 0)}`, tone: "accent" as const },
      { label: "Upcoming Live", value: networkOverview.communities.upcomingLiveSessions, tone: "danger" as const }
    ];
  }, [demographics, networkOverview]);

  if (loading && !demographics) {
    return <LoadingState label="Loading admin overview..." />;
  }

  return (
    <Screen>
      <AdminTopBar title="Home" />
      <HeroCard
        title={`Welcome, ${user?.name?.split(" ")[0] || "Admin"}`}
        subtitle="Track ORIN across students, teachers, heads, global mentors, institutions, approvals, global programs, and payouts."
        rightLabel="Mobile Control"
      />

      <SectionTitle title="Today at a glance" subtitle="The highest-value platform controls are surfaced first for mobile." />
      <StatGrid items={quickStats} />

      {error ? (
        <Card>
          <Text style={{ color: colors.danger, fontWeight: "700", marginBottom: spacing.sm }}>{error}</Text>
          <ActionButton label="Retry" onPress={load} tone="warning" />
        </Card>
      ) : null}

      <SectionTitle title="Priority actions" subtitle="Jump straight into the admin flows that move the business." />
      <View style={styles.actionGrid}>
        <Card style={styles.actionCard}>
          <Text style={styles.actionTitle}>Approval Queue</Text>
          <Text style={styles.actionText}>Handle mentor approvals, complaints, institution-side review, and collaboration requests.</Text>
          <ActionButton label="Open Approvals" onPress={() => router.push("/operations")} tone="primary" />
        </Card>
        <Card style={styles.actionCard}>
          <Text style={styles.actionTitle}>People Control</Text>
          <Text style={styles.actionText}>Review students, global mentors, class teachers, organisation heads, sessions, and payout readiness.</Text>
          <ActionButton label="Open People" onPress={() => router.push("/mentorship")} tone="primary" />
        </Card>
        <Card style={styles.actionCard}>
          <Text style={styles.actionTitle}>Global Control</Text>
          <Text style={styles.actionText}>Moderate global posts, global challenges, sprints, and ORIN-wide visibility.</Text>
          <ActionButton label="Open Global" onPress={() => router.push("/community")} tone="primary" />
        </Card>
        <Card style={styles.actionCard}>
          <Text style={styles.actionTitle}>Institution Map</Text>
          <Text style={styles.actionText}>Watch schools, colleges, states, heads, teachers, and student reach from the institution tab.</Text>
          <ActionButton label="Open Institutions" onPress={() => router.push("/more")} tone="primary" />
        </Card>
        <Card style={styles.actionCard}>
          <Text style={styles.actionTitle}>Students & Payments</Text>
          <Text style={styles.actionText}>Browse all students, monitor proofs, and manage payout queues from the same admin phone flow.</Text>
          <View style={styles.inlineActions}>
            <ActionButton label="Students" onPress={() => router.push("/students")} tone="default" />
            <ActionButton label="Payments" onPress={() => router.push("/payments")} tone="primary" />
          </View>
        </Card>
      </View>

      <SectionTitle title="Platform snapshot" subtitle="These numbers help you sense risk and opportunity quickly." />
      <Card>
        <Label>Role distribution</Label>
        <Value>Students: {demographics?.roles.students || 0} | Mentors: {demographics?.roles.mentors || 0} | Admins: {demographics?.roles.admins || 0}</Value>
        <View style={{ height: spacing.md }} />
        <Label>Revenue & sessions</Label>
        <Value>
          Sessions: {demographics?.totals.sessions || 0} | Paid: {demographics?.totals.paidSessions || 0} | Bookings: {demographics?.totals.bookings || 0}
        </Value>
        <View style={{ height: spacing.md }} />
        <Label>Network health</Label>
        <Value>
          Posts: {networkOverview?.posts.total || 0} | Connections pending: {networkOverview?.network.pendingConnections || 0}
        </Value>
      </Card>

      <SectionTitle title="Regional reach" subtitle="This shows where ORIN is active today based on student and mentor profile data." />
      <Card>
        <Label>Top student states</Label>
        <Value muted>
          {(demographics?.regionalReach?.studentStates || [])
            .slice(0, 4)
            .map((item) => `${item.name} (${item.count})`)
            .join(" | ") || "Ask users to save state in profile to strengthen regional stats."}
        </Value>
        <View style={{ height: spacing.md }} />
        <Label>Top colleges</Label>
        <Value muted>
          {(demographics?.regionalReach?.studentColleges || [])
            .slice(0, 4)
            .map((item) => `${item.name} (${item.count})`)
            .join(" | ") || "No college data yet."}
        </Value>
        <View style={{ height: spacing.md }} />
        <Label>Download intelligence</Label>
        <Value muted>
          Play Store download and install region metrics need Google Play Console or Firebase Analytics integration. This admin app is currently showing live ORIN profile-region activity instead.
        </Value>
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  actionGrid: {
    gap: spacing.md,
    marginBottom: spacing.lg
  },
  actionCard: {
    gap: spacing.md
  },
  inlineActions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm
  },
  actionTitle: {
    color: colors.text,
    fontWeight: "800",
    fontSize: 18
  },
  actionText: {
    color: colors.textMuted,
    lineHeight: 21
  }
});
