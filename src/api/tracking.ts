import api from './client'
import type {
  TrackingSession,
  Checkin,
  LocationPoint,
  PostLocationRequest,
  PostCheckinRequest,
} from '@/types/tracking'

export async function startTracking(bookingId: string): Promise<TrackingSession> {
  const res = await api.post(`/bookings/${bookingId}/tracking/start`)
  return res.data.data
}

export async function endTracking(bookingId: string): Promise<TrackingSession> {
  const res = await api.put(`/bookings/${bookingId}/tracking/end`)
  return res.data.data
}

export async function getTrackingSession(bookingId: string): Promise<TrackingSession | null> {
  const res = await api.get(`/bookings/${bookingId}/tracking`)
  return res.data.data
}

export async function postLocation(
  sessionId: string,
  req: PostLocationRequest,
): Promise<LocationPoint> {
  const res = await api.post(`/tracking/${sessionId}/location`, req)
  return res.data.data
}

export async function postCheckin(
  sessionId: string,
  req: PostCheckinRequest,
): Promise<Checkin> {
  const res = await api.post(`/tracking/${sessionId}/checkins`, req)
  return res.data.data
}

export async function getCheckins(sessionId: string): Promise<Checkin[]> {
  const res = await api.get(`/tracking/${sessionId}/checkins`)
  return res.data.data
}
