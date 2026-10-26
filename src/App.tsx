
import { HashRouter, Routes, Route } from "react-router-dom";
import Dashboard from "./pages/Dashboard";
import Students from "./pages/Students";
import MainLayout from "./layouts/MainLayout.tsx";
import Fees from "./pages/Fees";
import PaymentHistory from "./pages/PaymentHistory";

function App() {
  return (
    <HashRouter>
      <Routes>
        <Route element={<MainLayout />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/students" element={<Students />} />
          <Route path="/fees" element={<Fees />} />
          <Route path="/payment-history" element={<PaymentHistory />} />
        </Route>
      </Routes>
    </HashRouter>
  );
}

export default App;



// import { useState } from "react";
// import { testApiConnection } from "./services/api";

// function App() {
//   const [message, setMessage] = useState("Not tested yet");
//   const [loading, setLoading] = useState(false);

//   async function handleTestConnection() {
//     setLoading(true);
//     setMessage("Connecting to .NET API...");

//     try {
//       const result = await testApiConnection();
//       setMessage(result);
//     } catch (error) {
//       setMessage(
//         error instanceof Error ? error.message : "Connection failed"
//       );
//     } finally {
//       setLoading(false);
//     }
//   }

//   return (
//     <div style={{ padding: "40px", fontFamily: "Arial" }}>
//       <h1>ICE Computer</h1>
//       <h2>Backend Connection Test</h2>

//       <button onClick={handleTestConnection} disabled={loading}>
//         {loading ? "Testing..." : "Test API Connection"}
//       </button>

//       <p>{message}</p>
//     </div>
//   );
// }

// export default App;
