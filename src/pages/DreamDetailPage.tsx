import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ChevronLeft, Pencil, Trash2 } from 'lucide-react'
import { getDreamById, formatDate, deleteDream } from '@/storage/dreamStorage'

export function DreamDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const dream = id ? getDreamById(id) : undefined
  const [confirmDelete, setConfirmDelete] = useState(false)

  function handleDelete() {
    if (id) {
      deleteDream(id)
      navigate('/')
    }
  }

  if (!dream) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-5 text-center">
        <p className="text-4xl mb-4">🌫️</p>
        <p className="text-[#94a3b8]">Ten sen znikł jak mgła...</p>
        <button
          onClick={() => navigate('/')}
          className="mt-6 text-[#94d5c9] text-sm underline underline-offset-4"
        >
          Wróć do listy
        </button>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col animate-slide-in-right">
      {/* Header */}
      <div className="flex items-center justify-between pt-12 px-4 pb-4">
        <button
          onClick={() => navigate(-1)}
          className="font-ui flex items-center gap-1 text-[#8fa3bf] hover:text-[#f0e6d3] transition-colors py-2 pr-3 text-sm font-light tracking-wide"
        >
          <ChevronLeft size={20} />
          <span className="text-sm">wróć</span>
        </button>

        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate(`/edit/${dream.id}`)}
            className="w-9 h-9 rounded-full bg-white/6 flex items-center justify-center
                       text-[#8fa3bf] hover:text-[#f0e6d3] hover:bg-white/12
                       transition-all duration-150 active:scale-95"
          >
            <Pencil size={16} />
          </button>
          <button
            onClick={() => setConfirmDelete(true)}
            className="w-9 h-9 rounded-full bg-white/6 flex items-center justify-center
                       text-[#8fa3bf] hover:text-red-400 hover:bg-red-400/10
                       transition-all duration-150 active:scale-95"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>

      {/* Treść snu */}
      <div className="flex-1 px-5 pb-16">
        <p className="label-caps mb-4">
          {formatDate(dream.createdAt)}
        </p>

        <h1 className="font-display text-[#f0e6d3] text-4xl leading-tight mb-6">
          {dream.title}
        </h1>

        {dream.tags && dream.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-6">
            {dream.tags.map(tag => (
              <span
                key={tag}
                className="font-ui px-3 py-1.5 rounded-full text-xs font-light tracking-wide
                           border border-[#94d5c9]/50 text-[#94d5c9] bg-[#94d5c9]/8"
              >
                {tag}
              </span>
            ))}
          </div>
        )}

        <div className="h-px w-12 bg-gradient-to-r from-[#94d5c9]/40 to-transparent mb-6" />

        {dream.description ? (
          <div
            className="font-ui dream-prose text-[#9ab0c8] text-[0.95rem] font-light leading-[1.85]"
            dangerouslySetInnerHTML={{ __html: dream.description }}
          />
        ) : (
          <p className="font-ui text-[#94a3b8]/50 text-sm font-light italic">Brak opisu.</p>
        )}
      </div>

      {/* Dialog potwierdzenia usunięcia */}
      {confirmDelete && (
        <>
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
            onClick={() => setConfirmDelete(false)}
          />
          <div
            className="fixed bottom-0 left-0 right-0 max-w-[480px] mx-auto z-50
                       rounded-t-3xl border-t border-white/10 px-5 pt-6 pb-10"
            style={{ background: 'linear-gradient(180deg, #16213e 0%, #0f3460 100%)' }}
          >
            <div className="flex justify-center mb-4">
              <div className="w-10 h-1 rounded-full bg-white/20" />
            </div>
            <p className="font-display text-[#f0e6d3] text-xl text-center mb-2">
              Usunąć ten sen?
            </p>
            <p className="font-ui text-[#8fa3bf] text-sm text-center font-light mb-8">
              Tej operacji nie można cofnąć.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmDelete(false)}
                className="font-ui flex-1 h-12 rounded-full border border-white/15
                           text-[#8fa3bf] text-sm font-light tracking-wide
                           hover:border-white/30 hover:text-[#f0e6d3]
                           transition-all duration-150 active:scale-[0.98]"
              >
                Nie
              </button>
              <button
                onClick={handleDelete}
                className="font-ui flex-1 h-12 rounded-full
                           bg-gradient-to-r from-red-700/80 to-red-600/80
                           text-white text-sm font-medium tracking-wide
                           hover:from-red-600/90 hover:to-red-500/90
                           transition-all duration-150 active:scale-[0.98]"
              >
                Tak, usuń
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
