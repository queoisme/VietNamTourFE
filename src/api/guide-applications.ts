import api from './client'
import { GuideApplication, CreateGuideApplicationRequest, RejectApplicationRequest } from '@/types/guide-application'
import { PaginatedMeta } from '@/types/api'

export interface ApplicationListResponse {
  items: GuideApplication[]
  meta: PaginatedMeta
}

export async function submitGuideApplication(data: CreateGuideApplicationRequest): Promise<GuideApplication> {
  const res = await api.post('/guide-applications', data)
  return res.data
}

export async function getMyApplication(): Promise<GuideApplication | null> {
  const res = await api.get('/guide-applications/my')
  return res.data
}

export async function getAdminApplications(params: {
  page?: number
  size?: number
  status?: string
} = {}): Promise<ApplicationListResponse> {
  const res = await api.get('/admin/guide-applications', { params })
  return res.data
}

export async function getAdminApplication(id: string): Promise<GuideApplication> {
  const res = await api.get(`/admin/guide-applications/${id}`)
  return res.data
}

export async function approveApplication(id: string): Promise<void> {
  await api.post(`/admin/guide-applications/${id}/approve`)
}

export async function rejectApplication(id: string, data: RejectApplicationRequest): Promise<void> {
  await api.post(`/admin/guide-applications/${id}/reject`, data)
}
