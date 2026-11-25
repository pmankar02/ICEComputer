import React, { useState, useEffect, useMemo } from "react";
import {
  getCourses,
  createCourse,
  updateCourse,
  deleteCourse,
  updateCourseStatus,
  getCourseImage,
  SUPPORTED_COURSE_NAMES,
} from "../services/courseService";
import type { Course, CreateCourseInput } from "../services/courseService";
import "./Courses.css";

// Helper to assign distinct icons per course
function getCourseIcon(courseName: string): string {
  const lower = courseName.toLowerCase();
  if (lower.includes("ms-cit") || lower.includes("mscit")) return "bi-laptop";
  if (lower.includes("tally")) return "bi-calculator-fill";
  if (lower.includes("typing") && lower.includes("marathi")) return "bi-keyboard-fill";
  if (lower.includes("typing")) return "bi-keyboard";
  if (lower.includes("data entry")) return "bi-input-cursor-text";
  if (lower.includes("html") || lower.includes("css")) return "bi-code-slash";
  if (lower.includes("excel")) return "bi-file-earmark-spreadsheet-fill";
  if (lower.includes("cyber") || lower.includes("security")) return "bi-shield-lock-fill";
  return "bi-mortarboard-fill";
}

// Auto-suggest course code helper
function suggestCourseCode(name: string): string {
  const lower = name.toLowerCase();
  if (lower.includes("ms-cit") || lower.includes("mscit")) return "MSCIT";
  if (lower.includes("tally")) return "TALLY";
  if (lower.includes("marathi")) return "TYP-MAR";
  if (lower.includes("english")) return "TYP-ENG";
  if (lower.includes("data entry")) return "DATA-ENTRY";
  if (lower.includes("html")) return "HTML-CSS";
  if (lower.includes("excel")) return "ADV-EXCEL";
  if (lower.includes("cyber")) return "CYBER-SEC";
  return name.replace(/[^a-zA-Z0-9]/g, "").toUpperCase().slice(0, 10);
}

const ITEMS_PER_PAGE = 6;

export default function Courses() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");
  const [success, setSuccess] = useState<string>("");

  // View Mode: 'cards' or 'table' (Defaults to 'cards')
  const [viewMode, setViewMode] = useState<"cards" | "table">("cards");

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [nameFilter, setNameFilter] = useState<string>("All");
  const [statusFilter, setStatusFilter] = useState<string>("All");

  // Pagination
  const [currentPage, setCurrentPage] = useState<number>(1);

  // Modals state
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState<boolean>(false);
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);
  const [viewingCourse, setViewingCourse] = useState<Course | null>(null);
  const [saving, setSaving] = useState<boolean>(false);

  // Form state
  const [formData, setFormData] = useState<CreateCourseInput>({
    courseName: "",
    courseCode: "",
    duration: "",
    courseFees: 0,
    description: "",
    status: "Active",
  });

  // User role checking
  const userRoles = useMemo<string[]>(() => {
    try {
      const stored = localStorage.getItem("user");
      const user = stored ? JSON.parse(stored) : null;
      if (Array.isArray(user?.roles)) return user.roles;
      if (user?.role) return [user.role];
      return [];
    } catch {
      return [];
    }
  }, []);

  const isSuperAdmin = userRoles.some(
    (role) => role.toLowerCase() === "superadmin"
  );

  // Fetch all courses from backend
  const fetchCourses = async () => {
    try {
      setLoading(true);
      setError("");
      const data = await getCourses();
      setCourses(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load courses.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCourses();
  }, []);

  // Filtered courses
  const filteredCourses = useMemo(() => {
    return courses.filter((course) => {
      const matchesSearch =
        searchQuery === "" ||
        course.courseName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        course.courseCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
        course.description.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesName =
        nameFilter === "All" || course.courseName === nameFilter;

      const matchesStatus =
        statusFilter === "All" ||
        course.status.toLowerCase() === statusFilter.toLowerCase();

      return matchesSearch && matchesName && matchesStatus;
    });
  }, [courses, searchQuery, nameFilter, statusFilter]);

  // Pagination calculations
  const totalPages = Math.ceil(filteredCourses.length / ITEMS_PER_PAGE) || 1;
  const paginatedCourses = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredCourses.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredCourses, currentPage]);

  // Reset pagination on filter change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, nameFilter, statusFilter]);

  // Summary Metrics
  const summary = useMemo(() => {
    const total = courses.length;
    const active = courses.filter((c) => c.status === "Active").length;
    const inactive = courses.filter((c) => c.status === "Inactive").length;
    const totalFeesValue = courses.reduce((sum, c) => sum + (c.courseFees || 0), 0);
    return { total, active, inactive, totalFeesValue };
  }, [courses]);

  // Open Add Modal
  const handleOpenAddModal = () => {
    setEditingCourse(null);
    setFormData({
      courseName: "",
      courseCode: "",
      duration: "",
      courseFees: 0,
      description: "",
      status: "Active",
    });
    setError("");
    setIsModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEditModal = (course: Course) => {
    setEditingCourse(course);
    setFormData({
      courseName: course.courseName,
      courseCode: course.courseCode,
      duration: course.duration,
      courseFees: course.courseFees,
      description: course.description || "",
      status: course.status,
    });
    setError("");
    setIsModalOpen(true);
  };

  // Open View Modal
  const handleOpenViewModal = (course: Course) => {
    setViewingCourse(course);
    setIsViewModalOpen(true);
  };

  // Select a preset course name from quick pills
  const handleSelectPresetCourse = (name: string) => {
    setFormData((prev) => ({
      ...prev,
      courseName: name,
      courseCode: prev.courseCode ? prev.courseCode : suggestCourseCode(name),
    }));
  };

  // Save (Create or Update)
  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.courseName.trim() || !formData.courseCode.trim() || !formData.duration.trim()) {
      setError("Course Name, Code, and Duration are required.");
      return;
    }

    try {
      setSaving(true);
      setError("");
      setSuccess("");

      if (editingCourse) {
        await updateCourse(editingCourse.courseId, formData);
        setSuccess(`Course "${formData.courseName}" updated successfully!`);
      } else {
        await createCourse(formData);
        setSuccess(`Course "${formData.courseName}" created successfully!`);
      }

      setIsModalOpen(false);
      await fetchCourses();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save course.");
    } finally {
      setSaving(false);
    }
  };

  // Toggle Status
  const handleToggleStatus = async (course: Course) => {
    const newStatus = course.status === "Active" ? "Inactive" : "Active";
    const confirmChange = window.confirm(
      `Are you sure you want to change status of "${course.courseName}" to ${newStatus}?`
    );
    if (!confirmChange) return;

    try {
      setError("");
      setSuccess("");
      await updateCourseStatus(course.courseId, newStatus);
      setSuccess(`Status of "${course.courseName}" updated to ${newStatus}.`);
      await fetchCourses();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update status.");
    }
  };

  // Delete Course
  const handleDeleteCourse = async (course: Course) => {
    const confirmDelete = window.confirm(
      `Are you sure you want to permanently delete "${course.courseName}"?`
    );
    if (!confirmDelete) return;

    try {
      setError("");
      setSuccess("");
      await deleteCourse(course.courseId);
      setSuccess(`Course "${course.courseName}" deleted successfully.`);
      await fetchCourses();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete course.");
    }
  };

  return (
    <div className="courses-page">
      {/* Header */}
      <header className="courses-header">
        <div className="courses-title-group">
          <h1>
            <i className="bi bi-book-half"></i> Courses Management
          </h1>
          <p>Manage institute courses, duration, fees structure, and visual banners</p>
        </div>

        <div className="courses-header-actions">
          {/* Cards vs Table View Mode Switcher */}
          <div className="view-mode-toggle">
            <button
              type="button"
              className={`view-toggle-btn ${viewMode === "cards" ? "active" : ""}`}
              onClick={() => setViewMode("cards")}
              title="Cards View"
            >
              <i className="bi bi-grid-fill"></i> Cards
            </button>
            <button
              type="button"
              className={`view-toggle-btn ${viewMode === "table" ? "active" : ""}`}
              onClick={() => setViewMode("table")}
              title="Table View"
            >
              <i className="bi bi-list-ul"></i> Table
            </button>
          </div>

          <button
            type="button"
            className="btn-course-secondary"
            onClick={fetchCourses}
            title="Refresh Courses"
          >
            <i className="bi bi-arrow-clockwise"></i> Refresh
          </button>

          {isSuperAdmin && (
            <button
              type="button"
              className="btn-course-primary"
              onClick={handleOpenAddModal}
            >
              <i className="bi bi-plus-circle-fill"></i> Add New Course
            </button>
          )}
        </div>
      </header>

      {/* Alert Banners */}
      {error && (
        <div className="courses-alert courses-alert-error">
          <span>
            <i className="bi bi-exclamation-triangle-fill"></i> {error}
          </span>
          <button
            type="button"
            className="courses-alert-close"
            onClick={() => setError("")}
          >
            &times;
          </button>
        </div>
      )}

      {success && (
        <div className="courses-alert courses-alert-success">
          <span>
            <i className="bi bi-check-circle-fill"></i> {success}
          </span>
          <button
            type="button"
            className="courses-alert-close"
            onClick={() => setSuccess("")}
          >
            &times;
          </button>
        </div>
      )}

      {/* Summary Cards */}
      <section className="courses-summary-grid">
        <div className="summary-card">
          <div className="summary-info">
            <h3>Total Courses</h3>
            <p className="summary-value">{summary.total}</p>
          </div>
          <div className="summary-icon-box summary-icon-blue">
            <i className="bi bi-journal-bookmark-fill"></i>
          </div>
        </div>

        <div className="summary-card">
          <div className="summary-info">
            <h3>Active Courses</h3>
            <p className="summary-value">{summary.active}</p>
          </div>
          <div className="summary-icon-box summary-icon-green">
            <i className="bi bi-check-circle-fill"></i>
          </div>
        </div>

        <div className="summary-card">
          <div className="summary-info">
            <h3>Inactive Courses</h3>
            <p className="summary-value">{summary.inactive}</p>
          </div>
          <div className="summary-icon-box summary-icon-amber">
            <i className="bi bi-pause-circle-fill"></i>
          </div>
        </div>

        <div className="summary-card">
          <div className="summary-info">
            <h3>Total Fee Value</h3>
            <p className="summary-value">₹{summary.totalFeesValue.toLocaleString("en-IN")}</p>
          </div>
          <div className="summary-icon-box summary-icon-purple">
            <i className="bi bi-currency-rupee"></i>
          </div>
        </div>
      </section>

      {/* Filters & Search */}
      <section className="courses-filter-card">
        <div className="courses-filter-grid">
          <div className="search-input-wrapper">
            <i className="bi bi-search"></i>
            <input
              type="text"
              placeholder="Search by course name, code, or description..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <select
            className="filter-select"
            value={nameFilter}
            onChange={(e) => setNameFilter(e.target.value)}
          >
            <option value="All">All Course Names</option>
            {SUPPORTED_COURSE_NAMES.map((name) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
          </select>

          <select
            className="filter-select"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="All">All Statuses</option>
            <option value="Active">Active</option>
            <option value="Inactive">Inactive</option>
          </select>

          {(searchQuery || nameFilter !== "All" || statusFilter !== "All") && (
            <button
              type="button"
              className="btn-course-secondary"
              onClick={() => {
                setSearchQuery("");
                setNameFilter("All");
                setStatusFilter("All");
              }}
            >
              <i className="bi bi-x-circle"></i> Clear
            </button>
          )}
        </div>
      </section>

      {/* ============================================================== */}
      {/* VIEW 1: COURSE CARDS GRID (DEFAULT) */}
      {/* ============================================================== */}
      {viewMode === "cards" && (
        <section>
          {loading ? (
            <div className="courses-empty-state">
              <i className="bi bi-arrow-repeat spin"></i>
              <h3>Loading courses...</h3>
            </div>
          ) : paginatedCourses.length === 0 ? (
            <div className="courses-empty-state">
              <i className="bi bi-inbox"></i>
              <h3>No courses found</h3>
              <p>
                {courses.length === 0
                  ? "No courses have been added yet. Click 'Add New Course' to create one."
                  : "Try adjusting your search query or filter options."}
              </p>
            </div>
          ) : (
            <div className="courses-cards-grid">
              {paginatedCourses.map((course) => (
                <article key={course.courseId} className="course-card">
                  {/* Image Header with Badges */}
                  <div className="course-card-image-wrap">
                    <img
                      src={getCourseImage(course.courseName)}
                      alt={course.courseName}
                      className="course-card-image"
                      loading="lazy"
                    />
                    <div className="course-card-badges">
                      <span className="course-card-code">{course.courseCode}</span>
                      <span
                        className={`status-badge ${
                          course.status === "Active"
                            ? "status-badge-active"
                            : "status-badge-inactive"
                        }`}
                      >
                        <span className="status-dot"></span>
                        {course.status}
                      </span>
                    </div>
                  </div>

                  {/* Card Body */}
                  <div className="course-card-body">
                    <div className="course-card-header">
                      <h3 className="course-card-title">{course.courseName}</h3>
                    </div>

                    <p className="course-card-desc">
                      {course.description ||
                        `Comprehensive practical training program in ${course.courseName} with certification.`}
                    </p>

                    <div className="course-card-meta">
                      <div className="course-card-duration">
                        <i className="bi bi-clock-history"></i> {course.duration}
                      </div>
                      <div className="course-card-fee">
                        ₹{Number(course.courseFees).toLocaleString("en-IN")}
                      </div>
                    </div>

                    {/* Card Footer Actions */}
                    <div className="course-card-footer">
                      <span className="course-card-date">
                        Added:{" "}
                        {new Date(course.createdAt).toLocaleDateString("en-IN", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        })}
                      </span>

                      <div className="action-buttons-group">
                        <button
                          type="button"
                          className="action-btn action-btn-view"
                          title="View Course Details"
                          onClick={() => handleOpenViewModal(course)}
                        >
                          <i className="bi bi-eye"></i>
                        </button>

                        {isSuperAdmin && (
                          <>
                            <button
                              type="button"
                              className="action-btn action-btn-edit"
                              title="Edit Course"
                              onClick={() => handleOpenEditModal(course)}
                            >
                              <i className="bi bi-pencil"></i>
                            </button>

                            <button
                              type="button"
                              className="action-btn action-btn-status"
                              title={
                                course.status === "Active"
                                  ? "Deactivate Course"
                                  : "Activate Course"
                              }
                              onClick={() => handleToggleStatus(course)}
                            >
                              <i
                                className={`bi ${
                                  course.status === "Active"
                                    ? "bi-toggle-on"
                                    : "bi-toggle-off"
                                }`}
                              ></i>
                            </button>

                            <button
                              type="button"
                              className="action-btn action-btn-delete"
                              title="Delete Course"
                              onClick={() => handleDeleteCourse(course)}
                            >
                              <i className="bi bi-trash"></i>
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}

          {/* Pagination Bar for Cards View */}
          {!loading && filteredCourses.length > 0 && (
            <div
              className="courses-pagination"
              style={{
                background: "#ffffff",
                borderRadius: "12px",
                border: "1px solid #e2e8f0",
              }}
            >
              <span>
                Showing{" "}
                <strong>
                  {(currentPage - 1) * ITEMS_PER_PAGE + 1} -{" "}
                  {Math.min(currentPage * ITEMS_PER_PAGE, filteredCourses.length)}
                </strong>{" "}
                of <strong>{filteredCourses.length}</strong> courses
              </span>

              <div className="pagination-controls">
                <button
                  type="button"
                  className="pagination-btn"
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                >
                  Previous
                </button>

                {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                  (pageNum) => (
                    <button
                      key={pageNum}
                      type="button"
                      className={`pagination-btn ${
                        currentPage === pageNum ? "active" : ""
                      }`}
                      onClick={() => setCurrentPage(pageNum)}
                    >
                      {pageNum}
                    </button>
                  )
                )}

                <button
                  type="button"
                  className="pagination-btn"
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </section>
      )}

      {/* ============================================================== */}
      {/* VIEW 2: COURSE TABLE VIEW */}
      {/* ============================================================== */}
      {viewMode === "table" && (
        <section className="courses-table-card">
          <div className="table-responsive">
            <table className="courses-table">
              <thead>
                <tr>
                  <th>Code</th>
                  <th>Course Banner &amp; Name</th>
                  <th>Duration</th>
                  <th>Course Fees</th>
                  <th>Status</th>
                  <th>Created</th>
                  <th style={{ textAlign: "right" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={7} style={{ textAlign: "center", padding: "40px" }}>
                      <i className="bi bi-arrow-repeat spin"></i> Loading courses...
                    </td>
                  </tr>
                ) : paginatedCourses.length === 0 ? (
                  <tr>
                    <td colSpan={7}>
                      <div className="courses-empty-state">
                        <i className="bi bi-inbox"></i>
                        <h3>No courses found</h3>
                        <p>
                          {courses.length === 0
                            ? "No courses have been added yet. Click 'Add New Course' to create one."
                            : "Try adjusting your search query or filter options."}
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  paginatedCourses.map((course) => (
                    <tr key={course.courseId}>
                      <td>
                        <span className="course-code-badge">{course.courseCode}</span>
                      </td>
                      <td>
                        <div className="course-name-cell">
                          <img
                            src={getCourseImage(course.courseName)}
                            alt={course.courseName}
                            className="course-table-thumbnail"
                          />
                          <span className="course-name-text">{course.courseName}</span>
                        </div>
                      </td>
                      <td>
                        <span className="course-duration-badge">
                          <i className="bi bi-clock"></i> {course.duration}
                        </span>
                      </td>
                      <td>
                        <span className="course-fees-text">
                          ₹{Number(course.courseFees).toLocaleString("en-IN")}
                        </span>
                      </td>
                      <td>
                        <span
                          className={`status-badge ${
                            course.status === "Active"
                              ? "status-badge-active"
                              : "status-badge-inactive"
                          }`}
                        >
                          <span className="status-dot"></span>
                          {course.status}
                        </span>
                      </td>
                      <td style={{ color: "#64748b", fontSize: "12px" }}>
                        {new Date(course.createdAt).toLocaleDateString("en-IN", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        })}
                      </td>
                      <td style={{ textAlign: "right" }}>
                        <div
                          className="action-buttons-group"
                          style={{ justifyContent: "flex-end" }}
                        >
                          <button
                            type="button"
                            className="action-btn action-btn-view"
                            title="View Details"
                            onClick={() => handleOpenViewModal(course)}
                          >
                            <i className="bi bi-eye"></i>
                          </button>

                          {isSuperAdmin && (
                            <>
                              <button
                                type="button"
                                className="action-btn action-btn-edit"
                                title="Edit Course"
                                onClick={() => handleOpenEditModal(course)}
                              >
                                <i className="bi bi-pencil"></i>
                              </button>

                              <button
                                type="button"
                                className="action-btn action-btn-status"
                                title={
                                  course.status === "Active"
                                    ? "Deactivate Course"
                                    : "Activate Course"
                                }
                                onClick={() => handleToggleStatus(course)}
                              >
                                <i
                                  className={`bi ${
                                    course.status === "Active"
                                      ? "bi-toggle-on"
                                      : "bi-toggle-off"
                                  }`}
                                ></i>
                              </button>

                              <button
                                type="button"
                                className="action-btn action-btn-delete"
                                title="Delete Course"
                                onClick={() => handleDeleteCourse(course)}
                              >
                                <i className="bi bi-trash"></i>
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Bar for Table View */}
          {!loading && filteredCourses.length > 0 && (
            <div className="courses-pagination">
              <span>
                Showing{" "}
                <strong>
                  {(currentPage - 1) * ITEMS_PER_PAGE + 1} -{" "}
                  {Math.min(currentPage * ITEMS_PER_PAGE, filteredCourses.length)}
                </strong>{" "}
                of <strong>{filteredCourses.length}</strong> courses
              </span>

              <div className="pagination-controls">
                <button
                  type="button"
                  className="pagination-btn"
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                >
                  Previous
                </button>

                {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                  (pageNum) => (
                    <button
                      key={pageNum}
                      type="button"
                      className={`pagination-btn ${
                        currentPage === pageNum ? "active" : ""
                      }`}
                      onClick={() => setCurrentPage(pageNum)}
                    >
                      {pageNum}
                    </button>
                  )
                )}

                <button
                  type="button"
                  className="pagination-btn"
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </section>
      )}

      {/* Add / Edit Course Modal */}
      {isModalOpen && (
        <div className="courses-modal-overlay">
          <div className="courses-modal-card">
            <div className="courses-modal-header">
              <h2>
                <i className={`bi ${editingCourse ? "bi-pencil-square" : "bi-plus-circle"}`}></i>{" "}
                {editingCourse ? "Edit Course Details" : "Add New Course"}
              </h2>
              <button
                type="button"
                className="modal-close-btn"
                onClick={() => setIsModalOpen(false)}
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleSubmitForm}>
              <div className="courses-modal-body">
                {/* Live Image Banner Preview */}
                {formData.courseName && (
                  <img
                    src={getCourseImage(formData.courseName)}
                    alt="Course Preview"
                    className="course-modal-banner"
                  />
                )}

                {/* Quick Presets for New Courses */}
                {!editingCourse && (
                  <div style={{ marginBottom: "16px" }}>
                    <label className="form-label">
                      Quick Select Standard Course:
                    </label>
                    <div className="quick-courses-tags">
                      {SUPPORTED_COURSE_NAMES.map((name) => (
                        <button
                          key={name}
                          type="button"
                          className="quick-course-pill"
                          onClick={() => handleSelectPresetCourse(name)}
                        >
                          + {name}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <div className="course-form-grid">
                  <div className="form-group-full">
                    <label className="form-label">Course Name *</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="e.g. MS-CIT, Tally, Advanced Excel"
                      value={formData.courseName}
                      onChange={(e) =>
                        setFormData({ ...formData, courseName: e.target.value })
                      }
                      required
                    />
                  </div>

                  <div>
                    <label className="form-label">Course Code *</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="e.g. MSCIT, TALLY"
                      value={formData.courseCode}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          courseCode: e.target.value.toUpperCase(),
                        })
                      }
                      required
                    />
                  </div>

                  <div>
                    <label className="form-label">Duration *</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="e.g. 3 Months, 6 Months"
                      value={formData.duration}
                      onChange={(e) =>
                        setFormData({ ...formData, duration: e.target.value })
                      }
                      required
                    />
                  </div>

                  <div>
                    <label className="form-label">Course Fees (₹) *</label>
                    <input
                      type="number"
                      className="form-input"
                      placeholder="Enter amount"
                      min="0"
                      step="100"
                      value={formData.courseFees}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          courseFees: parseFloat(e.target.value) || 0,
                        })
                      }
                      required
                    />
                  </div>

                  <div>
                    <label className="form-label">Status</label>
                    <select
                      className="form-input"
                      value={formData.status}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          status: e.target.value as "Active" | "Inactive",
                        })
                      }
                    >
                      <option value="Active">Active</option>
                      <option value="Inactive">Inactive</option>
                    </select>
                  </div>

                  <div className="form-group-full">
                    <label className="form-label">Description / Syllabus</label>
                    <textarea
                      className="form-textarea"
                      placeholder="Enter brief course overview, objectives or syllabus notes..."
                      value={formData.description}
                      onChange={(e) =>
                        setFormData({ ...formData, description: e.target.value })
                      }
                    ></textarea>
                  </div>
                </div>
              </div>

              <div className="courses-modal-footer">
                <button
                  type="button"
                  className="btn-course-secondary"
                  onClick={() => setIsModalOpen(false)}
                  disabled={saving}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-course-primary"
                  disabled={saving}
                >
                  {saving ? (
                    <>
                      <i className="bi bi-arrow-repeat spin"></i> Saving...
                    </>
                  ) : (
                    <>
                      <i className="bi bi-check-lg"></i>{" "}
                      {editingCourse ? "Update Course" : "Save Course"}
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Course Details Modal */}
      {isViewModalOpen && viewingCourse && (
        <div className="courses-modal-overlay">
          <div className="courses-modal-card">
            <div className="courses-modal-header">
              <h2>
                <i className={`bi ${getCourseIcon(viewingCourse.courseName)}`}></i>{" "}
                Course Details: {viewingCourse.courseName}
              </h2>
              <button
                type="button"
                className="modal-close-btn"
                onClick={() => setIsViewModalOpen(false)}
              >
                &times;
              </button>
            </div>

            <div className="courses-modal-body">
              {/* Course Banner Image in Details Modal */}
              <img
                src={getCourseImage(viewingCourse.courseName)}
                alt={viewingCourse.courseName}
                className="course-modal-banner"
              />

              <div className="course-details-list">
                <div className="course-detail-item">
                  <div className="course-detail-label">Course Code</div>
                  <div className="course-detail-value">
                    <span className="course-code-badge">
                      {viewingCourse.courseCode}
                    </span>
                  </div>
                </div>

                <div className="course-detail-item">
                  <div className="course-detail-label">Status</div>
                  <div className="course-detail-value">
                    <span
                      className={`status-badge ${
                        viewingCourse.status === "Active"
                          ? "status-badge-active"
                          : "status-badge-inactive"
                      }`}
                    >
                      <span className="status-dot"></span>
                      {viewingCourse.status}
                    </span>
                  </div>
                </div>

                <div className="course-detail-item">
                  <div className="course-detail-label">Duration</div>
                  <div className="course-detail-value">
                    <i className="bi bi-clock"></i> {viewingCourse.duration}
                  </div>
                </div>

                <div className="course-detail-item">
                  <div className="course-detail-label">Course Fees</div>
                  <div className="course-detail-value" style={{ color: "#059669" }}>
                    ₹{Number(viewingCourse.courseFees).toLocaleString("en-IN")}
                  </div>
                </div>

                <div className="course-detail-item" style={{ gridColumn: "span 2" }}>
                  <div className="course-detail-label">Description / Syllabus</div>
                  <div
                    className="course-detail-value"
                    style={{ fontWeight: 400, color: "#334155", lineHeight: 1.5 }}
                  >
                    {viewingCourse.description || "No description provided."}
                  </div>
                </div>

                <div className="course-detail-item">
                  <div className="course-detail-label">Created At</div>
                  <div className="course-detail-value" style={{ fontSize: "12px", fontWeight: 400 }}>
                    {new Date(viewingCourse.createdAt).toLocaleString("en-IN")}
                  </div>
                </div>

                <div className="course-detail-item">
                  <div className="course-detail-label">Last Updated</div>
                  <div className="course-detail-value" style={{ fontSize: "12px", fontWeight: 400 }}>
                    {viewingCourse.updatedAt
                      ? new Date(viewingCourse.updatedAt).toLocaleString("en-IN")
                      : "Not updated yet"}
                  </div>
                </div>
              </div>
            </div>

            <div className="courses-modal-footer">
              <button
                type="button"
                className="btn-course-secondary"
                onClick={() => setIsViewModalOpen(false)}
              >
                Close
              </button>

              {isSuperAdmin && (
                <button
                  type="button"
                  className="btn-course-primary"
                  onClick={() => {
                    setIsViewModalOpen(false);
                    handleOpenEditModal(viewingCourse);
                  }}
                >
                  <i className="bi bi-pencil"></i> Edit This Course
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
