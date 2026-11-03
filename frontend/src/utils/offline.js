const OUTBOX_KEY = 'kd_offline_outbox_v1'

export function readOutbox() {
  try {
    const parsed = JSON.parse(localStorage.getItem(OUTBOX_KEY) || '[]')
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function writeOutbox(items) {
  localStorage.setItem(OUTBOX_KEY, JSON.stringify(items))
  window.dispatchEvent(new CustomEvent('kd:outbox', { detail: { count: items.length } }))
}

export function queueAction({ method = 'POST', path, body, label }) {
  const items = readOutbox()
  const item = {
    id: `offline_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    method,
    path,
    body,
    label: label || `${method} ${path}`,
    createdAt: new Date().toISOString()
  }
  items.push(item)
  writeOutbox(items)
  return item
}

export function removeQueued(id) {
  writeOutbox(readOutbox().filter((item) => item.id !== id))
}

export async function flushOutbox() {
  if (!navigator.onLine) return { synced: 0, failed: 0 }
  const token = localStorage.getItem('kd_token')
  const items = readOutbox()
  let synced = 0
  let failed = 0
  for (const item of items) {
    try {
      const res = await fetch(`/api${item.path}`, {
        method: item.method,
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: item.body === undefined ? undefined : JSON.stringify(item.body)
      })
      // 409 means a previous attempt already reached the server; treat as done.
      if (res.ok || res.status === 409) {
        removeQueued(item.id)
        synced += 1
      } else if (res.status >= 400 && res.status < 500) {
        removeQueued(item.id)
        failed += 1
      }
    } catch {
      // Still offline: keep the item for the next attempt.
      break
    }
  }
  return { synced, failed }
}

export function outboxCount() {
  return readOutbox().length
}

export function subscribeOutbox(callback) {
  const handler = (event) => callback(event.detail?.count ?? outboxCount())
  window.addEventListener('kd:outbox', handler)
  window.addEventListener('storage', handler)
  return () => {
    window.removeEventListener('kd:outbox', handler)
    window.removeEventListener('storage', handler)
  }
}
