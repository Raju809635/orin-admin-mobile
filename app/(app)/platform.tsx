import React, { useEffect, useMemo, useState } from "react";
import { Alert, Linking, StyleSheet, Text, View } from "react-native";
import { ActionButton, Card, ChipTabs, EmptyState, HeroCard, Label, LoadingState, Screen, SectionTitle, StatGrid, Value } from "@/components/ui";
import { colors, spacing } from "@/constants/theme";
import { useAuth } from "@/context/AuthContext";
import { apiRequest } from "@/lib/api";
import {
  AdminBootcampRecord,
  AdminCertificationRequestRecord,
  AdminCertificationTrackRecord,
  AdminKnowledgeResourceRecord,
  AdminOpportunityRecord
} from "@/lib/types";
import { AdminTopBar } from "@/components/admin-nav";

type PlatformTab = "opportunities" | "resources" | "certifications" | "bootcamps";

export default function PlatformScreen() {
  const { token } = useAuth();
  const [tab, setTab] = useState<PlatformTab>("opportunities");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [opportunities, setOpportunities] = useState<AdminOpportunityRecord[]>([]);
  const [resources, setResources] = useState<AdminKnowledgeResourceRecord[]>([]);
  const [tracks, setTracks] = useState<AdminCertificationTrackRecord[]>([]);
  const [requests, setRequests] = useState<AdminCertificationRequestRecord[]>([]);
  const [bootcamps, setBootcamps] = useState<AdminBootcampRecord[]>([]);

  async function load() {
    if (!token) return;
    try {
      setLoading(true);
      setError("");
      const [oppData, resourceData, trackData, requestData, bootcampData] = await Promise.all([
        apiRequest<AdminOpportunityRecord[]>("/api/admin/network/opportunities", {}, token),
        apiRequest<AdminKnowledgeResourceRecord[]>("/api/admin/network/knowledge-resources", {}, token),
        apiRequest<AdminCertificationTrackRecord[]>("/api/admin/network/certification-tracks", {}, token),
        apiRequest<AdminCertificationRequestRecord[]>("/api/admin/network/certification-requests?status=pending", {}, token),
        apiRequest<AdminBootcampRecord[]>("/api/admin/network/bootcamps", {}, token)
      ]);
      setOpportunities(oppData);
      setResources(resourceData);
      setTracks(trackData);
      setRequests(requestData);
      setBootcamps(bootcampData);
    } catch (err: any) {
      setError(err?.message || "Failed to load platform controls");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, [token]);

  async function toggleOpportunity(id: string) {
    if (!token) return;
    try {
      await apiRequest(`/api/admin/network/opportunities/${id}/toggle`, { method: "PATCH" }, token);
      await load();
    } catch (err: any) {
      Alert.alert("Update failed", err?.message || "Please try again.");
    }
  }

  async function reviewResource(id: string, action: "approve" | "reject") {
    if (!token) return;
    try {
      await apiRequest(
        `/api/admin/network/knowledge-resources/${id}/review`,
        { method: "PATCH", body: JSON.stringify({ action, reason: action === "reject" ? "Rejected from admin mobile" : "" }) },
        token
      );
      await load();
      Alert.alert("Updated", `Resource ${action}d successfully.`);
    } catch (err: any) {
      Alert.alert("Update failed", err?.message || "Please try again.");
    }
  }

  async function toggleTrack(id: string) {
    if (!token) return;
    try {
      await apiRequest(`/api/admin/network/certification-tracks/${id}/toggle`, { method: "PATCH" }, token);
      await load();
    } catch (err: any) {
      Alert.alert("Update failed", err?.message || "Please try again.");
    }
  }

  async function reviewRequest(id: string, action: "approve" | "reject") {
    if (!token) return;
    try {
      await apiRequest(
        `/api/admin/network/certification-requests/${id}/review`,
        { method: "PATCH", body: JSON.stringify({ action, note: `Reviewed from admin mobile: ${action}` }) },
        token
      );
      await load();
      Alert.alert("Updated", `Certification request ${action}d successfully.`);
    } catch (err: any) {
      Alert.alert("Update failed", err?.message || "Please try again.");
    }
  }

  async function toggleBootcamp(id: string) {
    if (!token) return;
    try {
      await apiRequest(`/api/admin/network/bootcamps/${id}/toggle`, { method: "PATCH" }, token);
      await load();
    } catch (err: any) {
      Alert.alert("Update failed", err?.message || "Please try again.");
    }
  }

  const stats = useMemo(
    () => [
      { label: "Opportunities", value: opportunities.length, tone: "accent" as const },
      { label: "Pending Resources", value: resources.filter((item) => item.approvalStatus === "pending").length, tone: "warning" as const },
      { label: "Pending Certs", value: requests.length, tone: "danger" as const },
      { label: "Bootcamps", value: bootcamps.filter((item) => item.isActive).length, tone: "primary" as const }
    ],
    [opportunities, resources, requests, bootcamps]
  );

  const emptyTitle =
    tab === "opportunities"
      ? "No opportunities"
      : tab === "resources"
        ? "No knowledge resources"
        : tab === "certifications"
          ? "No certification items"
          : "No bootcamps";

  if (loading && !opportunities.length && !resources.length && !tracks.length && !requests.length && !bootcamps.length) {
    return <LoadingState label="Loading platform controls..." />;
  }

  return (
    <Screen>
      <AdminTopBar title="Platform" />
      <HeroCard
        title="Platform Modules"
        subtitle="Control opportunities, knowledge resources, certifications, and bootcamps from one mobile admin surface."
        rightLabel="Modules"
      />
      <StatGrid items={stats} />

      <SectionTitle title="Control modules" subtitle="These are the deeper ecosystem levers beyond mentorship and community feed moderation." />
      <ChipTabs
        value={tab}
        onChange={setTab}
        options={[
          { label: "Opportunities", value: "opportunities" },
          { label: "Resources", value: "resources" },
          { label: "Certifications", value: "certifications" },
          { label: "Bootcamps", value: "bootcamps" }
        ]}
      />

      {error ? (
        <Card>
          <Text style={styles.errorText}>{error}</Text>
          <ActionButton label="Retry" tone="warning" onPress={load} />
        </Card>
      ) : null}

      {tab === "opportunities" && !opportunities.length ? <EmptyState title={emptyTitle} subtitle="Opportunity listings will appear here for admin control." /> : null}
      {tab === "resources" && !resources.length ? <EmptyState title={emptyTitle} subtitle="Knowledge resources will appear here for approval and feature control." /> : null}
      {tab === "certifications" && !tracks.length && !requests.length ? <EmptyState title={emptyTitle} subtitle="Certification tracks and requests will appear here." /> : null}
      {tab === "bootcamps" && !bootcamps.length ? <EmptyState title={emptyTitle} subtitle="Bootcamp programs will appear here for admin review." /> : null}

      {tab === "opportunities"
        ? opportunities.map((item) => (
            <Card key={item._id}>
              <Text style={styles.title}>{item.title}</Text>
              <Text style={styles.subtitle}>{item.company || "ORIN"} | {item.type || "opportunity"} | {item.isActive ? "active" : "inactive"}</Text>
              <Label>Description</Label>
              <Value muted>{item.description || "No description"}</Value>
              <View style={styles.row}>
                <View style={styles.flexOne}>
                  <Label>Mode / location</Label>
                  <Value muted>{item.mode || "Not set"} | {item.location || "Not set"}</Value>
                </View>
                <View style={styles.flexOne}>
                  <Label>Deadline</Label>
                  <Value muted>{item.applicationDeadline ? new Date(item.applicationDeadline).toLocaleDateString() : "Open"}</Value>
                </View>
              </View>
              <View style={styles.actions}>
                {item.applicationUrl ? <ActionButton label="Open Link" onPress={() => Linking.openURL(item.applicationUrl!)} /> : null}
                <ActionButton label={item.isActive ? "Disable" : "Activate"} tone="warning" onPress={() => toggleOpportunity(item._id)} />
              </View>
            </Card>
          ))
        : null}

      {tab === "resources"
        ? resources.map((item) => (
            <Card key={item._id}>
              <Text style={styles.title}>{item.title}</Text>
              <Text style={styles.subtitle}>{item.domain || "General"} | {item.type || "resource"} | {item.approvalStatus || "pending"}</Text>
              <Label>Description</Label>
              <Value muted>{item.description || "No description"}</Value>
              <View style={styles.row}>
                <View style={styles.flexOne}>
                  <Label>Difficulty</Label>
                  <Value muted>{item.difficulty || "Not set"}</Value>
                </View>
                <View style={styles.flexOne}>
                  <Label>Format</Label>
                  <Value muted>{item.format || "Not set"}</Value>
                </View>
              </View>
              <View style={styles.actions}>
                {item.url ? <ActionButton label="Open Resource" onPress={() => Linking.openURL(item.url!)} /> : null}
                {item.approvalStatus !== "approved" ? <ActionButton label="Approve" tone="primary" onPress={() => reviewResource(item._id, "approve")} /> : null}
                {item.approvalStatus !== "rejected" ? <ActionButton label="Reject" tone="danger" onPress={() => reviewResource(item._id, "reject")} /> : null}
              </View>
            </Card>
          ))
        : null}

      {tab === "certifications"
        ? (
          <>
            {requests.map((item) => (
              <Card key={item._id}>
                <Text style={styles.title}>{item.trackId?.title || "Certification request"}</Text>
                <Text style={styles.subtitle}>{item.userId?.name || "User"} | {item.status || "pending"}</Text>
                <View style={styles.row}>
                  <View style={styles.flexOne}>
                    <Label>Domain / level</Label>
                    <Value muted>{item.trackId?.domain || "General"} | {item.trackId?.level || "Not set"}</Value>
                  </View>
                  <View style={styles.flexOne}>
                    <Label>Requested</Label>
                    <Value muted>{item.createdAt ? new Date(item.createdAt).toLocaleDateString() : "Unknown"}</Value>
                  </View>
                </View>
                <View style={styles.actions}>
                  <ActionButton label="Approve" tone="primary" onPress={() => reviewRequest(item._id, "approve")} />
                  <ActionButton label="Reject" tone="danger" onPress={() => reviewRequest(item._id, "reject")} />
                </View>
              </Card>
            ))}
            {tracks.map((item) => (
              <Card key={item._id}>
                <Text style={styles.title}>{item.title}</Text>
                <Text style={styles.subtitle}>{item.domain || "General"} | {item.level || "Beginner"} | {item.isActive ? "active" : "inactive"}</Text>
                <Label>Description</Label>
                <Value muted>{item.description || "No description"}</Value>
                <View style={styles.actions}>
                  {item.coverImageUrl ? <ActionButton label="Open Cover" onPress={() => Linking.openURL(item.coverImageUrl!)} /> : null}
                  <ActionButton label={item.isActive ? "Disable" : "Activate"} tone="warning" onPress={() => toggleTrack(item._id)} />
                </View>
              </Card>
            ))}
          </>
        )
        : null}

      {tab === "bootcamps"
        ? bootcamps.map((item) => (
            <Card key={item._id}>
              <Text style={styles.title}>{item.title}</Text>
              <Text style={styles.subtitle}>{item.domain || "General"} | {item.mode || "Not set"} | {item.isActive ? "active" : "inactive"}</Text>
              <Label>Description</Label>
              <Value muted>{item.description || "No description"}</Value>
              <View style={styles.row}>
                <View style={styles.flexOne}>
                  <Label>Starts</Label>
                  <Value muted>{new Date(item.startsAt).toLocaleDateString()}</Value>
                </View>
                <View style={styles.flexOne}>
                  <Label>Seats</Label>
                  <Value muted>{item.seats || 0}</Value>
                </View>
              </View>
              <View style={styles.actions}>
                {item.registrationUrl ? <ActionButton label="Open Registration" onPress={() => Linking.openURL(item.registrationUrl!)} /> : null}
                {item.coverImageUrl ? <ActionButton label="Open Cover" onPress={() => Linking.openURL(item.coverImageUrl!)} /> : null}
                <ActionButton label={item.isActive ? "Disable" : "Activate"} tone="warning" onPress={() => toggleBootcamp(item._id)} />
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
