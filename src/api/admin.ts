import api from './client'
import {
  AdminStats,
  AdminRevenueResponse,
  AdminUser,
  AdminTour,
  AdminWithdrawal,
  BanUserRequest,
  AdminRejectWithdrawalRequest,
  AdminSubscriptionPlan,
  UpdateAdminSubscriptionPlanRequest,
  CreateAdminSubscriptionPlanRequest,
  AdminBoostPlan,
  UpdateAdminBoostPlanRequest,
  CreateAdminBoostPlanRequest,
  HomeCategory,
  AdminSearchAnalytics,
  AdminPageViewAnalytics,
} from '@/types/admin'
import { PaginatedMeta } from '@/types/api'

export interface AdminUserListResponse {
  items: AdminUser[]
  meta: PaginatedMeta
}

export interface AdminTourListResponse {
  items: AdminTour[]
  meta: PaginatedMeta
}

export interface AdminWithdrawalListResponse {
  items: AdminWithdrawal[]
  meta: PaginatedMeta
}

export async function getAdminStats(): Promise<AdminStats> {
  const res = await api.get('/admin/stats')
  return res.data
}

export async function getAdminRevenue(params: {
  from?: string
  to?: string
} = {}): Promise<AdminRevenueResponse> {
  const res = await api.get('/admin/stats/revenue', { params })
  return res.data
}

export async function getAdminUsers(params: {
  page?: number
  size?: number
  role?: string
  q?: string
} = {}): Promise<AdminUserListResponse> {
  const res = await api.get('/admin/users', { params })
  return res.data
}

export async function getAdminUser(id: string): Promise<AdminUser> {
  const res = await api.get(`/admin/users/${id}`)
  return res.data
}

export async function banUser(id: string, data: BanUserRequest): Promise<void> {
  await api.put(`/admin/users/${id}/ban`, data)
}

export async function getAdminTours(params: {
  page?: number
  size?: number
  status?: string
} = {}): Promise<AdminTourListResponse> {
  const res = await api.get('/admin/tours', { params })
  return res.data
}

export async function updateAdminTourStatus(id: string, status: string): Promise<void> {
  await api.put(`/admin/tours/${id}/status`, { status })
}

export async function getAdminWithdrawals(params: {
  page?: number
  size?: number
  status?: string
} = {}): Promise<AdminWithdrawalListResponse> {
  const res = await api.get('/admin/withdrawals', { params })
  return res.data
}

export async function approveWithdrawal(id: string): Promise<void> {
  await api.post(`/admin/withdrawals/${id}/approve`)
}

export async function rejectWithdrawal(id: string, data: AdminRejectWithdrawalRequest): Promise<void> {
  await api.post(`/admin/withdrawals/${id}/reject`, data)
}

export async function completeWithdrawal(id: string, data: { adminNote?: string } = {}): Promise<AdminWithdrawal> {
  const res = await api.post(`/admin/withdrawals/${id}/complete`, data)
  return res.data
}

export async function exportReport(params: {
  from?: string
  to?: string
  status?: string
} = {}): Promise<Blob> {
  const res = await api.get('/admin/reports/export', {
    params,
    responseType: 'blob',
  })
  return res.data
}

// ── Boost Plans (admin) ──────────────────────────────────────────────────────

export async function getAdminBoostPlans(): Promise<AdminBoostPlan[]> {
  // Dùng endpoint admin để lấy tất cả plans kể cả inactive
  const res = await api.get('/admin/boost-plans')
  return res.data
}

export async function createAdminBoostPlan(payload: CreateAdminBoostPlanRequest): Promise<AdminBoostPlan> {
  const res = await api.post('/admin/boost-plans', payload)
  return res.data
}

export async function updateAdminBoostPlan(
  plan: string,
  payload: UpdateAdminBoostPlanRequest,
): Promise<AdminBoostPlan> {
  const res = await api.put(`/admin/boost-plans/${plan}`, payload)
  return res.data
}

export async function deleteAdminBoostPlan(plan: string): Promise<void> {
  await api.delete(`/admin/boost-plans/${plan}`)
}

// ── Subscription Plans (admin) ───────────────────────────────────────────────

export async function getAdminSubscriptionPlans(): Promise<AdminSubscriptionPlan[]> {
  const res = await api.get('/admin/subscription-plans')
  return res.data
}

export async function createAdminSubscriptionPlan(payload: CreateAdminSubscriptionPlanRequest): Promise<AdminSubscriptionPlan> {
  const res = await api.post('/admin/subscription-plans', payload)
  return res.data
}

export async function updateAdminSubscriptionPlan(
  plan: string,
  payload: UpdateAdminSubscriptionPlanRequest,
): Promise<AdminSubscriptionPlan> {
  const res = await api.put(`/admin/subscription-plans/${plan}`, payload)
  return res.data
}

export async function deleteAdminSubscriptionPlan(plan: string): Promise<void> {
  await api.delete(`/admin/subscription-plans/${plan}`)
}

export interface HomeCategoryPayload {
  name?: string
  description?: string
  categoryFilter?: string
  isVisible?: boolean
  sortOrder?: number
}

export async function getAdminHomeCategories(): Promise<HomeCategory[]> {
  const res = await api.get('/admin/home-categories')
  return res.data
}

export async function createAdminHomeCategory(payload: HomeCategoryPayload): Promise<HomeCategory> {
  const res = await api.post('/admin/home-categories', payload)
  return res.data
}

export async function updateAdminHomeCategory(
  id: number,
  payload: HomeCategoryPayload,
): Promise<HomeCategory> {
  const res = await api.put(`/admin/home-categories/${id}`, payload)
  return res.data
}

export async function deleteAdminHomeCategory(id: number): Promise<void> {
  await api.delete(`/admin/home-categories/${id}`)
}

export async function getAdminSearchAnalytics(params: {
  from?: string
  to?: string
} = {}): Promise<AdminSearchAnalytics> {
  const res = await api.get('/admin/insights/searches', { params })
  return res.data
}

export async function getAdminPageViewAnalytics(params: {
  from?: string
  to?: string
} = {}): Promise<AdminPageViewAnalytics> {
  const res = await api.get('/admin/insights/page-views', { params })
  return res.data
}
