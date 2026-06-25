import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router'
import { Heart, Loader2, Pencil, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from './ui/button'
import { Textarea } from './ui/textarea'
import { Skeleton } from './ui/skeleton'
import { cn } from './ui/utils'
import { useAuth } from '../contexts/AuthContext'
import {
  createComment,
  deleteComment,
  getComments,
  toggleCommentLike,
  updateComment,
} from '@/api/posts'
import { formatDateTime } from '@/lib/constants'
import type { PostComment, ToggleCommentLikeResponse } from '@/types/post'

interface Props {
  postId: string
}

interface CommentList {
  items: PostComment[]
  meta?: unknown
}

export function PostCommentList({ postId }: Props) {
  const queryClient = useQueryClient()
  const { isAuthenticated } = useAuth()
  const navigate = useNavigate()
  const queryKey = ['post-comments', postId] as const

  const [draft, setDraft] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editContent, setEditContent] = useState('')

  const { data, isLoading } = useQuery({
    queryKey,
    queryFn: () => getComments(postId, { size: 50 }),
  })

  const createMutation = useMutation({
    mutationFn: () => createComment(postId, { content: draft.trim() }),
    onSuccess: () => {
      setDraft('')
      queryClient.invalidateQueries({ queryKey })
      queryClient.invalidateQueries({ queryKey: ['post', postId] })
      toast.success('Đã đăng bình luận')
    },
    onError: (err: Error) => toast.error(err.message || 'Không thể đăng bình luận'),
  })

  const updateMutation = useMutation({
    mutationFn: () => updateComment(editingId!, { content: editContent.trim() }),
    onSuccess: () => {
      setEditingId(null)
      queryClient.invalidateQueries({ queryKey })
      toast.success('Đã cập nhật')
    },
    onError: (err: Error) => toast.error(err.message || 'Không thể cập nhật'),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteComment(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey })
      queryClient.invalidateQueries({ queryKey: ['post', postId] })
      toast.success('Đã xoá')
    },
    onError: (err: Error) => toast.error(err.message || 'Không thể xoá'),
  })

  const likeMutation = useMutation({
    mutationFn: (commentId: string) => toggleCommentLike(commentId),
    onMutate: async (commentId: string) => {
      await queryClient.cancelQueries({ queryKey })
      const prev = queryClient.getQueryData<CommentList>(queryKey)
      if (prev) {
        queryClient.setQueryData<CommentList>(queryKey, {
          ...prev,
          items: prev.items.map((c) =>
            c.id === commentId
              ? { ...c, isLikedByMe: !c.isLikedByMe, likeCount: c.likeCount + (c.isLikedByMe ? -1 : 1) }
              : c,
          ),
        })
      }
      return { prev }
    },
    onError: (err: Error, _v, ctx) => {
      if (ctx?.prev) queryClient.setQueryData(queryKey, ctx.prev)
      toast.error(err.message || 'Không thể thực hiện')
    },
    onSuccess: (data: ToggleCommentLikeResponse, commentId: string) => {
      const cur = queryClient.getQueryData<CommentList>(queryKey)
      if (cur) {
        queryClient.setQueryData<CommentList>(queryKey, {
          ...cur,
          items: cur.items.map((c) =>
            c.id === commentId ? { ...c, isLikedByMe: data.isLiked, likeCount: data.likeCount } : c,
          ),
        })
      }
    },
  })

  const comments = data?.items ?? []

  return (
    <div className="space-y-4">
      <h3 className="font-semibold text-lg">Bình luận ({data?.meta.total ?? 0})</h3>

      {/* Composer */}
      {isAuthenticated ? (
        <div className="space-y-2">
          <Textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="Chia sẻ cảm nhận của bạn..."
            rows={3}
            maxLength={2000}
          />
          <div className="flex justify-end">
            <Button
              onClick={() => createMutation.mutate()}
              disabled={!draft.trim() || createMutation.isPending}
              className="bg-orange-500 hover:bg-orange-600"
            >
              {createMutation.isPending && <Loader2 className="mr-2 size-4 animate-spin" />}
              Đăng bình luận
            </Button>
          </div>
        </div>
      ) : (
        <div className="rounded-lg border bg-slate-50 p-4 text-center text-sm text-slate-600">
          <Button variant="link" onClick={() => navigate('/login')} className="text-orange-600 px-1">
            Đăng nhập
          </Button>
          để bình luận
        </div>
      )}

      {/* List */}
      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-xl" />
          ))}
        </div>
      ) : comments.length === 0 ? (
        <p className="py-6 text-center text-sm text-slate-500">Chưa có bình luận nào. Hãy là người đầu tiên!</p>
      ) : (
        <ul className="space-y-3">
          {comments.map((c) => (
            <li key={c.id} className="rounded-xl border bg-white p-4">
              <div className="flex items-start gap-3">
                {c.authorAvatarUrl ? (
                  <img src={c.authorAvatarUrl} alt={c.authorName} className="size-9 shrink-0 rounded-full object-cover" />
                ) : (
                  <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-orange-500 text-white text-sm font-semibold">
                    {c.authorName.charAt(0).toUpperCase()}
                  </span>
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline gap-2 flex-wrap">
                    <span className="font-medium text-sm">{c.authorName}</span>
                    <span className="text-[11px] text-slate-400">{formatDateTime(c.createdAt)}</span>
                    {c.createdAt !== c.updatedAt && (
                      <span className="text-[11px] italic text-slate-400">(đã chỉnh sửa)</span>
                    )}
                  </div>

                  {editingId === c.id ? (
                    <div className="mt-2 space-y-2">
                      <Textarea
                        value={editContent}
                        onChange={(e) => setEditContent(e.target.value)}
                        rows={3}
                        maxLength={2000}
                      />
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={() => updateMutation.mutate()}
                          disabled={!editContent.trim() || updateMutation.isPending}
                          className="bg-orange-500 hover:bg-orange-600"
                        >
                          Lưu
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => setEditingId(null)}>
                          Huỷ
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <p className="mt-1 text-sm whitespace-pre-line text-slate-700">{c.content}</p>
                  )}

                  <div className="mt-2 flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => {
                        if (!isAuthenticated) {
                          navigate('/login')
                          return
                        }
                        likeMutation.mutate(c.id)
                      }}
                      className={cn(
                        'inline-flex items-center gap-1 text-xs transition-colors',
                        c.isLikedByMe ? 'text-rose-600' : 'text-slate-500 hover:text-rose-600',
                      )}
                    >
                      <Heart className={cn('size-3.5', c.isLikedByMe && 'fill-rose-500 text-rose-500')} />
                      {c.likeCount}
                    </button>

                    {c.isOwnedByMe && editingId !== c.id && (
                      <>
                        <button
                          type="button"
                          onClick={() => {
                            setEditingId(c.id)
                            setEditContent(c.content)
                          }}
                          className="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-orange-600"
                        >
                          <Pencil className="size-3.5" /> Sửa
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            if (confirm('Xoá bình luận này?')) deleteMutation.mutate(c.id)
                          }}
                          className="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-rose-600"
                        >
                          <Trash2 className="size-3.5" /> Xoá
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
