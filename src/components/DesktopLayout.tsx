import { Outlet } from 'react-router-dom'
import { ConstellationBackground } from './ConstellationBackground'

export function DesktopLayout() {
  return (
    <div className="min-h-screen relative">
      <ConstellationBackground />
      <div className="relative" style={{ zIndex: 1 }}>
        <Outlet />
      </div>
    </div>
  )
}
