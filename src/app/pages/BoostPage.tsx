import { useState } from 'react';
import { useNavigate } from 'react-router';
import { useQuery } from '@tanstack/react-query';
import { Star } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Skeleton } from '../components/ui/skeleton';
import { getBoostPlans } from '@/api/boosts';
import { formatVND } from '@/lib/constants';

/** Parse description text thành mảng bullet items (split by comma hoặc newline) */
function parseFeatures(description: string): string[] {
  return description
    .split(/[,\n]/)
    .map((s) => s.trim())
    .filter(Boolean);
}

export function BoostPage() {
  const navigate = useNavigate();
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);

  const { data: plans, isLoading } = useQuery({
    queryKey: ['boost-plans'],
    queryFn: getBoostPlans,
  });

  const handleProceed = () => {
    if (!selectedPlan) return;
    navigate('/select-tour-to-boost', { state: { plan: selectedPlan } });
  };

  return (
    <div className="container mx-auto px-4 py-12 max-w-6xl">
      <div className="text-center mb-12">
        <div className="inline-flex items-center gap-2 bg-orange-100 text-orange-700 px-4 py-2 rounded-full mb-4">
          <span className="font-semibold">Tăng Tương Tác</span>
        </div>
        <h1 className="text-4xl font-bold mb-4">Đẩy mạnh tour của bạn</h1>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          Chọn gói phù hợp để tour của bạn được hiển thị nổi bật trên trang chủ và thu hút nhiều khách du lịch hơn
        </p>
      </div>

      {isLoading ? (
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-64 rounded-xl" />)}
        </div>
      ) : (
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          {plans?.map((plan) => (
            <Card
              key={plan.plan}
              className={`relative cursor-pointer transition-all ${
                selectedPlan === plan.plan ? 'ring-2 ring-orange-600 shadow-lg' : 'hover:shadow-md'
              }`}
              onClick={() => setSelectedPlan(plan.plan)}
            >

              <CardHeader className="text-center">
                <CardTitle className="text-xl mb-2 capitalize">{plan.plan}</CardTitle>
                <div className="text-3xl font-bold text-orange-600">{formatVND(plan.price)}</div>
                <p className="text-sm text-gray-600">{plan.durationDays} ngày</p>
              </CardHeader>

              <CardContent>
                <ul className="space-y-3">
                  {parseFeatures(plan.description).map((feature, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="text-green-600 shrink-0 mt-0.5">·</span>
                      <span className="text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>
                {selectedPlan === plan.plan && (
                  <div className="mt-4 p-2 bg-orange-50 rounded-lg text-center">
                    <span className="text-sm font-semibold text-orange-700">✓ Đã chọn</span>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <div className="flex justify-center">
        <Button
          size="lg"
          onClick={handleProceed}
          disabled={!selectedPlan || isLoading}
          className="bg-orange-600 hover:bg-orange-700 px-8"
        >
          Tiếp tục — Chọn tour
        </Button>
      </div>

      {/* Comparison section */}
      <div className="mt-16">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold mb-2">Sự khác biệt khi không boost</h2>
          <p className="text-gray-500 text-sm">Tour của bạn đang ở đâu trong mắt khách hàng?</p>
        </div>

        <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
          {/* Without boost */}
          <div className="rounded-2xl border-2 border-gray-200 bg-gray-50 overflow-hidden">
            <div className="bg-gray-200 px-6 py-4">
              <span className="font-semibold text-gray-600">Không boost</span>
            </div>
            <ul className="divide-y divide-gray-200">
              {[
                { label: 'Hiển thị', value: 'Bị chôn vùi ở trang 3–5' },
                { label: 'Tìm kiếm', value: 'Xếp hạng thấp, khó được thấy' },
                { label: 'Lượt click', value: 'Rất ít, dưới trung bình' },
                { label: 'Đặt tour', value: 'Phụ thuộc vào may mắn' },
                { label: 'Nhận diện', value: 'Không có badge nổi bật' },
              ].map(({ label, value }) => (
                <li key={label} className="px-6 py-3">
                  <p className="text-xs text-gray-400">{label}</p>
                  <p className="text-sm font-medium text-gray-500">{value}</p>
                </li>
              ))}
            </ul>
          </div>

          {/* With boost */}
          <div className="rounded-2xl border-2 border-orange-400 bg-orange-50 overflow-hidden shadow-md">
            <div className="bg-orange-500 px-6 py-4 flex items-center gap-2">
              <span className="font-semibold text-white">Có boost</span>
              <Badge className="ml-auto bg-white text-orange-600 text-xs">Khuyến nghị</Badge>
            </div>
            <ul className="divide-y divide-orange-100">
              {[
                { label: 'Hiển thị', value: 'Vị trí đầu trang chủ' },
                { label: 'Tìm kiếm', value: 'Ưu tiên tối đa trong kết quả' },
                { label: 'Lượt click', value: 'Tăng trung bình 3× so với thường' },
                { label: 'Đặt tour', value: 'Tăng đáng kể, có thể dự đoán' },
                { label: 'Nhận diện', value: 'Badge "Nổi bật" thu hút ngay' },
              ].map(({ label, value }) => (
                <li key={label} className="px-6 py-3">
                  <p className="text-xs text-orange-400">{label}</p>
                  <p className="text-sm font-medium text-orange-700">{value}</p>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <p className="text-center text-xs text-gray-400 mt-6">
          * Số liệu ước tính dựa trên hiệu suất trung bình của các tour được boost trên nền tảng.
        </p>
      </div>
    </div>
  );
}
