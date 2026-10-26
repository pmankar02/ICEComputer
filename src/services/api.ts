
const API_BASE_URL = "http://localhost:5056";

export async function testApiConnection(): Promise<string> {
  const response = await fetch(`${API_BASE_URL}/weatherforecast`);

  if (!response.ok) {
    throw new Error(`API request failed: ${response.status}`);
  }

  return "Connected successfully to the .NET API!";
}
