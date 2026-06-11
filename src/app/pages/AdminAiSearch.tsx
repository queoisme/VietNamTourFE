import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import {
  Sparkles, Plus, Trash2, Play, RefreshCw, KeyRound, CheckCircle2, XCircle, Loader2,
} from 'lucide-react'
import {
  getAiConfigs, createAiConfig, updateAiConfig, activateAiConfig, deleteAiConfig, testAiConfig,
  triggerReindex, getReindexStatus, getAiSearchLogs,
} from '@/api/ai'
import type { AiConfig, AiConfigCreateRequest } from '@/types/ai'
import { Button } from '../components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Input } from '../components/ui/input'
import { Label } from '../components/ui/label'
import { Skeleton } from '../components/ui/skeleton'
import { Badge } from '../components/ui/badge'
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
  const [boostThreshold, setBoostThreshold] = useState('')

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
      if (res.ok) toast.success(`OK — ${res.latencyMs}ms`)
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

  const updateBoostMutation = useMutation({
    mutationFn: () => {
      const v = Number(boostThreshold)
      if (!activeChat) throw new Error('Cần kích hoạt chat config trước')
      if (!Number.isFinite(v) || v < 0 || v > 1) throw new Error('Boost threshold phải từ 0 đến 1')
      return updateAiConfig(activeChat.id, {
        extraParams: { ...activeChat.extraParams, boost_threshold: v },
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-ai-configs'] })
      toast.success('Đã cập nhật boost threshold')
    },
    onError: (err: Error) => toast.error(err.message),
  })

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl space-y-4">
        {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-40 rounded-xl" />)}
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Sparkles className="size-5 text-orange-600" /> Cấu hình AI Search
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Provider có thể đổi bất cứ lúc nào. API key được mã hoá trước khi lưu DB.
          </p>
        </div>
      </div>

      {/* Chat config card */}
      <PurposeCard
        title="Chat model (rerank)"
        purpose="chat"
        configs={chatConfigs}
        onCreate={() => setCreatePurpose('chat')}
        onActivate={(id) => activateMutation.mutate(id)}
        onDelete={(c) => setDeleteTarget(c)}
        onTest={(id) => testMutation.mutate(id)}
        onChangeKey={(c) => { setKeyTarget(c); setNewKey('') }}
        testingId={testMutation.isPending ? (testMutation.variables as string) : null}
      >
        {activeChat && (
          <div className="mt-4 pt-4 border-t flex items-end gap-3">
            <div className="flex-1">
              <Label className="text-xs">Boost threshold (0-1)</Label>
              <Input
                type="number" step="0.05" min="0" max="1"
                placeholder={String(activeChat.extraParams?.boost_threshold ?? 0.6)}
                value={boostThreshold}
                onChange={(e) => setBoostThreshold(e.target.value)}
                className="mt-1"
              />
              <p className="text-xs text-gray-500 mt-1">
                Tour boost chỉ được +0.15 rank khi score ≥ ngưỡng này.
              </p>
            </div>
            <Button
              size="sm" variant="outline"
              onClick={() => updateBoostMutation.mutate()}
              disabled={updateBoostMutation.isPending || !boostThreshold}
            >
              Lưu
            </Button>
          </div>
        )}
      </PurposeCard>

      {/* Embedding config card */}
      <div className="mt-6">
        <PurposeCard
          title="Embedding model"
          purpose="embedding"
          configs={embedConfigs}
          onCreate={() => setCreatePurpose('embedding')}
          onActivate={(id) => activateMutation.mutate(id)}
          onDelete={(c) => setDeleteTarget(c)}
          onTest={(id) => testMutation.mutate(id)}
          onChangeKey={(c) => { setKeyTarget(c); setNewKey('') }}
          testingId={testMutation.isPending ? (testMutation.variables as string) : null}
        >
          <p className="mt-3 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
            ⚠ Vector dim cố định <strong>1536</strong>. Đề xuất model: <code>text-embedding-3-small</code> (OpenAI).
            Đổi sang model khác dim sẽ làm hỏng index — cần re-embed toàn bộ.
          </p>
        </PurposeCard>
      </div>

      {/* Reindex panel */}
      <ReindexPanel embeddingReady={!!activeEmbed} />

      {/* Logs panel */}
      <div className="mt-6"><LogsPanel /></div>

      {/* Create dialog */}
      <CreateConfigDialog
        purpose={createPurpose}
        onClose={() => setCreatePurpose(null)}
        onCreated={() => {
          queryClient.invalidateQueries({ queryKey: ['admin-ai-configs'] })
          setCreatePurpose(null)
        }}
      />

      {/* Replace key dialog */}
      <Dialog open={!!keyTarget} onOpenChange={(open) => !open && setKeyTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cập nhật API key</DialogTitle>
            <DialogDescription>
              Provider: {keyTarget?.provider} · Model: {keyTarget?.model}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <Label>API key mới</Label>
            <Input
              type="password"
              placeholder="sk-..."
              value={newKey}
              onChange={(e) => setNewKey(e.target.value)}
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

      {/* Delete confirm */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xoá config?</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteTarget?.provider} · {deleteTarget?.model}.
              {deleteTarget?.isActive && ' Đang là config active — AI search sẽ rơi vào fallback nếu chưa có config khác.'}
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

// ── Sub-components ───────────────────────────────────────────────────────────

interface PurposeCardProps {
  title: string
  purpose: 'chat' | 'embedding'
  configs: AiConfig[]
  onCreate: () => void
  onActivate: (id: string) => void
  onDelete: (c: AiConfig) => void
  onTest: (id: string) => void
  onChangeKey: (c: AiConfig) => void
  testingId: string | null
  children?: React.ReactNode
}

function PurposeCard(p: PurposeCardProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-base">{p.title}</CardTitle>
        <Button size="sm" variant="outline" onClick={p.onCreate}>
          <Plus className="mr-1 size-4" /> Thêm config
        </Button>
      </CardHeader>
      <CardContent>
        {p.configs.length === 0 ? (
          <p className="text-sm text-gray-500 py-6 text-center">Chưa có config nào</p>
        ) : (
          <div className="space-y-2">
            {p.configs.map((c) => (
              <div
                key={c.id}
                className={`border rounded-xl p-3 ${c.isActive ? 'border-emerald-300 bg-emerald-50' : 'border-gray-200'}`}
              >
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge variant={c.isActive ? 'default' : 'outline'} className={c.isActive ? 'bg-emerald-600' : ''}>
                        {c.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                      <span className="font-medium">{c.provider}</span>
                      <span className="text-sm text-gray-500">·</span>
                      <span className="text-sm font-mono">{c.model}</span>
                    </div>
                    <div className="mt-1 text-xs text-gray-500 flex items-center gap-1.5">
                      <KeyRound className="size-3" />
                      <span className="font-mono">{c.apiKeyMasked}</span>
                    </div>
                    {c.baseUrl && (
                      <p className="mt-0.5 text-xs text-gray-500 truncate">URL: {c.baseUrl}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <Button size="sm" variant="ghost" onClick={() => p.onChangeKey(c)} title="Đổi API key">
                      <KeyRound className="size-4" />
                    </Button>
                    <Button
                      size="sm" variant="ghost" onClick={() => p.onTest(c.id)}
                      disabled={p.testingId === c.id}
                      title="Test connection"
                    >
                      {p.testingId === c.id ? <Loader2 className="size-4 animate-spin" /> : <Play className="size-4" />}
                    </Button>
                    {!c.isActive && (
                      <Button size="sm" variant="outline" onClick={() => p.onActivate(c.id)}>
                        Activate
                      </Button>
                    )}
                    <Button
                      size="sm" variant="ghost"
                      className="text-red-500 hover:text-red-700 hover:bg-red-50"
                      onClick={() => p.onDelete(c)}
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
        {p.children}
      </CardContent>
    </Card>
  )
}

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

  // Reset form whenever dialog opens for a new purpose
  useMemo(() => {
    if (purpose) {
      setForm({
        purpose,
        provider: defaults.provider,
        baseUrl: '',
        apiKey: '',
        model: defaults.model,
        isActive: true,
      })
    }
  }, [purpose, defaults.provider, defaults.model])

  const create = useMutation({
    mutationFn: () => createAiConfig({
      ...form,
      baseUrl: form.baseUrl?.trim() || undefined,
    }),
    onSuccess: () => {
      toast.success('Đã tạo config')
      onCreated()
    },
    onError: (err: Error) => toast.error(err.message),
  })

  return (
    <Dialog open={!!purpose} onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Thêm config {purpose === 'chat' ? 'Chat' : 'Embedding'}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
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
            <Label>Base URL (optional)</Label>
            <Input
              placeholder={defaultBaseUrl(form.provider)}
              value={form.baseUrl ?? ''}
              onChange={(e) => setForm({ ...form, baseUrl: e.target.value })}
              className="mt-1"
            />
          </div>
          <div>
            <Label>Model</Label>
            <Input
              value={form.model}
              onChange={(e) => setForm({ ...form, model: e.target.value })}
              className="mt-1 font-mono text-sm"
            />
          </div>
          <div>
            <Label>API key</Label>
            <Input
              type="password"
              placeholder="sk-..."
              value={form.apiKey}
              onChange={(e) => setForm({ ...form, apiKey: e.target.value })}
              className="mt-1"
            />
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={form.isActive}
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
      toast.success('Đã enqueue job re-embed. Theo dõi tiến độ qua thanh trên.')
      queryClient.invalidateQueries({ queryKey: ['admin-ai-reindex-status'] })
    },
    onError: (err: Error) => toast.error(err.message),
  })

  const pct = data && data.totalTours > 0 ? Math.round((data.embedded / data.totalTours) * 100) : 0

  return (
    <Card className="mt-6">
      <CardHeader>
        <CardTitle className="text-base">Embedding index</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading || !data ? (
          <Skeleton className="h-16 w-full" />
        ) : (
          <>
            <div className="flex items-center justify-between mb-2 text-sm">
              <span>Tổng tour active: <strong>{data.totalTours}</strong></span>
              <span>Đã embed: <strong>{data.embedded}</strong> ({pct}%)</span>
            </div>
            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-orange-500 transition-all"
                style={{ width: `${pct}%` }}
              />
            </div>
            <p className="text-xs text-gray-500 mt-2">
              Cập nhật cuối: {data.lastUpdatedAt ? new Date(data.lastUpdatedAt).toLocaleString('vi-VN') : '—'}
            </p>
          </>
        )}
        <div className="mt-4">
          <Button
            size="sm" variant="outline"
            onClick={() => reindex.mutate()}
            disabled={!embeddingReady || reindex.isPending}
          >
            <RefreshCw className={`mr-2 size-4 ${reindex.isPending ? 'animate-spin' : ''}`} />
            Re-embed tất cả
          </Button>
          {!embeddingReady && (
            <span className="ml-3 text-xs text-amber-600">Cần kích hoạt embedding config trước</span>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

function LogsPanel() {
  const { data: logs = [], isLoading } = useQuery({
    queryKey: ['admin-ai-search-logs'],
    queryFn: () => getAiSearchLogs(50),
    refetchInterval: 15_000,
  })

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Logs gần đây</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <Skeleton className="h-32 w-full" />
        ) : logs.length === 0 ? (
          <p className="text-sm text-gray-500 text-center py-6">Chưa có search nào</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-xs text-gray-500 uppercase border-b">
                <tr>
                  <th className="text-left py-2 pr-3">Thời gian</th>
                  <th className="text-left pr-3">Prompt</th>
                  <th className="text-center pr-3">Kết quả</th>
                  <th className="text-center pr-3">Latency</th>
                  <th className="text-center">Trạng thái</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((l) => (
                  <tr key={l.id} className="border-b last:border-0">
                    <td className="py-2 pr-3 text-xs text-gray-500 whitespace-nowrap">
                      {new Date(l.createdAt).toLocaleString('vi-VN')}
                    </td>
                    <td className="pr-3 max-w-md truncate">{l.prompt}</td>
                    <td className="text-center pr-3">{l.resultCount}</td>
                    <td className="text-center pr-3">{l.latencyMs ?? '—'}ms</td>
                    <td className="text-center">
                      {l.usedFallback ? (
                        <span className="inline-flex items-center gap-1 text-amber-600">
                          <XCircle className="size-3.5" /> Fallback
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-emerald-600">
                          <CheckCircle2 className="size-3.5" /> AI
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
