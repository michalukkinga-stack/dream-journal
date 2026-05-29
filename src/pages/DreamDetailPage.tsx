import { useNavigate, useParams } from 'react-router-dom'
import { ChevronLeft } from 'lucide-react'
import { getDreamById, formatDate } from '@/storage/dreamStorage'

export function DreamDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const dream = id ? getDreamById(id) : undefined

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
      <div className="flex items-center gap-2 pt-12 px-4 pb-4">
        <button
          onClick={() => navigate(-1)}
          className="font-ui flex items-center gap-1 text-[#8fa3bf] hover:text-[#f0e6d3] transition-colors py-2 pr-3 text-sm font-light tracking-wide"
        >
          <ChevronLeft size={20} />
          <span className="text-sm">wróć</span>
        </button>
      </div>

      {/* Treść snu */}
      <div className="flex-1 px-5 pb-16">
        {/* Data */}
        <p className="label-caps mb-4">
          {formatDate(dream.createdAt)}
        </p>

        {/* Tytuł */}
        <h1 className="font-display text-[#f0e6d3] text-4xl leading-tight mb-6">
          {dream.title}
        </h1>

        {/* Separator */}
        <div className="h-px w-12 bg-gradient-to-r from-[#94d5c9]/40 to-transparent mb-6" />

        {/* Opis */}
        {dream.description ? (
          <div
            className="font-ui dream-prose text-[#9ab0c8] text-[0.95rem] font-light leading-[1.85]"
            dangerouslySetInnerHTML={{ __html: dream.description }}
          />
        ) : (
          <p className="font-ui text-[#94a3b8]/50 text-sm font-light italic">Brak opisu.</p>
        )}
      </div>
    </div>
  )
}
