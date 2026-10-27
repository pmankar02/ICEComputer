import { useEffect, useMemo, useState } from "react";
import "./PaymentHistory.css";

interface Payment {
  id: number;
  studentFeeId: number;
  studentId: number;
  studentName: string;
  course: string;
  amountPaid: number;
  paymentDate: string;
  paymentMode: string;
  notes?: string | null;
}

const API_URL = "http://localhost:5056/api/FeePayments";

export default function PaymentHistory() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [search, setSearch] = useState("");
  const [mode, setMode] = useState("All");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadPayments() {
      setLoading(true);
      setError("");

      try {
        const response = await fetch(`${API_URL}/all`);
        if (!response.ok) throw new Error("Unable to load payment records.");

        const data: Payment[] = await response.json();
        setPayments(data);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Unable to load payments."
        );
      } finally {
        setLoading(false);
      }
    }

    void loadPayments();
  }, []);

  const filteredPayments = useMemo(() => {
    const query = search.trim().toLowerCase();

    return payments.filter((p) => {
      const matchesSearch =
        !query ||
        (p.studentName ?? "").toLowerCase().includes(query) ||
        (p.course ?? "").toLowerCase().includes(query) ||
        String(p.studentId).includes(query) ||
        String(p.studentFeeId).includes(query) ||
        String(p.id).includes(query);

      const matchesMode = mode === "All" || p.paymentMode === mode;
      const date = p.paymentDate?.slice(0, 10) ?? "";
      const matchesFrom = !fromDate || date >= fromDate;
      const matchesTo = !toDate || date <= toDate;

      return matchesSearch && matchesMode && matchesFrom && matchesTo;
    });
  }, [payments, search, mode, fromDate, toDate]);

  function clearFilters() {
    setSearch("");
    setMode("All");
    setFromDate("");
    setToDate("");
  }

  return (
    <div className="payment-history-page">
      {error && <div className="payment-alert error-message">{error}</div>}

      <div className="payment-card">
        <h2>All Payment Records</h2>
        <p className="page-description">
          Search and filter transactions across all students.
        </p>

        <p>{filteredPayments.length} of {payments.length} records</p>

        <div className="payment-filters">
          <div className="payment-field">
            <label htmlFor="paymentSearch">Search</label>
            <input
              id="paymentSearch"
              type="search"
              placeholder="Student name, ID, course"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className="payment-field">
            <label htmlFor="paymentMode">Payment Mode</label>
            <select
              id="paymentMode"
              value={mode}
              onChange={(e) => setMode(e.target.value)}
            >
              <option value="All">All Modes</option>
              <option value="Cash">Cash</option>
              <option value="UPI">UPI</option>
              <option value="Card">Card</option>
              <option value="Bank Transfer">Bank Transfer</option>
            </select>
          </div>

          <div className="payment-field">
            <label htmlFor="fromDate">From Date</label>
            <input
              id="fromDate"
              type="date"
              value={fromDate}
              max={toDate || undefined}
              onChange={(e) => setFromDate(e.target.value)}
            />
          </div>

          <div className="payment-field">
            <label htmlFor="toDate">To Date</label>
            <input
              id="toDate"
              type="date"
              value={toDate}
              min={fromDate || undefined}
              onChange={(e) => setToDate(e.target.value)}
            />
          </div>

          <button type="button" onClick={clearFilters}>
            Clear Filters
          </button>
        </div>

        <div className="payment-table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Payment ID</th>
                <th>Student Name</th>
                <th>Course</th>
                <th>Fee ID</th>
                <th>Amount</th>
                <th>Payment Date</th>
                <th>Payment Mode</th>
                <th>Notes</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={8} className="payment-empty">
                    Loading payment records...
                  </td>
                </tr>
              ) : filteredPayments.length === 0 ? (
                <tr>
                  <td colSpan={8} className="payment-empty">
                    No payment records found.
                  </td>
                </tr>
              ) : (
                filteredPayments.map((p) => (
                  <tr key={p.id}>
                    <td>#{p.id}</td>
                    <td>{p.studentName || "Unknown Student"}</td>
                    <td>{p.course || "-"}</td>
                    <td>{p.studentFeeId}</td>
                    <td>
                      ₹{p.amountPaid.toLocaleString("en-IN", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </td>
                    <td>{new Date(p.paymentDate).toLocaleString("en-IN")}</td>
                    <td>{p.paymentMode}</td>
                    <td>{p.notes || "-"}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}