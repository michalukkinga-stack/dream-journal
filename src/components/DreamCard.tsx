import { useNavigate } from 'react-router-dom'
import { Dream } from '@/types/dream'
import { stripHtml, formatDate } from '@/storage/dreamStorage'

interface DreamCardProps {
  dream: Dream
}

const MAX_VISIBLE_TAGS = 3

export function DreamCard({ dream }: DreamCardProps) {
  const navigate = useNavigate()
  const preview = stripHtml(dream.description)
  const visibleTags = dream.tags.slice(0, MAX_VISIBLE_TAGS)
  const overflow = dream.tags.length - MAX_VISIBLE_TAGS

  return (
    <button
      onClick={() => navigate(`/dream/${dream.id}`)}
      className="dream-card w-full text-left animate-fade-in"
    >
      <div className="p-5">
        <p className="label-caps mb-3">
          {formatDate(dream.createdAt)}
        </p>
        <h2 className="font-display text-[#1a1624] text-2xl leading-tight mb-2">
          {dream.title}
        </h2>
        {preview && (
          <p className="font-ui text-[#1a1624]/80 text-[0.82rem] font-light leading-relaxed line-clamp-2 mt-1">
            {preview}
          </p>
        )}
        {dream.tags.length > 0 && (
          <div className="flex flex-nowrap gap-1.5 mt-3 overflow-hidden">
            {visibleTags.map(tag => (
              <span
                key={tag}
                className="font-ui px-3 py-1 rounded-full text-[0.7rem] font-light tracking-wide whitespace-nowrap
                           border border-black/12 text-[#1a1624]/80 bg-white/60"
              >
                {tag}
              </span>
            ))}
            {overflow > 0 && (
              <span className="font-ui px-3 py-1 rounded-full text-[0.7rem] font-medium whitespace-nowrap
                               border border-black/12 text-[#1a1624]/80 bg-white/60">
                +{overflow}
              </span>
            )}
          </div>
        )}
      </div>
    </button>
  )
}
