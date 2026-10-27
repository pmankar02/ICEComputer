
import { useEffect, useMemo, useState } from "react";
import "./Students.css";
import * as XLSX from "xlsx";



import type { Student,Gender } from "../models/Student";
import {
  getStudents,
  addStudent,
  updateStudent,
  deleteStudent,
} from "../services/studentService";


function Students() {
  const [students, setStudents] = useState<Student[]>([]);
  const [gender, setGender] = useState<Gender>("Male");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null); 

  const [search, setSearch] = useState("");
  const [photo, setPhoto] = useState<File | null>(null);
  
    useEffect(() => {
        setPage(1);
    }, [search]);

  const [page, setPage] = useState(1);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  const [name, setName] = useState("");
  const [mobile, setMobile] = useState("");
  const [course, setCourse] = useState("MS-CIT");
  const [status, setStatus] = useState<"Active" | "Inactive">("Active");
    useEffect(() => {
    async function loadStudents() {
      try {
        setLoading(true);
        setError("");

        const data = await getStudents();
        setStudents(data);
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Students load"
        );
      } finally {
        setLoading(false);
      }
    }

    loadStudents();
  }, []);

  const pageSize = 10;

  const filteredStudents = useMemo(() => {
    const term = search.trim().toLowerCase();

    return students.filter(
      (student) =>
        student.name.toLowerCase().includes(term) ||
        student.mobile.includes(term) ||
        student.course.toLowerCase().includes(term)
    );
  }, [students, search]);

  const totalPages = Math.max(
    1, 
    Math.ceil(filteredStudents.length / pageSize)
  );
  const currentPage = Math.min(page, totalPages);

  const visibleStudents = filteredStudents.slice(
  (currentPage - 1) * pageSize,
  currentPage * pageSize
);

  
function exportToExcel() {
  const excelData = filteredStudents.map((student) => ({
    "Student ID": student.id,
    "Student Name": student.name,
    "Mobile Number": student.mobile,
    Course: student.course,
    "Admission Date": student.admissionDate,
    Status: student.status,
  }));

  const worksheet = XLSX.utils.json_to_sheet(excelData);
  const workbook = XLSX.utils.book_new();

  XLSX.utils.book_append_sheet(
    workbook,
    worksheet,
    "Students"
  );

  XLSX.writeFile(workbook, "ICEComputer_Students.xlsx");
}

  function resetForm() {
    setName("");
    setMobile("");
    setCourse("MS-CIT");
    setStatus("Active");
    setEditingId(null);
    setShowForm(false);
  }

 
async function handleSubmit(
  event: React.FormEvent<HTMLFormElement>
) {
  event.preventDefault();

  if (!/^[0-9]{10}$/.test(mobile)) {
    alert("Enter a valid 10-digit mobile number.");
    return;
  }

  const studentData = {
    name,
    gender,
    mobile,
    course,
    admissionDate: new Date().toISOString(),
    status,
  };

  try {
    if (editingId !== null) {
      await updateStudent(editingId, studentData);
    } else {
      await addStudent(studentData);
    }

    
    

    const updatedStudents = await getStudents();
    setStudents(updatedStudents);
    setPage(1);
    resetForm();
    alert("Student saved successfully!");
  } catch (error) {
    alert(
      error instanceof Error
        ? error.message
        : "Failed to save student."
    );
  }
}


  function handleEdit(student: Student) {
    setEditingId(student.id);
    setName(student.name);
    setMobile(student.mobile);
    setCourse(student.course);
    setStatus(student.status);
    setShowForm(true);
  }

  
async function handleDelete(student: Student) {
  if (!window.confirm(`Delete ${student.name}?`)) {
    return;
  }

  try {
    await deleteStudent(student.id);

    const updatedStudents = await getStudents();
    setStudents(updatedStudents);

    alert("Student deleted successfully!");
  } catch (error) {
    alert(
      error instanceof Error
        ? error.message
        : "Failed to delete student."
    );
  }
}

  return (
    <div className="students-page">
      
{selectedStudent && (
  <div className="student-modal-overlay">
    <div className="student-modal">
      <h2>Student Details</h2>
      <p><strong>Student ID:</strong> {selectedStudent.id}</p>
      <p><strong>Name:</strong> {selectedStudent.name}</p>
      <p><strong>Gender:</strong> {selectedStudent.gender}</p>
      <p><strong>Mobile:</strong> {selectedStudent.mobile}</p>
      <p><strong>Course:</strong> {selectedStudent.course}</p>
      <p><strong>Admission Date:</strong> {selectedStudent.admissionDate}</p>
      <p><strong>Status:</strong> {selectedStudent.status}</p>

      <button
        type="button"
        className="modal-close-button"
        onClick={() => setSelectedStudent(null)}
      >
        Close
      </button>
    </div>
  </div>
)}

      
<div className="students-heading">
  <div>
    <h1>Students</h1>
    <p>Manage all institute students</p>
  </div>

  <div className="students-heading-actions">
    <button
      type="button"
      className="primary-button"
      onClick={() => {
        resetForm();
        setShowForm(true);
      }}
    >
      <i className="bi bi-plus-lg"></i> Add Student
    </button>

    <button
      type="button"
      className="export-btn"
      onClick={exportToExcel}
    >
      <i className="bi bi-file-earmark-excel"></i> Export to Excel
    </button>
  </div>
</div>


      {showForm && (
        <form className="student-form" onSubmit={handleSubmit}>
          <h2>{editingId === null ? "Add Student" : "Edit Student"}</h2>

          <div className="student-form-grid">
            <label>
              Student Name
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter full name"
                required
                maxLength={100}
              />
            </label>
            
            <label>
              Gender
              <select
                value={gender}
                onChange={(e) => setGender(e.target.value as Gender)}
                required
              >
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </label>


            <label>
              Mobile Number
              <input
                value={mobile}
                onChange={(e) => setMobile(e.target.value)}
                placeholder="10-digit mobile"
                inputMode="numeric"
                pattern="[0-9]{10}"
                maxLength={10}
                required
              />
            </label>

            <label>
              Course
              <select
                value={course}
                onChange={(e) => setCourse(e.target.value)}
              >
                <option>MS-CIT</option>
                <option>Tally</option>
                <option>Typing</option>
                <option>English</option>
                <option>Marathi</option>
                <option>Advanced Excel</option>
              </select>
            </label>
            <label>
              Student Photo
              <input
                type="file"
                accept="image/png,image/jpeg,image/webp"
                onChange={(e) => setPhoto(e.target.files?.[0] ?? null)}
              />
            </label>

            <label>
              Status
              <select
                value={status}
                onChange={(e) =>
                  setStatus(e.target.value as "Active" | "Inactive")
                }
              >
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </select>
            </label>
          </div>

          <div className="student-form-actions">
            <button type="button" className="secondary-button" onClick={resetForm}>
              Cancel
            </button>
            <button type="submit" className="primary-button">
              {editingId === null ? "Save Student" : "Update Student"}
            </button>
          </div>
        </form>
      )}

      <section className="students-table-card">
        {loading && <p>Loading students...</p>}

{error && (
  <p style={{ color: "red" }}>
    {error}
  </p>
)}
        <div className="students-toolbar">
          <div>
            <h2>All Students</h2>
            <p>{filteredStudents.length} student(s) found</p>
          </div>

          <div className="students-search">
            <i className="bi bi-search"></i>
            <input
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder="Search name, mobile or course..."
              aria-label="Search students"
            />
          </div>
        </div>

        <div className="students-table-wrapper">
          <table className="students-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Name</th>
                <th>Mobile</th>
                <th>Course</th>
                <th>Gender</th>
                <th>Admission Date</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>

            <tbody>
              {visibleStudents.map((student, index) => (
                <tr key={student.id}>
                  <td>{(currentPage - 1) * pageSize + index + 1}</td>
                  <td className="student-name">
                    <div className="student-name-cell">
                      {student.photoUrl ? (
                        <img
                          src={`http://localhost:5056${student.photoUrl}`}
                          alt={student.name}
                          className="student-photo"
                        />
                      ) : (
                        <div className="student-photo-placeholder">
                          <i className="bi bi-person-fill"></i>
                        </div>
                      )}
                      <span>{student.name}</span>
                    </div>
                  </td>
                  <td>{student.mobile}</td>
                  <td>{student.course}</td>
                  <td>{student.gender}</td>
                  <td>{student.admissionDate}</td>
                  <td>
                    <span
                        className={`status-badge ${(student.status ?? "Active").toLowerCase()}`}
>
                        {student.status ?? "Active"}
                    </span>
                  </td>
                  <td>
                    <div className="student-actions">
                      <button
                        className="edit-button"
                        onClick={() => handleEdit(student)}
                        aria-label={`Edit ${student.name}`}
                        title="Edit"
                      >
                        <i className="bi bi-pencil-square"></i>
                      </button>

                      <button
                        className="delete-button"
                        onClick={() => handleDelete(student)}
                        aria-label={`Delete ${student.name}`}
                        title="Delete"
                      >
                        <i className="bi bi-trash"></i>
                      </button>
                  
                      <button
                        type="button"
                        className="view-button"
                        onClick={() => setSelectedStudent(student)}
                        title="View Student Details"
                        aria-label={`View ${student.name}`}
                      >
                        <i className="bi bi-eye"></i>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}

              {visibleStudents.length === 0 && (
                <tr>
                  <td colSpan={7} className="empty-students">
                    No students found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="students-pagination">
          <span>
            Showing {filteredStudents.length === 0 ? 0 : (currentPage - 1) * pageSize + 1}
            {" "}to {Math.min(currentPage * pageSize, filteredStudents.length)}
            {" "}of {filteredStudents.length}
          </span>

          <div>
            <button
              disabled={currentPage === 1}
              onClick={() => setPage(currentPage - 1)}
            >
              Previous
            </button>

            <span className="current-page">{currentPage}</span>

            <button
              disabled={currentPage === totalPages}
              onClick={() => setPage(currentPage + 1)}
            >
              Next
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}

export default Students;
