import { useState } from 'react';
import { useNavigate } from 'react-router';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Skeleton } from '../components/ui/skeleton';
import { toast } from 'sonner';
import { getSubscriptionPlans, getMySubscription, createSubscription } from '@/api/boosts';
import { SubscriptionPlanEnum } from '@/types/boost';
import { formatVND } from '@/lib/constants';

const PLAN_CONFIG: Record<SubscriptionPlanEnum, { color: string; badge?: string; features: string[]; benefits: string[] }> = {
  premium: {
    color: 'orange',
    badge: 'Phổ biến',
    features: [
      'Đăng không giới hạn tour',
      'Tour ưu tiên hiển thị đầu tiên',
      'Huy hiệu "Premium" trên profile',
      'Hoa hồng giảm còn 10%',
      'Thống kê chi tiết',
      'Hỗ trợ ưu tiên',
    ],
    benefits: [
      'Tour xuất hiện đầu tiên trong kết quả tìm kiếm',
      'Tăng 300% lượt xem tour',
      'Tỷ lệ đặt tour tăng 150%',
    ],
  },
  pro: {
    color: 'purple',
    badge: 'Tiết kiệm 15%',
    features: [
      'Tất cả tính năng Premium',
      'Huy hiệu "Pro" đặc biệt',
      'Hoa hồng giảm còn 8%',
      'Phân tích dữ liệu nâng cao',
      'Tư vấn 1-1 miễn phí',
    ],
    benefits: [
      'Tour xuất hiện đầu tiên trong 3 tháng',
      'Tăng 500% lượt xem tour',
      'Tỷ lệ đặt tour tăng 250%',
      'Tiết kiệm 15% so với gói tháng',
    ],
  },
};

export function SubscriptionPlans() {
  const navigate = useNavigate();

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
    onError: (err: Error) => toast.error(err.message || 'Có lỗi xảy ra'),
  });

  const isLoading = plansLoading || subLoading;
  const activePlan = currentSub?.status === 'active' ? currentSub.plan : null;

  return (
    <div className="py-12 bg-gradient-to-b from-orange-50 to-white min-h-screen">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <Badge className="mb-4 bg-orange-600">Nâng cấp tài khoản</Badge>
          <h1 className="text-4xl mb-4">Chọn gói phù hợp với bạn</h1>
          <p className="text-gray-600 text-lg max-w-2xl mx-auto">
            Nâng cấp lên gói Premium hoặc Professional để tour của bạn được ưu tiên hiển thị đầu tiên
            và nhận được nhiều đặt chỗ hơn
          </p>
        </div>

        {/* Current Plan Banner */}
        {activePlan && (
          <div className="max-w-4xl mx-auto mb-8">
            <Card className="border-2 border-orange-200 bg-orange-50">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div>
                      <p className="font-semibold text-lg">
                        Gói hiện tại: {activePlan === 'premium' ? 'Premium' : 'Professional'}
                      </p>
                      <p className="text-sm text-gray-600">
                        Hết hạn: {currentSub?.expiresAt ? new Date(currentSub.expiresAt).toLocaleDateString('vi-VN') : 'N/A'}
                      </p>
                    </div>
                  </div>
                  <Badge className="bg-green-600">Đang hoạt động</Badge>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Plans */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-7xl mx-auto">
            {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-96 rounded-xl" />)}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-7xl mx-auto">
            {/* Free Plan */}
            <Card className="border-gray-200">
              <CardHeader className="text-center pb-8 pt-8">
                <CardTitle className="text-2xl mb-2">Miễn phí</CardTitle>
                <div className="text-4xl font-bold">Miễn phí</div>
                <p className="text-gray-600 text-sm">Mãi mãi</p>
              </CardHeader>
              <CardContent className="space-y-6">
                <ul className="space-y-3">
                  {['Đăng tối đa 5 tour', 'Quản lý đặt chỗ', 'Chat với khách hàng', 'Hoa hồng 15%'].map((f, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm">
                      <span className="text-gray-400 shrink-0">·</span>
                      <span className="text-gray-700">{f}</span>
                    </li>
                  ))}
                </ul>
                <div className="pt-4">
                  {!activePlan ? (
                    <Button disabled className="w-full bg-green-600 hover:bg-green-600">
                      Đang sử dụng
                    </Button>
                  ) : (
                    <Button disabled className="w-full bg-gray-600 hover:bg-gray-700">Gói cơ bản</Button>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Paid Plans */}
            {plans?.map((plan) => {
              const config = PLAN_CONFIG[plan.plan];
              const isCurrent = activePlan === plan.plan;
              const isPremium = plan.plan === 'premium';

              return (
                <Card
                  key={plan.plan}
                  className={`relative overflow-hidden transition-all hover:shadow-xl ${
                    isPremium ? 'border-2 border-orange-500 shadow-lg scale-105' : 'border-gray-200'
                  } ${isCurrent ? 'ring-2 ring-green-500' : ''}`}
                >
                  {config.badge && (
                    <div className={`absolute top-4 right-4 ${isPremium ? 'bg-orange-600' : 'bg-purple-600'} text-white text-xs font-bold px-3 py-1 rounded-full`}>
                      {config.badge}
                    </div>
                  )}
                  <CardHeader className="text-center pb-8 pt-8">
                    <CardTitle className="text-2xl mb-2">{isPremium ? 'Premium' : 'Professional'}</CardTitle>
                    <div className="text-4xl font-bold">{formatVND(plan.price)}</div>
                    <p className="text-gray-600 text-sm">{plan.durationDays} ngày</p>
                    {plan.description && (
                      <p className="text-xs text-gray-500 mt-2 px-2">{plan.description}</p>
                    )}
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <ul className="space-y-3">
                      {config.features.map((f, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm">
                          <span className={`shrink-0 ${isPremium ? 'text-orange-600' : 'text-purple-600'}`}>·</span>
                          <span className="text-gray-700">{f}</span>
                        </li>
                      ))}
                    </ul>
                    {config.benefits.length > 0 && (
                      <div className="pt-4 border-t">
                        <h4 className="font-semibold mb-3 text-xs text-gray-500 uppercase">Lợi ích</h4>
                        <ul className="space-y-2">
                          {config.benefits.map((b, i) => (
                            <li key={i} className="flex items-start gap-2 text-sm">
                              <span className={`shrink-0 ${isPremium ? 'text-orange-600' : 'text-purple-600'}`}>✦</span>
                              <span className="text-gray-700 font-medium">{b}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    <div className="pt-4">
                      {isCurrent ? (
                        <Button disabled className="w-full bg-green-600 hover:bg-green-600">
                          Đang sử dụng
                        </Button>
                      ) : (
                        <Button
                          onClick={() => subscribeMutation.mutate(plan.plan)}
                          disabled={subscribeMutation.isPending}
                          className={`w-full ${isPremium ? 'bg-orange-600 hover:bg-orange-700' : 'bg-purple-600 hover:bg-purple-700'}`}
                        >
                          {subscribeMutation.isPending ? 'Đang xử lý...' : 'Nâng cấp ngay'}
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        <div className="text-center mt-12">
          <Button variant="outline" onClick={() => navigate('/guide')}>Quay lại Dashboard</Button>
        </div>
      </div>
    </div>
  );
}
