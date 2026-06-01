import { UserRole } from './user'
import { TourCategory, TourStatus } from './tour'
import { ApplicationStatus } from './guide-application'

export interface HomeCategory {
  id: number
  name: string
  description: string
  categoryFilter: TourCategory
  isVisible: boolean
  sortOrder: number
  createdAt: string
  updatedAt: string
}

export interface AdminStats {
  totalUsers: number
  totalGuides: number
  totalCustomers: number
  totalTours: number
  activeTours: number
  totalBookings: number
  pendingBookings: number
  confirmedBookings: number
  completedBookings: number
  cancelledBookings: number
  totalRevenue: number
}

export interface AdminRevenueItem {
  date: string
  bookingCount: number
  revenue: number
}

export interface AdminRevenueResponse {
  totalRevenue: number
  totalBookings: number
  byDate: AdminRevenueItem[]
}

export interface AdminUser {
  id: string
  email: string
  fullName: string
  phone: string | null
  avatarUrl: string | null
  role: UserRole
  isVerified: boolean
  isBanned: boolean
  banReason: string | null
  createdAt: string
}

export interface AdminTour {
  id: string
  title: string
  locationCity: string
  category: TourCategory
  status: TourStatus
  pricePerPerson: number
  avgRating: number
  totalBookings: number
  isBoosted: boolean
  guideId: string
  guideName: string
  createdAt: string
}

export interface AdminWithdrawal {
  id: string
  guideId: string
  guideName: string
  guideEmail: string
  amount: number
  fee: number
  netAmount: number
  method: string
  accountInfo: string
  note: string | null
  status: string
  adminNote: string | null
  createdAt: string
  processedAt: string | null
}

export interface BanUserRequest {
  isBanned: boolean
  reason?: string
}

export interface AdminRejectWithdrawalRequest {
  adminNote?: string
}

export interface AdminBoostPlan {
  plan: string
  price: number
  durationDays: number
  description: string
  isActive: boolean
  isSystem: boolean
  updatedAt: string
}

export interface UpdateAdminBoostPlanRequest {
  price?: number
  days?: number
  description?: string
  isActive?: boolean
}

export interface CreateAdminBoostPlanRequest {
  plan: string
  price: number
  days: number
  description: string
}

export interface AdminSubscriptionPlan {
  plan: string
  price: number
  durationDays: number
  description: string
  isActive: boolean
  isSystem: boolean
  commissionRate: number
  maxActiveTours: number | null
  updatedAt: string
}

export interface UpdateAdminSubscriptionPlanRequest {
  price?: number
  days?: number
  description?: string
  isActive?: boolean
  commissionRate?: number
  maxActiveTours?: number | null
}

export interface CreateAdminSubscriptionPlanRequest {
  plan: string
  price: number
  days: number
  description: string
  commissionRate: number
  maxActiveTours: number | null
}

export type { ApplicationStatus }

// Analytics
export interface DailyCount { date: string; count: number }
export interface LabelCount { label: string; count: number }

export interface AdminSearchAnalytics {
  totalSearches: number
  dailyCounts: DailyCount[]
  topCategories: LabelCount[]
  topCities: LabelCount[]
  topKeywords: LabelCount[]
  priceRangeCounts: LabelCount[]
}

export interface AdminPageViewAnalytics {
  totalViews: number
  dailyCounts: DailyCount[]
  topPages: LabelCount[]
}
