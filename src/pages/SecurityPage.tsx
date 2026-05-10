import { Shield, CheckCircle2, AlertTriangle, XCircle, Lock, Eye, Wifi, Globe, Server } from 'lucide-react'
import { useStore } from '../hooks/useStore'

interface SecurityCheck {
  id: string
  label: string
  description: string
  status: 'pass' | 'warning' | 'fail'
  icon: typeof Lock
  category: string
}

const securityChecks: SecurityCheck[] = [
  { id: 'c1', label: 'Encriptação WiFi', description: 'WPA3 ativo', status: 'pass', icon: Lock, category: 'Rede' },
  { id: 'c2', label: 'Firewall do Router', description: 'Ativo e configurado', status: 'pass', icon: Shield, category: 'Rede' },
  { id: 'c3', label: 'Porta SSH (22)', description: 'Aberta no router — considerar fechar', status: 'fail', icon: Server, category: 'Portas' },
  { id: 'c4', label: 'DNS seguro', description: 'Cloudflare 1.1.1.1 (DNS-over-HTTPS)', status: 'pass', icon: Globe, category: 'DNS' },
  { id: 'c5', label: 'Firmware do Router', description: 'Atualização disponível', status: 'warning', icon: Server, category: 'Router' },
  { id: 'c6', label: 'UPnP', description: 'Ativo — pode expor dispositivos', status: 'warning', icon: Eye, category: 'Rede' },
  { id: 'c7', label: 'Rede de convidados', description: 'Não configurada', status: 'warning', icon: Wifi, category: 'Rede' },
  { id: 'c8', label: 'Password do Router', description: 'Password forte detetada', status: 'pass', icon: Lock, category: 'Router' },
  { id: 'c9', label: 'Dispositivos desconhecidos', description: 'Nenhum dispositivo suspeito', status: 'pass', icon: Eye, category: 'Dispositivos' },
  { id: 'c10', label: 'WPS', description: 'Desativado (bom)', status: 'pass', icon: Lock, category: 'Rede' },
]

export default function SecurityPage() {
  const { devices } = useStore()
  const passCount = securityChecks.filter((c) => c.status === 'pass').length
  const warnCount = securityChecks.filter((c) => c.status === 'warning').length
  const failCount = securityChecks.filter((c) => c.status === 'fail').length
  const score = Math.round((passCount / securityChecks.length) * 100)

  const getScoreColor = () => {
    if (score >= 80) return '#22c55e'
    if (score >= 60) return '#f59e0b'
    return '#ef4444'
  }

  const getScoreLabel = () => {
    if (score >= 80) return 'Bom'
    if (score >= 60) return 'Razoável'
    return 'Fraco'
  }

  const categories = [...new Set(securityChecks.map((c) => c.category))]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-3">
          <Shield className="w-6 h-6 text-cyan" />
          Segurança
        </h1>
        <p className="text-sm text-text-secondary mt-1">Avaliação de segurança da rede</p>
      </div>

      {/* Score */}
      <div className="glass-card glow-cyan p-8 flex flex-col items-center animate-fade-in-up">
        <div className="relative w-48 h-48 flex items-center justify-center">
          <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 192 192">
            <circle cx="96" cy="96" r="80" fill="none" stroke="#1e1e4a" strokeWidth="10" />
            <circle
              cx="96" cy="96" r="80" fill="none"
              stroke={getScoreColor()}
              strokeWidth="10"
              strokeLinecap="round"
              strokeDasharray={`${2 * Math.PI * 80}`}
              strokeDashoffset={`${2 * Math.PI * 80 * (1 - score / 100)}`}
            />
          </svg>
          <div className="text-center z-10">
            <p className="text-5xl font-bold" style={{ color: getScoreColor() }}>{score}</p>
            <p className="text-sm text-text-secondary">{getScoreLabel()}</p>
          </div>
        </div>

        <div className="flex items-center gap-8 mt-6">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-green" />
            <span className="text-sm">{passCount} OK</span>
          </div>
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber" />
            <span className="text-sm">{warnCount} Avisos</span>
          </div>
          <div className="flex items-center gap-2">
            <XCircle className="w-4 h-4 text-red" />
            <span className="text-sm">{failCount} Falhas</span>
          </div>
        </div>
      </div>

      {/* Checks by Category */}
      <div className="space-y-4">
        {categories.map((cat) => (
          <div key={cat} className="glass-card p-5 animate-fade-in-up">
            <h3 className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-3">{cat}</h3>
            <div className="space-y-2">
              {securityChecks.filter((c) => c.category === cat).map((check) => (
                <div key={check.id} className="flex items-center gap-3 p-3 rounded-lg bg-bg-secondary/30">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                    check.status === 'pass' ? 'bg-green/10' :
                    check.status === 'warning' ? 'bg-amber/10' : 'bg-red/10'
                  }`}>
                    {check.status === 'pass' ? (
                      <CheckCircle2 className="w-4 h-4 text-green" />
                    ) : check.status === 'warning' ? (
                      <AlertTriangle className="w-4 h-4 text-amber" />
                    ) : (
                      <XCircle className="w-4 h-4 text-red" />
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">{check.label}</p>
                    <p className="text-xs text-text-muted">{check.description}</p>
                  </div>
                  <check.icon className="w-4 h-4 text-text-muted" />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Device Security */}
      <div className="glass-card p-5 animate-fade-in-up">
        <h3 className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-3">
          Dispositivos na Rede ({devices.length})
        </h3>
        <p className="text-xs text-text-muted mb-3">
          Todos os dispositivos são reconhecidos. Dispositivos novos disparam alertas automaticamente.
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
          {devices.map((d) => (
            <div key={d.id} className="flex items-center gap-2 p-2 rounded-lg bg-bg-secondary/20 text-xs">
              <div className={`w-2 h-2 rounded-full ${d.status === 'online' ? 'bg-green' : 'bg-text-muted'}`} />
              <span className="truncate">{d.name}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
