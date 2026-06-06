import { useEffect, useState } from 'react'
import { useMutation, useQuery } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Send, X } from 'lucide-react'
import { getAdminUsers, sendAdminNotification } from '@/api/admin'
import { AdminUser, SendAdminNotificationRequest } from '@/types/admin'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Input } from '../components/ui/input'
import { Textarea } from '../components/ui/textarea'
import { Button } from '../components/ui/button'
import { Switch } from '../components/ui/switch'
import { Label } from '../components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '../components/ui/alert-dialog'
import { Avatar, AvatarFallback, AvatarImage } from '../components/ui/avatar'
import { Badge } from '../components/ui/badge'

type Target = 'user' | 'customer' | 'guide' | 'all'

const TARGET_LABELS: Record<Target, string> = {
  user: 'người dùng cụ thể',
  customer: 'tất cả customer',
  guide: 'tất cả guide',
  all: 'toàn bộ người dùng (customer + guide)',
}

export function AdminSendNotification() {
  const [target, setTarget] = useState<Target>('all')
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [sendEmail, setSendEmail] = useState(false)
  const [sentCount, setSentCount] = useState<number | null>(null)
  const [showConfirm, setShowConfirm] = useState(false)

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(searchQuery), 400)
    return () => clearTimeout(t)
  }, [searchQuery])

  const { data: searchResults, isFetching: isSearching } = useQuery({
    queryKey: ['admin-user-search', debouncedSearch],
    queryFn: () => getAdminUsers({ q: debouncedSearch, size: 6 }),
    enabled: target === 'user' && debouncedSearch.length >= 2,
  })

  const sendMutation = useMutation({
    mutationFn: sendAdminNotification,
    onSuccess: (result) => {
      setSentCount(result.sentCount)
      toast.success(`Đã gửi thông báo đến ${result.sentCount} người dùng`)
      setTitle('')
      setBody('')
      setSendEmail(false)
      setSelectedUser(null)
      setSearchQuery('')
    },
    onError: (err: Error) => {
      toast.error(err.message ?? 'Gửi thông báo thất bại')
    },
  })

  function validate(): string | null {
    if (!title.trim()) return 'Tiêu đề không được để trống'
    if (title.length > 200) return 'Tiêu đề tối đa 200 ký tự'
    if (body.length > 2000) return 'Nội dung tối đa 2000 ký tự'
    if (target === 'user' && !selectedUser) return 'Vui lòng chọn người dùng'
    return null
  }

  function doSend() {
    const payload: SendAdminNotificationRequest = {
      target,
      userId: selectedUser?.id,
      title: title.trim(),
      body: body.trim() || undefined,
      sendEmail,
    }
    sendMutation.mutate(payload)
  }

  function handleSubmitClick() {
    const err = validate()
    if (err) { toast.error(err); return }
    if (target !== 'user') {
      setShowConfirm(true)
    } else {
      doSend()
    }
  }

  function handleChangeTarget(v: string) {
    setTarget(v as Target)
    setSelectedUser(null)
    setSearchQuery('')
    setSentCount(null)
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Gửi thông báo</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Gửi thông báo tùy chỉnh đến người dùng trên hệ thống
        </p>
      </div>

      {sentCount !== null && (
        <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
          Đã gửi thành công đến <strong>{sentCount}</strong> người dùng.
        </div>
      )}

      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle className="text-base">Cài đặt thông báo</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          {/* Target */}
          <div className="space-y-1.5">
            <Label>Đối tượng nhận</Label>
            <Select value={target} onValueChange={handleChangeTarget}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toàn bộ người dùng (customer + guide)</SelectItem>
                <SelectItem value="customer">Tất cả customer</SelectItem>
                <SelectItem value="guide">Tất cả guide</SelectItem>
                <SelectItem value="user">Một người dùng cụ thể</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* User search */}
          {target === 'user' && (
            <div className="space-y-1.5">
              <Label>Tìm người dùng</Label>
              {selectedUser ? (
                <div className="flex items-center gap-2 rounded-md border px-3 py-2">
                  <Avatar className="size-7 shrink-0">
                    <AvatarImage src={selectedUser.avatarUrl ?? undefined} />
                    <AvatarFallback>{selectedUser.fullName.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{selectedUser.fullName}</p>
                    <p className="text-xs text-muted-foreground truncate">{selectedUser.email}</p>
                  </div>
                  <Badge variant="outline" className="text-xs capitalize shrink-0">
                    {selectedUser.role}
                  </Badge>
                  <button
                    type="button"
                    onClick={() => setSelectedUser(null)}
                    className="text-muted-foreground hover:text-foreground"
                  >
                    <X className="size-4" />
                  </button>
                </div>
              ) : (
                <div className="relative">
                  <Input
                    placeholder="Nhập tên hoặc email để tìm..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                  {debouncedSearch.length >= 2 && (
                    <div className="absolute z-10 mt-1 w-full rounded-md border bg-white shadow-lg">
                      {isSearching ? (
                        <div className="px-3 py-2 text-sm text-muted-foreground">Đang tìm...</div>
                      ) : !searchResults?.items.length ? (
                        <div className="px-3 py-2 text-sm text-muted-foreground">
                          Không tìm thấy người dùng
                        </div>
                      ) : (
                        searchResults.items.map((u) => (
                          <button
                            key={u.id}
                            type="button"
                            className="flex w-full items-center gap-2 px-3 py-2 hover:bg-slate-50 text-left"
                            onClick={() => { setSelectedUser(u); setSearchQuery('') }}
                          >
                            <Avatar className="size-7 shrink-0">
                              <AvatarImage src={u.avatarUrl ?? undefined} />
                              <AvatarFallback>{u.fullName.charAt(0)}</AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium truncate">{u.fullName}</p>
                              <p className="text-xs text-muted-foreground truncate">{u.email}</p>
                            </div>
                            <Badge variant="outline" className="text-xs capitalize shrink-0">
                              {u.role}
                            </Badge>
                          </button>
                        ))
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Title */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label htmlFor="notif-title">
                Tiêu đề <span className="text-red-500">*</span>
              </Label>
              <span className="text-xs text-muted-foreground">{title.length}/200</span>
            </div>
            <Input
              id="notif-title"
              placeholder="Nhập tiêu đề thông báo..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={200}
            />
          </div>

          {/* Body */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label htmlFor="notif-body">Nội dung</Label>
              <span className="text-xs text-muted-foreground">{body.length}/2000</span>
            </div>
            <Textarea
              id="notif-body"
              placeholder="Nhập nội dung chi tiết (tùy chọn)..."
              value={body}
              onChange={(e) => setBody(e.target.value)}
              maxLength={2000}
              rows={4}
            />
          </div>

          {/* Send email toggle */}
          <div className="flex items-center justify-between rounded-lg border px-4 py-3">
            <div>
              <p className="text-sm font-medium">Gửi kèm email</p>
              <p className="text-xs text-muted-foreground">
                Người dùng sẽ nhận thêm email thông báo
              </p>
            </div>
            <Switch checked={sendEmail} onCheckedChange={setSendEmail} />
          </div>

          {/* Submit button */}
          <Button
            onClick={handleSubmitClick}
            disabled={sendMutation.isPending}
            className="w-full"
          >
            <Send className="size-4 mr-2" />
            {sendMutation.isPending ? 'Đang gửi...' : 'Gửi thông báo'}
          </Button>
        </CardContent>
      </Card>

      {/* Confirmation dialog for bulk targets */}
      <AlertDialog open={showConfirm} onOpenChange={setShowConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xác nhận gửi thông báo</AlertDialogTitle>
            <AlertDialogDescription>
              Bạn sắp gửi thông báo đến{' '}
              <strong>{TARGET_LABELS[target]}</strong>.
              {sendEmail && ' Email cũng sẽ được gửi đến từng người dùng.'}
              {' '}Hành động này không thể hoàn tác.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Hủy</AlertDialogCancel>
            <AlertDialogAction onClick={doSend}>Xác nhận gửi</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
