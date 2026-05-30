import { useSearchParams, useNavigate } from 'react-router'
import { Button } from '../components/ui/button'
import { Card, CardContent } from '../components/ui/card'

const MOMO_ERROR_MESSAGES: Record<string, string> = {
  '1001': 'Số dư ví MoMo không đủ để thực hiện giao dịch.',
  '1002': 'Giao dịch bị từ chối bởi nhà phát hành.',
  '1003': 'Giao dịch đã hết hạn.',
  '1004': 'Số tiền giao dịch vượt quá hạn mức.',
  '1005': 'URL không hợp lệ hoặc link thanh toán hết hạn.',
  '1006': 'Giao dịch bị từ chối bởi người dùng.',
  '1007': 'Tài khoản MoMo chưa được kích hoạt.',
  '1026': 'Giao dịch bị hạn chế theo quy định.',
  '1080': 'Hoàn tiền không thành công.',
  '1081': 'Hoàn tiền bị từ chối — giao dịch gốc không thành công.',
  '2001': 'Giao dịch thất bại — lỗi liên kết ngân hàng.',
  '2007': 'Dịch vụ tạm ngưng.',
  '3001': 'Xác thực thất bại.',
  '3002': 'Chưa được phép thực hiện giao dịch.',
  '4001': 'Giao dịch bị hạn chế do tài khoản chưa xác minh.',
  '9000': 'Giao dịch đã được xác nhận thành công (chờ xử lý).',
}

export function PaymentFailed() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const code = searchParams.get('code') ?? ''
  const bookingId = sessionStorage.getItem('momo_booking_id')

  const errorMessage =
    MOMO_ERROR_MESSAGES[code] || 'Giao dịch không thể hoàn tất. Vui lòng thử lại.'

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-rose-100 flex items-center justify-center p-4">
      <Card className="max-w-md w-full shadow-lg">
        <CardContent className="p-8 text-center">
          <div className="inline-flex items-center justify-center size-20 rounded-full bg-red-100 text-red-600 mb-6 text-4xl">
            ✗
          </div>
          <h2 className="text-2xl font-bold mb-2">Thanh toán thất bại</h2>
          <p className="text-gray-600 mb-2">{errorMessage}</p>
          {code && (
            <p className="text-xs text-gray-400 mb-6">Mã lỗi: {code}</p>
          )}

          <div className="space-y-3">
            {bookingId && (
              <Button
                className="w-full bg-orange-600 hover:bg-orange-700"
                onClick={() => navigate(`/payment/vnpay/${bookingId}`, { replace: true })}
              >
                Thử lại thanh toán
              </Button>
            )}
            <Button
              variant="outline"
              className="w-full"
              onClick={() => navigate('/my-bookings', { replace: true })}
            >
              Xem đơn của tôi
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
