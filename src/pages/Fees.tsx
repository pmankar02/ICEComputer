import { useEffect, useState } from "react";
import "./Fees.css";

interface StudentOption {
  id: number;
  name: string;
  mobile?: string;
  course?: string;
}

interface Fee {
  id: number;
  studentId: number;
  studentName: string;
  course?: string;
  totalFees: number;
  paidFees: number;
  remainingFees: number;
  createdDate?: string;
}

const API_URL = "http://localhost:5056/api/StudentFees";

export default function Fees() {
  const [fees, setFees] = useState<Fee[]>([]);
  const [students, setStudents] = useState<StudentOption[]>([]);
  const [studentId, setStudentId] = useState("");
  const [totalFees, setTotalFees] = useState("");
  const [paidFees, setPaidFees] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [paymentStatus, setPaymentStatus] = useState("All");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 5;

  async function loadFees() {
    setLoading(true);
    try {
      const response = await fetch(API_URL);
      if (!response.ok) throw new Error("Unable to load fee records.");

      const data: Fee[] = await response.json();
      setFees(data);
      setError("");
    } catch {
      setError("Could not load fees. Check whether the backend is running.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
  void loadFees();

  async function loadStudents() {
    try {
      const response = await fetch("http://localhost:5056/api/students");

      if (!response.ok) {
        throw new Error("Unable to load students.");
      }

      const data = await response.json();

      setStudents(
        data.map((student: any) => ({
          id: student.id ?? student.Id,
          name: student.name ?? student.Name ?? "",
          mobile: student.mobile ?? student.Mobile ?? "",
          course: student.course ?? student.Course ?? "",
        }))
      );
    } catch (err) {
      console.error("Failed to load students:", err);
    }
  }

  void loadStudents();
}, []);

  function resetForm() {
    setStudentId("");
    setTotalFees("");
    setPaidFees("");
    setEditingId(null);
    setShowForm(false);
  }

  function startEdit(fee: Fee) {
    setEditingId(fee.id);
    setStudentId(String(fee.studentId));
    setTotalFees(String(fee.totalFees));
    setPaidFees(String(fee.paidFees));
    setShowForm(true);
    setError("");
    setMessage("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setMessage("");

    const studentIdNumber = Number(studentId);
    const total = Number(totalFees);
    const paid = Number(paidFees);

    if (
      !Number.isInteger(studentIdNumber) ||
      studentIdNumber <= 0 ||
      totalFees.trim() === "" ||
      paidFees.trim() === "" ||
      !Number.isFinite(total) ||
      !Number.isFinite(paid) ||
      total < 0 ||
      paid < 0 ||
      paid > total
    ) {
      setError(
        "Enter a valid Student ID and fee amounts. Paid fees cannot exceed total fees."
      );
      return;
    }

    setSaving(true);
    try {
      const isEditing = editingId !== null;
      const url = isEditing ? `${API_URL}/${editingId}` : API_URL;
      const payload = isEditing
        ? { id: editingId, studentId: studentIdNumber, totalFees: total, paidFees: paid }
        : { studentId: studentIdNumber, totalFees: total, paidFees: paid };

      const response = await fetch(url, {
        method: isEditing ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const details = await response.text();
        throw new Error(details || "Unable to save the fee record.");
      }

      resetForm();
      setMessage(
        isEditing
          ? "Fee record updated successfully!"
          : "Fee record added successfully!"
      );
      await loadFees();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save fee record.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(fee: Fee) {
    const confirmed = window.confirm(
      `Are you sure you want to delete the fee record for ${fee.studentName}?`
    );
    if (!confirmed) return;

    setError("");
    setMessage("");
    try {
      const response = await fetch(`${API_URL}/${fee.id}`, { method: "DELETE" });
      if (!response.ok) {
        const details = await response.text();
        throw new Error(details || "Unable to delete the fee record.");
      }

      if (editingId === fee.id) resetForm();
      setMessage("Fee record deleted successfully!");
      await loadFees();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not delete fee record.");
    }
  }

  const filteredFees = fees.filter((fee) => {
    const search = searchTerm.toLowerCase().trim();
    const matchesSearch =
      (fee.studentName ?? "").toLowerCase().includes(search) ||
      String(fee.studentId).includes(search) ||
      (fee.course ?? "").toLowerCase().includes(search);

    const status =
      fee.paidFees === 0
        ? "Pending"
        : fee.paidFees >= fee.totalFees
          ? "Paid"
          : "Partial";

    return matchesSearch && (paymentStatus === "All" || status === paymentStatus);
  });

  const totalAmount = fees.reduce((sum, fee) => sum + fee.totalFees, 0);
  const paidAmount = fees.reduce((sum, fee) => sum + fee.paidFees, 0);
  const remainingAmount = fees.reduce((sum, fee) => sum + fee.remainingFees, 0);

  const totalPages = Math.max(1, Math.ceil(filteredFees.length / pageSize));
  const safePage = Math.min(currentPage, totalPages);
  const paginatedFees = filteredFees.slice(
    (safePage - 1) * pageSize,
    safePage * pageSize
  );

  function formatCurrency(value: number) {
    return `₹${value.toLocaleString("en-IN", {
      maximumFractionDigits: 2,
    })}`;
  }

  return (
    <div className="fees-page">
      <div className="fees-header">
        <div>
          <h1>Fees Management</h1>
          <p>Collect and manage student fees.</p>
        </div>

        <div className="fees-header-actions">
          <button
            type="button"
            className="fees-history-button"
            onClick={() => {
              window.location.hash = "/payment-history";
            }}
          >
            Payment History
          </button>

          <button
            type="button"
            className="fees-add-button"
            onClick={() => {
              if (showForm) {
                resetForm();
              } else {
                setEditingId(null);
                setStudentId("");
                setTotalFees("");
                setPaidFees("");
                setShowForm(true);
              }
              setError("");
              setMessage("");
            }}
          >
            {showForm ? "Cancel" : "+ Collect Fee"}
          </button>
        </div>
      </div>

      {showForm && (
        <form className="fees-form" onSubmit={handleSubmit}>
          <h2>{editingId !== null ? "Edit Fee Record" : "Collect Fee"}</h2>

          <div className="fees-form-grid">
           <label>
              Student Name
              <select
                className="student-select"
                value={studentId}
                onChange={(event) => setStudentId(event.target.value)}
                required
              >
                <option value="">Select Student</option>

                {students.map((student) => (
                  <option key={student.id} value={student.id}>
                    {student.name} — ID: {student.id}
                    {student.course ? ` (${student.course})` : ""}
                  </option>
                ))}
              </select>
            </label>

            <label>
              Total Fees (₹)
              <input
                type="number"
                min="0"
                step="0.01"
                value={totalFees}
                onChange={(event) => setTotalFees(event.target.value)}
                required
              />
            </label>

            <label>
              Paid Fees (₹)
              <input
                type="number"
                min="0"
                step="0.01"
                max={totalFees || undefined}
                value={paidFees}
                onChange={(event) => setPaidFees(event.target.value)}
                required
              />
            </label>
          </div>

          <p className="fees-remaining-preview">
            Pending Fees:{" "}
            {formatCurrency(
              Math.max(0, (Number(totalFees) || 0) - (Number(paidFees) || 0))
            )}
          </p>

          <button className="fees-save-button" type="submit" disabled={saving}>
            {saving
              ? "Saving..."
              : editingId !== null
                ? "Update Fee"
                : "Save Fee"}
          </button>
        </form>
      )}

      {message && <p className="fees-success">{message}</p>}
      {error && <p className="fees-error">{error}</p>}

      <div className="fees-summary">
        <div className="fees-card">
          <span>Total Records</span>
          <h2>{fees.length}</h2>
        </div>
        <div className="fees-card">
          <span>Total Fees</span>
          <h2>{formatCurrency(totalAmount)}</h2>
        </div>
        <div className="fees-card">
          <span>Paid Fees</span>
          <h2>{formatCurrency(paidAmount)}</h2>
        </div>
        <div className="fees-card">
          <span>Pending Fees</span>
          <h2>{formatCurrency(remainingAmount)}</h2>
        </div>
      </div>

      <div className="fees-toolbar">
        <input
          type="search"
          placeholder="Search by student name, mobile or course..."
          value={searchTerm}
          onChange={(event) => {
            setSearchTerm(event.target.value);
            setCurrentPage(1);
          }}
          aria-label="Search fee records"
        />

        <select
          value={paymentStatus}
          onChange={(event) => {
            setPaymentStatus(event.target.value);
            setCurrentPage(1);
          }}
          aria-label="Filter by payment status"
        >
          <option value="All">All Payments</option>
          <option value="Paid">Paid</option>
          <option value="Partial">Partial</option>
          <option value="Pending">Pending</option>
        </select>
      </div>

      {loading ? (
        <p className="fees-loading">Loading fee records...</p>
      ) : (
        <>
          <div className="fees-table-container">
            <table className="fees-table">
              <thead>
                <tr>
                  <th>Student</th>
                  <th>Course</th>
                  <th>Total Fees</th>
                  <th>Paid</th>
                  <th>Pending</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {paginatedFees.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="fees-empty">
                      No fee records found.
                    </td>
                  </tr>
                ) : (
                  paginatedFees.map((fee) => {
                    const status =
                      fee.paidFees === 0
                        ? "Pending"
                        : fee.paidFees >= fee.totalFees
                          ? "Paid"
                          : "Partial";

                    return (
                      <tr key={fee.id}>
                        <td>{fee.studentName || `Student #${fee.studentId}`}</td>
                        <td>{fee.course || "-"}</td>
                        <td>{formatCurrency(fee.totalFees)}</td>
                        <td>{formatCurrency(fee.paidFees)}</td>
                        <td>
                          <span className={`fees-status fees-status-${status.toLowerCase()}`}>
                            {formatCurrency(fee.remainingFees)}
                          </span>
                        </td>
                        <td>
                          <div className="fees-actions">
                            <button
                              type="button"
                              className="fees-edit-button"
                              onClick={() => startEdit(fee)}
                              aria-label={`Edit fee record ${fee.id}`}
                            >
                              Edit
                            </button>
                            <button
                              type="button"
                              className="fees-delete-button"
                              onClick={() => void handleDelete(fee)}
                              aria-label={`Delete fee record ${fee.id}`}
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          <div className="fees-pagination">
            <span>
              Showing {filteredFees.length === 0 ? 0 : (safePage - 1) * pageSize + 1}
              {" to "}
              {Math.min(safePage * pageSize, filteredFees.length)} of {filteredFees.length} entries
            </span>
            <div className="fees-pagination-buttons">
              <button
                type="button"
                onClick={() => setCurrentPage(Math.max(1, safePage - 1))}
                disabled={safePage === 1}
              >
                ‹
              </button>
              {Array.from({ length: totalPages }, (_, index) => index + 1)
                .filter((page) =>
                  totalPages <= 5 ||
                  page === 1 ||
                  page === totalPages ||
                  Math.abs(page - safePage) <= 1
                )
                .map((page, index, pages) => (
                  <span className="fees-page-number" key={page}>
                    {index > 0 && page - pages[index - 1] > 1 && <span>…</span>}
                    <button
                      type="button"
                      className={page === safePage ? "active" : ""}
                      onClick={() => setCurrentPage(page)}
                    >
                      {page}
                    </button>
                  </span>
                ))}
              <button
                type="button"
                onClick={() => setCurrentPage(Math.min(totalPages, safePage + 1))}
                disabled={safePage === totalPages}
              >
                ›
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
