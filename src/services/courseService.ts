import { API_BASE_URL } from "../config/apiConfig";

const API_URL = `${API_BASE_URL}/api/Courses`;

export interface Course {
  courseId: number;
  courseName: string;
  courseCode: string;
  duration: string;
  courseFees: number;
  description: string;
  status: "Active" | "Inactive";
  createdAt: string;
  updatedAt?: string | null;
}

export interface CreateCourseInput {
  courseName: string;
  courseCode: string;
  duration: string;
  courseFees: number;
  description: string;
  status?: "Active" | "Inactive";
}

export interface UpdateCourseInput {
  courseName: string;
  courseCode: string;
  duration: string;
  courseFees: number;
  description: string;
  status?: "Active" | "Inactive";
}

export const SUPPORTED_COURSE_NAMES = [
  "MS-CIT",
  "Tally",
  "Typing - Marathi",
  "Typing - English",
  "Data Entry",
  "HTML & CSS",
  "Advanced Excel",
  "Cyber Security",
] as const;

export function getCourseImage(courseName: string): string {
  const lower = courseName.toLowerCase();
  if (lower.includes("ms-cit") || lower.includes("mscit")) return "/course-images/mscit.svg";
  if (lower.includes("tally")) return "/course-images/tally.svg";
  if (lower.includes("marathi")) return "/course-images/typing-marathi.svg";
  if (lower.includes("typing") || lower.includes("english")) return "/course-images/typing-english.svg";
  if (lower.includes("data entry")) return "/course-images/data-entry.svg";
  if (lower.includes("html") || lower.includes("css")) return "/course-images/html-css.svg";
  if (lower.includes("excel")) return "/course-images/advanced-excel.svg";
  if (lower.includes("cyber") || lower.includes("security")) return "/course-images/cyber-security.svg";
  return "/course-images/default-course.svg";
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
    let errorMessage = `Request failed (${response.status})`;
    try {
      const errorData = await response.json();
      errorMessage =
        errorData.message ||
        (Array.isArray(errorData.errors) ? errorData.errors.join(", ") : null) ||
        (typeof errorData === "string" ? errorData : errorMessage);
    } catch {
      // Keep default error message if response is not JSON
    }
    throw new Error(errorMessage);
  }
  return response.json();
}

// GET /api/Courses (with optional search and status filters)
export async function getCourses(search?: string, status?: string): Promise<Course[]> {
  const params = new URLSearchParams();
  if (search && search.trim()) {
    params.append("search", search.trim());
  }
  if (status && status !== "All") {
    params.append("status", status);
  }

  const queryString = params.toString() ? `?${params.toString()}` : "";
  const response = await fetch(`${API_URL}${queryString}`, {
    headers: getAuthHeaders(),
  });

  return handleResponse<Course[]>(response);
}

// GET /api/Courses/{id}
export async function getCourseById(id: number): Promise<Course> {
  const response = await fetch(`${API_URL}/${id}`, {
    headers: getAuthHeaders(),
  });

  return handleResponse<Course>(response);
}

// POST /api/Courses
export async function createCourse(data: CreateCourseInput): Promise<Course> {
  const response = await fetch(API_URL, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  });

  return handleResponse<Course>(response);
}

// PUT /api/Courses/{id}
export async function updateCourse(id: number, data: UpdateCourseInput): Promise<Course> {
  const response = await fetch(`${API_URL}/${id}`, {
    method: "PUT",
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  });

  return handleResponse<Course>(response);
}

// DELETE /api/Courses/{id}
export async function deleteCourse(id: number): Promise<{ message: string }> {
  const response = await fetch(`${API_URL}/${id}`, {
    method: "DELETE",
    headers: getAuthHeaders(),
  });

  return handleResponse<{ message: string }>(response);
}

// PUT /api/Courses/{id}/status
export async function updateCourseStatus(
  id: number,
  status: "Active" | "Inactive"
): Promise<{ message: string; courseId: number; status: string }> {
  const response = await fetch(`${API_URL}/${id}/status`, {
    method: "PUT",
    headers: getAuthHeaders(),
    body: JSON.stringify({ status }),
  });

  return handleResponse<{ message: string; courseId: number; status: string }>(response);
}
