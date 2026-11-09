import { flushOutbox, queueAction } from '../utils/offline'

const API_BASE = '/api'
const QUEUEABLE = new Set([
  ['POST', '/crops'],
  ['POST', '/transport/request']
])

export class ApiError extends Error {
  constructor(message, status, data) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.data = data
  }
}

export class OfflineQueuedError extends Error {
  constructor(item) {
    super('Saved offline')
    this.name = 'OfflineQueuedError'
    this.item = item
  }
}

function token() {
  return localStorage.getItem('kd_token')
}

function jsonHeaders() {
  const headers = { 'Content-Type': 'application/json' }
  const current = token()
  if (current) headers.Authorization = `Bearer ${current}`
  return headers
}

function query(params = {}) {
  const search = new URLSearchParams()
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && String(value).trim() !== '') search.set(key, value)
  })
  const serialized = search.toString()
  return serialized ? `?${serialized}` : ''
}

function errorMessage(status, data) {
  if (status === 401) return 'Session expired. Please sign in again.'
  if (status === 403) return data?.detail || 'You do not have permission for this action.'
  if (status === 404) return data?.detail || 'Not found.'
  if (status === 429) return 'Too many requests. Please wait a moment.'
  if (status >= 500) return data?.detail || 'The server hit an error. Please retry.'
  return data?.detail || data?.message || `Request failed (${status})`
}

async function request(path, { method = 'GET', body, form, timeout = 30000, queue = false } = {}) {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeout)
  const headers = form ? (token() ? { Authorization: `Bearer ${token()}` } : {}) : (body === undefined ? (token() ? { Authorization: `Bearer ${token()}` } : {}) : jsonHeaders())

  try {
    const res = await fetch(`${API_BASE}${path}`, {
      method,
      headers,
      body: form || (body === undefined ? undefined : JSON.stringify(body)),
      signal: controller.signal
    })
    const text = await res.text()
    let data = null
    if (text) {
      try { data = JSON.parse(text) } catch { data = text }
    }
    if (!res.ok) throw new ApiError(errorMessage(res.status, data), res.status, data)
    return data ?? {}
  } catch (error) {
    const offline = !navigator.onLine || error.name === 'AbortError' || error instanceof TypeError
    if (offline && queue && method === 'POST' && [...QUEUEABLE].some(([m, p]) => m === method && p === path)) {
      const item = queueAction({ method, path, body, label: path })
      throw new OfflineQueuedError(item)
    }
    if (offline) {
      const wrapped = new ApiError('Cannot reach the server. Check your connection and retry.', 0, null)
      wrapped.cause = error
      throw wrapped
    }
    throw error
  } finally {
    clearTimeout(timer)
  }
}

export const api = {
  request,
  get: (path) => request(path),
  post: (path, body, options = {}) => request(path, { method: 'POST', body, ...options }),
  put: (path, body, options = {}) => request(path, { method: 'PUT', body, ...options }),
  delete: (path, options = {}) => request(path, { method: 'DELETE', ...options }),
  async upload(path, file, extra = {}) {
    const fd = new FormData()
    if (file) fd.append('file', file)
    Object.entries(extra).forEach(([key, value]) => fd.append(key, value))
    return request(path, { method: 'POST', form: fd, timeout: 60000 })
  },

  auth: {
    login: (d) => api.post('/auth/login', d, { timeout: 15000 }),
    register: (d) => api.post('/auth/register', d, { timeout: 15000 }),
    me: () => api.get('/auth/me'),
    updateProfile: (d) => api.put('/auth/profile', d)
  },
  health: {
    status: () => api.get('/health/detailed'),
    model: () => api.get('/ai/disease-model')
  },
  crops: {
    list: () => api.get('/crops'),
    get: (id) => api.get(`/crops/${id}`),
    create: (d) => api.post('/crops', d, { queue: true }),
    update: (id, d) => api.put(`/crops/${id}`, d),
    delete: (id) => api.delete(`/crops/${id}`)
  },
  farms: {
    list: () => api.get('/farms'),
    get: (id) => api.get(`/farms/${id}`),
    create: (d) => api.post('/farms', d),
    update: (id, d) => api.put(`/farms/${id}`, d),
    delete: (id) => api.delete(`/farms/${id}`)
  },
  satellite: {
    analyze: (d) => api.post('/satellite/analyze', d),
    history: (farmId) => api.get(`/satellite/history/${farmId}`)
  },
  transport: {
    requests: () => api.get('/transport/requests'),
    create: (d) => api.post('/transport/request', d, { queue: true }),
    accept: (d) => api.post('/transport/accept', d),
    reject: (d) => api.post('/transport/reject', d),
    delete: (id) => api.delete(`/transport/requests/${id}`)
  },
  vehicles: {
    list: () => api.get('/vehicles')
  },
  drivers: {
    list: () => api.get('/drivers')
  },
  trips: {
    list: () => api.get('/trips'),
    update: (id, d) => api.put(`/trips/${id}`, d)
  },
  ai: {
    cropRecommendation: (d) => api.post('/ai/crop-recommendation', d),
    harvestPrediction: (d) => api.post('/ai/harvest-prediction', d),
    cropDiseaseDetection: (file, cropType) => api.upload('/ai/crop-disease-detection', file, { crop_type: cropType || 'Tomato' }),
    routeOptimization: (d) => api.post('/ai/route-optimization', d),
    transportMatching: (d) => api.post('/ai/transport-matching', d),
    cropAssistant: (d) => api.post('/ai/crop-assistant', d),
    driverAssistant: (d) => api.post('/ai/driver-assistant', d),
    documentAnalysis: (file, extra = {}) => api.upload('/ai/document-analysis', file, extra),
    modelInfo: () => api.get('/ai/disease-model')
  },
  weather: {
    get: (loc) => api.get(`/weather?location=${encodeURIComponent(loc || 'Nashik')}`)
  },
  market: {
    status: () => api.get('/market/status'),
    whereToSell: (d) => api.post('/mandi/where-to-sell', d),
    prices: (params = {}) => {
      const query = new URLSearchParams()
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && String(value).trim() !== '') query.set(key, value)
      })
      return api.get(`/market/prices${query.toString() ? `?${query}` : ''}`)
    }
  },
  notifications: {
    list: () => api.get('/notifications')
  },
  support: {
    list: () => api.get('/support/tickets'),
    get: (id) => api.get(`/support/tickets/${id}`),
    create: (d) => api.post('/support/tickets', d),
    reply: (id, body) => api.post(`/support/tickets/${id}/messages`, { body }),
    setStatus: (id, status) => api.put(`/support/tickets/${id}/status`, { status }),
    escalate: (id, escalated = true) => api.post(`/support/tickets/${id}/escalate`, { escalated })
  },
  admin: {
    stats: () => api.get('/admin/stats'),
    users: () => api.get('/admin/users'),
    verifyDriver: (username, verified) => api.post(`/admin/drivers/${username}/verify`, { verified }),
    auditLogs: (params = {}) => api.get(`/admin/audit-logs${query(params)}`),
    auditFilters: () => api.get('/admin/audit-logs/filters')
  }
}

export { flushOutbox }
