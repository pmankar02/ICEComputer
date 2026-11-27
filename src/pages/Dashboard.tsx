
import "./Dashboard.css";
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { API_BASE_URL } from "../config/apiConfig";
import { useTheme } from "../context/ThemeContext";
import {
  getGovernmentUpdates,
  getReadUpdateIds,
  isUpdateUnread,
} from "../services/govtUpdateService";
import type { GovernmentUpdate } from "../services/govtUpdateService";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";


const monthlyFees = [
  { month: "Jan", amount: 45 },
  { month: "Feb", amount: 65 },
  { month: "Mar", amount: 85 },
  { month: "Apr", amount: 50 },
  { month: "May", amount: 75 },
  { month: "Jun", amount: 110 },
  { month: "Jul", amount: 70 },
  { month: "Aug", amount: 105 },
  { month: "Sep", amount: 130 },
  { month: "Oct", amount: 150 },
];

function Dashboard() {
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  const [adminMenuOpen, setAdminMenuOpen] = useState(false);
  const adminMenuRef = useRef<HTMLDivElement>(null);
  const [govtUpdates, setGovtUpdates] = useState<GovernmentUpdate[]>([]);
  const [readUpdateIds, setReadUpdateIds] = useState<number[]>(() =>
    getReadUpdateIds()
  );
  const [totalStudents, setTotalStudents] = useState(0);
  const [activeStudents, setActiveStudents] = useState(0);
  const [inactiveStudents, setInactiveStudents] = useState(0);
  const [newAdmissions, setNewAdmissions] = useState(0);
  const [todaysCollection, setTodaysCollection] = useState(0);
  const [pendingFees, setPendingFees] = useState(0);
  const [recentPayments, setRecentPayments] = useState<
  {
    id: number;
    studentName: string;
    course: string;
    amountPaid: number;
    paymentDate: string;
    paymentMode: string;
    notes: string | null;
  }[]
>([]);
  const [courseDistribution, setCourseDistribution] = useState<
  { name: string; value: number }[]
>([]);

  useEffect(() => {
    async function loadStudentCount() {
      try {
        const token = localStorage.getItem("token");
        const response = await fetch(
          `${API_BASE_URL}/api/students`,
          {
            headers: token ? { Authorization: `Bearer ${token}` } : undefined,
          }
        );

        if (!response.ok) {
          throw new Error("Failed to load students");
        }

      const students: {
  course?: string;
  Course?: string;
  admissionDate?: string;
  AdmissionDate?: string;
  status?: string;
  isActive?: boolean;
  IsActive?: boolean;
}[] = await response.json();

const courseCounts: Record<string, number> = {};

students.forEach((student) => {
  const course = student.course ?? student.Course ?? "Other";
  courseCounts[course] = (courseCounts[course] ?? 0) + 1;
});

const distribution = Object.keys(courseCounts).map((name) => ({
  name,
  value: courseCounts[name],
}));

const paymentResponse = await fetch(
  `${API_BASE_URL}/api/FeePayments/all`
);

if (!paymentResponse.ok) {
  throw new Error("Failed to load payments");
}

const payments: {
  amountPaid?: number;
  AmountPaid?: number;
  paymentDate?: string;
  PaymentDate?: string;
}[] = await paymentResponse.json();

const today = new Date();

const todaysTotal = payments.reduce((total, payment) => {
  const dateValue = payment.paymentDate ?? payment.PaymentDate;
  const amount = payment.amountPaid ?? payment.AmountPaid ?? 0;

  if (!dateValue) return total;

  const paymentDate = new Date(dateValue);

  const isToday =
    paymentDate.getFullYear() === today.getFullYear() &&
    paymentDate.getMonth() === today.getMonth() &&
    paymentDate.getDate() === today.getDate();

  return isToday ? total + amount : total;
}, 0);

setTodaysCollection(todaysTotal);

const feeResponse = await fetch(
  `${API_BASE_URL}/api/StudentFees`
);

if (!feeResponse.ok) {
  throw new Error("Unable to load fee records");
}

const feeRecords: {
  remainingFees?: number;
  RemainingFees?: number;
  totalFees?: number;
  TotalFees?: number;
  paidFees?: number;
  PaidFees?: number;
}[] = await feeResponse.json();

const totalPending = feeRecords.reduce((total, fee) => {
  const remaining =
    fee.remainingFees ??
    fee.RemainingFees ??
    ((fee.totalFees ?? fee.TotalFees ?? 0) -
      (fee.paidFees ?? fee.PaidFees ?? 0));

  return total + Math.max(0, remaining);
}, 0);

setPendingFees(totalPending);

setRecentPayments(
  payments
    .map((payment: any) => ({
      id: payment.id ?? payment.Id,
      studentName: payment.studentName ?? payment.StudentName ?? "Unknown",
      course: payment.course ?? payment.Course ?? "-",
      amountPaid: payment.amountPaid ?? payment.AmountPaid ?? 0,
      paymentDate: payment.paymentDate ?? payment.PaymentDate ?? "",
      paymentMode: payment.paymentMode ?? payment.PaymentMode ?? "-",
      notes: payment.notes ?? payment.Notes ?? null,
    }))
    .sort(
      (a, b) =>
        new Date(b.paymentDate).getTime() -
        new Date(a.paymentDate).getTime()
    )
    .slice(0, 5)
);

setCourseDistribution(distribution);
        
        setTotalStudents(students.length);
        setNewAdmissions(
    students.filter((student: { admissionDate?: string; AdmissionDate?: string }) => {
    const date = student.admissionDate ?? student.AdmissionDate;
    if (!date) return false;

    const admission = new Date(date);
    const now = new Date();

    return (
      admission.getMonth() === now.getMonth() &&
      admission.getFullYear() === now.getFullYear()
    );
  }).length
);

setActiveStudents(
  students.filter((student: { status?: string; isActive?: boolean; IsActive?: boolean }) =>
    student.status?.toLowerCase() === "active" ||
    student.isActive === true ||
    student.IsActive === true
  ).length
);

setInactiveStudents(
  students.filter((student: { status?: string; isActive?: boolean; IsActive?: boolean }) =>
    student.status?.toLowerCase() === "inactive" ||
    student.isActive === false ||
    student.IsActive === false
  ).length
);
        setTotalStudents(students.length);
      } catch (error) {
        console.error("Unable to load student count:", error);
      }
    }

    loadStudentCount();

    async function loadGovtUpdates() {
      try {
        const items = await getGovernmentUpdates();
        setGovtUpdates(items.filter((u) => u.isPublished).slice(0, 4));
        setReadUpdateIds(getReadUpdateIds());
      } catch {
        // Ignore if unauthenticated or offline
      }
    }
    loadGovtUpdates();
  }, []);
  
    const stats = [
      {
        title: "Total Students",
        value: String(totalStudents),
        icon: "bi-people-fill",
        color: "blue",
        note: "Active student records",
      },
      {
        title: "Active Students",
        value: String(activeStudents),
        icon: "bi-person-check-fill",
        color: "green",
        note: "Currently active",
      },
      {
        title: "Inactive Students",
        value: String(inactiveStudents),
        icon: "bi-person-x-fill",
        color: "orange",
        note: "Currently inactive",
      },
      {
        title: "New Admissions",
        value: String(newAdmissions),
        icon: "bi-person-plus-fill",
        color: "green",
        note: "This month",
      },
      {
        title: "Today's Collection",
        value: `₹${todaysCollection.toLocaleString("en-IN")}`,
        icon: "bi-cash-stack",
        color: "orange",
        note: "Today's payments",
      },
      {
        title: "Pending Fees",
        value: `₹${pendingFees.toLocaleString("en-IN", {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        })}`,
        icon: "bi-wallet2",
        color: "pink",
        note: "Outstanding balance",
      },
    ];

  let displayName = "Admin";
  let displayRole = "Administrator";
  let isSuperAdmin = false;

  try {
    const storedUser = localStorage.getItem("user");
    const parsed = storedUser ? JSON.parse(storedUser) : null;
    if (parsed) {
      displayName =
        parsed.fullName || parsed.name || parsed.userName || parsed.mobile || "Admin";
      const roles: string[] = Array.isArray(parsed.roles)
        ? parsed.roles
        : parsed.role
          ? [parsed.role]
          : [];
      if (roles.length > 0) {
        displayRole = roles[0];
        isSuperAdmin = roles.some((r) => r.toLowerCase() === "superadmin");
      }
    }
  } catch {
    // Keep defaults
  }

  const unreadCount = govtUpdates.filter((u) =>
    isUpdateUnread(u, readUpdateIds)
  ).length;

  useEffect(() => {
    if (!adminMenuOpen) return;

    const handleOutsideClick = (event: MouseEvent) => {
      if (
        adminMenuRef.current &&
        !adminMenuRef.current.contains(event.target as Node)
      ) {
        setAdminMenuOpen(false);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setAdminMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleOutsideClick);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [adminMenuOpen]);

  const handleLogout = () => {
    const confirmLogout = window.confirm("Are you sure you want to logout?");
    if (!confirmLogout) return;
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setAdminMenuOpen(false);
    navigate("/login", { replace: true });
  };

  return (
    <div className="dashboard-layout">
      <aside className="sidebar">
        <div className="sidebar-brand">
          <i className="bi bi-mortarboard-fill"></i>
          <span>ICE Computer</span>
        </div>

        <nav className="sidebar-nav">
          <a href="#dashboard" className="nav-item active">
            <i className="bi bi-grid-fill"></i>
            Dashboard
          </a>

          <a href="#students" className="nav-item">
            <i className="bi bi-people"></i>
            Students
          </a>

          <a href="#courses" className="nav-item">
            <i className="bi bi-book"></i>
            Courses
          </a>

          <a href="#fees" className="nav-item">
            <i className="bi bi-wallet2"></i>
            Fees
          </a>

          <a href="#attendance" className="nav-item">
            <i className="bi bi-calendar-check"></i>
            Attendance
          </a>

          <a href="#services" className="nav-item">
            <i className="bi bi-file-earmark-text"></i>
            Online Services
          </a>

          <a href="#netcafe" className="nav-item">
            <i className="bi bi-pc-display"></i>
            Net Cafe
          </a>

          <a href="#inventory" className="nav-item">
            <i className="bi bi-box-seam"></i>
            Inventory
          </a>

          <a href="#reports" className="nav-item">
            <i className="bi bi-bar-chart"></i>
            Reports
          </a>

          <a href="#ai-assistant" className="nav-item">
            <i className="bi bi-robot"></i>
            AI Assistant
          </a>

          <a href="#users" className="nav-item">
            <i className="bi bi-person-gear"></i>
            Users &amp; Roles
          </a>

          <a href="#settings" className="nav-item">
            <i className="bi bi-gear"></i>
            Settings
          </a>
        </nav>

        <div className="sidebar-footer">
          <span className="status-dot"></span>
          System Online
        </div>
      </aside>

      <main className="dashboard-main" id="dashboard">
        <header className="topbar">
          <div>
            <h1>Dashboard</h1>
            <p>Welcome back, {displayName}!</p>
          </div>

          <div className="admin-profile">
            <button
              type="button"
              className="theme-toggle-button"
              aria-label={
                theme === "dark"
                  ? "Switch to Light Mode"
                  : "Switch to Dark Mode"
              }
              title={
                theme === "dark"
                  ? "Switch to Light Mode"
                  : "Switch to Dark Mode"
              }
              onClick={toggleTheme}
            >
              <i
                className={
                  theme === "dark" ? "bi bi-sun-fill" : "bi bi-moon-fill"
                }
              ></i>
            </button>

            <button
              type="button"
              className="notification-button"
              aria-label="Notifications"
              title="View Government Updates"
              onClick={() => navigate("/govt-updates")}
            >
              <i className="bi bi-bell"></i>
              {unreadCount > 0 && (
                <span className="notification-badge">{unreadCount}</span>
              )}
            </button>

            <div className="admin-profile-wrapper" ref={adminMenuRef}>
              <button
                type="button"
                className="admin-profile-trigger"
                aria-expanded={adminMenuOpen}
                aria-haspopup="menu"
                onClick={() => setAdminMenuOpen((prev) => !prev)}
              >
                <div className="admin-avatar">
                  <i className="bi bi-person-fill"></i>
                </div>

                <div className="admin-identity">
                  <strong>{displayName}</strong>
                  <small>{displayRole}</small>
                </div>

                <i className="bi bi-chevron-down admin-chevron"></i>
              </button>

              {adminMenuOpen && (
                <div className="admin-dropdown" role="menu">
                  <div className="admin-dropdown-header">
                    <strong>{displayName}</strong>
                    <small>{displayRole}</small>
                  </div>

                  <button
                    type="button"
                    className="admin-dropdown-item"
                    role="menuitem"
                    onClick={() => {
                      setAdminMenuOpen(false);
                      navigate("/change-password");
                    }}
                  >
                    <i className="bi bi-key"></i>
                    <span>Change Password</span>
                  </button>

                  {isSuperAdmin && (
                    <button
                      type="button"
                      className="admin-dropdown-item"
                      role="menuitem"
                      onClick={() => {
                        setAdminMenuOpen(false);
                        navigate("/user-management");
                      }}
                    >
                      <i className="bi bi-person-gear"></i>
                      <span>Users &amp; Roles</span>
                    </button>
                  )}

                  <button
                    type="button"
                    className="admin-dropdown-item danger"
                    role="menuitem"
                    onClick={handleLogout}
                  >
                    <i className="bi bi-box-arrow-right"></i>
                    <span>Logout</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        <section className="stats-grid">
          {stats.map((stat) => (
            <article className="stat-card" key={stat.title}>
              <div className={`stat-icon ${stat.color}`}>
                <i className={`bi ${stat.icon}`}></i>
              </div>

              <div className="stat-content">
                <p>{stat.title}</p>
                <h2>{stat.value}</h2>
                <small>{stat.note}</small>
              </div>
            </article>
          ))}
        </section>

        <section className="dashboard-content-grid">
          <article className="panel collection-panel">
            <div className="panel-header">
              <div>
                <h3>Monthly Fee Collection</h3>
                <p>Collection overview</p>
              </div>

              <select aria-label="Collection period" defaultValue="year">
                <option value="year">This Year</option>
                <option value="month">This Month</option>
              </select>
            </div>

            <div className="chart-area">
              <div className="chart-grid">
                <span>₹15K</span>
                <span>₹10K</span>
                <span>₹5K</span>
                <span>₹0</span>
              </div>

              <div className="bar-chart">
                {monthlyFees.map((item) => (
                  <div className="bar-column" key={item.month}>
                    <div
                      className="chart-bar"
                      style={{ height: `${(item.amount / 150) * 100}%` }}
                      title={`${item.month}: ₹${item.amount * 100}`}
                    ></div>

                    <span>{item.month}</span>
                  </div>
                ))}
              </div>
            </div>
          </article>

          <article className="panel course-distribution-panel">
            <div className="panel-header">
              <div>
                <h3>Student Course Distribution</h3>
                <p>Students enrolled in each course</p>
              </div>
            </div>

              <div style={{ width: "100%", height: 220 }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={courseDistribution}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={45}
                    outerRadius={70}
                    paddingAngle={3}
                  >
                    {courseDistribution.map((_, index) => (
                      <Cell
                        key={index}
                        fill={[
                          "#2684FF",
                          "#24B47E",
                          "#FF9F43",
                          "#9B59B6",
                          "#F45B69",
                          "#16B8C8",
                        ][index % 6]}
                      />
                    ))}
                  </Pie>
                  <text
                    x="50%"
                    y="40%"
                    textAnchor="middle"
                    dominantBaseline="middle"
                    style={{ fontSize: 24, fontWeight: 700, fill: "#1e293b" }}
                  >
                    {totalStudents}
                  </text>

                  <text
                    x="50%"
                    y="48%"
                    textAnchor="middle"
                    dominantBaseline="middle"
                    style={{ fontSize: 11, fill: "#64748b" }}
                  >
                    Students
                  </text>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </article>

         
          <article className="panel activities-panel">
          <div className="panel-header">
            <div>
              <h3>Recent Payments</h3>
              <p>Latest fee transactions</p>
            </div>
          </div>

          <div className="activity-list">
            {recentPayments.length === 0 ? (
              <p>No payment records found.</p>
            ) : (
              recentPayments.map((payment) => (
                <div className="activity-item" key={payment.id}>
                  <div className="activity-icon green">
                    <i className="bi bi-cash-stack"></i>
                  </div>

                  <div className="activity-details">
                    <strong>{payment.studentName}</strong>
                    <p>
                      ₹
                      {payment.amountPaid.toLocaleString("en-IN", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}{" "}
                      · {payment.course}
                    </p>
                    <small>
                      {payment.paymentDate
                        ? new Date(payment.paymentDate).toLocaleString("en-IN")
                        : "-"}{" "}
                      · {payment.paymentMode}
                    </small>
                  </div>
                </div>
              ))
            )}
          </div>
        </article>
        </section>

        <section className="panel" style={{ marginTop: "20px" }}>
          <div className="panel-header">
            <div>
              <h3>Latest Government Updates &amp; Alerts</h3>
              <p>Job vacancies, exam forms, scholarships, and admissions</p>
            </div>
            <button
              type="button"
              onClick={() => navigate("/govt-updates")}
              style={{
                background: "#2563eb",
                color: "#ffffff",
                border: "none",
                borderRadius: "8px",
                padding: "8px 14px",
                fontSize: "12px",
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              View All Updates
            </button>
          </div>

          <div className="activity-list">
            {govtUpdates.length === 0 ? (
              <p>No published government updates yet.</p>
            ) : (
              govtUpdates.map((item) => {
                const isNew = isUpdateUnread(item, readUpdateIds);
                return (
                  <div
                    className="activity-item"
                    key={item.id}
                    style={{ cursor: "pointer" }}
                    onClick={() => navigate("/govt-updates")}
                  >
                    <div
                      className={`activity-icon ${
                        item.isImportant ? "orange" : "blue"
                      }`}
                    >
                      <i
                        className={`bi ${
                          item.isImportant
                            ? "bi-pin-angle-fill"
                            : "bi-megaphone-fill"
                        }`}
                      ></i>
                    </div>

                    <div className="activity-details" style={{ flex: 1 }}>
                      <strong style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        {item.title}
                        {isNew && (
                          <span
                            style={{
                              background: "#2563eb",
                              color: "#ffffff",
                              fontSize: "10px",
                              padding: "2px 6px",
                              borderRadius: "10px",
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
                            }}
                          >
                            IMPORTANT
                          </span>
                        )}
                      </strong>
                      <p>
                        {item.category} · Last Date:{" "}
                        {item.applicationLastDate
                          ? new Date(item.applicationLastDate).toLocaleDateString("en-IN")
                          : "See Details"}
                      </p>
                      <small>
                        Published:{" "}
                        {new Date(
                          item.publishedAt || item.createdAt
                        ).toLocaleDateString("en-IN")}
                      </small>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </section>

        <footer className="dashboard-footer">
          ICE Computer Management System · Dashboard
        </footer>
      </main>
    </div>
  );
}

export default Dashboard;
