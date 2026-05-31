import api from './client'

export async function trackPageView(path: string): Promise<void> {
  await api.post('/track/pv', { path })
}
