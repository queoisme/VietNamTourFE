import { useEffect, useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import {
  Sparkles, Plus, Trash2, Play, RefreshCw, KeyRound, CheckCircle2, XCircle, Loader2,
  MessageSquare, Boxes, Database, Activity, ChevronDown, AlertTriangle,
} from 'lucide-react'
import {
  getAiConfigs, createAiConfig, updateAiConfig, activateAiConfig, deleteAiConfig, testAiConfig,
  triggerReindex, getReindexStatus, getAiSearchLogs,
} from '@/api/ai'
import type { AiConfig, AiConfigCreateRequest } from '@/types/ai'
import { Button } from '../components/ui/button'
import { Card, CardContent } from '../components/ui/card'
import { Input } from '../components/ui/input'
import { Label } from '../components/ui/label'
import { Skeleton } from '../components/ui/skeleton'
import { Badge } from '../components/ui/badge'
import { cn } from '../components/ui/utils'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '../components/ui/select'
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '../components/ui/dialog'
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '../components/ui/alert-dialog'

const PROVIDERS = ['openrouter', 'openai', 'anthropic', 'together', 'groq', 'custom'] as const

export function AdminAiSearch() {
  const queryClient = useQueryClient()

  const { data: configs = [], isLoading } = useQuery({
    queryKey: ['admin-ai-configs'],
    queryFn: getAiConfigs,
  })

  const chatConfigs = configs.filter((c) => c.purpose === 'chat')
  const embedConfigs = configs.filter((c) => c.purpose === 'embedding')
  const activeChat = chatConfigs.find((c) => c.isActive) ?? null
  const activeEmbed = embedConfigs.find((c) => c.isActive) ?? null

  const [createPurpose, setCreatePurpose] = useState<'chat' | 'embedding' | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<AiConfig | null>(null)
  const [keyTarget, setKeyTarget] = useState<AiConfig | null>(null)
  const [newKey, setNewKey] = useState('')

  const activateMutation = useMutation({
    mutationFn: (id: string) => activateAiConfig(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-ai-configs'] })
      toast.success('Đã kích hoạt')
    },
    onError: (err: Error) => toast.error(err.message),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteAiConfig(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-ai-configs'] })
      setDeleteTarget(null)
      toast.success('Đã xoá')
    },
    onError: (err: Error) => toast.error(err.message),
  })

  const testMutation = useMutation({
    mutationFn: (id: string) => testAiConfig(id),
    onSuccess: (res) => {
      if (res.ok) toast.success(`Test OK — ${res.latencyMs}ms`)
      else toast.error(`Test thất bại: ${res.message}`)
    },
    onError: (err: Error) => toast.error(err.message),
  })

  const updateKeyMutation = useMutation({
    mutationFn: (vars: { id: string; apiKey: string }) =>
      updateAiConfig(vars.id, { apiKey: vars.apiKey }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-ai-configs'] })
      setKeyTarget(null)
      setNewKey('')
      toast.success('Đã cập nhật API key')
    },
    onError: (err: Error) => toast.error(err.message),
  })

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-5xl space-y-4">
        <Skeleton className="h-24 rounded-2xl" />
        <div className="grid md:grid-cols-2 gap-4">
          <Skeleton className="h-64 rounded-2xl" />
          <Skeleton className="h-64 rounded-2xl" />
        </div>
        <Skeleton className="h-40 rounded-2xl" />
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl">
      {/* Page header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Sparkles className="size-6 text-orange-600" /> Cấu hình AI Search
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Provider có thể đổi bất cứ lúc nào. API key được mã hoá bằng ASP.NET DataProtection trước khi lưu DB.
        </p>
      </div>

      {/* Health summary */}
      <HealthBanner activeChat={activeChat} activeEmbed={activeEmbed} />

      {/* Configs side-by-side */}
      <div className="grid md:grid-cols-2 gap-4 mt-6">
        <PurposeCard
          title="Chat model"
          subtitle="LLM rerank ứng viên + viết reasoning"
          icon={<MessageSquare className="size-5" />}
          accent="indigo"
          purpose="chat"
          configs={chatConfigs}
          activeConfig={activeChat}
          onCreate={() => setCreatePurpose('chat')}
          onActivate={(id) => activateMutation.mutate(id)}
          onDelete={(c) => setDeleteTarget(c)}
          onTest={(id) => testMutation.mutate(id)}
          onChangeKey={(c) => { setKeyTarget(c); setNewKey('') }}
          testingId={testMutation.isPending ? (testMutation.variables as string) : null}
        >
          {activeChat && <BoostThresholdField config={activeChat} />}
        </PurposeCard>

        <PurposeCard
          title="Embedding model"
          subtitle="Vector hoá tour + prompt"
          icon={<Boxes className="size-5" />}
          accent="purple"
          purpose="embedding"
          configs={embedConfigs}
          activeConfig={activeEmbed}
          onCreate={() => setCreatePurpose('embedding')}
          onActivate={(id) => activateMutation.mutate(id)}
          onDelete={(c) => setDeleteTarget(c)}
          onTest={(id) => testMutation.mutate(id)}
          onChangeKey={(c) => { setKeyTarget(c); setNewKey('') }}
          testingId={testMutation.isPending ? (testMutation.variables as string) : null}
        >
          <div className="mt-3 flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
            <AlertTriangle className="size-3.5 shrink-0 mt-0.5" />
            <span>
              Vector dim cố định <strong>1536</strong>. Đề xuất: <code className="font-mono">text-embedding-3-small</code>.
              Đổi sang model khác dim sẽ làm hỏng index — phải re-embed toàn bộ.
            </span>
          </div>
        </PurposeCard>
      </div>

      {/* Embedding index */}
      <div className="mt-6"><ReindexPanel embeddingReady={!!activeEmbed} /></div>

      {/* Logs */}
      <div className="mt-6"><LogsPanel /></div>

      {/* ─── Dialogs ───────────────────────────────────────────────────── */}
      <CreateConfigDialog
        purpose={createPurpose}
        onClose={() => setCreatePurpose(null)}
        onCreated={() => {
          queryClient.invalidateQueries({ queryKey: ['admin-ai-configs'] })
          setCreatePurpose(null)
        }}
      />

      <Dialog open={!!keyTarget} onOpenChange={(open) => !open && setKeyTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cập nhật API key</DialogTitle>
            <DialogDescription>
              {keyTarget?.provider} · {keyTarget?.model}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <Label>API key mới</Label>
            <Input
              type="password" placeholder="sk-..."
              value={newKey} onChange={(e) => setNewKey(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setKeyTarget(null)}>Huỷ</Button>
            <Button
              disabled={!newKey || updateKeyMutation.isPending}
              onClick={() => keyTarget && updateKeyMutation.mutate({ id: keyTarget.id, apiKey: newKey })}
            >
              {updateKeyMutation.isPending ? 'Đang lưu...' : 'Lưu key'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xoá config?</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteTarget?.provider} · {deleteTarget?.model}.
              {deleteTarget?.isActive && ' Đang là config active — AI search sẽ fallback sang SQL nếu chưa có config khác.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Huỷ</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)}
              className="bg-red-600 hover:bg-red-700"
            >
              Xoá
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

// ── Health banner ────────────────────────────────────────────────────────────

function HealthBanner({ activeChat, activeEmbed }: { activeChat: AiConfig | null; activeEmbed: AiConfig | null }) {
  const both = !!activeChat && !!activeEmbed
  const some = !!activeChat || !!activeEmbed
  const variant = both ? 'ok' : some ? 'partial' : 'none'
  const styles = {
    ok:      'border-emerald-200 bg-gradient-to-r from-emerald-50 to-white',
    partial: 'border-amber-200 bg-gradient-to-r from-amber-50 to-white',
    none:    'border-red-200 bg-gradient-to-r from-red-50 to-white',
  }[variant]
  const icon = {
    ok:      <CheckCircle2 className="size-5 text-emerald-600" />,
    partial: <AlertTriangle className="size-5 text-amber-600" />,
    none:    <XCircle className="size-5 text-red-600" />,
  }[variant]
  const title = {
    ok:      'AI Search hoạt động bình thường',
    partial: 'Cấu hình chưa đầy đủ',
    none:    'Chưa kích hoạt AI Search',
  }[variant]
  const body = {
    ok:      'Cả chat và embedding đều có config active. Search sẽ chạy qua flow AI đầy đủ.',
    partial: 'Cần kích hoạt cả 2 (chat + embedding) để AI hoạt động. Đang thiếu sẽ rơi vào fallback SQL.',
    none:    'Chưa có config active nào — toàn bộ search sẽ dùng SQL keyword fallback.',
  }[variant]

  return (
    <div className={cn('rounded-2xl border p-4 flex items-start gap-3', styles)}>
      <div className="shrink-0 mt-0.5">{icon}</div>
      <div className="min-w-0 flex-1">
        <p className="font-semibold text-gray-900">{title}</p>
        <p className="text-sm text-gray-600 mt-0.5">{body}</p>
        <div className="flex flex-wrap gap-2 mt-3">
          <StatusPill label="Chat" config={activeChat} />
          <StatusPill label="Embedding" config={activeEmbed} />
        </div>
      </div>
    </div>
  )
}

function StatusPill({ label, config }: { label: string; config: AiConfig | null }) {
  if (!config) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-white border border-red-200 px-2.5 py-1 text-xs text-red-700">
        <XCircle className="size-3.5" /> {label}: chưa cấu hình
      </span>
    )
  }
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-white border border-emerald-200 px-2.5 py-1 text-xs text-emerald-700">
      <CheckCircle2 className="size-3.5" />
      {label}: <span className="font-medium">{config.provider}</span> · <code className="font-mono">{config.model}</code>
    </span>
  )
}

// ── Purpose card (chat / embedding) ──────────────────────────────────────────

interface PurposeCardProps {
  title: string
  subtitle: string
  icon: React.ReactNode
  accent: 'indigo' | 'purple'
  purpose: 'chat' | 'embedding'
  configs: AiConfig[]
  activeConfig: AiConfig | null
  onCreate: () => void
  onActivate: (id: string) => void
  onDelete: (c: AiConfig) => void
  onTest: (id: string) => void
  onChangeKey: (c: AiConfig) => void
  testingId: string | null
  children?: React.ReactNode
}

function PurposeCard(p: PurposeCardProps) {
  const accentBg = p.accent === 'indigo' ? 'bg-indigo-100 text-indigo-700' : 'bg-purple-100 text-purple-700'
  const inactive = p.configs.filter((c) => !c.isActive)
  return (
    <Card className="overflow-hidden">
      <div className="px-5 py-4 flex items-center justify-between border-b bg-gradient-to-br from-gray-50 to-white">
        <div className="flex items-center gap-3 min-w-0">
          <div className={cn('size-10 rounded-xl flex items-center justify-center shrink-0', accentBg)}>
            {p.icon}
          </div>
          <div className="min-w-0">
            <h2 className="font-semibold">{p.title}</h2>
            <p className="text-xs text-gray-500">{p.subtitle}</p>
          </div>
        </div>
        <Button size="sm" variant="outline" onClick={p.onCreate}>
          <Plus className="mr-1 size-4" /> Thêm
        </Button>
      </div>
      <CardContent className="p-5">
        {p.configs.length === 0 ? (
          <EmptyConfig onCreate={p.onCreate} />
        ) : (
          <div className="space-y-2">
            {p.activeConfig && (
              <ConfigRow
                config={p.activeConfig}
                onActivate={p.onActivate}
                onDelete={p.onDelete}
                onTest={p.onTest}
                onChangeKey={p.onChangeKey}
                testing={p.testingId === p.activeConfig.id}
              />
            )}
            {inactive.length > 0 && (
              <div className="pt-2">
                <p className="text-xs uppercase tracking-wide text-gray-400 mb-2">Configs khác</p>
                {inactive.map((c) => (
                  <ConfigRow
                    key={c.id} config={c}
                    onActivate={p.onActivate} onDelete={p.onDelete}
                    onTest={p.onTest} onChangeKey={p.onChangeKey}
                    testing={p.testingId === c.id}
                  />
                ))}
              </div>
            )}
          </div>
        )}
        {p.children}
      </CardContent>
    </Card>
  )
}

function EmptyConfig({ onCreate }: { onCreate: () => void }) {
  return (
    <div className="text-center py-8">
      <Database className="mx-auto size-8 text-gray-300 mb-2" />
      <p className="text-sm text-gray-500 mb-3">Chưa có config nào</p>
      <Button size="sm" variant="outline" onClick={onCreate}>
        <Plus className="mr-1 size-4" /> Thêm config đầu tiên
      </Button>
    </div>
  )
}

function ConfigRow({
  config, onActivate, onDelete, onTest, onChangeKey, testing,
}: {
  config: AiConfig
  onActivate: (id: string) => void
  onDelete: (c: AiConfig) => void
  onTest: (id: string) => void
  onChangeKey: (c: AiConfig) => void
  testing: boolean
}) {
  return (
    <div
      className={cn(
        'rounded-xl border p-3 transition-shadow',
        config.isActive
          ? 'border-emerald-300 bg-emerald-50/50 shadow-sm'
          : 'border-gray-200 hover:border-gray-300',
      )}
    >
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            {config.isActive ? (
              <Badge className="bg-emerald-600 hover:bg-emerald-600">
                <CheckCircle2 className="mr-1 size-3" /> Active
              </Badge>
            ) : (
              <Badge variant="outline">Inactive</Badge>
            )}
            <span className="font-medium text-sm">{config.provider}</span>
            <span className="text-gray-300">·</span>
            <code className="font-mono text-sm text-gray-700">{config.model}</code>
          </div>
          <div className="mt-1.5 flex items-center gap-1.5 text-xs text-gray-500">
            <KeyRound className="size-3" />
            <span className="font-mono">{config.apiKeyMasked}</span>
          </div>
          {config.baseUrl && (
            <p className="mt-0.5 text-xs text-gray-500 truncate">URL: {config.baseUrl}</p>
          )}
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <IconBtn title="Test" onClick={() => onTest(config.id)} disabled={testing}>
            {testing ? <Loader2 className="size-4 animate-spin" /> : <Play className="size-4" />}
          </IconBtn>
          <IconBtn title="Đổi API key" onClick={() => onChangeKey(config)}>
            <KeyRound className="size-4" />
          </IconBtn>
          {!config.isActive && (
            <Button size="sm" variant="outline" onClick={() => onActivate(config.id)}>
              Kích hoạt
            </Button>
          )}
          <IconBtn title="Xoá" onClick={() => onDelete(config)} danger>
            <Trash2 className="size-4" />
          </IconBtn>
        </div>
      </div>
    </div>
  )
}

function IconBtn({
  children, onClick, title, disabled, danger,
}: {
  children: React.ReactNode
  onClick: () => void
  title?: string
  disabled?: boolean
  danger?: boolean
}) {
  return (
    <button
      type="button" onClick={onClick} disabled={disabled} title={title}
      className={cn(
        'size-8 rounded-lg flex items-center justify-center transition-colors',
        danger
          ? 'text-red-500 hover:bg-red-50 hover:text-red-700'
          : 'text-gray-500 hover:bg-gray-100 hover:text-gray-900',
        disabled && 'opacity-50 cursor-not-allowed',
      )}
    >
      {children}
    </button>
  )
}

// ── Boost threshold slider ───────────────────────────────────────────────────

function BoostThresholdField({ config }: { config: AiConfig }) {
  const queryClient = useQueryClient()
  const initial = typeof config.extraParams?.boost_threshold === 'number'
    ? (config.extraParams.boost_threshold as number) : 0.6
  const [value, setValue] = useState<number>(initial)
  const [dirty, setDirty] = useState(false)

  useEffect(() => { setValue(initial); setDirty(false) }, [initial])

  const save = useMutation({
    mutationFn: () => updateAiConfig(config.id, {
      extraParams: { ...config.extraParams, boost_threshold: value },
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-ai-configs'] })
      setDirty(false)
      toast.success('Đã cập nhật boost threshold')
    },
    onError: (err: Error) => toast.error(err.message),
  })

  return (
    <div className="mt-4 pt-4 border-t">
      <div className="flex items-center justify-between mb-2">
        <Label className="text-sm">Boost threshold</Label>
        <span className="text-sm font-mono font-semibold text-gray-900">{value.toFixed(2)}</span>
      </div>
      <input
        type="range" min={0} max={1} step={0.05}
        value={value}
        onChange={(e) => { setValue(parseFloat(e.target.value)); setDirty(true) }}
        className="w-full accent-orange-600"
      />
      <div className="flex justify-between text-[10px] text-gray-400 mt-1">
        <span>0 (luôn boost)</span><span>0.5</span><span>1 (không bao giờ)</span>
      </div>
      <p className="text-xs text-gray-500 mt-2">
        Tour boost được +0.15 rank khi LLM chấm score ≥ ngưỡng này.
      </p>
      {dirty && (
        <Button size="sm" variant="outline" onClick={() => save.mutate()} disabled={save.isPending} className="mt-2">
          {save.isPending ? 'Đang lưu...' : 'Lưu thay đổi'}
        </Button>
      )}
    </div>
  )
}

// ── Create dialog ────────────────────────────────────────────────────────────

function CreateConfigDialog({
  purpose, onClose, onCreated,
}: { purpose: 'chat' | 'embedding' | null; onClose: () => void; onCreated: () => void }) {
  const defaults = useMemo(() => purpose === 'chat'
    ? { provider: 'openrouter', model: 'anthropic/claude-3.5-haiku' }
    : { provider: 'openai', model: 'text-embedding-3-small' }, [purpose])

  const [form, setForm] = useState<AiConfigCreateRequest>({
    purpose: purpose ?? 'chat',
    provider: defaults.provider,
    baseUrl: '',
    apiKey: '',
    model: defaults.model,
    isActive: true,
  })

  useEffect(() => {
    if (purpose) {
      setForm({
        purpose, provider: defaults.provider, baseUrl: '',
        apiKey: '', model: defaults.model, isActive: true,
      })
    }
  }, [purpose, defaults.provider, defaults.model])

  const create = useMutation({
    mutationFn: () => createAiConfig({ ...form, baseUrl: form.baseUrl?.trim() || undefined }),
    onSuccess: () => { toast.success('Đã tạo config'); onCreated() },
    onError: (err: Error) => toast.error(err.message),
  })

  return (
    <Dialog open={!!purpose} onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Thêm config {purpose === 'chat' ? 'Chat' : 'Embedding'}</DialogTitle>
          <DialogDescription>
            {purpose === 'chat'
              ? 'LLM dùng để rerank và viết reasoning. OpenRouter là lựa chọn cân bằng giá / hiệu năng.'
              : 'Model embedding chuyển text → vector 1536 chiều. OpenAI text-embedding-3-small rất rẻ và đủ tốt.'}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Provider</Label>
              <Select value={form.provider} onValueChange={(v) => setForm({ ...form, provider: v })}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {PROVIDERS.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Model</Label>
              <Input
                value={form.model}
                onChange={(e) => setForm({ ...form, model: e.target.value })}
                className="mt-1 font-mono text-sm"
              />
            </div>
          </div>
          <div>
            <Label>Base URL (optional)</Label>
            <Input
              placeholder={defaultBaseUrl(form.provider)}
              value={form.baseUrl ?? ''}
              onChange={(e) => setForm({ ...form, baseUrl: e.target.value })}
              className="mt-1 font-mono text-sm"
            />
          </div>
          <div>
            <Label>API key</Label>
            <Input
              type="password" placeholder="sk-..."
              value={form.apiKey}
              onChange={(e) => setForm({ ...form, apiKey: e.target.value })}
              className="mt-1 font-mono text-sm"
            />
          </div>
          <label className="flex items-center gap-2 text-sm pt-2">
            <input
              type="checkbox" checked={form.isActive}
              onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
            />
            Kích hoạt ngay sau khi tạo
          </label>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Huỷ</Button>
          <Button
            onClick={() => create.mutate()}
            disabled={!form.provider || !form.model || !form.apiKey || create.isPending}
          >
            {create.isPending ? 'Đang lưu...' : 'Tạo'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function defaultBaseUrl(provider: string): string {
  switch (provider) {
    case 'openrouter': return 'https://openrouter.ai/api/v1'
    case 'openai':     return 'https://api.openai.com/v1'
    case 'together':   return 'https://api.together.xyz/v1'
    case 'groq':       return 'https://api.groq.com/openai/v1'
    default:           return ''
  }
}

// ── Reindex panel ────────────────────────────────────────────────────────────

function ReindexPanel({ embeddingReady }: { embeddingReady: boolean }) {
  const queryClient = useQueryClient()
  const { data, isLoading } = useQuery({
    queryKey: ['admin-ai-reindex-status'],
    queryFn: getReindexStatus,
    refetchInterval: 10_000,
  })
  const reindex = useMutation({
    mutationFn: triggerReindex,
    onSuccess: () => {
      toast.success('Đã enqueue job re-embed')
      queryClient.invalidateQueries({ queryKey: ['admin-ai-reindex-status'] })
    },
    onError: (err: Error) => toast.error(err.message),
  })

  const pct = data && data.totalTours > 0 ? Math.round((data.embedded / data.totalTours) * 100) : 0
  const missing = data ? Math.max(0, data.totalTours - data.embedded) : 0
  const complete = pct === 100

  return (
    <Card>
      <div className="px-5 py-4 border-b bg-gradient-to-br from-gray-50 to-white flex items-center gap-3">
        <div className="size-10 rounded-xl bg-orange-100 text-orange-700 flex items-center justify-center">
          <Database className="size-5" />
        </div>
        <div>
          <h2 className="font-semibold">Embedding index</h2>
          <p className="text-xs text-gray-500">Vector cho từng tour, cập nhật mỗi khi tour create/edit</p>
        </div>
      </div>
      <CardContent className="p-5">
        {isLoading || !data ? (
          <Skeleton className="h-20 w-full" />
        ) : (
          <>
            <div className="grid grid-cols-3 gap-4 mb-4">
              <Stat label="Tour active" value={data.totalTours.toString()} />
              <Stat label="Đã embed" value={data.embedded.toString()} accent={complete ? 'green' : 'orange'} />
              <Stat label="Cần re-embed" value={missing.toString()} accent={missing > 0 ? 'amber' : undefined} />
            </div>
            <div className="relative h-2 bg-gray-100 rounded-full overflow-hidden mb-2">
              <div
                className={cn(
                  'absolute inset-y-0 left-0 rounded-full transition-all',
                  complete ? 'bg-emerald-500' : 'bg-orange-500'
                )}
                style={{ width: `${pct}%` }}
              />
            </div>
            <div className="flex items-center justify-between text-xs text-gray-500">
              <span>Cập nhật cuối: {data.lastUpdatedAt ? formatTime(data.lastUpdatedAt) : '—'}</span>
              <span className="font-medium text-gray-900">{pct}%</span>
            </div>
          </>
        )}
        <div className="mt-4 flex items-center gap-3">
          <Button
            size="sm" variant="outline"
            onClick={() => reindex.mutate()}
            disabled={!embeddingReady || reindex.isPending}
          >
            <RefreshCw className={cn('mr-2 size-4', reindex.isPending && 'animate-spin')} />
            Re-embed tất cả
          </Button>
          {!embeddingReady && (
            <span className="text-xs text-amber-600">Cần kích hoạt embedding config trước</span>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

function Stat({ label, value, accent }: { label: string; value: string; accent?: 'green' | 'orange' | 'amber' }) {
  const color = accent === 'green'  ? 'text-emerald-600'
             : accent === 'orange' ? 'text-orange-600'
             : accent === 'amber'  ? 'text-amber-600'
             : 'text-gray-900'
  return (
    <div>
      <p className="text-xs text-gray-500">{label}</p>
      <p className={cn('text-2xl font-bold mt-0.5', color)}>{value}</p>
    </div>
  )
}

// ── Logs panel ───────────────────────────────────────────────────────────────

function LogsPanel() {
  const [filter, setFilter] = useState<'all' | 'ai' | 'fallback'>('all')
  const [openLog, setOpenLog] = useState<string | null>(null)

  const { data: logs = [], isLoading } = useQuery({
    queryKey: ['admin-ai-search-logs'],
    queryFn: () => getAiSearchLogs(50),
    refetchInterval: 15_000,
  })

  const filtered = logs.filter((l) =>
    filter === 'all' ? true
    : filter === 'ai' ? !l.usedFallback
    : l.usedFallback
  )

  const totalAi = logs.filter((l) => !l.usedFallback).length
  const totalFb = logs.filter((l) => l.usedFallback).length
  const avgLatency = logs.length > 0
    ? Math.round(logs.reduce((s, l) => s + (l.latencyMs ?? 0), 0) / logs.length)
    : 0

  return (
    <Card>
      <div className="px-5 py-4 border-b bg-gradient-to-br from-gray-50 to-white flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="size-10 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center">
            <Activity className="size-5" />
          </div>
          <div>
            <h2 className="font-semibold">Logs gần đây</h2>
            <p className="text-xs text-gray-500">
              {logs.length} search · {totalAi} AI · {totalFb} fallback · TB {avgLatency}ms
            </p>
          </div>
        </div>
        <div className="flex gap-1">
          {(['all', 'ai', 'fallback'] as const).map((v) => (
            <button
              key={v}
              onClick={() => setFilter(v)}
              className={cn(
                'px-3 py-1 rounded-full text-xs font-medium transition-colors',
                filter === v
                  ? 'bg-gray-900 text-white'
                  : 'bg-white border text-gray-600 hover:bg-gray-50'
              )}
            >
              {v === 'all' ? `Tất cả (${logs.length})` : v === 'ai' ? `AI (${totalAi})` : `Fallback (${totalFb})`}
            </button>
          ))}
        </div>
      </div>
      <CardContent className="p-0">
        {isLoading ? (
          <div className="p-5"><Skeleton className="h-32 w-full" /></div>
        ) : filtered.length === 0 ? (
          <div className="p-10 text-center text-sm text-gray-500">
            {logs.length === 0 ? 'Chưa có search nào' : 'Không có log khớp filter'}
          </div>
        ) : (
          <div className="divide-y">
            {filtered.map((l) => {
              const expanded = openLog === l.id
              return (
                <div key={l.id}>
                  <button
                    type="button"
                    onClick={() => setOpenLog(expanded ? null : l.id)}
                    className="w-full px-5 py-3 grid grid-cols-12 gap-3 items-center text-sm hover:bg-gray-50 text-left"
                  >
                    <span className="col-span-3 md:col-span-2 text-xs text-gray-500 whitespace-nowrap">
                      {formatRelative(l.createdAt)}
                    </span>
                    <span className="col-span-6 md:col-span-7 truncate">
                      {l.prompt}
                    </span>
                    <span className="col-span-1 text-center text-xs">
                      <span className="inline-block px-1.5 py-0.5 rounded bg-gray-100 text-gray-700 font-mono">
                        {l.resultCount}
                      </span>
                    </span>
                    <span className="col-span-1 text-center text-xs text-gray-500 font-mono">
                      {l.latencyMs ?? '—'}ms
                    </span>
                    <span className="col-span-1 flex items-center justify-end gap-1">
                      {l.usedFallback ? (
                        <Badge variant="outline" className="border-amber-300 text-amber-700 bg-amber-50">
                          <XCircle className="mr-1 size-3" /> Fallback
                        </Badge>
                      ) : (
                        <Badge className="bg-emerald-600 hover:bg-emerald-600">
                          <CheckCircle2 className="mr-1 size-3" /> AI
                        </Badge>
                      )}
                      <ChevronDown className={cn('size-3.5 text-gray-400 transition-transform', expanded && 'rotate-180')} />
                    </span>
                  </button>
                  {expanded && (
                    <div className="px-5 pb-4 bg-gray-50/50">
                      <dl className="text-sm space-y-1.5">
                        <Row label="Thời gian" value={formatTime(l.createdAt)} />
                        <Row label="Prompt" value={l.prompt} mono />
                        <Row label="Số kết quả" value={String(l.resultCount)} />
                        <Row label="Latency" value={`${l.latencyMs ?? '—'} ms`} />
                        {l.error && <Row label="Error" value={l.error} mono error />}
                      </dl>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function Row({ label, value, mono, error }: { label: string; value: string; mono?: boolean; error?: boolean }) {
  return (
    <div className="grid grid-cols-12 gap-2">
      <dt className="col-span-3 text-xs text-gray-500 pt-0.5">{label}</dt>
      <dd className={cn(
        'col-span-9 break-words',
        mono && 'font-mono text-xs',
        error && 'text-red-600',
      )}>{value}</dd>
    </div>
  )
}

// ── Time formatters ──────────────────────────────────────────────────────────

function formatTime(iso: string) {
  return new Date(iso).toLocaleString('vi-VN', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
  })
}

function formatRelative(iso: string) {
  const ms = Date.now() - new Date(iso).getTime()
  const s = Math.floor(ms / 1000)
  if (s < 60) return `${s}s trước`
  const m = Math.floor(s / 60)
  if (m < 60) return `${m}p trước`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h trước`
  const d = Math.floor(h / 24)
  if (d < 7) return `${d}d trước`
  return new Date(iso).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' })
}
