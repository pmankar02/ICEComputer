import React, { useEffect, useMemo, useState } from "react";
import {
  createGovernmentUpdate,
  deleteGovernmentUpdate,
  getAttachmentFullUrl,
  getGovernmentUpdates,
  getReadUpdateIds,
  isUpdateUnread,
  markAllUpdatesAsRead,
  markUpdateAsRead,
  toggleImportantUpdate,
  togglePublishUpdate,
  UPDATE_CATEGORIES,
  updateGovernmentUpdate,
  uploadUpdateAttachment,
} from "../services/govtUpdateService";
import type {
  GovernmentUpdate,
  GovernmentUpdateInput,
} from "../services/govtUpdateService";
import "./GovtUpdates.css";

function formatDate(value?: string | null): string {
  if (!value) return "Not specified";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "Not specified";
  return d.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function toInputDate(value?: string | null): string {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  return d.toISOString().split("T")[0];
}

function getDeadlineStatus(lastDate?: string | null): "open" | "urgent" | "closed" | "none" {
  if (!lastDate) return "none";
  const end = new Date(lastDate);
  end.setHours(23, 59, 59, 999);
  const now = new Date();
  const diffDays = (end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
  if (diffDays < 0) return "closed";
  if (diffDays <= 7) return "urgent";
  return "open";
}

export default function GovtUpdates() {
  const [updates, setUpdates] = useState<GovernmentUpdate[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");
  const [success, setSuccess] = useState<string>("");

  // Filters
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [categoryFilter, setCategoryFilter] = useState<string>("All");
  const [statusFilter, setStatusFilter] = useState<string>("All");

  // Notification read state
  const [readIds, setReadIds] = useState<number[]>(() => getReadUpdateIds());

  // Modals
  const [isFormModalOpen, setIsFormModalOpen] = useState<boolean>(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState<boolean>(false);
  const [editingUpdate, setEditingUpdate] = useState<GovernmentUpdate | null>(null);
  const [viewingUpdate, setViewingUpdate] = useState<GovernmentUpdate | null>(null);
  const [saving, setSaving] = useState<boolean>(false);

  // Form state
  const [formData, setFormData] = useState<GovernmentUpdateInput>({
    title: "",
    category: UPDATE_CATEGORIES[0],
    description: "",
    eligibility: "",
    requiredDocuments: "",
    applicationStartDate: "",
    applicationLastDate: "",
    officialLink: "",
    isImportant: false,
    isPublished: true,
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  // Check current user roles
  const userRoles = useMemo<string[]>(() => {
    try {
      const raw = localStorage.getItem("user");
      const user = raw ? JSON.parse(raw) : null;
      if (Array.isArray(user?.roles)) return user.roles;
      if (user?.role) return [user.role];
      return [];
    } catch {
      return [];
    }
  }, []);

  const isAdmin = userRoles.some((r) => {
    const lower = r.toLowerCase();
    return lower === "superadmin" || lower === "adminstaff";
  });

  const loadUpdates = async () => {
    try {
      setLoading(true);
      setError("");
      const data = await getGovernmentUpdates();
      setUpdates(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load updates.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUpdates();
  }, []);

  // Summary metrics
  const summary = useMemo(() => {
    const publishedList = updates.filter((u) => u.isPublished);
    const totalPublished = publishedList.length;
    const importantCount = publishedList.filter((u) => u.isImportant).length;
    const openCount = publishedList.filter((u) => {
      const st = getDeadlineStatus(u.applicationLastDate);
      return st === "open" || st === "urgent" || st === "none";
    }).length;
    const closingSoonCount = publishedList.filter(
      (u) => getDeadlineStatus(u.applicationLastDate) === "urgent"
    ).length;
    const unreadCount = publishedList.filter((u) => isUpdateUnread(u, readIds)).length;

    return {
      totalPublished,
      importantCount,
      openCount,
      closingSoonCount,
      unreadCount,
    };
  }, [updates, readIds]);

  // Filtered updates (sorted latest first)
  const filteredUpdates = useMemo(() => {
    return updates.filter((item) => {
      const term = searchQuery.trim().toLowerCase();
      const matchesSearch =
        !term ||
        item.title.toLowerCase().includes(term) ||
        item.description.toLowerCase().includes(term) ||
        item.eligibility.toLowerCase().includes(term) ||
        item.category.toLowerCase().includes(term);

      const matchesCategory =
        categoryFilter === "All" ||
        item.category.toLowerCase() === categoryFilter.toLowerCase();

      let matchesStatus = true;
      if (statusFilter === "New") {
        matchesStatus = isUpdateUnread(item, readIds);
      } else if (statusFilter === "Important") {
        matchesStatus = item.isImportant;
      } else if (statusFilter === "Published") {
        matchesStatus = item.isPublished;
      } else if (statusFilter === "Draft") {
        matchesStatus = !item.isPublished;
      } else if (statusFilter === "Open") {
        const st = getDeadlineStatus(item.applicationLastDate);
        matchesStatus = item.isPublished && (st === "open" || st === "urgent" || st === "none");
      } else if (statusFilter === "Closed") {
        matchesStatus =
          item.isPublished && getDeadlineStatus(item.applicationLastDate) === "closed";
      }

      return matchesSearch && matchesCategory && matchesStatus;
    });
  }, [updates, searchQuery, categoryFilter, statusFilter, readIds]);

  const handleOpenAddModal = () => {
    setEditingUpdate(null);
    setSelectedFile(null);
    setFormData({
      title: "",
      category: UPDATE_CATEGORIES[0],
      description: "",
      eligibility: "",
      requiredDocuments: "",
      applicationStartDate: "",
      applicationLastDate: "",
      officialLink: "",
      isImportant: false,
      isPublished: true,
    });
    setError("");
    setIsFormModalOpen(true);
  };

  const handleOpenEditModal = (item: GovernmentUpdate) => {
    setEditingUpdate(item);
    setSelectedFile(null);
    setFormData({
      title: item.title,
      category: item.category,
      description: item.description,
      eligibility: item.eligibility || "",
      requiredDocuments: item.requiredDocuments || "",
      applicationStartDate: toInputDate(item.applicationStartDate),
      applicationLastDate: toInputDate(item.applicationLastDate),
      officialLink: item.officialLink || "",
      isImportant: item.isImportant,
      isPublished: item.isPublished,
    });
    setError("");
    setIsFormModalOpen(true);
  };

  const handleOpenViewModal = (item: GovernmentUpdate) => {
    setViewingUpdate(item);
    setIsViewModalOpen(true);
    if (item.isPublished) {
      const nextRead = markUpdateAsRead(item.id);
      setReadIds(nextRead);
    }
  };

  const handleMarkAllRead = () => {
    const publishedIds = updates.filter((u) => u.isPublished).map((u) => u.id);
    const nextRead = markAllUpdatesAsRead(publishedIds);
    setReadIds(nextRead);
    setSuccess("All published updates marked as read.");
  };

  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.description.trim()) {
      setError("Title and Description are required.");
      return;
    }

    const payload: GovernmentUpdateInput = {
      ...formData,
      applicationStartDate: formData.applicationStartDate || null,
      applicationLastDate: formData.applicationLastDate || null,
    };

    try {
      setSaving(true);
      setError("");
      setSuccess("");

      let savedItem: GovernmentUpdate;
      if (editingUpdate) {
        savedItem = await updateGovernmentUpdate(editingUpdate.id, payload);
      } else {
        savedItem = await createGovernmentUpdate(payload);
      }

      if (selectedFile) {
        await uploadUpdateAttachment(savedItem.id, selectedFile);
      }

      setSuccess(
        editingUpdate
          ? `Update "${payload.title}" saved successfully!`
          : `Update "${payload.title}" created successfully!`
      );
      setIsFormModalOpen(false);
      await loadUpdates();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save update.");
    } finally {
      setSaving(false);
    }
  };

  const handleTogglePublish = async (item: GovernmentUpdate) => {
    try {
      setError("");
      setSuccess("");
      await togglePublishUpdate(item.id, !item.isPublished);
      setSuccess(
        !item.isPublished
          ? `"${item.title}" is now published to students.`
          : `"${item.title}" moved to drafts.`
      );
      await loadUpdates();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to change publish status.");
    }
  };

  const handleToggleImportant = async (item: GovernmentUpdate) => {
    try {
      setError("");
      setSuccess("");
      await toggleImportantUpdate(item.id, !item.isImportant);
      setSuccess(
        !item.isImportant
          ? `"${item.title}" marked as Important Announcement.`
          : `Removed Important tag from "${item.title}".`
      );
      await loadUpdates();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update importance.");
    }
  };

  const handleDelete = async (item: GovernmentUpdate) => {
    if (!window.confirm(`Delete "${item.title}" permanently?`)) return;
    try {
      setError("");
      setSuccess("");
      await deleteGovernmentUpdate(item.id);
      setSuccess(`Deleted "${item.title}".`);
      await loadUpdates();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete update.");
    }
  };

  return (
    <div className="govt-updates-page">
      {/* Header */}
      <header className="gu-header">
        <div className="gu-title-group">
          <h1>
            <i className="bi bi-megaphone-fill"></i> Government Updates &amp; Notifications
            {summary.unreadCount > 0 && (
              <span className="gu-unread-pill">
                <i className="bi bi-bell-fill"></i> {summary.unreadCount} New
              </span>
            )}
          </h1>
          <p>
            Instant alerts for government job vacancies, exam forms, scholarships, and admissions
          </p>
        </div>

        <div className="gu-header-actions">
          {summary.unreadCount > 0 && (
            <button
              type="button"
              className="btn-gu-secondary"
              onClick={handleMarkAllRead}
            >
              <i className="bi bi-check2-all"></i> Mark All Read
            </button>
          )}

          <button type="button" className="btn-gu-secondary" onClick={loadUpdates}>
            <i className="bi bi-arrow-clockwise"></i> Refresh
          </button>

          {isAdmin && (
            <button
              type="button"
              className="btn-gu-primary"
              onClick={handleOpenAddModal}
            >
              <i className="bi bi-plus-circle-fill"></i> Add New Update
            </button>
          )}
        </div>
      </header>

      {/* Alerts */}
      {error && (
        <div className="gu-alert gu-alert-error">
          <span>
            <i className="bi bi-exclamation-triangle-fill"></i> {error}
          </span>
          <button
            type="button"
            className="gu-alert-close"
            onClick={() => setError("")}
          >
            &times;
          </button>
        </div>
      )}

      {success && (
        <div className="gu-alert gu-alert-success">
          <span>
            <i className="bi bi-check-circle-fill"></i> {success}
          </span>
          <button
            type="button"
            className="gu-alert-close"
            onClick={() => setSuccess("")}
          >
            &times;
          </button>
        </div>
      )}

      {/* Summary Cards */}
      <section className="gu-summary-grid">
        <div className="gu-summary-card">
          <div className="gu-summary-info">
            <h3>Published Updates</h3>
            <p className="gu-summary-value">{summary.totalPublished}</p>
          </div>
          <div className="gu-summary-icon gu-icon-blue">
            <i className="bi bi-newspaper"></i>
          </div>
        </div>

        <div className="gu-summary-card">
          <div className="gu-summary-info">
            <h3>Important Alerts</h3>
            <p className="gu-summary-value">{summary.importantCount}</p>
          </div>
          <div className="gu-summary-icon gu-icon-red">
            <i className="bi bi-pin-angle-fill"></i>
          </div>
        </div>

        <div className="gu-summary-card">
          <div className="gu-summary-info">
            <h3>Open Applications</h3>
            <p className="gu-summary-value">{summary.openCount}</p>
          </div>
          <div className="gu-summary-icon gu-icon-green">
            <i className="bi bi-calendar2-check-fill"></i>
          </div>
        </div>

        <div className="gu-summary-card">
          <div className="gu-summary-info">
            <h3>Closing Soon (7d)</h3>
            <p className="gu-summary-value">{summary.closingSoonCount}</p>
          </div>
          <div className="gu-summary-icon gu-icon-amber">
            <i className="bi bi-hourglass-split"></i>
          </div>
        </div>
      </section>

      {/* Search & Filters */}
      <section className="gu-filter-card">
        <div className="gu-filter-grid">
          <div className="gu-search-wrap">
            <i className="bi bi-search"></i>
            <input
              type="text"
              placeholder="Search by title, eligibility, category, or description..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <select
            className="gu-select"
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
          >
            <option value="All">All Categories</option>
            {UPDATE_CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>

          <select
            className="gu-select"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="All">All Updates</option>
            <option value="New">New / Unread Only</option>
            <option value="Important">Important Only</option>
            <option value="Open">Open Applications</option>
            <option value="Closed">Previously Published / Closed</option>
            {isAdmin && <option value="Published">Published</option>}
            {isAdmin && <option value="Draft">Drafts (Unpublished)</option>}
          </select>

          {(searchQuery || categoryFilter !== "All" || statusFilter !== "All") && (
            <button
              type="button"
              className="btn-gu-secondary"
              onClick={() => {
                setSearchQuery("");
                setCategoryFilter("All");
                setStatusFilter("All");
              }}
            >
              <i className="bi bi-x-circle"></i> Clear
            </button>
          )}
        </div>
      </section>

      {/* Updates Feed */}
      {loading ? (
        <div className="gu-empty-state">
          <i className="bi bi-arrow-repeat"></i>
          <h3>Loading government updates...</h3>
        </div>
      ) : filteredUpdates.length === 0 ? (
        <div className="gu-empty-state">
          <i className="bi bi-megaphone"></i>
          <h3>No updates found</h3>
          <p>
            {updates.length === 0
              ? isAdmin
                ? "No updates created yet. Click 'Add New Update' to publish an announcement."
                : "No government updates have been published yet. Please check back soon."
              : "Try changing your search query or filters."}
          </p>
        </div>
      ) : (
        <section className="gu-cards-grid">
          {filteredUpdates.map((item) => {
            const isUnread = isUpdateUnread(item, readIds);
            const deadlineStatus = getDeadlineStatus(item.applicationLastDate);
            const attachmentUrl = getAttachmentFullUrl(item.attachmentUrl);

            return (
              <article
                key={item.id}
                className={`gu-card${item.isImportant ? " important" : ""}${
                  isUnread ? " unread" : ""
                }`}
              >
                {item.attachmentType === "image" && attachmentUrl && (
                  <img
                    src={attachmentUrl}
                    alt={item.title}
                    className="gu-card-image-banner"
                    loading="lazy"
                  />
                )}

                <div className="gu-card-body">
                  <div className="gu-badges-row">
                    <span className="gu-badge gu-badge-category">{item.category}</span>

                    {isUnread && (
                      <span className="gu-badge gu-badge-new">
                        <i className="bi bi-stars"></i> NEW
                      </span>
                    )}

                    {item.isImportant && (
                      <span className="gu-badge gu-badge-important">
                        <i className="bi bi-pin-angle-fill"></i> IMPORTANT
                      </span>
                    )}

                    {item.attachmentType === "pdf" && (
                      <span className="gu-badge gu-badge-pdf">
                        <i className="bi bi-file-earmark-pdf-fill"></i> PDF Notice
                      </span>
                    )}

                    {isAdmin && (
                      <span
                        className={`gu-badge ${
                          item.isPublished ? "gu-badge-published" : "gu-badge-draft"
                        }`}
                      >
                        {item.isPublished ? "Published" : "Draft"}
                      </span>
                    )}
                  </div>

                  <h3 className="gu-card-title">{item.title}</h3>
                  <p className="gu-card-desc">{item.description}</p>

                  <div className="gu-dates-box">
                    <div>
                      <div className="gu-date-label">Application Start Date</div>
                      <div className="gu-date-value">
                        {formatDate(item.applicationStartDate)}
                      </div>
                    </div>
                    <div>
                      <div className="gu-date-label">
                        Last Date {deadlineStatus === "urgent" && "• Closing Soon"}
                        {deadlineStatus === "closed" && "• Closed"}
                      </div>
                      <div
                        className={`gu-date-value${
                          deadlineStatus === "urgent"
                            ? " urgent"
                            : deadlineStatus === "closed"
                            ? " closed"
                            : ""
                        }`}
                      >
                        {formatDate(item.applicationLastDate)}
                      </div>
                    </div>
                  </div>

                  <div className="gu-card-footer">
                    <div className="gu-card-actions-left">
                      <button
                        type="button"
                        className="btn-gu-secondary"
                        onClick={() => handleOpenViewModal(item)}
                      >
                        <i className="bi bi-eye"></i> View Details
                      </button>

                      {item.officialLink && (
                        <a
                          href={item.officialLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="btn-gu-primary"
                          onClick={() => {
                            if (item.isPublished) {
                              setReadIds(markUpdateAsRead(item.id));
                            }
                          }}
                        >
                          <i className="bi bi-box-arrow-up-right"></i> Apply Link
                        </a>
                      )}
                    </div>

                    {isAdmin && (
                      <div className="gu-card-actions-right">
                        <button
                          type="button"
                          className="gu-icon-btn publish"
                          title={item.isPublished ? "Unpublish (Move to Draft)" : "Publish to Students"}
                          onClick={() => handleTogglePublish(item)}
                        >
                          <i
                            className={`bi ${
                              item.isPublished ? "bi-check-circle-fill" : "bi-send"
                            }`}
                          ></i>
                        </button>

                        <button
                          type="button"
                          className="gu-icon-btn important"
                          title={item.isImportant ? "Remove Important Mark" : "Mark Important"}
                          onClick={() => handleToggleImportant(item)}
                        >
                          <i
                            className={`bi ${
                              item.isImportant ? "bi-pin-fill" : "bi-pin-angle"
                            }`}
                          ></i>
                        </button>

                        <button
                          type="button"
                          className="gu-icon-btn edit"
                          title="Edit Update"
                          onClick={() => handleOpenEditModal(item)}
                        >
                          <i className="bi bi-pencil"></i>
                        </button>

                        <button
                          type="button"
                          className="gu-icon-btn delete"
                          title="Delete Update"
                          onClick={() => handleDelete(item)}
                        >
                          <i className="bi bi-trash"></i>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </article>
            );
          })}
        </section>
      )}

      {/* Admin Add / Edit Modal */}
      {isFormModalOpen && (
        <div className="gu-modal-overlay">
          <div className="gu-modal-card">
            <div className="gu-modal-header">
              <h2>
                <i className={`bi ${editingUpdate ? "bi-pencil-square" : "bi-megaphone-fill"}`}></i>{" "}
                {editingUpdate ? "Edit Government Update" : "Add New Government Update"}
              </h2>
              <button
                type="button"
                className="gu-modal-close"
                onClick={() => setIsFormModalOpen(false)}
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleSubmitForm}>
              <div className="gu-modal-body">
                <div className="gu-form-grid">
                  <div className="gu-full">
                    <label className="gu-label">Update Title *</label>
                    <input
                      type="text"
                      className="gu-input"
                      placeholder="e.g. SSC CGL 2026 Notification, MahaDBT Scholarship Form"
                      value={formData.title}
                      onChange={(e) =>
                        setFormData({ ...formData, title: e.target.value })
                      }
                      required
                    />
                  </div>

                  <div>
                    <label className="gu-label">Category *</label>
                    <select
                      className="gu-input"
                      value={formData.category}
                      onChange={(e) =>
                        setFormData({ ...formData, category: e.target.value })
                      }
                    >
                      {UPDATE_CATEGORIES.map((cat) => (
                        <option key={cat} value={cat}>
                          {cat}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="gu-label">Official Application Link (URL)</label>
                    <input
                      type="url"
                      className="gu-input"
                      placeholder="https://..."
                      value={formData.officialLink}
                      onChange={(e) =>
                        setFormData({ ...formData, officialLink: e.target.value })
                      }
                    />
                  </div>

                  <div>
                    <label className="gu-label">Application Start Date</label>
                    <input
                      type="date"
                      className="gu-input"
                      value={formData.applicationStartDate ?? ""}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          applicationStartDate: e.target.value,
                        })
                      }
                    />
                  </div>

                  <div>
                    <label className="gu-label">Application Last Date</label>
                    <input
                      type="date"
                      className="gu-input"
                      value={formData.applicationLastDate ?? ""}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          applicationLastDate: e.target.value,
                        })
                      }
                    />
                  </div>

                  <div className="gu-full">
                    <label className="gu-label">Description *</label>
                    <textarea
                      className="gu-textarea"
                      placeholder="Enter key announcement details, vacancy count, fees, or exam schedule..."
                      value={formData.description}
                      onChange={(e) =>
                        setFormData({ ...formData, description: e.target.value })
                      }
                      required
                    />
                  </div>

                  <div className="gu-full">
                    <label className="gu-label">Eligibility Information</label>
                    <textarea
                      className="gu-textarea"
                      placeholder="e.g. 12th Pass / Graduate, Age limit 18-30 years, MS-CIT required..."
                      value={formData.eligibility}
                      onChange={(e) =>
                        setFormData({ ...formData, eligibility: e.target.value })
                      }
                    />
                  </div>

                  <div className="gu-full">
                    <label className="gu-label">Required Documents</label>
                    <textarea
                      className="gu-textarea"
                      placeholder="e.g. Aadhaar Card, 10th/12th Marksheet, Passport Photo, Caste Certificate..."
                      value={formData.requiredDocuments}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          requiredDocuments: e.target.value,
                        })
                      }
                    />
                  </div>

                  <div className="gu-full">
                    <label className="gu-label">
                      Upload Notification Image or PDF (Optional, max 10 MB)
                    </label>
                    <input
                      type="file"
                      accept=".jpg,.jpeg,.png,.webp,.pdf"
                      className="gu-input"
                      onChange={(e) =>
                        setSelectedFile(e.target.files?.[0] ?? null)
                      }
                    />
                    {editingUpdate?.attachmentUrl && !selectedFile && (
                      <small style={{ color: "#64748b", display: "block", marginTop: "4px" }}>
                        Current attachment: {editingUpdate.attachmentType?.toUpperCase()} uploaded
                      </small>
                    )}
                  </div>

                  <div className="gu-full gu-checkbox-row">
                    <label className="gu-checkbox-label">
                      <input
                        type="checkbox"
                        checked={formData.isImportant}
                        onChange={(e) =>
                          setFormData({ ...formData, isImportant: e.target.checked })
                        }
                      />
                      Mark as Important Announcement
                    </label>

                    <label className="gu-checkbox-label">
                      <input
                        type="checkbox"
                        checked={formData.isPublished}
                        onChange={(e) =>
                          setFormData({ ...formData, isPublished: e.target.checked })
                        }
                      />
                      Publish Immediately to Students
                    </label>
                  </div>
                </div>
              </div>

              <div className="gu-modal-footer">
                <button
                  type="button"
                  className="btn-gu-secondary"
                  onClick={() => setIsFormModalOpen(false)}
                  disabled={saving}
                >
                  Cancel
                </button>
                <button type="submit" className="btn-gu-primary" disabled={saving}>
                  {saving ? "Saving..." : editingUpdate ? "Save Changes" : "Save Update"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Full Details Modal */}
      {isViewModalOpen && viewingUpdate && (
        <div className="gu-modal-overlay">
          <div className="gu-modal-card">
            <div className="gu-modal-header">
              <h2>{viewingUpdate.title}</h2>
              <button
                type="button"
                className="gu-modal-close"
                onClick={() => setIsViewModalOpen(false)}
              >
                &times;
              </button>
            </div>

            <div className="gu-modal-body">
              <div className="gu-badges-row" style={{ marginBottom: "14px" }}>
                <span className="gu-badge gu-badge-category">
                  {viewingUpdate.category}
                </span>
                {viewingUpdate.isImportant && (
                  <span className="gu-badge gu-badge-important">
                    <i className="bi bi-pin-angle-fill"></i> IMPORTANT
                  </span>
                )}
                <span style={{ fontSize: "12px", color: "#64748b" }}>
                  Published:{" "}
                  {formatDate(viewingUpdate.publishedAt || viewingUpdate.createdAt)}
                </span>
              </div>

              {viewingUpdate.attachmentType === "image" &&
                viewingUpdate.attachmentUrl && (
                  <img
                    src={getAttachmentFullUrl(viewingUpdate.attachmentUrl)}
                    alt={viewingUpdate.title}
                    className="gu-detail-banner"
                  />
                )}

              {viewingUpdate.attachmentType === "pdf" &&
                viewingUpdate.attachmentUrl && (
                  <div
                    className="gu-detail-section"
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <div>
                      <h4>Official Notification PDF</h4>
                      <p>Download or view the attached circular</p>
                    </div>
                    <a
                      href={getAttachmentFullUrl(viewingUpdate.attachmentUrl)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn-gu-primary"
                    >
                      <i className="bi bi-file-earmark-pdf-fill"></i> Open PDF
                    </a>
                  </div>
                )}

              <div className="gu-dates-box">
                <div>
                  <div className="gu-date-label">Application Start Date</div>
                  <div className="gu-date-value">
                    {formatDate(viewingUpdate.applicationStartDate)}
                  </div>
                </div>
                <div>
                  <div className="gu-date-label">Application Last Date</div>
                  <div className="gu-date-value">
                    {formatDate(viewingUpdate.applicationLastDate)}
                  </div>
                </div>
              </div>

              <div className="gu-detail-section">
                <h4>Description</h4>
                <p>{viewingUpdate.description}</p>
              </div>

              <div className="gu-detail-section">
                <h4>Eligibility Information</h4>
                <p>
                  {viewingUpdate.eligibility ||
                    "Refer to the official notification for eligibility criteria."}
                </p>
              </div>

              <div className="gu-detail-section">
                <h4>Required Documents</h4>
                <p>
                  {viewingUpdate.requiredDocuments ||
                    "Refer to the official notification for the document checklist."}
                </p>
              </div>
            </div>

            <div className="gu-modal-footer">
              <button
                type="button"
                className="btn-gu-secondary"
                onClick={() => setIsViewModalOpen(false)}
              >
                Close
              </button>
              {viewingUpdate.officialLink && (
                <a
                  href={viewingUpdate.officialLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-gu-primary"
                >
                  <i className="bi bi-box-arrow-up-right"></i> Apply on Official Website
                </a>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
