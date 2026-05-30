import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router'
import { useQuery } from '@tanstack/react-query'
import { toast } from 'sonner'
import { createMomoPayment } from '@/api/payments'
import { getBooking } from '@/api/bookings'
import { formatVND } from '@/lib/constants'
import { Button } from '../components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Skeleton } from '../components/ui/skeleton'

export function MomoPayment() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [isCreatingPayment, setIsCreatingPayment] = useState(false)
  const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(null)

  const { data: booking, isLoading } = useQuery({
    queryKey: ['booking', id],
    queryFn: () => getBooking(id!),
    enabled: !!id,
  })

  useEffect(() => {
    if (booking?.paymentStatus === 'paid') {
      navigate(`/booking-confirmation/${id}`, { replace: true })
    }
  }, [booking, id, navigate])

  const handlePayment = async () => {
    if (!id) return
    setIsCreatingPayment(true)
    try {
      const res = await createMomoPayment(id)
      setQrCodeUrl(res.qrCodeUrl)
      sessionStorage.setItem('payment_booking_id', id)
      window.location.href = res.payUrl
    } catch (err) {
      toast.error((err as Error).message || 'Không thể tạo thanh toán MoMo')
    } finally {
      setIsCreatingPayment(false)
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
          <CardTitle>Thanh toán qua MoMo</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Tour</span>
            <span className="font-medium">{booking.tourTitle}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Ngày tour</span>
            <span className="font-medium">{new Date(booking.tourDate).toLocaleDateString('vi-VN')}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Số người</span>
            <span className="font-medium">{booking.numPeople}</span>
          </div>
          <div className="flex justify-between border-t pt-3">
            <span className="font-semibold">Tổng cộng</span>
            <span className="font-bold text-lg text-primary">{formatVND(booking.totalPrice)}</span>
          </div>

          {qrCodeUrl && (
            <div className="flex justify-center">
              <img src={qrCodeUrl} alt="MoMo QR Code" className="w-48 h-48" />
            </div>
          )}

          <Button className="w-full" onClick={handlePayment} disabled={isCreatingPayment}>
            {isCreatingPayment ? 'Đang xử lý...' : 'Thanh toán với MoMo'}
          </Button>
          <Button variant="outline" className="w-full" onClick={() => navigate('/my-bookings')}>
            Hủy
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
