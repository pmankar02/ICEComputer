
import "./Dashboard.css";
import { useEffect, useState } from "react";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";


const activities = [
  {
    icon: "bi-cash",
    color: "green",
    title: "Fee payment received",
    description: "Rahul Patil paid ₹2,000 for Tally.",
    time: "2 minutes ago",
  },
  {
    icon: "bi-person-plus",
    color: "blue",
    title: "New student registered",
    description: "Sneha Jadhav joined MS-CIT.",
    time: "15 minutes ago",
  },
  {
    icon: "bi-file-earmark-text",
    color: "purple",
    title: "New service request",
    description: "Scholarship form submitted.",
    time: "30 minutes ago",
  },
  {
    icon: "bi-pc-display",
    color: "orange",
    title: "Net cafe session started",
    description: "PC 05 is now occupied.",
    time: "1 hour ago",
  },
];

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
        const response = await fetch(
          "http://localhost:5056/api/students"
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
  "http://localhost:5056/api/FeePayments/all"
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
  "http://localhost:5056/api/StudentFees"
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
            <p>Welcome back, Admin!</p>
          </div>

          <div className="admin-profile">
            <button
              className="notification-button"
              aria-label="Notifications"
              onClick={() => alert("Notifications will be added later.")}
            >
              <i className="bi bi-bell"></i>
            </button>

            <div className="admin-avatar">
              <i className="bi bi-person-fill"></i>
            </div>

            <div>
              <strong>Admin</strong>
              <small>Administrator</small>
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

        <footer className="dashboard-footer">
          ICE Computer Management System · Dashboard
        </footer>
      </main>
    </div>
  );
}

export default Dashboard;
