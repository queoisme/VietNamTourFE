import { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Separator } from '../components/ui/separator';
import {
  Star,
  MapPin,
  ChevronLeft,
  ExternalLink,
  Check,
  Sparkles,
  Hotel as HotelIcon,
  Share2,
  Heart,
} from 'lucide-react';
import { mockHotels } from '../data/mock-accommodations';
import { toast } from 'sonner';

export function HotelDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const hotel = mockHotels.find((h) => h.id === id);
  const [selectedImage, setSelectedImage] = useState(0);
  const [isFavorite, setIsFavorite] = useState(false);

  if (!hotel) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <HotelIcon className="size-16 mx-auto mb-4 text-gray-300" />
          <h2 className="text-2xl font-semibold mb-2">Không tìm thấy khách sạn</h2>
          <Button onClick={() => navigate('/accommodations')} className="mt-4">
            Quay lại danh sách
          </Button>
        </div>
      </div>
    );
  }

  const handleBookNow = () => {
    window.open(hotel.affiliateLink, '_blank');
    toast.success('Đang chuyển đến trang đặt phòng...');
  };

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    toast.success('Đã sao chép link chia sẻ!');
  };

  const handleToggleFavorite = () => {
    setIsFavorite(!isFavorite);
    toast.success(isFavorite ? 'Đã bỏ lưu khách sạn' : 'Đã lưu khách sạn');
  };

  const categoryLabels = {
    hotel: 'Khách sạn',
    resort: 'Resort',
    hostel: 'Hostel',
    apartment: 'Căn hộ',
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
              src={hotel.images[selectedImage]}
              alt={hotel.name}
              className="w-full h-full object-cover"
            />
            {hotel.discount && (
              <Badge className="absolute top-4 right-4 bg-red-600 text-lg px-3 py-1">
                Giảm {hotel.discount}%
              </Badge>
            )}
          </div>

          {/* Thumbnail Images */}
          <div className="grid grid-cols-2 gap-4">
            {hotel.images.slice(0, 4).map((image, index) => (
              <div
                key={index}
                className={`relative aspect-[4/3] rounded-lg overflow-hidden cursor-pointer ${
                  selectedImage === index ? 'ring-2 ring-orange-600' : ''
                }`}
                onClick={() => setSelectedImage(index)}
              >
                <img
                  src={image}
                  alt={`${hotel.name} - ${index + 1}`}
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
                  {hotel.featured && (
                    <Badge className="mb-2 bg-orange-600">
                      <Sparkles className="size-3 mr-1" />
                      Nổi bật
                    </Badge>
                  )}
                  <h1 className="text-3xl font-bold mb-2">{hotel.name}</h1>
                  <div className="flex items-center gap-2 text-gray-600">
                    <MapPin className="size-5" />
                    <span className="text-lg">{hotel.location}, {hotel.city}</span>
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

              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1">
                  <Star className="size-5 fill-yellow-400 text-yellow-400" />
                  <span className="text-xl font-semibold">{hotel.rating}</span>
                </div>
                <span className="text-gray-600">
                  ({hotel.reviewCount.toLocaleString()} đánh giá)
                </span>
                <Badge variant="outline">{categoryLabels[hotel.category]}</Badge>
              </div>
            </div>

            <Separator />

            {/* Description */}
            <Card>
              <CardContent className="p-6">
                <h2 className="text-xl font-semibold mb-4">Giới thiệu</h2>
                <p className="text-gray-700 leading-relaxed">{hotel.description}</p>
              </CardContent>
            </Card>

            {/* Amenities */}
            <Card>
              <CardContent className="p-6">
                <h2 className="text-xl font-semibold mb-4">Tiện nghi</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {hotel.amenities.map((amenity, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <Check className="size-5 text-green-600 flex-shrink-0" />
                      <span className="text-gray-700">{amenity}</span>
                    </div>
                  ))}
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
                    <p className="font-medium mb-1">{hotel.name}</p>
                    <p className="text-gray-600">{hotel.location}</p>
                    <p className="text-gray-600">{hotel.city}, Việt Nam</p>
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
                  <div className="mb-6">
                    <div className="flex items-baseline gap-2 mb-2">
                      {hotel.discount ? (
                        <>
                          <span className="text-3xl font-bold text-orange-600">
                            {Math.round(hotel.pricePerNight * (1 - hotel.discount / 100)).toLocaleString('vi-VN')}đ
                          </span>
                          <span className="text-lg text-gray-500 line-through">
                            {hotel.pricePerNight.toLocaleString('vi-VN')}đ
                          </span>
                        </>
                      ) : (
                        <span className="text-3xl font-bold text-orange-600">
                          {hotel.pricePerNight.toLocaleString('vi-VN')}đ
                        </span>
                      )}
                    </div>
                    <p className="text-gray-600">Giá mỗi đêm</p>
                  </div>

                  <Separator className="my-6" />

                  <div className="space-y-3 mb-6">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Check className="size-4 text-green-600" />
                      <span>Hủy miễn phí trong 24h</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Check className="size-4 text-green-600" />
                      <span>Không cần thanh toán trước</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Check className="size-4 text-green-600" />
                      <span>Xác nhận ngay lập tức</span>
                    </div>
                  </div>

                  <Button
                    onClick={handleBookNow}
                    className="w-full bg-orange-600 hover:bg-orange-700"
                    size="lg"
                  >
                    Đặt phòng ngay
                    <ExternalLink className="size-5 ml-2" />
                  </Button>

                  <p className="text-xs text-gray-600 text-center mt-4">
                    Bạn sẽ được chuyển đến trang đối tác để hoàn tất đặt phòng
                  </p>
                </CardContent>
              </Card>

              {/* Special Offer */}
              {hotel.discount && (
                <Card className="mt-4 bg-orange-50 border-orange-200">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <Sparkles className="size-5 text-orange-600 flex-shrink-0" />
                      <div>
                        <h3 className="font-semibold text-orange-900 mb-1">
                          Ưu đãi đặc biệt
                        </h3>
                        <p className="text-sm text-orange-800">
                          Giảm {hotel.discount}% khi đặt phòng ngay hôm nay!
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
