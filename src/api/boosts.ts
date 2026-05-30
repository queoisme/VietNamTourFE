import api from './client'
import {
  Boost,
  BoostPlanInfo,
  CreateBoostRequest,
  Subscription,
  SubscriptionPlanInfo,
  CreateSubscriptionRequest,
} from '@/types/boost'
import { PaginatedMeta } from '@/types/api'

export interface BoostListResponse {
  items: Boost[]
  meta: PaginatedMeta
}

export async function getBoostPlans(): Promise<BoostPlanInfo[]> {
  const res = await api.get('/boosts/plans')
  return res.data
}

export async function createBoost(data: CreateBoostRequest): Promise<{ payUrl: string; qrCodeUrl: string }> {
  const res = await api.post('/boosts', data)
  return res.data
}

export async function getMyBoosts(params: { page?: number; size?: number } = {}): Promise<BoostListResponse> {
  const res = await api.get('/guides/me/boosts', { params })
  return res.data
}

export async function getSubscriptionPlans(): Promise<SubscriptionPlanInfo[]> {
  const res = await api.get('/subscriptions/plans')
  return res.data
}

export async function createSubscription(data: CreateSubscriptionRequest): Promise<{ payUrl: string; qrCodeUrl: string }> {
  const res = await api.post('/subscriptions', data)
  return res.data
}

export async function getMySubscription(): Promise<Subscription | null> {
  const res = await api.get('/guides/me/subscription')
  return res.data
}
