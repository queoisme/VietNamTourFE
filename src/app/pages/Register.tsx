import { useState } from 'react'
import { Link, useNavigate } from 'react-router'
import { useAuth } from '../contexts/AuthContext'
import { verifyEmail, resendVerifyEmail } from '@/api/auth'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Label } from '../components/ui/label'

export function Register() {
  const { register } = useAuth()
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [step, setStep] = useState<'register' | 'verify'>('register')
  const [otp, setOtp] = useState('')
  const [resendCooldown, setResendCooldown] = useState(0)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (password !== confirmPassword) return setError('Mật khẩu xác nhận không khớp')
    if (password.length < 8) return setError('Mật khẩu phải có ít nhất 8 ký tự')
    setLoading(true)
    try {
      await register(email, password, name)
      setStep('verify')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Đăng ký thất bại')
    } finally {
      setLoading(false)
    }
  }

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await verifyEmail({ email, otp })
      navigate('/login', { state: { verified: true } })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Mã OTP không hợp lệ')
    } finally {
      setLoading(false)
    }
  }

  const handleResend = async () => {
    if (resendCooldown > 0) return
    try {
      await resendVerifyEmail(email)
      setResendCooldown(60)
      const timer = setInterval(() => {
        setResendCooldown((c) => {
          if (c <= 1) { clearInterval(timer); return 0 }
          return c - 1
        })
      }, 1000)
    } catch {}
  }

  if (step === 'verify') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 to-orange-100 px-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-xl p-8">
          <div className="text-center mb-8">
            <p className="text-4xl mb-3">✉️</p>
            <h2 className="text-2xl font-bold text-gray-900">Xác nhận email</h2>
            <p className="text-gray-600 mt-2 text-sm">
              Mã OTP đã được gửi đến <strong>{email}</strong>. Kiểm tra hộp thư (kể cả spam).
            </p>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-md text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleVerify} className="space-y-4">
            <div>
              <Label htmlFor="otp">Mã OTP (6 số)</Label>
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

            <Button type="submit" className="w-full bg-orange-600 hover:bg-orange-700" disabled={loading || otp.length < 6}>
              {loading ? 'Đang xác nhận...' : 'Xác nhận'}
            </Button>
          </form>

          <div className="mt-4 text-center text-sm">
            <span className="text-gray-600">Không nhận được mã? </span>
            <button
              onClick={handleResend}
              disabled={resendCooldown > 0}
              className="text-orange-600 hover:text-orange-700 font-medium disabled:text-gray-400"
            >
              {resendCooldown > 0 ? `Gửi lại (${resendCooldown}s)` : 'Gửi lại'}
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 to-orange-100 px-4 py-12">
      <div className="max-w-md w-full bg-white rounded-lg shadow-xl p-8">
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2 mb-4">
            <span className="font-bold text-2xl">VietNamTours</span>
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">Đăng ký tài khoản</h1>
          <p className="text-gray-600 mt-2">Tham gia cộng đồng du lịch Việt Nam</p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-md text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="name">Họ và tên</Label>
            <Input id="name" type="text" placeholder="Nguyễn Văn A" value={name}
              onChange={(e) => setName(e.target.value)} className="mt-1" required />
          </div>

          <div>
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" placeholder="email@example.com" value={email}
              onChange={(e) => setEmail(e.target.value)} className="mt-1" required />
          </div>

          <div>
            <Label htmlFor="password">Mật khẩu</Label>
            <Input id="password" type="password" placeholder="••••••••" value={password}
              onChange={(e) => setPassword(e.target.value)} className="mt-1" required />
            <p className="text-xs text-gray-500 mt-1">Tối thiểu 8 ký tự</p>
          </div>

          <div>
            <Label htmlFor="confirmPassword">Xác nhận mật khẩu</Label>
            <Input id="confirmPassword" type="password" placeholder="••••••••" value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)} className="mt-1" required />
          </div>

          <div className="text-sm">
            <label className="flex items-start gap-2">
              <input type="checkbox" className="rounded border-gray-300 mt-1" required />
              <span className="text-gray-600">
                Tôi đồng ý với{' '}
                <a href="#" className="text-orange-600 hover:text-orange-700">Điều khoản dịch vụ</a>{' '}
                và{' '}
                <a href="#" className="text-orange-600 hover:text-orange-700">Chính sách bảo mật</a>
              </span>
            </label>
          </div>

          <Button type="submit" className="w-full bg-orange-600 hover:bg-orange-700" disabled={loading}>
            {loading ? 'Đang đăng ký...' : 'Đăng ký'}
          </Button>
        </form>

        <div className="mt-4 text-center text-sm">
          <span className="text-gray-600">Đã có tài khoản? </span>
          <Link to="/login" className="text-orange-600 hover:text-orange-700 font-medium">Đăng nhập</Link>
        </div>
      </div>
    </div>
  )
}

