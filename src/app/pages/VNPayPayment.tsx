import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router'
import { useQuery } from '@tanstack/react-query'
import { toast } from 'sonner'
import { createVNPayPayment } from '@/api/payments'
import { getBooking } from '@/api/bookings'
import { formatVND } from '@/lib/constants'
import { Button } from '../components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Skeleton } from '../components/ui/skeleton'

export function VNPayPayment() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [isPending, setIsPending] = useState(false)

  const { data: booking, isLoading } = useQuery({
    queryKey: ['booking', id],
    queryFn: () => getBooking(id!),
    enabled: !!id,
  })

  useEffect(() => {
    if (!booking) return
    if (booking.paymentStatus === 'paid') {
      navigate(`/booking-confirmation/${id}`, { replace: true })
    }
    if (booking.status === 'cancelled' || booking.status === 'rejected') {
      navigate(`/booking-confirmation/${id}`, { replace: true })
    }
  }, [booking, id, navigate])

  const handlePayment = async () => {
    if (!id) return
    setIsPending(true)
    try {
      const res = await createVNPayPayment(id)
      sessionStorage.setItem('payment_booking_id', id)
      window.location.href = res.payUrl
    } catch (err) {
      toast.error((err as Error).message || 'Không thể tạo thanh toán VNPay')
    } finally {
      setIsPending(false)
    }
  }

  if (isLoading) {
    return (
      <div className="container max-w-lg mx-auto py-10">
        <Skeleton className="h-64 w-full rounded-xl" />
      </div>
    )
  }

  if (!booking) {
    return (
      <div className="container py-10 text-center">
        <p>Không tìm thấy đơn đặt tour.</p>
        <Button className="mt-4" onClick={() => navigate('/my-bookings')}>
          Xem đơn của tôi
        </Button>
      </div>
    )
  }

  return (
    <div className="container max-w-lg mx-auto py-10">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-3">
            <img
              src="https://cdn.haitrieu.com/wp-content/uploads/2022/10/Logo-VNPAY-QR-1.png"
              alt="VNPay"
              className="h-8 object-contain"
            />
            Thanh toán qua VNPay
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Tour</span>
            <span className="font-medium text-right max-w-[60%]">{booking.tourTitle}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Ngày tour</span>
            <span className="font-medium">
              {new Date(booking.tourDate).toLocaleDateString('vi-VN')}
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Số người</span>
            <span className="font-medium">{booking.numPeople}</span>
          </div>
          <div className="flex justify-between border-t pt-3">
            <span className="font-semibold">Tổng cộng</span>
            <span className="font-bold text-lg text-orange-600">{formatVND(booking.totalPrice)}</span>
          </div>

          <p className="text-xs text-muted-foreground text-center">
            Bạn sẽ được chuyển sang cổng thanh toán VNPay để hoàn tất giao dịch.
          </p>

          <Button
            className="w-full bg-blue-600 hover:bg-blue-700"
            onClick={handlePayment}
            disabled={isPending}
          >
            {isPending ? 'Đang xử lý...' : 'Thanh toán với VNPay'}
          </Button>
          <Button variant="outline" className="w-full" onClick={() => navigate('/my-bookings')}>
            Hủy
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
