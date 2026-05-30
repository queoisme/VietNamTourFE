import { FormEvent, useMemo, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router'
import { resetPassword } from '@/api/auth'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Label } from '../components/ui/label'

export function ResetPassword() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [email, setEmail] = useState(searchParams.get('email') ?? '')
  const [otp, setOtp] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)

  const isPasswordValid = useMemo(() => password.length >= 8, [password])

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError('')

    if (!email) {
      setError('Vui lòng nhập email')
      return
    }

    if (!/^\d{6}$/.test(otp)) {
      setError('OTP phải gồm đúng 6 chữ số')
      return
    }

    if (!isPasswordValid) {
      setError('Mật khẩu phải có ít nhất 8 ký tự')
      return
    }

    if (password !== confirmPassword) {
      setError('Mật khẩu xác nhận không khớp')
      return
    }

    setIsSubmitting(true)

    try {
      await resetPassword({
        email,
        otp,
        newPassword: password,
      })

      setIsSuccess(true)
      setTimeout(() => {
        navigate('/login', { replace: true })
      }, 1500)
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Không đặt lại được mật khẩu. Vui lòng yêu cầu mã OTP mới.',
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 to-orange-100 px-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-xl p-8">
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2 mb-4">
            <span className="font-bold text-2xl">VietNamTours</span>
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">Đặt lại mật khẩu</h1>
          <p className="text-gray-600 mt-2">Nhập email, mã OTP và mật khẩu mới cho tài khoản của bạn</p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-md text-sm">
            {error}
          </div>
        )}

        {isSuccess ? (
          <div className="p-4 bg-green-50 border border-green-200 rounded-md text-sm text-green-700 flex gap-3">
            <span className="shrink-0 mt-0.5">✓</span>
            <div>
              <p className="font-medium">Đặt lại mật khẩu thành công</p>
              <p className="mt-1">Đang chuyển đến trang đăng nhập...</p>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="email@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1"
                required
              />
            </div>

            <div>
              <Label htmlFor="otp">Mã OTP</Label>
              <Input
                id="otp"
                type="text"
                placeholder="123456"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                className="mt-1 text-center text-lg tracking-widest"
                maxLength={6}
                required
              />
            </div>

            <div>
              <Label htmlFor="password">Mật khẩu mới</Label>
              <Input
                id="password"
                type="password"
                placeholder="********"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1"
                required
              />
              <p className="text-xs text-gray-500 mt-1">Tối thiểu 8 ký tự</p>
            </div>

            <div>
              <Label htmlFor="confirm-password">Xác nhận mật khẩu</Label>
              <Input
                id="confirm-password"
                type="password"
                placeholder="********"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="mt-1"
                required
              />
            </div>

            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? 'Đang cập nhật...' : 'Cập nhật mật khẩu'}
            </Button>
          </form>
        )}

        <div className="mt-6 text-center text-sm">
          <Link to="/forgot-password" className="text-orange-600 hover:text-orange-700">
            Gửi lại mã OTP
          </Link>
        </div>
      </div>
    </div>
  )
}

