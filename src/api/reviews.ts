import api from './client'
import { Review, CreateReviewRequest, EditReviewRequest, ReplyReviewRequest, ToggleReviewLikeResponse } from '@/types/review'
import { PaginatedMeta } from '@/types/api'

export interface ReviewListResponse {
  items: Review[]
  meta: PaginatedMeta
}

export async function getTourReviews(
  tourId: string,
  params: { page?: number; size?: number } = {},
): Promise<ReviewListResponse> {
  const res = await api.get(`/tours/${tourId}/reviews`, { params })
  return res.data
}

export async function getMyReviews(params: { page?: number; size?: number } = {}): Promise<ReviewListResponse> {
  const res = await api.get('/customers/me/reviews', { params })
  return res.data
}

export async function createReview(data: CreateReviewRequest): Promise<Review> {
  const res = await api.post('/reviews', data)
  return res.data
}

export async function getGuideReviews(params: { page?: number; size?: number } = {}): Promise<ReviewListResponse> {
  const res = await api.get('/guides/me/reviews', { params })
  return res.data
}

export async function replyReview(id: string, data: ReplyReviewRequest): Promise<Review> {
  const res = await api.put(`/reviews/${id}/reply`, data)
  return res.data
}

export async function editReview(id: string, data: EditReviewRequest): Promise<Review> {
  const res = await api.put(`/reviews/${id}`, data)
  return res.data
}

export async function toggleReviewLike(id: string): Promise<ToggleReviewLikeResponse> {
  const res = await api.post(`/reviews/${id}/like`)
  return res.data
}

export async function toggleReviewVisibility(id: string, isVisible: boolean): Promise<void> {
  await api.put(`/admin/reviews/${id}/visibility`, { isVisible })
}
