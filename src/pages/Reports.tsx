import { useCallback, useEffect, useMemo, useState } from "react";
import "./Reports.css";
import { getCourses } from "../services/courseService";
import {
  getAdmissionReport,
  getAttendanceReport,
  getCourseReport,
  getFeesReport,
  getGovtUpdatesReport,
  getStudentReport,
  type AdmissionReportResponse,
  type AttendanceReportResponse,
  type CourseReportResponse,
  type FeesReportResponse,
  type GovtUpdatesReportResponse,
  type ReportFilter,
  type StudentReportResponse,
} from "../services/reportService";
import {
  exportReportToExcel,
  printOrExportPdfReport,
  type ExportReportOptions,
} from "../utils/reportExport";

type ReportCategoryKey =
  | "students"
  | "admissions"
  | "fees"
  | "attendance"
  | "courses"
  | "govtUpdates";

interface CategoryMeta {
  key: ReportCategoryKey;
  label: string;
  description: string;
  icon: string;
  allowedRoles: string[];
}

const REPORT_CATEGORIES: CategoryMeta[] = [
  {
    key: "students",
    label: "Student Reports",
    description: "Total, active/inactive, course-wise & admission details",
    icon: "bi-people-fill",
    allowedRoles: ["superadmin", "adminstaff"],
  },
  {
    key: "admissions",
    label: "Admission Reports",
    description: "Daily, monthly, date-wise & course-wise admissions",
    icon: "bi-person-plus-fill",
    allowedRoles: ["superadmin", "adminstaff"],
  },
  {
    key: "fees",
    label: "Fees Reports",
    description: "Total, paid, pending, partial & payment history",
    icon: "bi-wallet2",
    allowedRoles: ["superadmin", "adminstaff", "student"],
  },
  {
    key: "attendance",
    label: "Attendance Reports",
    description: "Daily, monthly, student-wise & course-wise attendance",
    icon: "bi-calendar-check-fill",
    allowedRoles: ["superadmin", "adminstaff", "faculty", "student"],
  },
  {
    key: "courses",
    label: "Course Reports",
    description: "Active/inactive courses, enrollments & fee summaries",
    icon: "bi-book-fill",
    allowedRoles: ["superadmin", "faculty"],
  },
  {
    key: "govtUpdates",
    label: "Govt. Updates Reports",
    description: "Published, category-wise & important updates",
    icon: "bi-megaphone-fill",
    allowedRoles: ["superadmin"],
  },
];

function getUserRoles(): string[] {
  try {
    const raw = localStorage.getItem("user");
    const parsed = raw ? JSON.parse(raw) : null;
    if (Array.isArray(parsed?.roles)) {
      return parsed.roles.map((r: string) => r.toLowerCase());
    }
    if (typeof parsed?.role === "string") {
      return [parsed.role.toLowerCase()];
    }
  } catch {
    // Ignore parse error
  }
  return [];
}

function formatDate(value?: string | null): string {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function formatCurrency(amount: number): string {
  return `₹${amount.toLocaleString("en-IN", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })}`;
}

function Reports() {
  const userRoles = useMemo(() => getUserRoles(), []);
  const availableCategories = useMemo(
    () =>
      REPORT_CATEGORIES.filter((cat) =>
        cat.allowedRoles.some((role) => userRoles.includes(role))
      ),
    [userRoles]
  );

  const isStudentOnly = useMemo(
    () =>
      userRoles.includes("student") &&
      !userRoles.some((r) => ["superadmin", "adminstaff", "faculty"].includes(r)),
    [userRoles]
  );

  const [activeCategory, setActiveCategory] = useState<ReportCategoryKey>(
    () => availableCategories[0]?.key ?? "attendance"
  );
  const [feesTab, setFeesTab] = useState<"studentFees" | "payments">("studentFees");

  // Filter inputs
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [course, setCourse] = useState("All");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("All");
  const [govtCategory, setGovtCategory] = useState("All");
  const [page, setPage] = useState(1);

  const [courseOptions, setCourseOptions] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Report Data States
  const [studentReport, setStudentReport] = useState<StudentReportResponse | null>(null);
  const [admissionReport, setAdmissionReport] = useState<AdmissionReportResponse | null>(null);
  const [feesReport, setFeesReport] = useState<FeesReportResponse | null>(null);
  const [attendanceReport, setAttendanceReport] = useState<AttendanceReportResponse | null>(null);
  const [courseReport, setCourseReport] = useState<CourseReportResponse | null>(null);
  const [govtReport, setGovtReport] = useState<GovtUpdatesReportResponse | null>(null);

  useEffect(() => {
    let mounted = true;
    getCourses()
      .then((list) => {
        if (!mounted) return;
        const names = Array.from(new Set(list.map((c) => c.courseName))).sort();
        setCourseOptions(names);
      })
      .catch(() => {
        // Non-blocking if course list fails
      });
    return () => {
      mounted = false;
    };
  }, []);

  const loadReport = useCallback(
    async (
      cat: ReportCategoryKey,
      filterOverrides?: Partial<ReportFilter>
    ) => {
      const currentFilter: ReportFilter = {
        fromDate: filterOverrides?.fromDate !== undefined ? filterOverrides.fromDate : fromDate,
        toDate: filterOverrides?.toDate !== undefined ? filterOverrides.toDate : toDate,
        course: filterOverrides?.course !== undefined ? filterOverrides.course : course,
        search: filterOverrides?.search !== undefined ? filterOverrides.search : search,
        status: filterOverrides?.status !== undefined ? filterOverrides.status : status,
        category: filterOverrides?.category !== undefined ? filterOverrides.category : govtCategory,
        page: filterOverrides?.page ?? page,
        pageSize: 20,
      };

      setLoading(true);
      setError("");

      try {
        switch (cat) {
          case "students":
            setStudentReport(await getStudentReport(currentFilter));
            break;
          case "admissions":
            setAdmissionReport(await getAdmissionReport(currentFilter));
            break;
          case "fees":
            setFeesReport(await getFeesReport(currentFilter));
            break;
          case "attendance":
            setAttendanceReport(await getAttendanceReport(currentFilter));
            break;
          case "courses":
            setCourseReport(await getCourseReport(currentFilter));
            break;
          case "govtUpdates":
            setGovtReport(await getGovtUpdatesReport(currentFilter));
            break;
        }
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to load report data."
        );
      } finally {
        setLoading(false);
      }
    },
    [fromDate, toDate, course, search, status, govtCategory, page]
  );

  useEffect(() => {
    loadReport(activeCategory, { page });
  }, [activeCategory, page]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleCategoryChange = (key: ReportCategoryKey) => {
    setActiveCategory(key);
    setStatus("All");
    setGovtCategory("All");
    setPage(1);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (fromDate && toDate && fromDate > toDate) {
      setError("From Date cannot be later than To Date.");
      return;
    }
    setPage(1);
    loadReport(activeCategory, { page: 1 });
  };

  const handleReset = () => {
    setFromDate("");
    setToDate("");
    setCourse("All");
    setSearch("");
    setStatus("All");
    setGovtCategory("All");
    setPage(1);
    loadReport(activeCategory, {
      fromDate: "",
      toDate: "",
      course: "All",
      search: "",
      status: "All",
      category: "All",
      page: 1,
    });
  };

  const buildExportOptions = (): ExportReportOptions | null => {
    if (activeCategory === "students" && studentReport) {
      return {
        title: "Student Report",
        fromDate,
        toDate,
        fileName: "ICE_Student_Report",
        summary: [
          { label: "Total Students", value: studentReport.summary.totalStudents },
          { label: "Active Students", value: studentReport.summary.activeStudents },
          { label: "Inactive Students", value: studentReport.summary.inactiveStudents },
          { label: "Courses", value: studentReport.summary.distinctCourses },
        ],
        headers: ["ID", "Name", "Mobile", "Email", "Gender", "Course", "Admission Date", "Status"],
        rows: studentReport.data.items.map((r) => [
          r.studentId,
          r.name,
          r.mobile,
          r.email ?? "—",
          r.gender,
          r.course,
          formatDate(r.admissionDate),
          r.isActive ? "Active" : "Inactive",
        ]),
      };
    }

    if (activeCategory === "admissions" && admissionReport) {
      return {
        title: "Admission Report",
        fromDate,
        toDate,
        fileName: "ICE_Admission_Report",
        summary: [
          { label: "Total Admissions", value: admissionReport.summary.totalAdmissions },
          { label: "Daily (Today)", value: admissionReport.summary.todayAdmissions },
          { label: "This Month", value: admissionReport.summary.thisMonthAdmissions },
        ],
        headers: ["Student ID", "Student Name", "Mobile", "Course", "Admission Date", "Status"],
        rows: admissionReport.data.items.map((r) => [
          r.studentId,
          r.studentName,
          r.mobile,
          r.course,
          formatDate(r.admissionDate),
          r.status,
        ]),
      };
    }

    if (activeCategory === "fees" && feesReport) {
      if (feesTab === "studentFees") {
        return {
          title: "Student-wise Fee Report",
          fromDate,
          toDate,
          fileName: "ICE_Student_Fees_Report",
          summary: [
            { label: "Total Fees", value: formatCurrency(feesReport.summary.totalFees) },
            { label: "Paid Fees", value: formatCurrency(feesReport.summary.totalPaidFees) },
            { label: "Pending Fees", value: formatCurrency(feesReport.summary.pendingFees) },
            { label: "Partial Payments", value: feesReport.summary.partialPaymentCount },
          ],
          headers: ["Student ID", "Student Name", "Mobile", "Course", "Total Fees", "Paid Fees", "Remaining", "Status"],
          rows: feesReport.studentFees.items.map((r) => [
            r.studentId,
            r.studentName,
            r.mobile,
            r.course,
            formatCurrency(r.totalFees),
            formatCurrency(r.paidFees),
            formatCurrency(r.remainingFees),
            r.paymentStatus,
          ]),
        };
      }
      return {
        title: "Date-wise Fee Payment Report",
        fromDate,
        toDate,
        fileName: "ICE_Fee_Payments_Report",
        summary: [
          { label: "Total Fees", value: formatCurrency(feesReport.summary.totalFees) },
          { label: "Total Paid", value: formatCurrency(feesReport.summary.totalPaidFees) },
          { label: "Pending Fees", value: formatCurrency(feesReport.summary.pendingFees) },
        ],
        headers: ["Payment ID", "Student Name", "Course", "Amount Paid", "Payment Date", "Mode", "Notes"],
        rows: feesReport.payments.items.map((r) => [
          r.paymentId,
          r.studentName,
          r.course,
          formatCurrency(r.amountPaid),
          formatDate(r.paymentDate),
          r.paymentMode,
          r.notes ?? "—",
        ]),
      };
    }

    if (activeCategory === "attendance" && attendanceReport) {
      return {
        title: "Attendance Report",
        fromDate,
        toDate,
        fileName: "ICE_Attendance_Report",
        summary: [
          { label: "Total Marked", value: attendanceReport.summary.totalRecords },
          { label: "Present", value: attendanceReport.summary.presentCount },
          { label: "Absent", value: attendanceReport.summary.absentCount },
          { label: "Late", value: attendanceReport.summary.lateCount },
          { label: "Attendance %", value: `${attendanceReport.summary.attendancePercentage}%` },
        ],
        headers: ["Date", "Student Name", "Course", "Status", "Remarks"],
        rows: attendanceReport.data.items.map((r) => [
          formatDate(r.attendanceDate),
          r.studentName,
          r.course,
          r.status,
          r.remarks ?? "—",
        ]),
      };
    }

    if (activeCategory === "courses" && courseReport) {
      return {
        title: "Course Report",
        fromDate,
        toDate,
        fileName: "ICE_Course_Report",
        summary: [
          { label: "Total Courses", value: courseReport.summary.totalCourses },
          { label: "Active Courses", value: courseReport.summary.activeCourses },
          { label: "Inactive Courses", value: courseReport.summary.inactiveCourses },
          { label: "Total Fee Structure", value: formatCurrency(courseReport.summary.totalFeeStructureSum) },
        ],
        headers: ["Code", "Course Name", "Duration", "Course Fee", "Status", "Students", "Billed", "Collected", "Pending"],
        rows: courseReport.data.items.map((r) => [
          r.courseCode,
          r.courseName,
          r.duration,
          formatCurrency(r.courseFees),
          r.status,
          r.enrolledStudents,
          formatCurrency(r.totalBilledFees),
          formatCurrency(r.totalCollectedFees),
          formatCurrency(r.totalPendingFees),
        ]),
      };
    }

    if (activeCategory === "govtUpdates" && govtReport) {
      return {
        title: "Government Updates Report",
        fromDate,
        toDate,
        fileName: "ICE_Govt_Updates_Report",
        summary: [
          { label: "Total Updates", value: govtReport.summary.totalUpdates },
          { label: "Published", value: govtReport.summary.publishedUpdates },
          { label: "Drafts", value: govtReport.summary.draftUpdates },
          { label: "Important", value: govtReport.summary.importantUpdates },
        ],
        headers: ["ID", "Title", "Category", "Published", "Important", "Published Date", "Last Date", "Created By"],
        rows: govtReport.data.items.map((r) => [
          r.id,
          r.title,
          r.category,
          r.isPublished ? "Yes" : "No",
          r.isImportant ? "Yes" : "No",
          formatDate(r.publishedAt ?? r.createdAt),
          formatDate(r.applicationLastDate),
          r.createdBy,
        ]),
      };
    }

    return null;
  };

  const handleExportExcel = () => {
    const opts = buildExportOptions();
    if (opts) exportReportToExcel(opts);
  };

  const handlePrintOrPdf = () => {
    const opts = buildExportOptions();
    if (opts) printOrExportPdfReport(opts);
  };

  const statusOptions = useMemo(() => {
    switch (activeCategory) {
      case "students":
      case "admissions":
      case "courses":
        return ["All", "Active", "Inactive"];
      case "fees":
        return ["All", "Paid", "Partial", "Pending"];
      case "attendance":
        return ["All", "Present", "Absent", "Late"];
      case "govtUpdates":
        return ["All", "Published", "Draft", "Important"];
    }
  }, [activeCategory]);

  const currentPaged = useMemo(() => {
    switch (activeCategory) {
      case "students":
        return studentReport?.data;
      case "admissions":
        return admissionReport?.data;
      case "fees":
        return feesTab === "studentFees" ? feesReport?.studentFees : feesReport?.payments;
      case "attendance":
        return attendanceReport?.data;
      case "courses":
        return courseReport?.data;
      case "govtUpdates":
        return govtReport?.data;
    }
  }, [
    activeCategory,
    feesTab,
    studentReport,
    admissionReport,
    feesReport,
    attendanceReport,
    courseReport,
    govtReport,
  ]);

  return (
    <div className="reports-page">
      {/* Page Header */}
      <header className="reports-header">
        <div>
          <h1>
            <i className="bi bi-bar-chart-line-fill"></i>
            Reports &amp; Analytics
          </h1>
          <p>
            Generate, filter, print, and export real-time institute reports.
          </p>
        </div>

        <div className="reports-export-actions">
          <button
            type="button"
            className="reports-btn-secondary"
            onClick={handlePrintOrPdf}
            disabled={loading}
          >
            <i className="bi bi-file-earmark-pdf-fill"></i>
            <span>Export PDF</span>
          </button>

          <button
            type="button"
            className="reports-btn-success"
            onClick={handleExportExcel}
            disabled={loading}
          >
            <i className="bi bi-file-earmark-excel-fill"></i>
            <span>Export Excel</span>
          </button>

          <button
            type="button"
            className="reports-btn-primary"
            onClick={handlePrintOrPdf}
            disabled={loading}
          >
            <i className="bi bi-printer-fill"></i>
            <span>Print Report</span>
          </button>
        </div>
      </header>

      {/* Report Category Cards */}
      <section className="reports-category-grid" aria-label="Report Categories">
        {availableCategories.map((cat) => (
          <button
            key={cat.key}
            type="button"
            className={`reports-category-card${activeCategory === cat.key ? " active" : ""}`}
            onClick={() => handleCategoryChange(cat.key)}
          >
            <div className="reports-category-icon">
              <i className={`bi ${cat.icon}`}></i>
            </div>
            <div className="reports-category-text">
              <strong>{cat.label}</strong>
              <span>{cat.description}</span>
            </div>
          </button>
        ))}
      </section>

      {/* Filter Section */}
      <form className="reports-filter-card" onSubmit={handleSearchSubmit}>
        <div className="reports-filter-grid">
          <div className="reports-filter-field">
            <label htmlFor="reportFromDate">From Date</label>
            <input
              id="reportFromDate"
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
            />
          </div>

          <div className="reports-filter-field">
            <label htmlFor="reportToDate">To Date</label>
            <input
              id="reportToDate"
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
            />
          </div>

          {activeCategory !== "govtUpdates" && !isStudentOnly && (
            <div className="reports-filter-field">
              <label htmlFor="reportCourse">Course</label>
              <select
                id="reportCourse"
                value={course}
                onChange={(e) => setCourse(e.target.value)}
              >
                <option value="All">All Courses</option>
                {courseOptions.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
          )}

          {activeCategory === "govtUpdates" && (
            <div className="reports-filter-field">
              <label htmlFor="reportGovtCat">Category</label>
              <select
                id="reportGovtCat"
                value={govtCategory}
                onChange={(e) => setGovtCategory(e.target.value)}
              >
                <option value="All">All Categories</option>
                <option value="Job Vacancy">Job Vacancy</option>
                <option value="Exam Form">Exam Form</option>
                <option value="Scholarship">Scholarship</option>
                <option value="Admission Form">Admission Form</option>
                <option value="Government Scheme">Government Scheme</option>
                <option value="Other">Other</option>
              </select>
            </div>
          )}

          <div className="reports-filter-field">
            <label htmlFor="reportStatus">Status</label>
            <select
              id="reportStatus"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
            >
              {statusOptions.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </div>

          {!isStudentOnly && (
            <div className="reports-filter-field">
              <label htmlFor="reportSearch">Search</label>
              <input
                id="reportSearch"
                type="search"
                placeholder="Student name, mobile, or keyword..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          )}

          <div className="reports-filter-actions">
            <button type="submit" className="reports-btn-primary" disabled={loading}>
              <i className="bi bi-search"></i>
              <span>Search</span>
            </button>
            <button
              type="button"
              className="reports-btn-secondary"
              onClick={handleReset}
              disabled={loading}
            >
              <i className="bi bi-arrow-counterclockwise"></i>
              <span>Reset</span>
            </button>
          </div>
        </div>
      </form>

      {error && (
        <div className="reports-error-banner" role="alert">
          <i className="bi bi-exclamation-triangle-fill"></i>
          <span>{error}</span>
        </div>
      )}

      {loading ? (
        <div className="reports-loading-state">
          <div className="spinner-border text-primary" role="status" />
          <p>Loading report data...</p>
        </div>
      ) : (
        <>
          {/* A. STUDENT REPORTS */}
          {activeCategory === "students" && studentReport && (
            <>
              <section className="reports-summary-grid">
                <article className="reports-summary-card">
                  <span>Total Students</span>
                  <h2>{studentReport.summary.totalStudents}</h2>
                </article>
                <article className="reports-summary-card">
                  <span>Active Students</span>
                  <h2 className="text-success">{studentReport.summary.activeStudents}</h2>
                </article>
                <article className="reports-summary-card">
                  <span>Inactive Students</span>
                  <h2 className="text-warning">{studentReport.summary.inactiveStudents}</h2>
                </article>
                <article className="reports-summary-card">
                  <span>Distinct Courses</span>
                  <h2>{studentReport.summary.distinctCourses}</h2>
                </article>
              </section>

              {studentReport.summary.courseBreakdown.length > 0 && (
                <section className="reports-breakdown-card">
                  <h3>Course-wise Student Count</h3>
                  <div className="reports-chip-grid">
                    {studentReport.summary.courseBreakdown.map((c) => (
                      <div key={c.courseName} className="reports-chip">
                        <strong>{c.courseName}</strong>
                        <span>
                          {c.studentCount} total ({c.activeCount} active)
                        </span>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              <section className="reports-table-card">
                <div className="reports-table-header">
                  <h3>Student-wise Report ({studentReport.data.totalCount})</h3>
                </div>
                <div className="reports-table-wrapper">
                  <table>
                    <thead>
                      <tr>
                        <th>ID</th>
                        <th>Name</th>
                        <th>Mobile</th>
                        <th>Gender</th>
                        <th>Course</th>
                        <th>Admission Date</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {studentReport.data.items.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="reports-empty-cell">
                            No student records match the selected filters.
                          </td>
                        </tr>
                      ) : (
                        studentReport.data.items.map((row) => (
                          <tr key={row.studentId}>
                            <td>#{row.studentId}</td>
                            <td>{row.name}</td>
                            <td>{row.mobile}</td>
                            <td>{row.gender}</td>
                            <td>{row.course}</td>
                            <td>{formatDate(row.admissionDate)}</td>
                            <td>
                              <span
                                className={`reports-badge ${row.isActive ? "badge-green" : "badge-amber"}`}
                              >
                                {row.isActive ? "Active" : "Inactive"}
                              </span>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </section>
            </>
          )}

          {/* B. ADMISSION REPORTS */}
          {activeCategory === "admissions" && admissionReport && (
            <>
              <section className="reports-summary-grid">
                <article className="reports-summary-card">
                  <span>Total Admissions</span>
                  <h2>{admissionReport.summary.totalAdmissions}</h2>
                </article>
                <article className="reports-summary-card">
                  <span>Daily (Today)</span>
                  <h2 className="text-primary">{admissionReport.summary.todayAdmissions}</h2>
                </article>
                <article className="reports-summary-card">
                  <span>Monthly (This Month)</span>
                  <h2 className="text-success">{admissionReport.summary.thisMonthAdmissions}</h2>
                </article>
              </section>

              {admissionReport.summary.monthlyTrend.length > 0 && (
                <section className="reports-breakdown-card">
                  <h3>Monthly Admissions Trend</h3>
                  <div className="reports-chip-grid">
                    {admissionReport.summary.monthlyTrend.map((m) => (
                      <div key={m.period} className="reports-chip">
                        <strong>{m.period}</strong>
                        <span>{m.count} admissions</span>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              <section className="reports-table-card">
                <div className="reports-table-header">
                  <h3>Admission History ({admissionReport.data.totalCount})</h3>
                </div>
                <div className="reports-table-wrapper">
                  <table>
                    <thead>
                      <tr>
                        <th>ID</th>
                        <th>Student Name</th>
                        <th>Mobile</th>
                        <th>Course</th>
                        <th>Admission Date</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {admissionReport.data.items.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="reports-empty-cell">
                            No admissions found for the selected criteria.
                          </td>
                        </tr>
                      ) : (
                        admissionReport.data.items.map((row) => (
                          <tr key={row.studentId}>
                            <td>#{row.studentId}</td>
                            <td>{row.studentName}</td>
                            <td>{row.mobile}</td>
                            <td>{row.course}</td>
                            <td>{formatDate(row.admissionDate)}</td>
                            <td>
                              <span
                                className={`reports-badge ${row.status === "Active" ? "badge-green" : "badge-amber"}`}
                              >
                                {row.status}
                              </span>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </section>
            </>
          )}

          {/* C. FEES REPORTS */}
          {activeCategory === "fees" && feesReport && (
            <>
              <section className="reports-summary-grid">
                <article className="reports-summary-card">
                  <span>Total Fees</span>
                  <h2>{formatCurrency(feesReport.summary.totalFees)}</h2>
                </article>
                <article className="reports-summary-card">
                  <span>Total Paid Fees</span>
                  <h2 className="text-success">{formatCurrency(feesReport.summary.totalPaidFees)}</h2>
                </article>
                <article className="reports-summary-card">
                  <span>Pending Fees</span>
                  <h2 className="text-danger">{formatCurrency(feesReport.summary.pendingFees)}</h2>
                </article>
                <article className="reports-summary-card">
                  <span>Partial Payments</span>
                  <h2 className="text-warning">{feesReport.summary.partialPaymentCount}</h2>
                </article>
              </section>

              {feesReport.summary.courseWiseFees.length > 0 && !isStudentOnly && (
                <section className="reports-breakdown-card">
                  <h3>Course-wise Fee Collection</h3>
                  <div className="reports-chip-grid">
                    {feesReport.summary.courseWiseFees.map((c) => (
                      <div key={c.courseName} className="reports-chip">
                        <strong>{c.courseName}</strong>
                        <span>
                          Paid: {formatCurrency(c.paidFees)} / {formatCurrency(c.totalFees)}
                        </span>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              <div className="reports-subtabs">
                <button
                  type="button"
                  className={feesTab === "studentFees" ? "active" : ""}
                  onClick={() => {
                    setFeesTab("studentFees");
                    setPage(1);
                  }}
                >
                  Student-wise Fee Report ({feesReport.studentFees.totalCount})
                </button>
                <button
                  type="button"
                  className={feesTab === "payments" ? "active" : ""}
                  onClick={() => {
                    setFeesTab("payments");
                    setPage(1);
                  }}
                >
                  Date-wise Payment Report ({feesReport.payments.totalCount})
                </button>
              </div>

              <section className="reports-table-card">
                <div className="reports-table-wrapper">
                  {feesTab === "studentFees" ? (
                    <table>
                      <thead>
                        <tr>
                          <th>Student</th>
                          <th>Mobile</th>
                          <th>Course</th>
                          <th>Total Fees</th>
                          <th>Paid</th>
                          <th>Remaining</th>
                          <th>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {feesReport.studentFees.items.length === 0 ? (
                          <tr>
                            <td colSpan={7} className="reports-empty-cell">
                              No fee records found.
                            </td>
                          </tr>
                        ) : (
                          feesReport.studentFees.items.map((row) => (
                            <tr key={row.studentId}>
                              <td>{row.studentName}</td>
                              <td>{row.mobile}</td>
                              <td>{row.course}</td>
                              <td>{formatCurrency(row.totalFees)}</td>
                              <td>{formatCurrency(row.paidFees)}</td>
                              <td>{formatCurrency(row.remainingFees)}</td>
                              <td>
                                <span
                                  className={`reports-badge ${
                                    row.paymentStatus === "Paid"
                                      ? "badge-green"
                                      : row.paymentStatus === "Partial"
                                        ? "badge-amber"
                                        : "badge-red"
                                  }`}
                                >
                                  {row.paymentStatus}
                                </span>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  ) : (
                    <table>
                      <thead>
                        <tr>
                          <th>Payment ID</th>
                          <th>Student</th>
                          <th>Course</th>
                          <th>Amount Paid</th>
                          <th>Date</th>
                          <th>Mode</th>
                          <th>Notes</th>
                        </tr>
                      </thead>
                      <tbody>
                        {feesReport.payments.items.length === 0 ? (
                          <tr>
                            <td colSpan={7} className="reports-empty-cell">
                              No fee payments found for the selected dates.
                            </td>
                          </tr>
                        ) : (
                          feesReport.payments.items.map((row) => (
                            <tr key={row.paymentId}>
                              <td>#{row.paymentId}</td>
                              <td>{row.studentName}</td>
                              <td>{row.course}</td>
                              <td>{formatCurrency(row.amountPaid)}</td>
                              <td>{formatDate(row.paymentDate)}</td>
                              <td>{row.paymentMode}</td>
                              <td>{row.notes || "—"}</td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  )}
                </div>
              </section>
            </>
          )}

          {/* D. ATTENDANCE REPORTS */}
          {activeCategory === "attendance" && attendanceReport && (
            <>
              <section className="reports-summary-grid">
                <article className="reports-summary-card">
                  <span>Total Marked</span>
                  <h2>{attendanceReport.summary.totalRecords}</h2>
                </article>
                <article className="reports-summary-card">
                  <span>Present</span>
                  <h2 className="text-success">{attendanceReport.summary.presentCount}</h2>
                </article>
                <article className="reports-summary-card">
                  <span>Absent</span>
                  <h2 className="text-danger">{attendanceReport.summary.absentCount}</h2>
                </article>
                <article className="reports-summary-card">
                  <span>Attendance Rate</span>
                  <h2 className="text-primary">{attendanceReport.summary.attendancePercentage}%</h2>
                </article>
              </section>

              {attendanceReport.summary.courseWiseAttendance.length > 0 && !isStudentOnly && (
                <section className="reports-breakdown-card">
                  <h3>Course-wise Attendance Summary</h3>
                  <div className="reports-chip-grid">
                    {attendanceReport.summary.courseWiseAttendance.map((c) => (
                      <div key={c.courseName} className="reports-chip">
                        <strong>{c.courseName}</strong>
                        <span>
                          {c.attendancePercentage}% ({c.presentCount}P / {c.absentCount}A / {c.lateCount}L)
                        </span>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              <section className="reports-table-card">
                <div className="reports-table-header">
                  <h3>Attendance Records ({attendanceReport.data.totalCount})</h3>
                </div>
                <div className="reports-table-wrapper">
                  <table>
                    <thead>
                      <tr>
                        <th>Date</th>
                        <th>Student Name</th>
                        <th>Course</th>
                        <th>Status</th>
                        <th>Remarks</th>
                      </tr>
                    </thead>
                    <tbody>
                      {attendanceReport.data.items.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="reports-empty-cell">
                            No attendance records found.
                          </td>
                        </tr>
                      ) : (
                        attendanceReport.data.items.map((row) => (
                          <tr key={row.attendanceId}>
                            <td>{formatDate(row.attendanceDate)}</td>
                            <td>{row.studentName}</td>
                            <td>{row.course}</td>
                            <td>
                              <span
                                className={`reports-badge ${
                                  row.status === "Present"
                                    ? "badge-green"
                                    : row.status === "Late"
                                      ? "badge-amber"
                                      : "badge-red"
                                }`}
                              >
                                {row.status}
                              </span>
                            </td>
                            <td>{row.remarks || "—"}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </section>
            </>
          )}

          {/* E. COURSE REPORTS */}
          {activeCategory === "courses" && courseReport && (
            <>
              <section className="reports-summary-grid">
                <article className="reports-summary-card">
                  <span>Total Courses</span>
                  <h2>{courseReport.summary.totalCourses}</h2>
                </article>
                <article className="reports-summary-card">
                  <span>Active Courses</span>
                  <h2 className="text-success">{courseReport.summary.activeCourses}</h2>
                </article>
                <article className="reports-summary-card">
                  <span>Inactive Courses</span>
                  <h2 className="text-warning">{courseReport.summary.inactiveCourses}</h2>
                </article>
                <article className="reports-summary-card">
                  <span>Fee Structure Total</span>
                  <h2>{formatCurrency(courseReport.summary.totalFeeStructureSum)}</h2>
                </article>
              </section>

              <section className="reports-table-card">
                <div className="reports-table-header">
                  <h3>Course-wise Enrollment &amp; Fees Summary ({courseReport.data.totalCount})</h3>
                </div>
                <div className="reports-table-wrapper">
                  <table>
                    <thead>
                      <tr>
                        <th>Code</th>
                        <th>Course Name</th>
                        <th>Duration</th>
                        <th>Course Fee</th>
                        <th>Status</th>
                        <th>Students</th>
                        <th>Billed</th>
                        <th>Collected</th>
                        <th>Pending</th>
                      </tr>
                    </thead>
                    <tbody>
                      {courseReport.data.items.length === 0 ? (
                        <tr>
                          <td colSpan={9} className="reports-empty-cell">
                            No courses match the selected filters.
                          </td>
                        </tr>
                      ) : (
                        courseReport.data.items.map((row) => (
                          <tr key={row.courseId}>
                            <td>{row.courseCode}</td>
                            <td>{row.courseName}</td>
                            <td>{row.duration}</td>
                            <td>{formatCurrency(row.courseFees)}</td>
                            <td>
                              <span
                                className={`reports-badge ${row.status === "Active" ? "badge-green" : "badge-amber"}`}
                              >
                                {row.status}
                              </span>
                            </td>
                            <td>{row.enrolledStudents}</td>
                            <td>{formatCurrency(row.totalBilledFees)}</td>
                            <td>{formatCurrency(row.totalCollectedFees)}</td>
                            <td>{formatCurrency(row.totalPendingFees)}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </section>
            </>
          )}

          {/* F. GOVERNMENT UPDATES REPORTS */}
          {activeCategory === "govtUpdates" && govtReport && (
            <>
              <section className="reports-summary-grid">
                <article className="reports-summary-card">
                  <span>Total Updates</span>
                  <h2>{govtReport.summary.totalUpdates}</h2>
                </article>
                <article className="reports-summary-card">
                  <span>Published Updates</span>
                  <h2 className="text-success">{govtReport.summary.publishedUpdates}</h2>
                </article>
                <article className="reports-summary-card">
                  <span>Drafts</span>
                  <h2 className="text-warning">{govtReport.summary.draftUpdates}</h2>
                </article>
                <article className="reports-summary-card">
                  <span>Important Updates</span>
                  <h2 className="text-danger">{govtReport.summary.importantUpdates}</h2>
                </article>
              </section>

              {govtReport.summary.categoryBreakdown.length > 0 && (
                <section className="reports-breakdown-card">
                  <h3>Category-wise Updates</h3>
                  <div className="reports-chip-grid">
                    {govtReport.summary.categoryBreakdown.map((c) => (
                      <div key={c.category} className="reports-chip">
                        <strong>{c.category}</strong>
                        <span>{c.count} updates</span>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              <section className="reports-table-card">
                <div className="reports-table-header">
                  <h3>Government Updates List ({govtReport.data.totalCount})</h3>
                </div>
                <div className="reports-table-wrapper">
                  <table>
                    <thead>
                      <tr>
                        <th>Title</th>
                        <th>Category</th>
                        <th>Published</th>
                        <th>Important</th>
                        <th>Published Date</th>
                        <th>Last Date</th>
                        <th>Created By</th>
                      </tr>
                    </thead>
                    <tbody>
                      {govtReport.data.items.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="reports-empty-cell">
                            No government updates found.
                          </td>
                        </tr>
                      ) : (
                        govtReport.data.items.map((row) => (
                          <tr key={row.id}>
                            <td>{row.title}</td>
                            <td>{row.category}</td>
                            <td>
                              <span
                                className={`reports-badge ${row.isPublished ? "badge-green" : "badge-amber"}`}
                              >
                                {row.isPublished ? "Published" : "Draft"}
                              </span>
                            </td>
                            <td>{row.isImportant ? "Yes" : "No"}</td>
                            <td>{formatDate(row.publishedAt ?? row.createdAt)}</td>
                            <td>{formatDate(row.applicationLastDate)}</td>
                            <td>{row.createdBy}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </section>
            </>
          )}

          {/* Pagination */}
          {currentPaged && currentPaged.totalPages > 1 && (
            <div className="reports-pagination">
              <button
                type="button"
                className="reports-btn-secondary"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                Previous
              </button>
              <span>
                Page {currentPaged.page} of {currentPaged.totalPages} ({currentPaged.totalCount} records)
              </span>
              <button
                type="button"
                className="reports-btn-secondary"
                disabled={page >= currentPaged.totalPages}
                onClick={() => setPage((p) => p + 1)}
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default Reports;
