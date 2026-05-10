import { useState } from 'react'
import { Gauge, Play, ArrowDownToLine, ArrowUpFromLine, Clock } from 'lucide-react'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import { useStore } from '../hooks/useStore'
import { formatSpeed } from '../utils/helpers'

const chartStyle = { background: 'var(--color-card)', border: '1px solid var(--color-border)', borderRadius: 8, fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--color-text)' }

export default function SpeedTestPage() {
  const { speedTests, addSpeedTest } = useStore()
  const [running, setRunning] = useState(false)
  const [phase, setPhase] = useState<'idle' | 'ping' | 'download' | 'upload' | 'done'>('idle')
  const [progress, setProgress] = useState(0)
  const [result, setResult] = useState<{ ping: number; download: number; upload: number } | null>(null)

  const runTest = () => {
    if (running) return
    setRunning(true); setResult(null); setProgress(0)
    const ping = Math.floor(Math.random() * 15 + 8)
    const download = Math.floor(Math.random() * 80 + 180)
    const upload = Math.floor(Math.random() * 30 + 80)
    setPhase('ping')
    let p = 0
    const iv = setInterval(() => {
      p += 2; setProgress(p)
      if (p === 20) { setPhase('download'); setResult({ ping, download: 0, upload: 0 }) }
      if (p === 60) { setPhase('upload'); setResult({ ping, download, upload: 0 }) }
      if (p > 20 && p < 60) setResult((r) => r ? { ...r, download: Math.floor(download * ((p - 20) / 40)) } : r)
      if (p > 60 && p < 100) setResult((r) => r ? { ...r, upload: Math.floor(upload * ((p - 60) / 40)) } : r)
      if (p >= 100) {
        clearInterval(iv); setPhase('done'); setRunning(false)
        setResult({ ping, download, upload })
        addSpeedTest({ id: `s${Date.now()}`, download, upload, ping, timestamp: new Date().toISOString(), server: 'Lisboa — MEO' })
      }
    }, 80)
  }

  const accent = phase === 'upload' ? 'var(--color-purple)' : 'var(--color-cyan)'
  const r = 100
  const circ = 2 * Math.PI * r
  const dash = circ * (1 - progress / 100)

  const chartData = speedTests.slice(0, 10).reverse().map((t) => ({
    time: new Date(t.timestamp).toLocaleDateString('pt-PT', { day: '2-digit', month: '2-digit' }),
    download: t.download, upload: t.upload,
  }))

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div>
        <div className="page-title" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Gauge size={18} color="var(--color-cyan)" />
          Speed Test
        </div>
        <div className="page-sub">Testa a velocidade da ligação à internet</div>
      </div>

      {/* Main widget */}
      <div className="card fade-up" style={{ padding: 40, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 28 }}>
        {/* Ring */}
        <div style={{ position: 'relative', width: 240, height: 240, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <svg style={{ position: 'absolute', inset: 0, transform: 'rotate(-90deg)' }} viewBox="0 0 240 240" width={240} height={240}>
            <circle cx={120} cy={120} r={r} fill="none" stroke="var(--color-elevated)" strokeWidth={10} />
            <circle
              cx={120} cy={120} r={r} fill="none"
              stroke={accent} strokeWidth={10} strokeLinecap="round"
              strokeDasharray={circ} strokeDashoffset={dash}
              style={{ transition: 'stroke-dashoffset 0.1s linear, stroke 0.3s ease' }}
            />
          </svg>
          <div style={{ textAlign: 'center', zIndex: 1 }}>
            {phase === 'idle' ? (
              <button
                onClick={runTest}
                style={{
                  width: 80, height: 80, borderRadius: '50%', cursor: 'pointer',
                  background: 'var(--color-cyan-dim)', border: '1px solid rgba(34,211,238,0.3)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  transition: 'all 150ms',
                }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = 'rgba(34,211,238,0.2)' }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = 'var(--color-cyan-dim)' }}
              >
                <Play size={24} color="var(--color-cyan)" style={{ marginLeft: 3 }} />
              </button>
            ) : (
              <>
                <div style={{ fontSize: 40, fontWeight: 700, fontFamily: 'var(--font-mono)', lineHeight: 1, color: accent }}>
                  {result ? (phase === 'download' ? result.download : phase === 'upload' ? result.upload : phase === 'ping' ? '…' : result.download) : '…'}
                </div>
                <div style={{ fontSize: 12, color: 'var(--color-muted)', marginTop: 4 }}>
                  {phase === 'ping' ? 'A medir ping' : phase === 'download' ? 'Mbps ↓' : phase === 'upload' ? 'Mbps ↑' : 'Mbps ↓'}
                </div>
              </>
            )}
          </div>
        </div>

        {/* Results */}
        {result && phase === 'done' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 24, width: '100%', maxWidth: 380 }}>
            {[
              { icon: ArrowDownToLine, color: 'var(--color-green)', label: 'Download', val: result.download, unit: 'Mbps' },
              { icon: ArrowUpFromLine, color: 'var(--color-purple)', label: 'Upload', val: result.upload, unit: 'Mbps' },
              { icon: Clock, color: 'var(--color-cyan)', label: 'Ping', val: result.ping, unit: 'ms' },
            ].map((item) => (
              <div key={item.label} style={{ textAlign: 'center' }}>
                <item.icon size={16} color={item.color} style={{ margin: '0 auto 6px' }} />
                <div style={{ fontSize: 28, fontWeight: 700, fontFamily: 'var(--font-mono)', color: item.color, lineHeight: 1 }}>{item.val}</div>
                <div style={{ fontSize: 11, color: 'var(--color-muted)' }}>{item.unit}</div>
              </div>
            ))}
          </div>
        )}

        {phase === 'done' && (
          <button className="btn-primary" onClick={runTest}>Testar novamente</button>
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        {/* Chart */}
        <div className="card fade-up" style={{ padding: 20 }}>
          <div className="section-title">Histórico</div>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={chartData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
              <XAxis dataKey="time" stroke="#334155" fontSize={10} tickLine={false} axisLine={false} fontFamily="var(--font-mono)" />
              <YAxis stroke="#334155" fontSize={10} tickLine={false} axisLine={false} />
              <Tooltip contentStyle={chartStyle} />
              <Line type="monotone" dataKey="download" stroke="var(--color-green)" strokeWidth={2} dot={{ fill: 'var(--color-green)', r: 3 }} name="Download" />
              <Line type="monotone" dataKey="upload" stroke="var(--color-purple)" strokeWidth={2} dot={{ fill: 'var(--color-purple)', r: 3 }} name="Upload" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Recent tests */}
        <div className="card fade-up" style={{ padding: 20 }}>
          <div className="section-title">Testes recentes</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2, maxHeight: 220, overflowY: 'auto' }}>
            {speedTests.slice(0, 8).map((t) => (
              <div key={t.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--color-border)', fontSize: 12 }}>
                <div>
                  <div style={{ fontWeight: 500, fontSize: 13 }}>{t.server}</div>
                  <div style={{ color: 'var(--color-muted)', fontFamily: 'var(--font-mono)', fontSize: 11 }}>{new Date(t.timestamp).toLocaleString('pt-PT')}</div>
                </div>
                <div style={{ display: 'flex', gap: 12, fontFamily: 'var(--font-mono)' }}>
                  <span style={{ color: 'var(--color-green)' }}>{t.download} Mbps</span>
                  <span style={{ color: 'var(--color-purple)' }}>{t.upload} Mbps</span>
                  <span style={{ color: 'var(--color-cyan)' }}>{t.ping} ms</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
