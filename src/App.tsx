import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { HomePage } from '@/pages/HomePage'
import { AddDreamPage } from '@/pages/AddDreamPage'
import { EditDreamPage } from '@/pages/EditDreamPage'
import { DreamDetailPage } from '@/pages/DreamDetailPage'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/add" element={<AddDreamPage />} />
        <Route path="/edit/:id" element={<EditDreamPage />} />
        <Route path="/dream/:id" element={<DreamDetailPage />} />
      </Routes>
    </BrowserRouter>
  )
}
