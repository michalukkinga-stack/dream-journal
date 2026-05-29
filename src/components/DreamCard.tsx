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
        <p className="label-caps mb-3">
          {formatDate(dream.createdAt)}
        </p>
        <h2 className="font-display text-[#f0e6d3] text-2xl leading-tight mb-2">
          {dream.title}
        </h2>
        {preview && (
          <p className="font-ui text-[#8fa3bf] text-[0.82rem] font-light leading-relaxed line-clamp-2 mt-1">
            {preview}
          </p>
        )}
      </div>
    </button>
  )
}
