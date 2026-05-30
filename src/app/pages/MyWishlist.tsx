import { Link, Navigate } from 'react-router'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Star } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '../components/ui/button'
import { Card, CardContent, CardFooter } from '../components/ui/card'
import { Skeleton } from '../components/ui/skeleton'
import { useAuth } from '../contexts/AuthContext'
import { getWishlist, removeFromWishlist } from '@/api/wishlists'
import { formatVND } from '@/lib/constants'

export function MyWishlist() {
  const { user } = useAuth()
  const queryClient = useQueryClient()

  if (!user) return <Navigate to="/login" />

  const { data, isLoading } = useQuery({
    queryKey: ['wishlist'],
    queryFn: () => getWishlist({ size: 50 }),
  })

  const removeMutation = useMutation({
    mutationFn: removeFromWishlist,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wishlist'] })
      toast.success('Đã xóa khỏi danh sách yêu thích')
    },
    onError: (err: Error) => toast.error(err.message),
  })

  const items = data?.items ?? []

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Danh sách yêu thích</h1>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-64 rounded-xl" />)}
        </div>
      ) : items.length === 0 ? (
        <div className="text-center py-20">
          <h3 className="text-xl font-semibold mb-2">Chưa có tour yêu thích</h3>
          <p className="text-gray-500 mb-6">Lưu các tour bạn thích để xem lại sau!</p>
          <Button asChild><Link to="/tours">Khám phá tour</Link></Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {items.map((item) => (
            <Card key={item.id} className="overflow-hidden hover:shadow-xl transition-shadow">
              <div className="relative h-48 overflow-hidden">
                {item.tourCoverImageUrl ? (
                  <img src={item.tourCoverImageUrl} alt={item.tourTitle} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-orange-100 flex items-center justify-center text-4xl text-orange-300">
                    ✦
                  </div>
                )}
                <button
                  className="absolute top-3 right-3 bg-white rounded-full p-1.5 shadow hover:bg-red-50 transition-colors"
                  onClick={() => removeMutation.mutate(item.tourId)}
                >
                  <span className="text-red-500 text-xs font-medium">Xóa</span>
                </button>
              </div>
              <CardContent className="p-4">
                <h3 className="font-semibold text-lg mb-1 line-clamp-2">{item.tourTitle}</h3>
                <div className="flex items-center gap-3 text-sm text-gray-600">
                  <span>{item.tourCity}</span>
                  <span className="flex items-center gap-1">
                    <Star className="size-4 fill-yellow-400 text-yellow-400" />
                    {item.avgRating.toFixed(1)} ({item.totalReviews})
                  </span>
                </div>
              </CardContent>
              <CardFooter className="p-4 pt-0 flex items-center justify-between">
                <div>
                  <span className="text-xl font-bold text-orange-600">{formatVND(item.pricePerPerson)}</span>
                  <span className="text-sm text-gray-600">/người</span>
                </div>
                <Button size="sm" className="bg-orange-600 hover:bg-orange-700" asChild>
                  <Link to={`/tours/${item.tourId}`}>Xem tour</Link>
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
