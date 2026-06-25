import api from './client'
import {
  Post,
  PostComment,
  CreatePostRequest,
  EditPostRequest,
  CreateCommentRequest,
  EditCommentRequest,
  TogglePostLikeResponse,
  ToggleCommentLikeResponse,
  CitySummary,
  PostFeedSort,
  PostType,
  PostCategory,
} from '@/types/post'
import { PaginatedMeta } from '@/types/api'

export interface PostListResponse {
  items: Post[]
  meta: PaginatedMeta
}

export interface CommentListResponse {
  items: PostComment[]
  meta: PaginatedMeta
}

export interface GetPostsParams {
  city?: string
  category?: PostCategory
  type?: PostType
  min_rating?: number
  sort?: PostFeedSort
  page?: number
  size?: number
}

export async function getPosts(params: GetPostsParams = {}): Promise<PostListResponse> {
  const res = await api.get('/posts', { params })
  return res.data
}

export async function getPost(id: string): Promise<Post> {
  const res = await api.get(`/posts/${id}`)
  return res.data
}

export async function getMyPosts(params: { page?: number; size?: number } = {}): Promise<PostListResponse> {
  const res = await api.get('/posts/me', { params })
  return res.data
}

export async function getUserPosts(
  userId: string,
  params: { page?: number; size?: number } = {},
): Promise<PostListResponse> {
  const res = await api.get(`/users/${userId}/posts`, { params })
  return res.data
}

export async function createPost(data: CreatePostRequest): Promise<Post> {
  const res = await api.post('/posts', data)
  return res.data
}

export async function updatePost(id: string, data: EditPostRequest): Promise<Post> {
  const res = await api.put(`/posts/${id}`, data)
  return res.data
}

export async function deletePost(id: string): Promise<void> {
  await api.delete(`/posts/${id}`)
}

export async function togglePostLike(id: string): Promise<TogglePostLikeResponse> {
  const res = await api.post(`/posts/${id}/like`)
  return res.data
}

export async function getComments(
  postId: string,
  params: { page?: number; size?: number } = {},
): Promise<CommentListResponse> {
  const res = await api.get(`/posts/${postId}/comments`, { params })
  return res.data
}

export async function createComment(postId: string, data: CreateCommentRequest): Promise<PostComment> {
  const res = await api.post(`/posts/${postId}/comments`, data)
  return res.data
}

export async function updateComment(commentId: string, data: EditCommentRequest): Promise<PostComment> {
  const res = await api.put(`/posts/comments/${commentId}`, data)
  return res.data
}

export async function deleteComment(commentId: string): Promise<void> {
  await api.delete(`/posts/comments/${commentId}`)
}

export async function toggleCommentLike(commentId: string): Promise<ToggleCommentLikeResponse> {
  const res = await api.post(`/posts/comments/${commentId}/like`)
  return res.data
}

export async function getCitySummary(city: string): Promise<CitySummary> {
  const res = await api.get(`/cities/${encodeURIComponent(city)}/summary`)
  return res.data
}

export async function adminTogglePostVisibility(id: string, reason?: string): Promise<Post> {
  const res = await api.put(`/admin/posts/${id}/visibility`, { reason })
  return res.data
}

export async function adminToggleCommentVisibility(commentId: string): Promise<PostComment> {
  const res = await api.put(`/admin/posts/comments/${commentId}/visibility`)
  return res.data
}
