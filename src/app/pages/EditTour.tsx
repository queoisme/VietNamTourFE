import { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Skeleton } from '../components/ui/skeleton';
import { Badge } from '../components/ui/badge';
import { Plus, X, Trash2, Upload, ChevronLeft, Check } from 'lucide-react';
import { toast } from 'sonner';
import { getTour, updateTour, getTourAvailabilities, addAvailability, deleteAvailability, uploadTourCoverImage, uploadTourImages, deleteTourImage } from '@/api/tours';
import { TourCategory, TourType } from '@/types/tour';
import { TOUR_CATEGORIES, TOUR_TYPES, formatDate } from '@/lib/constants';

export function EditTour() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();

  const { data: tour, isLoading } = useQuery({
    queryKey: ['tour', id],
    queryFn: () => getTour(id!),
    enabled: !!id,
  });

  const { data: availabilities = [] } = useQuery({
    queryKey: ['tour-availabilities', id],
    queryFn: () => getTourAvailabilities(id!),
    enabled: !!id,
  });

  const [newAvail, setNewAvail] = useState({ date: '', maxSlots: '10' });

  // Image state
  const [localCover, setLocalCover] = useState<string | null>(null);
  const [existingImages, setExistingImages] = useState<string[]>([]);
  const [coverUploading, setCoverUploading] = useState(false);
  const [imagesUploading, setImagesUploading] = useState(false);
  const coverInputRef = useRef<HTMLInputElement>(null);
  const imagesInputRef = useRef<HTMLInputElement>(null);

  const addAvailMutation = useMutation({
    mutationFn: () => addAvailability(id!, {
      availableDate: newAvail.date,
      maxSlots: parseInt(newAvail.maxSlots),
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tour-availabilities', id] });
      setNewAvail({ date: '', maxSlots: '10' });
      toast.success('Đã thêm ngày khởi hành');
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const deleteAvailMutation = useMutation({
    mutationFn: (date: string) => deleteAvailability(id!, date),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tour-availabilities', id] });
      toast.success('Đã xóa ngày');
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const handleAddAvail = () => {
    if (!newAvail.date) return toast.error('Vui lòng chọn ngày');
    if (parseInt(newAvail.maxSlots) < 1) return toast.error('Số chỗ phải lớn hơn 0');
    const today = new Date().toISOString().split('T')[0];
    if (newAvail.date < today) return toast.error('Ngày phải từ hôm nay trở đi');
    addAvailMutation.mutate();
  };

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    pricePerPerson: '',
    durationHours: '',
    locationCity: '',
    locationAddress: '',
    category: '' as TourCategory | '',
    tourType: 'group' as TourType,
    maxGroupSize: '',
    highlights: [''],
    included: [''],
    excluded: [''],
  });

  // Populate form when tour loads
  useEffect(() => {
    if (tour) {
      setFormData({
        title: tour.title,
        description: tour.description,
        pricePerPerson: tour.pricePerPerson.toString(),
        durationHours: tour.durationHours.toString(),
        locationCity: tour.locationCity,
        locationAddress: tour.locationAddress ?? '',
        category: tour.category,
        tourType: tour.tourType,
        maxGroupSize: tour.maxGroupSize.toString(),
        highlights: tour.highlights.length > 0 ? tour.highlights : [''],
        included: tour.included.length > 0 ? tour.included : [''],
        excluded: tour.excluded.length > 0 ? tour.excluded : [''],
      });
      setExistingImages(tour.images ?? []);
      setNewAvail((p) => ({ ...p, maxSlots: tour.maxGroupSize.toString() }));
    }
  }, [tour]);

  const handleCoverChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setLocalCover(URL.createObjectURL(file));
    setCoverUploading(true);
    try {
      await uploadTourCoverImage(id!, file);
      queryClient.invalidateQueries({ queryKey: ['tour', id] });
      toast.success('Đã cập nhật ảnh bìa');
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Lỗi tải ảnh');
      setLocalCover(null);
    } finally {
      setCoverUploading(false);
      e.target.value = '';
    }
  };

  const handleImagesChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (!files.length) return;
    const remaining = 10 - existingImages.length;
    if (remaining <= 0) { toast.error('Đã đạt giới hạn 10 ảnh'); return; }
    const toUpload = files.slice(0, remaining);
    setImagesUploading(true);
    try {
      const newUrls = await uploadTourImages(id!, toUpload);
      setExistingImages((p) => [...p, ...newUrls]);
      queryClient.invalidateQueries({ queryKey: ['tour', id] });
      toast.success(`Đã thêm ${newUrls.length} ảnh`);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Lỗi tải ảnh');
    } finally {
      setImagesUploading(false);
      e.target.value = '';
    }
  };

  const handleDeleteImage = async (url: string) => {
    try {
      await deleteTourImage(id!, url);
      setExistingImages((p) => p.filter((u) => u !== url));
      queryClient.invalidateQueries({ queryKey: ['tour', id] });
      toast.success('Đã xóa ảnh');
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Lỗi xóa ảnh');
    }
  };

  const updateMutation = useMutation({
    mutationFn: () =>
      updateTour(id!, {
        title: formData.title,
        description: formData.description,
        pricePerPerson: parseFloat(formData.pricePerPerson),
        durationHours: parseFloat(formData.durationHours),
        locationCity: formData.locationCity,
        locationAddress: formData.locationAddress || undefined,
        category: formData.category as TourCategory,
        tourType: formData.tourType,
        maxGroupSize: parseInt(formData.maxGroupSize),
        highlights: formData.highlights.filter((h) => h.trim()),
        included: formData.included.filter((i) => i.trim()),
        excluded: formData.excluded.filter((e) => e.trim()),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tour', id] });
      queryClient.invalidateQueries({ queryKey: ['my-tours'] });
      toast.success('Cập nhật tour thành công!');
      navigate('/guide', { state: { tab: 'tours' } });
    },
    onError: (err: Error) => toast.error(err.message || 'Có lỗi xảy ra khi cập nhật tour'),
  });

  const handleArrayAdd = (field: 'highlights' | 'included' | 'excluded') => {
    setFormData((p) => ({ ...p, [field]: [...p[field], ''] }));
  };

  const handleArrayRemove = (field: 'highlights' | 'included' | 'excluded', index: number) => {
    setFormData((p) => ({ ...p, [field]: p[field].filter((_, i) => i !== index) }));
  };

  const handleArrayChange = (field: 'highlights' | 'included' | 'excluded', index: number, value: string) => {
    setFormData((p) => ({ ...p, [field]: p[field].map((item, i) => (i === index ? value : item)) }));
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="bg-white border-b h-14" />
        <div className="container mx-auto px-4 py-6 max-w-4xl space-y-4">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-48 rounded-xl" />)}
        </div>
      </div>
    );
  }

  if (!tour) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sticky top bar */}
      <div className="bg-white border-b sticky top-0 z-20 shadow-sm">
        <div className="container mx-auto px-4 max-w-4xl h-14 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 min-w-0">
            <Button variant="ghost" size="icon" className="shrink-0" onClick={() => navigate('/guide')}>
              <ChevronLeft className="size-5" />
            </Button>
            <div className="min-w-0">
              <p className="font-semibold text-sm leading-tight truncate">{tour.title}</p>
              <p className="text-xs text-gray-400">Chỉnh sửa tour</p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Button type="button" variant="outline" size="sm" onClick={() => navigate('/guide')}>Hủy</Button>
            <Button
              type="submit"
              form="edit-tour-form"
              size="sm"
              disabled={updateMutation.isPending}
              className="bg-orange-600 hover:bg-orange-700"
            >
              {updateMutation.isPending ? 'Đang lưu...' : 'Lưu thay đổi'}
            </Button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6 max-w-4xl space-y-4">
        <form id="edit-tour-form" onSubmit={(e) => { e.preventDefault(); updateMutation.mutate(); }} className="space-y-4">

          {/* Card 1: Thông tin cơ bản */}
          <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b bg-gray-50/60 flex items-center gap-2">
                            <h2 className="font-semibold text-sm uppercase tracking-wide text-gray-700">Thông tin cơ bản</h2>
            </div>
            <div className="p-6 space-y-5">
              <div>
                <Label htmlFor="title">Tên tour <span className="text-red-500">*</span></Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData(p => ({ ...p, title: e.target.value }))}
                  className="mt-1.5"
                  placeholder="Nhập tên tour..."
                  required
                />
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="locationCity">Thành phố <span className="text-red-500">*</span></Label>
                  <Input
                    id="locationCity"
                    value={formData.locationCity}
                    onChange={(e) => setFormData(p => ({ ...p, locationCity: e.target.value }))}
                    className="mt-1.5"
                    placeholder="VD: Hà Nội, Đà Nẵng..."
                    required
                  />
                </div>
                <div>
                  <Label>Danh mục <span className="text-red-500">*</span></Label>
                  <Select value={formData.category} onValueChange={(v) => setFormData(p => ({ ...p, category: v as TourCategory }))}>
                    <SelectTrigger className="mt-1.5"><SelectValue placeholder="Chọn danh mục" /></SelectTrigger>
                    <SelectContent>
                      {TOUR_CATEGORIES.map((cat) => (
                        <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="locationAddress">
                  Địa chỉ cụ thể <span className="text-gray-400 font-normal text-xs">(tùy chọn)</span>
                </Label>
                <Input
                  id="locationAddress"
                  value={formData.locationAddress}
                  onChange={(e) => setFormData(p => ({ ...p, locationAddress: e.target.value }))}
                  className="mt-1.5"
                  placeholder="Số nhà, đường, quận..."
                />
              </div>

              {/* Tour type */}
              <div>
                <Label>Loại tour <span className="text-red-500">*</span></Label>
                <div className="mt-1.5 grid grid-cols-2 gap-3">
                  {TOUR_TYPES.map((t) => {
                    const selected = formData.tourType === t.value;
                    return (
                      <button
                        key={t.value}
                        type="button"
                        onClick={() => setFormData(p => ({ ...p, tourType: t.value as TourType }))}
                        className={`flex items-start gap-3 text-left p-4 rounded-xl border-2 transition-all ${
                          selected ? 'border-orange-500 bg-orange-50' : 'border-gray-200 hover:border-orange-300 bg-white'
                        }`}
                      >
                        <div className={`mt-0.5 size-4 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${
                          selected ? 'border-orange-500 bg-orange-500' : 'border-gray-300'
                        }`}>
                          {selected && <div className="size-1.5 rounded-full bg-white" />}
                        </div>
                        <div>
                          <p className="font-semibold text-sm">{t.label}</p>
                          <p className="text-xs text-gray-500 mt-0.5 leading-snug">{t.description}</p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Metrics */}
              <div className="grid sm:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="price">Giá / người (VNĐ) <span className="text-red-500">*</span></Label>
                  <Input
                    id="price"
                    type="number"
                    value={formData.pricePerPerson}
                    onChange={(e) => setFormData(p => ({ ...p, pricePerPerson: e.target.value }))}
                    className="mt-1.5"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="duration">Thời lượng (giờ) <span className="text-red-500">*</span></Label>
                  <Input
                    id="duration"
                    type="number"
                    step="0.5"
                    value={formData.durationHours}
                    onChange={(e) => setFormData(p => ({ ...p, durationHours: e.target.value }))}
                    className="mt-1.5"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="maxGroup">Số người tối đa</Label>
                  <Input
                    id="maxGroup"
                    type="number"
                    value={formData.maxGroupSize}
                    onChange={(e) => setFormData(p => ({ ...p, maxGroupSize: e.target.value }))}
                    className="mt-1.5"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Card 2: Hình ảnh */}
          <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b bg-gray-50/60 flex items-center gap-2">
                            <h2 className="font-semibold text-sm uppercase tracking-wide text-gray-700">Hình ảnh</h2>
            </div>
            <div className="p-6 space-y-5">
              {/* Cover */}
              <div>
                <Label className="block mb-1.5">Ảnh bìa</Label>
                <div
                  className="relative w-full h-52 rounded-xl border-2 border-dashed border-gray-300 cursor-pointer overflow-hidden group bg-gray-50 hover:border-orange-400 transition-colors"
                  onClick={() => coverInputRef.current?.click()}
                >
                  {(localCover ?? tour.coverImageUrl) ? (
                    <>
                      <img src={localCover ?? tour.coverImageUrl!} alt="cover" className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                        <div className="text-white text-center">
                          <Upload className="size-6 mx-auto mb-1" />
                          <span className="text-sm font-medium">Nhấn để thay đổi</span>
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-gray-400">
                      <Upload className="size-8 mb-2" />
                      <span className="text-sm">Nhấn để tải ảnh bìa</span>
                    </div>
                  )}
                  {coverUploading && (
                    <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                      <span className="text-white text-sm font-medium">Đang tải lên...</span>
                    </div>
                  )}
                </div>
                <input ref={coverInputRef} type="file" accept="image/*" className="hidden" onChange={handleCoverChange} />
              </div>

              {/* Additional images */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label>
                    Ảnh bổ sung{' '}
                    <span className="text-gray-400 font-normal">({existingImages.length}/10)</span>
                  </Label>
                  {existingImages.length < 10 && (
                    <Button type="button" variant="outline" size="sm" onClick={() => imagesInputRef.current?.click()} disabled={imagesUploading}>
                      <Plus className="size-3.5 mr-1" />Thêm ảnh
                    </Button>
                  )}
                </div>
                {existingImages.length > 0 || imagesUploading ? (
                  <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 gap-2">
                    {existingImages.map((url, i) => (
                      <div key={i} className="relative aspect-square rounded-lg overflow-hidden group border">
                        <img src={url} alt={`img-${i}`} className="w-full h-full object-cover" />
                        <button
                          type="button"
                          className="absolute top-1 right-1 bg-red-600 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-700"
                          onClick={() => handleDeleteImage(url)}
                        >
                          <X className="size-3" />
                        </button>
                      </div>
                    ))}
                    {imagesUploading && (
                      <div className="aspect-square rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center bg-gray-50">
                        <span className="text-xs text-gray-400">Đang tải...</span>
                      </div>
                    )}
                  </div>
                ) : (
                  <div
                    className="rounded-xl border-2 border-dashed border-gray-300 p-8 text-center text-gray-400 cursor-pointer hover:border-orange-400 hover:text-orange-500 transition-colors"
                    onClick={() => imagesInputRef.current?.click()}
                  >
                    <Plus className="size-6 mx-auto mb-1" />
                    <span className="text-sm">Thêm ảnh bổ sung</span>
                  </div>
                )}
                <input ref={imagesInputRef} type="file" accept="image/*" multiple className="hidden" onChange={handleImagesChange} />
              </div>
            </div>
          </div>

          {/* Card 3: Mô tả & Nội dung */}
          <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b bg-gray-50/60 flex items-center gap-2">
                            <h2 className="font-semibold text-sm uppercase tracking-wide text-gray-700">Mô tả & Nội dung</h2>
            </div>
            <div className="p-6 space-y-6">
              {/* Description */}
              <div>
                <Label htmlFor="description">Mô tả tour <span className="text-red-500">*</span></Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData(p => ({ ...p, description: e.target.value }))}
                  className="mt-1.5 min-h-[140px] resize-y"
                  placeholder="Mô tả chi tiết về tour..."
                  required
                />
              </div>

              {/* Highlights */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label>Điểm nổi bật</Label>
                  <Button type="button" variant="ghost" size="sm" onClick={() => handleArrayAdd('highlights')} className="text-orange-600 hover:text-orange-700 hover:bg-orange-50">
                    <Plus className="size-3.5 mr-1" />Thêm
                  </Button>
                </div>
                <div className="space-y-2">
                  {formData.highlights.map((item, index) => (
                    <div key={index} className="flex gap-2 items-center">
                      <div className="size-2 rounded-full bg-orange-400 shrink-0" />
                      <Input
                        value={item}
                        onChange={(e) => handleArrayChange('highlights', index, e.target.value)}
                        placeholder={`Điểm nổi bật ${index + 1}`}
                        className="flex-1"
                      />
                      {formData.highlights.length > 1 && (
                        <Button type="button" variant="ghost" size="icon" className="shrink-0 text-gray-400 hover:text-red-500" onClick={() => handleArrayRemove('highlights', index)}>
                          <X className="size-3.5" />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Included / Excluded */}
              <div className="grid sm:grid-cols-2 gap-6">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <Label className="flex items-center gap-1.5 text-green-700">
                      <Check className="size-4" />Bao gồm
                    </Label>
                    <Button type="button" variant="ghost" size="sm" onClick={() => handleArrayAdd('included')} className="text-green-700 hover:text-green-800 hover:bg-green-50">
                      <Plus className="size-3.5 mr-1" />Thêm
                    </Button>
                  </div>
                  <div className="space-y-2">
                    {formData.included.map((item, index) => (
                      <div key={index} className="flex gap-2 items-center">
                        <Input
                          value={item}
                          onChange={(e) => handleArrayChange('included', index, e.target.value)}
                          placeholder={`Mục ${index + 1}`}
                          className="flex-1 border-green-200 focus-visible:ring-green-400"
                        />
                        {formData.included.length > 1 && (
                          <Button type="button" variant="ghost" size="icon" className="shrink-0 text-gray-400 hover:text-red-500" onClick={() => handleArrayRemove('included', index)}>
                            <X className="size-3.5" />
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <Label className="flex items-center gap-1.5 text-red-600">
                      <X className="size-4" />Không bao gồm
                    </Label>
                    <Button type="button" variant="ghost" size="sm" onClick={() => handleArrayAdd('excluded')} className="text-red-600 hover:text-red-700 hover:bg-red-50">
                      <Plus className="size-3.5 mr-1" />Thêm
                    </Button>
                  </div>
                  <div className="space-y-2">
                    {formData.excluded.map((item, index) => (
                      <div key={index} className="flex gap-2 items-center">
                        <Input
                          value={item}
                          onChange={(e) => handleArrayChange('excluded', index, e.target.value)}
                          placeholder={`Mục ${index + 1}`}
                          className="flex-1 border-red-200 focus-visible:ring-red-400"
                        />
                        {formData.excluded.length > 1 && (
                          <Button type="button" variant="ghost" size="icon" className="shrink-0 text-gray-400 hover:text-red-500" onClick={() => handleArrayRemove('excluded', index)}>
                            <X className="size-3.5" />
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </form>

        {/* Card 4: Ngày khởi hành (outside form — saved instantly) */}
        <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b bg-gray-50/60 flex items-center justify-between">
            <div className="flex items-center gap-2">
                            <h2 className="font-semibold text-sm uppercase tracking-wide text-gray-700">Ngày khởi hành</h2>
              <span className="text-xs text-gray-400 font-normal normal-case">(lưu ngay)</span>
            </div>
            {formData.tourType === 'private' && (
              <Badge className="bg-purple-100 text-purple-700 border-purple-200 font-normal">
                Riêng tư · 1 chỗ/ngày
              </Badge>
            )}
          </div>
          <div className="p-6 space-y-3">
            {availabilities.length === 0 ? (
              <p className="text-sm text-gray-500 bg-gray-50 rounded-lg px-4 py-3 text-center">
                Chưa có ngày nào — thêm ít nhất một ngày để khách có thể đặt tour.
              </p>
            ) : (
              <div className="space-y-2">
                {availabilities
                  .slice()
                  .sort((a, b) => a.availableDate.localeCompare(b.availableDate))
                  .map((avail) => (
                    <div key={avail.id} className="flex items-center justify-between rounded-lg border px-4 py-2.5 text-sm bg-gray-50/50">
                      <div className="flex items-center gap-3">
                        <span className="font-medium">{formatDate(avail.availableDate)}</span>
                        {formData.tourType === 'private' ? (
                          <Badge variant={avail.bookedSlots > 0 ? 'destructive' : 'outline'} className={avail.bookedSlots === 0 ? 'text-green-700 border-green-300 bg-green-50' : ''}>
                            {avail.bookedSlots > 0 ? 'Đã đặt' : 'Còn trống'}
                          </Badge>
                        ) : (
                          <Badge variant="outline" className={avail.bookedSlots >= avail.maxSlots ? 'text-red-600 border-red-200' : 'text-green-700 border-green-300 bg-green-50'}>
                            {avail.bookedSlots}/{avail.maxSlots} chỗ
                          </Badge>
                        )}
                        {avail.isBlocked && <Badge variant="destructive">Đã khóa</Badge>}
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="text-gray-400 hover:text-red-600 hover:bg-red-50 shrink-0"
                        disabled={avail.bookedSlots > 0 || deleteAvailMutation.isPending}
                        title={avail.bookedSlots > 0 ? 'Không thể xóa khi đã có đặt chỗ' : 'Xóa ngày'}
                        onClick={() => deleteAvailMutation.mutate(avail.availableDate)}
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </div>
                  ))}
              </div>
            )}

            {/* Add new date */}
            <div className="flex gap-3 items-end rounded-xl border border-dashed border-gray-300 p-4 bg-gray-50/50">
              <div className="flex-1">
                <Label className="text-xs text-gray-500 font-medium">Ngày mới</Label>
                <Input
                  type="date"
                  className="mt-1.5 bg-white"
                  value={newAvail.date}
                  min={new Date().toISOString().split('T')[0]}
                  onChange={(e) => setNewAvail((p) => ({ ...p, date: e.target.value }))}
                />
              </div>
              {formData.tourType !== 'private' && (
                <div className="w-40">
                  <Label className="text-xs text-gray-500 font-medium">
                    Sức chứa (người)
                  </Label>
                  <Input
                    type="number"
                    className="mt-1.5 bg-white"
                    min={1}
                    placeholder={formData.maxGroupSize || '10'}
                    value={newAvail.maxSlots}
                    onChange={(e) => setNewAvail((p) => ({ ...p, maxSlots: e.target.value }))}
                  />
                </div>
              )}
              <Button
                type="button"
                onClick={handleAddAvail}
                disabled={addAvailMutation.isPending}
                className="bg-orange-600 hover:bg-orange-700 shrink-0"
              >
                <Plus className="size-4 mr-1" />Thêm ngày
              </Button>
            </div>

            {formData.tourType === 'private' && (() => {
              const days = Math.ceil(parseFloat(formData.durationHours || '0') / 24)
              return (
                <p className="text-xs text-purple-600 bg-purple-50 rounded-lg px-3 py-2 border border-purple-100">
                  Tour riêng tư — mỗi ngày chỉ nhận 1 booking, số chỗ tự động đặt là 1.
                  {days > 1 && (
                    <> Tour kéo dài <strong>{days} ngày</strong>: khi có khách đặt ngày bắt đầu, hệ thống sẽ tự động khóa <strong>{days - 1} ngày kế tiếp</strong>. Khi booking bị hủy, các ngày đó sẽ được mở lại.</>
                  )}
                </p>
              )
            })()}
          </div>
        </div>

        {/* Bottom spacer */}
        <div className="h-4" />
      </div>
    </div>
  );
}
