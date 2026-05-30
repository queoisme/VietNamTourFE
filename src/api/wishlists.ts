import api from './client'
import { WishlistItem } from '@/types/finance'
import { PaginatedMeta } from '@/types/api'

export interface WishlistResponse {
  items: WishlistItem[]
  meta: PaginatedMeta
}

export async function getWishlist(params: { page?: number; size?: number } = {}): Promise<WishlistResponse> {
  const res = await api.get('/wishlists', { params })
  return res.data
}

export async function addToWishlist(tourId: string): Promise<void> {
  await api.post('/wishlists', { tourId })
}

export async function removeFromWishlist(tourId: string): Promise<void> {
  await api.delete(`/wishlists/${tourId}`)
}
