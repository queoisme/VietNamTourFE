import { useState } from 'react';
import { useNavigate } from 'react-router';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Button } from '../components/ui/button';
import { Skeleton } from '../components/ui/skeleton';
import { toast } from 'sonner';
import { getSubscriptionPlans, getMySubscription, createSubscription } from '@/api/boosts';
import { SubscriptionPlanEnum } from '@/types/boost';
import { formatVND } from '@/lib/constants';

const FREE_FEATURES = [
  'Đăng tối đa 5 tour',
  'Quản lý lịch & đặt chỗ',
  'Chat với khách hàng',
  'Hoa hồng 15%',
];

function parseDescription(description: string): string[] {
  return description
    .split(/[,\n]/)
    .map((s) => s.trim())
    .filter(Boolean);
}

export function SubscriptionPlans() {
  const navigate = useNavigate();
  const [pendingPlan, setPendingPlan] = useState<SubscriptionPlanEnum | null>(null);

  const { data: plans, isLoading: plansLoading } = useQuery({
    queryKey: ['subscription-plans'],
    queryFn: getSubscriptionPlans,
  });

  const { data: currentSub, isLoading: subLoading } = useQuery({
    queryKey: ['my-subscription'],
    queryFn: getMySubscription,
  });

  const subscribeMutation = useMutation({
    mutationFn: (plan: SubscriptionPlanEnum) => createSubscription({ plan }),
    onSuccess: (res) => {
      toast.success('Đang chuyển hướng đến trang thanh toán...');
      if (res.payUrl) window.location.href = res.payUrl;
    },
    onError: (err: Error) => {
      setPendingPlan(null);
      toast.error(err.message || 'Có lỗi xảy ra');
    },
  });

  const handleSubscribe = (plan: SubscriptionPlanEnum) => {
    setPendingPlan(plan);
    subscribeMutation.mutate(plan);
  };

  const isLoading = plansLoading || subLoading;
  const activePlan = currentSub?.status === 'active' ? currentSub.plan : null;

  const daysUntilExpiry = currentSub?.expiresAt
    ? Math.ceil((new Date(currentSub.expiresAt).getTime() - Date.now()) / 86_400_000)
    : null;
  const isExpiringSoon = daysUntilExpiry !== null && daysUntilExpiry <= 7 && daysUntilExpiry > 0;

  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-50 via-white to-white py-16">
      <div className="container mx-auto px-4 max-w-6xl">

        {/* Header */}
        <div className="text-center mb-14">
          <span className="inline-block bg-orange-600 text-white text-xs font-semibold px-4 py-1.5 rounded-full mb-4 tracking-wide uppercase">
            Nâng cấp tài khoản
          </span>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Chọn gói phù hợp với bạn</h1>
          <p className="text-gray-500 text-lg max-w-xl mx-auto">
            Nâng cấp để tour được ưu tiên hiển thị, giảm hoa hồng và nhận nhiều đặt chỗ hơn.
          </p>
        </div>

        {/* Current plan banner */}
        {activePlan && (
          <div className="max-w-2xl mx-auto mb-10">
            <div className={`rounded-2xl border-2 px-6 py-4 flex items-center justify-between ${
              activePlan === 'premium'
                ? 'border-orange-300 bg-orange-50'
                : 'border-purple-300 bg-purple-50'
            }`}>
              <div>
                <p className={`font-semibold ${activePlan === 'premium' ? 'text-orange-700' : 'text-purple-700'}`}>
                  Gói hiện tại: {activePlan === 'premium' ? 'Premium' : 'Professional'}
                </p>
                <p className="text-sm text-gray-500 mt-0.5">
                  Hết hạn: {currentSub?.expiresAt
                    ? new Date(currentSub.expiresAt).toLocaleDateString('vi-VN')
                    : 'N/A'}
                </p>
              </div>
              <span className="text-xs font-bold bg-green-600 text-white px-3 py-1 rounded-full shrink-0">
                Đang hoạt động
              </span>
            </div>
          </div>
        )}

        {/* Expiry warning */}
        {isExpiringSoon && (
          <div className="max-w-2xl mx-auto mb-8">
            <div className="rounded-xl border border-amber-300 bg-amber-50 px-5 py-4 flex items-start gap-3">
              <span className="text-amber-500 text-lg mt-0.5 shrink-0">⚠</span>
              <div>
                <p className="font-semibold text-amber-800">Gói của bạn sắp hết hạn!</p>
                <p className="text-sm text-amber-700 mt-0.5">
                  Còn {daysUntilExpiry} ngày — gia hạn ngay để không bị gián đoạn dịch vụ.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Plan cards */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-[440px] rounded-2xl" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">

            {/* Free plan */}
            <div className={`rounded-2xl flex flex-col overflow-hidden bg-white transition-all ${
              !activePlan
                ? 'ring-2 ring-green-500 shadow-lg'
                : 'border border-gray-200 shadow-sm'
            }`}>
              <div className="bg-gray-50 border-b px-8 py-8 text-center">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">
                  Miễn phí
                </p>
                <div className="text-5xl font-black text-gray-800">0 ₫</div>
                <p className="text-gray-400 text-sm mt-2">Mãi mãi</p>
              </div>
              <div className="flex flex-col flex-1 px-8 py-7">
                <ul className="space-y-3 flex-1">
                  {FREE_FEATURES.map((f, i) => (
                    <li key={i} className="flex items-center gap-3 text-sm text-gray-600">
                      <span className="shrink-0 w-5 h-5 rounded-full bg-gray-200 flex items-center justify-center text-gray-500 text-[10px] font-bold">
                        ✓
                      </span>
                      {f}
                    </li>
                  ))}
                </ul>
                <div className="mt-7">
                  <Button disabled className="w-full rounded-xl h-11 bg-green-600 hover:bg-green-600">
                    {!activePlan ? 'Đang sử dụng' : 'Gói cơ bản'}
                  </Button>
                </div>
              </div>
            </div>

            {/* Paid plans */}
            {plans?.map((plan) => {
              const isPremium = plan.plan === 'premium';
              const isCurrent = activePlan === plan.plan;
              const features = plan.description ? parseDescription(plan.description) : [];

              return (
                <div
                  key={plan.plan}
                  className={`rounded-2xl flex flex-col overflow-hidden transition-all ${
                    isPremium
                      ? 'shadow-2xl shadow-orange-200 scale-[1.03]'
                      : 'shadow-xl shadow-purple-100'
                  } ${isCurrent ? 'ring-2 ring-green-500' : isPremium ? 'ring-2 ring-orange-400' : 'ring-1 ring-purple-200'}`}
                >
                  {/* Gradient header */}
                  <div className={`relative px-8 py-9 text-center text-white ${
                    isPremium
                      ? 'bg-gradient-to-br from-orange-400 to-orange-600'
                      : 'bg-gradient-to-br from-purple-500 to-purple-700'
                  }`}>
                    <span className="absolute top-4 right-4 bg-white/20 backdrop-blur-sm text-white text-xs font-bold px-3 py-1 rounded-full">
                      {isPremium ? 'Phổ biến' : 'Tiết kiệm 15%'}
                    </span>
                    <p className="text-xs font-semibold uppercase tracking-widest text-white/70 mb-3">
                      {isPremium ? 'Premium' : 'Professional'}
                    </p>
                    <div className="text-5xl font-black">{formatVND(plan.price)}</div>
                    <p className="text-white/70 text-sm mt-2">{plan.durationDays} ngày</p>
                  </div>

                  {/* Features */}
                  <div className="bg-white flex flex-col flex-1 px-8 py-7">
                    <ul className="space-y-3 flex-1">
                      {features.map((f, i) => (
                        <li key={i} className="flex items-center gap-3 text-sm text-gray-700">
                          <span className={`shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-white text-[10px] font-bold ${
                            isPremium ? 'bg-orange-500' : 'bg-purple-500'
                          }`}>
                            ✓
                          </span>
                          <span className="font-medium">{f}</span>
                        </li>
                      ))}
                    </ul>
                    <div className="mt-7">
                      {isCurrent ? (
                        <Button disabled className="w-full rounded-xl h-11 bg-green-600 hover:bg-green-600">
                          Đang sử dụng
                        </Button>
                      ) : (
                        <Button
                          onClick={() => handleSubscribe(plan.plan)}
                          disabled={subscribeMutation.isPending}
                          className={`w-full rounded-xl h-11 text-base font-semibold ${
                            isPremium
                              ? 'bg-orange-500 hover:bg-orange-600'
                              : 'bg-purple-600 hover:bg-purple-700'
                          }`}
                        >
                          {pendingPlan === plan.plan ? 'Đang xử lý...' : activePlan ? 'Đổi gói' : 'Nâng cấp ngay'}
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <div className="text-center mt-14">
          <Button variant="outline" onClick={() => navigate('/guide')} className="rounded-xl px-6">
            Quay lại Dashboard
          </Button>
        </div>
      </div>
    </div>
  );
}
