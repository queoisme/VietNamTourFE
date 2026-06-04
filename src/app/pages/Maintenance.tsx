import { MapPin, Clock, Wrench } from 'lucide-react'

export function Maintenance() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 flex items-center justify-center p-4">
      <div className="max-w-lg w-full text-center">
        {/* Logo / Brand */}
        <div className="flex items-center justify-center gap-2 mb-8">
          <MapPin className="h-8 w-8 text-emerald-600" />
          <span className="text-2xl font-bold text-emerald-700">Vietnam Tours</span>
        </div>

        {/* Illustration */}
        <div className="relative mb-8">
          <div className="w-32 h-32 bg-emerald-100 rounded-full mx-auto flex items-center justify-center shadow-lg">
            <Wrench className="h-16 w-16 text-emerald-500" />
          </div>
          <div className="absolute top-0 right-1/4 w-4 h-4 bg-yellow-400 rounded-full animate-bounce" />
          <div className="absolute bottom-2 left-1/4 w-3 h-3 bg-teal-400 rounded-full animate-bounce delay-300" />
        </div>

        {/* Heading */}
        <h1 className="text-3xl font-bold text-gray-800 mb-3">
          Đang bảo trì hệ thống
        </h1>
        <p className="text-gray-500 text-lg mb-2">
          Website đang được nâng cấp để mang lại trải nghiệm tốt hơn cho bạn.
        </p>
        <p className="text-gray-400 text-sm mb-8">
          Chúng tôi sẽ sớm trở lại. Cảm ơn bạn đã kiên nhẫn chờ đợi!
        </p>

        {/* Estimated time */}
        <div className="bg-white rounded-2xl shadow-sm border border-emerald-100 p-5 mb-8 inline-flex items-center gap-3">
          <Clock className="h-5 w-5 text-emerald-500 shrink-0" />
          <span className="text-gray-600 text-sm">
            Dự kiến hoàn thành: <strong className="text-emerald-700">vài giờ tới</strong>
          </span>
        </div>

        {/* Contact */}
        <p className="text-gray-400 text-sm">
          Cần hỗ trợ khẩn cấp? Liên hệ{' '}
          <a
            href="mailto:support@vietnamtours.cloud"
            className="text-emerald-600 hover:underline font-medium"
          >
            support@vietnamtours.cloud
          </a>
        </p>
      </div>
    </div>
  )
}
