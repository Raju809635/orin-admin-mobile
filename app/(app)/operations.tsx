import React, { useEffect, useMemo, useState } from "react";
import { Alert, StyleSheet, Text, TextInput, View } from "react-native";
import { ActionButton, Card, ChipTabs, EmptyState, HeroCard, Label, LoadingState, Screen, SectionTitle, StatGrid, Value } from "@/components/ui";
import { colors, spacing } from "@/constants/theme";
import { useAuth } from "@/context/AuthContext";
import { apiRequest } from "@/lib/api";
import { CollaborateApplicationRecord, ComplaintRecord, PendingMentorRecord } from "@/lib/types";
import { AdminTopBar } from "@/components/admin-nav";

type OperationsTab = "approvals" | "complaints" | "collaborations";

export default function OperationsScreen() {
  const { token } = useAuth();
  const [tab, setTab] = useState<OperationsTab>("approvals");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [pendingMentors, setPendingMentors] = useState<PendingMentorRecord[]>([]);
  const [complaints, setComplaints] = useState<ComplaintRecord[]>([]);
  const [collaborations, setCollaborations] = useState<CollaborateApplicationRecord[]>([]);
  const [complaintNotes, setComplaintNotes] = useState<Record<string, string>>({});
  const [collabNotes, setCollabNotes] = useState<Record<string, string>>({});

  async function load() {
    if (!token) return;
    try {
      setLoading(true);
      setError("");
      const [mentorsData, complaintsData, collaborationData] = await Promise.all([
        apiRequest<PendingMentorRecord[]>("/api/admin/pending-mentors", {}, token),
        apiRequest<ComplaintRecord[]>("/api/complaints/admin", {}, token),
        apiRequest<CollaborateApplicationRecord[]>("/api/admin/collaborate/applications", {}, token)
      ]);
      setPendingMentors(mentorsData);
      setComplaints(complaintsData);
      setCollaborations(collaborationData);
    } catch (err: any) {
      setError(err?.message || "Failed to load operations");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, [token]);

  async function approveMentor(id: string) {
    if (!token) return;
    try {
      await apiRequest(`/api/admin/approve/${id}`, { method: "PUT" }, token);
      await load();
      Alert.alert("Approved", "Mentor approved successfully.");
    } catch (err: any) {
      Alert.alert("Approval failed", err?.message || "Please try again.");
    }
  }

  async function updateComplaint(id: string, status: string) {
    if (!token) return;
    try {
      await apiRequest(
        `/api/complaints/admin/${id}`,
        {
          method: "PATCH",
          body: JSON.stringify({
            status,
            adminResponse: complaintNotes[id] || `Updated from ORIN Admin Mobile: ${status}`
          })
        },
        token
      );
      await load();
      Alert.alert("Updated", `Complaint marked as ${status}.`);
    } catch (err: any) {
      Alert.alert("Update failed", err?.message || "Please try again.");
    }
  }

  async function reviewCollaboration(id: string, action: "approve" | "reject") {
    if (!token) return;
    try {
      await apiRequest(
        `/api/admin/collaborate/applications/${id}`,
        {
          method: "PATCH",
          body: JSON.stringify({
            action,
            adminNotes: collabNotes[id] || `Reviewed from ORIN Admin Mobile: ${action}`
          })
        },
        token
      );
      await load();
      Alert.alert("Updated", `Collaboration ${action}d successfully.`);
    } catch (err: any) {
      Alert.alert("Update failed", err?.message || "Please try again.");
    }
  }

  const stats = useMemo(
    () => [
      { label: "Mentor Approvals", value: pendingMentors.length, tone: "warning" as const },
      { label: "Open Complaints", value: complaints.filter((item) => item.status !== "resolved").length, tone: "danger" as const },
      { label: "Pending Collabs", value: collaborations.filter((item) => item.status === "pending").length, tone: "accent" as const },
      { label: "Resolved", value: complaints.filter((item) => item.status === "resolved").length, tone: "primary" as const }
    ],
    [pendingMentors, complaints, collaborations]
  );

  const emptyTitle =
    tab === "approvals" ? "No pending mentor approvals" : tab === "complaints" ? "No complaints in queue" : "No collaboration applications";

  if (loading && !pendingMentors.length && !complaints.length && !collaborations.length) {
    return <LoadingState label="Loading operations..." />;
  }

  return (
    <Screen>
      <AdminTopBar title="Operations" />
      <HeroCard
        title="Operations Center"
        subtitle="Move fast on mentor approvals, complaints, and collaboration requests without getting trapped in a web-table workflow."
        rightLabel="Fast Action"
      />
      <StatGrid items={stats} />

      <SectionTitle title="Action queues" subtitle="Switch between the three admin queues that usually need same-day attention." />
      <ChipTabs
        value={tab}
        onChange={setTab}
        options={[
          { label: "Approvals", value: "approvals" },
          { label: "Complaints", value: "complaints" },
          { label: "Collaborations", value: "collaborations" }
        ]}
      />

      {error ? (
        <Card>
          <Text style={styles.errorText}>{error}</Text>
          <ActionButton label="Retry" onPress={load} tone="warning" />
        </Card>
      ) : null}

      {tab === "approvals" && !pendingMentors.length ? (
        <EmptyState title={emptyTitle} subtitle="When new mentors apply, they will appear here with category context and approval controls." />
      ) : null}
      {tab === "complaints" && !complaints.length ? (
        <EmptyState title={emptyTitle} subtitle="User issues will surface here for admin response and resolution tracking." />
      ) : null}
      {tab === "collaborations" && !collaborations.length ? (
        <EmptyState title={emptyTitle} subtitle="Community and partnership applications will show up here for quick review." />
      ) : null}

      {tab === "approvals"
        ? pendingMentors.map((mentor) => (
            <Card key={mentor._id}>
              <Text style={styles.title}>{mentor.name}</Text>
              <Text style={styles.subtitle}>{mentor.email}</Text>
              <View style={styles.row}>
                <View style={styles.flexOne}>
                  <Label>Category</Label>
                  <Value>{mentor.primaryCategory || "Not set"}</Value>
                </View>
                <View style={styles.flexOne}>
                  <Label>Sub-category</Label>
                  <Value muted>{mentor.subCategory || "Not set"}</Value>
                </View>
              </View>
              <View style={styles.row}>
                <View style={styles.flexOne}>
                  <Label>Specializations</Label>
                  <Value muted>{mentor.specializations?.length ? mentor.specializations.join(", ") : "No specializations yet"}</Value>
                </View>
                <View style={styles.flexOne}>
                  <Label>Applied</Label>
                  <Value muted>{new Date(mentor.createdAt).toLocaleString()}</Value>
                </View>
              </View>
              <View style={styles.actions}>
                <ActionButton label="Approve" tone="primary" onPress={() => approveMentor(mentor._id)} />
              </View>
            </Card>
          ))
        : null}

      {tab === "complaints"
        ? complaints.map((complaint) => (
            <Card key={complaint._id}>
              <Text style={styles.title}>{complaint.subject || complaint.category || "Complaint"}</Text>
              <Text style={styles.subtitle}>
                {complaint.student?.name || "Student"} | {complaint.priority || "normal"} priority | {complaint.status || "open"}
              </Text>
              <Label>Message</Label>
              <Value muted>{complaint.message || "No complaint message shared."}</Value>
              <View style={{ height: spacing.md }} />
              <TextInput
                value={complaintNotes[complaint._id] || ""}
                onChangeText={(text) => setComplaintNotes((current) => ({ ...current, [complaint._id]: text }))}
                placeholder="Add admin response"
                placeholderTextColor={colors.textMuted}
                style={styles.input}
                multiline
              />
              <View style={styles.actions}>
                <ActionButton label="In Progress" tone="warning" onPress={() => updateComplaint(complaint._id, "in_progress")} />
                <ActionButton label="Resolve" tone="primary" onPress={() => updateComplaint(complaint._id, "resolved")} />
              </View>
            </Card>
          ))
        : null}

      {tab === "collaborations"
        ? collaborations.map((item) => (
            <Card key={item._id}>
              <Text style={styles.title}>{item.fullName || "Collaboration applicant"}</Text>
              <Text style={styles.subtitle}>
                {item.organization || "Independent"} | {item.collaborationType || "General collaboration"} | {item.status}
              </Text>
              <View style={styles.row}>
                <View style={styles.flexOne}>
                  <Label>Email</Label>
                  <Value muted>{item.email || "No email"}</Value>
                </View>
                <View style={styles.flexOne}>
                  <Label>Phone</Label>
                  <Value muted>{item.phoneNumber || "No phone"}</Value>
                </View>
              </View>
              <Label>Proposal</Label>
              <Value muted>{item.proposal || "No proposal shared."}</Value>
              <View style={{ height: spacing.md }} />
              <TextInput
                value={collabNotes[item._id] || ""}
                onChangeText={(text) => setCollabNotes((current) => ({ ...current, [item._id]: text }))}
                placeholder="Add admin notes"
                placeholderTextColor={colors.textMuted}
                style={styles.input}
                multiline
              />
              <View style={styles.actions}>
                <ActionButton label="Approve" tone="primary" onPress={() => reviewCollaboration(item._id, "approve")} />
                <ActionButton label="Reject" tone="danger" onPress={() => reviewCollaboration(item._id, "reject")} />
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
  input: {
    backgroundColor: colors.cardAlt,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: colors.text,
    minHeight: 56,
    textAlignVertical: "top",
    marginBottom: spacing.md
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
