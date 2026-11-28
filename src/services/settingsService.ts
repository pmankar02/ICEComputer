import { API_BASE_URL } from "../config/apiConfig";

export interface InstituteProfile {
  instituteName: string;
  logoUrl: string | null;
  address: string;
  mobileNumber: string;
  emailAddress: string | null;
  website: string | null;
  workingHours: string;
  updatedAt?: string | null;
  updatedBy?: string | null;
}

function getAuthHeaders(isJson = true): HeadersInit {
  const token = localStorage.getItem("token");
  return {
    ...(isJson ? { "Content-Type": "application/json" } : {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    let message = `Request failed (${response.status})`;
    try {
      const data = await response.json();
      if (data?.message) {
        message = data.message;
      } else if (data?.errors) {
        const firstKey = Object.keys(data.errors)[0];
        if (firstKey && Array.isArray(data.errors[firstKey])) {
          message = data.errors[firstKey][0];
        }
      }
    } catch {
      // Ignore JSON parse errors
    }
    throw new Error(message);
  }
  return response.json() as Promise<T>;
}

export async function getInstituteProfile(): Promise<InstituteProfile> {
  const res = await fetch(`${API_BASE_URL}/api/Settings/institute-profile`, {
    headers: getAuthHeaders(),
  });
  return handleResponse<InstituteProfile>(res);
}

export async function updateInstituteProfile(
  payload: InstituteProfile
): Promise<InstituteProfile> {
  const res = await fetch(`${API_BASE_URL}/api/Settings/institute-profile`, {
    method: "PUT",
    headers: getAuthHeaders(),
    body: JSON.stringify(payload),
  });
  return handleResponse<InstituteProfile>(res);
}

export async function uploadInstituteLogo(
  file: File
): Promise<{ logoUrl: string }> {
  const formData = new FormData();
  formData.append("file", file);

  const res = await fetch(`${API_BASE_URL}/api/Settings/institute-profile/logo`, {
    method: "POST",
    headers: getAuthHeaders(false),
    body: formData,
  });
  return handleResponse<{ logoUrl: string }>(res);
}
