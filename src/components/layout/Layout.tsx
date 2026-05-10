import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'
import { useStore } from '../../hooks/useStore'

export default function Layout() {
  const sidebarOpen = useStore((s) => s.sidebarOpen)

  return (
    <div style={{ display: 'flex', height: '100%' }}>
      <Sidebar />
      <main style={{
        flex: 1,
        marginLeft: sidebarOpen ? 220 : 56,
        overflowY: 'auto',
        transition: 'margin-left 250ms ease',
        minHeight: '100%',
      }}>
        <div style={{ maxWidth: 1400, margin: '0 auto', padding: '28px 28px' }}>
          <Outlet />
        </div>
      </main>
    </div>
  )
}
