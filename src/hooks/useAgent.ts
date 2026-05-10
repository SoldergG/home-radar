import { useState, useEffect, useRef, useCallback } from 'react'
import { useStore } from './useStore'
import type { Device, DeviceType } from '../types'

export type AgentStatus = 'offline' | 'connecting' | 'online'

function guessType(hostname: string, vendor: string): DeviceType {
  const h = (hostname + ' ' + vendor).toLowerCase()
  if (h.includes('iphone') || h.includes('android')) return 'phone'
  if (h.includes('ipad'))   return 'tablet'
  if (h.includes('macbook') || h.includes('laptop')) return 'laptop'
  if (h.includes('tv') || h.includes('bravia'))      return 'tv'
  if (h.includes('playstation') || h.includes('xbox') || h.includes('nintendo')) return 'console'
  if (h.includes('speaker') || h.includes('echo') || h.includes('nest'))  return 'speaker'
  if (h.includes('camera') || h.includes('ring'))    return 'camera'
  if (h.includes('deco') || h.includes('router') || h.includes('gateway')) return 'router'
  if ((vendor.toLowerCase().includes('tp-link') || vendor.toLowerCase().includes('tp link')) && !h.includes('phone')) return 'router'
  if (vendor.toLowerCase().includes('apple')) return 'phone'
  return 'iot'
}

const radarPos = new Map<string, { angle: number; dist: number }>()
function getPos(id: string) {
  if (!radarPos.has(id)) radarPos.set(id, { angle: Math.random() * 360, dist: Math.random() * 0.55 + 0.2 })
  return radarPos.get(id)!
}

export function useAgent() {
  const [status, setStatus] = useState<AgentStatus>('offline')
  const [lastSync, setLastSync] = useState<Date | null>(null)
  const abortRef = useRef<AbortController | null>(null)

  const agentUrl = useStore((s) => s.settings.agentUrl)
  const scanInterval = useStore((s) => s.settings.scanInterval)
  const replaceDevices = useStore((s) => s.replaceDevices)

  const sync = useCallback(async () => {
    // Cancel any in-flight request
    abortRef.current?.abort()
    const ctrl = new AbortController()
    abortRef.current = ctrl

    setStatus('connecting')
    // Use /devices (returns cached data instantly, no blocking scan)
    // Also fire /scan in the background so agent updates its cache
    fetch(`${agentUrl}/scan`, { signal: AbortSignal.timeout ? AbortSignal.timeout(3000) : ctrl.signal }).catch(() => {})
    try {
      const res = await fetch(`${agentUrl}/devices`, {
        signal: ctrl.signal,
      })
      if (!res.ok) throw new Error('bad response')
      const data = await res.json()
      if (ctrl.signal.aborted) return

      setStatus('online')
      setLastSync(new Date())

      const scanned: Array<{ ip: string; mac: string; hostname: string; vendor: string; status: string; name?: string }> =
        (data.devices ?? []).filter((d: { ip: string }) =>
          !d.ip.startsWith('169.254') && !d.ip.startsWith('224.') && !d.ip.startsWith('239.')
        )

      const existingByMac = new Map(
        useStore.getState().devices.map((d) => [d.mac.toUpperCase(), d])
      )

      const newDevices: Device[] = scanned.map((d) => {
        const mac = d.mac.toUpperCase().replace(/-/g, ':')
        const existing = existingByMac.get(mac)
        const pos = getPos(mac)
        const vendor = d.vendor || ''
        const displayName =
          d.name ||
          (existing?.userId ? existing.name : undefined) ||
          (vendor && vendor !== 'Desconhecido'
            ? `${vendor} (${d.ip.split('.').pop()})`
            : `Dispositivo ${d.ip.split('.').pop()}`)

        return {
          id: existing?.id ?? `dev-${mac.replace(/:/g, '')}`,
          name: displayName,
          type: guessType(d.hostname ?? '', vendor),
          mac,
          ip: d.ip,
          vendor,
          status: 'online' as const,
          signalStrength: existing?.signalStrength ?? Math.floor(Math.random() * 35 + 55),
          lastSeen: new Date().toISOString(),
          firstSeen: existing?.firstSeen ?? new Date().toISOString(),
          uploadSpeed: existing?.uploadSpeed ?? 0,
          downloadSpeed: existing?.downloadSpeed ?? 0,
          totalUpload: existing?.totalUpload ?? 0,
          totalDownload: existing?.totalDownload ?? 0,
          userId: existing?.userId,
          radarAngle: pos.angle,
          radarDistance: pos.dist,
        }
      })

      replaceDevices(newDevices)
    } catch (e: unknown) {
      if (e instanceof Error && e.name === 'AbortError') return
      setStatus('offline')
    }
  }, [agentUrl, replaceDevices])

  // POST config to running agent
  const pushConfig = useCallback(async (decoPassword: string, gateway: string) => {
    try {
      await fetch(`${agentUrl}/config`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ deco_password: decoPassword, gateway }),
      })
    } catch { /* agent might not be running */ }
  }, [agentUrl])

  useEffect(() => {
    // Small delay so StrictMode double-mount doesn't cause two concurrent scans
    const timer = setTimeout(() => sync(), 400)
    const interval = setInterval(() => sync(), scanInterval * 1000)
    return () => {
      clearTimeout(timer)
      clearInterval(interval)
      abortRef.current?.abort()
    }
  }, [sync, scanInterval])

  return { status, lastSync, sync, pushConfig }
}
