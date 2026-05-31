import { useEffect } from 'react'
import { useSearchParams, useNavigate } from 'react-router'
import { useQuery } from '@tanstack/react-query'
import { Button } from '../components/ui/button'
import { Card, CardContent } from '../components/ui/card'
import { getBooking } from '@/api/bookings'
import { formatVND } from '@/lib/constants'

export function PaymentSuccess() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const txnRef = searchParams.get('txnRef')

  const isBoost = txnRef?.startsWith('bt') ?? false
  const isSubscription = txnRef?.startsWith('sb') ?? false
  const isBooking = !isBoost && !isSubscription

  const bookingId = isBooking
    ? (sessionStorage.getItem('payment_booking_id') ?? sessionStorage.getItem('momo_booking_id'))
    : null

  const { data: booking } = useQuery({
    queryKey: ['booking', bookingId],
    queryFn: () => getBooking(bookingId!),
    enabled: !!bookingId,
  })

  // Booking: auto-redirect to booking confirmation after 5s
  useEffect(() => {
    if (!bookingId) return
    const timer = setTimeout(() => {
      navigate(`/booking-confirmation/${bookingId}`, { replace: true })
    }, 5000)
    return () => clearTimeout(timer)
  }, [bookingId, navigate])

  // Boost: auto-redirect to guide dashboard after 3s
  useEffect(() => {
    if (!isBoost) return
    const timer = setTimeout(() => {
      navigate('/guide', { replace: true })
    }, 3000)
    return () => clearTimeout(timer)
  }, [isBoost, navigate])

  // Subscription: auto-redirect to subscription page after 3s
  useEffect(() => {
    if (!isSubscription) return
    const timer = setTimeout(() => {
      navigate('/subscription', { replace: true })
    }, 3000)
    return () => clearTimeout(timer)
  }, [isSubscription, navigate])

  const heading = isBoost
    ? 'Tour đã được boost thành công!'
    : isSubscription
      ? 'Gói đăng ký đã được kích hoạt!'
      : 'Thanh toán thành công!'

  const subtext = isBoost
    ? 'Tour của bạn sẽ được hiển thị ưu tiên trên trang tìm kiếm.'
    : isSubscription
      ? 'Gói đăng ký của bạn đã được kích hoạt và có hiệu lực ngay.'
      : 'Giao dịch của bạn đã được xử lý thành công.'

  const willRedirect = isBoost || isSubscription || !!bookingId

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center p-4">
      <Card className="max-w-md w-full shadow-lg">
        <CardContent className="p-8 text-center">
          <div className="inline-flex items-center justify-center size-20 rounded-full bg-green-100 text-green-600 mb-6 text-4xl">
            ✓
          </div>
          <h2 className="text-2xl font-bold mb-2">{heading}</h2>
          <p className="text-gray-500 mb-6">{subtext}</p>

          {isBooking && booking && (
            <div className="bg-gray-50 rounded-lg p-4 mb-6 text-left space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Tour</span>
                <span className="font-medium text-right max-w-[60%]">{booking.tourTitle}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Số tiền</span>
                <span className="font-bold text-green-600">{formatVND(booking.totalPrice)}</span>
              </div>
            </div>
          )}

          {txnRef && (
            <p className="text-xs text-gray-400 mb-6">Mã giao dịch: {txnRef}</p>
          )}

          {willRedirect && (
            <p className="text-xs text-gray-400 mb-4">
              Tự động chuyển hướng sau {isBooking ? 5 : 3} giây...
            </p>
          )}

          <div className="space-y-3">
            {isBooking && bookingId && (
              <Button
                className="w-full bg-orange-600 hover:bg-orange-700"
                onClick={() => navigate(`/booking-confirmation/${bookingId}`, { replace: true })}
              >
                Xem chi tiết đơn đặt
              </Button>
            )}

            {isBoost && (
              <Button
                className="w-full bg-orange-600 hover:bg-orange-700"
                onClick={() => navigate('/guide', { replace: true, state: { tab: 'boosts' } })}
              >
                Xem danh sách boost
              </Button>
            )}

            {isSubscription && (
              <Button
                className="w-full bg-orange-600 hover:bg-orange-700"
                onClick={() => navigate('/subscription', { replace: true })}
              >
                Xem gói đăng ký của tôi
              </Button>
            )}

            {isBooking && (
              <Button
                variant="outline"
                className="w-full"
                onClick={() => navigate('/my-bookings', { replace: true })}
              >
                Xem tất cả đơn của tôi
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
