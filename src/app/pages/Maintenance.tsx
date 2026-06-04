import { useEffect, useState } from 'react'
import { MapPin, Wrench } from 'lucide-react'
import { supabase } from '@/lib/supabase'

interface TimeLeft {
  h: number
  m: number
  s: number
}

function computeTimeLeft(endTime: string, durationMs: number): TimeLeft {
  const endMs = new Date(endTime).getTime()
  const now = Date.now()
  const remaining = endMs > now
    ? endMs - now
    : durationMs - ((now - endMs) % durationMs)
  const totalSec = Math.max(0, Math.floor(remaining / 1000))
  return {
    h: Math.floor(totalSec / 3600),
    m: Math.floor((totalSec % 3600) / 60),
    s: totalSec % 60,
  }
}

const pad = (n: number) => String(n).padStart(2, '0')

export function Maintenance() {
  const [endTime, setEndTime] = useState('')
  const [durationMs, setDurationMs] = useState(0)
  const [timeLeft, setTimeLeft] = useState<TimeLeft | null>(null)

  useEffect(() => {
    supabase
      .from('site_config')
      .select('key, value')
      .in('key', ['maintenance_end_time', 'maintenance_countdown_minutes'])
      .then(({ data }) => {
        const et = data?.find(r => r.key === 'maintenance_end_time')?.value ?? ''
        const dm = parseInt(data?.find(r => r.key === 'maintenance_countdown_minutes')?.value ?? '0') * 60 * 1000
        setEndTime(et)
        setDurationMs(dm)
      })
  }, [])

  useEffect(() => {
    if (!endTime || !durationMs) return
    const tick = () => setTimeLeft(computeTimeLeft(endTime, durationMs))
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [endTime, durationMs])

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 flex items-center justify-center p-4">
      <div className="max-w-lg w-full text-center">
        {/* Brand */}
        <div className="flex items-center justify-center gap-2 mb-8">
          <MapPin className="h-8 w-8 text-emerald-600" />
          <span className="text-2xl font-bold text-emerald-700">VietNamTours</span>
        </div>

        {/* Icon */}
        <div className="relative mb-8">
          <div className="w-32 h-32 bg-emerald-100 rounded-full mx-auto flex items-center justify-center shadow-lg">
            <Wrench className="h-16 w-16 text-emerald-500" />
          </div>
          <div className="absolute top-0 right-1/4 w-4 h-4 bg-yellow-400 rounded-full animate-bounce" />
          <div className="absolute bottom-2 left-1/4 w-3 h-3 bg-teal-400 rounded-full animate-bounce delay-300" />
        </div>

        <h1 className="text-3xl font-bold text-gray-800 mb-3">Đang bảo trì hệ thống</h1>
        <p className="text-gray-500 text-lg mb-2">
          Website đang được nâng cấp để mang lại trải nghiệm tốt hơn cho bạn.
        </p>
        <p className="text-gray-400 text-sm mb-8">
          Chúng tôi sẽ sớm trở lại. Cảm ơn bạn đã kiên nhẫn chờ đợi!
        </p>

        {/* Countdown */}
        {timeLeft ? (
          <div className="bg-white rounded-2xl shadow-sm border border-emerald-100 p-6 mb-8">
            <p className="text-xs text-gray-400 uppercase tracking-widest mb-4">Dự kiến hoàn thành sau</p>
            <div className="flex items-center justify-center gap-2">
              <div className="flex flex-col items-center">
                <div className="w-16 h-16 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-center">
                  <span className="text-2xl font-bold text-emerald-700 font-mono">{pad(timeLeft.h)}</span>
                </div>
                <span className="text-xs text-gray-400 mt-1">Giờ</span>
              </div>
              <span className="text-2xl font-bold text-emerald-300 pb-5">:</span>
              <div className="flex flex-col items-center">
                <div className="w-16 h-16 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-center">
                  <span className="text-2xl font-bold text-emerald-700 font-mono">{pad(timeLeft.m)}</span>
                </div>
                <span className="text-xs text-gray-400 mt-1">Phút</span>
              </div>
              <span className="text-2xl font-bold text-emerald-300 pb-5">:</span>
              <div className="flex flex-col items-center">
                <div className="w-16 h-16 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-center">
                  <span className="text-2xl font-bold text-emerald-700 font-mono">{pad(timeLeft.s)}</span>
                </div>
                <span className="text-xs text-gray-400 mt-1">Giây</span>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-sm border border-emerald-100 p-5 mb-8 inline-flex items-center gap-2">
            <span className="text-gray-400 text-sm">Sẽ hoàn thành sớm nhất có thể</span>
          </div>
        )}

        {/* Contact */}
        <p className="text-gray-400 text-sm">
          Cần hỗ trợ khẩn cấp? Liên hệ{' '}
          <a href="mailto:support@vietnamtours.cloud" className="text-emerald-600 hover:underline font-medium">
            support@vietnamtours.cloud
          </a>
        </p>
      </div>
    </div>
  )
}
