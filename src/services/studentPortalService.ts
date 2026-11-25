import { API_BASE_URL } from "../config/apiConfig";

const PORTAL_API = `${API_BASE_URL}/api/StudentPortal`;

export interface StudentProfile {
  id: number;
  name: string;
  mobile: string;
  email?: string | null;
  address?: string | null;
  gender: string;
  course: string;
  admissionDate: string;
  isActive: boolean;
  photoUrl?: string | null;
  courseDetails?: {
    courseId: number;
    courseName: string;
    courseCode: string;
    duration: string;
    courseFees: number;
    description: string;
    status: string;
  } | null;
}

export interface StudentFeePayment {
  id: number;
  amountPaid: number;
  paymentDate: string;
  paymentMode: string;
  notes?: string | null;
}

export interface StudentFeesSummary {
  hasFeeRecord: boolean;
  id?: number;
  totalFees: number;
  paidFees: number;
  remainingFees: number;
  createdDate?: string;
  payments: StudentFeePayment[];
}

export interface StudentAttendanceItem {
  id: number;
  attendanceDate: string;
  status: string;
  remarks?: string | null;
}

export interface StudentAttendanceSummary {
  totalDays: number;
  presentDays: number;
  absentDays: number;
  attendancePercentage: number;
  records: StudentAttendanceItem[];
}

function getAuthHeaders(): HeadersInit {
  const token = localStorage.getItem("token");
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    let message = `Request failed (${response.status})`;
    try {
      const data = await response.json();
      if (data.message) message = data.message;
    } catch {
      // ignore non-json
    }
    throw new Error(message);
  }
  return response.json();
}

export async function getMyProfile(): Promise<StudentProfile> {
  const response = await fetch(`${PORTAL_API}/my-profile`, {
    headers: getAuthHeaders(),
  });
  return handleResponse<StudentProfile>(response);
}

export async function getMyFees(): Promise<StudentFeesSummary> {
  const response = await fetch(`${PORTAL_API}/my-fees`, {
    headers: getAuthHeaders(),
  });
  return handleResponse<StudentFeesSummary>(response);
}

export async function getMyAttendance(): Promise<StudentAttendanceSummary> {
  const response = await fetch(`${PORTAL_API}/my-attendance`, {
    headers: getAuthHeaders(),
  });
  return handleResponse<StudentAttendanceSummary>(response);
}
