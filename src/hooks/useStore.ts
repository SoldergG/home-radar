import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Device, User, Alert, SpeedTestResult, NetworkStats } from '../types'
import { mockDevices, mockUsers, mockAlerts, mockSpeedTests, mockNetworkStats, mockActivityLog } from '../data/mockData'
import type { ActivityLog } from '../types'

interface AppState {
  devices: Device[]
  users: User[]
  alerts: Alert[]
  activityLog: ActivityLog[]
  speedTests: SpeedTestResult[]
  networkStats: NetworkStats
  sidebarOpen: boolean

  setSidebarOpen: (open: boolean) => void
  toggleSidebar: () => void
  addDevice: (device: Device) => void
  updateDevice: (id: string, updates: Partial<Device>) => void
  removeDevice: (id: string) => void
  addUser: (user: User) => void
  updateUser: (id: string, updates: Partial<User>) => void
  removeUser: (id: string) => void
  assignDevice: (userId: string, deviceId: string) => void
  unassignDevice: (userId: string, deviceId: string) => void
  markAlertRead: (id: string) => void
  clearAlerts: () => void
  addSpeedTest: (result: SpeedTestResult) => void
}

export const useStore = create<AppState>()(
  persist(
    (set) => ({
      devices: mockDevices,
      users: mockUsers,
      alerts: mockAlerts,
      activityLog: mockActivityLog,
      speedTests: mockSpeedTests,
      networkStats: mockNetworkStats,
      sidebarOpen: true,

      setSidebarOpen: (open) => set({ sidebarOpen: open }),
      toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),

      addDevice: (device) => set((s) => ({ devices: [...s.devices, device] })),
      updateDevice: (id, updates) =>
        set((s) => ({
          devices: s.devices.map((d) => (d.id === id ? { ...d, ...updates } : d)),
        })),
      removeDevice: (id) => set((s) => ({ devices: s.devices.filter((d) => d.id !== id) })),

      addUser: (user) => set((s) => ({ users: [...s.users, user] })),
      updateUser: (id, updates) =>
        set((s) => ({
          users: s.users.map((u) => (u.id === id ? { ...u, ...updates } : u)),
        })),
      removeUser: (id) => set((s) => ({ users: s.users.filter((u) => u.id !== id) })),

      assignDevice: (userId, deviceId) =>
        set((s) => ({
          users: s.users.map((u) =>
            u.id === userId ? { ...u, devices: [...u.devices, deviceId] } : u
          ),
          devices: s.devices.map((d) =>
            d.id === deviceId ? { ...d, userId } : d
          ),
        })),
      unassignDevice: (userId, deviceId) =>
        set((s) => ({
          users: s.users.map((u) =>
            u.id === userId ? { ...u, devices: u.devices.filter((id) => id !== deviceId) } : u
          ),
          devices: s.devices.map((d) =>
            d.id === deviceId ? { ...d, userId: undefined } : d
          ),
        })),

      markAlertRead: (id) =>
        set((s) => ({
          alerts: s.alerts.map((a) => (a.id === id ? { ...a, read: true } : a)),
        })),
      clearAlerts: () => set((s) => ({ alerts: s.alerts.map((a) => ({ ...a, read: true })) })),

      addSpeedTest: (result) =>
        set((s) => ({ speedTests: [result, ...s.speedTests].slice(0, 50) })),
    }),
    { name: 'home-radar-store' }
  )
)
