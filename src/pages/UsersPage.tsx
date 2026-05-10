import { useState } from 'react'
import { Users, Plus, X, Link2, Unlink, Pencil } from 'lucide-react'
import { useStore } from '../hooks/useStore'
import { getDeviceEmoji, formatBytes } from '../utils/helpers'

const avatarOptions = ['👨‍💻', '👩', '🧑', '👦', '👧', '👨', '👩‍💼', '🧓', '👶', '🐱', '🐶']
const colorOptions = ['#00f0ff', '#a855f7', '#22c55e', '#f59e0b', '#ef4444', '#ec4899', '#06b6d4', '#8b5cf6']

export default function UsersPage() {
  const { users, devices, addUser, updateUser, removeUser, assignDevice, unassignDevice } = useStore()
  const [showAdd, setShowAdd] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState({ name: '', avatar: '👨‍💻', color: '#00f0ff' })
  const [assigningUserId, setAssigningUserId] = useState<string | null>(null)

  const unassignedDevices = devices.filter((d) => !d.userId && d.type !== 'router')

  const handleAdd = () => {
    if (!form.name.trim()) return
    const id = `u${Date.now()}`
    addUser({ id, name: form.name, avatar: form.avatar, color: form.color, devices: [] })
    setForm({ name: '', avatar: '👨‍💻', color: '#00f0ff' })
    setShowAdd(false)
  }

  const handleUpdate = () => {
    if (!editingId || !form.name.trim()) return
    updateUser(editingId, { name: form.name, avatar: form.avatar, color: form.color })
    setEditingId(null)
    setForm({ name: '', avatar: '👨‍💻', color: '#00f0ff' })
  }

  const startEdit = (user: typeof users[0]) => {
    setEditingId(user.id)
    setForm({ name: user.name, avatar: user.avatar, color: user.color })
    setShowAdd(false)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-3">
            <Users className="w-6 h-6 text-cyan" />
            Utilizadores
          </h1>
          <p className="text-sm text-text-secondary mt-1">
            Gere quem usa a rede e os seus dispositivos
          </p>
        </div>
        <button
          onClick={() => { setShowAdd(!showAdd); setEditingId(null) }}
          className="flex items-center gap-2 px-4 py-2 bg-cyan/10 text-cyan text-sm rounded-lg hover:bg-cyan/20 transition-colors border border-cyan/20"
        >
          <Plus className="w-4 h-4" />
          Novo utilizador
        </button>
      </div>

      {/* Add/Edit Form */}
      {(showAdd || editingId) && (
        <div className="glass-card p-5 animate-fade-in-up">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold">
              {editingId ? 'Editar Utilizador' : 'Novo Utilizador'}
            </h3>
            <button
              onClick={() => { setShowAdd(false); setEditingId(null) }}
              className="p-1 hover:bg-white/10 rounded"
            >
              <X className="w-4 h-4 text-text-muted" />
            </button>
          </div>

          <div className="space-y-4">
            <input
              type="text"
              placeholder="Nome do utilizador"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full px-4 py-2 bg-bg-secondary border border-border rounded-lg text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-cyan/50"
            />

            <div>
              <p className="text-xs text-text-muted mb-2">Avatar</p>
              <div className="flex flex-wrap gap-2">
                {avatarOptions.map((emoji) => (
                  <button
                    key={emoji}
                    onClick={() => setForm({ ...form, avatar: emoji })}
                    className={`w-10 h-10 rounded-lg text-xl flex items-center justify-center transition-all ${
                      form.avatar === emoji ? 'bg-cyan/20 border border-cyan/50 scale-110' : 'bg-bg-secondary border border-border hover:bg-white/5'
                    }`}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <p className="text-xs text-text-muted mb-2">Cor</p>
              <div className="flex gap-2">
                {colorOptions.map((c) => (
                  <button
                    key={c}
                    onClick={() => setForm({ ...form, color: c })}
                    className={`w-8 h-8 rounded-full transition-all ${
                      form.color === c ? 'ring-2 ring-white ring-offset-2 ring-offset-bg-primary scale-110' : 'hover:scale-105'
                    }`}
                    style={{ background: c }}
                  />
                ))}
              </div>
            </div>

            <button
              onClick={editingId ? handleUpdate : handleAdd}
              className="px-6 py-2 bg-cyan text-bg-primary text-sm font-medium rounded-lg hover:bg-cyan/90 transition-colors"
            >
              {editingId ? 'Guardar' : 'Criar utilizador'}
            </button>
          </div>
        </div>
      )}

      {/* Users Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {users.map((user) => {
          const userDevices = devices.filter((d) => user.devices.includes(d.id))
          const totalDown = userDevices.reduce((sum, d) => sum + d.totalDownload, 0)
          const totalUp = userDevices.reduce((sum, d) => sum + d.totalUpload, 0)
          const onlineCount = userDevices.filter((d) => d.status === 'online').length

          return (
            <div key={user.id} className="glass-card p-5 animate-fade-in-up">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div
                    className="w-12 h-12 rounded-full flex items-center justify-center text-2xl"
                    style={{ background: `${user.color}20`, border: `2px solid ${user.color}40` }}
                  >
                    {user.avatar}
                  </div>
                  <div>
                    <h3 className="font-bold" style={{ color: user.color }}>{user.name}</h3>
                    <p className="text-xs text-text-muted">
                      {userDevices.length} dispositivo{userDevices.length !== 1 ? 's' : ''} · {onlineCount} online
                    </p>
                  </div>
                </div>
                <div className="flex gap-1">
                  <button
                    onClick={() => startEdit(user)}
                    className="p-1.5 hover:bg-white/10 rounded transition-colors"
                  >
                    <Pencil className="w-3.5 h-3.5 text-text-muted" />
                  </button>
                  <button
                    onClick={() => setAssigningUserId(assigningUserId === user.id ? null : user.id)}
                    className="p-1.5 hover:bg-white/10 rounded transition-colors"
                  >
                    <Link2 className="w-3.5 h-3.5 text-text-muted" />
                  </button>
                </div>
              </div>

              {/* User stats */}
              <div className="grid grid-cols-2 gap-3 mb-4 p-3 bg-bg-secondary/50 rounded-lg">
                <div>
                  <p className="text-xs text-text-muted">Download total</p>
                  <p className="text-sm font-bold text-green">{formatBytes(totalDown)}</p>
                </div>
                <div>
                  <p className="text-xs text-text-muted">Upload total</p>
                  <p className="text-sm font-bold text-purple">{formatBytes(totalUp)}</p>
                </div>
              </div>

              {/* Devices */}
              <div className="space-y-2">
                {userDevices.map((device) => (
                  <div
                    key={device.id}
                    className="flex items-center justify-between p-2 rounded-lg bg-bg-secondary/30"
                  >
                    <div className="flex items-center gap-2 text-sm">
                      <span>{getDeviceEmoji(device.type)}</span>
                      <span className="truncate">{device.name}</span>
                    </div>
                    <button
                      onClick={() => unassignDevice(user.id, device.id)}
                      className="p-1 hover:bg-red/20 rounded transition-colors"
                    >
                      <Unlink className="w-3 h-3 text-text-muted hover:text-red" />
                    </button>
                  </div>
                ))}
                {userDevices.length === 0 && (
                  <p className="text-xs text-text-muted text-center py-2">Sem dispositivos</p>
                )}
              </div>

              {/* Assign Device Panel */}
              {assigningUserId === user.id && unassignedDevices.length > 0 && (
                <div className="mt-3 pt-3 border-t border-border">
                  <p className="text-xs text-text-muted mb-2">Atribuir dispositivo:</p>
                  <div className="space-y-1">
                    {unassignedDevices.map((d) => (
                      <button
                        key={d.id}
                        onClick={() => { assignDevice(user.id, d.id); setAssigningUserId(null) }}
                        className="w-full flex items-center gap-2 p-2 rounded-lg text-sm hover:bg-cyan/10 transition-colors text-left"
                      >
                        <span>{getDeviceEmoji(d.type)}</span>
                        <span className="truncate">{d.name}</span>
                        <Plus className="w-3 h-3 ml-auto text-cyan" />
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Unassigned Devices */}
      {unassignedDevices.length > 0 && (
        <div className="glass-card p-5 animate-fade-in-up">
          <h3 className="text-sm font-semibold text-text-secondary uppercase tracking-wider mb-3">
            Dispositivos sem utilizador ({unassignedDevices.length})
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
            {unassignedDevices.map((d) => (
              <div
                key={d.id}
                className="flex items-center gap-2 p-3 rounded-lg bg-bg-secondary/30 text-sm"
              >
                <span>{getDeviceEmoji(d.type)}</span>
                <div className="min-w-0">
                  <p className="truncate">{d.name}</p>
                  <p className="text-xs text-text-muted">{d.ip}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
