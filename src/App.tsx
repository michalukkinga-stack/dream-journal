import { BrowserRouter, Routes, Route, useLocation, useNavigate } from 'react-router-dom'
import { UserRound } from 'lucide-react'
import { storage } from '@/storage/dreamStorage'
import { HomePage } from '@/pages/HomePage'
import { AddDreamPage } from '@/pages/AddDreamPage'
import { EditDreamPage } from '@/pages/EditDreamPage'
import { DreamDetailPage } from '@/pages/DreamDetailPage'
import { WelcomePage } from '@/pages/WelcomePage'

function UserButton() {
  const location = useLocation()
  const navigate = useNavigate()

  if (location.pathname === '/') return null

  function handleClick() {
    storage.remove('userName')
    navigate('/', { replace: true })
  }

  return (
    <button
      onClick={handleClick}
      className="fixed top-14 right-5 z-50 w-9 h-9 rounded-full
                 bg-white/60 backdrop-blur-sm border border-purple-200/60
                 flex items-center justify-center
                 text-[#6b5f80] hover:text-[#2d2440] hover:bg-white/80
                 transition-all duration-150 active:scale-95"
      title="Zmień imię"
    >
      <UserRound size={16} />
    </button>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <UserButton />
      <Routes>
        <Route path="/" element={<WelcomePage />} />
        <Route path="/home" element={<HomePage />} />
        <Route path="/add" element={<AddDreamPage />} />
        <Route path="/edit/:id" element={<EditDreamPage />} />
        <Route path="/dream/:id" element={<DreamDetailPage />} />
      </Routes>
    </BrowserRouter>
  )
}
