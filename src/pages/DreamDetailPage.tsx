import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ChevronLeft, Trash2, X } from 'lucide-react'
import { getDreamById, formatDate, deleteDream } from '@/storage/dreamStorage'
import { Dream } from '@/types/dream'

function DeleteContent({ onCancel, onConfirm }: { onCancel: () => void; onConfirm: () => void }) {
  return (
    <>
      <button
        onClick={onCancel}
        className="absolute -top-2 -right-2 w-8 h-8 rounded-full flex items-center justify-center
                   text-[#1a1624]/75 hover:text-[#1a1624] hover:bg-black/8
                   transition-all duration-150"
      >
        <X size={18} />
      </button>
      <p className="font-display text-[#1a1624] text-xl leading-snug font-bold">
        Na pewno chcesz usunąć ten sen?
      </p>
      <p className="font-ui text-[#1a1624]/80 text-sm font-light mb-8" style={{ marginTop: '4px' }}>
        Nie można tego cofnąć.
      </p>
      <div className="flex gap-3">
        <button
          onClick={onCancel}
          className="font-ui flex-1 h-12 rounded-full border border-black/12
                     text-[#1a1624]/85 text-sm font-light tracking-wide
                     hover:border-black/25
                     transition-all duration-150 active:scale-[0.98]"
        >
          Nie
        </button>
        <button
          onClick={onConfirm}
          className="font-ui flex-1 h-12 rounded-full
                     bg-red-500
                     text-white text-sm font-medium tracking-wide
                     hover:bg-red-600
                     transition-all duration-150 active:scale-[0.98]"
        >
          Tak, usuń
        </button>
      </div>
    </>
  )
}

export function DreamDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [dream, setDream] = useState<Dream | undefined>()
  const [loading, setLoading] = useState(true)
  const [confirmDelete, setConfirmDelete] = useState(false)

  useEffect(() => {
    if (!id) return
    getDreamById(id).then(d => { setDream(d); setLoading(false) })
  }, [id])

  async function handleDelete() {
    if (id) {
      await deleteDream(id)
      navigate('/home')
    }
  }

  if (loading) return null

  if (!dream) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-5 text-center">
        <p className="text-4xl mb-4">🌫️</p>
        <p className="font-ui text-[#1a1624]/80">Ten sen znikł jak mgła...</p>
        <button
          onClick={() => navigate('/')}
          className="mt-6 text-[#1a1624]/75 text-sm underline underline-offset-4"
        >
          Wróć do listy
        </button>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col animate-slide-in-right">
      {/* Header */}
      <div className="flex items-center justify-between pt-12 px-4 pb-4 md:max-w-[900px] md:mx-auto md:w-full md:px-8">
        <button
          onClick={() => navigate('/home')}
          className="font-ui flex items-center gap-1 text-[#1a1624]/75 hover:text-[#1a1624] transition-colors py-2 pr-3 text-sm font-light tracking-wide"
        >
          <ChevronLeft size={20} />
          <span className="text-sm">wróć</span>
        </button>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setConfirmDelete(true)}
            className="w-9 h-9 rounded-full bg-black/5 border border-black/8 flex items-center justify-center
                       text-[#1a1624]/65 hover:text-red-500 hover:bg-red-50
                       transition-all duration-150 active:scale-95"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>

      {/* Treść snu */}
      <div className="flex-1 px-5 md:px-8 pb-16 max-w-[900px] mx-auto w-full">
        <p className="label-caps mb-4">
          {formatDate(dream.createdAt)}
        </p>

        <h1 className="font-display text-[#1a1624] text-4xl leading-tight mb-5">
          {dream.title}
        </h1>

        {dream.description ? (
          <div
            className="font-ui dream-prose text-[0.95rem] font-light leading-[1.85]"
            dangerouslySetInnerHTML={{ __html: dream.description }}
          />
        ) : (
          <p className="font-ui text-[#1a1624]/75 text-sm font-light italic">Brak opisu.</p>
        )}

        {dream.tags && dream.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-5">
            {dream.tags.map(tag => (
              <span
                key={tag}
                className="font-ui px-4 h-9 flex items-center rounded-full text-sm font-light tracking-wide
                           border border-black/12 text-[#1a1624]/85 bg-white/70"
              >
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Dialog potwierdzenia usunięcia */}
      {confirmDelete && (
        <>
          <div
            className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40"
            onClick={() => setConfirmDelete(false)}
          />

          {/* Mobile – sheet od dołu */}
          <div
            className="md:hidden fixed bottom-0 left-0 right-0 z-50 relative
                       rounded-t-3xl border-t border-black/5 p-5 pb-10"
            style={{ background: 'linear-gradient(160deg, #ede9f7 0%, #f5ecf3 100%)' }}
          >
            <div className="flex justify-center mb-5">
              <div className="w-10 h-1 rounded-full bg-black/15" />
            </div>
            <DeleteContent onCancel={() => setConfirmDelete(false)} onConfirm={handleDelete} />
          </div>

          {/* Desktop – modal wyśrodkowany */}
          <div className="hidden md:flex fixed inset-0 z-50 items-center justify-center p-6">
            <div
              className="relative w-full max-w-sm rounded-2xl shadow-xl p-5"
              style={{
                background: 'linear-gradient(160deg, #ede9f7 0%, #f5ecf3 100%)',
                border: '1px solid rgba(255,255,255,0.9)',
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <DeleteContent onCancel={() => setConfirmDelete(false)} onConfirm={handleDelete} />
            </div>
          </div>
        </>
      )}
    </div>
  )
}
