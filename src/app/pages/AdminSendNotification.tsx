import { useEffect, useState } from 'react'
import { useMutation, useQuery } from '@tanstack/react-query'
import { toast } from 'sonner'
import {
  Bell,
  CheckCircle2,
  Info,
  Mail,
  Send,
  Users,
  UserCheck,
  UserCog,
  X,
  Zap,
} from 'lucide-react'
import { getAdminUsers, sendAdminNotification } from '@/api/admin'
import { AdminUser, SendAdminNotificationRequest } from '@/types/admin'
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
import { cn } from '../components/ui/utils'

type Target = 'user' | 'customer' | 'guide' | 'all'

const TARGET_CONFIG: Record<Target, { label: string; desc: string; icon: React.ElementType; color: string }> = {
  all: {
    label: 'Toàn bộ người dùng',
    desc: 'Customer + Guide',
    icon: Users,
    color: 'text-indigo-600 bg-indigo-50',
  },
  customer: {
    label: 'Tất cả Customer',
    desc: 'Khách hàng đặt tour',
    icon: UserCheck,
    color: 'text-emerald-600 bg-emerald-50',
  },
  guide: {
    label: 'Tất cả Guide',
    desc: 'Hướng dẫn viên',
    icon: UserCog,
    color: 'text-amber-600 bg-amber-50',
  },
  user: {
    label: 'Người dùng cụ thể',
    desc: 'Chọn 1 tài khoản',
    icon: Bell,
    color: 'text-purple-600 bg-purple-50',
  },
}

const TIPS = [
  { icon: Zap, text: 'Tiêu đề ngắn gọn, rõ ràng — tối đa 60 ký tự để hiển thị đầy đủ trên mobile.' },
  { icon: Info, text: 'Nội dung bổ sung chi tiết hành động cần thiết hoặc thông tin hữu ích.' },
  { icon: Mail, text: 'Chỉ bật "Gửi kèm email" cho thông báo quan trọng để tránh spam.' },
  { icon: Users, text: 'Gửi đại trà nên kiểm tra kỹ nội dung trước khi xác nhận.' },
]

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
    onError: (err: Error) => toast.error(err.message ?? 'Gửi thông báo thất bại'),
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
    if (target !== 'user') setShowConfirm(true)
    else doSend()
  }

  function handleChangeTarget(v: string) {
    setTarget(v as Target)
    setSelectedUser(null)
    setSearchQuery('')
    setSentCount(null)
  }

  const cfg = TARGET_CONFIG[target]
  const TargetIcon = cfg.icon

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Gửi thông báo</h1>
          <p className="mt-1 text-sm text-slate-500">
            Gửi thông báo tùy chỉnh đến người dùng trên hệ thống
          </p>
        </div>
        <div className="flex items-center gap-2 rounded-xl border bg-white px-4 py-2 shadow-sm">
          <Bell className="size-4 text-indigo-500" />
          <span className="text-sm font-medium text-slate-700">Push Notification</span>
        </div>
      </div>

      {/* Success banner */}
      {sentCount !== null && (
        <div className="flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3">
          <CheckCircle2 className="size-5 shrink-0 text-emerald-600" />
          <p className="text-sm text-emerald-800">
            Đã gửi thành công đến <strong>{sentCount}</strong> người dùng.
          </p>
          <button
            type="button"
            onClick={() => setSentCount(null)}
            className="ml-auto text-emerald-600 hover:text-emerald-800"
          >
            <X className="size-4" />
          </button>
        </div>
      )}

      {/* Main 2-column grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
        {/* ── Left: Form ─────────────────────────────────────────────── */}
        <div className="lg:col-span-3">
          <div className="rounded-2xl border bg-white shadow-sm">
            {/* Card header */}
            <div className="border-b px-6 py-4">
              <h2 className="text-base font-semibold text-slate-800">Soạn thông báo</h2>
              <p className="mt-0.5 text-xs text-slate-500">Điền đầy đủ thông tin bên dưới rồi nhấn Gửi</p>
            </div>

            <div className="space-y-5 px-6 py-5">
              {/* Target selector */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">Đối tượng nhận</Label>
                {/* Quick-pick chips */}
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                  {(Object.entries(TARGET_CONFIG) as [Target, typeof cfg][]).map(([key, c]) => {
                    const Icon = c.icon
                    const active = target === key
                    return (
                      <button
                        key={key}
                        type="button"
                        onClick={() => handleChangeTarget(key)}
                        className={cn(
                          'flex flex-col items-center gap-1.5 rounded-xl border p-3 text-center transition-all',
                          active
                            ? 'border-indigo-500 bg-indigo-50 ring-1 ring-indigo-500'
                            : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50',
                        )}
                      >
                        <div className={cn('rounded-lg p-1.5', active ? c.color : 'bg-slate-100 text-slate-500')}>
                          <Icon className="size-4" />
                        </div>
                        <span className={cn('text-xs font-medium leading-tight', active ? 'text-indigo-700' : 'text-slate-600')}>
                          {c.label}
                        </span>
                      </button>
                    )
                  })}
                </div>

                {/* Fallback select for small screens */}
                <Select value={target} onValueChange={handleChangeTarget}>
                  <SelectTrigger className="sm:hidden">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {(Object.entries(TARGET_CONFIG) as [Target, typeof cfg][]).map(([key, c]) => (
                      <SelectItem key={key} value={key}>{c.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* User search */}
              {target === 'user' && (
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Tìm người dùng</Label>
                  {selectedUser ? (
                    <div className="flex items-center gap-3 rounded-xl border border-indigo-200 bg-indigo-50 px-3 py-2.5">
                      <Avatar className="size-8 shrink-0">
                        <AvatarImage src={selectedUser.avatarUrl ?? undefined} />
                        <AvatarFallback>{selectedUser.fullName.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-slate-800">{selectedUser.fullName}</p>
                        <p className="truncate text-xs text-slate-500">{selectedUser.email}</p>
                      </div>
                      <Badge variant="outline" className="shrink-0 text-xs capitalize">
                        {selectedUser.role}
                      </Badge>
                      <button
                        type="button"
                        onClick={() => setSelectedUser(null)}
                        className="shrink-0 text-slate-400 hover:text-slate-700"
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
                        <div className="absolute z-10 mt-1 w-full overflow-hidden rounded-xl border bg-white shadow-lg">
                          {isSearching ? (
                            <div className="px-4 py-3 text-sm text-slate-500">Đang tìm...</div>
                          ) : !searchResults?.items.length ? (
                            <div className="px-4 py-3 text-sm text-slate-500">Không tìm thấy người dùng</div>
                          ) : (
                            searchResults.items.map((u) => (
                              <button
                                key={u.id}
                                type="button"
                                className="flex w-full items-center gap-3 px-4 py-2.5 text-left hover:bg-slate-50"
                                onClick={() => { setSelectedUser(u); setSearchQuery('') }}
                              >
                                <Avatar className="size-7 shrink-0">
                                  <AvatarImage src={u.avatarUrl ?? undefined} />
                                  <AvatarFallback>{u.fullName.charAt(0)}</AvatarFallback>
                                </Avatar>
                                <div className="min-w-0 flex-1">
                                  <p className="truncate text-sm font-medium">{u.fullName}</p>
                                  <p className="truncate text-xs text-slate-500">{u.email}</p>
                                </div>
                                <Badge variant="outline" className="shrink-0 text-xs capitalize">
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
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="notif-title" className="text-sm font-medium">
                    Tiêu đề <span className="text-red-500">*</span>
                  </Label>
                  <span className={cn('text-xs', title.length > 180 ? 'text-red-500' : 'text-slate-400')}>
                    {title.length}/200
                  </span>
                </div>
                <Input
                  id="notif-title"
                  placeholder="Nhập tiêu đề thông báo..."
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  maxLength={200}
                  className="focus-visible:ring-indigo-500"
                />
              </div>

              {/* Body */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="notif-body" className="text-sm font-medium">
                    Nội dung <span className="text-slate-400 font-normal">(tùy chọn)</span>
                  </Label>
                  <span className={cn('text-xs', body.length > 1800 ? 'text-red-500' : 'text-slate-400')}>
                    {body.length}/2000
                  </span>
                </div>
                <Textarea
                  id="notif-body"
                  placeholder="Nhập nội dung chi tiết..."
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  maxLength={2000}
                  rows={4}
                  className="resize-none focus-visible:ring-indigo-500"
                />
              </div>

              {/* Send email toggle */}
              <div className="flex items-center justify-between rounded-xl border bg-slate-50 px-4 py-3">
                <div className="flex items-center gap-3">
                  <div className="rounded-lg bg-white p-2 shadow-sm">
                    <Mail className="size-4 text-slate-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-800">Gửi kèm email</p>
                    <p className="text-xs text-slate-500">Người dùng nhận thêm email thông báo</p>
                  </div>
                </div>
                <Switch checked={sendEmail} onCheckedChange={setSendEmail} />
              </div>

              {/* Submit */}
              <Button
                onClick={handleSubmitClick}
                disabled={sendMutation.isPending}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white"
                size="lg"
              >
                <Send className="mr-2 size-4" />
                {sendMutation.isPending ? 'Đang gửi...' : 'Gửi thông báo'}
              </Button>
            </div>
          </div>
        </div>

        {/* ── Right: Preview + Tips ────────────────────────────────── */}
        <div className="space-y-4 lg:col-span-2">
          {/* Live Preview */}
          <div className="rounded-2xl border bg-white shadow-sm">
            <div className="border-b px-5 py-4">
              <h3 className="text-sm font-semibold text-slate-800">Xem trước thông báo</h3>
              <p className="mt-0.5 text-xs text-slate-500">Hiển thị theo thời gian thực</p>
            </div>
            <div className="p-5">
              {/* Mock notification item */}
              <div className="rounded-xl border bg-slate-50 p-4">
                <div className="flex gap-3">
                  <div className={cn('mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-full', cfg.color)}>
                    <TargetIcon className="size-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <p className={cn(
                        'text-sm font-semibold leading-snug',
                        title ? 'text-slate-900' : 'italic text-slate-400'
                      )}>
                        {title || 'Tiêu đề thông báo...'}
                      </p>
                      <span className="shrink-0 text-xs text-slate-400">Vừa xong</span>
                    </div>
                    {(body || !title) && (
                      <p className={cn(
                        'mt-1 text-xs leading-relaxed',
                        body ? 'text-slate-600' : 'italic text-slate-400'
                      )}>
                        {body || 'Nội dung chi tiết sẽ hiển thị ở đây...'}
                      </p>
                    )}
                    {sendEmail && (
                      <div className="mt-2 flex items-center gap-1 text-xs text-indigo-600">
                        <Mail className="size-3" />
                        <span>Kèm email</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Target summary */}
              <div className="mt-3 flex items-center gap-2 rounded-lg border border-dashed bg-white px-3 py-2.5">
                <TargetIcon className={cn('size-4 shrink-0', cfg.color.split(' ')[0])} />
                <div>
                  <p className="text-xs font-medium text-slate-700">Gửi đến: {cfg.label}</p>
                  <p className="text-xs text-slate-500">{cfg.desc}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Tips */}
          <div className="rounded-2xl border bg-white shadow-sm">
            <div className="border-b px-5 py-4">
              <h3 className="text-sm font-semibold text-slate-800">Lưu ý khi gửi thông báo</h3>
            </div>
            <div className="divide-y">
              {TIPS.map((tip, i) => {
                const Icon = tip.icon
                return (
                  <div key={i} className="flex gap-3 px-5 py-3.5">
                    <div className="mt-0.5 shrink-0 rounded-md bg-indigo-50 p-1.5">
                      <Icon className="size-3.5 text-indigo-600" />
                    </div>
                    <p className="text-xs leading-relaxed text-slate-600">{tip.text}</p>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Notification types reference */}
          <div className="rounded-2xl border bg-gradient-to-br from-indigo-50 to-indigo-100/50 p-5">
            <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-indigo-700">
              Đối tượng gửi
            </p>
            <div className="space-y-2">
              {(Object.entries(TARGET_CONFIG) as [Target, typeof cfg][]).map(([key, c]) => {
                const Icon = c.icon
                return (
                  <div key={key} className="flex items-center gap-2.5">
                    <div className={cn('rounded-md p-1.5', c.color)}>
                      <Icon className="size-3.5" />
                    </div>
                    <div>
                      <span className="text-xs font-medium text-slate-800">{c.label}</span>
                      <span className="ml-1.5 text-xs text-slate-500">— {c.desc}</span>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Confirmation dialog */}
      <AlertDialog open={showConfirm} onOpenChange={setShowConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xác nhận gửi thông báo</AlertDialogTitle>
            <AlertDialogDescription>
              Bạn sắp gửi thông báo đến{' '}
              <strong>{TARGET_CONFIG[target].label.toLowerCase()}</strong>.
              {sendEmail && ' Email cũng sẽ được gửi đến từng người dùng.'}
              {' '}Hành động này không thể hoàn tác.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Hủy</AlertDialogCancel>
            <AlertDialogAction onClick={doSend} className="bg-indigo-600 hover:bg-indigo-700">
              Xác nhận gửi
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
