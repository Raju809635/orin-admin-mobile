export type Role = "student" | "mentor" | "admin";

export type AuthUser = {
  id: string;
  name: string;
  email: string;
  role: Role;
  isAdmin?: boolean;
  approvalStatus?: "pending" | "approved" | "rejected";
  primaryCategory?: string;
  subCategory?: string;
};

export type LoginResponse = {
  token: string;
  refreshToken: string;
  user: AuthUser;
};

export type Demographics = {
  totals: {
    users: number;
    bookings: number;
    pendingMentors: number;
    approvedMentors: number;
  };
  roles: {
    students: number;
    mentors: number;
  };
  bookings: {
    pending: number;
    approved: number;
    rejected: number;
  };
  mentorCategories: Array<{ category: string; count: number }>;
  studentInterests: Array<{ category: string; count: number }>;
};

export type NetworkAdminOverview = {
  posts: {
    total: number;
    public: number;
    private: number;
  };
  network: {
    pendingConnections: number;
    acceptedConnections: number;
    follows: number;
  };
  communities: {
    activeGroups: number;
    activeChallenges: number;
    upcomingLiveSessions: number;
  };
};

export type ManualPaymentRecord = {
  _id: string;
  date: string;
  time: string;
  amount: number;
  currency?: string;
  paymentScreenshot?: string;
  transactionReference?: string;
  paymentStatus: "pending" | "waiting_verification" | "verified" | "rejected" | "paid";
  status: "pending" | "payment_pending" | "confirmed" | "approved" | "completed" | "cancelled" | "rejected";
  platformFeeAmount?: number;
  mentorPayoutAmount?: number;
  createdAt: string;
  studentId?: { _id: string; name: string; email: string };
  mentorId?: { _id: string; name: string; email: string };
};

export type SessionPayoutRecord = {
  _id: string;
  date: string;
  time: string;
  amount: number;
  currency?: string;
  paymentStatus: "pending" | "waiting_verification" | "verified" | "rejected" | "paid";
  sessionStatus: "booked" | "confirmed" | "completed";
  status: "pending" | "payment_pending" | "confirmed" | "approved" | "completed" | "cancelled" | "rejected";
  platformFeeAmount: number;
  mentorPayoutAmount: number;
  payoutStatus: "not_ready" | "pending" | "paid" | "issue_reported";
  mentorPayoutConfirmationStatus: "not_ready" | "pending" | "confirmed" | "issue_reported";
  payoutPaidAt?: string | null;
  payoutReference?: string;
  payoutNote?: string;
  mentorPayoutIssueNote?: string;
  payoutEligible?: boolean;
  hasMentorPaymentDetails?: boolean;
  canAdminMarkPayoutPaid?: boolean;
  studentId?: { _id: string; name: string; email: string };
  mentorId?: { _id: string; name: string; email: string };
  mentorPaymentDetails?: {
    upiId?: string;
    qrCodeUrl?: string;
    phoneNumber?: string;
    title?: string;
    company?: string;
  };
  payoutPaidBy?: { _id: string; name: string; email: string; role: Role };
};

export type AdminLiveSessionRecord = {
  _id: string;
  title: string;
  topic?: string;
  description?: string;
  startsAt: string;
  durationMinutes?: number;
  sessionMode?: "free" | "paid";
  price?: number;
  currency?: string;
  maxParticipants?: number;
  approvalStatus?: "pending" | "approved" | "rejected";
  adminReviewNote?: string;
  isCancelled: boolean;
  meetingLink?: string;
  reviewedBy?: { _id: string; name: string; email: string; role: Role };
  mentorId?: { _id: string; name: string; email: string; role: Role };
  bookingStats?: {
    totalBookings: number;
    paidBookings: number;
    pendingBookings: number;
  };
};

export type AdminSprintRecord = {
  _id: string;
  title: string;
  domain?: string;
  description?: string;
  posterImageUrl?: string;
  curriculumDocumentUrl?: string;
  curriculumFileType?: string;
  startDate: string;
  endDate: string;
  durationWeeks?: number;
  totalLiveSessions?: number;
  sessionMode?: "free" | "paid";
  price?: number;
  currency?: string;
  minParticipants?: number;
  maxParticipants?: number;
  approvalStatus?: "pending" | "approved" | "rejected";
  adminReviewNote?: string;
  isCancelled: boolean;
  reviewedBy?: { _id: string; name: string; email: string; role: Role };
  mentorId?: { _id: string; name: string; email: string; role: Role };
  enrollmentStats?: {
    totalEnrollments: number;
    paidEnrollments: number;
    pendingEnrollments: number;
    grossRevenue?: number;
    orinRevenue?: number;
    mentorRevenue?: number;
    payoutPendingCount?: number;
    payoutPaidCount?: number;
    payoutIssueCount?: number;
  };
};

export type AdminSprintPayoutRecord = {
  _id: string;
  amount: number;
  currency?: string;
  paymentStatus: "pending" | "paid" | "failed" | "cancelled";
  platformFeeAmount: number;
  mentorPayoutAmount: number;
  payoutStatus: "not_ready" | "pending" | "paid" | "issue_reported";
  mentorPayoutConfirmationStatus: "not_ready" | "pending" | "confirmed" | "issue_reported";
  payoutPaidAt?: string | null;
  payoutReference?: string;
  payoutNote?: string;
  mentorPayoutIssueNote?: string;
  payoutEligible?: boolean;
  hasMentorPaymentDetails?: boolean;
  canAdminMarkPayoutPaid?: boolean;
  studentId?: { _id: string; name: string; email: string };
  mentorId?: { _id: string; name: string; email: string; role: Role };
  sprintId?: {
    _id: string;
    title: string;
    startDate: string;
    endDate: string;
    sessionMode?: "free" | "paid";
    price?: number;
    currency?: string;
    posterImageUrl?: string;
  };
  mentorPaymentDetails?: {
    upiId?: string;
    qrCodeUrl?: string;
    phoneNumber?: string;
    title?: string;
    company?: string;
  };
  payoutPaidBy?: { _id: string; name: string; email: string; role: Role };
};

export type PendingMentorRecord = {
  _id: string;
  name: string;
  email: string;
  role: "mentor";
  approvalStatus: "pending" | "approved" | "rejected";
  primaryCategory?: string;
  subCategory?: string;
  specializations?: string[];
  createdAt: string;
};

export type MentorProfileRecord = {
  _id: string;
  name: string;
  email: string;
  approvalStatus?: "pending" | "approved" | "rejected";
  status?: string;
  createdAt?: string;
  profilePhotoUrl?: string;
  phoneNumber?: string;
  title?: string;
  company?: string;
  experienceYears?: number;
  primaryCategory?: string;
  subCategory?: string;
  specializations?: string[];
  sessionPrice?: number;
  about?: string;
  linkedInUrl?: string;
  payoutUpiId?: string;
  payoutQrCodeUrl?: string;
  payoutPhoneNumber?: string;
  weeklyAvailabilitySlots?: Array<{
    day?: string;
    startTime?: string;
    endTime?: string;
  }>;
  rating?: number;
  totalSessionsConducted?: number;
};

export type CollaborateApplicationRecord = {
  _id: string;
  fullName?: string;
  email?: string;
  phoneNumber?: string;
  organization?: string;
  role?: string;
  collaborationType?: string;
  proposal?: string;
  status: "pending" | "approved" | "rejected";
  adminNotes?: string;
  reviewedAt?: string;
  createdAt: string;
  reviewedBy?: { _id: string; name: string; email: string };
};

export type ComplaintRecord = {
  _id: string;
  subject?: string;
  message?: string;
  category?: string;
  priority?: string;
  status?: string;
  adminResponse?: string;
  createdAt: string;
  updatedAt?: string;
  student?: { _id: string; name: string; email: string; role: Role };
  respondedBy?: { _id: string; name: string; email: string; role: Role };
};

export type AdminNotificationRecord = {
  _id: string;
  title: string;
  message: string;
  type?: string;
  targetRole?: string;
  createdAt: string;
  sentBy?: { _id: string; name: string; email: string };
  recipient?: { _id: string; name: string; email: string; role: Role };
};

export type AdminFeedPostRecord = {
  _id: string;
  content?: string;
  category?: string;
  visibility?: string;
  createdAt: string;
  media?: string[];
  authorId?: { _id: string; name: string; email: string; role: Role };
  likeCount?: number;
  commentCount?: number;
};

export type AdminChallengeRecord = {
  _id: string;
  title: string;
  domain?: string;
  description?: string;
  bannerImageUrl?: string;
  prize?: string;
  deadline?: string;
  submissionType?: string;
  skills?: string[];
  tasks?: string[];
  isActive?: boolean;
  isFeatured?: boolean;
  createdAt?: string;
  updatedAt?: string;
};
