const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

export async function apiRequest(path, options = {}) {
  let response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
      ...options,
    });
  } catch {
    throw new Error(`Cannot reach the backend at ${API_BASE_URL}. Start Flask and check that the frontend origin is allowed by CORS.`);
  }
  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(body.error || `Request failed with status ${response.status}`);
  }
  return body;
}
