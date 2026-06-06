import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'motion/react';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Separator } from '../components/ui/separator';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Input } from '../components/ui/input';
import { Skeleton } from '../components/ui/skeleton';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '../components/ui/select';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '../components/ui/alert-dialog';
import { Star, ChevronLeft, Heart, ChevronRight, X } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'sonner';
import { getTour, getTourAvailabilities } from '@/api/tours';
import { trackTourClick } from '@/api/analytics';
import { createBooking } from '@/api/bookings';
import { getTourReviews } from '@/api/reviews';
import { getWishlist, addToWishlist, removeFromWishlist } from '@/api/wishlists';
import { getOrCreateConversationByTour } from '@/api/conversations';
import { TOUR_CATEGORIES, formatVND, formatDate } from '@/lib/constants';
import { ReviewImageGallery } from '../components/ReviewImageUpload';

function hasConsecutiveDays(
  startDate: string,
  days: number,
  all: { isBlocked: boolean; availableSlots: number; availableDate: string }[]
): boolean {
  if (days <= 1) return true;
  const freeSet = new Set(
    all.filter(a => !a.isBlocked && a.availableSlots > 0).map(a => a.availableDate)
  );
  const start = new Date(startDate);
  for (let i = 1; i < days; i++) {
    const d = new Date(start);
    d.setDate(d.getDate() + i);
    if (!freeSet.has(d.toISOString().split('T')[0])) return false;
  }
  return true;
}

export function TourDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const queryClient = useQueryClient();

  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [chatLoading, setChatLoading] = useState(false);
  const [bookingData, setBookingData] = useState({
    tourDate: '',
    numPeople: 1,
    contactName: user?.name || '',
    contactPhone: user?.phone || '',
    contactEmail: user?.email || '',
    note: '',
  });

  const { data: tour, isLoading } = useQuery({
    queryKey: ['tour', id],
    queryFn: () => getTour(id!),
    enabled: !!id,
  });

  const { data: availabilities } = useQuery({
    queryKey: ['tour-availabilities', id],
    queryFn: () => getTourAvailabilities(id!),
    enabled: !!id,
  });

  const { data: reviewsData } = useQuery({
    queryKey: ['tour-reviews', id],
    queryFn: () => getTourReviews(id!, { size: 50 }),
    enabled: !!id,
  });

  const { data: wishlistData } = useQuery({
    queryKey: ['wishlist'],
    queryFn: () => getWishlist({ size: 100 }),
    enabled: isAuthenticated,
  });

  useEffect(() => {
    if (!id) return
    trackTourClick(id).catch(() => {}) // fire-and-forget
  }, [id])

  const bookingMutation = useMutation({
    mutationFn: () =>
      createBooking({
        tourId: id!,
        tourDate: bookingData.tourDate,
        numPeople: bookingData.numPeople,
        numDays: isPrivateTour ? numDays : undefined,
        contactName: bookingData.contactName,
        contactPhone: bookingData.contactPhone,
        contactEmail: bookingData.contactEmail || undefined,
        note: bookingData.note || undefined,
      }),
    onSuccess: (booking) => {
      setShowConfirmDialog(false);
      toast.success('Đặt tour thành công! Chuyển đến trang thanh toán...');
      setTimeout(() => navigate(`/payment/vnpay/${booking.id}`), 800);
    },
    onError: (err: Error) => {
      setShowConfirmDialog(false);
      toast.error(err.message || 'Đặt tour thất bại');
    },
  });

  const wishlistMutation = useMutation({
    mutationFn: (isWishlisted: boolean) =>
      isWishlisted ? removeFromWishlist(id!) : addToWishlist(id!),
    onSuccess: (_, isWishlisted) => {
      queryClient.invalidateQueries({ queryKey: ['wishlist'] });
      toast.success(isWishlisted ? 'Đã xóa khỏi danh sách yêu thích' : 'Đã thêm vào danh sách yêu thích');
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const isPrivateTour = tour?.tourType === 'private'
  const numDays = Math.max(1, Math.ceil((tour?.durationHours ?? 24) / 24));
  const _now = new Date();
  const today = `${_now.getFullYear()}-${String(_now.getMonth() + 1).padStart(2, '0')}-${String(_now.getDate()).padStart(2, '0')}`;
  const availableDates = (availabilities ?? []).filter(
    (a) => !a.isBlocked && a.availableSlots > 0 &&
      (isPrivateTour ? a.availableDate >= today : a.availableDate > today) &&
      (isPrivateTour
        ? hasConsecutiveDays(a.availableDate, numDays, availabilities ?? [])
        : true)
  );

  const allImages = tour
    ? [tour.coverImageUrl, ...tour.images].filter(Boolean) as string[]
    : [];

  const closeLightbox = useCallback(() => setLightboxIndex(null), []);
  const prevImage = useCallback(() =>
    setLightboxIndex((i) => (i !== null ? (i - 1 + allImages.length) % allImages.length : null)), [allImages.length]);
  const nextImage = useCallback(() =>
    setLightboxIndex((i) => (i !== null ? (i + 1) % allImages.length : null)), [allImages.length]);

  useEffect(() => {
    if (lightboxIndex === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeLightbox();
      else if (e.key === 'ArrowLeft') prevImage();
      else if (e.key === 'ArrowRight') nextImage();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [lightboxIndex, closeLightbox, prevImage, nextImage]);

  const reviews = reviewsData?.items ?? [];
  const isWishlisted = !!wishlistData?.items.find((w) => w.tourId === id);

  const handleBooking = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAuthenticated) { toast.error('Vui lòng đăng nhập để đặt tour'); navigate('/login'); return; }
    if (!bookingData.tourDate) return toast.error('Vui lòng chọn ngày khởi hành');
    const slot = availableDates.find((a) => a.availableDate === bookingData.tourDate);
    if (!slot) return toast.error('Ngày này không còn lịch khởi hành');
    if (!isPrivateTour && slot.availableSlots < bookingData.numPeople)
      return toast.error(`Ngày này chỉ còn ${slot.availableSlots} chỗ trống`);
    if (!bookingData.contactName.trim()) return toast.error('Vui lòng nhập tên liên hệ');
    if (!bookingData.contactPhone.trim()) return toast.error('Vui lòng nhập số điện thoại');
    setShowConfirmDialog(true);
  };

  const handleToggleWishlist = () => {
    if (!isAuthenticated) { toast.error('Vui lòng đăng nhập để lưu tour yêu thích'); navigate('/login'); return; }
    wishlistMutation.mutate(isWishlisted);
  };

  const handleChatWithGuide = async () => {
    if (!isAuthenticated) { toast.error('Vui lòng đăng nhập để nhắn tin với guide'); navigate('/login'); return; }
    if (!tour) return;
    setChatLoading(true);
    try {
      const conv = await getOrCreateConversationByTour(tour.id);
      navigate(`/chat/${conv.id}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Không thể mở chat lúc này');
    } finally {
      setChatLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div>
        <Skeleton className="h-96 w-full" />
        <div className="container mx-auto px-4 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-4">
              {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-32 rounded-xl" />)}
            </div>
            <Skeleton className="h-96 rounded-xl" />
          </div>
        </div>
      </div>
    );
  }

  if (!tour) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <h1 className="text-3xl mb-4">Tour không tồn tại</h1>
        <Button onClick={() => navigate('/tours')}>Quay lại danh sách tour</Button>
      </div>
    );
  }

  const totalPrice = tour.pricePerPerson * bookingData.numPeople;
  const categoryLabel = TOUR_CATEGORIES.find((c) => c.value === tour.category)?.label ?? tour.category;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}>
      {/* Hero */}
      <div className="relative h-96 overflow-hidden">
        <img
          src={tour.coverImageUrl ?? tour.images[0] ?? 'https://images.unsplash.com/photo-1583417319070-4a69db38a482?w=800'}
          alt={tour.title}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-8 text-white">
          <div className="container mx-auto">
            <Button variant="ghost" className="text-white hover:text-white/80 mb-4" onClick={() => navigate(-1)}>
              ← Quay lại
            </Button>
            <div className="flex items-center gap-2 mb-3">
              <Badge>{categoryLabel}</Badge>
              {tour.tourType === 'private' ? (
                <Badge className="bg-purple-500">Tour riêng tư</Badge>
              ) : (
                <Badge className="bg-blue-500">Tour nhóm</Badge>
              )}
            </div>
            <h1 className="text-4xl mb-2">{tour.title}</h1>
            <div className="flex flex-wrap gap-4 text-sm">
              <span>{tour.locationCity}</span>
              <span>·</span>
              <span>
                {isPrivateTour
                  ? `${tour.durationHours}h/ngày`
                  : numDays > 1 ? `${numDays} ngày` : `${tour.durationHours}h`}
              </span>
              <span>·</span>
              <span>{tour.tourType === 'private' ? 'Phục vụ riêng nhóm bạn' : `Tối đa ${tour.maxGroupSize} người`}</span>
              <span>·</span>
              <span className="flex items-center gap-1">
                <Star className="size-4 fill-yellow-400 text-yellow-400" />
                {tour.avgRating.toFixed(1)} ({tour.totalReviews})
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Guide Info */}
            <Card>
              <CardContent className="p-6">
                <h2 className="text-xl font-semibold mb-4">Hướng dẫn viên</h2>
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    {tour.guide.avatarUrl ? (
                      <img src={tour.guide.avatarUrl} alt={tour.guide.fullName} className="size-16 rounded-full object-cover" />
                    ) : (
                      <div className="size-16 rounded-full bg-orange-100 flex items-center justify-center text-2xl font-bold text-orange-700">
                        {tour.guide.fullName[0]}
                      </div>
                    )}
                    <div>
                      <h3 className="font-semibold text-lg">{tour.guide.fullName}</h3>
                      <p className="text-sm text-gray-500">Hướng dẫn viên chuyên nghiệp</p>
                    </div>
                  </div>
                  {user?.role === 'customer' && user.id !== tour.guide.id && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleChatWithGuide}
                      disabled={chatLoading}
                      className="shrink-0"
                    >
                      {chatLoading ? 'Đang mở...' : 'Liên hệ Guide'}
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Description */}
            <Card>
              <CardContent className="p-6">
                <h2 className="text-xl font-semibold mb-4">Giới thiệu</h2>
                <p className="text-gray-700 leading-relaxed whitespace-pre-line">{tour.description}</p>
              </CardContent>
            </Card>

            {/* Images Gallery */}
            {allImages.length > 0 && (
              <Card>
                <CardContent className="p-6">
                  <h2 className="text-xl font-semibold mb-4">
                    Hình ảnh
                    <span className="ml-2 text-sm font-normal text-gray-400">({allImages.length})</span>
                  </h2>

                  <div className="space-y-3">
                    {/* Featured image with nav */}
                    <div className="relative rounded-xl overflow-hidden aspect-video group">
                      <img
                        src={allImages[currentIdx]}
                        alt={`${tour.title} ${currentIdx + 1}`}
                        className="w-full h-full object-cover cursor-zoom-in"
                        onClick={() => setLightboxIndex(currentIdx)}
                      />

                      {allImages.length > 1 && (
                        <button
                          onClick={() => setCurrentIdx((i) => (i - 1 + allImages.length) % allImages.length)}
                          className="absolute left-3 top-1/2 -translate-y-1/2 size-9 rounded-full bg-black/40 hover:bg-black/70 text-white flex items-center justify-center transition-colors opacity-0 group-hover:opacity-100"
                        >
                          <ChevronLeft className="size-5" />
                        </button>
                      )}

                      {allImages.length > 1 && (
                        <button
                          onClick={() => setCurrentIdx((i) => (i + 1) % allImages.length)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 size-9 rounded-full bg-black/40 hover:bg-black/70 text-white flex items-center justify-center transition-colors opacity-0 group-hover:opacity-100"
                        >
                          <ChevronRight className="size-5" />
                        </button>
                      )}

                      {allImages.length > 1 && (
                        <div className="absolute bottom-3 right-3 bg-black/50 text-white text-xs px-2.5 py-1 rounded-full">
                          {currentIdx + 1} / {allImages.length}
                        </div>
                      )}
                    </div>

                    {allImages.length > 1 && (
                      <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 gap-2">
                        {allImages.map((img, idx) => {
                          if (idx > 5) return null;
                          const isOverflow = idx === 5 && allImages.length > 6;
                          return (
                            <div
                              key={idx}
                              className={`relative aspect-square rounded-lg overflow-hidden cursor-pointer transition-all ${
                                currentIdx === idx ? 'ring-2 ring-orange-500' : 'opacity-70 hover:opacity-100'
                              }`}
                              onClick={() => setCurrentIdx(idx)}
                            >
                              <img src={img} alt="" className="w-full h-full object-cover" />
                              {isOverflow && (
                                <div className="absolute inset-0 bg-black/55 flex items-center justify-center">
                                  <span className="text-white font-semibold text-sm">+{allImages.length - 5}</span>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Highlights */}
            {tour.highlights.length > 0 && (
              <Card>
                <CardContent className="p-6">
                  <h2 className="text-xl font-semibold mb-4">Điểm nổi bật</h2>
                  <ul className="space-y-2">
                    {tour.highlights.map((h, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className="text-green-600 shrink-0 mt-0.5">✓</span>
                        <span className="text-gray-700">{h}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}

            {/* Itinerary */}
            {tour.itinerary.length > 0 && (
              <Card>
                <CardContent className="p-6">
                  <h2 className="text-xl font-semibold mb-4">Lịch trình</h2>
                  <div className="space-y-4">
                    {tour.itinerary.map((item, i) => (
                      <div key={i} className="flex gap-4">
                        <div className="text-orange-600 min-w-[80px] font-medium text-sm pt-0.5">
                          {item.time}
                        </div>
                        <div>
                          <p className="font-medium text-gray-800">{item.activity}</p>
                          {item.description && <p className="text-sm text-gray-600 mt-1">{item.description}</p>}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Included / Excluded */}
            {(tour.included.length > 0 || tour.excluded.length > 0) && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {tour.included.length > 0 && (
                  <Card>
                    <CardContent className="p-6">
                      <h2 className="text-xl font-semibold mb-4">Bao gồm</h2>
                      <ul className="space-y-2">
                        {tour.included.map((item, i) => (
                          <li key={i} className="flex items-start gap-2 text-sm">
                            <span className="text-green-600 shrink-0 mt-0.5">✓</span>
                            <span className="text-gray-700">{item}</span>
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                )}
                {tour.excluded.length > 0 && (
                  <Card>
                    <CardContent className="p-6">
                      <h2 className="text-xl font-semibold mb-4">Không bao gồm</h2>
                      <ul className="space-y-2">
                        {tour.excluded.map((item, i) => (
                          <li key={i} className="flex items-start gap-2 text-sm">
                            <span className="text-red-500 shrink-0 mt-0.5">✗</span>
                            <span className="text-gray-700">{item}</span>
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                )}
              </div>
            )}
          </div>

          {/* Booking Sidebar */}
          <div className="lg:col-span-1">
            <div className="sticky top-20">
              <Card>
                <CardContent className="p-6">
                  <div className="mb-4">
                    <div className="flex items-baseline gap-2">
                      <span className="text-3xl font-bold text-orange-600">{formatVND(tour.pricePerPerson)}</span>
                      <span className="text-gray-600">/người</span>
                    </div>
                  </div>
                  <Separator className="my-4" />

                  <form onSubmit={handleBooking} className="space-y-4">
                    {isPrivateTour && (
                      <div className="flex items-start gap-2 bg-purple-50 border border-purple-200 rounded-lg px-3 py-2.5 text-sm text-purple-700">
                        <span className="shrink-0">🔒</span>
                        <span>Tour riêng tư — guide phục vụ riêng cho nhóm bạn{numDays > 1 ? <> kéo dài <strong>{numDays} ngày</strong></> : ''}.</span>
                      </div>
                    )}

                    {!isPrivateTour && numDays > 1 && (
                      <div className="flex items-start gap-2 bg-blue-50 border border-blue-200 rounded-lg px-3 py-2.5 text-sm text-blue-700">
                        <span className="shrink-0">👥</span>
                        <span>Tour nhóm kéo dài <strong>{numDays} ngày</strong>, hệ thống sẽ tự khóa các ngày tiếp theo khi đặt.</span>
                      </div>
                    )}

                    <div>
                      <Label>Ngày khởi hành <span className="text-red-500">*</span></Label>
                      {availableDates.length > 0 ? (
                        <Select value={bookingData.tourDate} onValueChange={(v) => setBookingData((p) => ({ ...p, tourDate: v }))}>
                          <SelectTrigger className="mt-1"><SelectValue placeholder="Chọn ngày" /></SelectTrigger>
                          <SelectContent>
                            {availableDates.map((a) => (
                              <SelectItem key={a.availableDate} value={a.availableDate}>
                                {formatDate(a.availableDate)}
                                {!isPrivateTour && ` — còn ${a.availableSlots} chỗ`}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      ) : (
                        <p className="mt-2 text-sm text-gray-500 bg-gray-50 rounded-lg px-3 py-2">
                          Hiện chưa có lịch khởi hành
                        </p>
                      )}
                    </div>

                    {numDays > 1 && (
                      <p className="text-xs text-gray-500 -mt-2">
                        Hệ thống sẽ tự khóa {numDays} ngày liên tiếp từ ngày bắt đầu
                      </p>
                    )}

                    <div>
                      <Label>
                        {isPrivateTour ? 'Số người trong nhóm' : 'Số người'}{' '}
                        <span className="text-red-500">*</span>
                      </Label>
                      <Select
                        value={bookingData.numPeople.toString()}
                        onValueChange={(v) => setBookingData((p) => ({ ...p, numPeople: parseInt(v) }))}
                      >
                        <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {Array.from({ length: tour.maxGroupSize }, (_, i) => i + 1).map((n) => (
                            <SelectItem key={n} value={n.toString()}>{n} người</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {isPrivateTour && (
                        <p className="text-xs text-gray-500 mt-1">Tối đa {tour.maxGroupSize} người/nhóm</p>
                      )}
                    </div>

                    <div>
                      <Label>Tên liên hệ <span className="text-red-500">*</span></Label>
                      <Input className="mt-1" value={bookingData.contactName} onChange={(e) => setBookingData((p) => ({ ...p, contactName: e.target.value }))} placeholder="Họ và tên" />
                    </div>
                    <div>
                      <Label>Số điện thoại <span className="text-red-500">*</span></Label>
                      <Input className="mt-1" value={bookingData.contactPhone} onChange={(e) => setBookingData((p) => ({ ...p, contactPhone: e.target.value }))} placeholder="0912345678" />
                    </div>

                    <div>
                      <Label>Yêu cầu đặc biệt</Label>
                      <Textarea
                        className="mt-1"
                        value={bookingData.note}
                        onChange={(e) => setBookingData((p) => ({ ...p, note: e.target.value }))}
                        placeholder="Ví dụ: Ăn chay, dị ứng thực phẩm..."
                        rows={2}
                      />
                    </div>

                    <Separator />

                    <div className="flex justify-between font-semibold text-lg">
                      <span>Tổng cộng</span>
                      <span className="text-orange-600">{formatVND(totalPrice)}</span>
                    </div>

                    <Button
                      type="submit"
                      className="w-full bg-orange-600 hover:bg-orange-700"
                      size="lg"
                      disabled={availableDates.length === 0}
                    >
                      {availableDates.length === 0 ? 'Chưa có lịch khởi hành' : 'Đặt tour ngay'}
                    </Button>

                    <Button
                      type="button"
                      variant="outline"
                      className="w-full"
                      onClick={handleToggleWishlist}
                      disabled={wishlistMutation.isPending}
                    >
                      <Heart className={`size-4 mr-2 ${isWishlisted ? 'fill-red-500 text-red-500' : ''}`} />
                      {isWishlisted ? 'Đã lưu' : 'Lưu tour'}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>

        {/* Reviews */}
        <div className="mt-12">
          <Card>
            <CardContent className="p-6">
              <h2 className="text-2xl font-semibold mb-6">Đánh giá từ khách hàng</h2>
              {reviews.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <p>Chưa có đánh giá nào</p>
                </div>
              ) : (
                <>
                  <div className="flex items-center gap-4 mb-6 p-4 bg-gray-50 rounded-lg">
                    <div className="text-center">
                      <p className="text-4xl font-bold text-orange-600">{tour.avgRating.toFixed(1)}</p>
                      <div className="flex gap-0.5 my-1">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star key={i} className={`size-4 ${i < Math.round(tour.avgRating) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`} />
                        ))}
                      </div>
                      <p className="text-xs text-gray-500">{tour.totalReviews} đánh giá</p>
                    </div>
                  </div>

                  <div className="space-y-6">
                    {reviews.map((review) => (
                      <div key={review.id} className="border-b pb-6 last:border-0">
                        <div className="flex items-start gap-4">
                          {review.customerAvatarUrl ? (
                            <img src={review.customerAvatarUrl} alt={review.customerName} className="size-10 rounded-full object-cover shrink-0" />
                          ) : (
                            <div className="size-10 rounded-full bg-orange-100 flex items-center justify-center font-bold text-orange-700 shrink-0">
                              {review.customerName[0]}
                            </div>
                          )}
                          <div className="flex-1">
                            <div className="flex items-center justify-between mb-1">
                              <p className="font-semibold">{review.customerName}</p>
                              <span className="text-xs text-gray-500">{formatDate(review.createdAt)}</span>
                            </div>
                            <div className="flex gap-0.5 mb-2">
                              {Array.from({ length: 5 }).map((_, i) => (
                                <Star key={i} className={`size-4 ${i < review.rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`} />
                              ))}
                            </div>
                            {review.comment && <p className="text-gray-700 text-sm">{review.comment}</p>}
                            <ReviewImageGallery images={review.images ?? []} />
                            {review.guideReply && (
                              <div className="mt-3 pl-4 border-l-2 border-orange-200">
                                <p className="text-xs font-semibold text-orange-600 mb-1">Phản hồi từ HDV:</p>
                                <p className="text-sm text-gray-600">{review.guideReply}</p>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Confirm Dialog */}
      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xác nhận đặt tour</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-3 py-4">
                <div className="bg-gray-50 rounded-lg p-4 space-y-2 text-sm">
                  <div className="flex justify-between"><span className="text-gray-600">Tour:</span><span className="font-semibold text-right">{tour.title}</span></div>
                  <div className="flex justify-between"><span className="text-gray-600">Ngày bắt đầu:</span><span className="font-semibold">{bookingData.tourDate && formatDate(bookingData.tourDate)}</span></div>
                  {numDays > 1 && (
                    <div className="flex justify-between"><span className="text-gray-600">Số ngày:</span><span className="font-semibold">{numDays} ngày</span></div>
                  )}
                  <div className="flex justify-between"><span className="text-gray-600">Số người:</span><span className="font-semibold">{bookingData.numPeople} người</span></div>
                  <div className="flex justify-between"><span className="text-gray-600">Liên hệ:</span><span className="font-semibold">{bookingData.contactName} — {bookingData.contactPhone}</span></div>
                  <Separator />
                  <div className="flex justify-between font-bold text-base">
                    <span>Tổng cộng:</span>
                    <span className="text-orange-600">{formatVND(totalPrice)}</span>
                  </div>
                </div>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Hủy</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => bookingMutation.mutate()}
              disabled={bookingMutation.isPending}
              className="bg-orange-600 hover:bg-orange-700"
            >
              {bookingMutation.isPending ? 'Đang xử lý...' : 'Xác nhận đặt tour'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Lightbox */}
      {lightboxIndex !== null && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center"
          onClick={closeLightbox}
        >
          <button
            onClick={closeLightbox}
            className="absolute top-4 right-4 size-10 rounded-full bg-white/10 hover:bg-white/25 text-white flex items-center justify-center transition-colors z-10"
          >
            <X className="size-5" />
          </button>

          <div className="absolute top-4 left-1/2 -translate-x-1/2 text-white/70 text-sm font-medium bg-black/40 px-3 py-1 rounded-full">
            {lightboxIndex + 1} / {allImages.length}
          </div>

          {allImages.length > 1 && (
            <button
              onClick={(e) => { e.stopPropagation(); prevImage(); }}
              className="absolute left-4 size-11 rounded-full bg-white/10 hover:bg-white/25 text-white flex items-center justify-center transition-colors"
            >
              <ChevronLeft className="size-6" />
            </button>
          )}

          <img
            src={allImages[lightboxIndex]}
            alt={`${tour.title} ${lightboxIndex + 1}`}
            className="max-h-[85vh] max-w-[90vw] object-contain rounded-lg shadow-2xl select-none"
            onClick={(e) => e.stopPropagation()}
          />

          {allImages.length > 1 && (
            <button
              onClick={(e) => { e.stopPropagation(); nextImage(); }}
              className="absolute right-4 size-11 rounded-full bg-white/10 hover:bg-white/25 text-white flex items-center justify-center transition-colors"
            >
              <ChevronRight className="size-6" />
            </button>
          )}

          {allImages.length > 1 && (
            <div
              className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 px-4 overflow-x-auto max-w-[90vw]"
              onClick={(e) => e.stopPropagation()}
            >
              {allImages.map((img, i) => (
                <button
                  key={i}
                  onClick={() => setLightboxIndex(i)}
                  className={`shrink-0 size-14 rounded-lg overflow-hidden border-2 transition-all ${
                    i === lightboxIndex ? 'border-white opacity-100' : 'border-transparent opacity-50 hover:opacity-80'
                  }`}
                >
                  <img src={img} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </motion.div>
  );
}
