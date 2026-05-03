import React, { useEffect, useState } from "react";
import { Alert, StyleSheet, Text, TextInput, View } from "react-native";
import { ActionButton, Card, HeroCard, Label, LoadingState, Screen, SectionTitle, Value } from "@/components/ui";
import { colors, spacing } from "@/constants/theme";
import { useAuth } from "@/context/AuthContext";
import { apiBaseUrl, apiRequest } from "@/lib/api";
import { AdminNotificationRecord, Demographics, MentorProfileRecord } from "@/lib/types";
import { AdminTopBar } from "@/components/admin-nav";

type InstitutionSummary = {
  name: string;
  district: string;
  teachers: number;
  heads: number;
  globalMentors: number;
  classes: string[];
};

export default function MoreScreen() {
  const { user, logout, token } = useAuth();
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState<AdminNotificationRecord[]>([]);
  const [mentors, setMentors] = useState<MentorProfileRecord[]>([]);
  const [demographics, setDemographics] = useState<Demographics | null>(null);
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function load() {
    if (!token) return;
    try {
      setLoading(true);
      setError("");
      const [notificationData, mentorData, demographicsData] = await Promise.all([
        apiRequest<AdminNotificationRecord[]>("/api/admin/notifications", {}, token),
        apiRequest<MentorProfileRecord[]>("/api/admin/mentors/profiles", {}, token),
        apiRequest<Demographics>("/api/admin/demographics", {}, token)
      ]);
      setNotifications(notificationData);
      setMentors(mentorData);
      setDemographics(demographicsData);
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

  const teacherCount = mentors.filter((item) => item.mentorOrgRole === "institution_teacher").length;
  const headCount = mentors.filter((item) => item.mentorOrgRole === "organisation_head").length;
  const globalMentorCount = mentors.filter((item) => !item.mentorOrgRole || item.mentorOrgRole === "global_mentor").length;
  const institutionMap = new Map<string, InstitutionSummary>();

  mentors.forEach((mentor) => {
    const institutionName = String(mentor.institutionName || "").trim();
    if (!institutionName) return;
    const current = institutionMap.get(institutionName) || {
      name: institutionName,
      district: mentor.institutionDistrict || "",
      teachers: 0,
      heads: 0,
      globalMentors: 0,
      classes: []
    };
    if (mentor.mentorOrgRole === "organisation_head") current.heads += 1;
    else if (mentor.mentorOrgRole === "institution_teacher") current.teachers += 1;
    else current.globalMentors += 1;
    current.classes = Array.from(new Set([...current.classes, ...(mentor.assignedClasses || [])].filter(Boolean)));
    institutionMap.set(institutionName, current);
  });

  const institutions = Array.from(institutionMap.values()).sort((a, b) => (b.teachers + b.heads) - (a.teachers + a.heads));
  const topColleges = demographics?.regionalReach?.studentColleges || [];

  if (loading && !notifications.length && !mentors.length) {
    return <LoadingState label="Loading institution control..." />;
  }

  return (
    <Screen>
      <AdminTopBar title="Institutions" />
      <HeroCard
        title="Institution Control"
        subtitle="Track schools, colleges, organisation heads, class teachers, assigned classes, and institution reach from the admin phone app."
        rightLabel="Schools"
      />

      <SectionTitle title="Institution snapshot" subtitle="This is the platform layer above organisation heads and class teachers." />
      <View style={styles.metricGrid}>
        <Card style={styles.metricCard}>
          <Text style={styles.metricValue}>{institutions.length}</Text>
          <Text style={styles.metricLabel}>Institutions linked</Text>
        </Card>
        <Card style={styles.metricCard}>
          <Text style={styles.metricValue}>{headCount}</Text>
          <Text style={styles.metricLabel}>Organisation heads</Text>
        </Card>
        <Card style={styles.metricCard}>
          <Text style={styles.metricValue}>{teacherCount}</Text>
          <Text style={styles.metricLabel}>Class teachers</Text>
        </Card>
        <Card style={styles.metricCard}>
          <Text style={styles.metricValue}>{globalMentorCount}</Text>
          <Text style={styles.metricLabel}>Global mentors</Text>
        </Card>
      </View>

      <SectionTitle title="Institution directory" subtitle="Linked institutions are derived from approved/pending mentor profiles in this first mobile slice." />
      {institutions.length ? (
        institutions.slice(0, 20).map((item) => (
          <Card key={item.name}>
            <Text style={styles.institutionTitle}>{item.name}</Text>
            <Text style={styles.institutionMeta}>{item.district || "District not set"}</Text>
            <View style={styles.infoRow}>
              <View style={styles.infoCol}>
                <Label>Heads</Label>
                <Value>{item.heads}</Value>
              </View>
              <View style={styles.infoCol}>
                <Label>Teachers</Label>
                <Value>{item.teachers}</Value>
              </View>
            </View>
            <Label>Classes covered</Label>
            <Value muted>{item.classes.length ? item.classes.join(", ") : "No classes assigned yet"}</Value>
          </Card>
        ))
      ) : (
        <Card>
          <Text style={styles.institutionTitle}>No linked institutions yet</Text>
          <Text style={styles.institutionMeta}>When teachers or organisation heads select institutions, they will appear here.</Text>
        </Card>
      )}

      <SectionTitle title="Student institution reach" subtitle="Top institutions from the student profile demographics endpoint." />
      {topColleges.slice(0, 8).map((item) => (
        <Card key={item.name}>
          <Text style={styles.institutionTitle}>{item.name}</Text>
          <Text style={styles.institutionMeta}>{item.count} student profile{item.count === 1 ? "" : "s"}</Text>
        </Card>
      ))}

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
        <Value muted>Approvals, institution control, people oversight, global moderation, and operational visibility for ORIN.</Value>
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
  metricGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.md,
    marginBottom: spacing.md
  },
  metricCard: {
    width: "47%",
    minWidth: 142
  },
  metricValue: {
    color: colors.primary,
    fontSize: 28,
    fontWeight: "900"
  },
  metricLabel: {
    color: colors.textMuted,
    marginTop: 4,
    lineHeight: 18
  },
  institutionTitle: {
    color: colors.text,
    fontSize: 18,
    fontWeight: "900"
  },
  institutionMeta: {
    color: colors.textMuted,
    marginTop: 4,
    marginBottom: spacing.md,
    lineHeight: 20
  },
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
