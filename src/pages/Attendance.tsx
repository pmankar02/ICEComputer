
import { useEffect, useState } from "react";
import "./Attendance.css";
import { API_BASE_URL } from "../config/apiConfig";

interface Student {
  id: number;
  name: string;
  course?: string;
}

interface AttendanceRecord {
  id: number;
  studentId: number;
  studentName: string;
  course?: string;
  attendanceDate: string;
  status: string;
  remarks?: string;
}

const STUDENT_API = `${API_BASE_URL}/api/students`;
const ATTENDANCE_API = `${API_BASE_URL}/api/Attendance`;

export default function Attendance() {
  const [students, setStudents] = useState<Student[]>([]);
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [attendanceDate, setAttendanceDate] = useState(
    new Date().toLocaleDateString("en-CA")
  );
  const [attendance, setAttendance] = useState<Record<number, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function loadData() {
    setLoading(true);
    setError("");

    try {
      const [studentResponse, attendanceResponse] = await Promise.all([
        fetch(STUDENT_API),
        fetch(`${ATTENDANCE_API}/date/${attendanceDate}`),
      ]);

      if (!studentResponse.ok || !attendanceResponse.ok) {
        throw new Error("Unable to load attendance data.");
      }

      const studentData = await studentResponse.json();
      const attendanceData: AttendanceRecord[] =
        await attendanceResponse.json();

      const studentList: Student[] = studentData.map((s: any) => ({
        id: s.id ?? s.Id,
        name: s.name ?? s.Name ?? "",
        course: s.course ?? s.Course ?? "",
      }));

      setStudents(studentList);
      setRecords(attendanceData);

      const marked: Record<number, string> = {};

      attendanceData.forEach((record) => {
        marked[record.studentId] = record.status;
      });

      setAttendance(marked);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to load attendance."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadData();
  }, [attendanceDate]);

  
async function saveAttendance() {
  setSaving(true);
  setError("");
  setMessage("");

  try {
    for (const student of students) {
      const selectedStatus = attendance[student.id];

      if (!selectedStatus) continue;

      const existingRecord = records.find(
        (record) => record.studentId === student.id
      );

      // Skip unchanged attendance
      if (existingRecord?.status === selectedStatus) continue;

      const isEditing = !!existingRecord;

      const url = isEditing
        ? `${ATTENDANCE_API}/${existingRecord.id}`
        : ATTENDANCE_API;

      const response = await fetch(url, {
        method: isEditing ? "PUT" : "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: existingRecord?.id ?? 0,
          studentId: student.id,
          attendanceDate: `${attendanceDate}T00:00:00`,
          status: selectedStatus,
          remarks: existingRecord?.remarks ?? "",
        }),
      });

      if (!response.ok) {
        const details = await response.text();
        throw new Error(details || `Failed for ${student.name}`);
      }
    }

    setMessage("Attendance saved successfully!");
    await loadData();
  } catch (err) {
    setError(
      err instanceof Error
        ? err.message
        : "Unable to save attendance."
    );
  } finally {
    setSaving(false);
  }
}


  const filteredStudents = students.filter((student) =>
    student.name.toLowerCase().includes(search.trim().toLowerCase())
  );

  const presentCount = records.filter((r) => r.status === "Present").length;
  const absentCount = records.filter((r) => r.status === "Absent").length;
  const lateCount = records.filter((r) => r.status === "Late").length;

  return (
    <div className="attendance-page">
      <div className="attendance-header">
        <div>
          <h1>Attendance Management</h1>
          <p>Manage daily student attendance.</p>
        </div>
      </div>

      <div className="attendance-summary">
        <div className="attendance-card">
          <span>Total Marked</span>
          <h2>{records.length}</h2>
        </div>
        <div className="attendance-card">
          <span>Present</span>
          <h2>{presentCount}</h2>
        </div>
        <div className="attendance-card">
          <span>Absent</span>
          <h2>{absentCount}</h2>
        </div>
        <div className="attendance-card">
          <span>Late</span>
          <h2>{lateCount}</h2>
        </div>
      </div>

      <div className="attendance-panel">
        <div className="attendance-toolbar">
          <label>
            Attendance Date
            <input
              type="date"
              value={attendanceDate}
              onChange={(e) => setAttendanceDate(e.target.value)}
            />
          </label>

          <input
            type="search"
            placeholder="Search student name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {message && <p className="attendance-success">{message}</p>}
        {error && <p className="attendance-error">{error}</p>}

        {loading ? (
          <p>Loading students...</p>
        ) : (
          <>
            <div className="attendance-table-wrapper">
              <table className="attendance-table">
                <thead>
                  <tr>
                    <th>Student Name</th>
                    <th>Course</th>
                    <th>Attendance Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredStudents.length === 0 ? (
                    <tr>
                      <td colSpan={3}>No students found.</td>
                    </tr>
                  ) : (
                    filteredStudents.map((student) => {
                      return (
                        <tr key={student.id}>
                          <td>{student.name}</td>
                          <td>{student.course || "-"}</td>
                          <td>
                            <select
                              value={attendance[student.id] || ""}
                              onChange={(e) =>
                                setAttendance((previous) => ({
                                  ...previous,
                                  [student.id]: e.target.value,
                                }))
                              }
                            >
                              <option value="">Select Status</option>
                              <option value="Present">Present</option>
                              <option value="Absent">Absent</option>
                              <option value="Late">Late</option>
                            </select>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            <button
              className="attendance-save-button"
              onClick={() => void saveAttendance()}
              
            disabled={
            saving ||
            students.every((student) => {
                const existingRecord = records.find(
                (r) => r.studentId === student.id
                );

                return (
                !attendance[student.id] ||
                existingRecord?.status === attendance[student.id]
                );
            })
            }

            >
              {saving ? "Saving..." : "Save Attendance"}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
