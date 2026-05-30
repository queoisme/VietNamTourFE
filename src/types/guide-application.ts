import { Certification } from './user'

export type ApplicationStatus = 'pending' | 'approved' | 'rejected'

export interface GuideApplication {
  id: string
  userId: string
  fullName: string
  phone: string
  location: string | null
  bio: string
  experienceYears: number
  languages: string[]
  certifications: Certification[]
  identityDocUrl: string
  certificateUrls: string[]
  status: ApplicationStatus
  rejectionReason: string | null
  reviewedBy: string | null
  reviewedAt: string | null
  createdAt: string
  applicantEmail?: string
  applicantAvatarUrl?: string | null
}

export interface CreateGuideApplicationRequest {
  fullName: string
  phone: string
  location?: string
  bio: string
  experienceYears?: number
  languages: string[]
  certifications?: Certification[]
  identityDocUrl: string
  certificateUrls?: string[]
}

export interface RejectApplicationRequest {
  rejectionReason: string
}
