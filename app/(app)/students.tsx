import React, { useEffect, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { ActionButton, Card, EmptyState, HeroCard, Label, LoadingState, Screen, SectionTitle, Value } from "@/components/ui";
import { colors, spacing } from "@/constants/theme";
import { useAuth } from "@/context/AuthContext";
import { apiRequest } from "@/lib/api";
import { AdminTopBar } from "@/components/admin-nav";

type StudentRecord = {
  _id: string;
  name: string;
  email: string;
  role: "student";
  createdAt?: string;
  updatedAt?: string;
};

export default function StudentsScreen() {
  const { token } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [students, setStudents] = useState<StudentRecord[]>([]);

  async function load() {
    if (!token) return;
    try {
      setLoading(true);
      setError("");
      const data = await apiRequest<StudentRecord[]>("/api/admin/students", {}, token);
      setStudents(data);
    } catch (err: any) {
      setError(err?.message || "Failed to load students");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, [token]);

  if (loading && !students.length) {
    return <LoadingState label="Loading students..." />;
  }

  return (
    <Screen>
      <AdminTopBar title="Students" />
      <HeroCard
        title="Students Directory"
        subtitle="See all registered students from mobile so you can inspect growth, support, and complaint ownership quickly."
        rightLabel="Students"
      />

      <SectionTitle title="Registered students" subtitle="This mirrors the student list you use on the web dashboard, but in a mobile-friendly card flow." />

      {error ? (
        <Card>
          <Text style={styles.errorText}>{error}</Text>
          <ActionButton label="Retry" tone="warning" onPress={load} />
        </Card>
      ) : null}

      {!students.length ? <EmptyState title="No students found" subtitle="Registered students will appear here once the backend returns them." /> : null}

      {students.map((student) => (
        <Card key={student._id}>
          <Text style={styles.title}>{student.name}</Text>
          <Text style={styles.subtitle}>{student.email}</Text>
          <View style={styles.row}>
            <View style={styles.flexOne}>
              <Label>Role</Label>
              <Value>{student.role}</Value>
            </View>
            <View style={styles.flexOne}>
              <Label>Joined</Label>
              <Value muted>{student.createdAt ? new Date(student.createdAt).toLocaleDateString() : "Unknown"}</Value>
            </View>
          </View>
          <View style={styles.row}>
            <View style={styles.flexOne}>
              <Label>Last updated</Label>
              <Value muted>{student.updatedAt ? new Date(student.updatedAt).toLocaleDateString() : "Unknown"}</Value>
            </View>
          </View>
        </Card>
      ))}
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
  errorText: {
    color: colors.danger,
    fontWeight: "700",
    marginBottom: spacing.sm
  }
});
