import { useNavigate } from 'react-router-dom'
import {
  Wifi, MonitorSmartphone, ArrowDownToLine, ArrowUpFromLine,
  Activity, Clock, Shield, Zap,
} from 'lucide-react'
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import RadarCanvas from '../components/radar/RadarCanvas'
import { useStore } from '../hooks/useStore'
import { bandwidthHistory } from '../data/mockData'
import { formatSpeed, formatBytes, timeAgo, getStatusColor, getDeviceEmoji } from '../utils/helpers'
import type { Device } from '../types'

function StatCard({ icon: Icon, label, value, sub, color }: {
  icon: typeof Wifi; label: string; value: string; sub?: string; color: string
}) {
  return (
    <div className="glass-card p-4 animate-fade-in-up">
      <div className="flex items-center gap-3 mb-2">
        <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: `${color}15` }}>
          <Icon className="w-4 h-4" style={{ color }} />
        </div>
        <span className="text-xs text-text-secondary uppercase tracking-wider">{label}</span>
      </div>
      <p className="text-2xl font-bold" style={{ color }}>{value}</p>
      {sub && <p className="text-xs text-text-muted mt-1">{sub}</p>}
    </div>
  )
}

export default function DashboardPage() {
  const { devices, networkStats, activityLog, alerts } = useStore()
  const navigate = useNavigate()
  const onlineDevices = devices.filter((d) => d.status === 'online')
  const unreadAlerts = alerts.filter((a) => !a.read)

  const handleDeviceClick = (device: Device) => {
    navigate(`/devices?selected=${device.id}`)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="text-sm text-text-secondary mt-1">Visão geral da tua rede doméstica</p>
        </div>
        <div className="flex items-center gap-2 text-xs text-text-muted">
          <div className="w-2 h-2 rounded-full bg-green animate-pulse" />
          Rede ativa
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={MonitorSmartphone}
          label="Dispositivos"
          value={`${onlineDevices.length}/${devices.length}`}
          sub="online agora"
          color="#00f0ff"
        />
        <StatCard
          icon={ArrowDownToLine}
          label="Download"
          value={formatSpeed(networkStats.downloadSpeed)}
          sub={`Upload: ${formatSpeed(networkStats.uploadSpeed)}`}
          color="#22c55e"
        />
        <StatCard
          icon={Activity}
          label="Ping"
          value={`${networkStats.ping}ms`}
          sub={`Jitter: ${networkStats.jitter}ms`}
          color="#a855f7"
        />
        <StatCard
          icon={Shield}
          label="Uptime"
          value={`${networkStats.uptime}%`}
          sub={`ISP: ${networkStats.isp}`}
          color="#f59e0b"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Mini Radar */}
        <div className="glass-card p-5 flex flex-col items-center animate-fade-in-up">
          <div className="flex items-center justify-between w-full mb-4">
            <h2 className="text-sm font-semibold text-text-secondary uppercase tracking-wider">
              Radar de Rede
            </h2>
            <button
              onClick={() => navigate('/radar')}
              className="text-xs text-cyan hover:text-cyan/80 transition-colors"
            >
              Ver completo →
            </button>
          </div>
          <RadarCanvas devices={onlineDevices} size={300} onDeviceClick={handleDeviceClick} />
        </div>

        {/* Bandwidth Chart */}
        <div className="glass-card p-5 animate-fade-in-up lg:col-span-2">
          <h2 className="text-sm font-semibold text-text-secondary uppercase tracking-wider mb-4">
            Consumo de Banda (24h)
          </h2>
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={bandwidthHistory}>
              <defs>
                <linearGradient id="dlGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#00f0ff" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="#00f0ff" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="ulGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#a855f7" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="#a855f7" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis
                dataKey="hour"
                stroke="#475569"
                fontSize={10}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                stroke="#475569"
                fontSize={10}
                tickLine={false}
                axisLine={false}
                tickFormatter={(v) => `${v}`}
              />
              <Tooltip
                contentStyle={{
                  background: '#111128',
                  border: '1px solid #1e1e4a',
                  borderRadius: 8,
                  fontSize: 12,
                }}
                labelStyle={{ color: '#94a3b8' }}
              />
              <Area
                type="monotone"
                dataKey="download"
                stroke="#00f0ff"
                fill="url(#dlGrad)"
                strokeWidth={2}
                name="Download (Mbps)"
              />
              <Area
                type="monotone"
                dataKey="upload"
                stroke="#a855f7"
                fill="url(#ulGrad)"
                strokeWidth={2}
                name="Upload (Mbps)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activity */}
        <div className="glass-card p-5 animate-fade-in-up">
          <h2 className="text-sm font-semibold text-text-secondary uppercase tracking-wider mb-4">
            Atividade Recente
          </h2>
          <div className="space-y-3">
            {activityLog.slice(0, 6).map((log) => {
              const device = devices.find((d) => d.id === log.deviceId)
              if (!device) return null
              return (
                <div key={log.id} className="flex items-center gap-3 text-sm">
                  <div
                    className="w-2 h-2 rounded-full flex-shrink-0"
                    style={{ background: getStatusColor(log.event === 'connected' ? 'online' : log.event === 'disconnected' ? 'offline' : 'away') }}
                  />
                  <span className="text-base">{getDeviceEmoji(device.type)}</span>
                  <span className="text-text-primary flex-1 truncate">{device.name}</span>
                  <span className="text-text-muted text-xs capitalize">
                    {log.event === 'connected' ? 'conectou' : log.event === 'disconnected' ? 'desconectou' : 'uso elevado'}
                  </span>
                  <span className="text-text-muted text-xs">{timeAgo(log.timestamp)}</span>
                </div>
              )
            })}
          </div>
        </div>

        {/* Top Consumers */}
        <div className="glass-card p-5 animate-fade-in-up">
          <h2 className="text-sm font-semibold text-text-secondary uppercase tracking-wider mb-4">
            Maiores Consumidores
          </h2>
          <div className="space-y-3">
            {[...devices]
              .sort((a, b) => b.totalDownload - a.totalDownload)
              .slice(0, 6)
              .map((device) => {
                const maxDl = Math.max(...devices.map((d) => d.totalDownload))
                const pct = (device.totalDownload / maxDl) * 100
                return (
                  <div key={device.id} className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <span>{getDeviceEmoji(device.type)}</span>
                        <span className="truncate">{device.name}</span>
                      </div>
                      <span className="text-text-secondary text-xs">{formatBytes(device.totalDownload)}</span>
                    </div>
                    <div className="h-1.5 bg-bg-secondary rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${pct}%`,
                          background: `linear-gradient(90deg, #00f0ff, #a855f7)`,
                        }}
                      />
                    </div>
                  </div>
                )
              })}
          </div>
        </div>
      </div>

      {/* Alerts Preview */}
      {unreadAlerts.length > 0 && (
        <div className="glass-card p-5 animate-fade-in-up">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-text-secondary uppercase tracking-wider">
              Alertas ({unreadAlerts.length})
            </h2>
            <button
              onClick={() => navigate('/alerts')}
              className="text-xs text-cyan hover:text-cyan/80 transition-colors"
            >
              Ver todos →
            </button>
          </div>
          <div className="space-y-2">
            {unreadAlerts.slice(0, 3).map((alert) => (
              <div
                key={alert.id}
                className="flex items-center gap-3 p-3 rounded-lg bg-bg-secondary/50 text-sm"
              >
                <Zap className="w-4 h-4 flex-shrink-0" style={{ color: alert.severity === 'critical' ? '#ef4444' : alert.severity === 'warning' ? '#f59e0b' : '#00f0ff' }} />
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{alert.title}</p>
                  <p className="text-text-muted text-xs truncate">{alert.message}</p>
                </div>
                <span className="text-text-muted text-xs flex-shrink-0">{timeAgo(alert.timestamp)}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
