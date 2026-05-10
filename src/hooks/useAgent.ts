import { useState, useEffect, useCallback } from 'react'
import { useStore } from './useStore'
import type { Device, DeviceType } from '../types'

const AGENT_URL = 'http://localhost:7890'

export type AgentStatus = 'offline' | 'connecting' | 'online'

function guessType(hostname: string, vendor: string): DeviceType {
  const h = hostname.toLowerCase()
  const v = vendor.toLowerCase()
  if (v.includes('apple')) {
    if (h.includes('iphone')) return 'phone'
    if (h.includes('ipad')) return 'tablet'
    if (h.includes('macbook') || h.includes('mac')) return 'laptop'
    return 'phone'
  }
  if (v.includes('samsung')) {
    if (h.includes('tv') || h.includes('smart')) return 'tv'
    return 'phone'
  }
  if (v.includes('sony')) return 'console'
  if (v.includes('google')) return 'speaker'
  if (v.includes('amazon') || v.includes('ring')) return 'camera'
  if (v.includes('tp-link') || v.includes('deco') || v.includes('tplink')) return 'router'
  if (h.includes('router') || h.includes('gateway') || h.includes('deco')) return 'router'
  if (h.includes('tv') || h.includes('television')) return 'tv'
  if (h.includes('phone') || h.includes('mobile')) return 'phone'
  if (h.includes('laptop') || h.includes('macbook') || h.includes('pc')) return 'laptop'
  if (h.includes('ipad') || h.includes('tablet')) return 'tablet'
  if (h.includes('ps') || h.includes('xbox') || h.includes('playstation')) return 'console'
  if (h.includes('cam') || h.includes('camera')) return 'camera'
  if (v.includes('unknown') || v === '') return 'iot'
  return 'unknown'
}

export function useAgent(intervalMs = 30000) {
  const [status, setStatus] = useState<AgentStatus>('offline')
  const [lastSync, setLastSync] = useState<Date | null>(null)
  const { addDevice, updateDevice, devices } = useStore()

  const sync = useCallback(async () => {
    setStatus('connecting')
    try {
      const res = await fetch(`${AGENT_URL}/scan`, { signal: AbortSignal.timeout(8000) })
      if (!res.ok) throw new Error('bad response')
      const data = await res.json()
      setStatus('online')
      setLastSync(new Date())

      const scanned: Array<{ ip: string; mac: string; hostname: string; vendor: string; status: string }> = data.devices ?? []

      for (const d of scanned) {
        const existing = devices.find((x) => x.mac === d.mac.toUpperCase() || x.ip === d.ip)
        if (existing) {
          updateDevice(existing.id, {
            status: 'online',
            lastSeen: new Date().toISOString(),
            ip: d.ip,
          })
        } else {
          const type = guessType(d.hostname, d.vendor)
          const newDevice: Device = {
            id: `real-${d.mac.replace(/:/g, '')}`,
            name: d.hostname !== d.ip ? d.hostname.split('.')[0] : `Dispositivo ${d.ip.split('.').pop()}`,
            type,
            mac: d.mac.toUpperCase(),
            ip: d.ip,
            vendor: d.vendor || 'Desconhecido',
            status: 'online',
            signalStrength: Math.floor(Math.random() * 40 + 55),
            lastSeen: new Date().toISOString(),
            firstSeen: new Date().toISOString(),
            uploadSpeed: 0,
            downloadSpeed: 0,
            totalUpload: 0,
            totalDownload: 0,
            radarAngle: Math.random() * 360,
            radarDistance: Math.random() * 0.6 + 0.2,
          }
          addDevice(newDevice)
        }
      }

      // Mark missing devices as away
      for (const d of devices) {
        const stillOnline = scanned.some((s) => s.mac.toUpperCase() === d.mac || s.ip === d.ip)
        if (!stillOnline && d.status === 'online') {
          updateDevice(d.id, { status: 'away', lastSeen: new Date().toISOString() })
        }
      }
    } catch {
      setStatus('offline')
    }
  }, [devices, addDevice, updateDevice])

  useEffect(() => {
    sync()
    const id = setInterval(sync, intervalMs)
    return () => clearInterval(id)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  return { status, lastSync, sync }
}
