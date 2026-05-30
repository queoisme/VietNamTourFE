import { GuideSummary } from './user'

export type TourCategory = 'nature' | 'culture' | 'food' | 'resort' | 'adventure' | 'other'
export type TourStatus = 'draft' | 'active' | 'inactive'
export type TourType = 'private' | 'group'

export interface ItineraryItem {
  time: string
  activity: string
  description: string
}

export interface TourListItem {
  id: string
  title: string
  slug: string
  coverImageUrl: string | null
  images: string[]
  locationCity: string
  category: TourCategory
  tourType: TourType
  pricePerPerson: number
  durationHours: number
  maxGroupSize: number
  avgRating: number
  totalReviews: number
  totalBookings: number
  isBoosted: boolean
  boostExpiresAt: string | null
  status: TourStatus
  guide: GuideSummary
  createdAt: string
}

export interface TourDetail {
  id: string
  title: string
  slug: string
  description: string
  category: TourCategory
  tourType: TourType
  locationCity: string
  locationAddress: string | null
  lat: number | null
  lng: number | null
  pricePerPerson: number
  durationHours: number
  maxGroupSize: number
  highlights: string[]
  included: string[]
  excluded: string[]
  itinerary: ItineraryItem[]
  images: string[]
  coverImageUrl: string | null
  status: TourStatus
  avgRating: number
  totalReviews: number
  totalBookings: number
  isBoosted: boolean
  boostExpiresAt: string | null
  guide: GuideSummary
  createdAt: string
  updatedAt: string
}

export interface TourAvailability {
  id: string
  tourId: string
  availableDate: string
  maxSlots: number
  bookedSlots: number
  availableSlots: number
  isBlocked: boolean
}

export interface TourSearchParams {
  q?: string
  city?: string
  category?: TourCategory
  tourType?: TourType
  minPrice?: number
  maxPrice?: number
  minRating?: number
  minDuration?: number
  maxDuration?: number
  sort?: 'newest' | 'price_asc' | 'price_desc' | 'rating_desc'
  page?: number
  size?: number
}

export interface CreateTourRequest {
  title: string
  description: string
  category: TourCategory
  tourType?: TourType
  locationCity: string
  locationAddress?: string
  lat?: number
  lng?: number
  pricePerPerson: number
  durationHours: number
  maxGroupSize?: number
  highlights?: string[]
  included?: string[]
  excluded?: string[]
  itinerary?: ItineraryItem[]
}

export interface UpdateTourRequest {
  title?: string
  description?: string
  category?: TourCategory
  tourType?: TourType
  locationCity?: string
  locationAddress?: string
  lat?: number
  lng?: number
  pricePerPerson?: number
  durationHours?: number
  maxGroupSize?: number
  highlights?: string[]
  included?: string[]
  excluded?: string[]
  itinerary?: ItineraryItem[]
}

export interface CreateAvailabilityRequest {
  availableDate: string
  maxSlots: number
  isBlocked?: boolean
}

export interface UpdateAvailabilityRequest {
  maxSlots?: number
  isBlocked?: boolean
}
