const BASE = '/api'

async function req(method, path, body) {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: body ? { 'Content-Type': 'application/json' } : {},
    body: body ? JSON.stringify(body) : undefined,
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.detail || `HTTP ${res.status}`)
  }
  if (res.status === 204) return null
  return res.json()
}

export const api = {
  createSchedule: (data) => req('POST', '/schedule', data),
  getView:        (viewId) => req('GET', `/schedule/view/${viewId}`),
  getEdit:        (editId) => req('GET', `/schedule/edit/${editId}`),
  updateSchedule: (editId, data) => req('PUT', `/schedule/edit/${editId}`, data),
  addBlock:       (editId, data) => req('POST', `/schedule/${editId}/blocks`, data),
  deleteBlock:    (editId, blockId) => req('DELETE', `/schedule/${editId}/blocks/${blockId}`),
}
