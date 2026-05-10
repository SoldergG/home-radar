import { useState } from 'react'
import { Gauge, Play, ArrowDownToLine, ArrowUpFromLine, Clock, Server } from 'lucide-react'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import { useStore } from '../hooks/useStore'
import { formatSpeed } from '../utils/helpers'

export default function SpeedTestPage() {
  const { speedTests, addSpeedTest } = useStore()
  const [running, setRunning] = useState(false)
  const [phase, setPhase] = useState<'idle' | 'ping' | 'download' | 'upload' | 'done'>('idle')
  const [progress, setProgress] = useState(0)
  const [currentResult, setCurrentResult] = useState<{
    ping: number; download: number; upload: number
  } | null>(null)

  const runTest = () => {
    if (running) return
    setRunning(true)
    setCurrentResult(null)
    setProgress(0)

    const ping = Math.floor(Math.random() * 15 + 8)
    const download = Math.floor(Math.random() * 80 + 180)
    const upload = Math.floor(Math.random() * 30 + 80)

    setPhase('ping')
    let p = 0

    const interval = setInterval(() => {
      p += 2
      setProgress(p)

      if (p === 20) {
        setPhase('download')
        setCurrentResult({ ping, download: 0, upload: 0 })
      } else if (p === 60) {
        setPhase('upload')
        setCurrentResult({ ping, download, upload: 0 })
      } else if (p >= 100) {
        clearInterval(interval)
        setPhase('done')
        setCurrentResult({ ping, download, upload })
        setRunning(false)

        addSpeedTest({
          id: `s${Date.now()}`,
          download,
          upload,
          ping,
          timestamp: new Date().toISOString(),
          server: 'Lisboa - MEO',
        })
      }

      if (p > 20 && p < 60) {
        setCurrentResult((prev) => prev ? {
          ...prev,
          download: Math.floor(download * ((p - 20) / 40)),
        } : null)
      }
      if (p > 60 && p < 100) {
        setCurrentResult((prev) => prev ? {
          ...prev,
          upload: Math.floor(upload * ((p - 60) / 40)),
        } : null)
      }
    }, 80)
  }

  const chartData = speedTests.slice(0, 10).reverse().map((t) => ({
    time: new Date(t.timestamp).toLocaleDateString('pt-PT', { day: '2-digit', month: '2-digit' }),
    download: t.download,
    upload: t.upload,
    ping: t.ping,
  }))

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-3">
          <Gauge className="w-6 h-6 text-cyan" />
          Speed Test
        </h1>
        <p className="text-sm text-text-secondary mt-1">Testa a velocidade da tua ligação</p>
      </div>

      {/* Speed Test Widget */}
      <div className="glass-card glow-cyan p-8 flex flex-col items-center animate-fade-in-up">
        <div className="relative w-64 h-64 flex items-center justify-center">
          {/* Background circle */}
          <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 256 256">
            <circle cx="128" cy="128" r="110" fill="none" stroke="#1e1e4a" strokeWidth="8" />
            <circle
              cx="128" cy="128" r="110" fill="none"
              stroke={phase === 'download' ? '#22c55e' : phase === 'upload' ? '#a855f7' : '#00f0ff'}
              strokeWidth="8"
              strokeLinecap="round"
              strokeDasharray={`${2 * Math.PI * 110}`}
              strokeDashoffset={`${2 * Math.PI * 110 * (1 - progress / 100)}`}
              className="transition-all duration-100"
            />
          </svg>

          <div className="text-center z-10">
            {phase === 'idle' ? (
              <button
                onClick={runTest}
                className="w-24 h-24 rounded-full bg-cyan/20 hover:bg-cyan/30 flex items-center justify-center transition-all hover:scale-105 border border-cyan/40"
              >
                <Play className="w-8 h-8 text-cyan ml-1" />
              </button>
            ) : phase === 'done' && currentResult ? (
              <>
                <p className="text-4xl font-bold text-cyan">{currentResult.download}</p>
                <p className="text-sm text-text-secondary">Mbps download</p>
              </>
            ) : (
              <>
                <p className="text-3xl font-bold text-cyan">
                  {currentResult ? (
                    phase === 'download' ? currentResult.download :
                    phase === 'upload' ? currentResult.upload :
                    currentResult.ping
                  ) : '...'}
                </p>
                <p className="text-sm text-text-secondary capitalize">
                  {phase === 'ping' ? 'A medir ping...' :
                   phase === 'download' ? 'Download...' : 'Upload...'}
                </p>
              </>
            )}
          </div>
        </div>

        {/* Results */}
        {currentResult && phase === 'done' && (
          <div className="grid grid-cols-3 gap-8 mt-6 w-full max-w-md">
            <div className="text-center">
              <ArrowDownToLine className="w-5 h-5 text-green mx-auto mb-1" />
              <p className="text-2xl font-bold text-green">{currentResult.download}</p>
              <p className="text-xs text-text-muted">Mbps</p>
            </div>
            <div className="text-center">
              <ArrowUpFromLine className="w-5 h-5 text-purple mx-auto mb-1" />
              <p className="text-2xl font-bold text-purple">{currentResult.upload}</p>
              <p className="text-xs text-text-muted">Mbps</p>
            </div>
            <div className="text-center">
              <Clock className="w-5 h-5 text-cyan mx-auto mb-1" />
              <p className="text-2xl font-bold text-cyan">{currentResult.ping}</p>
              <p className="text-xs text-text-muted">ms</p>
            </div>
          </div>
        )}

        {phase === 'done' && (
          <button
            onClick={runTest}
            className="mt-6 px-6 py-2 bg-cyan/10 text-cyan text-sm rounded-lg hover:bg-cyan/20 transition-colors border border-cyan/20"
          >
            Testar novamente
          </button>
        )}
      </div>

      {/* History */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="glass-card p-5 animate-fade-in-up">
          <h2 className="text-sm font-semibold text-text-secondary uppercase tracking-wider mb-4">
            Histórico de Velocidade
          </h2>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={chartData}>
              <XAxis dataKey="time" stroke="#475569" fontSize={10} tickLine={false} axisLine={false} />
              <YAxis stroke="#475569" fontSize={10} tickLine={false} axisLine={false} />
              <Tooltip contentStyle={{ background: '#111128', border: '1px solid #1e1e4a', borderRadius: 8, fontSize: 12 }} />
              <Line type="monotone" dataKey="download" stroke="#22c55e" strokeWidth={2} dot={{ fill: '#22c55e', r: 3 }} name="Download" />
              <Line type="monotone" dataKey="upload" stroke="#a855f7" strokeWidth={2} dot={{ fill: '#a855f7', r: 3 }} name="Upload" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="glass-card p-5 animate-fade-in-up">
          <h2 className="text-sm font-semibold text-text-secondary uppercase tracking-wider mb-4">
            Testes Recentes
          </h2>
          <div className="space-y-3 max-h-[260px] overflow-y-auto">
            {speedTests.slice(0, 8).map((test) => (
              <div key={test.id} className="flex items-center justify-between p-3 rounded-lg bg-bg-secondary/30 text-sm">
                <div className="flex items-center gap-3">
                  <Server className="w-4 h-4 text-text-muted" />
                  <div>
                    <p className="text-xs text-text-muted">{test.server}</p>
                    <p className="text-xs text-text-muted">
                      {new Date(test.timestamp).toLocaleString('pt-PT')}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4 text-xs">
                  <span className="text-green font-bold">{formatSpeed(test.download)}</span>
                  <span className="text-purple font-bold">{formatSpeed(test.upload)}</span>
                  <span className="text-cyan">{test.ping}ms</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
