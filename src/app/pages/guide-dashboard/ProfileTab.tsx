import { SectionHeader } from './components/SectionHeader'
import { GuideProfile } from '../GuideProfile'

export function ProfileTab() {
  return (
    <div className="space-y-6">
      <SectionHeader
        tag="Hồ sơ"
        title="Hồ sơ hướng dẫn viên"
        description="Cập nhật thông tin cá nhân, kinh nghiệm và chứng chỉ để thu hút khách hàng."
        chip={
          <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700">
            Đã xác minh
          </span>
        }
      />
      <GuideProfile embedded />
    </div>
  )
}
