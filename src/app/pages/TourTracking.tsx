import { useEffect, useRef, useState } from 'react'
import { useParams, useNavigate } from 'react-router'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet'
import { CheckCircle2, Circle, MapPin, Navigation, PlayCircle, StopCircle, ChevronLeft } from 'lucide-react'
import { toast } from 'sonner'
import {
  startTracking,
  endTracking,
  getTrackingSession,
  postLocation,
  postCheckin,
} from '@/api/tracking'
import { getBooking } from '@/api/bookings'
import { supabase } from '@/lib/supabase'
import type { TrackingSession, Checkin, LocationPoint, ItineraryItem } from '@/types/tracking'
import { useAuth } from '../contexts/AuthContext'
import { Button } from '../components/ui/button'
import { Textarea } from '../components/ui/textarea'

// ─────────────────────────────────────────────────────────────────────────────
// Main page — decides which view to render based on user role
// ─────────────────────────────────────────────────────────────────────────────
export function TourTracking() {
  const { bookingId } = useParams<{ bookingId: string }>()
  const { user } = useAuth()
  const navigate = useNavigate()

  const { data: booking, isLoading } = useQuery({
    queryKey: ['booking-detail', bookingId],
    queryFn: () => getBooking(bookingId!),
    enabled: !!bookingId,
  })

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent" />
      </div>
    )
  }

  if (!booking) {
    return (
      <div className="flex min-h-screen items-center justify-center text-slate-500">
        Không tìm thấy đơn đặt tour.
      </div>
    )
  }

  const itinerary: ItineraryItem[] = (() => {
    try {
      return JSON.parse(booking.tourItinerary ?? '[]')
    } catch {
      return []
    }
  })()

  const isGuide = user?.id === booking.guideId

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Banner */}
      <div className="bg-indigo-800 px-4 py-5 text-white">
        <div className="mx-auto max-w-4xl">
          <button
            onClick={() => navigate(-1)}
            className="mb-3 flex items-center gap-1 text-sm text-indigo-200 hover:text-white"
          >
            <ChevronLeft className="size-4" />
            Quay lại
          </button>
          <h1 className="text-2xl font-bold">{booking.tourTitle}</h1>
          <p className="mt-1 text-sm text-indigo-200">
            {isGuide ? 'Chế độ hướng dẫn viên' : 'Theo dõi lộ trình'}
            {' · '}
            {booking.tourDate}
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-4xl px-4 py-6">
        {isGuide ? (
          <GuideView bookingId={booking.id} itinerary={itinerary} />
        ) : (
          <CustomerView bookingId={booking.id} itinerary={itinerary} />
        )}
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// GUIDE VIEW
// ─────────────────────────────────────────────────────────────────────────────
function GuideView({
  bookingId,
  itinerary,
}: {
  bookingId: string
  itinerary: ItineraryItem[]
}) {
  const queryClient = useQueryClient()
  const watchIdRef = useRef<number | null>(null)
  const [gpsActive, setGpsActive] = useState(false)
  const [currentPos, setCurrentPos] = useState<{ lat: number; lng: number } | null>(null)
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [checkins, setCheckins] = useState<Checkin[]>([])
  const [checkinNotes, setCheckinNotes] = useState<Record<number, string>>({})

  const { data: session, refetch: refetchSession } = useQuery({
    queryKey: ['tracking-session', bookingId],
    queryFn: () => getTrackingSession(bookingId),
  })

  useEffect(() => {
    if (session) {
      setSessionId(session.id)
      setCheckins(session.checkins)
    }
  }, [session])

  // GPS watch
  useEffect(() => {
    if (!gpsActive || !sessionId) return

    watchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        const { latitude: lat, longitude: lng, accuracy } = pos.coords
        setCurrentPos({ lat, lng })
        postLocation(sessionId, { lat, lng, accuracy: accuracy ?? undefined }).catch(() => {
          // silent — GPS pings are best-effort
        })
      },
      (err) => {
        toast.error('Không thể lấy vị trí: ' + err.message)
        setGpsActive(false)
      },
      { enableHighAccuracy: true, maximumAge: 5000 },
    )

    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current)
        watchIdRef.current = null
      }
    }
  }, [gpsActive, sessionId])

  const startMutation = useMutation({
    mutationFn: () => startTracking(bookingId),
    onSuccess: (data) => {
      setSessionId(data.id)
      queryClient.invalidateQueries({ queryKey: ['tracking-session', bookingId] })
      toast.success('Đã bắt đầu tracking tour!')
    },
    onError: (err: Error) => toast.error(err.message),
  })

  const endMutation = useMutation({
    mutationFn: () => endTracking(bookingId),
    onSuccess: () => {
      setGpsActive(false)
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current)
        watchIdRef.current = null
      }
      queryClient.invalidateQueries({ queryKey: ['tracking-session', bookingId] })
      toast.success('Đã kết thúc tracking.')
    },
    onError: (err: Error) => toast.error(err.message),
  })

  const checkinMutation = useMutation({
    mutationFn: ({ stepIndex, stepTitle, note }: { stepIndex: number; stepTitle: string; note?: string }) =>
      postCheckin(sessionId!, { stepIndex, stepTitle, note }),
    onSuccess: (newCheckin) => {
      setCheckins((prev) => [...prev, newCheckin])
      toast.success('Đã xác nhận bước!')
    },
    onError: (err: Error) => toast.error(err.message),
  })

  const isActive = session?.status === 'active'
  const isEnded  = session?.status === 'ended'
  const checkedIndices = new Set(checkins.map((c) => c.stepIndex))

  const handleCheckin = (index: number, title: string) => {
    if (checkedIndices.has(index)) return
    checkinMutation.mutate({
      stepIndex: index,
      stepTitle: title,
      note: checkinNotes[index] || undefined,
    })
  }

  return (
    <div className="space-y-6">
      {/* Session controls */}
      <div className="flex flex-wrap items-center gap-3 rounded-2xl border bg-white p-4 shadow-sm">
        <div className="flex-1">
          <p className="text-sm font-medium text-slate-700">
            Trạng thái:{' '}
            <span
              className={
                isActive
                  ? 'text-emerald-600'
                  : isEnded
                    ? 'text-slate-500'
                    : 'text-amber-600'
              }
            >
              {isActive ? 'Đang chạy' : isEnded ? 'Đã kết thúc' : 'Chưa bắt đầu'}
            </span>
          </p>
          {session?.startedAt && (
            <p className="text-xs text-slate-500">
              Bắt đầu: {new Date(session.startedAt).toLocaleTimeString('vi-VN')}
            </p>
          )}
        </div>
        <div className="flex gap-2">
          {!session && (
            <Button
              size="sm"
              className="bg-indigo-600 hover:bg-indigo-700"
              onClick={() => startMutation.mutate()}
              disabled={startMutation.isPending}
            >
              <PlayCircle className="mr-1.5 size-4" />
              {startMutation.isPending ? 'Đang bắt đầu...' : 'Bắt đầu tour'}
            </Button>
          )}
          {isActive && (
            <>
              <Button
                size="sm"
                variant={gpsActive ? 'default' : 'outline'}
                className={gpsActive ? 'bg-emerald-600 hover:bg-emerald-700' : ''}
                onClick={() => setGpsActive((v) => !v)}
              >
                <Navigation className="mr-1.5 size-4" />
                {gpsActive ? 'GPS đang bật' : 'Bật GPS'}
              </Button>
              <Button
                size="sm"
                variant="destructive"
                onClick={() => endMutation.mutate()}
                disabled={endMutation.isPending}
              >
                <StopCircle className="mr-1.5 size-4" />
                {endMutation.isPending ? 'Đang kết thúc...' : 'Kết thúc'}
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Map */}
      {currentPos && (
        <div className="overflow-hidden rounded-2xl border shadow-sm" style={{ height: 280 }}>
          <MapContainer
            center={[currentPos.lat, currentPos.lng]}
            zoom={15}
            style={{ height: '100%', width: '100%' }}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <Marker position={[currentPos.lat, currentPos.lng]}>
              <Popup>Vị trí của bạn</Popup>
            </Marker>
          </MapContainer>
        </div>
      )}

      {/* Itinerary checklist */}
      {itinerary.length > 0 && (
        <div className="rounded-2xl border bg-white shadow-sm">
          <div className="border-b px-4 py-3">
            <h2 className="font-semibold text-slate-900">
              Lịch trình — {checkins.length}/{itinerary.length} bước hoàn thành
            </h2>
          </div>
          <ul className="divide-y">
            {itinerary.map((step, i) => {
              const done = checkedIndices.has(i)
              return (
                <li key={i} className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 shrink-0">
                      {done ? (
                        <CheckCircle2 className="size-5 text-emerald-500" />
                      ) : (
                        <Circle className="size-5 text-slate-300" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`font-medium ${done ? 'text-emerald-700 line-through' : 'text-slate-800'}`}>
                        {step.time && <span className="mr-2 text-xs font-normal text-slate-500">{step.time}</span>}
                        {step.activity}
                      </p>
                      {step.description && (
                        <p className="mt-0.5 text-xs text-slate-500">{step.description}</p>
                      )}
                      {!done && isActive && (
                        <div className="mt-2 flex gap-2">
                          <Textarea
                            placeholder="Ghi chú (tùy chọn)"
                            rows={1}
                            className="text-xs"
                            value={checkinNotes[i] ?? ''}
                            onChange={(e) =>
                              setCheckinNotes((prev) => ({ ...prev, [i]: e.target.value }))
                            }
                          />
                          <Button
                            size="sm"
                            className="shrink-0 bg-indigo-600 hover:bg-indigo-700"
                            onClick={() => handleCheckin(i, step.activity)}
                            disabled={checkinMutation.isPending}
                          >
                            Xác nhận
                          </Button>
                        </div>
                      )}
                      {done && (
                        <p className="mt-1 text-xs text-emerald-600">
                          ✓ {new Date(checkins.find((c) => c.stepIndex === i)!.checkedInAt).toLocaleTimeString('vi-VN')}
                          {checkins.find((c) => c.stepIndex === i)?.note
                            ? ` — ${checkins.find((c) => c.stepIndex === i)!.note}`
                            : ''}
                        </p>
                      )}
                    </div>
                  </div>
                </li>
              )
            })}
          </ul>
        </div>
      )}

      {itinerary.length === 0 && (
        <div className="rounded-2xl border bg-white p-6 text-center text-sm text-slate-500">
          Tour này không có lịch trình chi tiết.
        </div>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// CUSTOMER VIEW
// ─────────────────────────────────────────────────────────────────────────────
function CustomerView({
  bookingId,
  itinerary,
}: {
  bookingId: string
  itinerary: ItineraryItem[]
}) {
  const [session, setSession] = useState<TrackingSession | null | undefined>(undefined)
  const [checkins, setCheckins] = useState<Checkin[]>([])
  const [guideLocation, setGuideLocation] = useState<LocationPoint | null>(null)

  // Initial fetch
  const { data: initialSession, isLoading: sessionLoading } = useQuery({
    queryKey: ['tracking-session', bookingId],
    queryFn: () => getTrackingSession(bookingId),
  })

  useEffect(() => {
    if (initialSession !== undefined) {
      setSession(initialSession)
      if (initialSession) {
        setCheckins(initialSession.checkins)
        setGuideLocation(initialSession.latestLocation)
      }
    }
  }, [initialSession])

  // Supabase Realtime subscriptions
  useEffect(() => {
    // 1) Guide location pings
    const locationChannel = supabase
      .channel(`tracking-locations:${bookingId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'guide_locations',
          filter: `booking_id=eq.${bookingId}`,
        },
        (payload) => {
          const loc = payload.new as {
            id: number; lat: number; lng: number; accuracy: number | null; recorded_at: string
          }
          setGuideLocation({
            id: loc.id,
            lat: loc.lat,
            lng: loc.lng,
            accuracy: loc.accuracy,
            recordedAt: loc.recorded_at,
          })
        },
      )
      .subscribe()

    // 2) New checkins
    const checkinsChannel = supabase
      .channel(`tracking-checkins:${bookingId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'tour_checkins',
          filter: `booking_id=eq.${bookingId}`,
        },
        (payload) => {
          const c = payload.new as {
            id: string; session_id: string; step_index: number; step_title: string
            note: string | null; photo_url: string | null; checked_in_at: string
          }
          const newCheckin: Checkin = {
            id: c.id,
            sessionId: c.session_id,
            stepIndex: c.step_index,
            stepTitle: c.step_title,
            note: c.note,
            photoUrl: c.photo_url,
            checkedInAt: c.checked_in_at,
          }
          setCheckins((prev) => {
            if (prev.some((x) => x.id === newCheckin.id)) return prev
            return [...prev, newCheckin]
          })
          toast.info(`✅ Bước ${c.step_index + 1} hoàn thành: ${c.step_title}`)
        },
      )
      .subscribe()

    // 3) Session state changes (start / end)
    const sessionChannel = supabase
      .channel(`tracking-session:${bookingId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'tour_tracking_sessions',
          filter: `booking_id=eq.${bookingId}`,
        },
        (payload) => {
          const s = payload.new as {
            id: string; booking_id: string; guide_id: string; status: string
            started_at: string; ended_at: string | null
          }
          setSession((prev) => ({
            id: s.id,
            bookingId: s.booking_id,
            guideId: s.guide_id,
            status: s.status as 'active' | 'ended',
            startedAt: s.started_at,
            endedAt: s.ended_at,
            checkins: prev?.checkins ?? [],
            latestLocation: prev?.latestLocation ?? null,
          }))
          if (s.status === 'active') {
            toast.info('Hướng dẫn viên đã bắt đầu tour!')
          } else if (s.status === 'ended') {
            toast.info('Tour đã kết thúc.')
          }
        },
      )
      .subscribe()

    return () => {
      supabase.removeChannel(locationChannel)
      supabase.removeChannel(checkinsChannel)
      supabase.removeChannel(sessionChannel)
    }
  }, [bookingId])

  const checkedIndices = new Set(checkins.map((c) => c.stepIndex))
  const totalSteps     = itinerary.length
  const completedSteps = totalSteps > 0
    ? checkins.filter((c) => c.stepIndex < totalSteps).length
    : checkins.length
  const progressPct = totalSteps > 0 ? Math.round((completedSteps / totalSteps) * 100) : 0

  if (sessionLoading) {
    return (
      <div className="flex min-h-40 items-center justify-center">
        <div className="h-6 w-6 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Session status card */}
      <div className="rounded-2xl border bg-white p-4 shadow-sm">
        {session === null ? (
          <div className="flex items-center gap-3">
            <div className="size-3 rounded-full bg-slate-300" />
            <p className="text-sm text-slate-600">Hướng dẫn viên chưa bắt đầu tour. Hãy quay lại sau.</p>
          </div>
        ) : session.status === 'active' ? (
          <div className="flex items-center gap-3">
            <div className="size-3 animate-pulse rounded-full bg-emerald-500" />
            <p className="text-sm font-medium text-emerald-700">
              Tour đang diễn ra · bắt đầu lúc {new Date(session.startedAt).toLocaleTimeString('vi-VN')}
            </p>
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <div className="size-3 rounded-full bg-slate-400" />
            <p className="text-sm text-slate-600">
              Tour đã kết thúc lúc{' '}
              {session.endedAt ? new Date(session.endedAt).toLocaleTimeString('vi-VN') : '—'}
            </p>
          </div>
        )}

        {/* Progress bar */}
        {session && totalSteps > 0 && (
          <div className="mt-3">
            <div className="mb-1 flex items-center justify-between text-xs text-slate-500">
              <span>Tiến độ lộ trình</span>
              <span>{completedSteps}/{totalSteps} bước ({progressPct}%)</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-slate-100">
              <div
                className="h-full rounded-full bg-indigo-600 transition-all"
                style={{ width: `${progressPct}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Map */}
      {guideLocation && (
        <div className="overflow-hidden rounded-2xl border shadow-sm" style={{ height: 280 }}>
          <MapContainer
            center={[guideLocation.lat, guideLocation.lng]}
            zoom={15}
            style={{ height: '100%', width: '100%' }}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <Marker position={[guideLocation.lat, guideLocation.lng]}>
              <Popup>
                <MapPin className="mr-1 inline size-3" />
                Hướng dẫn viên
              </Popup>
            </Marker>
          </MapContainer>
        </div>
      )}

      {/* Itinerary timeline */}
      {itinerary.length > 0 && (
        <div className="rounded-2xl border bg-white shadow-sm">
          <div className="border-b px-4 py-3">
            <h2 className="font-semibold text-slate-900">Lộ trình</h2>
          </div>
          <ul className="divide-y">
            {itinerary.map((step, i) => {
              const done    = checkedIndices.has(i)
              const checkin = checkins.find((c) => c.stepIndex === i)
              return (
                <li key={i} className={`flex gap-3 p-4 ${done ? 'bg-emerald-50/50' : ''}`}>
                  <div className="mt-0.5 shrink-0">
                    {done ? (
                      <CheckCircle2 className="size-5 text-emerald-500" />
                    ) : (
                      <Circle className="size-5 text-slate-300" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`font-medium ${done ? 'text-emerald-700' : 'text-slate-700'}`}>
                      {step.time && (
                        <span className="mr-2 text-xs font-normal text-slate-500">{step.time}</span>
                      )}
                      {step.activity}
                    </p>
                    {step.description && (
                      <p className="mt-0.5 text-xs text-slate-500">{step.description}</p>
                    )}
                    {checkin && (
                      <p className="mt-1 text-xs text-emerald-600">
                        ✓ {new Date(checkin.checkedInAt).toLocaleTimeString('vi-VN')}
                        {checkin.note ? ` — ${checkin.note}` : ''}
                      </p>
                    )}
                  </div>
                </li>
              )
            })}
          </ul>
        </div>
      )}
    </div>
  )
}
