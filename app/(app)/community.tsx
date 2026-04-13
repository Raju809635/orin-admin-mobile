import React, { useEffect, useMemo, useState } from "react";
import { Alert, Linking, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { ActionButton, Card, ChipTabs, EmptyState, FormField, HeroCard, Label, LoadingState, Screen, SectionTitle, StatGrid, Value } from "@/components/ui";
import { colors, spacing } from "@/constants/theme";
import { useAuth } from "@/context/AuthContext";
import { apiRequest } from "@/lib/api";
import { AdminChallengeRecord, AdminChallengeSubmissionRecord, AdminFeedPostRecord, AdminSprintRecord } from "@/lib/types";
import { AdminTopBar } from "@/components/admin-nav";
import { pickAndUploadImage } from "@/lib/uploads";

type CommunityTab = "feed" | "challenges" | "sprints";

export default function CommunityScreen() {
  const { token } = useAuth();
  const [tab, setTab] = useState<CommunityTab>("feed");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [posts, setPosts] = useState<AdminFeedPostRecord[]>([]);
  const [challenges, setChallenges] = useState<AdminChallengeRecord[]>([]);
  const [challengeSubmissions, setChallengeSubmissions] = useState<AdminChallengeSubmissionRecord[]>([]);
  const [selectedChallengeId, setSelectedChallengeId] = useState("");
  const [reviewingSubmissionId, setReviewingSubmissionId] = useState("");
  const [reviewForm, setReviewForm] = useState({
    rank: "",
    xpAwarded: "",
    notes: "",
    certificateTitle: "",
    issueCertificate: false
  });
  const [sprints, setSprints] = useState<AdminSprintRecord[]>([]);
  const [creatingChallenge, setCreatingChallenge] = useState(false);
  const [uploadingBanner, setUploadingBanner] = useState(false);
  const [challengeForm, setChallengeForm] = useState({
    title: "",
    domain: "",
    description: "",
    prize: "",
    deadline: "",
    submissionType: "",
    bannerImageUrl: "",
    skillsCsv: "",
    tasksCsv: ""
  });

  async function load() {
    if (!token) return;
    try {
      setLoading(true);
      setError("");
      const [postData, challengeData, sprintData] = await Promise.all([
        apiRequest<AdminFeedPostRecord[]>("/api/admin/network/posts", {}, token),
        apiRequest<AdminChallengeRecord[]>("/api/admin/network/challenges", {}, token),
        apiRequest<AdminSprintRecord[]>("/api/admin/network/sprints", {}, token)
      ]);
      setPosts(postData);
      setChallenges(challengeData);
      setSprints(sprintData);
    } catch (err: any) {
      setError(err?.message || "Failed to load community controls");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, [token]);

  async function deletePost(id: string) {
    if (!token) return;
    try {
      await apiRequest(`/api/admin/network/posts/${id}`, { method: "DELETE" }, token);
      await load();
      Alert.alert("Removed", "Post deleted from the feed.");
    } catch (err: any) {
      Alert.alert("Delete failed", err?.message || "Please try again.");
    }
  }

  async function toggleChallenge(id: string) {
    if (!token) return;
    try {
      await apiRequest(`/api/admin/network/challenges/${id}/toggle`, { method: "PATCH" }, token);
      await load();
    } catch (err: any) {
      Alert.alert("Update failed", err?.message || "Please try again.");
    }
  }

  async function createChallenge() {
    if (!token) return;
    if (!challengeForm.title.trim() || !challengeForm.deadline.trim()) {
      Alert.alert("Missing fields", "Title and deadline are required.");
      return;
    }
    try {
      setCreatingChallenge(true);
      await apiRequest(
        "/api/admin/network/challenges",
        {
          method: "POST",
          body: JSON.stringify({
            title: challengeForm.title.trim(),
            domain: challengeForm.domain.trim(),
            description: challengeForm.description.trim(),
            prize: challengeForm.prize.trim(),
            deadline: challengeForm.deadline.trim(),
            submissionType: challengeForm.submissionType.trim(),
            bannerImageUrl: challengeForm.bannerImageUrl.trim(),
            skills: challengeForm.skillsCsv.split(",").map((item) => item.trim()).filter(Boolean),
            tasks: challengeForm.tasksCsv.split(",").map((item) => item.trim()).filter(Boolean),
            isFeatured: true
          })
        },
        token
      );
      setChallengeForm({
        title: "",
        domain: "",
        description: "",
        prize: "",
        deadline: "",
        submissionType: "",
        bannerImageUrl: "",
        skillsCsv: "",
        tasksCsv: ""
      });
      await load();
      Alert.alert("Created", "Challenge campaign is live in ORIN admin.");
      setTab("challenges");
    } catch (err: any) {
      Alert.alert("Create failed", err?.message || "Please try again.");
    } finally {
      setCreatingChallenge(false);
    }
  }

  async function uploadChallengeBanner() {
    if (!token) return;
    try {
      setUploadingBanner(true);
      const url = await pickAndUploadImage(token);
      if (url) {
        setChallengeForm((prev) => ({ ...prev, bannerImageUrl: url }));
      }
    } catch (err: any) {
      Alert.alert("Upload failed", err?.message || "Please try again.");
    } finally {
      setUploadingBanner(false);
    }
  }

  async function loadChallengeSubmissions(challengeId: string) {
    if (!token) return;
    try {
      const rows = await apiRequest<AdminChallengeSubmissionRecord[]>(
        `/api/admin/network/challenges/${challengeId}/submissions`,
        {},
        token
      );
      setSelectedChallengeId(challengeId);
      setChallengeSubmissions(rows || []);
    } catch (err: any) {
      Alert.alert("Load failed", err?.message || "Please try again.");
    }
  }

  function startReview(submission: AdminChallengeSubmissionRecord) {
    setReviewingSubmissionId(submission._id);
    setReviewForm({
      rank: submission.mentorReview?.rank ? String(submission.mentorReview?.rank || "") : "",
      xpAwarded: submission.mentorReview?.xpAwarded ? String(submission.mentorReview?.xpAwarded || "") : "",
      notes: submission.mentorReview?.notes || "",
      certificateTitle: "",
      issueCertificate: false
    });
  }

  async function submitReview(submission: AdminChallengeSubmissionRecord, action: "accept" | "reject" | "review") {
    if (!token) return;
    try {
      await apiRequest(
        `/api/network/challenges/${submission.challengeId}/submissions/${submission._id}/review`,
        {
          method: "PATCH",
          body: JSON.stringify({
            action,
            rank: Number(reviewForm.rank || 0),
            xpAwarded: Number(reviewForm.xpAwarded || 0),
            notes: reviewForm.notes,
            issueCertificate: reviewForm.issueCertificate,
            certificateTitle: reviewForm.certificateTitle
          })
        },
        token
      );
      setReviewingSubmissionId("");
      setReviewForm({ rank: "", xpAwarded: "", notes: "", certificateTitle: "", issueCertificate: false });
      await loadChallengeSubmissions(submission.challengeId);
      Alert.alert("Updated", `Submission ${action}ed successfully.`);
    } catch (err: any) {
      Alert.alert("Review failed", err?.message || "Please try again.");
    }
  }

  async function reviewSprint(id: string, action: "approve" | "reject") {
    if (!token) return;
    try {
      await apiRequest(
        `/api/admin/network/sprints/${id}/review`,
        {
          method: "PATCH",
          body: JSON.stringify({ action, note: `Reviewed from ORIN Admin Mobile: ${action}` })
        },
        token
      );
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
      Alert.alert("Update failed", err?.message || "Please try again.");
    }
  }

  const stats = useMemo(
    () => [
      { label: "Feed Posts", value: posts.length, tone: "accent" as const },
      { label: "Active Challenges", value: challenges.filter((item) => item.isActive).length, tone: "primary" as const },
      { label: "Pending Sprints", value: sprints.filter((item) => item.approvalStatus === "pending").length, tone: "warning" as const },
      { label: "Featured", value: challenges.filter((item) => item.isFeatured).length, tone: "danger" as const }
    ],
    [posts, challenges, sprints]
  );

  if (loading && !posts.length && !challenges.length && !sprints.length) {
    return <LoadingState label="Loading community controls..." />;
  }

  return (
    <Screen>
      <AdminTopBar title="Community" />
      <HeroCard
        title="Community Control"
        subtitle="Moderate the feed, keep challenges healthy, and approve the cohort programs students actually see."
        rightLabel="Community"
      />
      <StatGrid items={stats} />

      <SectionTitle title="Community lanes" subtitle="This keeps content moderation and program review fast enough for phone-first admin work." />
      <ChipTabs
        value={tab}
        onChange={setTab}
        options={[
          { label: "Feed", value: "feed" },
          { label: "Challenges", value: "challenges" },
          { label: "Sprints", value: "sprints" }
        ]}
      />

      {tab === "challenges" ? (
        <Card>
          <Text style={styles.createTitle}>Launch Challenge Or Banner Campaign</Text>
          <Text style={styles.createSubtitle}>
            Use the challenge banner and featured flag to place visible ORIN campaigns in front of students.
          </Text>
          <FormField
            label="Title"
            value={challengeForm.title}
            onChangeText={(text) => setChallengeForm((prev) => ({ ...prev, title: text }))}
            placeholder="AI Roadmap Challenge"
          />
          <FormField
            label="Domain"
            value={challengeForm.domain}
            onChangeText={(text) => setChallengeForm((prev) => ({ ...prev, domain: text }))}
            placeholder="Technology & AI"
          />
          <FormField
            label="Description"
            value={challengeForm.description}
            onChangeText={(text) => setChallengeForm((prev) => ({ ...prev, description: text }))}
            placeholder="What should students do?"
            multiline
          />
          <FormField
            label="Prize"
            value={challengeForm.prize}
            onChangeText={(text) => setChallengeForm((prev) => ({ ...prev, prize: text }))}
            placeholder="Certificate + swag + spotlight"
          />
          <FormField
            label="Deadline"
            value={challengeForm.deadline}
            onChangeText={(text) => setChallengeForm((prev) => ({ ...prev, deadline: text }))}
            placeholder="2026-05-01"
            helperText="Use YYYY-MM-DD format for now."
          />
          <FormField
            label="Submission Type"
            value={challengeForm.submissionType}
            onChangeText={(text) => setChallengeForm((prev) => ({ ...prev, submissionType: text }))}
            placeholder="link / document / github"
          />
          <Label>Banner Image</Label>
          <Value muted>{challengeForm.bannerImageUrl ? "Banner uploaded" : "Upload a banner image for the challenge."}</Value>
          <View style={styles.actions}>
            <ActionButton label={uploadingBanner ? "Uploading..." : "Upload Banner"} tone="primary" onPress={uploadChallengeBanner} />
            {challengeForm.bannerImageUrl ? (
              <ActionButton label="Open Banner" onPress={() => Linking.openURL(challengeForm.bannerImageUrl)} />
            ) : null}
          </View>
          <FormField
            label="Skills"
            value={challengeForm.skillsCsv}
            onChangeText={(text) => setChallengeForm((prev) => ({ ...prev, skillsCsv: text }))}
            placeholder="Python, ML, Prompting"
            helperText="Comma-separated skills"
          />
          <FormField
            label="Tasks"
            value={challengeForm.tasksCsv}
            onChangeText={(text) => setChallengeForm((prev) => ({ ...prev, tasksCsv: text }))}
            placeholder="Build prototype, upload demo, share summary"
            helperText="Comma-separated task steps"
          />
          <View style={styles.actions}>
            <ActionButton
              label={creatingChallenge ? "Creating..." : "Create Challenge"}
              tone="primary"
              disabled={creatingChallenge}
              onPress={createChallenge}
            />
          </View>
        </Card>
      ) : null}

      {error ? (
        <Card>
          <Text style={styles.errorText}>{error}</Text>
          <ActionButton label="Retry" onPress={load} tone="warning" />
        </Card>
      ) : null}

      {tab === "feed" && !posts.length ? <EmptyState title="Feed is clear" subtitle="Posts that need admin moderation will show up here." /> : null}
      {tab === "challenges" && !challenges.length ? <EmptyState title="No challenges yet" subtitle="Community challenges will appear here for moderation." /> : null}
      {tab === "sprints" && !sprints.length ? <EmptyState title="No sprints yet" subtitle="Sprint programs will appear here for review and control." /> : null}

      {tab === "feed"
        ? posts.map((post) => (
            <Card key={post._id}>
              <Text style={styles.title}>{post.authorId?.name || "Unknown author"}</Text>
              <Text style={styles.subtitle}>
                {(post.authorId?.role || "member").toUpperCase()} | {new Date(post.createdAt).toLocaleString()}
              </Text>
              <Label>Post</Label>
              <Value muted>{post.content || "No text content"}</Value>
              <View style={styles.row}>
                <View style={styles.flexOne}>
                  <Label>Visibility</Label>
                  <Value>{post.visibility || "public"}</Value>
                </View>
                <View style={styles.flexOne}>
                  <Label>Signals</Label>
                  <Value muted>{post.likeCount || 0} likes | {post.commentCount || 0} comments</Value>
                </View>
              </View>
              <View style={styles.actions}>
                {post.media?.[0] ? <ActionButton label="Open Media" onPress={() => Linking.openURL(post.media![0])} /> : null}
                <ActionButton label="Delete Post" tone="danger" onPress={() => deletePost(post._id)} />
              </View>
            </Card>
          ))
        : null}

      {tab === "challenges"
        ? challenges.map((challenge) => (
            <Card key={challenge._id}>
              <Text style={styles.title}>{challenge.title}</Text>
              <Text style={styles.subtitle}>
                {challenge.domain || "General"} | {challenge.isActive ? "active" : "inactive"}
              </Text>
              <Label>Description</Label>
              <Value muted>{challenge.description || "No description"}</Value>
              <View style={styles.row}>
                <View style={styles.flexOne}>
                  <Label>Prize</Label>
                  <Value muted>{challenge.prize || "Not set"}</Value>
                </View>
                <View style={styles.flexOne}>
                  <Label>Deadline</Label>
                  <Value muted>{challenge.deadline ? new Date(challenge.deadline).toLocaleDateString() : "Not set"}</Value>
                </View>
              </View>
              <View style={styles.actions}>
                {challenge.bannerImageUrl ? <ActionButton label="Open Banner" onPress={() => Linking.openURL(challenge.bannerImageUrl!)} /> : null}
                <ActionButton
                  label={selectedChallengeId === challenge._id ? "Hide Submissions" : "View Submissions"}
                  tone="primary"
                  onPress={() => {
                    if (selectedChallengeId === challenge._id) {
                      setSelectedChallengeId("");
                      setChallengeSubmissions([]);
                    } else {
                      loadChallengeSubmissions(challenge._id);
                    }
                  }}
                />
                <ActionButton label={challenge.isActive ? "Disable" : "Activate"} tone="warning" onPress={() => toggleChallenge(challenge._id)} />
              </View>
            </Card>
          ))
        : null}

      {tab === "challenges" && selectedChallengeId ? (
        <Card>
          <Text style={styles.createTitle}>Challenge Submissions</Text>
          {challengeSubmissions.length === 0 ? (
            <Text style={styles.subtitle}>No submissions yet for this challenge.</Text>
          ) : (
            challengeSubmissions.map((submission) => (
              <View key={submission._id} style={styles.submissionCard}>
                <Text style={styles.title}>{submission.userId?.name || "Student"}</Text>
                <Text style={styles.subtitle}>
                  {submission.userId?.email || "student@orin"} | {submission.status || "submitted"}
                </Text>
                {submission.proofNote ? (
                  <>
                    <Label>Proof Note</Label>
                    <Value muted>{submission.proofNote}</Value>
                  </>
                ) : null}
                {submission.proofLinks?.length ? (
                  <>
                    <Label>Proof Links</Label>
                    {submission.proofLinks.map((link) => (
                      <TouchableOpacity key={link} onPress={() => Linking.openURL(link)}>
                        <Text style={styles.linkText}>{link}</Text>
                      </TouchableOpacity>
                    ))}
                  </>
                ) : null}
                {submission.proofFiles?.length ? (
                  <>
                    <Label>Proof Files</Label>
                    {submission.proofFiles.map((link) => (
                      <TouchableOpacity key={link} onPress={() => Linking.openURL(link)}>
                        <Text style={styles.linkText}>{link}</Text>
                      </TouchableOpacity>
                    ))}
                  </>
                ) : null}

                {reviewingSubmissionId === submission._id ? (
                  <>
                    <FormField
                      label="Rank (1-3)"
                      value={reviewForm.rank}
                      onChangeText={(text) => setReviewForm((prev) => ({ ...prev, rank: text }))}
                      placeholder="1"
                      keyboardType="numeric"
                    />
                    <FormField
                      label="XP Awarded"
                      value={reviewForm.xpAwarded}
                      onChangeText={(text) => setReviewForm((prev) => ({ ...prev, xpAwarded: text }))}
                      placeholder="20"
                      keyboardType="numeric"
                    />
                    <FormField
                      label="Review Notes"
                      value={reviewForm.notes}
                      onChangeText={(text) => setReviewForm((prev) => ({ ...prev, notes: text }))}
                      placeholder="Great submission"
                      multiline
                    />
                    <TouchableOpacity
                      style={[styles.toggleRow, { borderColor: colors.border }]}
                      onPress={() => setReviewForm((prev) => ({ ...prev, issueCertificate: !prev.issueCertificate }))}
                    >
                      <Text style={styles.toggleLabel}>Issue Certificate</Text>
                      <Text style={styles.toggleValue}>{reviewForm.issueCertificate ? "Yes" : "No"}</Text>
                    </TouchableOpacity>
                    {reviewForm.issueCertificate ? (
                      <FormField
                        label="Certificate Title (optional)"
                        value={reviewForm.certificateTitle}
                        onChangeText={(text) => setReviewForm((prev) => ({ ...prev, certificateTitle: text }))}
                        placeholder="Challenge Performance Certificate"
                      />
                    ) : null}
                    <View style={styles.actions}>
                      <ActionButton label="Save Review" tone="primary" onPress={() => submitReview(submission, "review")} />
                      <ActionButton label="Accept" tone="primary" onPress={() => submitReview(submission, "accept")} />
                      <ActionButton label="Reject" tone="danger" onPress={() => submitReview(submission, "reject")} />
                      <ActionButton label="Cancel" tone="warning" onPress={() => setReviewingSubmissionId("")} />
                    </View>
                  </>
                ) : (
                  <View style={styles.actions}>
                    <ActionButton label="Review Submission" tone="primary" onPress={() => startReview(submission)} />
                  </View>
                )}
              </View>
            ))
          )}
        </Card>
      ) : null}

      {tab === "sprints"
        ? sprints.map((item) => (
            <Card key={item._id}>
              <Text style={styles.title}>{item.title}</Text>
              <Text style={styles.subtitle}>
                {item.mentorId?.name || "Mentor"} | {item.approvalStatus || "pending"}
              </Text>
              <View style={styles.row}>
                <View style={styles.flexOne}>
                  <Label>Dates</Label>
                  <Value muted>
                    {new Date(item.startDate).toLocaleDateString()} - {new Date(item.endDate).toLocaleDateString()}
                  </Value>
                </View>
                <View style={styles.flexOne}>
                  <Label>Seats & price</Label>
                  <Value>{item.maxParticipants || 0} max | {item.sessionMode === "paid" ? `INR ${item.price || 0}` : "Free"}</Value>
                </View>
              </View>
              <View style={styles.row}>
                <View style={styles.flexOne}>
                  <Label>Enrollments</Label>
                  <Value>
                    Total {item.enrollmentStats?.totalEnrollments || 0} | Paid {item.enrollmentStats?.paidEnrollments || 0}
                  </Value>
                </View>
                <View style={styles.flexOne}>
                  <Label>Revenue</Label>
                  <Value muted>INR {item.enrollmentStats?.grossRevenue || 0}</Value>
                </View>
              </View>
              <View style={styles.actions}>
                {item.posterImageUrl ? <ActionButton label="Poster" onPress={() => Linking.openURL(item.posterImageUrl!)} /> : null}
                {item.curriculumDocumentUrl ? <ActionButton label="Curriculum" onPress={() => Linking.openURL(item.curriculumDocumentUrl!)} /> : null}
                {item.approvalStatus !== "approved" ? (
                  <ActionButton label="Approve" tone="primary" onPress={() => reviewSprint(item._id, "approve")} />
                ) : null}
                {item.approvalStatus !== "rejected" ? (
                  <ActionButton label="Reject" tone="danger" onPress={() => reviewSprint(item._id, "reject")} />
                ) : null}
                <ActionButton label={item.isCancelled ? "Reopen" : "Cancel"} tone="warning" onPress={() => toggleSprint(item._id)} />
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
  submissionCard: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    padding: spacing.md,
    marginBottom: spacing.md,
    backgroundColor: colors.card
  },
  linkText: {
    color: colors.accent,
    fontWeight: "700",
    marginBottom: 6
  },
  toggleRow: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing.md,
    backgroundColor: colors.card
  },
  toggleLabel: {
    fontWeight: "700",
    color: colors.text
  },
  toggleValue: {
    fontWeight: "800",
    color: colors.accent
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
