import type { Student,Gender } from "../models/Student";

const API_URL = "http://localhost:5056/api/students";

interface ApiStudent {
  id?: number;
  Id?: number;
  name?: string;
  Name?: string;
  mobile?: string;
  Mobile?: string;
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
  course: string;
  admissionDate: string;
  status: "Active" | "Inactive";
}

function toApiStudent(student: StudentInput) {
  return {
    Name: student.name,
    gender: student.gender,
    Mobile: student.mobile,
    Course: student.course,
    AdmissionDate: student.admissionDate,
    IsActive: student.status === "Active",
  };
}

// GET Students
export async function getStudents(): Promise<Student[]> {
  const response = await fetch(API_URL);

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
      course: item.course ?? item.Course ?? "",
      gender: item.gender ?? item.Gender ?? "Male",
      admissionDate:
        item.admissionDate ?? item.AdmissionDate ?? "",
      status:
        rawStatus?.toLowerCase() === "inactive" || active === false
          ? "Inactive"
          : "Active",
          photoUrl: item.photoUrl ?? item.PhotoUrl ?? null,
    };
  });
}

// ADD Student

export async function addStudent(student: StudentInput): Promise<void> {
  const response = await fetch(API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(toApiStudent(student)),
  });

  if (response.status === 409) {
    const errorData = await response.json();
    throw new Error(
      errorData.message || "This mobile number is already registered."
    );
  }

  if (!response.ok) {
    throw new Error(`Failed to add student: ${response.status}`);
  }
}

// EDIT Student
export async function updateStudent(
  id: number,
  student: StudentInput
): Promise<void> {
  const response = await fetch(`${API_URL}/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      Id: id,
      ...toApiStudent(student),
    }),
  });

  if (!response.ok) {
    throw new Error(`Failed to update student: ${response.status}`);
  }
}

// DELETE Student
export async function deleteStudent(id: number): Promise<void> {
  const response = await fetch(`${API_URL}/${id}`, {
    method: "DELETE",
  });

  if (!response.ok) {
    throw new Error(`Failed to delete student: ${response.status}`);
  }
}
