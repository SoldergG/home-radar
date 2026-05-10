import { useState, useEffect, useCallback, useRef } from 'react'
import { useStore } from './useStore'
import type { Device, DeviceType } from '../types'

export type AgentStatus = 'offline' | 'connecting' | 'online'

function guessType(hostname: string, vendor: string): DeviceType {
  const h = (hostname + ' ' + vendor).toLowerCase()
  if (h.includes('iphone') || h.includes('android')) return 'phone'
  if (h.includes('ipad'))   return 'tablet'
  if (h.includes('macbook') || h.includes('laptop') || h.includes('pc')) return 'laptop'
  if (h.includes('tv') || h.includes('television') || h.includes('bravia')) return 'tv'
  if (h.includes('playstation') || h.includes('xbox') || h.includes('nintendo')) return 'console'
  if (h.includes('speaker') || h.includes('home') || h.includes('echo') || h.includes('nest')) return 'speaker'
  if (h.includes('camera') || h.includes('cam') || h.includes('ring')) return 'camera'
  if (h.includes('deco') || h.includes('router') || h.includes('gateway')) return 'router'
  if (h.includes('tp-link') && !h.includes('phone')) return 'router'
  if (vendor.toLowerCase().includes('apple')) return 'phone'  // most Apple devices are iPhones
  return 'iot'
}

// Assign radar position once per device id
const radarPositions = new Map<string, { angle: number; dist: number }>()
function getRadarPos(id: string) {
  if (!radarPositions.has(id)) {
    radarPositions.set(id, {
      angle: Math.random() * 360,
      dist: Math.random() * 0.55 + 0.2,
    })
  }
  return radarPositions.get(id)!
}

export function useAgent() {
  const [status, setStatus] = useState<AgentStatus>('offline')
  const [lastSync, setLastSync] = useState<Date | null>(null)
  const syncingRef = useRef(false)

  const { settings, users, replaceDevices } = useStore()

  const sync = useCallback(async () => {
    if (syncingRef.current) return
    syncingRef.current = true
    setStatus('connecting')

    try {
      const res = await fetch(`${settings.agentUrl}/scan`, {
        signal: AbortSignal.timeout(10000),
      })
      if (!res.ok) throw new Error('bad response')
      const data = await res.json()
      setStatus('online')
      setLastSync(new Date())

      const scanned: Array<{
        ip: string; mac: string; hostname: string
        vendor: string; status: string; name?: string
      }> = data.devices ?? []

      // Filter out multicast/link-local
      const real = scanned.filter((d) => {
        const ip = d.ip
        return !ip.startsWith('169.254') && !ip.startsWith('224.') &&
               !ip.startsWith('239.') && !ip.startsWith('255.')
      })

      // Preserve existing user assignments (mac → userId, name overrides)
      const store = useStore.getState()
      const existingByMac = new Map(
        store.devices.map((d) => [d.mac.toUpperCase(), d])
      )

      const newDevices: Device[] = real.map((d) => {
        const mac = d.mac.toUpperCase().replace(/-/g, ':')
        const existing = existingByMac.get(mac)
        const pos = getRadarPos(mac)
        const vendor = d.vendor || ''
        // Prefer Deco-API name > user-set name > vendor+IP fallback
        const displayName =
          d.name ||
          (existing?.userId ? existing.name : null) || // keep user-renamed
          (vendor && vendor !== 'Desconhecido' ? `${vendor} (${d.ip.split('.').pop()})` : `Dispositivo ${d.ip.split('.').pop()}`)

        return {
          id: existing?.id ?? `dev-${mac.replace(/:/g, '')}`,
          name: displayName,
          type: guessType(d.hostname, vendor),
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

      // Re-attach user assignments that might reference old IDs
      const fixedDevices = newDevices.map((d) => {
        if (d.userId) return d
        // Check if any user has a device with same mac
        const matchedUserId = users
          .flatMap((u) => u.devices.map((did) => ({ userId: u.id, did })))
          .find(({ did }) => {
            const old = store.devices.find((x) => x.id === did)
            return old && old.mac.toUpperCase() === d.mac.toUpperCase()
          })?.userId
        return matchedUserId ? { ...d, userId: matchedUserId } : d
      })

      replaceDevices(fixedDevices)
    } catch {
      setStatus('offline')
    } finally {
      syncingRef.current = false
    }
  }, [settings.agentUrl, replaceDevices, users])

  // POST new config to running agent whenever settings change
  const pushConfig = useCallback(async () => {
    try {
      await fetch(`${settings.agentUrl}/config`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          deco_password: settings.decoPassword,
          gateway: settings.gatewayIp,
        }),
        signal: AbortSignal.timeout(3000),
      })
    } catch { /* agent might not be running yet */ }
  }, [settings.agentUrl, settings.decoPassword, settings.gatewayIp])

  useEffect(() => {
    sync()
    const id = setInterval(sync, settings.scanInterval * 1000)
    return () => clearInterval(id)
  }, [settings.agentUrl, settings.scanInterval]) // eslint-disable-line

  return { status, lastSync, sync, pushConfig }
}
