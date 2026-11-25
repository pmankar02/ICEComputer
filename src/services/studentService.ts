import type { Student, Gender } from "../models/Student";
import { API_BASE_URL } from "../config/apiConfig";

const API_URL = `${API_BASE_URL}/api/students`;

interface ApiStudent {
  id?: number;
  Id?: number;
  name?: string;
  Name?: string;
  mobile?: string;
  Mobile?: string;
  email?: string | null;
  Email?: string | null;
  address?: string | null;
  Address?: string | null;
  course?: string;
  Course?: string;
  gender?: Gender;
  Gender?: Gender;
  admissionDate?: string;
  AdmissionDate?: string;
  status?: string;
  Status?: string;
  isActive?: boolean;
  IsActive?: boolean;
  photoUrl?: string | null;
  PhotoUrl?: string | null;
}

export interface StudentInput {
  name: string;
  gender: "Male" | "Female" | "Other";
  mobile: string;
  email?: string;
  address?: string;
  course: string;
  admissionDate: string;
  courseFees?: number;
  status: "Active" | "Inactive";
}

export interface CreatedStudentResponse {
  id?: number;
  Id?: number;
  loginAccount?: {
    username: string;
    temporaryPassword: string;
    mustChangePassword: boolean;
  };
}

function getAuthHeaders(includeJson = true): HeadersInit {
  const token = localStorage.getItem("token");
  return {
    ...(includeJson ? { "Content-Type": "application/json" } : {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

function toApiStudent(student: StudentInput) {
  return {
    Name: student.name,
    Gender: student.gender,
    Mobile: student.mobile,
    Email: student.email || null,
    Address: student.address || null,
    Course: student.course,
    AdmissionDate: student.admissionDate,
    CourseFees: student.courseFees ?? 0,
    IsActive: student.status === "Active",
  };
}

// GET Students
export async function getStudents(): Promise<Student[]> {
  const response = await fetch(API_URL, {
    headers: getAuthHeaders(false),
  });

  if (!response.ok) {
    throw new Error(`Failed to load students: ${response.status}`);
  }

  const data: ApiStudent[] = await response.json();

  return data.map((item) => {
    const active = item.isActive ?? item.IsActive;
    const rawStatus = item.status ?? item.Status;

    return {
      id: item.id ?? item.Id ?? 0,
      name: item.name ?? item.Name ?? "",
      mobile: item.mobile ?? item.Mobile ?? "",
      email: item.email ?? item.Email ?? null,
      address: item.address ?? item.Address ?? null,
      course: item.course ?? item.Course ?? "",
      gender: item.gender ?? item.Gender ?? "Male",
      admissionDate: item.admissionDate ?? item.AdmissionDate ?? "",
      status:
        rawStatus?.toLowerCase() === "inactive" || active === false
          ? "Inactive"
          : "Active",
      photoUrl: item.photoUrl ?? item.PhotoUrl ?? null,
    };
  });
}

// ADD Student (also returns auto-generated Student Login credentials)
export async function addStudent(
  student: StudentInput
): Promise<CreatedStudentResponse> {
  const response = await fetch(API_URL, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify(toApiStudent(student)),
  });

  if (response.status === 409) {
    const errorData = await response.json();
    throw new Error(
      errorData.message || "This mobile number is already registered."
    );
  }

  if (!response.ok) {
    let message = `Failed to add student: ${response.status}`;
    try {
      const errorData = await response.json();
      if (errorData.message) message = errorData.message;
    } catch {
      // ignore non-json error
    }
    throw new Error(message);
  }

  return response.json();
}

// EDIT Student
export async function updateStudent(
  id: number,
  student: StudentInput
): Promise<void> {
  const response = await fetch(`${API_URL}/${id}`, {
    method: "PUT",
    headers: getAuthHeaders(),
    body: JSON.stringify({
      Id: id,
      ...toApiStudent(student),
    }),
  });

  if (!response.ok) {
    let message = `Failed to update student: ${response.status}`;
    try {
      const errorData = await response.json();
      if (errorData.message) message = errorData.message;
    } catch {
      // ignore
    }
    throw new Error(message);
  }
}

// DELETE Student
export async function deleteStudent(id: number): Promise<void> {
  const response = await fetch(`${API_URL}/${id}`, {
    method: "DELETE",
    headers: getAuthHeaders(false),
  });

  if (!response.ok) {
    throw new Error(`Failed to delete student: ${response.status}`);
  }
}
