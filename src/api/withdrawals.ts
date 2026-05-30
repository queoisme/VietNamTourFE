import api from './client'
import { Withdrawal, CreateWithdrawalRequest, FinanceSummary } from '@/types/finance'
import { PaginatedMeta } from '@/types/api'

export interface WithdrawalListResponse {
  items: Withdrawal[]
  meta: PaginatedMeta
}

export async function getMyFinance(): Promise<FinanceSummary> {
  const res = await api.get('/guides/me/finance')
  return res.data
}

export async function getMyWithdrawals(params: { page?: number; size?: number } = {}): Promise<WithdrawalListResponse> {
  const res = await api.get('/withdrawals/my', { params })
  return res.data
}

export async function createWithdrawal(data: CreateWithdrawalRequest): Promise<Withdrawal> {
  const res = await api.post('/withdrawals', data)
  return res.data
}
