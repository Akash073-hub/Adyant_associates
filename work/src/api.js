const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://127.0.0.1:5000/api';

export async function apiRequest(path, options = {}) {
  let response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
      ...options,
    });
  } catch {
    throw new Error(`The website API is not running at ${API_BASE_URL}. From the project folder, start it with: cd backend && .venv/bin/python app.py. If it is already running, check the API URL and CORS settings.`);
  }
  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(body.error || `Request failed with status ${response.status}`);
    Object.assign(error, body, { status: response.status });
    throw error;
  }
  return body;
}
