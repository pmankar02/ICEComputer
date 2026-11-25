import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { API_BASE_URL } from "../config/apiConfig";
import { getCourseImage } from "../services/courseService";
import {
  getGovernmentUpdates,
  getReadUpdateIds,
  isUpdateUnread,
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
import "./StudentDashboard.css";

type PortalTab = "overview" | "profile" | "courses" | "fees" | "attendance" | "updates";

export default function StudentDashboard() {
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<PortalTab>("overview");
  const [profile, setProfile] = useState<StudentProfile | null>(null);
  const [fees, setFees] = useState<StudentFeesSummary | null>(null);
  const [attendance, setAttendance] = useState<StudentAttendanceSummary | null>(null);
  const [updates, setUpdates] = useState<GovernmentUpdate[]>([]);
  const [readIds] = useState<number[]>(() => getReadUpdateIds());
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");

  useEffect(() => {
    async function loadPortalData() {
      try {
        setLoading(true);
        setError("");

        const [profileRes, feesRes, attendanceRes, updatesRes] = await Promise.all([
          getMyProfile(),
          getMyFees(),
          getMyAttendance(),
          getGovernmentUpdates(),
        ]);

        setProfile(profileRes);
        setFees(feesRes);
        setAttendance(attendanceRes);
        setUpdates(updatesRes.filter((u) => u.isPublished));
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to load student dashboard."
        );
      } finally {
        setLoading(false);
      }
    }

    loadPortalData();
  }, []);

  const unreadUpdatesCount = useMemo(
    () => updates.filter((u) => isUpdateUnread(u, readIds)).length,
    [updates, readIds]
  );

  if (loading) {
    return (
      <div className="student-portal">
        <div className="sp-panel">Loading your Student Dashboard...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="student-portal">
        <div
          className="sp-panel"
          style={{ borderColor: "#fecaca", background: "#fef2f2", color: "#b91c1c" }}
        >
          <strong>Unable to load student portal:</strong> {error}
        </div>
      </div>
    );
  }

  return (
    <div className="student-portal">
      {/* Header */}
      <header className="sp-header">
        <div className="sp-welcome">
          {profile?.photoUrl ? (
            <img
              src={`${API_BASE_URL}${profile.photoUrl}`}
              alt={profile.name}
              className="sp-avatar"
            />
          ) : (
            <div className="sp-avatar">
              <i className="bi bi-person-fill"></i>
            </div>
          )}
          <div>
            <h1>Welcome, {profile?.name || "Student"}!</h1>
            <p>
              Course: <strong>{profile?.course}</strong> · Mobile:{" "}
              <strong>{profile?.mobile}</strong>
            </p>
          </div>
        </div>

        <div className="sp-actions">
          <button
            type="button"
            className="sp-btn-secondary"
            onClick={() => navigate("/change-password")}
          >
            <i className="bi bi-key-fill"></i> Change Password
          </button>
          <button
            type="button"
            className="sp-btn-primary"
            onClick={() => navigate("/govt-updates")}
          >
            <i className="bi bi-megaphone-fill"></i> Govt. Updates
            {unreadUpdatesCount > 0 && ` (${unreadUpdatesCount} New)`}
          </button>
        </div>
      </header>

      {/* Summary Cards */}
      <section className="sp-stats-grid">
        <div className="sp-stat-card">
          <div>
            <h3>My Course</h3>
            <p className="sp-stat-value" style={{ fontSize: "18px" }}>
              {profile?.course || "-"}
            </p>
          </div>
          <div className="sp-stat-icon" style={{ background: "#eff6ff", color: "#2563eb" }}>
            <i className="bi bi-book-half"></i>
          </div>
        </div>

        <div className="sp-stat-card">
          <div>
            <h3>Pending Fees</h3>
            <p className="sp-stat-value" style={{ color: "#dc2626" }}>
              ₹{(fees?.remainingFees ?? 0).toLocaleString("en-IN")}
            </p>
          </div>
          <div className="sp-stat-icon" style={{ background: "#fef2f2", color: "#dc2626" }}>
            <i className="bi bi-wallet2"></i>
          </div>
        </div>

        <div className="sp-stat-card">
          <div>
            <h3>My Attendance</h3>
            <p className="sp-stat-value" style={{ color: "#059669" }}>
              {attendance?.attendancePercentage ?? 0}%
            </p>
          </div>
          <div className="sp-stat-icon" style={{ background: "#ecfdf5", color: "#059669" }}>
            <i className="bi bi-calendar-check-fill"></i>
          </div>
        </div>

        <div className="sp-stat-card">
          <div>
            <h3>Govt. Updates</h3>
            <p className="sp-stat-value">{updates.length}</p>
          </div>
          <div className="sp-stat-icon" style={{ background: "#fffbeb", color: "#d97706" }}>
            <i className="bi bi-bell-fill"></i>
          </div>
        </div>
      </section>

      {/* Navigation Tabs */}
      <nav className="sp-tabs">
        {(
          [
            { id: "overview", label: "Overview", icon: "bi-grid-fill" },
            { id: "profile", label: "My Profile", icon: "bi-person-badge" },
            { id: "courses", label: "My Courses", icon: "bi-book" },
            { id: "fees", label: "My Fees", icon: "bi-currency-rupee" },
            { id: "attendance", label: "My Attendance", icon: "bi-calendar-check" },
            { id: "updates", label: "Govt. Updates", icon: "bi-megaphone" },
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
        <section className="sp-panel">
          <div className="sp-panel-header">
            <h2>My Profile</h2>
            <span
              className={profile.isActive ? "sp-badge-present" : "sp-badge-absent"}
            >
              {profile.isActive ? "Active Student" : "Inactive"}
            </span>
          </div>

          <div className="sp-profile-grid">
            <div className="sp-profile-item">
              <div className="sp-profile-label">Full Name</div>
              <div className="sp-profile-value">{profile.name}</div>
            </div>
            <div className="sp-profile-item">
              <div className="sp-profile-label">Mobile Number (Username)</div>
              <div className="sp-profile-value">{profile.mobile}</div>
            </div>
            <div className="sp-profile-item">
              <div className="sp-profile-label">Email</div>
              <div className="sp-profile-value">{profile.email || "Not provided"}</div>
            </div>
            <div className="sp-profile-item">
              <div className="sp-profile-label">Gender</div>
              <div className="sp-profile-value">{profile.gender}</div>
            </div>
            <div className="sp-profile-item">
              <div className="sp-profile-label">Address</div>
              <div className="sp-profile-value">{profile.address || "Not provided"}</div>
            </div>
            <div className="sp-profile-item">
              <div className="sp-profile-label">Admission Date</div>
              <div className="sp-profile-value">
                {new Date(profile.admissionDate).toLocaleDateString("en-IN")}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* MY COURSES */}
      {(activeTab === "overview" || activeTab === "courses") && profile && (
        <section className="sp-panel">
          <div className="sp-panel-header">
            <h2>My Enrolled Course</h2>
            <button
              type="button"
              className="sp-btn-secondary"
              onClick={() => navigate("/courses")}
            >
              Browse All Active Courses
            </button>
          </div>

          <div
            style={{
              display: "flex",
              gap: "18px",
              alignItems: "center",
              flexWrap: "wrap",
              background: "#f8fafc",
              border: "1px solid #e2e8f0",
              borderRadius: "10px",
              padding: "16px",
            }}
          >
            <img
              src={getCourseImage(profile.course)}
              alt={profile.course}
              style={{
                width: "220px",
                height: "125px",
                objectFit: "cover",
                borderRadius: "8px",
                border: "1px solid #cbd5e1",
              }}
            />
            <div style={{ flex: 1, minWidth: "220px" }}>
              <h3 style={{ margin: "0 0 6px", color: "#0f172a" }}>{profile.course}</h3>
              {profile.courseDetails ? (
                <>
                  <p style={{ margin: "0 0 6px", fontSize: "13px", color: "#475569" }}>
                    Code: <strong>{profile.courseDetails.courseCode}</strong> · Duration:{" "}
                    <strong>{profile.courseDetails.duration}</strong> · Fees:{" "}
                    <strong>
                      ₹{profile.courseDetails.courseFees.toLocaleString("en-IN")}
                    </strong>
                  </p>
                  <p style={{ margin: 0, fontSize: "13px", color: "#64748b" }}>
                    {profile.courseDetails.description ||
                      "Practical computer training and certification."}
                  </p>
                </>
              ) : (
                <p style={{ margin: 0, fontSize: "13px", color: "#64748b" }}>
                  You are currently enrolled in {profile.course}.
                </p>
              )}
            </div>
          </div>
        </section>
      )}

      {/* MY FEES */}
      {(activeTab === "overview" || activeTab === "fees") && fees && (
        <section className="sp-panel">
          <div className="sp-panel-header">
            <h2>My Fees &amp; Payment History</h2>
            <div style={{ fontSize: "13px", color: "#475569" }}>
              Total: <strong>₹{fees.totalFees.toLocaleString("en-IN")}</strong> · Paid:{" "}
              <strong style={{ color: "#059669" }}>
                ₹{fees.paidFees.toLocaleString("en-IN")}
              </strong>{" "}
              · Balance:{" "}
              <strong style={{ color: "#dc2626" }}>
                ₹{fees.remainingFees.toLocaleString("en-IN")}
              </strong>
            </div>
          </div>

          {fees.payments.length === 0 ? (
            <p style={{ color: "#64748b", fontSize: "13px", margin: 0 }}>
              No fee payment receipts recorded yet.
            </p>
          ) : (
            <div className="sp-table-wrap">
              <table className="sp-table">
                <thead>
                  <tr>
                    <th>Receipt ID</th>
                    <th>Payment Date</th>
                    <th>Amount Paid</th>
                    <th>Mode</th>
                    <th>Notes</th>
                  </tr>
                </thead>
                <tbody>
                  {fees.payments.map((p) => (
                    <tr key={p.id}>
                      <td>#{p.id}</td>
                      <td>{new Date(p.paymentDate).toLocaleDateString("en-IN")}</td>
                      <td style={{ fontWeight: 700, color: "#059669" }}>
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
      {(activeTab === "overview" || activeTab === "attendance") && attendance && (
        <section className="sp-panel">
          <div className="sp-panel-header">
            <h2>My Attendance</h2>
            <div style={{ fontSize: "13px", color: "#475569" }}>
              Total Days: <strong>{attendance.totalDays}</strong> · Present:{" "}
              <strong style={{ color: "#059669" }}>{attendance.presentDays}</strong> ·
              Absent:{" "}
              <strong style={{ color: "#dc2626" }}>{attendance.absentDays}</strong>
            </div>
          </div>

          {attendance.records.length === 0 ? (
            <p style={{ color: "#64748b", fontSize: "13px", margin: 0 }}>
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
                        {new Date(item.attendanceDate).toLocaleDateString("en-IN")}
                      </td>
                      <td>
                        <span
                          className={
                            item.status.toLowerCase() === "present"
                              ? "sp-badge-present"
                              : "sp-badge-absent"
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
        <section className="sp-panel">
          <div className="sp-panel-header">
            <h2>Government Updates &amp; Notifications</h2>
            <button
              type="button"
              className="sp-btn-primary"
              onClick={() => navigate("/govt-updates")}
            >
              Open Full Notifications Board
            </button>
          </div>

          {updates.length === 0 ? (
            <p style={{ color: "#64748b", fontSize: "13px", margin: 0 }}>
              No government updates published yet.
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
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {updates.slice(0, 6).map((item) => {
                    const isNew = isUpdateUnread(item, readIds);
                    return (
                      <tr key={item.id}>
                        <td>
                          <strong>{item.title}</strong>{" "}
                          {isNew && (
                            <span
                              style={{
                                background: "#2563eb",
                                color: "#fff",
                                fontSize: "10px",
                                padding: "2px 6px",
                                borderRadius: "10px",
                                marginLeft: "6px",
                              }}
                            >
                              NEW
                            </span>
                          )}
                          {item.isImportant && (
                            <span
                              style={{
                                background: "#fef2f2",
                                color: "#dc2626",
                                border: "1px solid #fecaca",
                                fontSize: "10px",
                                padding: "1px 6px",
                                borderRadius: "10px",
                                marginLeft: "6px",
                              }}
                            >
                              IMPORTANT
                            </span>
                          )}
                        </td>
                        <td>{item.category}</td>
                        <td>
                          {item.applicationStartDate
                            ? new Date(item.applicationStartDate).toLocaleDateString(
                                "en-IN"
                              )
                            : "-"}
                        </td>
                        <td>
                          {item.applicationLastDate
                            ? new Date(item.applicationLastDate).toLocaleDateString(
                                "en-IN"
                              )
                            : "-"}
                        </td>
                        <td>
                          <button
                            type="button"
                            className="sp-btn-secondary"
                            style={{ padding: "5px 10px", fontSize: "12px" }}
                            onClick={() => navigate("/govt-updates")}
                          >
                            View
                          </button>
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
