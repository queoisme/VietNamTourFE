import { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Skeleton } from '../components/ui/skeleton';
import { toast } from 'sonner';
import { Camera, Loader2, Plus, Trash2 } from 'lucide-react';
import { getMyGuideProfile, updateMyGuideProfile, uploadAvatar } from '@/api/users';
import { updateMe } from '@/api/users';
import { Certification } from '@/types/user';

export function GuideProfile() {
  const { user, updateProfile, refreshProfile } = useAuth();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: guideProfile, isLoading } = useQuery({
    queryKey: ['my-guide-profile'],
    queryFn: getMyGuideProfile,
    enabled: !!user,
  });

  const [formData, setFormData] = useState({
    name: user?.name || '',
    phone: user?.phone || '',
    bio: '',
    languages: '',
    experienceYears: '0',
  });

  const [certifications, setCertifications] = useState<Certification[]>([]);

  // Populate form when guide profile loads
  useEffect(() => {
    if (guideProfile) {
      setFormData((p) => ({
        ...p,
        bio: guideProfile.bio ?? '',
        languages: guideProfile.languages.join(', '),
        experienceYears: guideProfile.experienceYears.toString(),
      }));
      setCertifications(guideProfile.certifications ?? []);
    }
  }, [guideProfile]);

  const addCert = () =>
    setCertifications((p) => [...p, { name: '', issuedBy: '', year: new Date().getFullYear() }]);

  const removeCert = (i: number) =>
    setCertifications((p) => p.filter((_, idx) => idx !== i));

  const updateCert = (i: number, field: keyof Certification, value: string | number) =>
    setCertifications((p) => p.map((c, idx) => idx === i ? { ...c, [field]: value } : c));

  const avatarMutation = useMutation({
    mutationFn: (file: File) => uploadAvatar(file),
    onSuccess: async () => {
      await refreshProfile();
      toast.success('Cập nhật ảnh đại diện thành công!');
    },
    onError: (err: Error) => toast.error(err.message || 'Không thể tải ảnh lên'),
  });

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) avatarMutation.mutate(file);
    e.target.value = '';
  };

  const updateMutation = useMutation({
    mutationFn: async () => {
      await Promise.all([
        updateMyGuideProfile({
          bio: formData.bio || undefined,
          experienceYears: parseInt(formData.experienceYears) || 0,
          languages: formData.languages.split(',').map((l) => l.trim()).filter(Boolean),
          certifications: certifications.filter((c) => c.name.trim()),
        }),
        updateProfile({ name: formData.name, phone: formData.phone }),
      ]);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-guide-profile'] });
      toast.success('Cập nhật hồ sơ thành công!');
    },
    onError: (err: Error) => toast.error(err.message || 'Có lỗi xảy ra'),
  });

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-3xl space-y-4">
        {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-32 rounded-xl" />)}
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      {/* Profile Form */}
      <div className="bg-white rounded-lg shadow-lg p-6 md:p-8">
        <div className="flex items-center gap-4 mb-8">
          <button
            type="button"
            className="relative group shrink-0"
            onClick={() => fileInputRef.current?.click()}
            disabled={avatarMutation.isPending}
            title="Đổi ảnh đại diện"
          >
            {user?.avatar ? (
              <img src={user.avatar} alt={user.name} className="size-20 rounded-full object-cover" />
            ) : (
              <div className="size-20 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center text-white text-3xl font-bold">
                {user?.name?.charAt(0).toUpperCase()}
              </div>
            )}
            <div className="absolute inset-0 rounded-full bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              {avatarMutation.isPending
                ? <Loader2 className="size-6 text-white animate-spin" />
                : <Camera className="size-6 text-white" />}
            </div>
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={handleAvatarChange}
          />
          <div>
            <h1 className="text-2xl font-bold">Hồ sơ của tôi</h1>
            <p className="text-gray-600">Quản lý thông tin cá nhân và hồ sơ hướng dẫn viên</p>
            <p className="text-xs text-gray-400 mt-0.5">Nhấn vào ảnh để thay đổi</p>
          </div>
        </div>

        <form onSubmit={(e) => { e.preventDefault(); updateMutation.mutate(); }} className="space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <Label>Họ và tên</Label>
              <Input value={formData.name} onChange={(e) => setFormData(p => ({ ...p, name: e.target.value }))} className="mt-1" required />
            </div>
            <div>
              <Label>Số điện thoại</Label>
              <Input type="tel" placeholder="+84 xxx xxx xxx" value={formData.phone} onChange={(e) => setFormData(p => ({ ...p, phone: e.target.value }))} className="mt-1" />
            </div>
          </div>

          <div>
            <Label>Năm kinh nghiệm</Label>
            <Input type="number" min="0" value={formData.experienceYears} onChange={(e) => setFormData(p => ({ ...p, experienceYears: e.target.value }))} className="mt-1" />
          </div>

          <div>
            <Label>Giới thiệu bản thân</Label>
            <Textarea
              placeholder="Viết vài dòng giới thiệu về bản thân và kinh nghiệm làm hướng dẫn viên..."
              value={formData.bio}
              onChange={(e) => setFormData(p => ({ ...p, bio: e.target.value }))}
              className="mt-1 min-h-[120px]"
            />
          </div>

          <div>
            <Label>Ngôn ngữ</Label>
            <Input
              placeholder="Tiếng Việt, English, 日本語 (phân cách bằng dấu phẩy)"
              value={formData.languages}
              onChange={(e) => setFormData(p => ({ ...p, languages: e.target.value }))}
              className="mt-1"
            />
            <p className="text-xs text-gray-500 mt-1">Các ngôn ngữ bạn có thể giao tiếp</p>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <Label>Chứng chỉ</Label>
              <Button type="button" variant="outline" size="sm" onClick={addCert}>
                <Plus className="size-3.5 mr-1" />
                Thêm chứng chỉ
              </Button>
            </div>
            {certifications.length === 0 ? (
              <p className="text-sm text-gray-400 py-3 text-center border rounded-lg">Chưa có chứng chỉ nào</p>
            ) : (
              <div className="space-y-3">
                {certifications.map((cert, i) => (
                  <div key={i} className="grid grid-cols-[1fr_1fr_80px_32px] gap-2 items-start">
                    <div>
                      <Input
                        placeholder="Tên chứng chỉ"
                        value={cert.name}
                        onChange={(e) => updateCert(i, 'name', e.target.value)}
                      />
                    </div>
                    <div>
                      <Input
                        placeholder="Nơi cấp"
                        value={cert.issuedBy}
                        onChange={(e) => updateCert(i, 'issuedBy', e.target.value)}
                      />
                    </div>
                    <div>
                      <Input
                        type="number"
                        placeholder="Năm"
                        min={1990}
                        max={new Date().getFullYear()}
                        value={cert.year}
                        onChange={(e) => updateCert(i, 'year', parseInt(e.target.value) || cert.year)}
                      />
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="text-red-400 hover:text-red-600 hover:bg-red-50 mt-0.5"
                      onClick={() => removeCert(i)}
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
            <p className="text-xs text-gray-500 mt-1">Các chứng chỉ, bằng cấp liên quan đến du lịch và hướng dẫn viên</p>
          </div>

          <div className="flex gap-3 pt-4">
            <Button type="submit" disabled={updateMutation.isPending} className="flex-1 bg-orange-600 hover:bg-orange-700">
              {updateMutation.isPending ? 'Đang lưu...' : 'Lưu thay đổi'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
