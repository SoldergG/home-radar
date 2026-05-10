import { useState, useRef } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Monitor, Search, Wifi, WifiOff, X, Trash2, RefreshCw, Pencil, Check } from 'lucide-react'
import { useStore } from '../hooks/useStore'
import { useAgent } from '../hooks/useAgent'
import { getDeviceIcon, formatSpeed, formatBytes, timeAgo, getSignalColor } from '../utils/helpers'
import type { DeviceType, DeviceStatus } from '../types'
import * as LucideIcons from 'lucide-react'
import type { LucideProps } from 'lucide-react'

function DynIcon({ name, ...p }: { name: string } & LucideProps) {
  const I = (LucideIcons as Record<string, React.ComponentType<LucideProps>>)[name]
  return I ? <I {...p} /> : <LucideIcons.HelpCircle {...p} />
}

const TYPES: { value: DeviceType | 'all'; label: string }[] = [
  { value: 'all', label: 'Todos' }, { value: 'phone', label: 'Telefone' },
  { value: 'laptop', label: 'Portátil' }, { value: 'tablet', label: 'Tablet' },
  { value: 'tv', label: 'TV' }, { value: 'console', label: 'Consola' },
  { value: 'router', label: 'Router' }, { value: 'camera', label: 'Câmara' },
  { value: 'iot', label: 'IoT' },
]

function Row({ label, value, mono }: { label: string; value: React.ReactNode; mono?: boolean }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '7px 0', borderBottom: '1px solid var(--color-border)', fontSize: 13 }}>
      <span style={{ color: 'var(--color-muted)' }}>{label}</span>
      <span style={mono ? { fontFamily: 'var(--font-mono)', fontSize: 11 } : undefined}>{value}</span>
    </div>
  )
}

function InlineRename({ deviceId, name }: { deviceId: string; name: string }) {
  const updateDevice = useStore((s) => s.updateDevice)
  const [editing, setEditing] = useState(false)
  const [val, setVal] = useState(name)
  const inputRef = useRef<HTMLInputElement>(null)

  const commit = () => {
    if (val.trim() && val.trim() !== name) updateDevice(deviceId, { name: val.trim() })
    setEditing(false)
  }

  if (editing) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, flex: 1 }}>
        <input
          ref={inputRef}
          autoFocus
          value={val}
          onChange={(e) => setVal(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') commit(); if (e.key === 'Escape') setEditing(false) }}
          style={{
            flex: 1, background: 'var(--color-elevated)', border: '1px solid var(--color-cyan)',
            borderRadius: 6, padding: '3px 8px', fontSize: 13, color: 'var(--color-text)',
            fontFamily: 'var(--font-sans)', outline: 'none',
          }}
        />
        <button onClick={commit} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-green)', padding: 2 }}>
          <Check size={13} />
        </button>
        <button onClick={() => setEditing(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-muted)', padding: 2 }}>
          <X size={13} />
        </button>
      </div>
    )
  }

  return (
    <div
      style={{ display: 'flex', alignItems: 'center', gap: 6, flex: 1, cursor: 'text', minWidth: 0 }}
      onClick={(e) => { e.stopPropagation(); setEditing(true); setVal(name) }}
      title="Clica para renomear"
    >
      <span style={{ fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{name}</span>
      <Pencil size={11} color="var(--color-faint)" style={{ flexShrink: 0, opacity: 0.6 }} />
    </div>
  )
}

export default function DevicesPage() {
  const { devices, users, removeDevice } = useStore()
  const { status, sync } = useAgent()
  const [sp] = useSearchParams()
  const [search, setSearch] = useState('')
  const [typeF, setTypeF] = useState<DeviceType | 'all'>('all')
  const [statusF, setStatusF] = useState<DeviceStatus | 'all'>('all')
  const [selId, setSelId] = useState<string | null>(sp.get('selected'))

  const filtered = devices.filter((d) => {
    if (search && !d.name.toLowerCase().includes(search.toLowerCase()) && !d.ip.includes(search) && !d.mac.toLowerCase().includes(search.toLowerCase())) return false
    if (typeF !== 'all' && d.type !== typeF) return false
    if (statusF !== 'all' && d.status !== statusF) return false
    return true
  })

  const sel = selId ? devices.find((d) => d.id === selId) : null
  const selUser = sel?.userId ? users.find((u) => u.id === sel.userId) : null

  const statusColor = (s: string) =>
    s === 'online' ? 'var(--color-green)' : s === 'away' ? 'var(--color-amber)' : 'var(--color-red)'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <div className="page-title" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Monitor size={18} color="var(--color-cyan)" /> Dispositivos
          </div>
          <div className="page-sub">{devices.length} dispositivos · {devices.filter((d) => d.status === 'online').length} online · clica num nome para renomear</div>
        </div>
        <button className="btn-ghost" style={{ fontSize: 12 }} onClick={sync}>
          <RefreshCw size={13} style={status === 'connecting' ? { animation: 'spin 1s linear infinite' } : undefined} />
          Actualizar scan
        </button>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: '1 1 200px', maxWidth: 300 }}>
          <Search size={13} color="var(--color-muted)" style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)' }} />
          <input className="input" style={{ paddingLeft: 32 }} placeholder="Nome, IP ou MAC…" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <select className="input" style={{ flex: '0 0 140px' }} value={typeF} onChange={(e) => setTypeF(e.target.value as DeviceType | 'all')}>
          {TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
        </select>
        <select className="input" style={{ flex: '0 0 140px' }} value={statusF} onChange={(e) => setStatusF(e.target.value as DeviceStatus | 'all')}>
          <option value="all">Todos estados</option>
          <option value="online">Online</option>
          <option value="away">Ausente</option>
          <option value="offline">Offline</option>
        </select>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: sel ? '1fr 340px' : '1fr', gap: 16, alignItems: 'start' }}>
        {/* Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px,1fr))', gap: 10 }}>
          {filtered.map((d) => {
            const user = d.userId ? users.find((u) => u.id === d.userId) : null
            const active = selId === d.id
            return (
              <div
                key={d.id}
                style={{
                  padding: 16, borderRadius: 12, cursor: 'default',
                  background: active ? 'var(--color-cyan-dim)' : 'var(--color-card)',
                  border: `1px solid ${active ? 'rgba(34,211,238,0.3)' : 'var(--color-border)'}`,
                  transition: 'all 150ms ease',
                }}
                onMouseEnter={(e) => { if (!active) (e.currentTarget as HTMLElement).style.borderColor = 'var(--color-border-hi)' }}
                onMouseLeave={(e) => { if (!active) (e.currentTarget as HTMLElement).style.borderColor = 'var(--color-border)' }}
              >
                {/* Top row: icon + status dot */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                  <div
                    style={{ width: 36, height: 36, borderRadius: 9, background: 'var(--color-elevated)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                    onClick={() => setSelId(active ? null : d.id)}
                  >
                    <DynIcon name={getDeviceIcon(d.type)} size={16} color="var(--color-cyan)" />
                  </div>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', marginTop: 4, background: statusColor(d.status) }} />
                </div>

                {/* Inline rename */}
                <div style={{ marginBottom: 4 }}>
                  <InlineRename deviceId={d.id} name={d.name} />
                </div>

                <div
                  style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--color-muted)', marginBottom: 8, cursor: 'pointer' }}
                  onClick={() => setSelId(active ? null : d.id)}
                >
                  {d.ip}
                </div>

                <div
                  style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--color-muted)', cursor: 'pointer' }}
                  onClick={() => setSelId(active ? null : d.id)}
                >
                  <span style={{ color: 'var(--color-green)' }}>{formatSpeed(d.downloadSpeed)}</span>
                  {user && <span>{user.name}</span>}
                </div>
              </div>
            )
          })}
          {filtered.length === 0 && (
            <div className="card" style={{ gridColumn: '1/-1', padding: 40, textAlign: 'center', color: 'var(--color-muted)', fontSize: 13 }}>
              Nenhum dispositivo encontrado
            </div>
          )}
        </div>

        {/* Detail panel */}
        {sel && (
          <div className="card fade-up" style={{ padding: 20, position: 'sticky', top: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 40, height: 40, borderRadius: 10, background: 'var(--color-elevated)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <DynIcon name={getDeviceIcon(sel.type)} size={18} color="var(--color-cyan)" />
                </div>
                <div style={{ minWidth: 0 }}>
                  <InlineRename deviceId={sel.id} name={sel.name} />
                  <div
                    className="badge"
                    style={{
                      marginTop: 4, fontSize: 10,
                      background: sel.status === 'online' ? 'var(--color-green-dim)' : 'rgba(248,113,113,0.12)',
                      color: statusColor(sel.status),
                    }}
                  >
                    {sel.status}
                  </div>
                </div>
              </div>
              <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-muted)', padding: 4 }} onClick={() => setSelId(null)}>
                <X size={14} />
              </button>
            </div>

            <Row label="IP"          value={sel.ip}      mono />
            <Row label="MAC"         value={sel.mac}     mono />
            <Row label="Fabricante"  value={sel.vendor || '—'} />
            <Row label="Utilizador"  value={selUser ? selUser.name : '—'} />
            <Row label="Download"    value={<span style={{ color: 'var(--color-green)', fontFamily: 'var(--font-mono)', fontSize: 12 }}>{formatSpeed(sel.downloadSpeed)}</span>} />
            <Row label="Upload"      value={<span style={{ color: 'var(--color-purple)', fontFamily: 'var(--font-mono)', fontSize: 12 }}>{formatSpeed(sel.uploadSpeed)}</span>} />
            <Row label="Total DL"    value={<span style={{ fontFamily: 'var(--font-mono)', fontSize: 12 }}>{formatBytes(sel.totalDownload)}</span>} />
            <Row label="Último visto" value={<span style={{ fontFamily: 'var(--font-mono)', fontSize: 11 }}>{timeAgo(sel.lastSeen)}</span>} />

            <div style={{ marginTop: 14, marginBottom: 16 }}>
              <div style={{ fontSize: 11, color: 'var(--color-muted)', marginBottom: 6 }}>Sinal WiFi</div>
              <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                <div className="progress-track" style={{ flex: 1 }}>
                  <div className="progress-bar" style={{ width: `${sel.signalStrength}%`, background: getSignalColor(sel.signalStrength) }} />
                </div>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--color-muted)' }}>{sel.signalStrength}%</span>
              </div>
            </div>

            <button className="btn-danger" style={{ width: '100%', justifyContent: 'center', fontSize: 12 }}
              onClick={() => { removeDevice(sel.id); setSelId(null) }}>
              <Trash2 size={12} /> Remover
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
