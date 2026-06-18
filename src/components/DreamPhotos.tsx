import { useRef, useState } from 'react'
import { X, Loader2 } from 'lucide-react'
import { uploadDreamPhoto, deleteDreamPhoto, updateDream } from '@/storage/dreamStorage'

interface Props {
  dreamId: string
  photoUrls: string[]
  onChange: (urls: string[]) => void
  pendingUrls?: string[]
}

export function DreamPhotos({ dreamId, photoUrls, onChange, pendingUrls = [] }: Props) {
  const [uploading, setUploading] = useState(false)
  const [lightbox, setLightbox] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return
    setUploading(true)
    try {
      const uploads = await Promise.all(
        Array.from(files).map(f => uploadDreamPhoto(dreamId, f))
      )
      const next = [...photoUrls, ...uploads]
      await updateDream(dreamId, { photoUrls: next })
      onChange(next)
    } finally {
      setUploading(false)
    }
  }

  async function handleDelete(url: string) {
    const next = photoUrls.filter(u => u !== url)
    await deleteDreamPhoto(url)
    await updateDream(dreamId, { photoUrls: next })
    onChange(next)
  }

  if (photoUrls.length === 0 && pendingUrls.length === 0) return null

  return (
    <>
      <div className="flex flex-wrap gap-2 mb-4">
        {pendingUrls.map(url => (
          <div key={url} className="relative">
            <img
              src={url}
              alt=""
              className="w-24 h-24 object-cover rounded-2xl border border-white/15 opacity-60"
            />
            <div className="absolute inset-0 flex items-center justify-center rounded-2xl">
              <Loader2 size={20} className="text-white animate-spin" />
            </div>
          </div>
        ))}
        {photoUrls.map(url => (
          <div key={url} className="relative group">
            <img
              src={url}
              alt=""
              onClick={() => setLightbox(url)}
              className="w-24 h-24 object-cover rounded-2xl cursor-pointer border border-white/15
                         hover:border-white/40 transition-all duration-150"
            />
            <button
              onClick={() => handleDelete(url)}
              className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-black/70 border border-white/20
                         flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity
                         hover:bg-black/90"
            >
              <X size={10} className="text-white" />
            </button>
          </div>
        ))}
        {dreamId && (
          <button
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
            className="w-24 h-24 rounded-2xl border border-dashed border-white/25 flex items-center justify-center
                       text-white/40 hover:text-white/70 hover:border-white/40 transition-all duration-150"
          >
            {uploading ? <Loader2 size={20} className="animate-spin" /> : <span className="text-2xl leading-none">+</span>}
          </button>
        )}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={e => handleFiles(e.target.files)}
      />

      {lightbox && (
        <div
          className="fixed inset-0 z-[60] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setLightbox(null)}
        >
          <img
            src={lightbox}
            alt=""
            className="max-w-full max-h-full rounded-2xl object-contain"
            onClick={e => e.stopPropagation()}
          />
          <button
            onClick={() => setLightbox(null)}
            className="absolute top-5 right-5 w-9 h-9 rounded-full bg-black/60 border border-white/20
                       flex items-center justify-center text-white hover:bg-black/80"
          >
            <X size={16} />
          </button>
        </div>
      )}
    </>
  )
}

interface AddPhotoButtonProps {
  dreamId?: string
  onUploaded: (url: string) => void
  disabled?: boolean
}

export function AddPhotoButton({ dreamId, onUploaded, disabled }: AddPhotoButtonProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)

  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0 || !dreamId) return
    setUploading(true)
    try {
      for (const f of Array.from(files)) {
        const url = await uploadDreamPhoto(dreamId, f)
        onUploaded(url)
      }
    } finally {
      setUploading(false)
    }
  }

  return (
    <>
      <button
        type="button"
        disabled={disabled || uploading}
        onClick={() => inputRef.current?.click()}
        className="relative w-20 h-20 rounded-full flex items-center justify-center transition-all duration-200 active:scale-95"
        style={{
          background: 'rgba(255,255,255,0.12)',
          backdropFilter: 'blur(8px)',
          WebkitBackdropFilter: 'blur(8px)',
          boxShadow: '0 0 0 1px rgba(255,255,255,0.15)',
        }}
      >
        {uploading
          ? <Loader2 size={28} className="text-white/70 animate-spin" />
          : <span className="text-white/70 text-3xl leading-none font-light">+</span>
        }
      </button>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={e => handleFiles(e.target.files)}
      />
    </>
  )
}
