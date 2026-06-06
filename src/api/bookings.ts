import api from './client'
import {
  BookingListItem,
  BookingDetail,
  CreateBookingRequest,
  RejectBookingRequest,
  CancelBookingRequest,
  GuideCancelBookingRequest,
} from '@/types/booking'
import { PaginatedMeta } from '@/types/api'

export interface BookingListResponse {
  items: BookingListItem[]
  meta: PaginatedMeta
}

function listItemToBookingDetail(item: BookingListItem): BookingDetail {
  const now = new Date().toISOString()

  return {
    id: item.id,
    tourId: item.tourId,
    tourTitle: item.tourTitle,
    tourCoverImageUrl: item.tourCoverImageUrl,
    tourImages: item.tourImages ?? [],
    customerId: '',
    customerName: 'Khach hang',
    guideId: '',
    guideName: 'Huong dan vien',
    tourDate: item.tourDate,
    numPeople: item.numPeople,
    totalPrice: item.totalPrice,
    contactName: '',
    contactPhone: '',
    contactEmail: null,
    note: null,
    status: item.status,
    rejectionReason: null,
    cancellationBy: null,
    cancellationReason: null,
    refundAmount: 0,
    refundPolicy: null,
    paymentStatus: item.paymentStatus,
    paymentMethod: null,
    paymentTxnId: null,
    paymentPaidAt: null,
    confirmedAt: null,
    completedAt: null,
    createdAt: item.createdAt,
    updatedAt: now,
    conversationId: null,
    tourItinerary: '[]',
  }
}

export async function createBooking(data: CreateBookingRequest): Promise<BookingDetail> {
  const res = await api.post('/bookings', data)
  return res.data
}

export async function getMyBookings(params: { page?: number; size?: number; status?: string } = {}): Promise<BookingListResponse> {
  const res = await api.get('/bookings/my', { params })
  return res.data
}

export async function getGuideBookings(params: { page?: number; size?: number; status?: string } = {}): Promise<BookingListResponse> {
  const res = await api.get('/guides/me/bookings', { params })
  return res.data
}

async function getBookingFromListFallback(id: string): Promise<BookingDetail | null> {
  const listCalls = [
    () => getMyBookings({ size: 200 }),
    () => getGuideBookings({ size: 200 }),
  ]

  for (const call of listCalls) {
    try {
      const res = await call()
      const found = res.items.find((b) => b.id === id)
      if (found) return listItemToBookingDetail(found)
    } catch {
      // Ignore and try the next accessible endpoint.
    }
  }

  return null
}

export async function getBooking(id: string): Promise<BookingDetail> {
  // Try common detail endpoints first.
  const paths = [
    `/bookings/${id}`,
    `/bookings/my/${id}`,
    `/guides/me/bookings/${id}`,
  ]

  let lastError: unknown = null

  for (const path of paths) {
    try {
      const res = await api.get(path)
      return res.data
    } catch (error) {
      lastError = error
    }
  }

  // Fallback: derive detail from list data so detail page still works.
  const fallbackBooking = await getBookingFromListFallback(id)
  if (fallbackBooking) return fallbackBooking

  throw lastError instanceof Error ? lastError : new Error('Cannot load booking details')
}

export async function confirmBooking(id: string): Promise<void> {
  await api.post(`/bookings/${id}/confirm`)
}

export async function rejectBooking(id: string, data: RejectBookingRequest): Promise<void> {
  await api.post(`/bookings/${id}/reject`, data)
}

export async function completeBooking(id: string): Promise<void> {
  await api.post(`/bookings/${id}/complete`)
}

export async function cancelBooking(id: string, data: CancelBookingRequest = {}): Promise<void> {
  await api.post(`/bookings/${id}/cancel`, data)
}

export async function guideCancelBooking(id: string, data: GuideCancelBookingRequest = {}): Promise<void> {
  await api.post(`/bookings/${id}/guide-cancel`, data)
}
