const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001/api';

export async function apiRequest(path, options = {}) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
    ...options,
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(body.error || `Request failed with status ${response.status}`);
  }
  return body;
}

export function registerUser({ name, email, password }) {
  return apiRequest('/register', {
    method: 'POST',
    body: JSON.stringify({ name, email, password }),
  });
}

export function loginUser({ email, password }) {
  return apiRequest('/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
}

export function recordVisit(path) {
  return apiRequest('/visit', {
    method: 'POST',
    body: JSON.stringify({ path }),
  });
}
