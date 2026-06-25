export type PostType = 'location_review' | 'travel_story'

export type PostCategory = 'nature' | 'culture' | 'food' | 'resort' | 'adventure' | 'other'

export type UserRole = 'customer' | 'guide' | 'admin'

export type PostFeedSort = 'newest' | 'top_rated' | 'most_liked' | 'most_commented'

export interface Post {
  id: string
  authorId: string
  authorName: string
  authorAvatarUrl: string | null
  authorRole: UserRole
  type: PostType
  title: string
  content: string
  rating: number | null
  category: PostCategory | null
  locationCity: string | null
  locationCountry: string | null
  lat: number | null
  lng: number | null
  images: string[]
  coverImageUrl: string | null
  likeCount: number
  commentCount: number
  viewCount: number
  isVisible: boolean
  hiddenReason: string | null
  createdAt: string
  updatedAt: string
  isLikedByMe: boolean
  isOwnedByMe: boolean
}

export interface PostComment {
  id: string
  postId: string
  authorId: string
  authorName: string
  authorAvatarUrl: string | null
  authorRole: UserRole
  content: string
  likeCount: number
  isVisible: boolean
  createdAt: string
  updatedAt: string
  isLikedByMe: boolean
  isOwnedByMe: boolean
}

export interface CreatePostRequest {
  type: PostType
  title: string
  content: string
  rating?: number | null
  category?: PostCategory | null
  locationCity?: string | null
  locationCountry?: string | null
  lat?: number | null
  lng?: number | null
  images?: string[]
  coverImageUrl?: string | null
}

export type EditPostRequest = Omit<CreatePostRequest, 'type'>

export interface CreateCommentRequest {
  content: string
}

export type EditCommentRequest = CreateCommentRequest

export interface TogglePostLikeResponse {
  isLiked: boolean
  likeCount: number
}

export interface ToggleCommentLikeResponse {
  isLiked: boolean
  likeCount: number
}

export interface CitySummary {
  city: string
  totalPosts: number
  avgRating: number
  categoryCounts: Record<string, number>
}
