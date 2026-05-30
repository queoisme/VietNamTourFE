import api from './client'
import {
  TourListItem,
  TourDetail,
  TourAvailability,
  TourSearchParams,
  CreateTourRequest,
  UpdateTourRequest,
  CreateAvailabilityRequest,
  UpdateAvailabilityRequest,
} from '@/types/tour'
import { PaginatedMeta } from '@/types/api'

export interface TourListResponse {
  items: TourListItem[]
  meta: PaginatedMeta
}

export async function searchTours(params: TourSearchParams = {}): Promise<TourListResponse> {
  const res = await api.get('/tours', { params })
  return res.data
}

export async function getTour(id: string): Promise<TourDetail> {
  const res = await api.get(`/tours/${id}`)
  return res.data
}

export async function getTourAvailabilities(id: string): Promise<TourAvailability[]> {
  const res = await api.get(`/tours/${id}/availabilities`)
  return res.data
}

export async function createTour(data: CreateTourRequest): Promise<TourDetail> {
  const res = await api.post('/tours', data)
  return res.data
}

export async function updateTour(id: string, data: UpdateTourRequest): Promise<TourDetail> {
  const res = await api.put(`/tours/${id}`, data)
  return res.data
}

export async function deleteTour(id: string): Promise<void> {
  await api.delete(`/tours/${id}`)
}

export async function updateTourStatus(
  id: string,
  status: string,
): Promise<void> {
  await api.put(`/tours/${id}/status`, { status })
}

export async function getMyTours(params: { page?: number; size?: number } = {}): Promise<TourListResponse> {
  const res = await api.get('/guides/me/tours', { params })
  return res.data
}

export async function uploadTourImages(id: string, files: File[]): Promise<string[]> {
  const form = new FormData()
  files.forEach((f) => form.append('files', f))
  const res = await api.post(`/tours/${id}/images`, form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
  return res.data
}

export async function deleteTourImage(id: string, imageUrl: string): Promise<void> {
  await api.delete(`/tours/${id}/images`, { data: { url: imageUrl } })
}

export async function uploadTourCoverImage(id: string, file: File): Promise<string> {
  const form = new FormData()
  form.append('file', file)
  const res = await api.post(`/tours/${id}/cover-image`, form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
  return res.data
}

export async function addAvailability(
  tourId: string,
  data: CreateAvailabilityRequest,
): Promise<TourAvailability> {
  const res = await api.post(`/tours/${tourId}/availabilities`, data)
  return res.data
}

export async function updateAvailability(
  tourId: string,
  date: string,
  data: UpdateAvailabilityRequest,
): Promise<TourAvailability> {
  const res = await api.put(`/tours/${tourId}/availabilities/${date}`, data)
  return res.data
}

export async function deleteAvailability(tourId: string, date: string): Promise<void> {
  await api.delete(`/tours/${tourId}/availabilities/${date}`)
}
