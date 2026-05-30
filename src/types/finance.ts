export type WithdrawalMethod = 'bank' | 'momo' | 'zalopay' | 'vnpay'
export type WithdrawalStatus = 'pending' | 'approved' | 'rejected' | 'completed'

export interface Withdrawal {
  id: string
  amount: number
  fee: number
  netAmount: number
  method: WithdrawalMethod
  accountInfo: BankAccountInfo | EwalletAccountInfo
  note: string | null
  status: WithdrawalStatus
  adminNote: string | null
  createdAt: string
  processedAt: string | null
}

export interface BankAccountInfo {
  accountNo: string
  accountName: string
  bankName: string
}

export interface EwalletAccountInfo {
  phone: string
}

export interface FinanceSummary {
  balance: number
  totalEarned: number
  totalWithdrawn: number
  subscriptionPlan: string
  subscriptionExpiresAt: string | null
}

export interface CreateWithdrawalRequest {
  amount: number
  method: WithdrawalMethod
  accountInfo: string
  note?: string
}

export interface WishlistItem {
  id: string
  tourId: string
  tourTitle: string
  tourCoverImageUrl: string | null
  tourCity: string
  pricePerPerson: number
  avgRating: number
  totalReviews: number
  addedAt: string
}

export interface Notification {
  id: string
  userId: string
  type: string
  title: string
  body: string | null
  entityType: string | null
  entityId: string | null
  isRead: boolean
  createdAt: string
}
