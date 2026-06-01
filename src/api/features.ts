import api from './client'
import type {
  Feature,
  PlanFeaturesResponse,
  MyFeaturesResponse,
  CreateFeatureRequest,
  UpdateFeatureRequest,
  AssignFeatureRequest,
} from '@/types/feature'

// ── Admin: Feature Registry ──────────────────────────────────────────────────

export async function getAdminFeatures(): Promise<Feature[]> {
  const res = await api.get('/admin/features')
  return res.data
}

export async function createAdminFeature(payload: CreateFeatureRequest): Promise<Feature> {
  const res = await api.post('/admin/features', payload)
  return res.data
}

export async function updateAdminFeature(id: string, payload: UpdateFeatureRequest): Promise<Feature> {
  const res = await api.put(`/admin/features/${id}`, payload)
  return res.data
}

export async function deleteAdminFeature(id: string): Promise<void> {
  await api.delete(`/admin/features/${id}`)
}

// ── Admin: Plan Feature Assignment ──────────────────────────────────────────

export async function getAdminPlanFeatures(plan: string): Promise<PlanFeaturesResponse> {
  const res = await api.get(`/admin/subscription-plans/${plan}/features`)
  return res.data
}

export async function assignFeatureToPlan(plan: string, payload: AssignFeatureRequest): Promise<void> {
  await api.post(`/admin/subscription-plans/${plan}/features`, payload)
}

export async function removeFeatureFromPlan(plan: string, featureId: string): Promise<void> {
  await api.delete(`/admin/subscription-plans/${plan}/features/${featureId}`)
}

// ── Guide: My Features ───────────────────────────────────────────────────────

export async function getMyFeatures(): Promise<MyFeaturesResponse> {
  const res = await api.get('/guides/me/features')
  return res.data
}
