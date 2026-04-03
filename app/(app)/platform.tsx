import React, { useEffect, useMemo, useState } from "react";
import { Alert, Linking, StyleSheet, Text, View } from "react-native";
import { ActionButton, Card, ChipTabs, EmptyState, FormField, HeroCard, Label, LoadingState, Screen, SectionTitle, StatGrid, Value } from "@/components/ui";
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
  const [submitting, setSubmitting] = useState(false);
  const [opportunityForm, setOpportunityForm] = useState({
    title: "",
    company: "",
    type: "hackathon",
    role: "",
    location: "",
    mode: "",
    duration: "",
    stipend: "",
    applicationDeadline: "",
    applicationUrl: "",
    description: "",
    logoUrl: "",
    domainTagsCsv: ""
  });
  const [resourceForm, setResourceForm] = useState({
    title: "",
    domain: "",
    type: "career_guide",
    description: "",
    url: "",
    format: "",
    difficulty: "",
    estimatedMinutes: "",
    thumbnailUrl: "",
    learningOutcome: "",
    tagsCsv: ""
  });
  const [trackForm, setTrackForm] = useState({
    title: "",
    level: "Beginner",
    domain: "",
    description: "",
    coverImageUrl: "",
    badgeLabel: "",
    requirementsCsv: ""
  });
  const [issueForm, setIssueForm] = useState({
    userEmail: "",
    title: "",
    domain: "",
    level: "Beginner",
    source: "Admin Verified"
  });
  const [bootcampForm, setBootcampForm] = useState({
    title: "",
    domain: "",
    description: "",
    mode: "",
    coverImageUrl: "",
    registrationUrl: "",
    startsAt: "",
    endsAt: "",
    seats: ""
  });

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

  async function createOpportunity() {
    if (!token) return;
    if (!opportunityForm.title.trim()) {
      Alert.alert("Missing fields", "Title is required.");
      return;
    }
    try {
      setSubmitting(true);
      await apiRequest(
        "/api/admin/network/opportunities",
        {
          method: "POST",
          body: JSON.stringify({
            ...opportunityForm,
            title: opportunityForm.title.trim(),
            company: opportunityForm.company.trim(),
            type: opportunityForm.type.trim(),
            role: opportunityForm.role.trim(),
            location: opportunityForm.location.trim(),
            mode: opportunityForm.mode.trim(),
            duration: opportunityForm.duration.trim(),
            stipend: opportunityForm.stipend.trim(),
            applicationDeadline: opportunityForm.applicationDeadline.trim() || undefined,
            applicationUrl: opportunityForm.applicationUrl.trim(),
            description: opportunityForm.description.trim(),
            logoUrl: opportunityForm.logoUrl.trim(),
            domainTags: opportunityForm.domainTagsCsv.split(",").map((item) => item.trim()).filter(Boolean)
          })
        },
        token
      );
      setOpportunityForm({
        title: "",
        company: "",
        type: "hackathon",
        role: "",
        location: "",
        mode: "",
        duration: "",
        stipend: "",
        applicationDeadline: "",
        applicationUrl: "",
        description: "",
        logoUrl: "",
        domainTagsCsv: ""
      });
      await load();
      Alert.alert("Created", "Opportunity is live for ORIN students.");
    } catch (err: any) {
      Alert.alert("Create failed", err?.message || "Please try again.");
    } finally {
      setSubmitting(false);
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

  async function createResource() {
    if (!token) return;
    if (!resourceForm.title.trim()) {
      Alert.alert("Missing fields", "Title is required.");
      return;
    }
    try {
      setSubmitting(true);
      await apiRequest(
        "/api/admin/network/knowledge-resources",
        {
          method: "POST",
          body: JSON.stringify({
            title: resourceForm.title.trim(),
            domain: resourceForm.domain.trim(),
            type: resourceForm.type.trim(),
            description: resourceForm.description.trim(),
            url: resourceForm.url.trim(),
            format: resourceForm.format.trim(),
            difficulty: resourceForm.difficulty.trim(),
            estimatedMinutes: Number(resourceForm.estimatedMinutes || 0),
            thumbnailUrl: resourceForm.thumbnailUrl.trim(),
            learningOutcome: resourceForm.learningOutcome.trim(),
            tags: resourceForm.tagsCsv.split(",").map((item) => item.trim()).filter(Boolean),
            isFeatured: true
          })
        },
        token
      );
      setResourceForm({
        title: "",
        domain: "",
        type: "career_guide",
        description: "",
        url: "",
        format: "",
        difficulty: "",
        estimatedMinutes: "",
        thumbnailUrl: "",
        learningOutcome: "",
        tagsCsv: ""
      });
      await load();
      Alert.alert("Created", "Knowledge resource added successfully.");
    } catch (err: any) {
      Alert.alert("Create failed", err?.message || "Please try again.");
    } finally {
      setSubmitting(false);
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

  async function createTrack() {
    if (!token) return;
    if (!trackForm.title.trim()) {
      Alert.alert("Missing fields", "Track title is required.");
      return;
    }
    try {
      setSubmitting(true);
      await apiRequest(
        "/api/admin/network/certification-tracks",
        {
          method: "POST",
          body: JSON.stringify({
            title: trackForm.title.trim(),
            level: trackForm.level.trim(),
            domain: trackForm.domain.trim(),
            description: trackForm.description.trim(),
            coverImageUrl: trackForm.coverImageUrl.trim(),
            badgeLabel: trackForm.badgeLabel.trim(),
            requirements: trackForm.requirementsCsv.split(",").map((item) => item.trim()).filter(Boolean)
          })
        },
        token
      );
      setTrackForm({
        title: "",
        level: "Beginner",
        domain: "",
        description: "",
        coverImageUrl: "",
        badgeLabel: "",
        requirementsCsv: ""
      });
      await load();
      Alert.alert("Created", "Certification track is ready for students.");
    } catch (err: any) {
      Alert.alert("Create failed", err?.message || "Please try again.");
    } finally {
      setSubmitting(false);
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

  async function issueCertificate() {
    if (!token) return;
    if (!issueForm.userEmail.trim() || !issueForm.title.trim()) {
      Alert.alert("Missing fields", "User email and certificate title are required.");
      return;
    }
    try {
      setSubmitting(true);
      await apiRequest(
        "/api/admin/network/certificates/issue",
        {
          method: "POST",
          body: JSON.stringify({
            userEmail: issueForm.userEmail.trim().toLowerCase(),
            title: issueForm.title.trim(),
            domain: issueForm.domain.trim(),
            level: issueForm.level.trim(),
            source: issueForm.source.trim()
          })
        },
        token
      );
      setIssueForm({
        userEmail: "",
        title: "",
        domain: "",
        level: "Beginner",
        source: "Admin Verified"
      });
      Alert.alert("Issued", "Admin verified certificate issued successfully.");
    } catch (err: any) {
      Alert.alert("Issue failed", err?.message || "Please try again.");
    } finally {
      setSubmitting(false);
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

  async function createBootcamp() {
    if (!token) return;
    if (!bootcampForm.title.trim() || !bootcampForm.startsAt.trim()) {
      Alert.alert("Missing fields", "Title and start date are required.");
      return;
    }
    try {
      setSubmitting(true);
      await apiRequest(
        "/api/admin/network/bootcamps",
        {
          method: "POST",
          body: JSON.stringify({
            title: bootcampForm.title.trim(),
            domain: bootcampForm.domain.trim(),
            description: bootcampForm.description.trim(),
            mode: bootcampForm.mode.trim(),
            coverImageUrl: bootcampForm.coverImageUrl.trim(),
            registrationUrl: bootcampForm.registrationUrl.trim(),
            startsAt: bootcampForm.startsAt.trim(),
            endsAt: bootcampForm.endsAt.trim() || undefined,
            seats: Number(bootcampForm.seats || 0),
            isFeatured: true
          })
        },
        token
      );
      setBootcampForm({
        title: "",
        domain: "",
        description: "",
        mode: "",
        coverImageUrl: "",
        registrationUrl: "",
        startsAt: "",
        endsAt: "",
        seats: ""
      });
      await load();
      Alert.alert("Created", "Bootcamp published successfully.");
    } catch (err: any) {
      Alert.alert("Create failed", err?.message || "Please try again.");
    } finally {
      setSubmitting(false);
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

      {tab === "opportunities" ? (
        <Card>
          <Text style={styles.createTitle}>Create Opportunity / Hackathon / Competition</Text>
          <Text style={styles.createSubtitle}>Use this for internships, competitions, hackathons, and application drives.</Text>
          <FormField label="Title" value={opportunityForm.title} onChangeText={(text) => setOpportunityForm((prev) => ({ ...prev, title: text }))} placeholder="CodeEdge Hackathon 2026" />
          <FormField label="Company / Organizer" value={opportunityForm.company} onChangeText={(text) => setOpportunityForm((prev) => ({ ...prev, company: text }))} placeholder="Beyond Campuz" />
          <FormField label="Type" value={opportunityForm.type} onChangeText={(text) => setOpportunityForm((prev) => ({ ...prev, type: text }))} placeholder="hackathon / competition / internship / job" />
          <FormField label="Role / Category" value={opportunityForm.role} onChangeText={(text) => setOpportunityForm((prev) => ({ ...prev, role: text }))} placeholder="Frontend, Full-stack, Open Innovation" />
          <FormField label="Location / Mode" value={opportunityForm.location} onChangeText={(text) => setOpportunityForm((prev) => ({ ...prev, location: text }))} placeholder="Hyderabad" />
          <FormField label="Work mode" value={opportunityForm.mode} onChangeText={(text) => setOpportunityForm((prev) => ({ ...prev, mode: text }))} placeholder="Online / Offline / Hybrid" />
          <FormField label="Deadline" value={opportunityForm.applicationDeadline} onChangeText={(text) => setOpportunityForm((prev) => ({ ...prev, applicationDeadline: text }))} placeholder="2026-05-01" helperText="Use YYYY-MM-DD when possible." />
          <FormField label="Apply link" value={opportunityForm.applicationUrl} onChangeText={(text) => setOpportunityForm((prev) => ({ ...prev, applicationUrl: text }))} placeholder="https://..." />
          <FormField label="Banner / Logo URL" value={opportunityForm.logoUrl} onChangeText={(text) => setOpportunityForm((prev) => ({ ...prev, logoUrl: text }))} placeholder="https://..." />
          <FormField label="Domain tags" value={opportunityForm.domainTagsCsv} onChangeText={(text) => setOpportunityForm((prev) => ({ ...prev, domainTagsCsv: text }))} placeholder="Technology & AI, Startup" helperText="Comma-separated tags" />
          <FormField label="Description" value={opportunityForm.description} onChangeText={(text) => setOpportunityForm((prev) => ({ ...prev, description: text }))} placeholder="What students should know before applying" multiline />
          <View style={styles.actions}>
            <ActionButton label={submitting ? "Creating..." : "Create Opportunity"} tone="primary" disabled={submitting} onPress={createOpportunity} />
          </View>
        </Card>
      ) : null}

      {tab === "resources" ? (
        <Card>
          <Text style={styles.createTitle}>Add Knowledge Library Resource</Text>
          <Text style={styles.createSubtitle}>Push curated resources directly into ORIN&apos;s library with admin approval already applied.</Text>
          <FormField label="Title" value={resourceForm.title} onChangeText={(text) => setResourceForm((prev) => ({ ...prev, title: text }))} placeholder="DSA interview question pack" />
          <FormField label="Domain" value={resourceForm.domain} onChangeText={(text) => setResourceForm((prev) => ({ ...prev, domain: text }))} placeholder="Technology & AI" />
          <FormField label="Type" value={resourceForm.type} onChangeText={(text) => setResourceForm((prev) => ({ ...prev, type: text }))} placeholder="interview_questions / roadmap / coding_resource" />
          <FormField label="URL" value={resourceForm.url} onChangeText={(text) => setResourceForm((prev) => ({ ...prev, url: text }))} placeholder="https://..." />
          <FormField label="Thumbnail URL" value={resourceForm.thumbnailUrl} onChangeText={(text) => setResourceForm((prev) => ({ ...prev, thumbnailUrl: text }))} placeholder="https://..." />
          <FormField label="Format / Difficulty" value={resourceForm.format} onChangeText={(text) => setResourceForm((prev) => ({ ...prev, format: text }))} placeholder="pdf / video / article" />
          <FormField label="Difficulty" value={resourceForm.difficulty} onChangeText={(text) => setResourceForm((prev) => ({ ...prev, difficulty: text }))} placeholder="Beginner / Intermediate / Advanced" />
          <FormField label="Estimated minutes" value={resourceForm.estimatedMinutes} onChangeText={(text) => setResourceForm((prev) => ({ ...prev, estimatedMinutes: text }))} placeholder="20" keyboardType="numeric" />
          <FormField label="Tags" value={resourceForm.tagsCsv} onChangeText={(text) => setResourceForm((prev) => ({ ...prev, tagsCsv: text }))} placeholder="DSA, interviews, arrays" />
          <FormField label="Learning outcome" value={resourceForm.learningOutcome} onChangeText={(text) => setResourceForm((prev) => ({ ...prev, learningOutcome: text }))} placeholder="Students will practice..." multiline />
          <FormField label="Description" value={resourceForm.description} onChangeText={(text) => setResourceForm((prev) => ({ ...prev, description: text }))} placeholder="Why this resource matters" multiline />
          <View style={styles.actions}>
            <ActionButton label={submitting ? "Adding..." : "Add Resource"} tone="primary" disabled={submitting} onPress={createResource} />
          </View>
        </Card>
      ) : null}

      {tab === "certifications" ? (
        <>
          <Card>
            <Text style={styles.createTitle}>Create Certification Track</Text>
            <Text style={styles.createSubtitle}>Launch a new ORIN-admin verified certification track students can request and earn.</Text>
            <FormField label="Title" value={trackForm.title} onChangeText={(text) => setTrackForm((prev) => ({ ...prev, title: text }))} placeholder="AI Foundations Track" />
            <FormField label="Domain" value={trackForm.domain} onChangeText={(text) => setTrackForm((prev) => ({ ...prev, domain: text }))} placeholder="Technology & AI" />
            <FormField label="Level" value={trackForm.level} onChangeText={(text) => setTrackForm((prev) => ({ ...prev, level: text }))} placeholder="Beginner" />
            <FormField label="Badge label" value={trackForm.badgeLabel} onChangeText={(text) => setTrackForm((prev) => ({ ...prev, badgeLabel: text }))} placeholder="Admin Verified" />
            <FormField label="Cover image URL" value={trackForm.coverImageUrl} onChangeText={(text) => setTrackForm((prev) => ({ ...prev, coverImageUrl: text }))} placeholder="https://..." />
            <FormField label="Requirements" value={trackForm.requirementsCsv} onChangeText={(text) => setTrackForm((prev) => ({ ...prev, requirementsCsv: text }))} placeholder="Finish quiz, submit task, clear review" helperText="Comma-separated requirements" />
            <FormField label="Description" value={trackForm.description} onChangeText={(text) => setTrackForm((prev) => ({ ...prev, description: text }))} placeholder="What does this certification represent?" multiline />
            <View style={styles.actions}>
              <ActionButton label={submitting ? "Creating..." : "Create Track"} tone="primary" disabled={submitting} onPress={createTrack} />
            </View>
          </Card>

          <Card>
            <Text style={styles.createTitle}>Issue Admin Verified Certificate</Text>
            <Text style={styles.createSubtitle}>Issue a direct certificate to a learner by email for achievements outside the request flow.</Text>
            <FormField label="User email" value={issueForm.userEmail} onChangeText={(text) => setIssueForm((prev) => ({ ...prev, userEmail: text }))} placeholder="student@example.com" autoCapitalize="none" keyboardType="email-address" />
            <FormField label="Certificate title" value={issueForm.title} onChangeText={(text) => setIssueForm((prev) => ({ ...prev, title: text }))} placeholder="Hackathon Finalist" />
            <FormField label="Domain" value={issueForm.domain} onChangeText={(text) => setIssueForm((prev) => ({ ...prev, domain: text }))} placeholder="Technology & AI" />
            <FormField label="Level" value={issueForm.level} onChangeText={(text) => setIssueForm((prev) => ({ ...prev, level: text }))} placeholder="Beginner / Advanced" />
            <FormField label="Source" value={issueForm.source} onChangeText={(text) => setIssueForm((prev) => ({ ...prev, source: text }))} placeholder="Admin Verified" />
            <View style={styles.actions}>
              <ActionButton label={submitting ? "Issuing..." : "Issue Certificate"} tone="primary" disabled={submitting} onPress={issueCertificate} />
            </View>
          </Card>
        </>
      ) : null}

      {tab === "bootcamps" ? (
        <Card>
          <Text style={styles.createTitle}>Create Bootcamp</Text>
          <Text style={styles.createSubtitle}>Publish ORIN bootcamps with seats, registration, and cover art from your phone.</Text>
          <FormField label="Title" value={bootcampForm.title} onChangeText={(text) => setBootcampForm((prev) => ({ ...prev, title: text }))} placeholder="Placement Accelerator" />
          <FormField label="Domain" value={bootcampForm.domain} onChangeText={(text) => setBootcampForm((prev) => ({ ...prev, domain: text }))} placeholder="Career & Placements" />
          <FormField label="Mode" value={bootcampForm.mode} onChangeText={(text) => setBootcampForm((prev) => ({ ...prev, mode: text }))} placeholder="Online / Offline / Hybrid" />
          <FormField label="Starts at" value={bootcampForm.startsAt} onChangeText={(text) => setBootcampForm((prev) => ({ ...prev, startsAt: text }))} placeholder="2026-05-10" helperText="Use YYYY-MM-DD for the start date." />
          <FormField label="Ends at" value={bootcampForm.endsAt} onChangeText={(text) => setBootcampForm((prev) => ({ ...prev, endsAt: text }))} placeholder="2026-06-10" />
          <FormField label="Seats" value={bootcampForm.seats} onChangeText={(text) => setBootcampForm((prev) => ({ ...prev, seats: text }))} placeholder="120" keyboardType="numeric" />
          <FormField label="Registration URL" value={bootcampForm.registrationUrl} onChangeText={(text) => setBootcampForm((prev) => ({ ...prev, registrationUrl: text }))} placeholder="https://..." />
          <FormField label="Cover image URL" value={bootcampForm.coverImageUrl} onChangeText={(text) => setBootcampForm((prev) => ({ ...prev, coverImageUrl: text }))} placeholder="https://..." />
          <FormField label="Description" value={bootcampForm.description} onChangeText={(text) => setBootcampForm((prev) => ({ ...prev, description: text }))} placeholder="Why should students join?" multiline />
          <View style={styles.actions}>
            <ActionButton label={submitting ? "Creating..." : "Create Bootcamp"} tone="primary" disabled={submitting} onPress={createBootcamp} />
          </View>
        </Card>
      ) : null}

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
  createTitle: {
    color: colors.text,
    fontSize: 18,
    fontWeight: "800",
    marginBottom: spacing.xs
  },
  createSubtitle: {
    color: colors.textMuted,
    lineHeight: 21,
    marginBottom: spacing.md
  },
  errorText: {
    color: colors.danger,
    fontWeight: "700",
    marginBottom: spacing.sm
  }
});
