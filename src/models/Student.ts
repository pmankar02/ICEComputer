export interface Student {
  id: number;
  name: string;
  mobile: string;
  course: string;
  admissionDate: string;
  status: "Active" | "Inactive";
  gender: Gender;
}
export type Gender = "Male" | "Female" | "Other";