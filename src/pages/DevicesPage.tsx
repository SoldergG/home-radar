import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import {
  Monitor, Search, Filter, Wifi, WifiOff, ArrowDownToLine,
  ArrowUpFromLine, Clock, X, Plus, Trash2,
} from 'lucide-react'
import { useStore } from '../hooks/useStore'
import { getDeviceEmoji, formatSpeed, formatBytes, timeAgo, getStatusColor, getSignalColor } from '../utils/helpers'
import type { Device, DeviceType, DeviceStatus } from '../types'

const deviceTypes: { value: DeviceType | 'all'; label: string }[] = [
  { value: 'all', label: 'Todos' },
  { value: 'phone', label: 'Telefones' },
  { value: 'laptop', label: 'Portáteis' },
  { value: 'tablet', label: 'Tablets' },
  { value: 'tv', label: 'TVs' },
  { value: 'console', label: 'Consolas' },
  { value: 'speaker', label: 'Colunas' },
  { value: 'camera', label: 'Câmaras' },
  { value: 'router', label: 'Router' },
  { value: 'iot', label: 'IoT' },
]

export default function DevicesPage() {
  const { devices, users, removeDevice } = useStore()
  const [searchParams] = useSearchParams()
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState<DeviceType | 'all'>('all')
  const [statusFilter, setStatusFilter] = useState<DeviceStatus | 'all'>('all')
  const [selected, setSelected] = useState<string | null>(searchParams.get('selected'))
  const [showAdd, setShowAdd] = useState(false)

  const filtered = devices.filter((d) => {
    if (search && !d.name.toLowerCase().includes(search.toLowerCase()) && !d.ip.includes(search) && !d.mac.toLowerCase().includes(search.toLowerCase())) return false
    if (typeFilter !== 'all' && d.type !== typeFilter) return false
    if (statusFilter !== 'all' && d.status !== statusFilter) return false
    return true
  })

  const selectedDevice = selected ? devices.find((d) => d.id === selected) : null
  const selectedUser = selectedDevice?.userId ? users.find((u) => u.id === selectedDevice.userId) : null

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-3">
            <Monitor className="w-6 h-6 text-cyan" />
            Dispositivos
          </h1>
          <p className="text-sm text-text-secondary mt-1">
            {devices.length} dispositivos · {devices.filter((d) => d.status === 'online').length} online
          </p>
        </div>
        <button
          onClick={() => setShowAdd(!showAdd)}
          className="flex items-center gap-2 px-4 py-2 bg-cyan/10 text-cyan text-sm rounded-lg hover:bg-cyan/20 transition-colors border border-cyan/20"
        >
          <Plus className="w-4 h-4" />
          Adicionar
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
          <input
            type="text"
            placeholder="Procurar por nome, IP ou MAC..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-bg-card border border-border rounded-lg text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-cyan/50"
          />
        </div>
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value as DeviceType | 'all')}
          className="px-3 py-2 bg-bg-card border border-border rounded-lg text-sm text-text-primary focus:outline-none focus:border-cyan/50"
        >
          {deviceTypes.map((t) => (
            <option key={t.value} value={t.value}>{t.label}</option>
          ))}
        </select>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as DeviceStatus | 'all')}
          className="px-3 py-2 bg-bg-card border border-border rounded-lg text-sm text-text-primary focus:outline-none focus:border-cyan/50"
        >
          <option value="all">Todos estados</option>
          <option value="online">Online</option>
          <option value="away">Ausente</option>
          <option value="offline">Offline</option>
        </select>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[1fr_380px] gap-6">
        {/* Device Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {filtered.map((device) => {
            const user = device.userId ? users.find((u) => u.id === device.userId) : null
            return (
              <button
                key={device.id}
                onClick={() => setSelected(device.id === selected ? null : device.id)}
                className={`glass-card p-4 text-left transition-all hover:border-cyan/30 animate-fade-in-up ${
                  selected === device.id ? 'border-cyan/50 glow-cyan' : ''
                }`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">{getDeviceEmoji(device.type)}</span>
                    <div>
                      <p className="font-medium text-sm truncate max-w-[140px]">{device.name}</p>
                      <p className="text-xs text-text-muted font-mono">{device.ip}</p>
                    </div>
                  </div>
                  <div
                    className="w-2.5 h-2.5 rounded-full flex-shrink-0 mt-1"
                    style={{ background: getStatusColor(device.status) }}
                  />
                </div>
                <div className="flex items-center justify-between text-xs text-text-secondary">
                  <div className="flex items-center gap-3">
                    <span className="flex items-center gap-1">
                      <ArrowDownToLine className="w-3 h-3 text-green" />
                      {formatSpeed(device.downloadSpeed)}
                    </span>
                    <span className="flex items-center gap-1">
                      <ArrowUpFromLine className="w-3 h-3 text-purple" />
                      {formatSpeed(device.uploadSpeed)}
                    </span>
                  </div>
                  {user && (
                    <span className="text-xs">{user.avatar}</span>
                  )}
                </div>
              </button>
            )
          })}
          {filtered.length === 0 && (
            <div className="col-span-full glass-card p-12 text-center">
              <Filter className="w-8 h-8 text-text-muted mx-auto mb-2" />
              <p className="text-text-secondary text-sm">Nenhum dispositivo encontrado</p>
            </div>
          )}
        </div>

        {/* Detail Panel */}
        {selectedDevice && (
          <div className="glass-card p-5 animate-fade-in-up h-fit sticky top-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <span className="text-3xl">{getDeviceEmoji(selectedDevice.type)}</span>
                <div>
                  <h3 className="font-bold">{selectedDevice.name}</h3>
                  <span
                    className="text-xs capitalize"
                    style={{ color: getStatusColor(selectedDevice.status) }}
                  >
                    {selectedDevice.status}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setSelected(null)}
                className="p-1 hover:bg-white/10 rounded transition-colors"
              >
                <X className="w-4 h-4 text-text-muted" />
              </button>
            </div>

            <div className="space-y-3 text-sm">
              <DetailRow label="Tipo" value={selectedDevice.type} />
              <DetailRow label="IP" value={selectedDevice.ip} mono />
              <DetailRow label="MAC" value={selectedDevice.mac} mono />
              <DetailRow label="Fabricante" value={selectedDevice.vendor} />
              <DetailRow label="Utilizador" value={selectedUser ? `${selectedUser.avatar} ${selectedUser.name}` : 'Não atribuído'} />

              <div className="pt-2 border-t border-border">
                <p className="text-text-muted text-xs mb-2">Sinal WiFi</p>
                <div className="flex items-center gap-3">
                  <div className="flex-1 h-2 bg-bg-secondary rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${selectedDevice.signalStrength}%`,
                        background: getSignalColor(selectedDevice.signalStrength),
                      }}
                    />
                  </div>
                  <span className="text-xs font-mono">{selectedDevice.signalStrength}%</span>
                </div>
              </div>

              <div className="pt-2 border-t border-border grid grid-cols-2 gap-3">
                <div>
                  <p className="text-text-muted text-xs mb-1">Download</p>
                  <p className="text-green font-bold">{formatSpeed(selectedDevice.downloadSpeed)}</p>
                  <p className="text-text-muted text-xs">{formatBytes(selectedDevice.totalDownload)} total</p>
                </div>
                <div>
                  <p className="text-text-muted text-xs mb-1">Upload</p>
                  <p className="text-purple font-bold">{formatSpeed(selectedDevice.uploadSpeed)}</p>
                  <p className="text-text-muted text-xs">{formatBytes(selectedDevice.totalUpload)} total</p>
                </div>
              </div>

              <div className="pt-2 border-t border-border space-y-1 text-xs text-text-muted">
                <div className="flex justify-between">
                  <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> Último visto</span>
                  <span>{timeAgo(selectedDevice.lastSeen)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Primeiro visto</span>
                  <span>{new Date(selectedDevice.firstSeen).toLocaleDateString('pt-PT')}</span>
                </div>
              </div>

              <button
                onClick={() => { removeDevice(selectedDevice.id); setSelected(null) }}
                className="w-full mt-2 flex items-center justify-center gap-2 px-4 py-2 bg-red/10 text-red text-xs rounded-lg hover:bg-red/20 transition-colors border border-red/20"
              >
                <Trash2 className="w-3 h-3" />
                Remover dispositivo
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function DetailRow({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-text-muted">{label}</span>
      <span className={mono ? 'font-mono text-xs' : ''}>{value}</span>
    </div>
  )
}
