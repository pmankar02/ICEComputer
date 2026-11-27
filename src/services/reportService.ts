import { API_BASE_URL } from "../config/apiConfig";

export interface ReportFilter {
  fromDate?: string;
  toDate?: string;
  course?: string;
  search?: string;
  status?: string;
  category?: string;
  page?: number;
  pageSize?: number;
}

export interface PagedReportResult<T> {
  items: T[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface CourseCountDto {
  courseName: string;
  studentCount: number;
  activeCount: number;
  inactiveCount: number;
}

export interface StudentReportRow {
  studentId: number;
  name: string;
  mobile: string;
  email: string | null;
  gender: string;
  course: string;
  admissionDate: string;
  isActive: boolean;
}

export interface StudentReportResponse {
  summary: {
    totalStudents: number;
    activeStudents: number;
    inactiveStudents: number;
    distinctCourses: number;
    courseBreakdown: CourseCountDto[];
  };
  data: PagedReportResult<StudentReportRow>;
}

export interface AdmissionReportRow {
  studentId: number;
  studentName: string;
  mobile: string;
  course: string;
  admissionDate: string;
  status: string;
}

export interface AdmissionReportResponse {
  summary: {
    totalAdmissions: number;
    todayAdmissions: number;
    thisMonthAdmissions: number;
    courseWiseAdmissions: CourseCountDto[];
    monthlyTrend: { period: string; count: number }[];
  };
  data: PagedReportResult<AdmissionReportRow>;
}

export interface CourseFeeSummary {
  courseName: string;
  studentCount: number;
  totalFees: number;
  paidFees: number;
  pendingFees: number;
}

export interface StudentFeeReportRow {
  studentId: number;
  studentName: string;
  mobile: string;
  course: string;
  totalFees: number;
  paidFees: number;
  remainingFees: number;
  paymentStatus: string;
  createdDate: string;
}

export interface FeePaymentReportRow {
  paymentId: number;
  studentId: number;
  studentName: string;
  course: string;
  amountPaid: number;
  paymentDate: string;
  paymentMode: string;
  notes: string | null;
}

export interface FeesReportResponse {
  summary: {
    totalFees: number;
    totalPaidFees: number;
    pendingFees: number;
    partialPaymentCount: number;
    courseWiseFees: CourseFeeSummary[];
  };
  studentFees: PagedReportResult<StudentFeeReportRow>;
  payments: PagedReportResult<FeePaymentReportRow>;
}

export interface CourseAttendanceSummary {
  courseName: string;
  totalMarked: number;
  presentCount: number;
  absentCount: number;
  lateCount: number;
  attendancePercentage: number;
}

export interface AttendanceReportRow {
  attendanceId: number;
  studentId: number;
  studentName: string;
  course: string;
  attendanceDate: string;
  status: string;
  remarks: string | null;
}

export interface AttendanceReportResponse {
  summary: {
    totalRecords: number;
    todayMarked: number;
    presentCount: number;
    absentCount: number;
    lateCount: number;
    attendancePercentage: number;
    courseWiseAttendance: CourseAttendanceSummary[];
  };
  data: PagedReportResult<AttendanceReportRow>;
}

export interface CourseReportRow {
  courseId: number;
  courseName: string;
  courseCode: string;
  duration: string;
  courseFees: number;
  status: string;
  enrolledStudents: number;
  totalBilledFees: number;
  totalCollectedFees: number;
  totalPendingFees: number;
}

export interface CourseReportResponse {
  summary: {
    totalCourses: number;
    activeCourses: number;
    inactiveCourses: number;
    totalFeeStructureSum: number;
  };
  data: PagedReportResult<CourseReportRow>;
}

export interface GovtUpdateReportRow {
  id: number;
  title: string;
  category: string;
  isImportant: boolean;
  isPublished: boolean;
  publishedAt: string | null;
  applicationLastDate: string | null;
  createdAt: string;
  createdBy: string;
}

export interface GovtUpdatesReportResponse {
  summary: {
    totalUpdates: number;
    publishedUpdates: number;
    draftUpdates: number;
    importantUpdates: number;
    categoryBreakdown: { category: string; count: number }[];
  };
  data: PagedReportResult<GovtUpdateReportRow>;
}

function getAuthHeaders(): HeadersInit {
  const token = localStorage.getItem("token");
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

function buildQuery(filter: ReportFilter): string {
  const params = new URLSearchParams();
  if (filter.fromDate) params.set("fromDate", filter.fromDate);
  if (filter.toDate) params.set("toDate", filter.toDate);
  if (filter.course && filter.course !== "All") params.set("course", filter.course);
  if (filter.search?.trim()) params.set("search", filter.search.trim());
  if (filter.status && filter.status !== "All") params.set("status", filter.status);
  if (filter.category && filter.category !== "All") params.set("category", filter.category);
  if (filter.page) params.set("page", String(filter.page));
  if (filter.pageSize) params.set("pageSize", String(filter.pageSize));
  const qs = params.toString();
  return qs ? `?${qs}` : "";
}

async function fetchReport<T>(endpoint: string, filter: ReportFilter): Promise<T> {
  const response = await fetch(`${API_BASE_URL}/api/Reports/${endpoint}${buildQuery(filter)}`, {
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    let msg = `Failed to load report (${response.status})`;
    try {
      const err = await response.json();
      if (err?.message) msg = err.message;
    } catch {
      // Ignore parse errors
    }
    throw new Error(msg);
  }

  return response.json() as Promise<T>;
}

export const getStudentReport = (filter: ReportFilter) =>
  fetchReport<StudentReportResponse>("students", filter);

export const getAdmissionReport = (filter: ReportFilter) =>
  fetchReport<AdmissionReportResponse>("admissions", filter);

export const getFeesReport = (filter: ReportFilter) =>
  fetchReport<FeesReportResponse>("fees", filter);

export const getAttendanceReport = (filter: ReportFilter) =>
  fetchReport<AttendanceReportResponse>("attendance", filter);

export const getCourseReport = (filter: ReportFilter) =>
  fetchReport<CourseReportResponse>("courses", filter);

export const getGovtUpdatesReport = (filter: ReportFilter) =>
  fetchReport<GovtUpdatesReportResponse>("government-updates", filter);
