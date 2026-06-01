import api from './client'

export async function trackPageView(path: string): Promise<void> {
  await api.post('/track/pv', { path })
}

export interface TourClickSummary {
  tourId: string
  title: string
  coverImageUrl: string | null
  status: string
  clicks: number
}

export interface GuideClickAnalyticsResponse {
  totalClicks: number
  tours: TourClickSummary[]
  dailyTrend: { date: string; count: number }[]
}

export async function getMyTourClickAnalytics(params: {
  from?: string
  to?: string
}): Promise<GuideClickAnalyticsResponse> {
  return api.get('/guides/me/analytics/tour-clicks', { params })
}
