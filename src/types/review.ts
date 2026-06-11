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
  images: string[]
  createdAt: string
  editedAt: string | null
  likeCount: number
  isLikedByMe: boolean
}

export interface CreateReviewRequest {
  bookingId: string
  rating: number
  comment?: string
  images?: string[]
}

export interface EditReviewRequest {
  comment?: string
  images?: string[]
}

export interface ReplyReviewRequest {
  reply: string
}

export interface ToggleReviewLikeResponse {
  isLiked: boolean
  likeCount: number
}
