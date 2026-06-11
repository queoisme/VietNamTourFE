import type { TourListItem } from './tour'

export interface AiSearchItem {
  tour: TourListItem
  score: number
  reason: string | null
}

export interface AiSearchResponse {
  items: AiSearchItem[]
  usedFallback: boolean
}

export interface AiConfig {
  id: string
  purpose: 'chat' | 'embedding'
  provider: string
  baseUrl: string | null
  model: string
  apiKeyMasked: string
  isActive: boolean
  extraParams: Record<string, unknown>
  updatedAt: string
  updatedByName: string | null
}

export interface AiConfigCreateRequest {
  purpose: 'chat' | 'embedding'
  provider: string
  baseUrl?: string
  apiKey: string
  model: string
  isActive?: boolean
  extraParams?: Record<string, unknown>
}

export interface AiConfigUpdateRequest {
  provider?: string
  baseUrl?: string
  apiKey?: string
  model?: string
  extraParams?: Record<string, unknown>
}

export interface AiConfigTestResponse {
  ok: boolean
  message: string
  latencyMs: number
}

export interface AiReindexStatus {
  totalTours: number
  embedded: number
  lastUpdatedAt: string | null
}

export interface AiSearchLog {
  id: string
  prompt: string
  latencyMs: number | null
  usedFallback: boolean
  error: string | null
  resultCount: number
  createdAt: string
}
