export interface Student {
  id: number;
  name: string;
  mobile: string;
  email?: string | null;
  address?: string | null;
  course: string;
  admissionDate: string;
  status: "Active" | "Inactive";
  gender: Gender;
  photoUrl?: string | null;
}

export type Gender = "Male" | "Female" | "Other";
