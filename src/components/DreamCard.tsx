import { useNavigate } from 'react-router-dom'
import { Dream } from '@/types/dream'
import { stripHtml, formatDate } from '@/storage/dreamStorage'

interface DreamCardProps {
  dream: Dream
}

export function DreamCard({ dream }: DreamCardProps) {
  const navigate = useNavigate()
  const preview = stripHtml(dream.description)

  return (
    <button
      onClick={() => navigate(`/dream/${dream.id}`)}
      className="dream-card w-full text-left animate-fade-in"
    >
      <div className="p-5">
        <p className="text-xs text-[#94a3b8] mb-2 font-light tracking-wide">
          {formatDate(dream.createdAt)}
        </p>
        <h2 className="text-[#e2d4b7] font-semibold text-lg leading-snug mb-2">
          {dream.title}
        </h2>
        {preview && (
          <p className="text-[#94a3b8] text-sm leading-relaxed line-clamp-2">
            {preview}
          </p>
        )}
      </div>
    </button>
  )
}
