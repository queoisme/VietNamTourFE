import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Upload, X } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Badge } from '../components/ui/badge';
import { Skeleton } from '../components/ui/skeleton';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'sonner';
import { submitGuideApplication, getMyApplication } from '@/api/guide-applications';
import { uploadIdentityDoc, uploadCertificates } from '@/api/uploads';

export function GuideApplication() {
  const navigate = useNavigate();
  const { user, isAuthenticated, isGuide, refreshProfile } = useAuth();
  const identityRef = useRef<HTMLInputElement>(null);
  const certRef = useRef<HTMLInputElement>(null);
  const [forceShowForm, setForceShowForm] = useState(false);

  const [formData, setFormData] = useState({
    fullName: user?.name || '',
    phone: user?.phone || '',
    location: '',
    bio: '',
    experienceYears: '',
    languages: [] as string[],
  });

  const [languageInput, setLanguageInput] = useState('');
  const [identityFile, setIdentityFile] = useState<File | null>(null);
  const [certFiles, setCertFiles] = useState<File[]>([]);

  // Check if already applied — poll every 30s while pending so approve/reject shows without manual refresh
  const { data: existingApp, isLoading: checkingApp, refetch: refetchApp, isFetching } = useQuery({
    queryKey: ['my-application'],
    queryFn: getMyApplication,
    enabled: isAuthenticated,
    refetchInterval: (query) => query.state.data?.status === 'pending' ? 30_000 : false,
  });

  // Khi đơn được duyệt, tự động refresh role để cập nhật isGuide
  useEffect(() => {
    if (existingApp?.status === 'approved' && !isGuide) {
      refreshProfile()
    }
  }, [existingApp?.status, isGuide, refreshProfile])

  const submitMutation = useMutation({
    mutationFn: async () => {
      if (!identityFile) throw new Error('Vui lòng upload CMND/CCCD');

      const identityDocUrl = await uploadIdentityDoc(identityFile);
      const certificateUrls = certFiles.length > 0 ? await uploadCertificates(certFiles) : [];

      return submitGuideApplication({
        fullName: formData.fullName,
        phone: formData.phone,
        location: formData.location || undefined,
        bio: formData.bio,
        experienceYears: formData.experienceYears ? parseInt(formData.experienceYears) : undefined,
        languages: formData.languages,
        identityDocUrl,
        certificateUrls,
      });
    },
    onSuccess: () => {
      toast.success('Đã nộp hồ sơ thành công! Chúng tôi sẽ xem xét và phản hồi sớm nhất.');
      navigate('/');
    },
    onError: (err: Error) => toast.error(err.message || 'Có lỗi xảy ra khi nộp hồ sơ'),
  });

  const handleAddLanguage = () => {
    const lang = languageInput.trim();
    if (lang && !formData.languages.includes(lang)) {
      setFormData((p) => ({ ...p, languages: [...p.languages, lang] }));
      setLanguageInput('');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAuthenticated) { toast.error('Vui lòng đăng nhập'); navigate('/login'); return; }
    if (!formData.fullName.trim()) return toast.error('Vui lòng nhập họ tên');
    if (!formData.phone.trim()) return toast.error('Vui lòng nhập số điện thoại');
    if (!formData.bio.trim()) return toast.error('Vui lòng nhập giới thiệu bản thân');
    if (formData.languages.length === 0) return toast.error('Vui lòng thêm ít nhất 1 ngôn ngữ');
    if (!identityFile) return toast.error('Vui lòng upload CMND/CCCD');
    submitMutation.mutate();
  };

  if (checkingApp) {
    return (
      <div className="container mx-auto px-4 py-12 max-w-3xl space-y-4">
        {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-32 rounded-xl" />)}
      </div>
    );
  }

  if (existingApp && !forceShowForm) {
    const isPending  = existingApp.status === 'pending'
    const isApproved = existingApp.status === 'approved'
    const isRejected = existingApp.status === 'rejected'

    return (
      <div className="container mx-auto px-4 py-12 max-w-3xl text-center">
        <div className="bg-white rounded-xl border p-8 space-y-5">
          {isApproved ? (
            <div className="flex flex-col items-center gap-2">
              <div className="flex size-16 items-center justify-center rounded-full bg-emerald-100">
                <svg className="size-8 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-emerald-700">Hồ sơ đã được duyệt!</h2>
              <p className="text-gray-600">Chúc mừng! Bạn đã trở thành hướng dẫn viên trên VietNamTours.</p>
            </div>
          ) : (
            <h2 className="text-2xl font-bold">
              {isPending ? 'Đang chờ xét duyệt' : 'Hồ sơ bị từ chối'}
            </h2>
          )}

          <div className="inline-block">
            <Badge
              variant={isApproved ? 'default' : isRejected ? 'destructive' : 'secondary'}
              className="text-sm px-4 py-1.5"
            >
              {isPending ? '⏳ Đang chờ xét duyệt' : isApproved ? '✅ Đã được duyệt' : '❌ Bị từ chối'}
            </Badge>
          </div>

          {isRejected && existingApp.rejectionReason && (
            <div className="bg-red-50 text-red-700 rounded-lg p-4 text-sm text-left">
              <strong>Lý do từ chối:</strong> {existingApp.rejectionReason}
            </div>
          )}

          <div className="flex flex-wrap justify-center gap-3 pt-2">
            {isApproved && (
              <Button
                className="bg-orange-600 hover:bg-orange-700"
                onClick={async () => {
                  await refreshProfile()
                  navigate('/guide')
                }}
              >
                Vào Dashboard Guide →
              </Button>
            )}

            {isRejected && (
              <Button
                className="bg-orange-600 hover:bg-orange-700"
                onClick={() => setForceShowForm(true)}
              >
                Nộp lại hồ sơ
              </Button>
            )}

            {isPending && (
              <Button
                variant="outline"
                disabled={isFetching}
                onClick={async () => {
                  const result = await refetchApp()
                  const status = result.data?.status
                  if (status === 'approved') {
                    await refreshProfile()
                    toast.success('Hồ sơ đã được duyệt! Chào mừng bạn trở thành hướng dẫn viên.')
                  } else if (status === 'rejected') {
                    toast.error('Hồ sơ của bạn đã bị từ chối. Vui lòng xem lý do bên dưới.')
                  } else {
                    toast.info('Hồ sơ vẫn đang chờ xét duyệt. Chúng tôi sẽ phản hồi sớm nhất có thể.')
                  }
                }}
              >
                {isFetching ? 'Đang kiểm tra...' : 'Kiểm tra trạng thái'}
              </Button>
            )}

            <Button onClick={() => navigate('/')} variant="outline">Quay về trang chủ</Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="py-12 bg-gray-50 min-h-screen">
      <div className="container mx-auto px-4">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-8">
            <Badge className="mb-4 bg-orange-600">Đăng ký hướng dẫn viên</Badge>
            <h1 className="text-4xl mb-4">Đăng ký làm Hướng dẫn viên</h1>
            <p className="text-gray-600 text-lg">Điền đầy đủ thông tin bên dưới để bắt đầu hành trình chia sẻ tour của bạn</p>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="space-y-6">
              {/* Personal Info */}
              <Card>
                <CardHeader>
                  <CardTitle>Thông tin cá nhân</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label>Họ và tên <span className="text-red-500">*</span></Label>
                      <Input value={formData.fullName} onChange={(e) => setFormData(p => ({ ...p, fullName: e.target.value }))} placeholder="Nguyễn Văn A" required />
                    </div>
                    <div>
                      <Label>Số điện thoại <span className="text-red-500">*</span></Label>
                      <Input value={formData.phone} onChange={(e) => setFormData(p => ({ ...p, phone: e.target.value }))} placeholder="0912345678" required />
                    </div>
                  </div>
                  <div>
                    <Label>Địa điểm hoạt động</Label>
                    <Input value={formData.location} onChange={(e) => setFormData(p => ({ ...p, location: e.target.value }))} placeholder="Hà Nội, TP.HCM, Đà Nẵng..." />
                  </div>
                </CardContent>
              </Card>

              {/* Bio & Experience */}
              <Card>
                <CardHeader>
                  <CardTitle>Giới thiệu & Kinh nghiệm</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label>Giới thiệu bản thân <span className="text-red-500">*</span></Label>
                    <Textarea value={formData.bio} onChange={(e) => setFormData(p => ({ ...p, bio: e.target.value }))} rows={4} placeholder="Hãy kể về bản thân bạn, đam mê du lịch..." required />
                    <p className="text-xs text-gray-500 mt-1">{formData.bio.length} ký tự</p>
                  </div>
                  <div>
                    <Label>Số năm kinh nghiệm</Label>
                    <Input type="number" min="0" value={formData.experienceYears} onChange={(e) => setFormData(p => ({ ...p, experienceYears: e.target.value }))} placeholder="VD: 3" />
                  </div>
                </CardContent>
              </Card>

              {/* Languages */}
              <Card>
                <CardHeader>
                  <CardTitle>Ngôn ngữ</CardTitle>
                </CardHeader>
                <CardContent>
                  <Label>Ngôn ngữ <span className="text-red-500">*</span></Label>
                  <div className="flex gap-2 mt-1">
                    <Input
                      value={languageInput}
                      onChange={(e) => setLanguageInput(e.target.value)}
                      onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddLanguage(); } }}
                      placeholder="VD: Tiếng Anh, Tiếng Trung..."
                    />
                    <Button type="button" onClick={handleAddLanguage}>Thêm</Button>
                  </div>
                  {formData.languages.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-3">
                      {formData.languages.map((lang, i) => (
                        <Badge key={i} variant="secondary" className="gap-1">
                          {lang}
                          <X className="size-3 cursor-pointer hover:text-red-600" onClick={() => setFormData(p => ({ ...p, languages: p.languages.filter((_, idx) => idx !== i) }))} />
                        </Badge>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Documents */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2"><Upload className="size-5 text-orange-600" />Tài liệu chứng minh</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Identity doc */}
                  <div>
                    <Label>CMND/CCCD <span className="text-red-500">*</span></Label>
                    <p className="text-sm text-gray-500 mb-2">Chấp nhận: JPG, PNG, PDF (tối đa 5MB)</p>
                    <input ref={identityRef} type="file" accept="image/*,application/pdf" onChange={(e) => setIdentityFile(e.target.files?.[0] ?? null)} className="hidden" />
                    {identityFile ? (
                      <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg">
                        <span className="text-sm text-green-800 truncate">{identityFile.name}</span>
                        <Button type="button" variant="ghost" size="icon" className="ml-auto shrink-0 size-6" onClick={() => setIdentityFile(null)}>
                          <X className="size-3" />
                        </Button>
                      </div>
                    ) : (
                      <Button type="button" variant="outline" className="w-full border-dashed border-2 h-20" onClick={() => identityRef.current?.click()}>
                        <div className="text-center">
                          <Upload className="size-6 mx-auto mb-1 text-gray-400" />
                          <p className="text-sm text-gray-600">Click để chọn file CMND/CCCD</p>
                        </div>
                      </Button>
                    )}
                  </div>

                  {/* Certificate files */}
                  <div>
                    <Label>Chứng chỉ (nếu có)</Label>
                    <input ref={certRef} type="file" accept="image/*,application/pdf" multiple onChange={(e) => setCertFiles(Array.from(e.target.files ?? []))} className="hidden" />
                    <Button type="button" variant="outline" className="w-full border-dashed border-2 h-16 mt-1" onClick={() => certRef.current?.click()}>
                      <span className="text-sm text-gray-500">Chọn file chứng chỉ (tùy chọn)</span>
                    </Button>
                    {certFiles.length > 0 && (
                      <div className="mt-2 space-y-1">
                        {certFiles.map((f, i) => (
                          <div key={i} className="flex items-center gap-2 text-sm text-gray-700">
                            <span className="truncate">{f.name}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Submit */}
              <Card className="bg-orange-50 border-orange-200">
                <CardContent className="p-6">
                  <div className="flex items-start gap-3 mb-4">
                    <input type="checkbox" id="terms" required className="mt-1" />
                    <label htmlFor="terms" className="text-sm text-gray-700">
                      Tôi xác nhận rằng tất cả thông tin trên là chính xác và đồng ý với{' '}
                      <a href="#" className="text-orange-600 hover:underline">Điều khoản dịch vụ</a>{' '}
                      và{' '}
                      <a href="#" className="text-orange-600 hover:underline">Chính sách bảo mật</a>.
                    </label>
                  </div>
                  <Button type="submit" className="w-full bg-orange-600 hover:bg-orange-700" size="lg" disabled={submitMutation.isPending}>
                    {submitMutation.isPending ? 'Đang nộp hồ sơ...' : 'Nộp hồ sơ'}
                  </Button>
                </CardContent>
              </Card>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
