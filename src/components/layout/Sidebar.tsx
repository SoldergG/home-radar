import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard, Radar, Monitor, Users, Activity,
  Shield, Gauge, Settings, Bell, ChevronLeft, ChevronRight,
  Wifi, RefreshCw,
} from 'lucide-react'
import { useStore } from '../../hooks/useStore'
import { useAgent } from '../../hooks/useAgent'

const nav = [
  { to: '/',          icon: LayoutDashboard, label: 'Dashboard'     },
  { to: '/radar',     icon: Radar,           label: 'Radar'         },
  { to: '/devices',   icon: Monitor,         label: 'Dispositivos'  },
  { to: '/users',     icon: Users,           label: 'Utilizadores'  },
  { to: '/network',   icon: Activity,        label: 'Rede'          },
  { to: '/speedtest', icon: Gauge,           label: 'Speed Test'    },
  { to: '/security',  icon: Shield,          label: 'Segurança'     },
  { to: '/alerts',    icon: Bell,            label: 'Alertas'       },
  { to: '/settings',  icon: Settings,        label: 'Definições'    },
]

export default function Sidebar() {
  const { sidebarOpen, toggleSidebar, alerts } = useStore()
  const { status, lastSync, sync } = useAgent(30000)
  const unread = alerts.filter((a) => !a.read).length

  const statusColor =
    status === 'online' ? 'var(--color-green)' :
    status === 'connecting' ? 'var(--color-amber)' :
    'var(--color-red)'

  return (
    <aside
      style={{
        position: 'fixed', top: 0, left: 0, height: '100%', zIndex: 50,
        width: sidebarOpen ? 220 : 56,
        background: '#080f1d',
        borderRight: '1px solid var(--color-border)',
        display: 'flex', flexDirection: 'column',
        transition: 'width 250ms ease',
        overflow: 'hidden',
      }}
    >
      {/* Logo */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 10, padding: '0 14px',
        height: 56, borderBottom: '1px solid var(--color-border)',
        flexShrink: 0,
      }}>
        <div style={{
          width: 28, height: 28, borderRadius: 7, flexShrink: 0,
          background: 'var(--color-cyan-dim)', border: '1px solid rgba(34,211,238,0.2)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Wifi size={14} color="var(--color-cyan)" />
        </div>
        {sidebarOpen && (
          <span style={{
            fontSize: 13, fontWeight: 700, letterSpacing: '0.08em',
            color: 'var(--color-text)', whiteSpace: 'nowrap', fontFamily: 'var(--font-mono)',
          }}>
            HOME<span style={{ color: 'var(--color-cyan)' }}>RADAR</span>
          </span>
        )}
      </div>

      {/* Agent status bar */}
      {sidebarOpen && (
        <button
          onClick={sync}
          style={{
            display: 'flex', alignItems: 'center', gap: 8, padding: '8px 14px',
            borderBottom: '1px solid var(--color-border)', background: 'transparent',
            cursor: 'pointer', width: '100%',
          }}
        >
          <div style={{ width: 6, height: 6, borderRadius: '50%', background: statusColor, flexShrink: 0 }} />
          <span style={{ fontSize: 11, color: 'var(--color-muted)', flex: 1, textAlign: 'left' }}>
            {status === 'online' ? 'Agente ativo' : status === 'connecting' ? 'A ligar…' : 'Agente offline'}
          </span>
          <RefreshCw size={11} color="var(--color-muted)" style={status === 'connecting' ? { animation: 'spin 1s linear infinite' } : undefined} />
        </button>
      )}

      {/* Nav */}
      <nav style={{ flex: 1, padding: '8px 6px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 2 }}>
        {nav.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/'}
            style={({ isActive }) => ({
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '8px 8px', borderRadius: 8, cursor: 'pointer',
              textDecoration: 'none', position: 'relative',
              background: isActive ? 'var(--color-cyan-dim)' : 'transparent',
              color: isActive ? 'var(--color-cyan)' : 'var(--color-muted)',
              transition: 'all 150ms ease',
              fontSize: 13, fontWeight: isActive ? 500 : 400,
              border: isActive ? '1px solid rgba(34,211,238,0.15)' : '1px solid transparent',
              whiteSpace: 'nowrap',
            })}
            onMouseEnter={(e) => {
              const el = e.currentTarget as HTMLElement
              if (!el.style.background.includes('cyan')) {
                el.style.background = 'var(--color-elevated)'
                el.style.color = 'var(--color-text)'
              }
            }}
            onMouseLeave={(e) => {
              const el = e.currentTarget as HTMLElement
              if (!el.style.background.includes('cyan')) {
                el.style.background = 'transparent'
                el.style.color = 'var(--color-muted)'
              }
            }}
          >
            <item.icon size={16} style={{ flexShrink: 0 }} />
            {sidebarOpen && <span>{item.label}</span>}
            {item.to === '/alerts' && unread > 0 && (
              <span style={{
                marginLeft: 'auto', minWidth: 18, height: 18, borderRadius: 9,
                background: 'var(--color-red)', color: '#fff',
                fontSize: 10, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center',
                padding: '0 4px',
              }}>
                {unread}
              </span>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Collapse toggle */}
      <button
        onClick={toggleSidebar}
        style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          height: 44, borderTop: '1px solid var(--color-border)',
          background: 'transparent', cursor: 'pointer', color: 'var(--color-muted)',
          transition: 'color 150ms',
        }}
        onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--color-text)')}
        onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--color-muted)')}
      >
        {sidebarOpen ? <ChevronLeft size={14} /> : <ChevronRight size={14} />}
      </button>
    </aside>
  )
}
