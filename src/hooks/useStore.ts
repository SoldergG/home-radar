import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Device, User, Alert, SpeedTestResult, NetworkStats, ActivityLog } from '../types'
import { mockUsers, mockAlerts, mockSpeedTests, mockNetworkStats, mockActivityLog } from '../data/mockData'

export interface AppSettings {
  agentUrl: string
  scanInterval: number       // seconds
  gatewayIp: string
  decoPassword: string
  extraKeyLabel: string
  extraKeyValue: string
  demoMode: boolean          // show mock devices when agent is offline
}

const defaultSettings: AppSettings = {
  agentUrl: 'http://localhost:7890',
  scanInterval: 30,
  gatewayIp: '192.168.68.1',
  decoPassword: '',
  extraKeyLabel: 'Chave NOS/ISP',
  extraKeyValue: '',
  demoMode: false,
}

interface AppState {
  devices: Device[]
  users: User[]
  alerts: Alert[]
  activityLog: ActivityLog[]
  speedTests: SpeedTestResult[]
  networkStats: NetworkStats
  sidebarOpen: boolean
  settings: AppSettings
  hasRealData: boolean       // true after first successful agent sync

  setSidebarOpen: (open: boolean) => void
  toggleSidebar: () => void

  addDevice: (device: Device) => void
  updateDevice: (id: string, updates: Partial<Device>) => void
  removeDevice: (id: string) => void
  replaceDevices: (devices: Device[]) => void  // replaces all devices with real scan

  addUser: (user: User) => void
  updateUser: (id: string, updates: Partial<User>) => void
  removeUser: (id: string) => void
  assignDevice: (userId: string, deviceId: string) => void
  unassignDevice: (userId: string, deviceId: string) => void

  markAlertRead: (id: string) => void
  clearAlerts: () => void
  addAlert: (alert: Alert) => void

  addSpeedTest: (result: SpeedTestResult) => void

  updateSettings: (s: Partial<AppSettings>) => void
  setHasRealData: (v: boolean) => void
}

export const useStore = create<AppState>()(
  persist(
    (set) => ({
      devices: [],
      users: mockUsers,
      alerts: mockAlerts,
      activityLog: mockActivityLog,
      speedTests: mockSpeedTests,
      networkStats: mockNetworkStats,
      sidebarOpen: true,
      settings: defaultSettings,
      hasRealData: false,

      setSidebarOpen: (open) => set({ sidebarOpen: open }),
      toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),

      addDevice: (device) => set((s) => ({ devices: [...s.devices, device] })),
      updateDevice: (id, updates) =>
        set((s) => ({ devices: s.devices.map((d) => d.id === id ? { ...d, ...updates } : d) })),
      removeDevice: (id) => set((s) => ({ devices: s.devices.filter((d) => d.id !== id) })),
      replaceDevices: (devices) => set({ devices, hasRealData: true }),

      addUser: (user) => set((s) => ({ users: [...s.users, user] })),
      updateUser: (id, updates) =>
        set((s) => ({ users: s.users.map((u) => u.id === id ? { ...u, ...updates } : u) })),
      removeUser: (id) => set((s) => ({ users: s.users.filter((u) => u.id !== id) })),

      assignDevice: (userId, deviceId) =>
        set((s) => ({
          users: s.users.map((u) => u.id === userId ? { ...u, devices: [...u.devices, deviceId] } : u),
          devices: s.devices.map((d) => d.id === deviceId ? { ...d, userId } : d),
        })),
      unassignDevice: (userId, deviceId) =>
        set((s) => ({
          users: s.users.map((u) => u.id === userId ? { ...u, devices: u.devices.filter((id) => id !== deviceId) } : u),
          devices: s.devices.map((d) => d.id === deviceId ? { ...d, userId: undefined } : d),
        })),

      markAlertRead: (id) =>
        set((s) => ({ alerts: s.alerts.map((a) => a.id === id ? { ...a, read: true } : a) })),
      clearAlerts: () => set((s) => ({ alerts: s.alerts.map((a) => ({ ...a, read: true })) })),
      addAlert: (alert) => set((s) => ({ alerts: [alert, ...s.alerts] })),

      addSpeedTest: (result) =>
        set((s) => ({ speedTests: [result, ...s.speedTests].slice(0, 50) })),

      updateSettings: (s) => set((st) => ({ settings: { ...st.settings, ...s } })),
      setHasRealData: (v) => set({ hasRealData: v }),
    }),
    { name: 'home-radar-v2' }
  )
)
