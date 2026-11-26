import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { API_BASE_URL } from "../config/apiConfig";
import { getCourseImage } from "../services/courseService";
import {
  getGovernmentUpdates,
  getReadUpdateIds,
  isUpdateUnread,
  markUpdateAsRead,
} from "../services/govtUpdateService";
import type { GovernmentUpdate } from "../services/govtUpdateService";
import {
  getMyAttendance,
  getMyFees,
  getMyProfile,
} from "../services/studentPortalService";
import type {
  StudentAttendanceSummary,
  StudentFeesSummary,
  StudentProfile,
} from "../services/studentPortalService";
import "./Dashboard.css";
import "./StudentDashboard.css";

type PortalTab =
  | "overview"
  | "profile"
  | "courses"
  | "fees"
  | "attendance"
  | "updates";

export default function StudentDashboard() {
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<PortalTab>("overview");
  const [profile, setProfile] = useState<StudentProfile | null>(null);
  const [fees, setFees] = useState<StudentFeesSummary | null>(null);
  const [attendance, setAttendance] = useState<StudentAttendanceSummary | null>(
    null
  );
  const [updates, setUpdates] = useState<GovernmentUpdate[]>([]);
  const [readIds, setReadIds] = useState<number[]>(() => getReadUpdateIds());
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");

  const loadPortalData = async () => {
    try {
      setLoading(true);
      setError("");

      const [profileRes, feesRes, attendanceRes, updatesRes] =
        await Promise.all([
          getMyProfile(),
          getMyFees(),
          getMyAttendance(),
          getGovernmentUpdates(),
        ]);

      setProfile(profileRes);
      setFees(feesRes);
      setAttendance(attendanceRes);
      setUpdates(updatesRes.filter((u) => u.isPublished));
      setReadIds(getReadUpdateIds());
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load student dashboard."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPortalData();
  }, []);

  const unreadUpdatesCount = useMemo(
    () => updates.filter((u) => isUpdateUnread(u, readIds)).length,
    [updates, readIds]
  );

  const totalEnrolledCourses = profile?.course ? 1 : 0;

  if (loading) {
    return (
      <div className="student-portal">
        <div className="panel">
          <p className="sp-empty-text">Loading your Student Dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="student-portal">
        <div className="panel">
          <div className="panel-header">
            <div>
              <h3>Unable to load Student Dashboard</h3>
              <p>{error}</p>
            </div>
            <button
              type="button"
              className="sp-btn-primary"
              onClick={loadPortalData}
            >
              <i className="bi bi-arrow-clockwise"></i> Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="student-portal">
      {/* Topbar matching existing Dashboard layout & colors */}
      <header className="topbar">
        <div>
          <h1>Welcome, {profile?.name || "Student"}</h1>
          <p>
            Student Dashboard · ICE Computer Institute
          </p>
        </div>

        <div className="sp-topbar-actions">
          <button
            type="button"
            className="sp-btn-secondary"
            onClick={() => navigate("/change-password")}
          >
            <i className="bi bi-key"></i> Change Password
          </button>

          <button
            type="button"
            className="notification-button"
            title="Government Updates & Notifications"
            onClick={() => navigate("/govt-updates")}
            style={{ position: "relative", cursor: "pointer" }}
          >
            <i className="bi bi-bell-fill"></i>
            {unreadUpdatesCount > 0 && (
              <span
                style={{
                  position: "absolute",
                  top: "4px",
                  right: "4px",
                  background: "#1677ff",
                  color: "#ffffff",
                  fontSize: "10px",
                  fontWeight: 700,
                  borderRadius: "999px",
                  padding: "1px 5px",
                  lineHeight: 1.2,
                }}
              >
                {unreadUpdatesCount}
              </span>
            )}
          </button>

          <div className="admin-profile">
            {profile?.photoUrl ? (
              <img
                src={`${API_BASE_URL}${profile.photoUrl}`}
                alt={profile.name}
                className="sp-avatar-img"
              />
            ) : (
              <div className="admin-avatar">
                <i className="bi bi-person-fill"></i>
              </div>
            )}
            <div>
              <strong>{profile?.name || "Student"}</strong>
              <small>Student · {profile?.course || "-"}</small>
            </div>
          </div>
        </div>
      </header>

      {/* Dashboard Overview Cards using existing stats-grid & stat-card */}
      <section className="stats-grid">
        <article className="stat-card">
          <div className="stat-icon blue">
            <i className="bi bi-book-fill"></i>
          </div>
          <div className="stat-content">
            <p>Total Enrolled Courses</p>
            <h2>{totalEnrolledCourses}</h2>
            <small>{profile?.course || "No course assigned"}</small>
          </div>
        </article>

        <article className="stat-card">
          <div className="stat-icon pink">
            <i className="bi bi-wallet2"></i>
          </div>
          <div className="stat-content">
            <p>Pending Fees</p>
            <h2>₹{(fees?.remainingFees ?? 0).toLocaleString("en-IN")}</h2>
            <small>
              Total: ₹{(fees?.totalFees ?? 0).toLocaleString("en-IN")}
            </small>
          </div>
        </article>

        <article className="stat-card">
          <div className="stat-icon green">
            <i className="bi bi-calendar-check-fill"></i>
          </div>
          <div className="stat-content">
            <p>Attendance Percentage</p>
            <h2>{attendance?.attendancePercentage ?? 0}%</h2>
            <small>
              {attendance?.presentDays ?? 0} of {attendance?.totalDays ?? 0}{" "}
              classes present
            </small>
          </div>
        </article>

        <article className="stat-card">
          <div className="stat-icon orange">
            <i className="bi bi-megaphone-fill"></i>
          </div>
          <div className="stat-content">
            <p>New Govt. Notifications</p>
            <h2>{unreadUpdatesCount}</h2>
            <small>{updates.length} published updates</small>
          </div>
        </article>
      </section>

      {/* Section Navigation Tabs */}
      <nav className="sp-tabs" aria-label="Student Dashboard Sections">
        {(
          [
            { id: "overview", label: "Overview", icon: "bi-grid-fill" },
            { id: "profile", label: "My Profile", icon: "bi-person-badge" },
            { id: "courses", label: "My Courses", icon: "bi-book" },
            { id: "fees", label: "My Fees", icon: "bi-currency-rupee" },
            { id: "attendance", label: "My Attendance", icon: "bi-calendar-check" },
            {
              id: "updates",
              label: `Govt. Updates${unreadUpdatesCount > 0 ? ` (${unreadUpdatesCount})` : ""}`,
              icon: "bi-megaphone",
            },
          ] as { id: PortalTab; label: string; icon: string }[]
        ).map((tab) => (
          <button
            key={tab.id}
            type="button"
            className={`sp-tab-btn ${activeTab === tab.id ? "active" : ""}`}
            onClick={() => setActiveTab(tab.id)}
          >
            <i className={`bi ${tab.icon}`}></i> {tab.label}
          </button>
        ))}
      </nav>

      {/* MY PROFILE */}
      {(activeTab === "overview" || activeTab === "profile") && profile && (
        <section className="panel" style={{ marginBottom: "20px" }}>
          <div className="panel-header">
            <div>
              <h3>My Profile</h3>
              <p>Your personal and admission information</p>
            </div>
            <span
              className={
                profile.isActive ? "sp-badge-active" : "sp-badge-inactive"
              }
            >
              {profile.isActive ? "Active Student" : "Inactive"}
            </span>
          </div>

          <div className="sp-profile-grid">
            <div className="sp-profile-item">
              <div className="sp-profile-label">Student Name</div>
              <div className="sp-profile-value">{profile.name}</div>
            </div>
            <div className="sp-profile-item">
              <div className="sp-profile-label">Mobile Number</div>
              <div className="sp-profile-value">{profile.mobile}</div>
            </div>
            <div className="sp-profile-item">
              <div className="sp-profile-label">Email</div>
              <div className="sp-profile-value">
                {profile.email || "Not provided"}
              </div>
            </div>
            <div className="sp-profile-item">
              <div className="sp-profile-label">Address</div>
              <div className="sp-profile-value">
                {profile.address || "Not provided"}
              </div>
            </div>
            <div className="sp-profile-item">
              <div className="sp-profile-label">Admission Date</div>
              <div className="sp-profile-value">
                {new Date(profile.admissionDate).toLocaleDateString("en-IN", {
                  day: "2-digit",
                  month: "short",
                  year: "numeric",
                })}
              </div>
            </div>
            <div className="sp-profile-item">
              <div className="sp-profile-label">Gender</div>
              <div className="sp-profile-value">{profile.gender}</div>
            </div>
          </div>
        </section>
      )}

      {/* MY COURSES */}
      {(activeTab === "overview" || activeTab === "courses") && profile && (
        <section className="panel" style={{ marginBottom: "20px" }}>
          <div className="panel-header">
            <div>
              <h3>My Courses</h3>
              <p>Enrolled course details and status</p>
            </div>
            <button
              type="button"
              className="sp-btn-secondary"
              onClick={() => navigate("/courses")}
            >
              View Active Institute Courses
            </button>
          </div>

          {!profile.course ? (
            <p className="sp-empty-text">No course enrolled yet.</p>
          ) : (
            <div className="sp-course-box">
              <img
                src={getCourseImage(profile.course)}
                alt={profile.course}
                className="sp-course-img"
              />
              <div className="sp-course-info">
                <h3>
                  <span>{profile.course}</span>
                  <span
                    className={
                      (profile.courseDetails?.status ?? "Active").toLowerCase() ===
                      "active"
                        ? "sp-badge-active"
                        : "sp-badge-inactive"
                    }
                  >
                    {profile.courseDetails?.status || "Active"}
                  </span>
                </h3>
                <p style={{ margin: "0 0 6px", fontSize: "13px", color: "#475569" }}>
                  Duration:{" "}
                  <strong>
                    {profile.courseDetails?.duration || "As per institute schedule"}
                  </strong>
                  {profile.courseDetails?.courseCode && (
                    <>
                      {" "}
                      · Code: <strong>{profile.courseDetails.courseCode}</strong>
                    </>
                  )}
                </p>
                <p style={{ margin: 0, fontSize: "13px", color: "#64748b" }}>
                  {profile.courseDetails?.description ||
                    `Enrolled in ${profile.course} at ICE Computer Institute.`}
                </p>
              </div>
            </div>
          )}
        </section>
      )}

      {/* MY FEES */}
      {(activeTab === "overview" || activeTab === "fees") && fees && (
        <section className="panel" style={{ marginBottom: "20px" }}>
          <div className="panel-header">
            <div>
              <h3>My Fees</h3>
              <p>Course fee summary and payment history</p>
            </div>
            <div className="sp-fees-strip">
              <span>
                Total Course Fees:{" "}
                <strong>₹{fees.totalFees.toLocaleString("en-IN")}</strong>
              </span>
              <span>
                Paid Amount:{" "}
                <strong style={{ color: "#16a34a" }}>
                  ₹{fees.paidFees.toLocaleString("en-IN")}
                </strong>
              </span>
              <span>
                Pending Amount:{" "}
                <strong style={{ color: "#ea580c" }}>
                  ₹{fees.remainingFees.toLocaleString("en-IN")}
                </strong>
              </span>
            </div>
          </div>

          {fees.payments.length === 0 ? (
            <p className="sp-empty-text">
              No fee payment history recorded yet.
            </p>
          ) : (
            <div className="sp-table-wrap">
              <table className="sp-table">
                <thead>
                  <tr>
                    <th>Receipt ID</th>
                    <th>Payment Date</th>
                    <th>Amount Paid</th>
                    <th>Payment Mode</th>
                    <th>Notes</th>
                  </tr>
                </thead>
                <tbody>
                  {fees.payments.map((p) => (
                    <tr key={p.id}>
                      <td>#{p.id}</td>
                      <td>
                        {new Date(p.paymentDate).toLocaleDateString("en-IN")}
                      </td>
                      <td style={{ fontWeight: 700, color: "#16a34a" }}>
                        ₹{p.amountPaid.toLocaleString("en-IN")}
                      </td>
                      <td>{p.paymentMode}</td>
                      <td>{p.notes || "-"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}

      {/* MY ATTENDANCE */}
      {(activeTab === "overview" || activeTab === "attendance") &&
        attendance && (
          <section className="panel" style={{ marginBottom: "20px" }}>
            <div className="panel-header">
              <div>
                <h3>My Attendance</h3>
                <p>Class attendance summary and daily records</p>
              </div>
              <div className="sp-fees-strip">
                <span>
                  Total Classes: <strong>{attendance.totalDays}</strong>
                </span>
                <span>
                  Present Days:{" "}
                  <strong style={{ color: "#16a34a" }}>
                    {attendance.presentDays}
                  </strong>
                </span>
                <span>
                  Absent Days:{" "}
                  <strong style={{ color: "#ea580c" }}>
                    {attendance.absentDays}
                  </strong>
                </span>
                <span>
                  Percentage:{" "}
                  <strong>{attendance.attendancePercentage}%</strong>
                </span>
              </div>
            </div>

            {attendance.records.length === 0 ? (
              <p className="sp-empty-text">
                No attendance records marked yet.
              </p>
            ) : (
              <div className="sp-table-wrap">
                <table className="sp-table">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Status</th>
                      <th>Remarks</th>
                    </tr>
                  </thead>
                  <tbody>
                    {attendance.records.map((item) => (
                      <tr key={item.id}>
                        <td>
                          {new Date(item.attendanceDate).toLocaleDateString(
                            "en-IN"
                          )}
                        </td>
                        <td>
                          <span
                            className={
                              item.status.toLowerCase() === "present"
                                ? "sp-badge-active"
                                : "sp-badge-inactive"
                            }
                          >
                            {item.status}
                          </span>
                        </td>
                        <td>{item.remarks || "-"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        )}

      {/* GOVERNMENT UPDATES & NOTIFICATIONS */}
      {(activeTab === "overview" || activeTab === "updates") && (
        <section className="panel" style={{ marginBottom: "20px" }}>
          <div className="panel-header">
            <div>
              <h3>Government Updates &amp; Notifications</h3>
              <p>
                Latest jobs, exam forms, scholarships, and admission alerts
              </p>
            </div>
            <button
              type="button"
              className="sp-btn-primary"
              onClick={() => navigate("/govt-updates")}
            >
              Open Full Notifications Board
            </button>
          </div>

          {updates.length === 0 ? (
            <p className="sp-empty-text">
              No government updates have been published yet.
            </p>
          ) : (
            <div className="sp-table-wrap">
              <table className="sp-table">
                <thead>
                  <tr>
                    <th>Announcement</th>
                    <th>Category</th>
                    <th>Start Date</th>
                    <th>Last Date</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {updates.slice(0, 8).map((item) => {
                    const isNew = isUpdateUnread(item, readIds);
                    return (
                      <tr key={item.id}>
                        <td>
                          <strong>{item.title}</strong>
                          {isNew && <span className="sp-badge-new">NEW</span>}
                          {item.isImportant && (
                            <span className="sp-badge-important">
                              IMPORTANT
                            </span>
                          )}
                        </td>
                        <td>{item.category}</td>
                        <td>
                          {item.applicationStartDate
                            ? new Date(
                                item.applicationStartDate
                              ).toLocaleDateString("en-IN")
                            : "-"}
                        </td>
                        <td>
                          {item.applicationLastDate
                            ? new Date(
                                item.applicationLastDate
                              ).toLocaleDateString("en-IN")
                            : "-"}
                        </td>
                        <td>
                          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                            <button
                              type="button"
                              className="sp-btn-secondary"
                              style={{ padding: "5px 10px", fontSize: "12px" }}
                              onClick={() => {
                                setReadIds(markUpdateAsRead(item.id));
                                navigate("/govt-updates");
                              }}
                            >
                              Details
                            </button>
                            {item.officialLink && (
                              <a
                                href={item.officialLink}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="sp-btn-primary"
                                style={{ padding: "5px 10px", fontSize: "12px" }}
                                onClick={() =>
                                  setReadIds(markUpdateAsRead(item.id))
                                }
                              >
                                Apply <i className="bi bi-box-arrow-up-right"></i>
                              </a>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}
    </div>
  );
}
