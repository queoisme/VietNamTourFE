import { Link } from 'react-router'
import { MapPin, MessageCircle, Star, Heart, Eye } from 'lucide-react'
import { Card } from './ui/card'
import { Badge } from './ui/badge'
import { cn } from './ui/utils'
import { formatDate } from '@/lib/constants'
import type { Post } from '@/types/post'

const CATEGORY_LABEL: Record<string, string> = {
  nature: 'Thiên nhiên',
  culture: 'Văn hoá',
  food: 'Ẩm thực',
  resort: 'Nghỉ dưỡng',
  adventure: 'Phiêu lưu',
  other: 'Khác',
}

const ROLE_LABEL: Record<string, string> = {
  guide: 'Hướng dẫn viên',
  customer: 'Du khách',
  admin: 'Quản trị viên',
}

export function PostCard({ post }: { post: Post }) {
  const cover = post.coverImageUrl || post.images[0] || null

  return (
    <Card className="overflow-hidden transition-shadow hover:shadow-md">
      <Link to={`/posts/${post.id}`} className="block">
        {cover && (
          <div className="aspect-[16/10] w-full overflow-hidden bg-slate-100">
            <img
              src={cover}
              alt={post.title}
              loading="lazy"
              className="size-full object-cover transition-transform duration-300 hover:scale-105"
            />
          </div>
        )}
        <div className="p-4 space-y-3">
          <div className="flex items-center gap-2">
            <Badge
              variant="secondary"
              className={cn(
                'text-xs',
                post.type === 'location_review' ? 'bg-orange-100 text-orange-700' : 'bg-indigo-100 text-indigo-700',
              )}
            >
              {post.type === 'location_review' ? 'Đánh giá địa điểm' : 'Câu chuyện du lịch'}
            </Badge>
            {post.category && (
              <Badge variant="outline" className="text-xs">
                {CATEGORY_LABEL[post.category] ?? post.category}
              </Badge>
            )}
            {post.rating != null && (
              <span className="ml-auto inline-flex items-center gap-0.5 text-sm font-medium text-amber-600">
                <Star className="size-3.5 fill-amber-500 text-amber-500" />
                {post.rating}.0
              </span>
            )}
          </div>

          <h3 className="font-semibold text-base line-clamp-2 leading-snug">{post.title}</h3>

          <p className="text-sm text-slate-600 line-clamp-2">{post.content}</p>

          {post.locationCity && (
            <div className="flex items-center gap-1 text-xs text-slate-500">
              <MapPin className="size-3.5" />
              <Link
                to={`/cities/${encodeURIComponent(post.locationCity)}`}
                className="hover:text-orange-600 transition-colors"
                onClick={(e) => e.stopPropagation()}
              >
                {post.locationCity}
              </Link>
              {post.locationCountry && <span>, {post.locationCountry}</span>}
            </div>
          )}

          <div className="flex items-center justify-between border-t pt-3">
            <div className="flex items-center gap-2 text-xs text-slate-600">
              {post.authorAvatarUrl ? (
                <img src={post.authorAvatarUrl} alt={post.authorName} className="size-6 rounded-full object-cover" />
              ) : (
                <span className="flex size-6 items-center justify-center rounded-full bg-orange-500 text-white text-[11px] font-semibold">
                  {post.authorName.charAt(0).toUpperCase()}
                </span>
              )}
              <div className="flex flex-col leading-tight">
                <span className="font-medium text-slate-700">{post.authorName}</span>
                <span className="text-[10px] text-slate-400">
                  {ROLE_LABEL[post.authorRole] ?? post.authorRole} · {formatDate(post.createdAt)}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-3 text-xs text-slate-500">
              <span className="inline-flex items-center gap-1">
                <Heart className={cn('size-3.5', post.isLikedByMe && 'fill-rose-500 text-rose-500')} />
                {post.likeCount}
              </span>
              <span className="inline-flex items-center gap-1">
                <MessageCircle className="size-3.5" />
                {post.commentCount}
              </span>
              <span className="inline-flex items-center gap-1">
                <Eye className="size-3.5" />
                {post.viewCount}
              </span>
            </div>
          </div>
        </div>
      </Link>
    </Card>
  )
}
