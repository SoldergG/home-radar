import { Bell, CheckCheck, AlertTriangle, Info, ShieldAlert, Wifi, Zap, Trash2 } from 'lucide-react'
import { useStore } from '../hooks/useStore'
import { timeAgo, getSeverityColor } from '../utils/helpers'

export default function AlertsPage() {
  const { alerts, markAlertRead, clearAlerts } = useStore()
  const unread = alerts.filter((a) => !a.read)

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'new_device': return Wifi
      case 'device_offline': return Wifi
      case 'high_latency': return Zap
      case 'security': return ShieldAlert
      case 'bandwidth': return Zap
      default: return Info
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-3">
            <Bell className="w-6 h-6 text-cyan" />
            Alertas
          </h1>
          <p className="text-sm text-text-secondary mt-1">
            {unread.length} não lido{unread.length !== 1 ? 's' : ''}
          </p>
        </div>
        {unread.length > 0 && (
          <button
            onClick={clearAlerts}
            className="flex items-center gap-2 px-4 py-2 bg-cyan/10 text-cyan text-sm rounded-lg hover:bg-cyan/20 transition-colors border border-cyan/20"
          >
            <CheckCheck className="w-4 h-4" />
            Marcar todos como lidos
          </button>
        )}
      </div>

      {/* Alert Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="glass-card p-4 text-center animate-fade-in-up">
          <Info className="w-5 h-5 text-cyan mx-auto mb-1" />
          <p className="text-xl font-bold text-cyan">{alerts.filter((a) => a.severity === 'info').length}</p>
          <p className="text-xs text-text-muted">Info</p>
        </div>
        <div className="glass-card p-4 text-center animate-fade-in-up">
          <AlertTriangle className="w-5 h-5 text-amber mx-auto mb-1" />
          <p className="text-xl font-bold text-amber">{alerts.filter((a) => a.severity === 'warning').length}</p>
          <p className="text-xs text-text-muted">Avisos</p>
        </div>
        <div className="glass-card p-4 text-center animate-fade-in-up">
          <ShieldAlert className="w-5 h-5 text-red mx-auto mb-1" />
          <p className="text-xl font-bold text-red">{alerts.filter((a) => a.severity === 'critical').length}</p>
          <p className="text-xs text-text-muted">Críticos</p>
        </div>
      </div>

      {/* Alert List */}
      <div className="space-y-2">
        {alerts.length === 0 ? (
          <div className="glass-card p-12 text-center animate-fade-in-up">
            <Bell className="w-10 h-10 text-text-muted mx-auto mb-3" />
            <p className="text-text-secondary">Sem alertas</p>
          </div>
        ) : (
          alerts.map((alert) => {
            const Icon = getAlertIcon(alert.type)
            const color = getSeverityColor(alert.severity)
            return (
              <div
                key={alert.id}
                className={`glass-card p-4 flex items-start gap-4 animate-fade-in-up transition-all cursor-pointer hover:border-cyan/20 ${
                  !alert.read ? 'border-l-2' : 'opacity-60'
                }`}
                style={!alert.read ? { borderLeftColor: color } : undefined}
                onClick={() => markAlertRead(alert.id)}
              >
                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{ background: `${color}15` }}
                >
                  <Icon className="w-5 h-5" style={{ color }} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-semibold">{alert.title}</h3>
                    {!alert.read && (
                      <span className="w-2 h-2 rounded-full bg-cyan flex-shrink-0" />
                    )}
                  </div>
                  <p className="text-xs text-text-secondary mt-0.5">{alert.message}</p>
                  <p className="text-xs text-text-muted mt-1">{timeAgo(alert.timestamp)}</p>
                </div>
                <span
                  className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full font-bold flex-shrink-0"
                  style={{ background: `${color}15`, color }}
                >
                  {alert.severity}
                </span>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
