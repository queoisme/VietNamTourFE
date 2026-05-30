import api from './client'
import { UserProfile, GuideProfile, GuidePublicProfile, UpdateProfileRequest, UpdateGuideProfileRequest } from '@/types/user'

export async function getMe(): Promise<UserProfile> {
  const res = await api.get('/users/me')
  return res.data
}

export async function updateMe(data: UpdateProfileRequest): Promise<UserProfile> {
  const res = await api.put('/users/me', data)
  return res.data
}

export async function uploadAvatar(file: File): Promise<string> {
  const form = new FormData()
  form.append('file', file)
  const res = await api.put('/users/me/avatar', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
  return res.data
}

export async function getGuidePublicProfile(userId: string): Promise<GuidePublicProfile> {
  const res = await api.get(`/guides/${userId}`)
  return res.data
}

export async function getMyGuideProfile(): Promise<GuideProfile> {
  const res = await api.get('/guides/me/profile')
  return res.data
}

export async function updateMyGuideProfile(data: UpdateGuideProfileRequest): Promise<GuideProfile> {
  const res = await api.put('/guides/me/profile', data)
  return res.data
}
