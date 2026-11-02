const API_BASE = '/api'

function headers() {
  const t = localStorage.getItem('kd_token')
  const h = { 'Content-Type': 'application/json' }
  if (t) h['Authorization'] = `Bearer ${t}`
  return h
}

function authHeaders() {
  const t = localStorage.getItem('kd_token')
  return t ? { 'Authorization': `Bearer ${t}` } : {}
}

async function handleRes(res) {
  let data
  try {
    data = await res.json()
  } catch (err) {
    if (!res.ok) throw new Error(`HTTP Error ${res.status}`)
    return {}
  }
  if (!res.ok) throw new Error(data.detail || data.message || 'API Error')
  return data
}

export const api = {
  async get(ep) {
    return handleRes(await fetch(`${API_BASE}${ep}`, { headers: headers() }))
  },
  async post(ep, body) {
    return handleRes(await fetch(`${API_BASE}${ep}`, {
      method: 'POST',
      headers: headers(),
      body: JSON.stringify(body)
    }))
  },
  async put(ep, body) {
    return handleRes(await fetch(`${API_BASE}${ep}`, {
      method: 'PUT',
      headers: headers(),
      body: JSON.stringify(body)
    }))
  },
  async delete(ep) {
    return handleRes(await fetch(`${API_BASE}${ep}`, {
      method: 'DELETE',
      headers: headers()
    }))
  },
  async upload(ep, file, extra = {}) {
    const fd = new FormData()
    if (file) fd.append('file', file)
    Object.entries(extra).forEach(([k, v]) => fd.append(k, v))
    return handleRes(await fetch(`${API_BASE}${ep}`, {
      method: 'POST',
      headers: authHeaders(),
      body: fd
    }))
  },

  auth: {
    login: (d) => api.post('/auth/login', d),
    register: (d) => api.post('/auth/register', d),
    me: () => api.get('/auth/me'),
    updateProfile: (d) => api.put('/auth/profile', d),
  },
  crops: {
    list: () => api.get('/crops'),
    create: (d) => api.post('/crops', d),
    update: (id, d) => api.put(`/crops/${id}`, d),
    delete: (id) => api.delete(`/crops/${id}`),
  },
  transport: {
    requests: () => api.get('/transport/requests'),
    create: (d) => api.post('/transport/request', d),
    match: (d) => api.post('/transport/match', d),
    accept: (d) => api.post('/transport/accept', d),
    reject: (d) => api.post('/transport/reject', d),
    delete: (id) => api.delete(`/transport/requests/${id}`),
  },
  vehicles: {
    list: () => api.get('/vehicles'),
  },
  drivers: {
    list: () => api.get('/drivers'),
  },
  trips: {
    list: () => api.get('/trips'),
    update: (id, d) => api.put(`/trips/${id}`, d),
  },
  ai: {
    cropRecommendation: (d) => api.post('/ai/crop-recommendation', d),
    harvestPrediction: (d) => api.post('/ai/harvest-prediction', d),
    cropDiseaseDetection: (file, cropType) => api.upload('/ai/crop-disease-detection', file, { crop_type: cropType || 'Tomato' }),
    routeOptimization: (d) => api.post('/ai/route-optimization', d),
    transportMatching: (d) => api.post('/ai/transport-matching', d),
    cropAssistant: (d) => api.post('/ai/crop-assistant', d),
    driverAssistant: (d) => api.post('/ai/driver-assistant', d),
    documentAnalysis: (d) => api.post('/ai/document-analysis', d),
  },
  weather: {
    get: (loc) => api.get(`/weather?location=${encodeURIComponent(loc || 'Nashik')}`),
  },
  notifications: {
    list: () => api.get('/notifications'),
  },
  admin: {
    stats: () => api.get('/admin/stats'),
    users: () => api.get('/admin/users'),
    verifyDriver: (username, verified) => api.post(`/admin/drivers/${username}/verify`, { verified }),
  },
}