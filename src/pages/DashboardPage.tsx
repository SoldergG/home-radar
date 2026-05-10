import { useNavigate } from 'react-router-dom'
import {
  ArrowDownToLine, ArrowUpFromLine, Activity, Shield,
  Wifi, Clock, Zap, ChevronRight, MonitorSmartphone,
} from 'lucide-react'
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import RadarCanvas from '../components/radar/RadarCanvas'
import { useStore } from '../hooks/useStore'
import { bandwidthHistory } from '../data/mockData'
import { formatSpeed, formatBytes, timeAgo, getStatusColor, getDeviceIcon } from '../utils/helpers'
import type { Device } from '../types'
import * as LucideIcons from 'lucide-react'
import type { LucideProps } from 'lucide-react'

function DynIcon({ name, ...p }: { name: string } & LucideProps) {
  const Icon = (LucideIcons as Record<string, React.ComponentType<LucideProps>>)[name]
  return Icon ? <Icon {...p} /> : <LucideIcons.HelpCircle {...p} />
}

function StatCard({ icon, label, value, sub, color }: {
  icon: string; label: string; value: string; sub?: string; color: string
}) {
  return (
    <div className="card fade-up" style={{ padding: 20 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
        <span className="stat-label">{label}</span>
        <div style={{
          width: 32, height: 32, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: `${color}14`,
        }}>
          <DynIcon name={icon} size={15} color={color} />
        </div>
      </div>
      <div className="stat-value" style={{ color }}>{value}</div>
      {sub && <div style={{ fontSize: 12, color: 'var(--color-muted)', marginTop: 4 }}>{sub}</div>}
    </div>
  )
}

const chartTooltipStyle = {
  background: '#0f172a', border: '1px solid #1e293b', borderRadius: 8,
  fontSize: 12, color: '#f1f5f9', fontFamily: 'var(--font-mono)',
}

export default function DashboardPage() {
  const { devices, networkStats, activityLog, alerts } = useStore()
  const navigate = useNavigate()
  const online = devices.filter((d) => d.status === 'online')
  const unread = alerts.filter((a) => !a.read)

  const handleDeviceClick = (device: Device) => navigate(`/devices?selected=${device.id}`)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Header */}
      <div className="page-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <div className="page-title">Dashboard</div>
          <div className="page-sub">Visão geral da rede doméstica</div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <div className="dot-online" />
          <span style={{ fontSize: 12, color: 'var(--color-muted)' }}>{online.length} dispositivos online</span>
        </div>
      </div>

      {/* Stats row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12 }}>
        <StatCard icon="MonitorSmartphone" label="Dispositivos" value={`${online.length}/${devices.length}`} sub="online agora" color="var(--color-cyan)" />
        <StatCard icon="ArrowDownToLine" label="Download" value={formatSpeed(networkStats.downloadSpeed)} sub={`Upload: ${formatSpeed(networkStats.uploadSpeed)}`} color="var(--color-green)" />
        <StatCard icon="Activity" label="Latência" value={`${networkStats.ping} ms`} sub={`Jitter: ${networkStats.jitter} ms`} color="var(--color-purple)" />
        <StatCard icon="Shield" label="Uptime" value={`${networkStats.uptime}%`} sub={networkStats.isp} color="var(--color-amber)" />
      </div>

      {/* Radar + Chart */}
      <div style={{ display: 'grid', gridTemplateColumns: '360px 1fr', gap: 16 }}>
        {/* Radar */}
        <div className="card fade-up" style={{ padding: 20, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', marginBottom: 16 }}>
            <span className="section-title" style={{ marginBottom: 0 }}>Radar de rede</span>
            <button
              className="btn-ghost"
              style={{ padding: '4px 10px', fontSize: 11 }}
              onClick={() => navigate('/radar')}
            >
              Expandir <ChevronRight size={11} />
            </button>
          </div>
          <RadarCanvas devices={online} size={300} onDeviceClick={handleDeviceClick} />
        </div>

        {/* Bandwidth chart */}
        <div className="card fade-up" style={{ padding: 20 }}>
          <span className="section-title">Consumo de banda — 24 h</span>
          <ResponsiveContainer width="100%" height={272}>
            <AreaChart data={bandwidthHistory} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="gDl" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--color-cyan)" stopOpacity={0.25} />
                  <stop offset="100%" stopColor="var(--color-cyan)" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gUl" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--color-purple)" stopOpacity={0.25} />
                  <stop offset="100%" stopColor="var(--color-purple)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="hour" stroke="#334155" fontSize={10} tickLine={false} axisLine={false} fontFamily="var(--font-mono)" />
              <YAxis stroke="#334155" fontSize={10} tickLine={false} axisLine={false} />
              <Tooltip contentStyle={chartTooltipStyle} />
              <Area type="monotone" dataKey="download" stroke="var(--color-cyan)" strokeWidth={1.5} fill="url(#gDl)" name="Download (Mbps)" />
              <Area type="monotone" dataKey="upload" stroke="var(--color-purple)" strokeWidth={1.5} fill="url(#gUl)" name="Upload (Mbps)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Activity + Top consumers */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        {/* Recent activity */}
        <div className="card fade-up" style={{ padding: 20 }}>
          <span className="section-title">Atividade recente</span>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {activityLog.slice(0, 7).map((log) => {
              const d = devices.find((x) => x.id === log.deviceId)
              if (!d) return null
              const evtColor =
                log.event === 'connected' ? 'var(--color-green)' :
                log.event === 'disconnected' ? 'var(--color-red)' : 'var(--color-amber)'
              return (
                <div key={log.id} style={{
                  display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0',
                  borderBottom: '1px solid var(--color-border)',
                }}>
                  <div style={{ width: 6, height: 6, borderRadius: '50%', background: evtColor, flexShrink: 0 }} />
                  <DynIcon name={getDeviceIcon(d.type)} size={13} color="var(--color-muted)" style={{ flexShrink: 0 }} />
                  <span style={{ flex: 1, fontSize: 13, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{d.name}</span>
                  <span style={{ fontSize: 11, color: 'var(--color-muted)', textTransform: 'capitalize', flexShrink: 0 }}>
                    {log.event === 'connected' ? 'conectou' : log.event === 'disconnected' ? 'desconectou' : 'uso elevado'}
                  </span>
                  <span style={{ fontSize: 11, color: 'var(--color-faint)', flexShrink: 0, fontFamily: 'var(--font-mono)' }}>{timeAgo(log.timestamp)}</span>
                </div>
              )
            })}
          </div>
        </div>

        {/* Top consumers */}
        <div className="card fade-up" style={{ padding: 20 }}>
          <span className="section-title">Maiores consumidores</span>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {[...devices].sort((a, b) => b.totalDownload - a.totalDownload).slice(0, 6).map((d) => {
              const max = Math.max(...devices.map((x) => x.totalDownload))
              const pct = max > 0 ? (d.totalDownload / max) * 100 : 0
              return (
                <div key={d.id}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5, fontSize: 13 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <DynIcon name={getDeviceIcon(d.type)} size={13} color="var(--color-muted)" />
                      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 160 }}>{d.name}</span>
                    </div>
                    <span style={{ fontSize: 11, color: 'var(--color-muted)', fontFamily: 'var(--font-mono)' }}>{formatBytes(d.totalDownload)}</span>
                  </div>
                  <div className="progress-track">
                    <div className="progress-bar" style={{ width: `${pct}%`, background: 'linear-gradient(90deg, var(--color-cyan), var(--color-purple))' }} />
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Unread alerts strip */}
      {unread.length > 0 && (
        <div className="card fade-up" style={{ padding: '14px 20px', display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer', borderColor: 'rgba(248,113,113,0.25)' }}
          onClick={() => navigate('/alerts')}>
          <Zap size={14} color="var(--color-red)" style={{ flexShrink: 0 }} />
          <span style={{ flex: 1, fontSize: 13 }}>
            <strong style={{ color: 'var(--color-red)' }}>{unread.length} alerta{unread.length > 1 ? 's' : ''}</strong>
            {' '}<span style={{ color: 'var(--color-muted)' }}>não lido{unread.length > 1 ? 's' : ''} — clica para ver</span>
          </span>
          <ChevronRight size={14} color="var(--color-muted)" />
        </div>
      )}
    </div>
  )
}
