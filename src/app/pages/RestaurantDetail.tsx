import { useState } from 'react';
import { useParams, useNavigate } from 'react-router';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Separator } from '../components/ui/separator';
import {
  Star,
  MapPin,
  ChevronLeft,
  ExternalLink,
  Sparkles,
  UtensilsCrossed,
  Share2,
  Heart,
  Clock,
} from 'lucide-react';
import { mockRestaurants } from '../data/mock-accommodations';
import { toast } from 'sonner';

export function RestaurantDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const restaurant = mockRestaurants.find((r) => r.id === id);
  const [selectedImage, setSelectedImage] = useState(0);
  const [isFavorite, setIsFavorite] = useState(false);

  if (!restaurant) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <UtensilsCrossed className="size-16 mx-auto mb-4 text-gray-300" />
          <h2 className="text-2xl font-semibold mb-2">Không tìm thấy nhà hàng</h2>
          <Button onClick={() => navigate('/accommodations')} className="mt-4">
            Quay lại danh sách
          </Button>
        </div>
      </div>
    );
  }

  const handleBookTable = () => {
    window.open(restaurant.affiliateLink, '_blank');
    toast.success('Đang chuyển đến trang đặt bàn...');
  };

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    toast.success('Đã sao chép link chia sẻ!');
  };

  const handleToggleFavorite = () => {
    setIsFavorite(!isFavorite);
    toast.success(isFavorite ? 'Đã bỏ lưu nhà hàng' : 'Đã lưu nhà hàng');
  };

  const priceRangeDisplay = '$'.repeat(restaurant.priceRange);
  const priceRangeLabel = {
    1: 'Bình dân',
    2: 'Trung bình',
    3: 'Cao cấp',
    4: 'Sang trọng',
  }[restaurant.priceRange];

  const categoryLabels = {
    vietnamese: 'Việt Nam',
    asian: 'Châu Á',
    western: 'Âu Mỹ',
    seafood: 'Hải sản',
    vegetarian: 'Chay',
    cafe: 'Café',
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Back Button */}
      <div className="bg-white border-b sticky top-16 z-10">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/accommodations')}
            className="gap-2"
          >
            <ChevronLeft className="size-4" />
            Quay lại
          </Button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Hero Image Gallery */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-8">
          {/* Main Image */}
          <div className="relative aspect-[4/3] lg:aspect-auto lg:row-span-2 rounded-lg overflow-hidden">
            <img
              src={restaurant.images[selectedImage]}
              alt={restaurant.name}
              className="w-full h-full object-cover"
            />
          </div>

          {/* Thumbnail Images */}
          <div className="grid grid-cols-2 gap-4">
            {restaurant.images.slice(0, 4).map((image, index) => (
              <div
                key={index}
                className={`relative aspect-[4/3] rounded-lg overflow-hidden cursor-pointer ${
                  selectedImage === index ? 'ring-2 ring-orange-600' : ''
                }`}
                onClick={() => setSelectedImage(index)}
              >
                <img
                  src={image}
                  alt={`${restaurant.name} - ${index + 1}`}
                  className="w-full h-full object-cover hover:scale-110 transition-transform duration-300"
                />
              </div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Header */}
            <div>
              <div className="flex items-start justify-between mb-3">
                <div>
                  {restaurant.featured && (
                    <Badge className="mb-2 bg-orange-600">
                      <Sparkles className="size-3 mr-1" />
                      Nổi bật
                    </Badge>
                  )}
                  <h1 className="text-3xl font-bold mb-2">{restaurant.name}</h1>
                  <div className="flex items-center gap-2 text-gray-600">
                    <MapPin className="size-5" />
                    <span className="text-lg">{restaurant.location}, {restaurant.city}</span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={handleShare}
                  >
                    <Share2 className="size-5" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={handleToggleFavorite}
                  >
                    <Heart className={`size-5 ${isFavorite ? 'fill-red-500 text-red-500' : ''}`} />
                  </Button>
                </div>
              </div>

              <div className="flex items-center gap-4 flex-wrap">
                <div className="flex items-center gap-1">
                  <Star className="size-5 fill-yellow-400 text-yellow-400" />
                  <span className="text-xl font-semibold">{restaurant.rating}</span>
                </div>
                <span className="text-gray-600">
                  ({restaurant.reviewCount.toLocaleString()} đánh giá)
                </span>
                <Badge variant="outline">{categoryLabels[restaurant.category]}</Badge>
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-gray-700">{priceRangeDisplay}</span>
                  <span className="text-sm text-gray-600">{priceRangeLabel}</span>
                </div>
              </div>
            </div>

            <Separator />

            {/* Description */}
            <Card>
              <CardContent className="p-6">
                <h2 className="text-xl font-semibold mb-4">Giới thiệu</h2>
                <p className="text-gray-700 leading-relaxed">{restaurant.description}</p>
              </CardContent>
            </Card>

            {/* Cuisine Types */}
            <Card>
              <CardContent className="p-6">
                <h2 className="text-xl font-semibold mb-4">Phong cách ẩm thực</h2>
                <div className="flex items-center gap-2 flex-wrap">
                  {restaurant.cuisine.map((cuisine, index) => (
                    <Badge key={index} variant="secondary" className="text-sm">
                      {cuisine}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Specialties */}
            <Card>
              <CardContent className="p-6">
                <h2 className="text-xl font-semibold mb-4">Món đặc sản</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {restaurant.specialties.map((specialty, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <UtensilsCrossed className="size-5 text-orange-600 flex-shrink-0" />
                      <span className="text-gray-700">{specialty}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Opening Hours */}
            <Card>
              <CardContent className="p-6">
                <h2 className="text-xl font-semibold mb-4">Giờ mở cửa</h2>
                <div className="flex items-start gap-3">
                  <Clock className="size-5 text-orange-600 flex-shrink-0 mt-1" />
                  <div className="space-y-2">
                    <div className="flex justify-between gap-8">
                      <span className="text-gray-600">Thứ 2 - Thứ 6:</span>
                      <span className="font-medium">10:00 - 22:00</span>
                    </div>
                    <div className="flex justify-between gap-8">
                      <span className="text-gray-600">Thứ 7 - Chủ nhật:</span>
                      <span className="font-medium">09:00 - 23:00</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Location */}
            <Card>
              <CardContent className="p-6">
                <h2 className="text-xl font-semibold mb-4">Vị trí</h2>
                <div className="flex items-start gap-3">
                  <MapPin className="size-5 text-orange-600 flex-shrink-0 mt-1" />
                  <div>
                    <p className="font-medium mb-1">{restaurant.name}</p>
                    <p className="text-gray-600">{restaurant.location}</p>
                    <p className="text-gray-600">{restaurant.city}, Việt Nam</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Booking Sidebar */}
          <div className="lg:col-span-1">
            <div className="sticky top-24">
              <Card>
                <CardContent className="p-6">
                  <div className="mb-6 text-center">
                    <UtensilsCrossed className="size-12 mx-auto mb-3 text-orange-600" />
                    <h3 className="text-xl font-semibold mb-2">Đặt bàn ngay</h3>
                    <p className="text-sm text-gray-600">
                      Đảm bảo có chỗ cho bữa ăn của bạn
                    </p>
                  </div>

                  <Separator className="my-6" />

                  <div className="space-y-3 mb-6">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Mức giá:</span>
                      <span className="font-medium">{priceRangeDisplay} - {priceRangeLabel}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Đánh giá:</span>
                      <div className="flex items-center gap-1">
                        <Star className="size-4 fill-yellow-400 text-yellow-400" />
                        <span className="font-medium">{restaurant.rating}/5.0</span>
                      </div>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Loại hình:</span>
                      <span className="font-medium">{categoryLabels[restaurant.category]}</span>
                    </div>
                  </div>

                  <Button
                    onClick={handleBookTable}
                    className="w-full bg-orange-600 hover:bg-orange-700"
                    size="lg"
                  >
                    Đặt bàn ngay
                    <ExternalLink className="size-5 ml-2" />
                  </Button>

                  <p className="text-xs text-gray-600 text-center mt-4">
                    Bạn sẽ được chuyển đến trang đối tác để hoàn tất đặt bàn
                  </p>
                </CardContent>
              </Card>

              {/* Featured Badge */}
              {restaurant.featured && (
                <Card className="mt-4 bg-orange-50 border-orange-200">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <Sparkles className="size-5 text-orange-600 flex-shrink-0" />
                      <div>
                        <h3 className="font-semibold text-orange-900 mb-1">
                          Nhà hàng được đề xuất
                        </h3>
                        <p className="text-sm text-orange-800">
                          Được nhiều khách du lịch yêu thích và đánh giá cao
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
