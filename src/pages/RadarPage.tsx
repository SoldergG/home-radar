import { useState, useEffect } from 'react'
import { Radar, Wifi, WifiOff, Signal } from 'lucide-react'
import RadarCanvas from '../components/radar/RadarCanvas'
import { useStore } from '../hooks/useStore'
import { getDeviceIcon, formatSpeed, timeAgo, getStatusColor, getSignalColor } from '../utils/helpers'
import type { Device } from '../types'
import * as LucideIcons from 'lucide-react'
import type { LucideProps } from 'lucide-react'

function DynIcon({ name, ...p }: { name: string } & LucideProps) {
  const Icon = (LucideIcons as Record<string, React.ComponentType<LucideProps>>)[name]
  return Icon ? <Icon {...p} /> : <LucideIcons.HelpCircle {...p} />
}

function Row({ label, value, mono }: { label: string; value: React.ReactNode; mono?: boolean }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '7px 0', borderBottom: '1px solid var(--color-border)', fontSize: 13 }}>
      <span style={{ color: 'var(--color-muted)' }}>{label}</span>
      <span style={mono ? { fontFamily: 'var(--font-mono)', fontSize: 11 } : undefined}>{value}</span>
    </div>
  )
}

export default function RadarPage() {
  const { devices, users } = useStore()
  const [selected, setSelected] = useState<Device | null>(null)
  const [size, setSize] = useState(540)

  useEffect(() => {
    const update = () => {
      const w = window.innerWidth
      setSize(w < 900 ? Math.min(w - 120, 380) : w < 1400 ? 480 : 540)
    }
    update()
    window.addEventListener('resize', update)
    return () => window.removeEventListener('resize', update)
  }, [])

  const online  = devices.filter((d) => d.status === 'online')
  const offline = devices.filter((d) => d.status === 'offline')
  const user = selected?.userId ? users.find((u) => u.id === selected.userId) : null

  const toggle = (d: Device) => setSelected((s) => s?.id === d.id ? null : d)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div className="page-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <div className="page-title" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Radar size={18} color="var(--color-cyan)" />
            Radar de Rede
          </div>
          <div className="page-sub">Localização em tempo real dos dispositivos</div>
        </div>
        <div style={{ display: 'flex', gap: 16, fontSize: 12, color: 'var(--color-muted)' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--color-green)', display: 'inline-block' }} />
            {online.length} online
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--color-red)', display: 'inline-block' }} />
            {offline.length} offline
          </span>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: `${size + 40}px 1fr`, gap: 20 }}>
        {/* Radar canvas */}
        <div className="card fade-up" style={{ padding: 20, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
          <RadarCanvas devices={devices} size={size} selectedDevice={selected?.id} onDeviceClick={toggle} />
          <div style={{ display: 'flex', gap: 20, fontSize: 11, color: 'var(--color-muted)' }}>
            {[
              { color: 'var(--color-green)',  label: 'Online' },
              { color: 'var(--color-amber)',  label: 'Ausente' },
              { color: 'var(--color-red)',    label: 'Offline' },
              { color: 'var(--color-cyan)',   label: 'Router'  },
            ].map((l) => (
              <span key={l.label} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: l.color }} />
                {l.label}
              </span>
            ))}
          </div>
        </div>

        {/* Right panel */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {/* Detail card */}
          {selected ? (
            <div className="card fade-up" style={{ padding: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                <div style={{
                  width: 40, height: 40, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: 'var(--color-elevated)',
                }}>
                  <DynIcon name={getDeviceIcon(selected.type)} size={18} color="var(--color-cyan)" />
                </div>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 15 }}>{selected.name}</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 2 }}>
                    <span className={`dot-${selected.status}`} />
                    <span style={{ fontSize: 12, color: 'var(--color-muted)' }}>
                      {selected.status} {user ? `· ${user.name}` : ''}
                    </span>
                  </div>
                </div>
              </div>
              <Row label="IP"         value={selected.ip}    mono />
              <Row label="MAC"        value={selected.mac}   mono />
              <Row label="Fabricante" value={selected.vendor} />
              <Row label="Download"   value={<span style={{ color: 'var(--color-green)', fontFamily: 'var(--font-mono)', fontSize: 12 }}>{formatSpeed(selected.downloadSpeed)}</span>} />
              <Row label="Upload"     value={<span style={{ color: 'var(--color-purple)', fontFamily: 'var(--font-mono)', fontSize: 12 }}>{formatSpeed(selected.uploadSpeed)}</span>} />
              <Row label="Visto"      value={timeAgo(selected.lastSeen)} />
              <div style={{ marginTop: 14 }}>
                <div style={{ fontSize: 11, color: 'var(--color-muted)', marginBottom: 6 }}>Sinal WiFi</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div className="progress-track" style={{ flex: 1 }}>
                    <div className="progress-bar" style={{ width: `${selected.signalStrength}%`, background: getSignalColor(selected.signalStrength) }} />
                  </div>
                  <span style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--color-muted)', minWidth: 30 }}>{selected.signalStrength}%</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="card fade-up" style={{ padding: 32, textAlign: 'center' }}>
              <Signal size={28} color="var(--color-faint)" style={{ margin: '0 auto 10px' }} />
              <div style={{ fontSize: 13, color: 'var(--color-muted)' }}>Clica num dispositivo para ver detalhes</div>
            </div>
          )}

          {/* Device list */}
          <div className="card fade-up" style={{ padding: 16, flex: 1, minHeight: 0 }}>
            <div className="section-title">Todos os dispositivos</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2, maxHeight: 380, overflowY: 'auto' }}>
              {devices.map((d) => (
                <button
                  key={d.id}
                  onClick={() => toggle(d)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px',
                    borderRadius: 8, cursor: 'pointer', border: 'none', textAlign: 'left', width: '100%',
                    background: selected?.id === d.id ? 'var(--color-cyan-dim)' : 'transparent',
                    transition: 'background 150ms',
                  }}
                  onMouseEnter={(e) => { if (selected?.id !== d.id) (e.currentTarget as HTMLElement).style.background = 'var(--color-elevated)' }}
                  onMouseLeave={(e) => { if (selected?.id !== d.id) (e.currentTarget as HTMLElement).style.background = 'transparent' }}
                >
                  <DynIcon name={getDeviceIcon(d.type)} size={14} color="var(--color-muted)" />
                  <span style={{ flex: 1, fontSize: 13, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: 'var(--color-text)' }}>{d.name}</span>
                  <span style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--color-muted)' }}>{d.ip}</span>
                  {d.status === 'online' ? <Wifi size={12} color="var(--color-green)" /> : <WifiOff size={12} color="var(--color-faint)" />}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
