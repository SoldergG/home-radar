import { useState } from 'react'
import { Settings, Wifi, Server, Globe, Bell, Palette, Download, Upload, Trash2 } from 'lucide-react'
import { useStore } from '../hooks/useStore'

export default function SettingsPage() {
  const { networkStats } = useStore()
  const [agentUrl, setAgentUrl] = useState('http://localhost:7890')
  const [scanInterval, setScanInterval] = useState('30')
  const [notifications, setNotifications] = useState(true)
  const [autoScan, setAutoScan] = useState(false)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-3">
          <Settings className="w-6 h-6 text-cyan" />
          Definições
        </h1>
        <p className="text-sm text-text-secondary mt-1">Configuração do HomeRadar</p>
      </div>

      {/* Agent Config */}
      <div className="glass-card p-5 animate-fade-in-up">
        <h3 className="text-sm font-semibold text-text-secondary uppercase tracking-wider mb-4 flex items-center gap-2">
          <Server className="w-4 h-4" />
          Agente Local
        </h3>
        <p className="text-xs text-text-muted mb-4">
          O agente local corre no teu MacBook e faz scan da rede. Inicia com: <code className="text-cyan bg-bg-secondary px-1.5 py-0.5 rounded">python agent/scanner.py</code>
        </p>
        <div className="space-y-3">
          <div>
            <label className="text-xs text-text-muted mb-1 block">URL do Agente</label>
            <input
              type="text"
              value={agentUrl}
              onChange={(e) => setAgentUrl(e.target.value)}
              className="w-full px-3 py-2 bg-bg-secondary border border-border rounded-lg text-sm font-mono text-text-primary focus:outline-none focus:border-cyan/50"
            />
          </div>
          <div>
            <label className="text-xs text-text-muted mb-1 block">Intervalo de Scan (segundos)</label>
            <input
              type="number"
              value={scanInterval}
              onChange={(e) => setScanInterval(e.target.value)}
              min="10"
              max="300"
              className="w-32 px-3 py-2 bg-bg-secondary border border-border rounded-lg text-sm font-mono text-text-primary focus:outline-none focus:border-cyan/50"
            />
          </div>
          <label className="flex items-center gap-3 cursor-pointer">
            <div
              className={`w-10 h-5 rounded-full transition-colors flex items-center ${autoScan ? 'bg-cyan' : 'bg-border'}`}
              onClick={() => setAutoScan(!autoScan)}
            >
              <div className={`w-4 h-4 rounded-full bg-white transition-transform mx-0.5 ${autoScan ? 'translate-x-5' : ''}`} />
            </div>
            <span className="text-sm">Auto-scan ao abrir</span>
          </label>
        </div>
      </div>

      {/* Network Info */}
      <div className="glass-card p-5 animate-fade-in-up">
        <h3 className="text-sm font-semibold text-text-secondary uppercase tracking-wider mb-4 flex items-center gap-2">
          <Globe className="w-4 h-4" />
          Informação da Rede
        </h3>
        <div className="grid grid-cols-2 gap-3 text-sm">
          <InfoRow label="Gateway" value={networkStats.gatewayIp} />
          <InfoRow label="IP Externo" value={networkStats.externalIp} />
          <InfoRow label="DNS" value={networkStats.dns} />
          <InfoRow label="ISP" value={networkStats.isp} />
        </div>
      </div>

      {/* Notifications */}
      <div className="glass-card p-5 animate-fade-in-up">
        <h3 className="text-sm font-semibold text-text-secondary uppercase tracking-wider mb-4 flex items-center gap-2">
          <Bell className="w-4 h-4" />
          Notificações
        </h3>
        <div className="space-y-3">
          <label className="flex items-center justify-between cursor-pointer">
            <span className="text-sm">Novo dispositivo na rede</span>
            <div
              className={`w-10 h-5 rounded-full transition-colors flex items-center ${notifications ? 'bg-cyan' : 'bg-border'}`}
              onClick={() => setNotifications(!notifications)}
            >
              <div className={`w-4 h-4 rounded-full bg-white transition-transform mx-0.5 ${notifications ? 'translate-x-5' : ''}`} />
            </div>
          </label>
          <label className="flex items-center justify-between cursor-pointer">
            <span className="text-sm">Dispositivo offline</span>
            <div className="w-10 h-5 rounded-full bg-cyan flex items-center">
              <div className="w-4 h-4 rounded-full bg-white translate-x-5 mx-0.5" />
            </div>
          </label>
          <label className="flex items-center justify-between cursor-pointer">
            <span className="text-sm">Alerta de segurança</span>
            <div className="w-10 h-5 rounded-full bg-cyan flex items-center">
              <div className="w-4 h-4 rounded-full bg-white translate-x-5 mx-0.5" />
            </div>
          </label>
        </div>
      </div>

      {/* Data */}
      <div className="glass-card p-5 animate-fade-in-up">
        <h3 className="text-sm font-semibold text-text-secondary uppercase tracking-wider mb-4 flex items-center gap-2">
          <Download className="w-4 h-4" />
          Dados
        </h3>
        <div className="flex gap-3">
          <button className="flex items-center gap-2 px-4 py-2 bg-bg-secondary text-sm rounded-lg hover:bg-white/5 transition-colors border border-border">
            <Download className="w-4 h-4" />
            Exportar dados
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-bg-secondary text-sm rounded-lg hover:bg-white/5 transition-colors border border-border">
            <Upload className="w-4 h-4" />
            Importar dados
          </button>
          <button
            onClick={() => {
              if (confirm('Tem a certeza que quer limpar todos os dados?')) {
                localStorage.removeItem('home-radar-store')
                window.location.reload()
              }
            }}
            className="flex items-center gap-2 px-4 py-2 bg-red/10 text-red text-sm rounded-lg hover:bg-red/20 transition-colors border border-red/20"
          >
            <Trash2 className="w-4 h-4" />
            Limpar dados
          </button>
        </div>
      </div>

      {/* Tailscale */}
      <div className="glass-card p-5 animate-fade-in-up">
        <h3 className="text-sm font-semibold text-text-secondary uppercase tracking-wider mb-4 flex items-center gap-2">
          <Wifi className="w-4 h-4" />
          Acesso Remoto (Tailscale)
        </h3>
        <p className="text-xs text-text-muted mb-3">
          Para aceder ao dashboard de fora de casa, instala o Tailscale no MacBook e acede via o IP da Tailnet.
        </p>
        <div className="space-y-2 text-sm">
          <div className="p-3 bg-bg-secondary/50 rounded-lg">
            <p className="text-xs text-text-muted mb-1">1. Instalar Tailscale</p>
            <code className="text-cyan text-xs">brew install tailscale</code>
          </div>
          <div className="p-3 bg-bg-secondary/50 rounded-lg">
            <p className="text-xs text-text-muted mb-1">2. Iniciar o agente com host 0.0.0.0</p>
            <code className="text-cyan text-xs">python agent/scanner.py --host 0.0.0.0</code>
          </div>
          <div className="p-3 bg-bg-secondary/50 rounded-lg">
            <p className="text-xs text-text-muted mb-1">3. Aceder via Tailscale IP</p>
            <code className="text-cyan text-xs">http://100.x.x.x:5173</code>
          </div>
        </div>
      </div>
    </div>
  )
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between p-2 rounded bg-bg-secondary/30">
      <span className="text-text-muted text-xs">{label}</span>
      <span className="font-mono text-xs">{value}</span>
    </div>
  )
}
