import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Component, ReactNode } from 'react'

class ErrorBoundary extends Component<{ children: ReactNode }, { error: Error | null; stack?: string }> {
  state = { error: null, stack: undefined }
  static getDerivedStateFromError(error: Error) { return { error } }
  componentDidCatch(error: Error, info: { componentStack: string }) {
    this.setState({ stack: error.stack + '\n\nComponent stack:' + info.componentStack })
  }
  render() {
    if (this.state.error) {
      return (
        <div className="min-h-screen flex flex-col items-center justify-center px-8 text-center">
          <p className="text-5xl mb-4">🌫️</p>
          <p className="font-display text-[#2d2440] text-2xl mb-2">Coś poszło nie tak</p>
          <p className="font-ui text-[#6b5f80] text-sm mb-4">
            {(this.state.error as Error).message}
          </p>
          <pre className="text-left text-[10px] text-red-700 bg-red-50 rounded-xl p-3 mb-4 max-w-full overflow-auto max-h-48 whitespace-pre-wrap">
            {this.state.stack}
          </pre>
          <button
            onClick={() => window.location.href = '/'}
            className="font-ui px-6 py-3 rounded-full bg-[#533483] text-white text-sm"
          >
            Zacznij od nowa
          </button>
        </div>
      )
    }
    return this.props.children
  }
}
import { HomePage } from '@/pages/HomePage'
import { AddDreamPage } from '@/pages/AddDreamPage'
import { EditDreamPage } from '@/pages/EditDreamPage'
import { DreamDetailPage } from '@/pages/DreamDetailPage'
import { WelcomePage } from '@/pages/WelcomePage'
import { DesktopLayout } from '@/components/DesktopLayout'


export default function App() {
  return (
    <ErrorBoundary>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<WelcomePage />} />
        <Route element={<DesktopLayout />}>
          <Route path="/home" element={<HomePage />} />
          <Route path="/add" element={<AddDreamPage />} />
          <Route path="/edit/:id" element={<EditDreamPage />} />
          <Route path="/dream/:id" element={<DreamDetailPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
    </ErrorBoundary>
  )
}
