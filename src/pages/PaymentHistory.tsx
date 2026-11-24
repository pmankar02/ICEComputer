import { useEffect, useMemo, useState } from "react";
import "./PaymentHistory.css";
import { useNavigate } from "react-router-dom";
import { API_BASE_URL } from "../config/apiConfig";

interface Payment {
  id: number;
  studentFeeId: number;
  studentName: string;
  course?: string;
  amountPaid: number;
  paymentDate: string;
  paymentMode?: string;
  notes?: string;
}

interface Fee {
  id: number;
  studentId: number;
  studentName: string;
  totalFees: number;
  paidFees: number;
  remainingFees: number;
}

interface PaymentHistoryRow extends Payment {
  totalFees: number;
  paidFees: number;
  pendingFees: number;
}

const PAYMENT_API = `${API_BASE_URL}/api/FeePayments/all`;
const FEES_API = `${API_BASE_URL}/api/StudentFees`;

export default function PaymentHistory() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [fees, setFees] = useState<Fee[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    async function loadHistory() {
      setLoading(true);
      setError("");

      try {
        const [paymentResponse, feeResponse] = await Promise.all([
          fetch(PAYMENT_API),
          fetch(FEES_API),
        ]);

        if (!paymentResponse.ok) {
          throw new Error("Unable to load payment records.");
        }

        const rawPayments: any[] = await paymentResponse.json();
        const rawFees: any[] = feeResponse.ok ? await feeResponse.json() : [];

        const normalizedPayments: Payment[] = rawPayments.map((p) => ({
          id: p.id ?? p.Id ?? 0,
          studentFeeId: p.studentFeeId ?? p.StudentFeeId ?? 0,
          studentName: p.studentName ?? p.StudentName ?? "",
          course: p.course ?? p.Course ?? "",
          amountPaid: Number(p.amountPaid ?? p.AmountPaid ?? 0),
          paymentDate: p.paymentDate ?? p.PaymentDate ?? "",
          paymentMode: p.paymentMode ?? p.PaymentMode ?? "",
          notes: p.notes ?? p.Notes ?? "",
        }));

        const normalizedFees: Fee[] = rawFees.map((f) => ({
          id: f.id ?? f.Id ?? 0,
          studentId: f.studentId ?? f.StudentId ?? 0,
          studentName: f.studentName ?? f.StudentName ?? "",
          totalFees: Number(f.totalFees ?? f.TotalFees ?? 0),
          paidFees: Number(f.paidFees ?? f.PaidFees ?? 0),
          remainingFees: Number(f.remainingFees ?? f.RemainingFees ?? 0),
        }));

        setPayments(normalizedPayments);
        setFees(normalizedFees);
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Unable to load payment history."
        );
      } finally {
        setLoading(false);
      }
    }

    void loadHistory();
  }, []);

  const history = useMemo<PaymentHistoryRow[]>(() => {
    return payments.map((payment) => {
      const fee = fees.find((item) => item.id === payment.studentFeeId);

      return {
        ...payment,
        studentName: payment.studentName || fee?.studentName || "Unknown Student",
        totalFees: fee?.totalFees ?? 0,
        paidFees: fee?.paidFees ?? 0,
        pendingFees: fee?.remainingFees ?? 0,
      };
    });
  }, [payments, fees]);

  const filteredHistory = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return history;

    return history.filter(
      (item) =>
        (item.studentName ?? "").toLowerCase().includes(query) ||
        (item.course ?? "").toLowerCase().includes(query) ||
        (item.paymentMode ?? "").toLowerCase().includes(query)
    );
  }, [history, search]);

  function formatCurrency(amount?: number | null) {
    const val = Number(amount) || 0;
    return `₹${val.toLocaleString("en-IN", {
      maximumFractionDigits: 2,
    })}`;
  }

  function formatDate(value: string) {
    if (!value) return "-";

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) return "-";

    return date.toLocaleDateString("en-IN");
  }

  return (
    <div className="payment-history-page">
      <button
        type="button"
        className="payment-back-button"
        onClick={() => navigate("/fees")}
      >
        ← Back to Fees
      </button>
      <div className="payment-card">
        <h2>Payment History</h2>
        <p className="page-description">
          View student payment transactions, amounts paid, and pending balances.
        </p>

        <div className="payment-history-search">
          <input
            type="search"
            placeholder="Search by student name, course, or mode..."
            aria-label="Search by student name, course, or mode"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </div>

        {error && <p className="error-message">{error}</p>}

        {loading ? (
          <p>Loading payment history...</p>
        ) : (
          <div className="payment-table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Student Name</th>
                  <th>Date</th>
                  <th>Amount Paid</th>
                  <th>Payment Mode</th>
                  <th>Total Fees</th>
                  <th>Paid Fees</th>
                  <th>Pending Fees</th>
                </tr>
              </thead>

              <tbody>
                {filteredHistory.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="payment-empty">
                      No payment history found.
                    </td>
                  </tr>
                ) : (
                  filteredHistory.map((item, index) => (
                    <tr key={item.id ? `${item.id}-${index}` : index}>
                      <td>
                        <div className="payment-student-cell">
                          <strong>{item.studentName || "Unknown Student"}</strong>
                          {item.course && (
                            <span className="payment-course-tag">{item.course}</span>
                          )}
                        </div>
                      </td>
                      <td>{formatDate(item.paymentDate)}</td>
                      <td className="payment-amount-cell">
                        {formatCurrency(item.amountPaid)}
                      </td>
                      <td>
                        <span className="payment-mode-pill">
                          {item.paymentMode || "Cash"}
                        </span>
                      </td>
                      <td>{formatCurrency(item.totalFees)}</td>
                      <td>{formatCurrency(item.paidFees)}</td>
                      <td>{formatCurrency(item.pendingFees)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
