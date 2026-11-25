import { API_BASE_URL } from "../config/apiConfig";

const API_URL = `${API_BASE_URL}/api/GovernmentUpdates`;

export interface GovernmentUpdate {
  id: number;
  title: string;
  category: string;
  description: string;
  eligibility: string;
  requiredDocuments: string;
  applicationStartDate?: string | null;
  applicationLastDate?: string | null;
  officialLink: string;
  attachmentUrl?: string | null;
  attachmentType?: "image" | "pdf" | string | null;
  isImportant: boolean;
  isPublished: boolean;
  publishedAt?: string | null;
  createdAt: string;
  updatedAt?: string | null;
  createdBy: string;
}

export interface GovernmentUpdateInput {
  title: string;
  category: string;
  description: string;
  eligibility: string;
  requiredDocuments: string;
  applicationStartDate?: string | null;
  applicationLastDate?: string | null;
  officialLink: string;
  isImportant: boolean;
  isPublished: boolean;
}

export const UPDATE_CATEGORIES = [
  "Job Vacancy",
  "Exam Form",
  "Scholarship",
  "Admission Form",
  "Government Scheme",
  "Other",
] as const;

function getAuthHeaders(includeJson = true): HeadersInit {
  const token = localStorage.getItem("token");
  return {
    ...(includeJson ? { "Content-Type": "application/json" } : {}),
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

export function getAttachmentFullUrl(attachmentUrl?: string | null): string {
  if (!attachmentUrl) return "";
  if (attachmentUrl.startsWith("http://") || attachmentUrl.startsWith("https://")) {
    return attachmentUrl;
  }
  return `${API_BASE_URL}${attachmentUrl.startsWith("/") ? "" : "/"}${attachmentUrl}`;
}

export async function getGovernmentUpdates(
  search?: string,
  category?: string,
  onlyImportant?: boolean
): Promise<GovernmentUpdate[]> {
  const params = new URLSearchParams();
  if (search && search.trim()) params.append("search", search.trim());
  if (category && category !== "All") params.append("category", category);
  if (onlyImportant) params.append("onlyImportant", "true");

  const query = params.toString() ? `?${params.toString()}` : "";
  const response = await fetch(`${API_URL}${query}`, {
    headers: getAuthHeaders(),
  });
  return handleResponse<GovernmentUpdate[]>(response);
}

export async function getGovernmentUpdateById(id: number): Promise<GovernmentUpdate> {
  const response = await fetch(`${API_URL}/${id}`, {
    headers: getAuthHeaders(),
  });
  return handleResponse<GovernmentUpdate>(response);
}

export async function createGovernmentUpdate(
  data: GovernmentUpdateInput
): Promise<GovernmentUpdate> {
  const response = await fetch(API_URL, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  });
  return handleResponse<GovernmentUpdate>(response);
}

export async function updateGovernmentUpdate(
  id: number,
  data: GovernmentUpdateInput
): Promise<GovernmentUpdate> {
  const response = await fetch(`${API_URL}/${id}`, {
    method: "PUT",
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  });
  return handleResponse<GovernmentUpdate>(response);
}

export async function deleteGovernmentUpdate(id: number): Promise<{ message: string }> {
  const response = await fetch(`${API_URL}/${id}`, {
    method: "DELETE",
    headers: getAuthHeaders(),
  });
  return handleResponse<{ message: string }>(response);
}

export async function togglePublishUpdate(
  id: number,
  isPublished: boolean
): Promise<{ message: string; id: number; isPublished: boolean; publishedAt?: string | null }> {
  const response = await fetch(`${API_URL}/${id}/publish`, {
    method: "PUT",
    headers: getAuthHeaders(),
    body: JSON.stringify({ isPublished }),
  });
  return handleResponse(response);
}

export async function toggleImportantUpdate(
  id: number,
  isImportant: boolean
): Promise<{ message: string; id: number; isImportant: boolean }> {
  const response = await fetch(`${API_URL}/${id}/important`, {
    method: "PUT",
    headers: getAuthHeaders(),
    body: JSON.stringify({ isImportant }),
  });
  return handleResponse(response);
}

export async function uploadUpdateAttachment(
  id: number,
  file: File
): Promise<{ message: string; attachmentUrl: string; attachmentType: string }> {
  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch(`${API_URL}/${id}/attachment`, {
    method: "POST",
    headers: getAuthHeaders(false),
    body: formData,
  });
  return handleResponse(response);
}

// ==============================================================
// Client-side Notification Read/Unread Tracking Helpers
// ==============================================================

function getReadStorageKey(): string {
  try {
    const rawUser = localStorage.getItem("user");
    const user = rawUser ? JSON.parse(rawUser) : null;
    const identifier = user?.id || user?.mobile || user?.phoneNumber || "default";
    return `ice_read_govt_updates_${identifier}`;
  } catch {
    return "ice_read_govt_updates_default";
  }
}

export function getReadUpdateIds(): number[] {
  try {
    const raw = localStorage.getItem(getReadStorageKey());
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.filter((id) => typeof id === "number") : [];
  } catch {
    return [];
  }
}

export function markUpdateAsRead(id: number): number[] {
  const current = getReadUpdateIds();
  if (!current.includes(id)) {
    const updated = [...current, id];
    localStorage.setItem(getReadStorageKey(), JSON.stringify(updated));
    window.dispatchEvent(new Event("govt-updates-read-changed"));
    return updated;
  }
  return current;
}

export function markAllUpdatesAsRead(ids: number[]): number[] {
  const current = getReadUpdateIds();
  const merged = Array.from(new Set([...current, ...ids]));
  localStorage.setItem(getReadStorageKey(), JSON.stringify(merged));
  window.dispatchEvent(new Event("govt-updates-read-changed"));
  return merged;
}

export function isUpdateUnread(update: GovernmentUpdate, readIds: number[]): boolean {
  if (!update.isPublished) return false;
  return !readIds.includes(update.id);
}
