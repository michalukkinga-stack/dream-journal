import { Outlet } from 'react-router-dom'

export function DesktopLayout() {
  return (
    <div className="min-h-screen">
      <Outlet />
    </div>
  )
}
