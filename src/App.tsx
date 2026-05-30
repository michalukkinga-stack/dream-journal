import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { HomePage } from '@/pages/HomePage'
import { AddDreamPage } from '@/pages/AddDreamPage'
import { EditDreamPage } from '@/pages/EditDreamPage'
import { DreamDetailPage } from '@/pages/DreamDetailPage'
import { WelcomePage } from '@/pages/WelcomePage'

export default function App() {
  const hasName = Boolean(localStorage.getItem('userName'))

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={hasName ? <Navigate to="/home" replace /> : <WelcomePage />} />
        <Route path="/home" element={<HomePage />} />
        <Route path="/add" element={<AddDreamPage />} />
        <Route path="/edit/:id" element={<EditDreamPage />} />
        <Route path="/dream/:id" element={<DreamDetailPage />} />
      </Routes>
    </BrowserRouter>
  )
}
