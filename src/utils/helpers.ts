import type { DeviceType } from '../types'

export function getDeviceIcon(type: DeviceType): string {
  const icons: Record<DeviceType, string> = {
    phone: 'Smartphone',
    laptop: 'Laptop',
    tablet: 'Tablet',
    tv: 'Tv',
    console: 'Gamepad2',
    speaker: 'Speaker',
    camera: 'Camera',
    router: 'Router',
    iot: 'Plug',
    unknown: 'HelpCircle',
  }
  return icons[type]
}

export function getDeviceEmoji(type: DeviceType): string {
  const emojis: Record<DeviceType, string> = {
    phone: '📱',
    laptop: '💻',
    tablet: '📟',
    tv: '📺',
    console: '🎮',
    speaker: '🔊',
    camera: '📷',
    router: '📡',
    iot: '🔌',
    unknown: '❓',
  }
  return emojis[type]
}

export function formatBytes(mb: number): string {
  if (mb >= 1000) return `${(mb / 1000).toFixed(1)} GB`
  return `${mb.toFixed(0)} MB`
}

export function formatSpeed(mbps: number): string {
  if (mbps >= 1000) return `${(mbps / 1000).toFixed(1)} Gbps`
  return `${mbps.toFixed(1)} Mbps`
}

export function timeAgo(dateStr: string): string {
  const seconds = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000)
  if (seconds < 60) return 'agora'
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m atrás`
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h atrás`
  return `${Math.floor(seconds / 86400)}d atrás`
}

export function getStatusColor(status: string): string {
  switch (status) {
    case 'online': return '#22c55e'
    case 'away': return '#f59e0b'
    case 'offline': return '#ef4444'
    default: return '#475569'
  }
}

export function getSignalColor(strength: number): string {
  if (strength >= 75) return '#22c55e'
  if (strength >= 50) return '#f59e0b'
  if (strength >= 25) return '#ef4444'
  return '#475569'
}

export function getSeverityColor(severity: string): string {
  switch (severity) {
    case 'critical': return '#ef4444'
    case 'warning': return '#f59e0b'
    case 'info': return '#00f0ff'
    default: return '#475569'
  }
}
