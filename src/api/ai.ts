import api from './client'
import type {
  AiSearchResponse, AiConfig, AiConfigCreateRequest, AiConfigUpdateRequest,
  AiConfigTestResponse, AiReindexStatus, AiSearchLog,
} from '@/types/ai'

// ─── Public AI search ────────────────────────────────────────────────────────

export async function aiSearch(data: { prompt: string }): Promise<AiSearchResponse> {
  const res = await api.post('/ai-search', data)
  return res.data
}

// ─── Admin: AI provider configs ──────────────────────────────────────────────

export async function getAiConfigs(): Promise<AiConfig[]> {
  const res = await api.get('/admin/ai-configs')
  return res.data
}

export async function createAiConfig(data: AiConfigCreateRequest): Promise<AiConfig> {
  const res = await api.post('/admin/ai-configs', data)
  return res.data
}

export async function updateAiConfig(id: string, data: AiConfigUpdateRequest): Promise<AiConfig> {
  const res = await api.put(`/admin/ai-configs/${id}`, data)
  return res.data
}

export async function activateAiConfig(id: string): Promise<void> {
  await api.post(`/admin/ai-configs/${id}/activate`)
}

export async function deleteAiConfig(id: string): Promise<void> {
  await api.delete(`/admin/ai-configs/${id}`)
}

export async function testAiConfig(id: string): Promise<AiConfigTestResponse> {
  const res = await api.post(`/admin/ai-configs/${id}/test`)
  return res.data
}

// ─── Admin: reindex + logs ───────────────────────────────────────────────────

export async function triggerReindex(): Promise<void> {
  await api.post('/admin/ai-reindex')
}

export async function getReindexStatus(): Promise<AiReindexStatus> {
  const res = await api.get('/admin/ai-reindex/status')
  return res.data
}

export async function getAiSearchLogs(limit = 50): Promise<AiSearchLog[]> {
  const res = await api.get('/admin/ai-search-logs', { params: { limit } })
  return res.data
}
