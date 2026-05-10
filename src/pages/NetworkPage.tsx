import { Activity, Globe, Server, Cpu, Wifi, ArrowDownToLine, ArrowUpFromLine } from 'lucide-react'
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts'
import { useStore } from '../hooks/useStore'
import { formatSpeed, getDeviceIcon } from '../utils/helpers'
import { bandwidthHistory } from '../data/mockData'
import * as LucideIcons from 'lucide-react'
import type { LucideProps } from 'lucide-react'

function DynIcon({ name, ...p }: { name: string } & LucideProps) {
  const I = (LucideIcons as Record<string, React.ComponentType<LucideProps>>)[name]
  return I ? <I {...p} /> : <LucideIcons.HelpCircle {...p} />
}

const chartStyle = {
  background: 'var(--color-card)', border: '1px solid var(--color-border)',
  borderRadius: 8, fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--color-text)',
}

const latencyData = Array.from({ length: 30 }, (_, i) => ({
  t: `${i}s`,
  ping: Math.floor(Math.random() * 15 + 8),
  jitter: Math.floor(Math.random() * 4 + 1),
}))

const dnsData = [
  { d: 'youtube.com', q: 245 }, { d: 'google.com', q: 189 },
  { d: 'instagram.com', q: 156 }, { d: 'cloudflare.com', q: 134 },
  { d: 'apple.com', q: 98 }, { d: 'netflix.com', q: 87 },
  { d: 'spotify.com', q: 76 }, { d: 'github.com', q: 65 },
]

export default function NetworkPage() {
  const { devices, networkStats } = useStore()
  const active = devices.filter((d) => d.status === 'online')
  const totalDl = active.reduce((s, d) => s + d.downloadSpeed, 0)
  const totalUl = active.reduce((s, d) => s + d.uploadSpeed, 0)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div>
        <div className="page-title" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Activity size={18} color="var(--color-cyan)" /> Rede
        </div>
        <div className="page-sub">Monitorização em tempo real</div>
      </div>

      {/* Info cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 10 }}>
        {[
          { icon: Globe,  label: 'IP Externo', value: networkStats.externalIp, color: 'var(--color-cyan)'   },
          { icon: Server, label: 'Gateway',    value: networkStats.gatewayIp,  color: 'var(--color-purple)' },
          { icon: Cpu,    label: 'DNS',         value: networkStats.dns,        color: 'var(--color-green)'  },
          { icon: Wifi,   label: 'ISP',         value: networkStats.isp,        color: 'var(--color-amber)'  },
        ].map((c) => (
          <div key={c.label} className="card fade-up" style={{ padding: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <c.icon size={13} color={c.color} />
              <span style={{ fontSize: 11, color: 'var(--color-muted)' }}>{c.label}</span>
            </div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 13, fontWeight: 500 }}>{c.value}</div>
          </div>
        ))}
      </div>

      {/* Live speeds */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
        {[
          { icon: ArrowDownToLine, color: 'var(--color-green)',  label: 'Download atual',  val: formatSpeed(totalDl) },
          { icon: ArrowUpFromLine, color: 'var(--color-purple)', label: 'Upload atual',    val: formatSpeed(totalUl) },
          { icon: Activity,        color: 'var(--color-cyan)',   label: 'Uptime',          val: `${networkStats.uptime}%` },
        ].map((c) => (
          <div key={c.label} className="card fade-up" style={{ padding: 16, display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 36, height: 36, borderRadius: 9, background: `${c.color}14`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <c.icon size={16} color={c.color} />
            </div>
            <div>
              <div style={{ fontSize: 11, color: 'var(--color-muted)' }}>{c.label}</div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 20, fontWeight: 700, color: c.color }}>{c.val}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Bandwidth + Latency */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <div className="card fade-up" style={{ padding: 20 }}>
          <div className="section-title">Banda 24 h</div>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={bandwidthHistory} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="nDl" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--color-cyan)" stopOpacity={0.25} />
                  <stop offset="100%" stopColor="var(--color-cyan)" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="nUl" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--color-purple)" stopOpacity={0.25} />
                  <stop offset="100%" stopColor="var(--color-purple)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="hour" stroke="#334155" fontSize={10} tickLine={false} axisLine={false} fontFamily="var(--font-mono)" />
              <YAxis stroke="#334155" fontSize={10} tickLine={false} axisLine={false} />
              <Tooltip contentStyle={chartStyle} />
              <Area type="monotone" dataKey="download" stroke="var(--color-cyan)" strokeWidth={1.5} fill="url(#nDl)" name="Download" />
              <Area type="monotone" dataKey="upload" stroke="var(--color-purple)" strokeWidth={1.5} fill="url(#nUl)" name="Upload" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="card fade-up" style={{ padding: 20 }}>
          <div className="section-title">Latência (30 s)</div>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={latencyData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="pGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--color-green)" stopOpacity={0.25} />
                  <stop offset="100%" stopColor="var(--color-green)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="t" stroke="#334155" fontSize={10} tickLine={false} axisLine={false} fontFamily="var(--font-mono)" />
              <YAxis stroke="#334155" fontSize={10} tickLine={false} axisLine={false} unit=" ms" />
              <Tooltip contentStyle={chartStyle} />
              <Area type="monotone" dataKey="ping" stroke="var(--color-green)" strokeWidth={1.5} fill="url(#pGrad)" name="Ping" />
              <Area type="monotone" dataKey="jitter" stroke="var(--color-amber)" strokeWidth={1} fill="transparent" strokeDasharray="4 4" name="Jitter" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* DNS + Per device */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <div className="card fade-up" style={{ padding: 20 }}>
          <div className="section-title">Consultas DNS</div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={dnsData} layout="vertical" margin={{ top: 0, right: 10, left: 0, bottom: 0 }}>
              <XAxis type="number" stroke="#334155" fontSize={10} tickLine={false} axisLine={false} fontFamily="var(--font-mono)" />
              <YAxis type="category" dataKey="d" stroke="#334155" fontSize={10} tickLine={false} axisLine={false} width={90} fontFamily="var(--font-mono)" />
              <Tooltip contentStyle={chartStyle} />
              <Bar dataKey="q" fill="var(--color-cyan)" radius={[0,4,4,0]} name="Consultas" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="card fade-up" style={{ padding: 20 }}>
          <div className="section-title">Consumo por dispositivo</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {active.sort((a, b) => b.downloadSpeed - a.downloadSpeed).map((d) => {
              const max = Math.max(...active.map((x) => x.downloadSpeed))
              const pct = max > 0 ? (d.downloadSpeed / max) * 100 : 0
              return (
                <div key={d.id}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4, fontSize: 12 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <DynIcon name={getDeviceIcon(d.type)} size={12} color="var(--color-muted)" />
                      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 160 }}>{d.name}</span>
                    </div>
                    <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-green)', fontSize: 11 }}>{formatSpeed(d.downloadSpeed)}</span>
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
    </div>
  )
}
