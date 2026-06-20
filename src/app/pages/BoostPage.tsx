import { useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { useQuery } from '@tanstack/react-query';
import { ArrowRight, Check, ChevronRight } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Skeleton } from '../components/ui/skeleton';
import { cn } from '../components/ui/utils';
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
    <div className="min-h-screen bg-slate-50">
      <div className="container mx-auto max-w-5xl px-4 py-6">
        {/* Breadcrumb */}
        <nav className="mb-4 flex items-center gap-1.5 text-xs text-slate-500">
          <Link to="/guide" className="hover:text-slate-900">Bảng điều khiển</Link>
          <ChevronRight className="size-3.5" />
          <span className="font-medium text-slate-900">Boost tour</span>
        </nav>

        {/* Page title */}
        <div className="mb-6">
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Boost tour</h1>
          <p className="mt-1 text-sm text-slate-600">
            Chọn gói phù hợp để tour của bạn được hiển thị nổi bật trên trang chủ và thu hút thêm khách.
          </p>
        </div>

        {/* Section header — chọn gói */}
        <div className="mb-4 flex flex-wrap items-start justify-between gap-4 rounded-xl border border-slate-200 bg-white p-5">
          <div className="min-w-0 flex-1">
            <span className="mb-2 inline-flex items-center rounded-full bg-orange-50 px-2 py-0.5 text-xs font-medium text-orange-700">
              Bước 1
            </span>
            <h2 className="text-base font-semibold text-slate-900">Chọn gói boost</h2>
            <p className="mt-1 text-sm text-slate-600">Mỗi gói có thời lượng và vị trí hiển thị khác nhau.</p>
          </div>
          {selectedPlan && (
            <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700">
              Đã chọn: <span className="capitalize">{selectedPlan}</span>
            </span>
          )}
        </div>

        {/* Plan cards */}
        {isLoading ? (
          <div className="mb-6 grid gap-4 md:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-56 rounded-xl" />
            ))}
          </div>
        ) : (
          <div className="mb-6 grid gap-4 md:grid-cols-3">
            {plans?.map((plan) => {
              const active = selectedPlan === plan.plan;
              return (
                <button
                  key={plan.plan}
                  type="button"
                  onClick={() => setSelectedPlan(plan.plan)}
                  className={cn(
                    'flex flex-col rounded-xl border bg-white p-5 text-left shadow-sm transition-all duration-200',
                    active
                      ? 'border-orange-500 ring-2 ring-orange-500/20 shadow-md'
                      : 'border-slate-200 hover:border-slate-300 hover:shadow-md',
                  )}
                >
                  <div className="flex items-start justify-between">
                    <p className="text-sm font-semibold capitalize text-slate-900">{plan.plan}</p>
                    {active && (
                      <span className="inline-flex size-5 items-center justify-center rounded-full bg-orange-500 text-white">
                        <Check className="size-3" />
                      </span>
                    )}
                  </div>
                  <p className="mt-3 text-2xl font-semibold tabular-nums text-orange-600">
                    {formatVND(plan.price)}
                  </p>
                  <p className="text-xs text-slate-500">{plan.durationDays} ngày</p>

                  <ul className="mt-4 space-y-2">
                    {parseFeatures(plan.description).map((feature, i) => (
                      <li key={i} className="flex items-start gap-2 text-xs text-slate-600">
                        <Check className="mt-0.5 size-3.5 shrink-0 text-emerald-600" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </button>
              );
            })}
          </div>
        )}

        {/* Continue */}
        <div className="mb-10 flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white p-5">
          <p className="text-xs text-slate-500">
            {selectedPlan
              ? 'Bước tiếp theo: chọn tour bạn muốn boost.'
              : 'Chọn 1 gói boost ở trên để tiếp tục.'}
          </p>
          <Button
            onClick={handleProceed}
            disabled={!selectedPlan || isLoading}
            className="bg-orange-600 hover:bg-orange-700"
          >
            Tiếp tục — Chọn tour
            <ArrowRight className="ml-1 size-4" />
          </Button>
        </div>

        {/* Comparison section */}
        <div>
          <div className="mb-4">
            <h2 className="text-base font-semibold text-slate-900">Sự khác biệt khi không boost</h2>
            <p className="mt-1 text-sm text-slate-600">Tour của bạn đang ở đâu trong mắt khách hàng?</p>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {/* Without boost */}
            <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
              <div className="border-b border-slate-200 bg-slate-50 px-5 py-3">
                <span className="text-sm font-semibold text-slate-700">Không boost</span>
              </div>
              <ul className="divide-y divide-slate-100">
                {[
                  { label: 'Hiển thị', value: 'Bị chôn vùi ở trang 3–5' },
                  { label: 'Tìm kiếm', value: 'Xếp hạng thấp, khó được thấy' },
                  { label: 'Lượt click', value: 'Rất ít, dưới trung bình' },
                  { label: 'Đặt tour', value: 'Phụ thuộc vào may mắn' },
                  { label: 'Nhận diện', value: 'Không có badge nổi bật' },
                ].map(({ label, value }) => (
                  <li key={label} className="px-5 py-3">
                    <p className="text-xs text-slate-500">{label}</p>
                    <p className="mt-0.5 text-sm font-medium text-slate-700">{value}</p>
                  </li>
                ))}
              </ul>
            </div>

            {/* With boost */}
            <div className="overflow-hidden rounded-xl border border-orange-200 bg-white shadow-sm">
              <div className="flex items-center justify-between border-b border-orange-200 bg-orange-50 px-5 py-3">
                <span className="text-sm font-semibold text-orange-700">Có boost</span>
                <span className="rounded-full bg-orange-500 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
                  Khuyến nghị
                </span>
              </div>
              <ul className="divide-y divide-orange-100">
                {[
                  { label: 'Hiển thị', value: 'Vị trí đầu trang chủ' },
                  { label: 'Tìm kiếm', value: 'Ưu tiên tối đa trong kết quả' },
                  { label: 'Lượt click', value: 'Tăng trung bình 3× so với thường' },
                  { label: 'Đặt tour', value: 'Tăng đáng kể, có thể dự đoán' },
                  { label: 'Nhận diện', value: 'Badge "Nổi bật" thu hút ngay' },
                ].map(({ label, value }) => (
                  <li key={label} className="px-5 py-3">
                    <p className="text-xs text-orange-500">{label}</p>
                    <p className="mt-0.5 text-sm font-medium text-orange-700">{value}</p>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <p className="mt-4 text-center text-xs text-slate-400">
            * Số liệu ước tính dựa trên hiệu suất trung bình của các tour được boost trên nền tảng.
          </p>
        </div>
      </div>
    </div>
  );
}
