import { useState, useEffect } from 'react'
import { Radar, Signal, Wifi, WifiOff } from 'lucide-react'
import RadarCanvas from '../components/radar/RadarCanvas'
import { useStore } from '../hooks/useStore'
import { getDeviceEmoji, formatSpeed, timeAgo, getStatusColor, getSignalColor } from '../utils/helpers'
import type { Device } from '../types'

export default function RadarPage() {
  const { devices, users } = useStore()
  const [selectedDevice, setSelectedDevice] = useState<Device | null>(null)
  const [radarSize, setRadarSize] = useState(500)
  const onlineDevices = devices.filter((d) => d.status !== 'offline')
  const offlineDevices = devices.filter((d) => d.status === 'offline')

  useEffect(() => {
    const update = () => {
      const w = window.innerWidth
      if (w < 768) setRadarSize(Math.min(w - 80, 350))
      else if (w < 1200) setRadarSize(450)
      else setRadarSize(550)
    }
    update()
    window.addEventListener('resize', update)
    return () => window.removeEventListener('resize', update)
  }, [])

  const handleDeviceClick = (device: Device) => {
    setSelectedDevice(device.id === selectedDevice?.id ? null : device)
  }

  const user = selectedDevice?.userId
    ? users.find((u) => u.id === selectedDevice.userId)
    : null

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-3">
            <Radar className="w-6 h-6 text-cyan" />
            Radar de Rede
          </h1>
          <p className="text-sm text-text-secondary mt-1">
            Visualização em tempo real dos dispositivos na rede
          </p>
        </div>
        <div className="flex items-center gap-4 text-sm text-text-secondary">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-green" />
            {onlineDevices.length} online
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-red" />
            {offlineDevices.length} offline
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[1fr_380px] gap-6">
        {/* Radar */}
        <div className="glass-card glow-cyan p-6 flex flex-col items-center animate-fade-in-up">
          <RadarCanvas
            devices={devices}
            size={radarSize}
            selectedDevice={selectedDevice?.id}
            onDeviceClick={handleDeviceClick}
          />
          <div className="flex items-center gap-6 mt-4 text-xs text-text-muted">
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-full bg-green" /> Online
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-full bg-amber" /> Ausente
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-full bg-red/60" /> Offline
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-full bg-cyan" /> Router
            </div>
          </div>
        </div>

        {/* Device Panel */}
        <div className="space-y-4">
          {selectedDevice ? (
            <div className="glass-card p-5 animate-fade-in-up">
              <div className="flex items-center gap-3 mb-4">
                <span className="text-3xl">{getDeviceEmoji(selectedDevice.type)}</span>
                <div>
                  <h3 className="font-bold text-lg">{selectedDevice.name}</h3>
                  <div className="flex items-center gap-2 text-sm">
                    <div
                      className="w-2 h-2 rounded-full"
                      style={{ background: getStatusColor(selectedDevice.status) }}
                    />
                    <span className="text-text-secondary capitalize">{selectedDevice.status}</span>
                    {user && (
                      <span className="text-text-muted">
                        • {user.avatar} {user.name}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="space-y-3 text-sm">
                <InfoRow label="IP" value={selectedDevice.ip} />
                <InfoRow label="MAC" value={selectedDevice.mac} mono />
                <InfoRow label="Fabricante" value={selectedDevice.vendor} />
                <InfoRow label="Sinal" value={
                  <div className="flex items-center gap-2">
                    <div className="w-20 h-1.5 bg-bg-secondary rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${selectedDevice.signalStrength}%`,
                          background: getSignalColor(selectedDevice.signalStrength),
                        }}
                      />
                    </div>
                    <span>{selectedDevice.signalStrength}%</span>
                  </div>
                } />
                <InfoRow
                  label="Download"
                  value={formatSpeed(selectedDevice.downloadSpeed)}
                  color="#22c55e"
                />
                <InfoRow
                  label="Upload"
                  value={formatSpeed(selectedDevice.uploadSpeed)}
                  color="#a855f7"
                />
                <InfoRow label="Visto" value={timeAgo(selectedDevice.lastSeen)} />
              </div>
            </div>
          ) : (
            <div className="glass-card p-8 text-center animate-fade-in-up">
              <Signal className="w-10 h-10 text-text-muted mx-auto mb-3" />
              <p className="text-text-secondary text-sm">
                Clica num dispositivo no radar para ver detalhes
              </p>
            </div>
          )}

          {/* Device List */}
          <div className="glass-card p-4 animate-fade-in-up">
            <h3 className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-3">
              Todos os Dispositivos
            </h3>
            <div className="space-y-1.5 max-h-[400px] overflow-y-auto">
              {devices.map((device) => (
                <button
                  key={device.id}
                  onClick={() => handleDeviceClick(device)}
                  className={`w-full flex items-center gap-3 p-2.5 rounded-lg text-sm text-left transition-all ${
                    selectedDevice?.id === device.id
                      ? 'bg-cyan/10 border border-cyan/30'
                      : 'hover:bg-white/5 border border-transparent'
                  }`}
                >
                  <span className="text-lg">{getDeviceEmoji(device.type)}</span>
                  <div className="flex-1 min-w-0">
                    <p className="truncate font-medium">{device.name}</p>
                    <p className="text-text-muted text-xs">{device.ip}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {device.status === 'online' ? (
                      <Wifi className="w-3.5 h-3.5 text-green" />
                    ) : (
                      <WifiOff className="w-3.5 h-3.5 text-text-muted" />
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function InfoRow({ label, value, mono, color }: {
  label: string; value: React.ReactNode; mono?: boolean; color?: string
}) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-text-muted">{label}</span>
      <span className={`${mono ? 'font-mono text-xs' : ''}`} style={color ? { color } : undefined}>
        {value}
      </span>
    </div>
  )
}
