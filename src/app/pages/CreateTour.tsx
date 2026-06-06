import { useState, useRef } from 'react';
import { useNavigate } from 'react-router';
import { useMutation } from '@tanstack/react-query';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Separator } from '../components/ui/separator';
import { Plus, X, ChevronLeft, Upload } from 'lucide-react';
import { toast } from 'sonner';
import { createTour, uploadTourCoverImage, uploadTourImages } from '@/api/tours';
import { TourCategory, TourType, ItineraryItem } from '@/types/tour';
import { TOUR_CATEGORIES, TOUR_TYPES, formatVND } from '@/lib/constants';

export function CreateTour() {
  const navigate = useNavigate();
  const coverInputRef = useRef<HTMLInputElement>(null);
  const imagesInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    title: '',
    category: '' as TourCategory | '',
    tourType: 'group' as TourType,
    locationCity: '',
    locationAddress: '',
    durationHours: '',
    maxGroupSize: '10',
    description: '',
    pricePerPerson: '',
    highlights: [''],
    included: [''],
    excluded: [''],
    itinerary: [{ time: '', activity: '', description: '' }] as ItineraryItem[],
  });

  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);

  const createMutation = useMutation({
    mutationFn: async () => {
      const tour = await createTour({
        title: formData.title.trim(),
        description: formData.description.trim(),
        category: formData.category as TourCategory,
        tourType: formData.tourType,
        locationCity: formData.locationCity.trim(),
        locationAddress: formData.locationAddress.trim() || undefined,
        pricePerPerson: parseFloat(formData.pricePerPerson),
        durationHours: parseFloat(formData.durationHours),
        maxGroupSize: parseInt(formData.maxGroupSize) || 10,
        highlights: formData.highlights.filter((h) => h.trim()),
        included: formData.included.filter((i) => i.trim()),
        excluded: formData.excluded.filter((e) => e.trim()),
        itinerary: formData.itinerary.filter((s) => s.activity.trim()),
      });
      if (coverFile) await uploadTourCoverImage(tour.id, coverFile);
      if (imageFiles.length > 0) await uploadTourImages(tour.id, imageFiles);
      return tour;
    },
    onSuccess: () => {
      toast.success('Tạo tour thành công!');
      navigate('/guide');
    },
    onError: (err: Error) => toast.error(err.message || 'Có lỗi xảy ra khi tạo tour'),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) return toast.error('Vui lòng nhập tên tour');
    if (!formData.category) return toast.error('Vui lòng chọn danh mục');
    if (!formData.locationCity.trim()) return toast.error('Vui lòng nhập thành phố');
    if (!formData.durationHours || parseFloat(formData.durationHours) <= 0)
      return toast.error('Vui lòng nhập thời lượng hợp lệ');
    if (!formData.description.trim()) return toast.error('Vui lòng nhập mô tả');
    if (!formData.pricePerPerson || parseFloat(formData.pricePerPerson) <= 0)
      return toast.error('Vui lòng nhập giá hợp lệ');
    createMutation.mutate();
  };

  const handleCoverChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) return toast.error('Ảnh bìa không được vượt quá 10MB');
    setCoverFile(file);
    setCoverPreview(URL.createObjectURL(file));
  };

  const handleImagesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    const total = imageFiles.length + files.length;
    if (total > 10) return toast.error('Tối đa 10 ảnh bổ sung');
    const oversized = files.find((f) => f.size > 10 * 1024 * 1024);
    if (oversized) return toast.error(`${oversized.name} vượt quá 10MB`);
    setImageFiles((p) => [...p, ...files]);
    setImagePreviews((p) => [...p, ...files.map((f) => URL.createObjectURL(f))]);
    e.target.value = '';
  };

  const removeImage = (index: number) => {
    setImageFiles((p) => p.filter((_, i) => i !== index));
    setImagePreviews((p) => p.filter((_, i) => i !== index));
  };

  const handleArray = (
    field: 'highlights' | 'included' | 'excluded',
    action: 'add' | 'remove' | 'change',
    index?: number,
    value?: string,
  ) => {
    setFormData((p) => {
      const arr = [...p[field]];
      if (action === 'add') arr.push('');
      else if (action === 'remove' && index !== undefined) arr.splice(index, 1);
      else if (action === 'change' && index !== undefined) arr[index] = value ?? '';
      return { ...p, [field]: arr };
    });
  };

  const price = parseFloat(formData.pricePerPerson);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="container mx-auto px-4 max-w-4xl py-4 flex items-center justify-between">
          <button
            type="button"
            onClick={() => navigate('/guide')}
            className="flex items-center gap-1.5 text-gray-600 hover:text-gray-900 text-sm font-medium"
          >
            <ChevronLeft className="size-4" />Quay lại
          </button>
          <h1 className="text-lg font-semibold">Tạo tour mới</h1>
          <Button
            form="create-tour-form"
            type="submit"
            disabled={createMutation.isPending}
            className="bg-orange-600 hover:bg-orange-700"
          >
            {createMutation.isPending ? 'Đang tạo...' : 'Tạo tour'}
          </Button>
        </div>
      </div>

      <form id="create-tour-form" onSubmit={handleSubmit}>
        <div className="container mx-auto px-4 max-w-4xl py-8 space-y-6">

          {/* Cover Image */}
          <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
            <input ref={coverInputRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={handleCoverChange} />
            <div
              onClick={() => coverInputRef.current?.click()}
              className="relative h-56 cursor-pointer group overflow-hidden bg-gradient-to-br from-orange-50 to-amber-50"
            >
              {coverPreview ? (
                <>
                  <img src={coverPreview} alt="Ảnh bìa" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <div className="text-white text-center">
                      <Upload className="size-8 mx-auto mb-1" />
                      <p className="font-medium">Đổi ảnh bìa</p>
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex flex-col items-center justify-center h-full gap-3 text-gray-400 group-hover:text-orange-500 transition-colors">
                  <div className="size-16 rounded-full bg-orange-100 group-hover:bg-orange-200 flex items-center justify-center transition-colors">
  <span className="text-2xl">🖼</span>
                  </div>
                  <div className="text-center">
                    <p className="font-semibold text-gray-600 group-hover:text-orange-600">Thêm ảnh bìa</p>
                    <p className="text-sm mt-0.5">PNG, JPG, WebP • Tối đa 10MB</p>
                  </div>
                </div>
              )}
            </div>

            {/* Basic Info overlaid below cover */}
            <div className="p-6 space-y-4">
              <div>
                <Label htmlFor="title" className="text-base font-semibold">Tên tour <span className="text-red-500">*</span></Label>
                <Input
                  id="title"
                  className="mt-1.5 text-lg h-12"
                  placeholder="VD: Khám phá Phố cổ Hội An"
                  value={formData.title}
                  onChange={(e) => setFormData(p => ({ ...p, title: e.target.value }))}
                />
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label className="font-medium">Danh mục <span className="text-red-500">*</span></Label>
                  <Select value={formData.category} onValueChange={(v) => setFormData(p => ({ ...p, category: v as TourCategory }))}>
                    <SelectTrigger className="mt-1.5 h-11">
                      <SelectValue placeholder="Chọn danh mục..." />
                    </SelectTrigger>
                    <SelectContent>
                      {TOUR_CATEGORIES.map((cat) => (
                        <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="city" className="font-medium">Thành phố <span className="text-red-500">*</span></Label>
                  <Input
                    id="city"
                    className="mt-1.5 h-11"
                    placeholder="VD: Hội An"
                    value={formData.locationCity}
                    onChange={(e) => setFormData(p => ({ ...p, locationCity: e.target.value }))}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="address" className="font-medium">Địa chỉ cụ thể</Label>
                <Input
                  id="address"
                  className="mt-1.5 h-11"
                  placeholder="VD: 123 Trần Phú, Hội An (tùy chọn)"
                  value={formData.locationAddress}
                  onChange={(e) => setFormData(p => ({ ...p, locationAddress: e.target.value }))}
                />
              </div>

              {/* Tour Type */}
              <div>
                <Label className="font-medium">Loại tour <span className="text-red-500">*</span></Label>
                <div className="mt-1.5 grid grid-cols-2 gap-3">
                  {TOUR_TYPES.map((t) => (
                    <button
                      key={t.value}
                      type="button"
                      onClick={() => setFormData(p => ({ ...p, tourType: t.value as TourType }))}
                      className={`flex flex-col items-start text-left p-3 rounded-xl border-2 transition-all ${
                        formData.tourType === t.value
                          ? 'border-orange-500 bg-orange-50'
                          : 'border-gray-200 hover:border-orange-300'
                      }`}
                    >
                      <span className="font-semibold text-sm">{t.label}</span>
                      <span className="text-xs text-gray-500 mt-0.5">{t.description}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="duration" className="font-medium">Thời lượng (giờ) <span className="text-red-500">*</span></Label>
                  <Input
                    id="duration"
                    type="number"
                    step="0.5"
                    min="0.5"
                    className="mt-1.5 h-11"
                    placeholder="VD: 8"
                    value={formData.durationHours}
                    onChange={(e) => setFormData(p => ({ ...p, durationHours: e.target.value }))}
                  />
                </div>
                <div>
                  <Label htmlFor="maxGroup" className="font-medium">Số người tối đa</Label>
                  <Input
                    id="maxGroup"
                    type="number"
                    min="1"
                    className="mt-1.5 h-11"
                    placeholder="10"
                    value={formData.maxGroupSize}
                    onChange={(e) => setFormData(p => ({ ...p, maxGroupSize: e.target.value }))}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Additional Images */}
          <div className="bg-white rounded-2xl shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="font-semibold text-gray-900">Ảnh bổ sung</h2>
                <p className="text-sm text-gray-500 mt-0.5">Tối đa 10 ảnh • PNG, JPG, WebP • 10MB/ảnh</p>
              </div>
              {imageFiles.length < 10 && (
                <Button type="button" variant="outline" size="sm" onClick={() => imagesInputRef.current?.click()}>
                  <Plus className="size-4 mr-1" />Thêm ảnh
                </Button>
              )}
            </div>
            <input
              ref={imagesInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              multiple
              className="hidden"
              onChange={handleImagesChange}
            />

            {imagePreviews.length === 0 ? (
              <button
                type="button"
                onClick={() => imagesInputRef.current?.click()}
                className="w-full border-2 border-dashed border-gray-200 rounded-xl h-28 flex items-center justify-center gap-3 text-gray-400 hover:border-orange-300 hover:text-orange-500 hover:bg-orange-50 transition-colors"
              >
                <Upload className="size-5" />
                <span className="text-sm font-medium">Nhấn để chọn ảnh</span>
              </button>
            ) : (
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
                {imagePreviews.map((src, i) => (
                  <div key={i} className="relative aspect-square rounded-lg overflow-hidden group">
                    <img src={src} alt="" className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => removeImage(i)}
                      className="absolute top-1 right-1 size-6 rounded-full bg-black/60 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500"
                    >
                      <X className="size-3.5" />
                    </button>
                  </div>
                ))}
                {imageFiles.length < 10 && (
                  <button
                    type="button"
                    onClick={() => imagesInputRef.current?.click()}
                    className="aspect-square rounded-lg border-2 border-dashed border-gray-200 flex items-center justify-center text-gray-400 hover:border-orange-300 hover:text-orange-500 hover:bg-orange-50 transition-colors"
                  >
                    <Plus className="size-6" />
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Description */}
          <div className="bg-white rounded-2xl shadow-sm p-6">
            <h2 className="font-semibold text-gray-900 mb-4">Mô tả tour</h2>
            <div>
              <Label htmlFor="description" className="font-medium">Mô tả chi tiết <span className="text-red-500">*</span></Label>
              <Textarea
                id="description"
                className="mt-1.5 resize-none"
                placeholder="Mô tả đầy đủ về tour, trải nghiệm, những gì khách sẽ nhận được..."
                value={formData.description}
                onChange={(e) => setFormData(p => ({ ...p, description: e.target.value }))}
                rows={5}
              />
              <p className="text-xs text-gray-400 mt-1.5">{formData.description.length} ký tự</p>
            </div>

            <Separator className="my-5" />

            {/* Highlights */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <Label className="font-medium">Điểm nổi bật</Label>
                <Button type="button" variant="ghost" size="sm" className="text-orange-600 h-8" onClick={() => handleArray('highlights', 'add')}>
                  <Plus className="size-3.5 mr-1" />Thêm
                </Button>
              </div>
              <div className="space-y-2">
                {formData.highlights.map((item, i) => (
                  <div key={i} className="flex gap-2">
                    <Input
                      placeholder={`VD: Ngắm hoàng hôn trên sông Hoài`}
                      value={item}
                      onChange={(e) => handleArray('highlights', 'change', i, e.target.value)}
                      className="h-10"
                    />
                    {formData.highlights.length > 1 && (
                      <Button type="button" variant="ghost" size="icon" className="shrink-0 h-10 w-10 text-gray-400 hover:text-red-500" onClick={() => handleArray('highlights', 'remove', i)}>
                        <X className="size-4" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Included / Excluded */}
          <div className="bg-white rounded-2xl shadow-sm p-6">
            <h2 className="font-semibold text-gray-900 mb-5">Bao gồm & Không bao gồm</h2>
            <div className="grid md:grid-cols-2 gap-6">
              {/* Included */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <Label className="font-medium text-green-700">✓ Bao gồm</Label>
                  <Button type="button" variant="ghost" size="sm" className="text-green-600 h-8" onClick={() => handleArray('included', 'add')}>
                    <Plus className="size-3.5 mr-1" />Thêm
                  </Button>
                </div>
                <div className="space-y-2">
                  {formData.included.map((item, i) => (
                    <div key={i} className="flex gap-2">
                      <Input
                        placeholder="VD: Bữa sáng, Vé tham quan"
                        value={item}
                        onChange={(e) => handleArray('included', 'change', i, e.target.value)}
                        className="h-10 border-green-200 focus-visible:ring-green-400"
                      />
                      {formData.included.length > 1 && (
                        <Button type="button" variant="ghost" size="icon" className="shrink-0 h-10 w-10 text-gray-400 hover:text-red-500" onClick={() => handleArray('included', 'remove', i)}>
                          <X className="size-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Excluded */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <Label className="font-medium text-red-700">✗ Không bao gồm</Label>
                  <Button type="button" variant="ghost" size="sm" className="text-red-600 h-8" onClick={() => handleArray('excluded', 'add')}>
                    <Plus className="size-3.5 mr-1" />Thêm
                  </Button>
                </div>
                <div className="space-y-2">
                  {formData.excluded.map((item, i) => (
                    <div key={i} className="flex gap-2">
                      <Input
                        placeholder="VD: Đồ uống, Chi phí cá nhân"
                        value={item}
                        onChange={(e) => handleArray('excluded', 'change', i, e.target.value)}
                        className="h-10 border-red-200 focus-visible:ring-red-400"
                      />
                      {formData.excluded.length > 1 && (
                        <Button type="button" variant="ghost" size="icon" className="shrink-0 h-10 w-10 text-gray-400 hover:text-red-500" onClick={() => handleArray('excluded', 'remove', i)}>
                          <X className="size-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Itinerary */}
          <div className="bg-white rounded-2xl shadow-sm p-6">
            <div className="flex items-center justify-between mb-1">
              <h2 className="font-semibold text-gray-900">Lịch trình chi tiết</h2>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="text-orange-600"
                onClick={() =>
                  setFormData((p) => ({
                    ...p,
                    itinerary: [...p.itinerary, { time: '', activity: '', description: '' }],
                  }))
                }
              >
                <Plus className="size-3.5 mr-1" />Thêm bước
              </Button>
            </div>
            <p className="text-xs text-gray-400 mb-4">
              Dùng để hiển thị tiến độ khi tracking tour. Chỉ bước có tên hoạt động mới được lưu.
            </p>
            <div className="space-y-3">
              {formData.itinerary.map((step, i) => (
                <div key={i} className="flex gap-2 items-start rounded-xl border border-gray-100 bg-gray-50/50 p-3">
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-xs font-bold text-indigo-600 mt-1">
                    {i + 1}
                  </div>
                  <div className="flex-1 grid gap-2">
                    <div className="grid grid-cols-3 gap-2">
                      <Input
                        placeholder="Thời gian (VD: 08:00)"
                        value={step.time}
                        onChange={(e) =>
                          setFormData((p) => ({
                            ...p,
                            itinerary: p.itinerary.map((s, idx) =>
                              idx === i ? { ...s, time: e.target.value } : s,
                            ),
                          }))
                        }
                        className="h-9 text-sm"
                      />
                      <Input
                        placeholder="Tên hoạt động *"
                        value={step.activity}
                        onChange={(e) =>
                          setFormData((p) => ({
                            ...p,
                            itinerary: p.itinerary.map((s, idx) =>
                              idx === i ? { ...s, activity: e.target.value } : s,
                            ),
                          }))
                        }
                        className="col-span-2 h-9 text-sm"
                      />
                    </div>
                    <Input
                      placeholder="Mô tả (tùy chọn)"
                      value={step.description}
                      onChange={(e) =>
                        setFormData((p) => ({
                          ...p,
                          itinerary: p.itinerary.map((s, idx) =>
                            idx === i ? { ...s, description: e.target.value } : s,
                          ),
                        }))
                      }
                      className="h-9 text-sm"
                    />
                  </div>
                  {formData.itinerary.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="mt-1 shrink-0 h-7 w-7 text-gray-400 hover:text-red-500"
                      onClick={() =>
                        setFormData((p) => ({
                          ...p,
                          itinerary: p.itinerary.filter((_, idx) => idx !== i),
                        }))
                      }
                    >
                      <X className="size-3.5" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Pricing */}
          <div className="bg-white rounded-2xl shadow-sm p-6">
            <h2 className="font-semibold text-gray-900 mb-4">Giá tour</h2>
            <div className="max-w-xs">
              <Label htmlFor="price" className="font-medium">Giá mỗi người (VNĐ) <span className="text-red-500">*</span></Label>
              <Input
                id="price"
                type="number"
                min="1000"
                step="1000"
                className="mt-1.5 h-12 text-lg"
                placeholder="500,000"
                value={formData.pricePerPerson}
                onChange={(e) => setFormData(p => ({ ...p, pricePerPerson: e.target.value }))}
              />
            </div>
            {price > 0 && (
              <div className="mt-3 inline-flex items-center gap-2 bg-orange-50 border border-orange-200 rounded-lg px-4 py-2">
                <span className="text-sm text-gray-600">Hiển thị với khách:</span>
                <span className="font-bold text-orange-600 text-lg">{formatVND(price)}</span>
                <span className="text-gray-500 text-sm">/người</span>
              </div>
            )}
          </div>

          {/* Submit */}
          <div className="flex gap-3 pb-8">
            <Button type="button" variant="outline" onClick={() => navigate('/guide')} className="flex-1 h-12">
              Hủy
            </Button>
            <Button
              type="submit"
              disabled={createMutation.isPending}
              className="flex-1 h-12 bg-orange-600 hover:bg-orange-700 text-base font-semibold"
            >
              {createMutation.isPending ? 'Đang tạo tour...' : 'Tạo tour'}
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}
