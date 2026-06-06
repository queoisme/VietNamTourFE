export type TrackingSessionStatus = 'active' | 'ended'

export interface TrackingSession {
  id: string
  bookingId: string
  guideId: string
  status: TrackingSessionStatus
  startedAt: string
  endedAt: string | null
  checkins: Checkin[]
  latestLocation: LocationPoint | null
}

export interface Checkin {
  id: string
  sessionId: string
  stepIndex: number
  stepTitle: string
  note: string | null
  photoUrl: string | null
  checkedInAt: string
}

export interface LocationPoint {
  id: number
  lat: number
  lng: number
  accuracy: number | null
  recordedAt: string
}

export interface PostLocationRequest {
  lat: number
  lng: number
  accuracy?: number
}

export interface PostCheckinRequest {
  stepIndex: number
  stepTitle: string
  note?: string
  photoUrl?: string
}

export interface ItineraryItem {
  time: string
  activity: string
  description: string
}
