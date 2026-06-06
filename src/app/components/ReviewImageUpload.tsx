import { useRef, useState } from 'react'
import { ImagePlus, X, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { uploadReviewImages } from '@/api/uploads'
import { cn } from './ui/utils'

interface Props {
  urls: string[]
  onChange: (urls: string[]) => void
  maxImages?: number
  disabled?: boolean
}

const MAX_SIZE_MB = 5
const ALLOWED = ['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif']

export function ReviewImageUpload({ urls, onChange, maxImages = 5, disabled }: Props) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)

  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return

    const remaining = maxImages - urls.length
    if (remaining <= 0) {
      toast.error(`Tối đa ${maxImages} ảnh`)
      return
    }

    const picked = Array.from(files).slice(0, remaining)

    for (const f of picked) {
      if (!ALLOWED.includes(f.type)) {
        toast.error(`${f.name}: chỉ hỗ trợ JPEG, PNG, WebP`)
        return
      }
      if (f.size > MAX_SIZE_MB * 1024 * 1024) {
        toast.error(`${f.name}: vượt quá ${MAX_SIZE_MB} MB`)
        return
      }
    }

    setUploading(true)
    try {
      const newUrls = await uploadReviewImages(picked)
      onChange([...urls, ...newUrls])
    } catch {
      toast.error('Upload ảnh thất bại, vui lòng thử lại')
    } finally {
      setUploading(false)
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  function remove(url: string) {
    onChange(urls.filter((u) => u !== url))
  }

  const canAdd = urls.length < maxImages && !disabled

  return (
    <div className="space-y-2">
      {/* Thumbnail grid */}
      {urls.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {urls.map((url) => (
            <div key={url} className="group relative size-20 overflow-hidden rounded-xl border bg-slate-100">
              <img src={url} alt="review" className="size-full object-cover" />
              {!disabled && (
                <button
                  type="button"
                  onClick={() => remove(url)}
                  className="absolute right-1 top-1 flex size-5 items-center justify-center rounded-full bg-black/60 text-white opacity-0 transition-opacity group-hover:opacity-100"
                >
                  <X className="size-3" />
                </button>
              )}
            </div>
          ))}

          {/* Spinner placeholder while uploading */}
          {uploading && (
            <div className="flex size-20 items-center justify-center rounded-xl border border-dashed bg-slate-50">
              <Loader2 className="size-5 animate-spin text-slate-400" />
            </div>
          )}
        </div>
      )}

      {/* Upload trigger */}
      {canAdd && (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className={cn(
            'flex items-center gap-2 rounded-xl border border-dashed px-4 py-2.5 text-sm transition-colors',
            uploading
              ? 'cursor-not-allowed border-slate-200 text-slate-300'
              : 'border-slate-300 text-slate-500 hover:border-indigo-400 hover:bg-indigo-50 hover:text-indigo-600',
          )}
        >
          {uploading ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <ImagePlus className="size-4" />
          )}
          {uploading ? 'Đang tải ảnh...' : `Thêm ảnh (${urls.length}/${maxImages})`}
        </button>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        multiple
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
      />
    </div>
  )
}

/** Chỉ hiển thị, không cho upload */
export function ReviewImageGallery({ images }: { images: string[] }) {
  const [lightbox, setLightbox] = useState<string | null>(null)

  if (!images || images.length === 0) return null

  return (
    <>
      <div className="mt-3 flex flex-wrap gap-2">
        {images.map((url, i) => (
          <button
            key={i}
            type="button"
            onClick={() => setLightbox(url)}
            className="size-20 overflow-hidden rounded-xl border bg-slate-100 transition-opacity hover:opacity-90"
          >
            <img src={url} alt={`Ảnh ${i + 1}`} className="size-full object-cover" />
          </button>
        ))}
      </div>

      {/* Lightbox */}
      {lightbox && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
          onClick={() => setLightbox(null)}
        >
          <img
            src={lightbox}
            alt="review"
            className="max-h-[90vh] max-w-[90vw] rounded-xl object-contain shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          />
          <button
            type="button"
            onClick={() => setLightbox(null)}
            className="absolute right-4 top-4 flex size-9 items-center justify-center rounded-full bg-white/20 text-white hover:bg-white/40"
          >
            <X className="size-5" />
          </button>
        </div>
      )}
    </>
  )
}
