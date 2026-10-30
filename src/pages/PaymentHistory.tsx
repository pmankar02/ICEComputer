
import { useEffect, useMemo, useState } from "react";
import "./PaymentHistory.css";
import { useNavigate } from "react-router-dom";

interface Payment {
  id: number;
  studentFeeId: number;
  studentName: string;
  amountPaid: number;
  paymentDate: string;
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

const PAYMENT_API = "http://localhost:5056/api/FeePayments/all";
const FEES_API = "http://localhost:5056/api/StudentFees";

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

        if (!paymentResponse.ok || !feeResponse.ok) {
          throw new Error("Unable to load payment history.");
        }

        const paymentData: Payment[] = await paymentResponse.json();
        const feeData: Fee[] = await feeResponse.json();

        setPayments(paymentData);
        setFees(feeData);
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
        totalFees: fee?.totalFees ?? 0,
        paidFees: fee?.paidFees ?? 0,
        pendingFees: fee?.remainingFees ?? 0,
      };
    });
  }, [payments, fees]);

  const filteredHistory = useMemo(() => {
    const query = search.trim().toLowerCase();

    return history.filter((item) =>
      (item.studentName ?? "").toLowerCase().includes(query)
    );
  }, [history, search]);

  function formatCurrency(amount: number) {
    return `₹${amount.toLocaleString("en-IN", {
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
          View student payments, fees paid and pending balances.
        </p>

        <div className="payment-history-search">
          <input
            type="search"
            placeholder="Search by student name..."
            aria-label="Search by student name"
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
                  <th>Total Fees</th>
                  <th>Paid Fees</th>
                  <th>Pending Fees</th>
                </tr>
              </thead>

              <tbody>
                {filteredHistory.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="payment-empty">
                      No payment history found.
                    </td>
                  </tr>
                ) : (
                  filteredHistory.map((item) => (
                    <tr key={item.id}>
                      <td>{item.studentName || "Unknown Student"}</td>
                      <td>{formatDate(item.paymentDate)}</td>
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
