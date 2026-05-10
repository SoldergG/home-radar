import type { DeviceType } from '../types'

export function getDeviceIcon(type: DeviceType): string {
  const icons: Record<DeviceType, string> = {
    phone:   'Smartphone',
    laptop:  'Laptop',
    tablet:  'Tablet',
    tv:      'Tv2',
    console: 'Gamepad2',
    speaker: 'Speaker',
    camera:  'Camera',
    router:  'Router',
    iot:     'Plug',
    unknown: 'HelpCircle',
  }
  return icons[type]
}

export function formatBytes(mb: number): string {
  if (mb >= 1000) return `${(mb / 1000).toFixed(1)} GB`
  return `${mb.toFixed(0)} MB`
}

export function formatSpeed(mbps: number): string {
  if (mbps >= 1000) return `${(mbps / 1000).toFixed(1)} Gbps`
  if (mbps === 0) return '—'
  return `${mbps.toFixed(1)} Mbps`
}

export function timeAgo(dateStr: string): string {
  const s = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000)
  if (s < 60) return 'agora'
  if (s < 3600) return `${Math.floor(s / 60)}m`
  if (s < 86400) return `${Math.floor(s / 3600)}h`
  return `${Math.floor(s / 86400)}d`
}

export function getStatusColor(status: string): string {
  switch (status) {
    case 'online':  return 'var(--color-green)'
    case 'away':    return 'var(--color-amber)'
    case 'offline': return 'var(--color-red)'
    default:        return 'var(--color-muted)'
  }
}

export function getSignalColor(pct: number): string {
  if (pct >= 70) return 'var(--color-green)'
  if (pct >= 40) return 'var(--color-amber)'
  return 'var(--color-red)'
}

export function getSeverityColor(sev: string): string {
  switch (sev) {
    case 'critical': return 'var(--color-red)'
    case 'warning':  return 'var(--color-amber)'
    default:         return 'var(--color-cyan)'
  }
}
