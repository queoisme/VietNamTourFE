import api from './client'
import { MomoPaymentResponse, VNPayPaymentResponse } from '@/types/booking'

export async function createMomoPayment(bookingId: string): Promise<MomoPaymentResponse> {
  const res = await api.post('/payments/momo/create', { bookingId })
  return res.data
}

export async function createVNPayPayment(bookingId: string): Promise<VNPayPaymentResponse> {
  const res = await api.post('/payments/vnpay/create', { bookingId })
  return res.data
}
