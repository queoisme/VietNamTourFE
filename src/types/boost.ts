export type BoostPlan = 'basic' | 'standard' | 'premium'
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
  plan: BoostPlan
  price: number
  durationDays: number
  description: string
}

export interface CreateBoostRequest {
  tourId: string
  plan: BoostPlan
}

export type SubscriptionPlanEnum = 'premium' | 'pro'
export type SubscriptionStatus = 'active' | 'expired' | 'cancelled'

export interface Subscription {
  id: string
  plan: SubscriptionPlanEnum
  pricePaid: number
  startsAt: string
  expiresAt: string
  status: SubscriptionStatus
}

export interface SubscriptionPlanInfo {
  plan: SubscriptionPlanEnum
  price: number
  durationDays: number
  description: string
}

export interface CreateSubscriptionRequest {
  plan: SubscriptionPlanEnum
}
