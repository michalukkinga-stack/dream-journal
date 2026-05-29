import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { HomePage } from '@/pages/HomePage'
import { AddDreamPage } from '@/pages/AddDreamPage'
import { DreamDetailPage } from '@/pages/DreamDetailPage'
import { BackgroundPattern } from '@/components/BackgroundPattern'

export default function App() {
  return (
    <BrowserRouter>
      <BackgroundPattern />
      <div style={{ position: 'relative', zIndex: 1 }}>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/add" element={<AddDreamPage />} />
          <Route path="/dream/:id" element={<DreamDetailPage />} />
        </Routes>
      </div>
    </BrowserRouter>
  )
}
