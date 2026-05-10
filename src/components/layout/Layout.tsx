import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'
import { useStore } from '../../hooks/useStore'

export default function Layout() {
  const sidebarOpen = useStore((s) => s.sidebarOpen)

  return (
    <div className="flex h-full">
      <Sidebar />
      <main
        className={`flex-1 overflow-y-auto transition-all duration-300 ${
          sidebarOpen ? 'ml-56' : 'ml-16'
        }`}
      >
        <div className="p-6 max-w-[1600px] mx-auto">
          <Outlet />
        </div>
      </main>
    </div>
  )
}
