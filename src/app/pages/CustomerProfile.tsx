import { useState, useRef } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { Navigate } from 'react-router'
import { useMutation } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Camera, Loader2 } from 'lucide-react'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Label } from '../components/ui/label'
import { uploadAvatar } from '@/api/users'

export function CustomerProfile() {
  const { user, profile, updateProfile, refreshProfile } = useAuth()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [formData, setFormData] = useState({ name: '', phone: '' })

  if (!user) return <Navigate to="/login" />

  const handleEdit = () => {
    setFormData({ name: user.name, phone: user.phone || '' })
    setIsEditing(true)
  }

  const saveMutation = useMutation({
    mutationFn: () => updateProfile({ name: formData.name, phone: formData.phone }),
    onSuccess: () => {
      setIsEditing(false)
      toast.success('Cập nhật hồ sơ thành công!')
    },
    onError: (err: Error) => toast.error(err.message),
  })

  const avatarMutation = useMutation({
    mutationFn: (file: File) => uploadAvatar(file),
    onSuccess: async () => {
      await refreshProfile()
      toast.success('Đã cập nhật ảnh đại diện!')
    },
    onError: (err: Error) => toast.error(err.message),
  })

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) avatarMutation.mutate(file)
    e.target.value = ''
  }

  return (
    <div className="container max-w-2xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Hồ sơ cá nhân</h1>

      <div className="bg-white rounded-xl border p-8">
        {/* Avatar */}
        <div className="flex items-center gap-6 mb-8">
          <button
            type="button"
            className="relative group shrink-0"
            onClick={() => fileInputRef.current?.click()}
            disabled={avatarMutation.isPending}
            title="Đổi ảnh đại diện"
          >
            {user.avatar ? (
              <img src={user.avatar} alt={user.name} className="size-24 rounded-full object-cover border-4 border-orange-100" />
            ) : (
              <div className="size-24 rounded-full bg-orange-100 flex items-center justify-center text-3xl font-bold text-orange-600 border-4 border-orange-200">
                {user.name.charAt(0).toUpperCase()}
              </div>
            )}
            <div className="absolute inset-0 rounded-full bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              {avatarMutation.isPending
                ? <Loader2 className="size-6 text-white animate-spin" />
                : <Camera className="size-6 text-white" />}
            </div>
          </button>
          <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={handleAvatarChange} />
          <div>
            <h2 className="text-xl font-semibold">{user.name}</h2>
            <p className="text-gray-500">{user.email}</p>
            <span className="inline-block mt-1 px-2 py-0.5 text-xs bg-orange-100 text-orange-700 rounded-full">
              {user.role === 'guide' ? 'Hướng dẫn viên' : 'Khách du lịch'}
            </span>
            <p className="text-xs text-gray-400 mt-1">Nhấn vào ảnh để thay đổi</p>
          </div>
        </div>

        {/* Profile Info */}
        {isEditing ? (
          <div className="space-y-4">
            <div>
              <Label>Họ và tên</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="mt-1"
              />
            </div>
            <div>
              <Label>Số điện thoại</Label>
              <Input
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="mt-1"
                placeholder="0912345678"
              />
            </div>
            <div className="flex gap-3">
              <Button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending}>
                {saveMutation.isPending ? 'Đang lưu...' : 'Lưu thay đổi'}
              </Button>
              <Button variant="outline" onClick={() => setIsEditing(false)}>Hủy</Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="p-3 bg-gray-50 rounded-lg">
              <p className="text-xs text-gray-500">Họ và tên</p>
              <p className="font-medium">{user.name}</p>
            </div>
            <div className="p-3 bg-gray-50 rounded-lg">
              <p className="text-xs text-gray-500">Email</p>
              <p className="font-medium">{user.email}</p>
            </div>
            <div className="p-3 bg-gray-50 rounded-lg">
              <p className="text-xs text-gray-500">Số điện thoại</p>
              <p className="font-medium">{user.phone || 'Chưa cập nhật'}</p>
            </div>
            <Button onClick={handleEdit} className="w-full">Chỉnh sửa hồ sơ</Button>
          </div>
        )}
      </div>
    </div>
  )
}
