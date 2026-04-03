import React, { useEffect, useMemo, useState } from "react";
import { Alert, Linking, StyleSheet, Text, View } from "react-native";
import { ActionButton, Card, ChipTabs, EmptyState, HeroCard, Label, LoadingState, Screen, SectionTitle, StatGrid, Value } from "@/components/ui";
import { colors, spacing } from "@/constants/theme";
import { useAuth } from "@/context/AuthContext";
import { apiRequest } from "@/lib/api";
import { AdminSprintPayoutRecord, ManualPaymentRecord, SessionPayoutRecord } from "@/lib/types";
import { AdminTopBar } from "@/components/admin-nav";

type PaymentTab = "manual" | "session" | "sprint";

export default function PaymentsScreen() {
  const { token } = useAuth();
  const [paymentTab, setPaymentTab] = useState<PaymentTab>("manual");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [sprintUnavailable, setSprintUnavailable] = useState(false);
  const [manualPayments, setManualPayments] = useState<ManualPaymentRecord[]>([]);
  const [sessionPayouts, setSessionPayouts] = useState<SessionPayoutRecord[]>([]);
  const [sprintPayouts, setSprintPayouts] = useState<AdminSprintPayoutRecord[]>([]);

  async function load() {
    if (!token) return;
    try {
      setLoading(true);
      setError("");
      const [manualResult, sessionResult, sprintResult] = await Promise.allSettled([
        apiRequest<ManualPaymentRecord[]>("/api/sessions/admin/manual-payments", {}, token),
        apiRequest<SessionPayoutRecord[]>("/api/sessions/admin/payouts", {}, token),
        apiRequest<AdminSprintPayoutRecord[]>("/api/admin/network/sprint-payouts", {}, token)
      ]);

      if (manualResult.status === "fulfilled") {
        setManualPayments(manualResult.value);
      } else {
        setManualPayments([]);
        setError((current) => current || (manualResult.reason?.message || "Failed to load manual payment proofs"));
      }

      if (sessionResult.status === "fulfilled") {
        setSessionPayouts(sessionResult.value);
      } else {
        setSessionPayouts([]);
        setError((current) => current || (sessionResult.reason?.message || "Failed to load 1:1 payouts"));
      }

      if (sprintResult.status === "fulfilled") {
        setSprintPayouts(sprintResult.value);
        setSprintUnavailable(false);
      } else {
        setSprintPayouts([]);
        setSprintUnavailable(true);
      }
    } catch (err: any) {
      setError(err?.message || "Failed to load payments");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, [token]);

  async function reviewManualPayment(id: string, action: "verify" | "reject") {
    if (!token) return;
    try {
      await apiRequest(`/api/sessions/admin/manual-payments/${id}/review`, {
        method: "PATCH",
        body: JSON.stringify({
          action,
          rejectReason: action === "reject" ? "Rejected from ORIN Admin Mobile." : ""
        })
      }, token);
      await load();
      Alert.alert("Updated", `Manual payment ${action === "verify" ? "verified" : "rejected"}.`);
    } catch (err: any) {
      Alert.alert("Update failed", err?.message || "Please try again.");
    }
  }

  async function markSessionPayoutPaid(id: string) {
    if (!token) return;
    try {
      await apiRequest(`/api/sessions/admin/payouts/${id}/pay`, {
        method: "PATCH",
        body: JSON.stringify({
          payoutReference: `ADMIN-MOBILE-${Date.now()}`,
          payoutNote: "Marked paid from ORIN Admin Mobile"
        })
      }, token);
      await load();
      Alert.alert("Payout updated", "Mentor payout has been marked as paid.");
    } catch (err: any) {
      Alert.alert("Update failed", err?.message || "Please try again.");
    }
  }

  async function markSprintPayoutPaid(id: string) {
    if (!token) return;
    try {
      await apiRequest(`/api/admin/network/sprint-payouts/${id}/pay`, {
        method: "PATCH",
        body: JSON.stringify({
          payoutReference: `SPRINT-MOBILE-${Date.now()}`,
          payoutNote: "Marked paid from ORIN Admin Mobile"
        })
      }, token);
      await load();
      Alert.alert("Payout updated", "Sprint payout has been marked as paid.");
    } catch (err: any) {
      Alert.alert("Update failed", err?.message || "Please try again.");
    }
  }

  const stats = useMemo(() => {
    const pendingManual = manualPayments.filter((item) => item.paymentStatus === "waiting_verification").length;
    const sessionPending = sessionPayouts.filter((item) => item.payoutStatus === "pending").length;
    const sprintPending = sprintPayouts.filter((item) => item.payoutStatus === "pending").length;
    const issueCount = sessionPayouts.filter((item) => item.payoutStatus === "issue_reported").length + sprintPayouts.filter((item) => item.payoutStatus === "issue_reported").length;
    return [
      { label: "Manual Reviews", value: pendingManual, tone: "warning" as const },
      { label: "1:1 Payouts", value: sessionPending, tone: "accent" as const },
      { label: "Sprint Payouts", value: sprintPending, tone: "primary" as const },
      { label: "Issues", value: issueCount, tone: "danger" as const }
    ];
  }, [manualPayments, sessionPayouts, sprintPayouts]);

  const activeLength =
    paymentTab === "manual" ? manualPayments.length : paymentTab === "session" ? sessionPayouts.length : sprintPayouts.length;

  if (loading && !manualPayments.length && !sessionPayouts.length && !sprintPayouts.length) {
    return <LoadingState label="Loading payments..." />;
  }

  return (
    <Screen>
      <AdminTopBar title="Payments" />
      <HeroCard
        title="Payments & Payouts"
        subtitle="Handle verification, release mentor payouts, and keep the money layer transparent and controlled."
        rightLabel="Finance"
      />
      <StatGrid items={stats} />
      <SectionTitle title="Payment queues" subtitle="Move between proof verification and payouts without desktop dependency." />
      <ChipTabs
        value={paymentTab}
        onChange={setPaymentTab}
        options={[
          { label: "Manual Proofs", value: "manual" },
          { label: "1:1 Payouts", value: "session" },
          ...(sprintUnavailable ? [] : [{ label: "Sprint Payouts", value: "sprint" as PaymentTab }])
        ]}
      />

      {error ? (
        <Card>
          <Text style={{ color: colors.danger, fontWeight: "700", marginBottom: spacing.sm }}>{error}</Text>
          <ActionButton label="Retry" onPress={load} tone="warning" />
        </Card>
      ) : null}

      {sprintUnavailable ? (
        <Card>
          <Text style={{ color: colors.warning, fontWeight: "700", marginBottom: spacing.xs }}>Sprint payouts are unavailable on the current backend deploy.</Text>
          <Text style={{ color: colors.textMuted, lineHeight: 21 }}>
            Manual proofs and 1:1 mentor payouts are still working. Once the backend includes sprint payout routes, they will appear here automatically.
          </Text>
        </Card>
      ) : null}

      {!activeLength ? (
        <EmptyState
          title="Queue is clear"
          subtitle="No payment or payout items need action in this tab right now."
        />
      ) : null}

      {paymentTab === "manual"
        ? manualPayments.map((item) => (
            <Card key={item._id}>
              <Text style={styles.title}>Session payment proof</Text>
              <Text style={styles.subtitle}>
                {item.studentId?.name || "Student"} to {item.mentorId?.name || "Mentor"}
              </Text>
              <View style={styles.row}>
                <View style={styles.flexOne}>
                  <Label>Amount</Label>
                  <Value>INR {item.amount}</Value>
                </View>
                <View style={styles.flexOne}>
                  <Label>Status</Label>
                  <Value>{item.paymentStatus}</Value>
                </View>
              </View>
              <View style={styles.row}>
                <View style={styles.flexOne}>
                  <Label>Session slot</Label>
                  <Value>{item.date} | {item.time}</Value>
                </View>
                <View style={styles.flexOne}>
                  <Label>Reference</Label>
                  <Value muted>{item.transactionReference || "No reference"}</Value>
                </View>
              </View>
              <View style={styles.actions}>
                {item.paymentScreenshot ? (
                  <ActionButton label="Open Proof" onPress={() => Linking.openURL(item.paymentScreenshot!)} />
                ) : null}
                <ActionButton label="Verify" tone="primary" onPress={() => reviewManualPayment(item._id, "verify")} />
                <ActionButton label="Reject" tone="danger" onPress={() => reviewManualPayment(item._id, "reject")} />
              </View>
            </Card>
          ))
        : null}

      {paymentTab === "session"
        ? sessionPayouts.map((item) => (
            <Card key={item._id}>
              <Text style={styles.title}>1:1 mentor payout</Text>
              <Text style={styles.subtitle}>
                {item.mentorId?.name || "Mentor"} | {item.date} {item.time}
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
                  <Value>{item.hasMentorPaymentDetails ? "Ready" : "Missing"}</Value>
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
                  onPress={() => markSessionPayoutPaid(item._id)}
                />
              </View>
            </Card>
          ))
        : null}

      {paymentTab === "sprint"
        ? sprintPayouts.map((item) => (
            <Card key={item._id}>
              <Text style={styles.title}>Sprint mentor payout</Text>
              <Text style={styles.subtitle}>
                {item.sprintId?.title || "Sprint"} | {item.mentorId?.name || "Mentor"}
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
                  <Label>Mentor confirmation</Label>
                  <Value>{item.mentorPayoutConfirmationStatus}</Value>
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
                {item.sprintId?.posterImageUrl ? (
                  <ActionButton label="Open Poster" onPress={() => Linking.openURL(item.sprintId!.posterImageUrl!)} />
                ) : null}
                {item.mentorPaymentDetails?.qrCodeUrl ? (
                  <ActionButton label="Open QR" onPress={() => Linking.openURL(item.mentorPaymentDetails!.qrCodeUrl!)} />
                ) : null}
                <ActionButton
                  label={item.canAdminMarkPayoutPaid ? "Mark Paid" : "Not Ready"}
                  tone="primary"
                  disabled={!item.canAdminMarkPayoutPaid}
                  onPress={() => markSprintPayoutPaid(item._id)}
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
