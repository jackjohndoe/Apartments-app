const API_URL = import.meta.env.VITE_API_URL || 'https://booking-backend-production-a51d.up.railway.app'

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

  if (res.status === 204) {
    return null
  }

  const text = await res.text()
  if (!text) {
    return null
  }

  try {
    return JSON.parse(text)
  } catch {
    return text
  }
}

export async function login(email, password) {
  const data = await apiFetch('/api/admin/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  })
  setToken(data.token)
  localStorage.setItem('admin_name', data.name || '')
  localStorage.setItem('admin_email', data.email || '')
  return { ...data, role: 'ADMIN' }
}

export function getAdminName() {
  return localStorage.getItem('admin_name') || 'Admin'
}

export function clearAdminInfo() {
  localStorage.removeItem('admin_name')
  localStorage.removeItem('admin_email')
}

export async function getMe() {
  return apiFetch('/api/auth/me')
}

export async function getStats() {
  return apiFetch('/api/admin/stats')
}

export async function getUsers(page = 0, size = 20, role = '', search = '') {
  const params = new URLSearchParams({ page, size })
  if (role) params.set('role', role)
  if (search) params.set('q', search)
  return apiFetch(`/api/admin/users?${params}`)
}

export async function updateUserRole(userId, role) {
  return apiFetch(`/api/admin/users/${userId}/role`, {
    method: 'PUT',
    body: JSON.stringify({ role }),
  })
}

export async function deleteUser(userId) {
  return apiFetch(`/api/admin/users/${userId}`, { method: 'DELETE' })
}

export async function getListings(page = 0, size = 20, search = '') {
  const params = new URLSearchParams({ page, size })
  if (search) params.set('q', search)
  return apiFetch(`/api/admin/listings?${params}`)
}

export async function createListing(listing) {
  return apiFetch('/api/admin/listings', {
    method: 'POST',
    body: JSON.stringify(listing),
  })
}

export async function deleteListing(listingId) {
  return apiFetch(`/api/admin/listings/${listingId}`, { method: 'DELETE' })
}

export async function getBookings(page = 0, size = 20, search = '') {
  const params = new URLSearchParams({ page, size })
  if (search) params.set('q', search)
  return apiFetch(`/api/admin/bookings?${params}`)
}

export async function cancelBooking(bookingId) {
  return apiFetch(`/api/admin/bookings/${bookingId}`, { method: 'DELETE' })
}

export async function completeBooking(bookingId) {
  return apiFetch(`/api/admin/bookings/${bookingId}/complete`, { method: 'POST' })
}

export async function getAdminTransactions(page = 0, size = 20) {
  return apiFetch(`/api/admin/transactions?page=${page}&size=${size}`)
}

export async function getAuditLogs(page = 0, size = 20) {
  return apiFetch(`/api/admin/audit-logs?page=${page}&size=${size}`)
}

export async function getAdmins(page = 0, size = 20) {
  return apiFetch(`/api/admin/admins?page=${page}&size=${size}`)
}

export async function createAdmin(admin) {
  return apiFetch('/api/admin/auth/register', {
    method: 'POST',
    body: JSON.stringify(admin),
  })
}

export async function inviteAdmin(email, name, department, inviteEmail) {
  return apiFetch('/api/admin/invite', {
    method: 'POST',
    body: JSON.stringify({ email, name, department, inviteEmail }),
  })
}

export async function updateAdminStatus(adminId, status) {
  return apiFetch(`/api/admin/admins/${adminId}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  })
}

export async function deleteAdmin(adminId) {
  return apiFetch(`/api/admin/admins/${adminId}`, { method: 'DELETE' })
}

export async function getPendingKyc(page = 0, size = 20) {
  return apiFetch(`/api/admin/compliance/kyc/pending?page=${page}&size=${size}`)
}

export async function getAllKyc(page = 0, size = 20) {
  return apiFetch(`/api/admin/compliance/kyc?page=${page}&size=${size}`)
}

export async function approveKyc(userId, level, bankCode, accountNumber) {
  const body = { level }
  if (bankCode) body.accountBank = bankCode
  if (accountNumber) body.accountNumber = accountNumber
  return apiFetch(`/api/admin/compliance/kyc/${userId}/approve`, {
    method: 'PUT',
    body: JSON.stringify(body),
  })
}

export async function rejectKyc(userId, reason) {
  return apiFetch(`/api/admin/compliance/kyc/${userId}/reject`, {
    method: 'PUT',
    body: JSON.stringify({ reason }),
  })
}

export async function getComplianceFlags(page = 0, size = 20, resolved) {
  const params = new URLSearchParams({ page, size })
  if (resolved !== undefined && resolved !== null) params.set('resolved', resolved)
  return apiFetch(`/api/admin/compliance/flags?${params}`)
}

export async function resolveFlag(flagId, note) {
  return apiFetch(`/api/admin/compliance/flags/${flagId}/resolve`, {
    method: 'PATCH',
    body: JSON.stringify({ note }),
  })
}

export async function setWalletStatus(userId, status, reason) {
  return apiFetch(`/api/admin/compliance/wallets/${userId}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status, reason }),
  })
}
