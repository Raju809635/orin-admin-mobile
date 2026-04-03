import React, { useEffect, useMemo, useState } from "react";
import { Alert, Linking, StyleSheet, Text, View } from "react-native";
import { ActionButton, Card, ChipTabs, EmptyState, HeroCard, Label, LoadingState, Screen, SectionTitle, StatGrid, Value } from "@/components/ui";
import { colors, spacing } from "@/constants/theme";
import { useAuth } from "@/context/AuthContext";
import { apiRequest } from "@/lib/api";
import { AdminLiveSessionRecord, MentorProfileRecord, SessionPayoutRecord } from "@/lib/types";
import { AdminTopBar } from "@/components/admin-nav";

type MentorshipTab = "mentors" | "sessions" | "payments";

export default function MentorshipScreen() {
  const { token } = useAuth();
  const [tab, setTab] = useState<MentorshipTab>("mentors");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [mentors, setMentors] = useState<MentorProfileRecord[]>([]);
  const [liveSessions, setLiveSessions] = useState<AdminLiveSessionRecord[]>([]);
  const [sessionPayouts, setSessionPayouts] = useState<SessionPayoutRecord[]>([]);

  async function load() {
    if (!token) return;
    try {
      setLoading(true);
      setError("");
      const [mentorData, liveData, payoutData] = await Promise.all([
        apiRequest<MentorProfileRecord[]>("/api/admin/mentors/profiles", {}, token),
        apiRequest<AdminLiveSessionRecord[]>("/api/admin/network/live-sessions", {}, token),
        apiRequest<SessionPayoutRecord[]>("/api/sessions/admin/payouts", {}, token)
      ]);
      setMentors(mentorData);
      setLiveSessions(liveData);
      setSessionPayouts(payoutData);
    } catch (err: any) {
      setError(err?.message || "Failed to load mentorship controls");
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
      await apiRequest(
        `/api/admin/network/live-sessions/${id}/review`,
        {
          method: "PATCH",
          body: JSON.stringify({ action, note: `Reviewed from ORIN Admin Mobile: ${action}` })
        },
        token
      );
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
      Alert.alert("Updated", "Live session status changed.");
    } catch (err: any) {
      Alert.alert("Action failed", err?.message || "Please try again.");
    }
  }

  async function markPayoutPaid(id: string) {
    if (!token) return;
    try {
      await apiRequest(
        `/api/sessions/admin/payouts/${id}/pay`,
        {
          method: "PATCH",
          body: JSON.stringify({
            payoutReference: `ADMIN-MOBILE-${Date.now()}`,
            payoutNote: "Marked paid from ORIN Admin Mobile"
          })
        },
        token
      );
      await load();
      Alert.alert("Updated", "Mentor payout marked as paid.");
    } catch (err: any) {
      Alert.alert("Update failed", err?.message || "Please try again.");
    }
  }

  const stats = useMemo(
    () => [
      { label: "Approved Mentors", value: mentors.filter((item) => item.approvalStatus === "approved").length, tone: "primary" as const },
      { label: "Pending Live", value: liveSessions.filter((item) => item.approvalStatus === "pending").length, tone: "warning" as const },
      { label: "Upcoming Live", value: liveSessions.filter((item) => !item.isCancelled).length, tone: "accent" as const },
      { label: "Pending Payouts", value: sessionPayouts.filter((item) => item.payoutStatus === "pending").length, tone: "danger" as const }
    ],
    [mentors, liveSessions, sessionPayouts]
  );

  if (loading && !mentors.length && !liveSessions.length && !sessionPayouts.length) {
    return <LoadingState label="Loading mentorship controls..." />;
  }

  return (
    <Screen>
      <AdminTopBar title="Mentorship" />
      <HeroCard
        title="Mentorship Control"
        subtitle="Keep mentors healthy, live sessions visible, and payouts moving with mobile-first oversight."
        rightLabel="Mentor Ops"
      />
      <StatGrid items={stats} />

      <SectionTitle title="Mentorship lanes" subtitle="Each lane is tuned for quick mobile review instead of dense desktop tables." />
      <ChipTabs
        value={tab}
        onChange={setTab}
        options={[
          { label: "Mentors", value: "mentors" },
          { label: "Sessions", value: "sessions" },
          { label: "Payments", value: "payments" }
        ]}
      />

      {error ? (
        <Card>
          <Text style={styles.errorText}>{error}</Text>
          <ActionButton label="Retry" onPress={load} tone="warning" />
        </Card>
      ) : null}

      {tab === "mentors" && !mentors.length ? <EmptyState title="No mentors found" subtitle="Mentor profiles and approvals will appear here." /> : null}
      {tab === "sessions" && !liveSessions.length ? <EmptyState title="No live sessions found" subtitle="Upcoming and pending mentor live sessions will appear here." /> : null}
      {tab === "payments" && !sessionPayouts.length ? <EmptyState title="No session payouts found" subtitle="Mentor payout items will appear here when they become eligible." /> : null}

      {tab === "mentors"
        ? mentors.map((mentor) => (
            <Card key={mentor._id}>
              <Text style={styles.title}>{mentor.name}</Text>
              <Text style={styles.subtitle}>
                {(mentor.title || "Mentor") + (mentor.company ? ` | ${mentor.company}` : "")}
              </Text>
              <View style={styles.row}>
                <View style={styles.flexOne}>
                  <Label>Category</Label>
                  <Value>{mentor.primaryCategory || "Not set"}</Value>
                </View>
                <View style={styles.flexOne}>
                  <Label>Price</Label>
                  <Value>{mentor.sessionPrice ? `INR ${mentor.sessionPrice}` : "Not set"}</Value>
                </View>
              </View>
              <View style={styles.row}>
                <View style={styles.flexOne}>
                  <Label>Experience</Label>
                  <Value muted>{mentor.experienceYears ? `${mentor.experienceYears} years` : "Not set"}</Value>
                </View>
                <View style={styles.flexOne}>
                  <Label>Payout setup</Label>
                  <Value muted>{mentor.payoutUpiId || mentor.payoutQrCodeUrl ? "Ready" : "Missing"}</Value>
                </View>
              </View>
              <View style={styles.row}>
                <View style={styles.flexOne}>
                  <Label>Phone</Label>
                  <Value muted>{mentor.phoneNumber || mentor.payoutPhoneNumber || "Not shared"}</Value>
                </View>
                <View style={styles.flexOne}>
                  <Label>Rating</Label>
                  <Value muted>{mentor.rating ? mentor.rating.toFixed(1) : "0.0"}</Value>
                </View>
              </View>
              <Label>Specializations</Label>
              <Value muted>{mentor.specializations?.length ? mentor.specializations.join(", ") : "No specializations yet"}</Value>
              <View style={styles.actions}>
                {mentor.linkedInUrl ? <ActionButton label="LinkedIn" onPress={() => Linking.openURL(mentor.linkedInUrl!)} /> : null}
                {mentor.payoutQrCodeUrl ? <ActionButton label="Open QR" onPress={() => Linking.openURL(mentor.payoutQrCodeUrl!)} /> : null}
              </View>
            </Card>
          ))
        : null}

      {tab === "sessions"
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
                  <Label>Seats & price</Label>
                  <Value>{item.maxParticipants || 0} seats | {item.sessionMode === "paid" ? `INR ${item.price || 0}` : "Free"}</Value>
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
                  <Label>Duration</Label>
                  <Value muted>{item.durationMinutes ? `${item.durationMinutes} mins` : "Not set"}</Value>
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
        : null}

      {tab === "payments"
        ? sessionPayouts.map((item) => (
            <Card key={item._id}>
              <Text style={styles.title}>{item.mentorId?.name || "Mentor payout"}</Text>
              <Text style={styles.subtitle}>
                Session on {item.date} at {item.time}
              </Text>
              <View style={styles.row}>
                <View style={styles.flexOne}>
                  <Label>Gross / ORIN / Mentor</Label>
                  <Value>INR {item.amount} / INR {item.platformFeeAmount} / INR {item.mentorPayoutAmount}</Value>
                </View>
              </View>
              <View style={styles.row}>
                <View style={styles.flexOne}>
                  <Label>Payout status</Label>
                  <Value>{item.payoutStatus}</Value>
                </View>
                <View style={styles.flexOne}>
                  <Label>Mentor setup</Label>
                  <Value muted>{item.hasMentorPaymentDetails ? "Ready" : "Missing"}</Value>
                </View>
              </View>
              {item.mentorPaymentDetails?.upiId ? (
                <View style={styles.row}>
                  <View style={styles.flexOne}>
                    <Label>UPI</Label>
                    <Value muted>{item.mentorPaymentDetails.upiId}</Value>
                  </View>
                  <View style={styles.flexOne}>
                    <Label>Phone</Label>
                    <Value muted>{item.mentorPaymentDetails.phoneNumber || "Not shared"}</Value>
                  </View>
                </View>
              ) : null}
              <View style={styles.actions}>
                {item.mentorPaymentDetails?.qrCodeUrl ? (
                  <ActionButton label="Open QR" onPress={() => Linking.openURL(item.mentorPaymentDetails!.qrCodeUrl!)} />
                ) : null}
                <ActionButton
                  label={item.canAdminMarkPayoutPaid ? "Mark Paid" : "Not Ready"}
                  tone="primary"
                  disabled={!item.canAdminMarkPayoutPaid}
                  onPress={() => markPayoutPaid(item._id)}
                />
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
