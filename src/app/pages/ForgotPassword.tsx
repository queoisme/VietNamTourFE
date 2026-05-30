import { FormEvent, useState } from 'react'
import { Link } from 'react-router'
import { forgotPassword, resetPassword } from '@/api/auth'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Label } from '../components/ui/label'

export function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [otp, setOtp] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [step, setStep] = useState<'request' | 'reset' | 'done'>('request')

  const handleRequestOtp = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError('')
    setIsSubmitting(true)

    try {
      await forgotPassword({ email })
      setStep('reset')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không gửi được email khôi phục mật khẩu')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleResetPassword = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError('')

    if (!/^\d{6}$/.test(otp)) {
      setError('OTP phải gồm đúng 6 chữ số')
      return
    }

    if (newPassword.length < 8) {
      setError('Mật khẩu phải có ít nhất 8 ký tự')
      return
    }

    if (newPassword !== confirmPassword) {
      setError('Mật khẩu xác nhận không khớp')
      return
    }

    setIsSubmitting(true)
    try {
      await resetPassword({
        email,
        otp,
        newPassword,
      })
      setStep('done')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không đặt lại được mật khẩu. Vui lòng thử lại.')
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
          <h1 className="text-2xl font-bold text-gray-900">Quên mật khẩu</h1>
          <p className="text-gray-600 mt-2">Nhập email để nhận mã OTP đặt lại mật khẩu</p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-md text-sm">
            {error}
          </div>
        )}

        {step === 'reset' ? (
          <div className="space-y-4">
            <div className="p-4 bg-green-50 border border-green-200 rounded-md text-sm text-green-700 flex gap-3">
              <span className="shrink-0 mt-0.5">✓</span>
              <div>
                <p className="font-medium">Đã gửi mã OTP khôi phục mật khẩu</p>
                <p className="mt-1">
                  Vui lòng kiểm tra hộp thư của <strong>{email}</strong> để lấy mã OTP 6 số.
                </p>
              </div>
            </div>
            <form onSubmit={handleResetPassword} className="space-y-4">
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
                <Label htmlFor="new-password">Mật khẩu mới</Label>
                <Input
                  id="new-password"
                  type="password"
                  placeholder="********"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="mt-1"
                  required
                />
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
                {isSubmitting ? 'Đang cập nhật...' : 'Xác nhận đặt lại mật khẩu'}
              </Button>

              <Button
                type="button"
                variant="outline"
                className="w-full"
                disabled={isSubmitting}
                onClick={() => {
                  setOtp('')
                  setStep('request')
                }}
              >
                Gửi lại mã OTP
              </Button>
            </form>
          </div>
        ) : step === 'done' ? (
          <div className="space-y-4">
            <div className="p-4 bg-green-50 border border-green-200 rounded-md text-sm text-green-700 flex gap-3">
              <span className="shrink-0 mt-0.5">✓</span>
              <div>
                <p className="font-medium">Đặt lại mật khẩu thành công</p>
                <p className="mt-1">Bạn có thể đăng nhập lại với mật khẩu mới.</p>
              </div>
            </div>
            <Button asChild className="w-full">
              <Link to="/login">Đi tới đăng nhập</Link>
            </Button>
          </div>
        ) : (
          <form onSubmit={handleRequestOtp} className="space-y-4">
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

            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? 'Đang gửi...' : 'Gửi mã OTP đặt lại mật khẩu'}
            </Button>
          </form>
        )}

        <div className="mt-6 text-center text-sm">
          <Link to="/login" className="text-orange-600 hover:text-orange-700">
            ← Quay lại đăng nhập
          </Link>
        </div>
      </div>
    </div>
  )
}

