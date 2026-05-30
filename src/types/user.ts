export type UserRole = 'customer' | 'guide' | 'admin'
export type VerificationStatus = 'pending' | 'approved' | 'rejected'
export type SubscriptionPlan = 'free' | 'premium' | 'pro'

export interface UserProfile {
  id: string
  email: string
  fullName: string
  phone: string | null
  avatarUrl: string | null
  role: UserRole
  isVerified: boolean
  isBanned: boolean
  createdAt: string
}

export interface GuideSummary {
  id: string
  fullName: string
  avatarUrl: string | null
}

export interface GuidePublicProfile {
  userId: string
  fullName: string
  avatarUrl: string | null
  bio: string | null
  experienceYears: number
  languages: string[]
  certifications: Certification[]
  avgRating: number
  totalReviews: number
  subscriptionPlan: SubscriptionPlan
}

export interface GuideProfile extends GuidePublicProfile {
  profileId: string
  verificationStatus: VerificationStatus
  rejectionReason: string | null
  balance: number
  totalEarned: number
  totalWithdrawn: number
  subscriptionExpiresAt: string | null
}

export interface Certification {
  name: string
  issuedBy: string
  year: number
}

export interface UpdateProfileRequest {
  fullName?: string
  phone?: string
}

export interface UpdateGuideProfileRequest {
  bio?: string
  experienceYears?: number
  languages?: string[]
  certifications?: Certification[]
}
