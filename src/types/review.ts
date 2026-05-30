export interface Review {
  id: string
  bookingId: string
  tourId: string
  tourTitle: string
  customerId: string
  customerName: string
  customerAvatarUrl: string | null
  rating: number
  comment: string | null
  guideReply: string | null
  isVisible: boolean
  createdAt: string
}

export interface CreateReviewRequest {
  bookingId: string
  rating: number
  comment?: string
}

export interface ReplyReviewRequest {
  reply: string
}
