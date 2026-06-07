export type BookingStatus = 'pending' | 'confirmed' | 'completed' | 'cancelled' | 'rejected'
export type PaymentStatus = 'unpaid' | 'paid' | 'refunded' | 'refund_failed'
export type CancellationBy = 'customer' | 'guide' | 'admin' | 'system'

export interface BookingListItem {
  id: string
  tourId: string
  tourTitle: string
  tourCoverImageUrl: string | null
  tourImages: string[]
  tourDate: string
  numPeople: number
  totalPrice: number
  status: BookingStatus
  paymentStatus: PaymentStatus
  createdAt: string
  hasReview: boolean
}

export interface ActiveBooking {
  id: string
  tourId: string
  tourTitle: string
  tourCoverImageUrl: string | null
  tourImages: string[]
  locationCity: string
  durationHours: number
  durationDays: number
  tourDate: string
  endDate: string
  numPeople: number
  totalPrice: number
  viewer: 'customer' | 'guide'
  counterpartId: string
  counterpartName: string
  counterpartAvatarUrl: string | null
  counterpartPhone: string | null
  conversationId: string | null
  hasActiveTracking: boolean
}

export interface BookingDetail {
  id: string
  tourId: string
  tourTitle: string
  tourCoverImageUrl: string | null
  tourImages: string[]
  customerId: string
  customerName: string
  guideId: string
  guideName: string
  tourDate: string
  numPeople: number
  totalPrice: number
  contactName: string
  contactPhone: string
  contactEmail: string | null
  note: string | null
  status: BookingStatus
  rejectionReason: string | null
  cancellationBy: CancellationBy | null
  cancellationReason: string | null
  refundAmount: number
  refundPolicy: string | null
  paymentStatus: PaymentStatus
  paymentMethod: string | null
  paymentTxnId: string | null
  paymentPaidAt: string | null
  confirmedAt: string | null
  completedAt: string | null
  createdAt: string
  updatedAt: string
  conversationId: string | null
  tourItinerary: string   // raw JSON string → parse thành ItineraryItem[]
}

export interface CreateBookingRequest {
  tourId: string
  tourDate: string
  numPeople: number
  numDays?: number
  contactName: string
  contactPhone: string
  contactEmail?: string
  note?: string
}

export interface RejectBookingRequest {
  reason: string
}

export interface CancelBookingRequest {
  reason?: string
}

export interface GuideCancelBookingRequest {
  reason?: string
}

export interface MomoPaymentResponse {
  payUrl: string
  qrCodeUrl: string
}

export interface VNPayPaymentResponse {
  payUrl: string
}
