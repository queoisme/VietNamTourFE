export type BoostPlan = string
export type BoostStatus = 'active' | 'expired' | 'cancelled'

export interface Boost {
  id: string
  tourId: string
  tourTitle: string
  plan: BoostPlan
  pricePaid: number
  durationDays: number
  startsAt: string
  expiresAt: string
  status: BoostStatus
}

export interface BoostPlanInfo {
  plan: string
  price: number
  durationDays: number
  description: string
}

export interface CreateBoostRequest {
  tourId: string
  plan: string
}

export type SubscriptionPlanEnum = string
export type SubscriptionStatus = 'active' | 'expired' | 'cancelled'

export interface Subscription {
  id: string
  plan: string
  pricePaid: number
  startsAt: string
  expiresAt: string
  status: SubscriptionStatus
}

export interface SubscriptionPlanInfo {
  plan: string
  price: number
  durationDays: number
  description: string
  commissionRate: number
  maxActiveTours: number | null
}

export interface CreateSubscriptionRequest {
  plan: string
}
