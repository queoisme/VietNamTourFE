import { useState } from 'react';
import { Link } from 'react-router';
import { Card, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';
import { Input } from '../components/ui/input';
import {
  Star,
  MapPin,
  Search,
  ExternalLink,
  Hotel as HotelIcon,
  UtensilsCrossed,
  Sparkles,
  ChevronRight,
} from 'lucide-react';
import { mockHotels, mockRestaurants, Hotel, Restaurant } from '../data/mock-accommodations';

export function Accommodations() {
  const [activeTab, setActiveTab] = useState<'hotels' | 'restaurants'>('hotels');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCity, setSelectedCity] = useState('all');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [sortBy, setSortBy] = useState('featured');

  // Get unique cities
  const cities = Array.from(
    new Set([...mockHotels.map((h) => h.city), ...mockRestaurants.map((r) => r.city)])
  );

  // Filter and sort hotels
  const filteredHotels = mockHotels
    .filter((hotel) => {
      const matchesSearch = hotel.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        hotel.location.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCity = selectedCity === 'all' || hotel.city === selectedCity;
      const matchesCategory = selectedCategory === 'all' || hotel.category === selectedCategory;
      return matchesSearch && matchesCity && matchesCategory;
    })
    .sort((a, b) => {
      if (sortBy === 'featured') return (b.featured ? 1 : 0) - (a.featured ? 1 : 0);
      if (sortBy === 'price-low') return a.pricePerNight - b.pricePerNight;
      if (sortBy === 'price-high') return b.pricePerNight - a.pricePerNight;
      if (sortBy === 'rating') return b.rating - a.rating;
      return 0;
    });

  // Filter and sort restaurants
  const filteredRestaurants = mockRestaurants
    .filter((restaurant) => {
      const matchesSearch = restaurant.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        restaurant.location.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCity = selectedCity === 'all' || restaurant.city === selectedCity;
      const matchesCategory = selectedCategory === 'all' || restaurant.category === selectedCategory;
      return matchesSearch && matchesCity && matchesCategory;
    })
    .sort((a, b) => {
      if (sortBy === 'featured') return (b.featured ? 1 : 0) - (a.featured ? 1 : 0);
      if (sortBy === 'price-low') return a.priceRange - b.priceRange;
      if (sortBy === 'price-high') return b.priceRange - a.priceRange;
      if (sortBy === 'rating') return b.rating - a.rating;
      return 0;
    });

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-orange-600 to-orange-500 text-white py-12">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="size-6" />
            <span className="text-sm font-medium uppercase tracking-wide">Khuyến mãi đặc biệt</span>
          </div>
          <h1 className="text-4xl font-bold mb-4">
            Khách sạn & Nhà hàng tại Việt Nam
          </h1>
          <p className="text-lg text-orange-50 max-w-2xl">
            Khám phá các khách sạn sang trọng và nhà hàng ngon nhất Việt Nam với giá ưu đãi đặc biệt
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'hotels' | 'restaurants')}>
          <TabsList className="grid w-full max-w-md grid-cols-2 mb-8">
            <TabsTrigger value="hotels" className="gap-2">
              <HotelIcon className="size-4" />
              Khách sạn
            </TabsTrigger>
            <TabsTrigger value="restaurants" className="gap-2">
              <UtensilsCrossed className="size-4" />
              Nhà hàng
            </TabsTrigger>
          </TabsList>

          {/* Filters */}
          <Card className="mb-6">
            <CardContent className="p-4">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {/* Search */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-400" />
                  <Input
                    placeholder="Tìm kiếm..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9"
                  />
                </div>

                {/* City */}
                <Select value={selectedCity} onValueChange={setSelectedCity}>
                  <SelectTrigger>
                    <SelectValue placeholder="Chọn thành phố" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tất cả thành phố</SelectItem>
                    {cities.map((city) => (
                      <SelectItem key={city} value={city}>
                        {city}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {/* Category */}
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger>
                    <SelectValue placeholder="Danh mục" />
                  </SelectTrigger>
                  <SelectContent>
                    {activeTab === 'hotels' ? (
                      <>
                        <SelectItem value="all">Tất cả loại hình</SelectItem>
                        <SelectItem value="hotel">Khách sạn</SelectItem>
                        <SelectItem value="resort">Resort</SelectItem>
                        <SelectItem value="hostel">Hostel</SelectItem>
                        <SelectItem value="apartment">Căn hộ</SelectItem>
                      </>
                    ) : (
                      <>
                        <SelectItem value="all">Tất cả ẩm thực</SelectItem>
                        <SelectItem value="vietnamese">Việt Nam</SelectItem>
                        <SelectItem value="asian">Châu Á</SelectItem>
                        <SelectItem value="western">Âu Mỹ</SelectItem>
                        <SelectItem value="seafood">Hải sản</SelectItem>
                        <SelectItem value="vegetarian">Chay</SelectItem>
                        <SelectItem value="cafe">Café</SelectItem>
                      </>
                    )}
                  </SelectContent>
                </Select>

                {/* Sort */}
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger>
                    <SelectValue placeholder="Sắp xếp" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="featured">Nổi bật</SelectItem>
                    <SelectItem value="rating">Đánh giá cao</SelectItem>
                    <SelectItem value="price-low">Giá thấp - cao</SelectItem>
                    <SelectItem value="price-high">Giá cao - thấp</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Hotels Tab */}
          <TabsContent value="hotels" className="mt-0">
            <div className="mb-4 text-sm text-gray-600">
              Tìm thấy {filteredHotels.length} khách sạn
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredHotels.map((hotel) => (
                <HotelCard key={hotel.id} hotel={hotel} />
              ))}
            </div>
            {filteredHotels.length === 0 && (
              <div className="text-center py-12">
                <HotelIcon className="size-12 mx-auto mb-4 text-gray-300" />
                <p className="text-gray-600">Không tìm thấy khách sạn phù hợp</p>
              </div>
            )}
          </TabsContent>

          {/* Restaurants Tab */}
          <TabsContent value="restaurants" className="mt-0">
            <div className="mb-4 text-sm text-gray-600">
              Tìm thấy {filteredRestaurants.length} nhà hàng
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredRestaurants.map((restaurant) => (
                <RestaurantCard key={restaurant.id} restaurant={restaurant} />
              ))}
            </div>
            {filteredRestaurants.length === 0 && (
              <div className="text-center py-12">
                <UtensilsCrossed className="size-12 mx-auto mb-4 text-gray-300" />
                <p className="text-gray-600">Không tìm thấy nhà hàng phù hợp</p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

function HotelCard({ hotel }: { hotel: Hotel }) {
  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow group">
      <Link to={`/accommodations/hotel/${hotel.id}`}>
        <div className="relative aspect-[4/3] overflow-hidden">
          <img
            src={hotel.images[0]}
            alt={hotel.name}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
          />
          {hotel.featured && (
            <Badge className="absolute top-3 left-3 bg-orange-600">
              <Sparkles className="size-3 mr-1" />
              Nổi bật
            </Badge>
          )}
          {hotel.discount && (
            <Badge className="absolute top-3 right-3 bg-red-600">
              -{hotel.discount}%
            </Badge>
          )}
        </div>
      </Link>

      <CardContent className="p-4">
        <div className="mb-2">
          <Link to={`/accommodations/hotel/${hotel.id}`}>
            <h3 className="font-semibold text-lg mb-1 hover:text-orange-600 transition-colors">
              {hotel.name}
            </h3>
          </Link>
          <div className="flex items-center gap-1 text-sm text-gray-600 mb-2">
            <MapPin className="size-4" />
            <span>{hotel.city}</span>
          </div>
        </div>

        <div className="flex items-center gap-2 mb-3">
          <div className="flex items-center gap-1">
            <Star className="size-4 fill-yellow-400 text-yellow-400" />
            <span className="font-medium">{hotel.rating}</span>
          </div>
          <span className="text-sm text-gray-600">({hotel.reviewCount} đánh giá)</span>
        </div>

        <div className="flex items-center gap-2 mb-3 flex-wrap">
          {hotel.amenities.slice(0, 3).map((amenity, idx) => (
            <Badge key={idx} variant="outline" className="text-xs">
              {amenity}
            </Badge>
          ))}
          {hotel.amenities.length > 3 && (
            <span className="text-xs text-gray-600">+{hotel.amenities.length - 3}</span>
          )}
        </div>

        <div className="flex items-end justify-between pt-3 border-t">
          <div>
            <div className="text-sm text-gray-600">Từ</div>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-bold text-orange-600">
                {hotel.pricePerNight.toLocaleString('vi-VN')}đ
              </span>
              <span className="text-sm text-gray-600">/đêm</span>
            </div>
          </div>
          <Link to={`/accommodations/hotel/${hotel.id}`}>
            <Button size="sm" className="bg-orange-600 hover:bg-orange-700">
              Xem chi tiết
              <ChevronRight className="size-4 ml-1" />
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}

function RestaurantCard({ restaurant }: { restaurant: Restaurant }) {
  const priceRangeDisplay = '$'.repeat(restaurant.priceRange);

  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow group">
      <Link to={`/accommodations/restaurant/${restaurant.id}`}>
        <div className="relative aspect-[4/3] overflow-hidden">
          <img
            src={restaurant.images[0]}
            alt={restaurant.name}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
          />
          {restaurant.featured && (
            <Badge className="absolute top-3 left-3 bg-orange-600">
              <Sparkles className="size-3 mr-1" />
              Nổi bật
            </Badge>
          )}
        </div>
      </Link>

      <CardContent className="p-4">
        <div className="mb-2">
          <Link to={`/accommodations/restaurant/${restaurant.id}`}>
            <h3 className="font-semibold text-lg mb-1 hover:text-orange-600 transition-colors">
              {restaurant.name}
            </h3>
          </Link>
          <div className="flex items-center gap-1 text-sm text-gray-600 mb-2">
            <MapPin className="size-4" />
            <span>{restaurant.city}</span>
          </div>
        </div>

        <div className="flex items-center gap-2 mb-3">
          <div className="flex items-center gap-1">
            <Star className="size-4 fill-yellow-400 text-yellow-400" />
            <span className="font-medium">{restaurant.rating}</span>
          </div>
          <span className="text-sm text-gray-600">({restaurant.reviewCount} đánh giá)</span>
          <span className="text-sm font-medium text-gray-700 ml-auto">{priceRangeDisplay}</span>
        </div>

        <div className="flex items-center gap-2 mb-3 flex-wrap">
          {restaurant.cuisine.slice(0, 2).map((cuisine, idx) => (
            <Badge key={idx} variant="outline" className="text-xs">
              {cuisine}
            </Badge>
          ))}
        </div>

        <p className="text-sm text-gray-600 mb-4 line-clamp-2">
          {restaurant.description}
        </p>

        <div className="flex items-center justify-between pt-3 border-t">
          <Link to={`/accommodations/restaurant/${restaurant.id}`}>
            <Button variant="outline" size="sm">
              Xem thực đơn
            </Button>
          </Link>
          <a
            href={restaurant.affiliateLink}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
          >
            <Button size="sm" className="bg-orange-600 hover:bg-orange-700">
              Đặt bàn
              <ExternalLink className="size-4 ml-1" />
            </Button>
          </a>
        </div>
      </CardContent>
    </Card>
  );
}
