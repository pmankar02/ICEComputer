
import { useEffect, useState } from "react";
import "./StudentInsights.css";
import { API_BASE_URL } from "../config/apiConfig";

const API_URL = `${API_BASE_URL}/api/StudentInsights`;

interface StudentSummary {
  totalStudents: number;
  activeStudents: number;
  inactiveStudents: number;
  genderWise: {
    maleStudents: number;
    femaleStudents: number;
    otherStudents: number;
  };
}

interface CourseInsight {
  course: string;
  studentCount: number;
}

interface MonthlyAdmission {
  year: number;
  month: number;
  studentCount: number;
}

function StudentInsights() {
  const [summary, setSummary] = useState<StudentSummary | null>(null);
  const [courses, setCourses] = useState<CourseInsight[]>([]);
  const [monthlyAdmissions, setMonthlyAdmissions] = useState<MonthlyAdmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    loadInsights();
  }, []);

  async function loadInsights() {
    try {
      setLoading(true);
      setError("");

      const [summaryResponse, courseResponse, monthlyResponse] =
        await Promise.all([
          fetch(`${API_URL}/summary`),
          fetch(`${API_URL}/course-wise`),
          fetch(`${API_URL}/monthly-admissions`),
        ]);

      if (!summaryResponse.ok || !courseResponse.ok || !monthlyResponse.ok) {
        throw new Error("Unable to load Student Insights data.");
      }

      const summaryData: StudentSummary = await summaryResponse.json();
      const courseData: CourseInsight[] = await courseResponse.json();
      const monthlyData: MonthlyAdmission[] = await monthlyResponse.json();

      setSummary(summaryData);
      setCourses(courseData);
      setMonthlyAdmissions(monthlyData);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Something went wrong."
      );
    } finally {
      setLoading(false);
    }
  }

  const maxCourseCount = Math.max(
    ...courses.map((course) => course.studentCount),
    1
  );

  const maxMonthlyCount = Math.max(
    ...monthlyAdmissions.map((item) => item.studentCount),
    1
  );

  const monthName = (month: number) =>
    new Date(2000, month - 1, 1).toLocaleString("en-IN", {
      month: "short",
    });

  if (loading) {
    return (
      <div className="insights-page">
        <div className="insights-message">Loading Student Insights...</div>
      </div>
    );
  }

  if (error || !summary) {
    return (
      <div className="insights-page">
        <div className="insights-error">
          <p>{error || "Student Insights data not available."}</p>
          <button onClick={loadInsights}>Try Again</button>
        </div>
      </div>
    );
  }

  return (
    <div className="insights-page">
      <div className="insights-header">
        <div>
          <h1>Student Insights</h1>
          <p>Overview of student information and performance</p>
        </div>

        <button className="insights-refresh" onClick={loadInsights}>
          ↻ Refresh
        </button>
      </div>

      <div className="insights-stats">
        <div className="insight-card">
          <div className="insight-icon total-icon">👨‍🎓</div>
          <div>
            <span>Total Students</span>
            <h2>{summary.totalStudents}</h2>
            <small>Registered students</small>
          </div>
        </div>

        <div className="insight-card">
          <div className="insight-icon active-icon">✓</div>
          <div>
            <span>Active Students</span>
            <h2>{summary.activeStudents}</h2>
            <small>Currently active</small>
          </div>
        </div>

        <div className="insight-card">
          <div className="insight-icon inactive-icon">⊘</div>
          <div>
            <span>Inactive Students</span>
            <h2>{summary.inactiveStudents}</h2>
            <small>Currently inactive</small>
          </div>
        </div>

        <div className="insight-card">
          <div className="insight-icon gender-icon">👥</div>
          <div>
            <span>Male Students</span>
            <h2>{summary.genderWise.maleStudents}</h2>
            <small>Gender distribution</small>
          </div>
        </div>
      </div>

      <div className="insights-grid">
        <section className="insights-panel">
          <div className="panel-heading">
            <div>
              <h3>Course-wise Students</h3>
              <p>Student distribution by course</p>
            </div>
          </div>

          {courses.length === 0 ? (
            <p className="empty-insights">No course data available.</p>
          ) : (
            <div className="course-chart">
              {courses.map((item) => (
                <div className="course-row" key={item.course}>
                  <div className="course-info">
                    <span>{item.course}</span>
                    <strong>{item.studentCount}</strong>
                  </div>
                  <div className="progress-track">
                    <div
                      className="progress-fill course-fill"
                      style={{
                        width: `${(item.studentCount / maxCourseCount) * 100}%`,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="insights-panel">
          <div className="panel-heading">
            <div>
              <h3>Gender Distribution</h3>
              <p>Student count by gender</p>
            </div>
          </div>

          <div className="gender-list">
            <div className="gender-row">
              <span>Male</span>
              <strong>{summary.genderWise.maleStudents}</strong>
            </div>
            <div className="gender-row">
              <span>Female</span>
              <strong>{summary.genderWise.femaleStudents}</strong>
            </div>
            <div className="gender-row">
              <span>Other</span>
              <strong>{summary.genderWise.otherStudents}</strong>
            </div>
          </div>
        </section>

        <section className="insights-panel monthly-panel">
          <div className="panel-heading">
            <div>
              <h3>Monthly Admissions</h3>
              <p>Number of students admitted each month</p>
            </div>
          </div>

          {monthlyAdmissions.length === 0 ? (
            <p className="empty-insights">No admission data available.</p>
          ) : (
            <div className="monthly-chart">
              {monthlyAdmissions.map((item) => (
                <div
                  className="monthly-column"
                  key={`${item.year}-${item.month}`}
                >
                  <strong>{item.studentCount}</strong>
                  <div className="monthly-bar-area">
                    <div
                      className="monthly-bar"
                      style={{
                        height: `${(item.studentCount / maxMonthlyCount) * 100}%`,
                      }}
                    />
                  </div>
                  <span>{monthName(item.month)} {item.year}</span>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

export default StudentInsights;
