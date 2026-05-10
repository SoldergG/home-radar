import { useRef, useEffect, useCallback } from 'react'
import type { Device } from '../../types'
import { getStatusColor } from '../../utils/helpers'

interface RadarCanvasProps {
  devices: Device[]
  size?: number
  selectedDevice?: string | null
  onDeviceClick?: (device: Device) => void
}

export default function RadarCanvas({ devices, size = 500, selectedDevice, onDeviceClick }: RadarCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animRef = useRef<number>(0)
  const sweepAngle = useRef(0)
  const blipPulses = useRef<Map<string, number>>(new Map())
  const mousePos = useRef<{ x: number; y: number } | null>(null)
  const hoveredDevice = useRef<string | null>(null)

  const getDevicePos = useCallback(
    (device: Device, cx: number, cy: number, radius: number) => {
      const angle = ((device.radarAngle ?? 0) * Math.PI) / 180
      const dist = (device.radarDistance ?? 0.5) * radius
      return { x: cx + Math.cos(angle) * dist, y: cy + Math.sin(angle) * dist }
    },
    []
  )

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')!
    const dpr = window.devicePixelRatio || 1
    canvas.width = size * dpr
    canvas.height = size * dpr
    ctx.scale(dpr, dpr)

    const cx = size / 2
    const cy = size / 2
    const radius = size / 2 - 30

    const draw = () => {
      ctx.clearRect(0, 0, size, size)

      // Background
      const bgGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, radius)
      bgGrad.addColorStop(0, 'rgba(0, 20, 30, 0.9)')
      bgGrad.addColorStop(1, 'rgba(6, 6, 14, 0.95)')
      ctx.fillStyle = bgGrad
      ctx.beginPath()
      ctx.arc(cx, cy, radius + 10, 0, Math.PI * 2)
      ctx.fill()

      // Grid rings
      for (let i = 1; i <= 4; i++) {
        const r = (radius / 4) * i
        ctx.beginPath()
        ctx.arc(cx, cy, r, 0, Math.PI * 2)
        ctx.strokeStyle = i === 4 ? 'rgba(0, 240, 255, 0.2)' : 'rgba(30, 30, 74, 0.5)'
        ctx.lineWidth = i === 4 ? 1.5 : 0.5
        ctx.stroke()
      }

      // Cross lines
      ctx.strokeStyle = 'rgba(30, 30, 74, 0.4)'
      ctx.lineWidth = 0.5
      for (let i = 0; i < 12; i++) {
        const angle = (i * Math.PI) / 6
        ctx.beginPath()
        ctx.moveTo(cx, cy)
        ctx.lineTo(cx + Math.cos(angle) * radius, cy + Math.sin(angle) * radius)
        ctx.stroke()
      }

      // Compass labels
      ctx.fillStyle = 'rgba(0, 240, 255, 0.4)'
      ctx.font = '10px monospace'
      ctx.textAlign = 'center'
      ctx.fillText('N', cx, cy - radius - 8)
      ctx.fillText('S', cx, cy + radius + 14)
      ctx.fillText('E', cx + radius + 12, cy + 4)
      ctx.fillText('W', cx - radius - 12, cy + 4)

      // Range labels
      ctx.fillStyle = 'rgba(148, 163, 184, 0.3)'
      ctx.font = '9px monospace'
      for (let i = 1; i <= 4; i++) {
        ctx.fillText(`${i * 25}%`, cx + 8, cy - (radius / 4) * i + 12)
      }

      // Sweep trail (drawn as fading arc segments)
      const trailLength = Math.PI * 0.6
      const segments = 30
      for (let i = 0; i < segments; i++) {
        const t = i / segments
        const startA = sweepAngle.current - trailLength * t - trailLength / segments
        const endA = sweepAngle.current - trailLength * t
        const alpha = 0.12 * (1 - t) * (1 - t)
        ctx.beginPath()
        ctx.moveTo(cx, cy)
        ctx.arc(cx, cy, radius, startA, endA)
        ctx.closePath()
        ctx.fillStyle = `rgba(0, 240, 255, ${alpha})`
        ctx.fill()
      }

      // Sweep line
      ctx.beginPath()
      ctx.moveTo(cx, cy)
      ctx.lineTo(
        cx + Math.cos(sweepAngle.current) * radius,
        cy + Math.sin(sweepAngle.current) * radius
      )
      ctx.strokeStyle = 'rgba(0, 240, 255, 0.6)'
      ctx.lineWidth = 1.5
      ctx.stroke()

      // Device blips
      const onlineDevices = devices.filter((d) => d.type !== 'router')
      for (const device of onlineDevices) {
        const pos = getDevicePos(device, cx, cy, radius)
        const color = getStatusColor(device.status)
        const isSelected = selectedDevice === device.id
        const isHovered = hoveredDevice.current === device.id

        // Check if sweep just passed
        const deviceAngle = ((device.radarAngle ?? 0) * Math.PI) / 180
        const angleDiff = Math.abs(sweepAngle.current - deviceAngle) % (Math.PI * 2)
        if (angleDiff < 0.15 && device.status === 'online') {
          blipPulses.current.set(device.id, 1)
        }

        const pulse = blipPulses.current.get(device.id) ?? 0

        // Glow
        if (device.status === 'online' || isSelected) {
          const glowRadius = 15 + pulse * 20
          const glow = ctx.createRadialGradient(pos.x, pos.y, 0, pos.x, pos.y, glowRadius)
          glow.addColorStop(0, `${color}40`)
          glow.addColorStop(1, `${color}00`)
          ctx.fillStyle = glow
          ctx.beginPath()
          ctx.arc(pos.x, pos.y, glowRadius, 0, Math.PI * 2)
          ctx.fill()
        }

        // Pulse ring
        if (pulse > 0.1) {
          ctx.beginPath()
          ctx.arc(pos.x, pos.y, 4 + pulse * 25, 0, Math.PI * 2)
          ctx.strokeStyle = `${color}${Math.floor(pulse * 80).toString(16).padStart(2, '0')}`
          ctx.lineWidth = 1
          ctx.stroke()
        }

        // Blip dot
        const dotSize = isSelected ? 6 : isHovered ? 5 : device.status === 'online' ? 4 : 3
        ctx.beginPath()
        ctx.arc(pos.x, pos.y, dotSize, 0, Math.PI * 2)
        ctx.fillStyle = device.status === 'offline' ? `${color}60` : color
        ctx.fill()

        if (isSelected || isHovered) {
          ctx.strokeStyle = '#ffffff80'
          ctx.lineWidth = 1.5
          ctx.stroke()
        }

        // Label
        if (isHovered || isSelected) {
          const label = device.name
          ctx.font = 'bold 11px Inter, system-ui'
          const metrics = ctx.measureText(label)
          const lx = pos.x - metrics.width / 2 - 6
          const ly = pos.y - 22

          ctx.fillStyle = 'rgba(6, 6, 14, 0.85)'
          ctx.beginPath()
          ctx.roundRect(lx, ly - 10, metrics.width + 12, 20, 4)
          ctx.fill()
          ctx.strokeStyle = `${color}60`
          ctx.lineWidth = 0.5
          ctx.stroke()

          ctx.fillStyle = color
          ctx.fillText(label, pos.x - metrics.width / 2, ly + 4)
        }

        // Decay pulse
        if (pulse > 0) {
          blipPulses.current.set(device.id, pulse * 0.97)
          if (pulse < 0.01) blipPulses.current.delete(device.id)
        }
      }

      // Center point (router)
      const routerGlow = ctx.createRadialGradient(cx, cy, 0, cx, cy, 12)
      routerGlow.addColorStop(0, 'rgba(0, 240, 255, 0.8)')
      routerGlow.addColorStop(0.5, 'rgba(0, 240, 255, 0.2)')
      routerGlow.addColorStop(1, 'rgba(0, 240, 255, 0)')
      ctx.fillStyle = routerGlow
      ctx.beginPath()
      ctx.arc(cx, cy, 12, 0, Math.PI * 2)
      ctx.fill()

      ctx.beginPath()
      ctx.arc(cx, cy, 4, 0, Math.PI * 2)
      ctx.fillStyle = '#00f0ff'
      ctx.fill()

      // Advance sweep
      sweepAngle.current += 0.012
      if (sweepAngle.current > Math.PI * 2) sweepAngle.current -= Math.PI * 2

      animRef.current = requestAnimationFrame(draw)
    }

    draw()
    return () => cancelAnimationFrame(animRef.current)
  }, [devices, size, selectedDevice, getDevicePos])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const handleMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect()
      mousePos.current = { x: e.clientX - rect.left, y: e.clientY - rect.top }

      const cx = size / 2
      const cy = size / 2
      const radius = size / 2 - 30

      let found: string | null = null
      for (const device of devices) {
        if (device.type === 'router') continue
        const pos = getDevicePos(device, cx, cy, radius)
        const scaleX = rect.width / size
        const scaleY = rect.height / size
        const dx = mousePos.current.x - pos.x * scaleX
        const dy = mousePos.current.y - pos.y * scaleY
        if (Math.sqrt(dx * dx + dy * dy) < 15) {
          found = device.id
          break
        }
      }
      hoveredDevice.current = found
      canvas.style.cursor = found ? 'pointer' : 'default'
    }

    const handleClick = () => {
      if (hoveredDevice.current && onDeviceClick) {
        const device = devices.find((d) => d.id === hoveredDevice.current)
        if (device) onDeviceClick(device)
      }
    }

    canvas.addEventListener('mousemove', handleMove)
    canvas.addEventListener('click', handleClick)
    return () => {
      canvas.removeEventListener('mousemove', handleMove)
      canvas.removeEventListener('click', handleClick)
    }
  }, [devices, size, getDevicePos, onDeviceClick])

  return (
    <canvas
      ref={canvasRef}
      style={{ width: size, height: size }}
      className="rounded-full"
    />
  )
}
