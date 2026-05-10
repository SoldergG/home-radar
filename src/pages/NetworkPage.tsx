import { Activity, Globe, Server, Cpu, Wifi, ArrowDownToLine, ArrowUpFromLine, Clock } from 'lucide-react'
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts'
import { useStore } from '../hooks/useStore'
import { formatSpeed, formatBytes, getDeviceEmoji } from '../utils/helpers'
import { bandwidthHistory } from '../data/mockData'

const latencyData = Array.from({ length: 30 }, (_, i) => ({
  time: `${i}s`,
  ping: Math.floor(Math.random() * 15 + 8),
  jitter: Math.floor(Math.random() * 5 + 1),
}))

const dnsData = [
  { domain: 'youtube.com', queries: 245 },
  { domain: 'google.com', queries: 189 },
  { domain: 'instagram.com', queries: 156 },
  { domain: 'cloudflare.com', queries: 134 },
  { domain: 'apple.com', queries: 98 },
  { domain: 'netflix.com', queries: 87 },
  { domain: 'spotify.com', queries: 76 },
  { domain: 'github.com', queries: 65 },
]

export default function NetworkPage() {
  const { devices, networkStats } = useStore()
  const activeDevices = devices.filter((d) => d.status === 'online')
  const totalDl = activeDevices.reduce((s, d) => s + d.downloadSpeed, 0)
  const totalUl = activeDevices.reduce((s, d) => s + d.uploadSpeed, 0)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-3">
          <Activity className="w-6 h-6 text-cyan" />
          Rede
        </h1>
        <p className="text-sm text-text-secondary mt-1">Monitorização e análise da rede</p>
      </div>

      {/* Network Info Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <InfoCard icon={Globe} label="IP Externo" value={networkStats.externalIp} color="#00f0ff" />
        <InfoCard icon={Server} label="Gateway" value={networkStats.gatewayIp} color="#a855f7" />
        <InfoCard icon={Cpu} label="DNS" value={networkStats.dns} color="#22c55e" />
        <InfoCard icon={Wifi} label="ISP" value={networkStats.isp} color="#f59e0b" />
      </div>

      {/* Bandwidth Usage */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="glass-card p-3 text-center animate-fade-in-up">
          <ArrowDownToLine className="w-5 h-5 text-green mx-auto mb-1" />
          <p className="text-xs text-text-muted">Download atual</p>
          <p className="text-xl font-bold text-green">{formatSpeed(totalDl)}</p>
        </div>
        <div className="glass-card p-3 text-center animate-fade-in-up">
          <ArrowUpFromLine className="w-5 h-5 text-purple mx-auto mb-1" />
          <p className="text-xs text-text-muted">Upload atual</p>
          <p className="text-xl font-bold text-purple">{formatSpeed(totalUl)}</p>
        </div>
        <div className="glass-card p-3 text-center animate-fade-in-up">
          <Clock className="w-5 h-5 text-cyan mx-auto mb-1" />
          <p className="text-xs text-text-muted">Uptime</p>
          <p className="text-xl font-bold text-cyan">{networkStats.uptime}%</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Bandwidth History */}
        <div className="glass-card p-5 animate-fade-in-up">
          <h2 className="text-sm font-semibold text-text-secondary uppercase tracking-wider mb-4">
            Banda (24h)
          </h2>
          <ResponsiveContainer width="100%" height={250}>
            <AreaChart data={bandwidthHistory}>
              <defs>
                <linearGradient id="netDl" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#00f0ff" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="#00f0ff" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="netUl" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#a855f7" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="#a855f7" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="hour" stroke="#475569" fontSize={10} tickLine={false} axisLine={false} />
              <YAxis stroke="#475569" fontSize={10} tickLine={false} axisLine={false} />
              <Tooltip contentStyle={{ background: '#111128', border: '1px solid #1e1e4a', borderRadius: 8, fontSize: 12 }} />
              <Area type="monotone" dataKey="download" stroke="#00f0ff" fill="url(#netDl)" strokeWidth={2} name="Download" />
              <Area type="monotone" dataKey="upload" stroke="#a855f7" fill="url(#netUl)" strokeWidth={2} name="Upload" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Latency */}
        <div className="glass-card p-5 animate-fade-in-up">
          <h2 className="text-sm font-semibold text-text-secondary uppercase tracking-wider mb-4">
            Latência (30s)
          </h2>
          <ResponsiveContainer width="100%" height={250}>
            <AreaChart data={latencyData}>
              <defs>
                <linearGradient id="pingGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#22c55e" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="#22c55e" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="time" stroke="#475569" fontSize={10} tickLine={false} axisLine={false} />
              <YAxis stroke="#475569" fontSize={10} tickLine={false} axisLine={false} unit="ms" />
              <Tooltip contentStyle={{ background: '#111128', border: '1px solid #1e1e4a', borderRadius: 8, fontSize: 12 }} />
              <Area type="monotone" dataKey="ping" stroke="#22c55e" fill="url(#pingGrad)" strokeWidth={2} name="Ping (ms)" />
              <Area type="monotone" dataKey="jitter" stroke="#f59e0b" fill="transparent" strokeWidth={1} strokeDasharray="4 4" name="Jitter (ms)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* DNS Queries */}
        <div className="glass-card p-5 animate-fade-in-up">
          <h2 className="text-sm font-semibold text-text-secondary uppercase tracking-wider mb-4">
            Consultas DNS (Top)
          </h2>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={dnsData} layout="vertical">
              <XAxis type="number" stroke="#475569" fontSize={10} tickLine={false} axisLine={false} />
              <YAxis type="category" dataKey="domain" stroke="#475569" fontSize={10} tickLine={false} axisLine={false} width={100} />
              <Tooltip contentStyle={{ background: '#111128', border: '1px solid #1e1e4a', borderRadius: 8, fontSize: 12 }} />
              <Bar dataKey="queries" fill="#00f0ff" radius={[0, 4, 4, 0]} name="Consultas" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Per-device bandwidth */}
        <div className="glass-card p-5 animate-fade-in-up">
          <h2 className="text-sm font-semibold text-text-secondary uppercase tracking-wider mb-4">
            Consumo por Dispositivo
          </h2>
          <div className="space-y-3">
            {activeDevices
              .sort((a, b) => b.downloadSpeed - a.downloadSpeed)
              .map((device) => {
                const maxSpeed = Math.max(...activeDevices.map((d) => d.downloadSpeed))
                const pct = maxSpeed > 0 ? (device.downloadSpeed / maxSpeed) * 100 : 0
                return (
                  <div key={device.id} className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <span>{getDeviceEmoji(device.type)}</span>
                        <span className="truncate">{device.name}</span>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-text-secondary">
                        <span className="text-green">{formatSpeed(device.downloadSpeed)}</span>
                        <span className="text-purple">{formatSpeed(device.uploadSpeed)}</span>
                      </div>
                    </div>
                    <div className="h-1.5 bg-bg-secondary rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full"
                        style={{ width: `${pct}%`, background: 'linear-gradient(90deg, #00f0ff, #a855f7)' }}
                      />
                    </div>
                  </div>
                )
              })}
          </div>
        </div>
      </div>
    </div>
  )
}

function InfoCard({ icon: Icon, label, value, color }: {
  icon: typeof Globe; label: string; value: string; color: string
}) {
  return (
    <div className="glass-card p-4 animate-fade-in-up">
      <div className="flex items-center gap-2 mb-1">
        <Icon className="w-4 h-4" style={{ color }} />
        <span className="text-xs text-text-muted">{label}</span>
      </div>
      <p className="text-sm font-mono font-bold">{value}</p>
    </div>
  )
}
