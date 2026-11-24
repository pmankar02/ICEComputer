// Dynamic API Base URL:
// - On localhost: points to local backend http://localhost:5056
// - On Azure cloud: automatically points to current Azure domain
export const API_BASE_URL =
  window.location.hostname === "localhost"
    ? "http://localhost:5056"
    : window.location.origin;
