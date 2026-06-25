import { useParams } from 'react-router'
import { useQuery } from '@tanstack/react-query'
import { Skeleton } from '../components/ui/skeleton'
import { PostCard } from '../components/PostCard'
import { getUserPosts } from '@/api/posts'

export function UserPosts() {
  const { userId } = useParams<{ userId: string }>()

  const { data, isLoading } = useQuery({
    queryKey: ['user-posts', userId],
    queryFn: () => getUserPosts(userId!, { size: 50 }),
    enabled: !!userId,
  })

  const posts = data?.items ?? []
  const author = posts[0]

  return (
    <div className="container mx-auto px-4 py-8 space-y-6">
      <div>
        {author ? (
          <div className="flex items-center gap-3">
            {author.authorAvatarUrl ? (
              <img src={author.authorAvatarUrl} alt={author.authorName} className="size-12 rounded-full object-cover" />
            ) : (
              <span className="flex size-12 items-center justify-center rounded-full bg-orange-500 text-white font-semibold">
                {author.authorName.charAt(0).toUpperCase()}
              </span>
            )}
            <div>
              <h1 className="text-2xl font-bold">{author.authorName}</h1>
              <p className="text-sm text-slate-500">{data?.meta.total ?? 0} bài viết</p>
            </div>
          </div>
        ) : (
          <h1 className="text-2xl font-bold">Bài viết của người dùng</h1>
        )}
      </div>

      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-80 rounded-xl" />
          ))}
        </div>
      ) : posts.length === 0 ? (
        <div className="rounded-xl border bg-white py-16 text-center text-slate-500">
          Người dùng này chưa có bài viết nào
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {posts.map((p) => (
            <PostCard key={p.id} post={p} />
          ))}
        </div>
      )}
    </div>
  )
}
