import axios, { AxiosError } from 'axios'
import { supabase } from '@/lib/supabase'
import { ApiResponse } from '@/types/api'

export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  headers: { 'Content-Type': 'application/json' },
})

// Attach Supabase JWT to every request
apiClient.interceptors.request.use(async (config) => {
  const { data } = await supabase.auth.getSession()
  if (data.session?.access_token) {
    config.headers.Authorization = `Bearer ${data.session.access_token}`
  }
  return config
})

function joinErrors(errors: unknown): string {
  if (Array.isArray(errors)) return errors.join(', ')
  if (typeof errors === 'string') return errors
  return ''
}

// Unwrap ApiResponse<T> or throw standardized error
apiClient.interceptors.response.use(
  (response) => {
    const body = response.data as ApiResponse<unknown>
    if (body && typeof body === 'object' && 'success' in body) {
      if (!body.success) {
        const msg = joinErrors(body.errors) || body.message || 'Request failed'
        return Promise.reject(new Error(msg))
      }
      response.data = body.meta && Array.isArray(body.data)
        ? { items: body.data, meta: body.meta }
        : body.data
    }
    return response
  },
  (error: AxiosError<ApiResponse<unknown>>) => {
    const msg =
      joinErrors(error.response?.data?.errors) ||
      error.response?.data?.message ||
      error.message ||
      'Network error'
    return Promise.reject(new Error(msg))
  },
)

export default apiClient
