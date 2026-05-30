import { useParams, Link, useNavigate } from 'react-router'
import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { Button } from '../components/ui/button'
import { Card, CardContent } from '../components/ui/card'
import { Separator } from '../components/ui/separator'
import { Skeleton } from '../components/ui/skeleton'
import { Alert, AlertDescription, AlertTitle } from '../components/ui/alert'
import { Badge } from '../components/ui/badge'
import { toast } from 'sonner'
import { getBooking } from '@/api/bookings'
import { getOrCreateConversationByBooking } from '@/api/conversations'
import { formatVND, formatDate, formatDateTime, BOOKING_STATUS_LABELS, PAYMENT_STATUS_LABELS } from '@/lib/constants'
import { useAuth } from '../contexts/AuthContext'

const CANCELLATION_BY_LABELS: Record<string, string> = {
  customer: 'Khách hàng',
  guide: 'Hướng dẫn viên',
  admin: 'Quản trị viên',
  system: 'Hệ thống',
}

export function BookingConfirmation() {
  const { id } = useParams<{ id: string }>()
  const { user } = useAuth()
  const navigate = useNavigate()
  const isGuide = user?.role === 'guide'
  const [chatLoading, setChatLoading] = useState(false)

  const { data: booking, isLoading, isError, error } = useQuery({
    queryKey: ['booking', id],
    queryFn: () => getBooking(id!),
    enabled: !!id,
  })

  if (isLoading) {
    return (
      <div className="py-16 bg-gray-50 min-h-screen">
        <div className="container max-w-3xl mx-auto px-4 space-y-4">
          <Skeleton className="h-24 w-full rounded-xl" />
          <Skeleton className="h-64 w-full rounded-xl" />
        </div>
      </div>
    )
  }

  if (isError) {
    return (
      <div className="py-16 text-center">
        <p className="text-gray-500">{error instanceof Error ? error.message : 'Không thể tải chi tiết đơn đặt tour.'}</p>
        <Button asChild className="mt-4"><Link to="/my-bookings">Đơn của tôi</Link></Button>
      </div>
    )
  }

  if (!booking) {
    return (
      <div className="py-16 text-center">
        <p className="text-gray-500">Không tìm thấy đơn đặt tour.</p>
        <Button asChild className="mt-4"><Link to="/my-bookings">Đơn của tôi</Link></Button>
      </div>
    )
  }

  const isPaid = booking.paymentStatus === 'paid'

  const handleChat = async () => {
    if (!id) return
    setChatLoading(true)
    try {
      const conv = await getOrCreateConversationByBooking(id, {
        otherUserId: (isGuide ? booking.customerId : booking.guideId) || undefined,
      })
      if (conv) {
        navigate(`/chat/${conv.id}`)
        return
      }
      navigate('/chat')
      toast('Chua tao duoc hoi thoai, vui long thu lai')
    } catch (err: unknown) {
      navigate('/chat')
      toast(err instanceof Error ? err.message : 'Khong the mo trang chat luc nay')
    } finally {
      setChatLoading(false)
    }
  }

  return (
    <div className="py-16 bg-gray-50 min-h-screen">
      <div className="container mx-auto px-4">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-8">
            <div className={`inline-flex items-center justify-center size-20 rounded-full mb-4 text-4xl ${isPaid ? 'bg-green-100 text-green-600' : 'bg-yellow-100 text-yellow-600'}`}>
              {isPaid ? '✓' : '⏳'}
            </div>
            <h1 className="text-3xl font-bold mb-2">
              {isGuide ? 'Chi tiết đơn đặt' : isPaid ? 'Đặt Tour Thành Công!' : 'Đơn Đặt Tour Đã Tạo'}
            </h1>
            <p className="text-gray-600">
              {isGuide
                ? `Khách hàng: ${booking.customerName}`
                : isPaid
                  ? 'Cảm ơn bạn! Hướng dẫn viên sẽ xác nhận trong thời gian sớm nhất.'
                  : 'Vui lòng thanh toán để hoàn tất đặt tour.'}
            </p>
          </div>

          <Card className="mb-6">
            <CardContent className="p-6">
              <div className="flex items-start justify-between gap-4 flex-wrap mb-4">
                <div>
                  <h2 className="text-xl font-bold">{booking.tourTitle}</h2>
                  <p className="text-sm text-gray-500 mt-1">Mã đơn: {booking.id.slice(0, 8).toUpperCase()}</p>
                </div>
                <div className="flex gap-2">
                  <Badge>{BOOKING_STATUS_LABELS[booking.status] || booking.status}</Badge>
                  <Badge variant="outline" className={booking.paymentStatus === 'refund_failed' ? 'border-amber-300 bg-amber-100 text-amber-800' : ''}>
                    {PAYMENT_STATUS_LABELS[booking.paymentStatus] || booking.paymentStatus}
                  </Badge>
                </div>
              </div>

              {booking.tourCoverImageUrl && (
                <img src={booking.tourCoverImageUrl} alt={booking.tourTitle} className="w-full h-40 object-cover rounded-lg mb-4" />
              )}

              <Separator className="my-4" />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-xs text-gray-500">Ngày tour</p>
                  <p className="font-medium">{formatDate(booking.tourDate)}</p>
                </div>
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-xs text-gray-500">Số người</p>
                  <p className="font-medium">{booking.numPeople} người</p>
                </div>
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-xs text-gray-500">Hướng dẫn viên</p>
                  <p className="font-medium">{booking.guideName}</p>
                </div>
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-xs text-gray-500">Ngày đặt</p>
                  <p className="font-medium">{formatDateTime(booking.createdAt)}</p>
                </div>
              </div>

              <Separator className="my-4" />

              <div className="flex justify-between items-center">
                <span className="font-semibold">Tổng tiền</span>
                <span className="text-2xl font-bold text-orange-600">{formatVND(booking.totalPrice)}</span>
              </div>

              {booking.paymentMethod && (
                <p className="text-sm text-gray-500 mt-1 text-right">Thanh toán qua {booking.paymentMethod.toUpperCase()}</p>
              )}

              {booking.paymentStatus === 'refund_failed' && (
                <Alert className="mt-4 border-amber-300 bg-amber-50 text-amber-800">
                  <AlertTitle>Hoàn tiền thất bại</AlertTitle>
                  <AlertDescription>
                    Hệ thống gặp sự cố khi hoàn tiền qua cổng thanh toán. Đội ngũ hỗ trợ sẽ xử lý hoàn tiền thủ công trong vòng 3–5 ngày làm việc.
                  </AlertDescription>
                </Alert>
              )}

              {(booking.status === 'cancelled' || booking.status === 'rejected') && (
                <>
                  <Separator className="my-4" />
                  <h3 className="mb-3 font-semibold">Thông tin hủy / từ chối</h3>
                  <div className="grid grid-cols-1 gap-3 text-sm md:grid-cols-2">
                    {booking.cancellationBy && (
                      <div>
                        <p className="text-xs text-gray-500">Hủy bởi</p>
                        <p className="font-medium">{CANCELLATION_BY_LABELS[booking.cancellationBy] ?? booking.cancellationBy}</p>
                      </div>
                    )}
                    {(booking.cancellationReason || booking.rejectionReason) && (
                      <div className="md:col-span-2">
                        <p className="text-xs text-gray-500">Lý do</p>
                        <p className="font-medium">{booking.cancellationReason || booking.rejectionReason}</p>
                      </div>
                    )}
                  </div>
                </>
              )}

              {(booking.status === 'cancelled' || booking.status === 'rejected') && booking.refundAmount > 0 && (
                <>
                  <Separator className="my-4" />
                  <h3 className="mb-3 font-semibold">Thông tin hoàn tiền</h3>
                  <div className="grid grid-cols-1 gap-3 text-sm md:grid-cols-2">
                    <div>
                      <p className="text-xs text-gray-500">Số tiền hoàn</p>
                      <p className="font-medium text-emerald-700">{formatVND(booking.refundAmount)}</p>
                    </div>
                    {booking.refundPolicy && (
                      <div>
                        <p className="text-xs text-gray-500">Chính sách</p>
                        <p className="font-medium">{booking.refundPolicy}</p>
                      </div>
                    )}
                  </div>
                </>
              )}

              {isGuide && (
                <>
                  <Separator className="my-4" />
                  <h3 className="font-semibold mb-3">Thông tin liên hệ khách</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                    <div className="p-2 bg-gray-50 rounded-lg">
                      <p className="text-xs text-gray-500">Điện thoại</p>
                      <p>{booking.contactPhone || '-'}</p>
                    </div>
                    {booking.contactEmail && (
                      <div className="p-2 bg-gray-50 rounded-lg">
                        <p className="text-xs text-gray-500">Email</p>
                        <p>{booking.contactEmail}</p>
                      </div>
                    )}
                    {booking.note && (
                      <div className="p-2 bg-gray-50 rounded-lg md:col-span-2">
                        <p className="text-xs text-gray-500">Ghi chú</p>
                        <p className="text-gray-600">{booking.note}</p>
                      </div>
                    )}
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          <div className="flex gap-3 justify-center flex-wrap">
            {!isGuide && booking.paymentStatus === 'unpaid' && (
              <Button className="bg-orange-600 hover:bg-orange-700" asChild>
                <Link to={`/payment/vnpay/${booking.id}`}>Thanh toán ngay</Link>
              </Button>
            )}
            <Button className="bg-blue-600 hover:bg-blue-700" disabled={chatLoading} onClick={handleChat}>
              {chatLoading
                ? 'Đang mở...'
                : isGuide
                  ? 'Nhắn tin với khách'
                  : 'Nhắn tin với guide'}
            </Button>
            <Button variant="outline" asChild>
              <Link to={isGuide ? '/guide' : '/my-bookings'}>
                {isGuide ? 'Quay lại dashboard' : 'Xem tất cả đơn'}
              </Link>
            </Button>
            {!isGuide && (
              <Button variant="outline" asChild>
                <Link to="/tours">Khám phá thêm</Link>
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
