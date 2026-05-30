import { useNavigate } from 'react-router-dom'
import { Plus } from 'lucide-react'

interface FABProps {
  label?: string
}

export function FAB({ label = 'Złapmy następny!' }: FABProps) {
  const navigate = useNavigate()

  return (
    <div className="fixed bottom-0 left-0 right-0 pointer-events-none flex justify-center">
      <div className="w-full max-w-[480px] p-4 pb-8 bg-gradient-to-t from-black/50 to-transparent">
        <button
          onClick={() => navigate('/add')}
          className="pointer-events-auto w-full h-14 rounded-full
                     bg-gradient-to-r from-[#533483] to-[#6a44a0]
                     text-white font-ui font-medium text-[0.95rem] tracking-wide
                     flex items-center justify-center gap-2
                     shadow-lg shadow-purple-900/50
                     hover:from-[#6a44a0] hover:to-[#7d55b8]
                     active:scale-[0.98] transition-all duration-150"
        >
          <Plus size={20} strokeWidth={2.5} />
          {label}
        </button>
      </div>
    </div>
  )
}
