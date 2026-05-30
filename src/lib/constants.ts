export const API_URL = import.meta.env.VITE_API_URL as string

export const TOUR_TYPES = [
  { value: 'group', label: 'Tour nhóm', description: 'Nhiều khách cùng đặt chung lịch' },
  { value: 'private', label: 'Tour riêng tư', description: 'Chỉ một nhóm khách đặt mỗi ngày' },
] as const

export const TOUR_CATEGORIES = [
  { value: 'nature', label: 'Thiên nhiên' },
  { value: 'culture', label: 'Văn hóa' },
  { value: 'food', label: 'Ẩm thực' },
  { value: 'resort', label: 'Nghỉ dưỡng' },
  { value: 'adventure', label: 'Phiêu lưu' },
  { value: 'other', label: 'Khác' },
] as const

export const BOOKING_STATUS_LABELS: Record<string, string> = {
  pending: 'Chờ xác nhận',
  confirmed: 'Đã xác nhận',
  completed: 'Hoàn thành',
  cancelled: 'Đã hủy',
  rejected: 'Bị từ chối',
}

export const PAYMENT_STATUS_LABELS: Record<string, string> = {
  unpaid: 'Chưa thanh toán',
  paid: 'Đã thanh toán',
  refunded: 'Đã hoàn tiền',
  refund_failed: 'Hoàn tiền thất bại',
}

export const SUBSCRIPTION_PLANS = {
  free: { label: 'Miễn phí', commission: '15%', maxTours: 5 },
  premium: { label: 'Premium', commission: '10%', maxTours: 'Không giới hạn', price: 299000 },
  pro: { label: 'Pro', commission: '8%', maxTours: 'Không giới hạn', price: 799000 },
}

export const WITHDRAWAL_METHODS = [
  { value: 'bank', label: 'Ngân hàng' },
  { value: 'momo', label: 'MoMo' },
  { value: 'zalopay', label: 'ZaloPay' },
  { value: 'vnpay', label: 'VNPay' },
] as const

export const VND_FORMATTER = new Intl.NumberFormat('vi-VN', {
  style: 'currency',
  currency: 'VND',
})

export function formatVND(amount: number): string {
  return VND_FORMATTER.format(amount)
}

export function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}

export function formatDateTime(dateStr: string): string {
  return new Date(dateStr).toLocaleString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}
