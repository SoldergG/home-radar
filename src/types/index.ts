export type DeviceType = 'phone' | 'laptop' | 'tablet' | 'tv' | 'console' | 'speaker' | 'camera' | 'router' | 'iot' | 'unknown'
export type DeviceStatus = 'online' | 'offline' | 'away'

export interface Device {
  id: string
  name: string
  type: DeviceType
  mac: string
  ip: string
  vendor: string
  status: DeviceStatus
  signalStrength: number
  lastSeen: string
  firstSeen: string
  uploadSpeed: number
  downloadSpeed: number
  totalUpload: number
  totalDownload: number
  userId?: string
  radarAngle?: number
  radarDistance?: number
}

export interface User {
  id: string
  name: string
  avatar: string
  color: string
  devices: string[]
}

export interface NetworkStats {
  downloadSpeed: number
  uploadSpeed: number
  ping: number
  jitter: number
  packetLoss: number
  uptime: number
  connectedDevices: number
  totalBandwidth: number
  gatewayIp: string
  externalIp: string
  dns: string
  isp: string
}

export interface Alert {
  id: string
  type: 'new_device' | 'device_offline' | 'high_latency' | 'security' | 'bandwidth'
  title: string
  message: string
  timestamp: string
  read: boolean
  severity: 'info' | 'warning' | 'critical'
  deviceId?: string
}

export interface ActivityLog {
  id: string
  deviceId: string
  event: 'connected' | 'disconnected' | 'high_usage' | 'blocked'
  timestamp: string
}

export interface SpeedTestResult {
  id: string
  download: number
  upload: number
  ping: number
  timestamp: string
  server: string
}
