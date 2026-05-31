import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ChevronLeft, Pencil, Trash2, X } from 'lucide-react'
import { getDreamById, formatDate, deleteDream } from '@/storage/dreamStorage'

function DeleteContent({ onCancel, onConfirm }: { onCancel: () => void; onConfirm: () => void }) {
  return (
    <>
      {/* Nagłówek z krzyżykiem */}
      <div className="flex items-start justify-between mb-3">
        <p className="font-display text-white text-xl leading-snug">
          Na pewno usuwamy ten sen.
        </p>
        <button
          onClick={onCancel}
          className="ml-4 shrink-0 w-8 h-8 rounded-full flex items-center justify-center
                     text-white/60 hover:text-white hover:bg-white/10
                     transition-all duration-150"
        >
          <X size={18} />
        </button>
      </div>
      <p className="font-ui text-white/75 text-sm font-light mb-8">
        Nie można tego cofnąć.
      </p>
      <div className="flex gap-3">
        <button
          onClick={onCancel}
          className="font-ui flex-1 h-12 rounded-full border border-white/20
                     text-white/90 text-sm font-light tracking-wide
                     hover:border-white/50 hover:text-white
                     transition-all duration-150 active:scale-[0.98]"
        >
          Nie
        </button>
        <button
          onClick={onConfirm}
          className="font-ui flex-1 h-12 rounded-full
                     bg-gradient-to-r from-red-700/80 to-red-600/80
                     text-white text-sm font-medium tracking-wide
                     hover:from-red-600/90 hover:to-red-500/90
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
  const dream = id ? getDreamById(id) : undefined
  const [confirmDelete, setConfirmDelete] = useState(false)

  function handleDelete() {
    if (id) {
      deleteDream(id)
      navigate('/home')
    }
  }

  if (!dream) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-5 text-center">
        <p className="text-4xl mb-4">🌫️</p>
        <p className="text-white/65">Ten sen znikł jak mgła...</p>
        <button
          onClick={() => navigate('/')}
          className="mt-6 text-white/70 text-sm underline underline-offset-4"
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
          className="font-ui flex items-center gap-1 text-white/70 hover:text-white transition-colors py-2 pr-3 text-sm font-light tracking-wide"
        >
          <ChevronLeft size={20} />
          <span className="text-sm">wróć</span>
        </button>

        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate(`/edit/${dream.id}`)}
            className="w-9 h-9 rounded-full bg-white/10 border border-white/20 flex items-center justify-center
                       text-white/70 hover:text-white hover:bg-white/18
                       transition-all duration-150 active:scale-95"
          >
            <Pencil size={16} />
          </button>
          <button
            onClick={() => setConfirmDelete(true)}
            className="w-9 h-9 rounded-full bg-white/10 border border-white/20 flex items-center justify-center
                       text-white/70 hover:text-red-400 hover:bg-red-500/15
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

        <h1 className="font-display text-white text-4xl leading-tight mb-6">
          {dream.title}
        </h1>

        <div className="h-px w-12 bg-gradient-to-r from-white/25 to-transparent mb-6" />

        {dream.description ? (
          <div
            className="font-ui dream-prose text-[0.95rem] font-light leading-[1.85]"
            dangerouslySetInnerHTML={{ __html: dream.description }}
          />
        ) : (
          <p className="font-ui text-white/65 text-sm font-light italic">Brak opisu.</p>
        )}

        {dream.tags && dream.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-6">
            {dream.tags.map(tag => (
              <span
                key={tag}
                className="font-ui px-3 py-1.5 rounded-full text-xs font-light tracking-wide
                           border border-white/25 text-white/90 bg-white/10"
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
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
            onClick={() => setConfirmDelete(false)}
          />

          {/* Mobile – sheet od dołu */}
          <div
            className="md:hidden fixed bottom-0 left-0 right-0 z-50
                       rounded-t-3xl border-t border-white/10 p-5 pb-10"
            style={{ background: '#3D4254' }}
          >
            <div className="flex justify-center mb-5">
              <div className="w-10 h-1 rounded-full bg-white/20" />
            </div>
            <DeleteContent onCancel={() => setConfirmDelete(false)} onConfirm={handleDelete} />
          </div>

          {/* Desktop – modal wyśrodkowany */}
          <div className="hidden md:flex fixed inset-0 z-50 items-center justify-center p-6">
            <div
              className="w-full max-w-sm rounded-2xl shadow-xl p-5"
              style={{
                background: '#3D4254',
                border: '1px solid rgba(255,255,255,0.12)',
                backdropFilter: 'blur(24px)',
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
