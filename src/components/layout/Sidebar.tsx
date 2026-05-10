import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard,
  Radar,
  Monitor,
  Users,
  Activity,
  Shield,
  Gauge,
  Settings,
  Bell,
  ChevronLeft,
  ChevronRight,
  Wifi,
} from 'lucide-react'
import { useStore } from '../../hooks/useStore'

const navItems = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/radar', icon: Radar, label: 'Radar' },
  { to: '/devices', icon: Monitor, label: 'Dispositivos' },
  { to: '/users', icon: Users, label: 'Utilizadores' },
  { to: '/network', icon: Activity, label: 'Rede' },
  { to: '/speedtest', icon: Gauge, label: 'Speed Test' },
  { to: '/security', icon: Shield, label: 'Segurança' },
  { to: '/alerts', icon: Bell, label: 'Alertas' },
  { to: '/settings', icon: Settings, label: 'Definições' },
]

export default function Sidebar() {
  const { sidebarOpen, toggleSidebar, alerts } = useStore()
  const unreadAlerts = alerts.filter((a) => !a.read).length

  return (
    <aside
      className={`fixed left-0 top-0 h-full z-50 flex flex-col transition-all duration-300 ${
        sidebarOpen ? 'w-56' : 'w-16'
      }`}
      style={{
        background: 'linear-gradient(180deg, #0c0c1a 0%, #06060e 100%)',
        borderRight: '1px solid var(--color-border)',
      }}
    >
      <div className="flex items-center gap-3 px-4 h-16 border-b border-border">
        <div className="w-8 h-8 rounded-lg bg-cyan/20 flex items-center justify-center flex-shrink-0">
          <Wifi className="w-4 h-4 text-cyan" />
        </div>
        {sidebarOpen && (
          <span className="text-sm font-bold tracking-wider text-cyan whitespace-nowrap">
            HOME RADAR
          </span>
        )}
      </div>

      <nav className="flex-1 py-4 px-2 space-y-1 overflow-y-auto">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all relative group ${
                isActive
                  ? 'bg-cyan/10 text-cyan'
                  : 'text-text-secondary hover:text-text-primary hover:bg-white/5'
              }`
            }
          >
            <item.icon className="w-5 h-5 flex-shrink-0" />
            {sidebarOpen && <span>{item.label}</span>}
            {!sidebarOpen && (
              <div className="absolute left-14 px-2 py-1 bg-bg-card border border-border rounded text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity">
                {item.label}
              </div>
            )}
            {item.to === '/alerts' && unreadAlerts > 0 && (
              <span className="absolute right-2 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-red text-white text-[10px] flex items-center justify-center font-bold">
                {unreadAlerts}
              </span>
            )}
          </NavLink>
        ))}
      </nav>

      <button
        onClick={toggleSidebar}
        className="flex items-center justify-center h-12 border-t border-border text-text-muted hover:text-text-primary transition-colors"
      >
        {sidebarOpen ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
      </button>
    </aside>
  )
}
