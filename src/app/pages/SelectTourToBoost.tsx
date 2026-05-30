import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Star } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '../components/ui/card';
import { Skeleton } from '../components/ui/skeleton';
import { toast } from 'sonner';
import { getMyTours } from '@/api/tours';
import { createBoost } from '@/api/boosts';
import { BoostPlan } from '@/types/boost';
import { formatVND } from '@/lib/constants';

const PLAN_LABELS: Record<BoostPlan, string> = {
  basic: 'Cơ Bản',
  standard: 'Tiêu Chuẩn',
  premium: 'Cao Cấp',
};

export function SelectTourToBoost() {
  const navigate = useNavigate();
  const location = useLocation();
  const plan = (location.state as { plan?: BoostPlan })?.plan;
  const [selectedTourId, setSelectedTourId] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['my-tours'],
    queryFn: () => getMyTours({ size: 50 }),
  });

  const boostMutation = useMutation({
    mutationFn: (tourId: string) => createBoost({ tourId, plan: plan! }),
    onSuccess: (res) => {
      toast.success('Tour đã được đặt boost thành công!');
      if (res.payUrl) {
        window.location.href = res.payUrl;
      } else {
        navigate('/guide');
      }
    },
    onError: (err: Error) => toast.error(err.message || 'Có lỗi xảy ra'),
  });

  if (!plan) {
    navigate('/boost');
    return null;
  }

  const tours = (data?.items ?? []).filter((t) => t.status === 'active');

  if (!isLoading && tours.length === 0) {
    return (
      <div className="container mx-auto px-4 py-12 max-w-4xl text-center">
        <h2 className="text-2xl font-bold mb-2">Chưa có tour nào hoạt động</h2>
        <p className="text-gray-600 mb-6">Bạn cần có tour đang hoạt động để sử dụng tính năng boost</p>
        <Button onClick={() => navigate('/create-tour')} className="bg-orange-600 hover:bg-orange-700">
          Tạo tour mới
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-12 max-w-6xl">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold mb-2">Chọn tour để boost</h1>
        <p className="text-gray-600">
          Gói đã chọn:{' '}
          <span className="font-semibold text-orange-600">{PLAN_LABELS[plan]}</span>
        </p>
      </div>

      {isLoading ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-72 rounded-xl" />
          ))}
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {tours.map((tour) => {
            const isSelected = selectedTourId === tour.id;
            return (
              <Card
                key={tour.id}
                onClick={() => setSelectedTourId(tour.id)}
                className={`relative cursor-pointer transition-all ${
                  isSelected
                    ? 'ring-2 ring-orange-500 shadow-lg bg-orange-50'
                    : 'hover:shadow-md hover:border-orange-200'
                }`}
              >
                {isSelected && (
                  <div className="absolute top-3 right-3 z-10 bg-orange-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                    ✓
                  </div>
                )}

                <CardHeader className="pb-2">
                  <div className="relative aspect-video w-full bg-gray-200 rounded-lg mb-3 overflow-hidden">
                    {tour.coverImageUrl ? (
                      <img
                        src={tour.coverImageUrl}
                        alt={tour.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400 text-4xl">
                        ✦
                      </div>
                    )}
                    {tour.isBoosted && (() => {
                      const daysLeft = tour.boostExpiresAt
                        ? Math.max(0, Math.ceil((new Date(tour.boostExpiresAt).getTime() - Date.now()) / 86400000))
                        : 0;
                      return (
                        <div className="absolute top-2 left-2 bg-yellow-400 text-yellow-900 text-xs font-semibold px-2 py-0.5 rounded-full">
                          Đang boost · còn {daysLeft} ngày
                        </div>
                      );
                    })()}
                  </div>
                  <CardTitle className="text-base line-clamp-2">{tour.title}</CardTitle>
                </CardHeader>

                <CardContent className="pb-2">
                  <div className="space-y-1 text-sm text-gray-600">
                    <div>{tour.locationCity}</div>
                    <div className="flex items-center gap-1">
                      <Star className="size-3 fill-yellow-400 text-yellow-400 shrink-0" />
                      {tour.avgRating.toFixed(1)} ({tour.totalReviews} đánh giá)
                    </div>
                  </div>
                  <p className="mt-3 text-lg font-bold text-orange-600">
                    {formatVND(tour.pricePerPerson)}
                    <span className="text-sm font-normal text-gray-500">/người</span>
                  </p>
                </CardContent>

                <CardFooter>
                  <Button
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedTourId(tour.id);
                    }}
                    variant={isSelected ? 'default' : 'outline'}
                    className={`w-full ${isSelected ? 'bg-orange-500 hover:bg-orange-600 text-white' : 'border-orange-400 text-orange-600 hover:bg-orange-50'}`}
                  >
                    {isSelected ? 'Đã chọn' : tour.isBoosted ? 'Gia hạn boost' : 'Chọn tour này'}
                  </Button>
                </CardFooter>
              </Card>
            );
          })}
        </div>
      )}

      <div className="flex justify-center gap-4">
        <Button variant="outline" onClick={() => navigate('/boost')}>
          Quay lại
        </Button>
        <Button
          size="lg"
          disabled={!selectedTourId || boostMutation.isPending}
          onClick={() => selectedTourId && boostMutation.mutate(selectedTourId)}
          className="bg-orange-600 hover:bg-orange-700 px-8 min-w-48"
        >
          {boostMutation.isPending ? 'Đang xử lý...' : 'Boost tour đã chọn'}
        </Button>
      </div>
    </div>
  );
}
