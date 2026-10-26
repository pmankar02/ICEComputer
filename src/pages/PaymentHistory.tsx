
import { useState } from "react";
import "./PaymentHistory.css";

interface Payment {
  id: number;
  studentFeeId: number;
  amountPaid: number;
  paymentDate: string;
  paymentMode: string;
  notes?: string | null;
}

const API_URL = "http://localhost:5056/api/FeePayments";

export default function PaymentHistory() {
  const [feeId, setFeeId] = useState("");
  const [payments, setPayments] = useState<Payment[]>([]);
  const [amount, setAmount] = useState("");
  const [mode, setMode] = useState("Cash");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  async function loadPayments() {
    if (!feeId || Number(feeId) <= 0) {
      setError("Enter a valid Fee ID.");
      return;
    }

    setLoading(true);
    setError("");
    setMessage("");

    try {
      const response = await fetch(`${API_URL}/fee/${feeId}`);

      if (!response.ok) {
        throw new Error(await response.text() || "Unable to load payment history.");
      }

      const data: Payment[] = await response.json();
      setPayments(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load payments.");
    } finally {
      setLoading(false);
    }
  }

  async function addPayment(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setMessage("");

    const paymentAmount = Number(amount);

    if (!feeId || Number(feeId) <= 0 || !Number.isFinite(paymentAmount) || paymentAmount <= 0) {
      setError("Enter a valid Fee ID and payment amount.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentFeeId: Number(feeId),
          amountPaid: paymentAmount,
          paymentMode: mode,
          notes: notes.trim() || null,
        }),
      });

      if (!response.ok) {
        throw new Error(await response.text() || "Unable to save payment.");
      }

      setMessage("Payment saved successfully!");
      setAmount("");
      setNotes("");
      await loadPayments();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to save payment.");
    } finally {
      setLoading(false);
    }
  }

 
return (
  <div className="payment-history-page">
    <div className="payment-page-header">
      <div>
        <h1>Payment History</h1>
        <p className="page-description">
          Manage and track student fee payments.
        </p>
      </div>
    </div>

    <div className="payment-card">
      <h2>Load Payment History</h2>

      <form
        className="payment-form"
        onSubmit={(event) => {
          event.preventDefault();
          void loadPayments();
        }}
      >
        <div className="payment-field">
          <label htmlFor="feeId">Fee ID</label>
          <input
            id="feeId"
            type="number"
            min="1"
            value={feeId}
            onChange={(event) => setFeeId(event.target.value)}
            placeholder="Enter Fee ID"
            required
          />
        </div>

        <button type="submit" disabled={loading}>
          {loading ? "Loading..." : "Load History"}
        </button>
      </form>
    </div>

    <div className="payment-card">
      <h2>Add Payment</h2>

      <form onSubmit={addPayment} className="payment-form">
        <div className="payment-field">
          <label htmlFor="amount">Amount (₹)</label>
          <input
            id="amount"
            type="number"
            min="0.01"
            step="0.01"
            value={amount}
            onChange={(event) => setAmount(event.target.value)}
            placeholder="Enter amount"
            required
          />
        </div>

        <div className="payment-field">
          <label htmlFor="mode">Payment Mode</label>
          <select
            id="mode"
            value={mode}
            onChange={(event) => setMode(event.target.value)}
          >
            <option value="Cash">Cash</option>
            <option value="UPI">UPI</option>
            <option value="Card">Card</option>
            <option value="Bank Transfer">Bank Transfer</option>
          </select>
        </div>

        <div className="payment-field">
          <label htmlFor="notes">Notes</label>
          <input
            id="notes"
            type="text"
            maxLength={250}
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            placeholder="Optional notes"
          />
        </div>

        <div className="payment-form-action">
          <button type="submit" disabled={loading}>
            {loading ? "Saving..." : "Save Payment"}
          </button>
        </div>
      </form>
    </div>

    {message && <div className="payment-alert success-message">{message}</div>}
    {error && <div className="payment-alert error-message">{error}</div>}

    <div className="payment-card">
      <div className="payment-records-header">
        <div>
          <h2>Payment Records</h2>
          <p className="page-description">
            View recorded transactions for the selected fee.
          </p>
        </div>
        <span className="payment-count">
          {payments.length} Records
        </span>
      </div>

      <div className="payment-table-wrapper">
        <table>
          <thead>
            <tr>
              <th>Payment ID</th>
              <th>Fee ID</th>
              <th>Amount</th>
              <th>Payment Date</th>
              <th>Payment Mode</th>
              <th>Notes</th>
            </tr>
          </thead>
          <tbody>
            {payments.length === 0 ? (
              <tr>
                <td colSpan={6} className="payment-empty">
                  {loading
                    ? "Loading payment records..."
                    : "No payment records loaded. Enter a Fee ID and click Load History."}
                </td>
              </tr>
            ) : (
              payments.map((payment) => (
                <tr key={payment.id}>
                  <td>#{payment.id}</td>
                  <td>{payment.studentFeeId}</td>
                  <td className="payment-amount">
                    ₹{payment.amountPaid.toLocaleString("en-IN")}
                  </td>
                  <td>
                    {new Date(payment.paymentDate).toLocaleString("en-IN")}
                  </td>
                  <td>
                    <span className="payment-mode-badge">
                      {payment.paymentMode}
                    </span>
                  </td>
                  <td>{payment.notes || "-"}</td>
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
