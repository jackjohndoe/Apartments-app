const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8081'

function getToken() {
  return localStorage.getItem('admin_token')
}

export function setToken(token) {
  localStorage.setItem('admin_token', token)
}

export function clearToken() {
  localStorage.removeItem('admin_token')
}

export function isAuthenticated() {
  return !!getToken()
}

export async function apiFetch(path, options = {}) {
  const token = getToken()
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  }

  const res = await fetch(`${API_URL}${path}`, { ...options, headers })

  if (res.status === 401) {
    throw new Error('Unauthorized')
  }

  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error(body.message || `Request failed with status ${res.status}`)
  }

  return res.json()
}

export async function login(email, password) {
  const data = await apiFetch('/api/admin/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  })
  setToken(data.token)
  return { ...data, role: 'ADMIN' }
}

export async function getMe() {
  return apiFetch('/api/auth/me')
}

export async function getStats() {
  return apiFetch('/api/admin/stats')
}

export async function getUsers(page = 0, size = 20, role = '') {
  const params = new URLSearchParams({ page, size })
  if (role) params.set('role', role)
  return apiFetch(`/api/admin/users?${params}`)
}

export async function updateUserRole(userId, role) {
  return apiFetch(`/api/admin/users/${userId}/role`, {
    method: 'PUT',
    body: JSON.stringify({ role }),
  })
}

export async function getListings(page = 0, size = 20) {
  return apiFetch(`/api/admin/listings?page=${page}&size=${size}`)
}

export async function getBookings(page = 0, size = 20) {
  return apiFetch(`/api/admin/bookings?page=${page}&size=${size}`)
}

export async function getAuditLogs(page = 0, size = 20) {
  return apiFetch(`/api/admin/audit-logs?page=${page}&size=${size}`)
}
