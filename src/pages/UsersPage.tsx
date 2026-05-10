import { useState } from 'react'
import { Users, Plus, X, Link2, Unlink, Pencil, Trash2 } from 'lucide-react'
import { useStore } from '../hooks/useStore'
import { getDeviceIcon, formatBytes } from '../utils/helpers'
import * as LucideIcons from 'lucide-react'
import type { LucideProps } from 'lucide-react'

function DynIcon({ name, ...p }: { name: string } & LucideProps) {
  const I = (LucideIcons as Record<string, React.ComponentType<LucideProps>>)[name]
  return I ? <I {...p} /> : <LucideIcons.HelpCircle {...p} />
}

const AVATARS = ['😀', '👨‍💻', '👩', '🧑', '👦', '👧', '👨', '🧓', '🐱', '🐶']
const COLORS  = ['#22d3ee','#a78bfa','#22c55e','#fbbf24','#f87171','#ec4899','#06b6d4','#8b5cf6']

export default function UsersPage() {
  const { users, devices, addUser, updateUser, removeUser, assignDevice, unassignDevice } = useStore()
  const [showAdd, setShowAdd]       = useState(false)
  const [editId, setEditId]         = useState<string | null>(null)
  const [assignFor, setAssignFor]   = useState<string | null>(null)
  const [form, setForm] = useState({ name: '', avatar: '😀', color: '#22d3ee' })

  const unassigned = devices.filter((d) => !d.userId && d.type !== 'router')

  const saveNew = () => {
    if (!form.name.trim()) return
    addUser({ id: `u${Date.now()}`, name: form.name, avatar: form.avatar, color: form.color, devices: [] })
    setForm({ name: '', avatar: '😀', color: '#22d3ee' }); setShowAdd(false)
  }
  const saveEdit = () => {
    if (!editId || !form.name.trim()) return
    updateUser(editId, { name: form.name, avatar: form.avatar, color: form.color })
    setEditId(null); setForm({ name: '', avatar: '😀', color: '#22d3ee' })
  }
  const startEdit = (u: typeof users[0]) => {
    setEditId(u.id); setForm({ name: u.name, avatar: u.avatar, color: u.color }); setShowAdd(false)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <div className="page-title" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Users size={18} color="var(--color-cyan)" /> Utilizadores
          </div>
          <div className="page-sub">Associa dispositivos a pessoas da casa</div>
        </div>
        <button className="btn-primary" onClick={() => { setShowAdd(!showAdd); setEditId(null) }}>
          <Plus size={13} /> Novo
        </button>
      </div>

      {/* Add / Edit form */}
      {(showAdd || editId) && (
        <div className="card fade-up" style={{ padding: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
            <span style={{ fontWeight: 600, fontSize: 14 }}>{editId ? 'Editar utilizador' : 'Novo utilizador'}</span>
            <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-muted)' }}
              onClick={() => { setShowAdd(false); setEditId(null) }}><X size={14} /></button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <input className="input" placeholder="Nome…" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            <div>
              <div style={{ fontSize: 11, color: 'var(--color-muted)', marginBottom: 8 }}>Avatar</div>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {AVATARS.map((a) => (
                  <button key={a} onClick={() => setForm({ ...form, avatar: a })} style={{
                    width: 38, height: 38, borderRadius: 8, fontSize: 18, cursor: 'pointer',
                    background: form.avatar === a ? 'var(--color-cyan-dim)' : 'var(--color-elevated)',
                    border: form.avatar === a ? '1px solid rgba(34,211,238,0.4)' : '1px solid var(--color-border)',
                  }}>{a}</button>
                ))}
              </div>
            </div>
            <div>
              <div style={{ fontSize: 11, color: 'var(--color-muted)', marginBottom: 8 }}>Cor</div>
              <div style={{ display: 'flex', gap: 8 }}>
                {COLORS.map((c) => (
                  <button key={c} onClick={() => setForm({ ...form, color: c })} style={{
                    width: 28, height: 28, borderRadius: '50%', background: c, border: 'none', cursor: 'pointer',
                    outline: form.color === c ? `2px solid ${c}` : 'none',
                    outlineOffset: 2,
                  }} />
                ))}
              </div>
            </div>
            <button className="btn-primary" style={{ alignSelf: 'flex-start' }} onClick={editId ? saveEdit : saveNew}>
              {editId ? 'Guardar' : 'Criar'}
            </button>
          </div>
        </div>
      )}

      {/* Users grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px,1fr))', gap: 14 }}>
        {users.map((user) => {
          const uDevices = devices.filter((d) => user.devices.includes(d.id))
          const totalDl  = uDevices.reduce((s, d) => s + d.totalDownload, 0)
          const onlineN  = uDevices.filter((d) => d.status === 'online').length

          return (
            <div key={user.id} className="card fade-up" style={{ padding: 20 }}>
              {/* User header */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{
                    width: 44, height: 44, borderRadius: '50%', fontSize: 20,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: `${user.color}18`,
                    border: `2px solid ${user.color}40`,
                  }}>{user.avatar}</div>
                  <div>
                    <div style={{ fontWeight: 600, color: user.color }}>{user.name}</div>
                    <div style={{ fontSize: 11, color: 'var(--color-muted)', marginTop: 2 }}>
                      {uDevices.length} dispositivo{uDevices.length !== 1 ? 's' : ''} · {onlineN} online
                    </div>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 4 }}>
                  <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-muted)', padding: 4 }}
                    onClick={() => startEdit(user)} title="Editar"><Pencil size={13} /></button>
                  <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-muted)', padding: 4 }}
                    onClick={() => setAssignFor(assignFor === user.id ? null : user.id)} title="Atribuir dispositivo"><Link2 size={13} /></button>
                  <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-red)', padding: 4 }}
                    onClick={() => removeUser(user.id)} title="Remover"><Trash2 size={13} /></button>
                </div>
              </div>

              {/* Stats strip */}
              <div style={{ display: 'flex', gap: 16, marginBottom: 14, padding: '10px 12px', background: 'var(--color-elevated)', borderRadius: 8 }}>
                <div>
                  <div style={{ fontSize: 10, color: 'var(--color-muted)' }}>Download total</div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--color-green)', fontFamily: 'var(--font-mono)' }}>{formatBytes(totalDl)}</div>
                </div>
                <div>
                  <div style={{ fontSize: 10, color: 'var(--color-muted)' }}>Dispositivos</div>
                  <div style={{ fontSize: 14, fontWeight: 600, fontFamily: 'var(--font-mono)' }}>{uDevices.length}</div>
                </div>
              </div>

              {/* Device list */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {uDevices.map((d) => (
                  <div key={d.id} style={{
                    display: 'flex', alignItems: 'center', gap: 8, padding: '7px 8px',
                    borderRadius: 7, background: 'var(--color-elevated)',
                  }}>
                    <DynIcon name={getDeviceIcon(d.type)} size={13} color="var(--color-muted)" />
                    <span style={{ flex: 1, fontSize: 13, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{d.name}</span>
                    <span className={`dot-${d.status}`} />
                    <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-muted)', padding: 2 }}
                      onClick={() => unassignDevice(user.id, d.id)} title="Desatribuir"><Unlink size={11} /></button>
                  </div>
                ))}
                {uDevices.length === 0 && (
                  <div style={{ fontSize: 12, color: 'var(--color-muted)', textAlign: 'center', padding: 10 }}>Sem dispositivos</div>
                )}
              </div>

              {/* Assign panel */}
              {assignFor === user.id && unassigned.length > 0 && (
                <div style={{ marginTop: 10, paddingTop: 10, borderTop: '1px solid var(--color-border)' }}>
                  <div style={{ fontSize: 11, color: 'var(--color-muted)', marginBottom: 6 }}>Atribuir dispositivo:</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    {unassigned.map((d) => (
                      <button key={d.id} style={{
                        display: 'flex', alignItems: 'center', gap: 8, padding: '7px 8px',
                        borderRadius: 7, background: 'none', border: '1px solid var(--color-border)',
                        cursor: 'pointer', textAlign: 'left', color: 'var(--color-text)', fontSize: 13,
                      }}
                        onClick={() => { assignDevice(user.id, d.id); setAssignFor(null) }}>
                        <DynIcon name={getDeviceIcon(d.type)} size={13} color="var(--color-muted)" />
                        <span style={{ flex: 1 }}>{d.name}</span>
                        <Plus size={11} color="var(--color-cyan)" />
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Unassigned */}
      {unassigned.length > 0 && (
        <div className="card fade-up" style={{ padding: 20 }}>
          <div className="section-title">Dispositivos sem utilizador ({unassigned.length})</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {unassigned.map((d) => (
              <div key={d.id} style={{
                display: 'flex', alignItems: 'center', gap: 8, padding: '7px 12px',
                borderRadius: 8, background: 'var(--color-elevated)', border: '1px solid var(--color-border)', fontSize: 13,
              }}>
                <DynIcon name={getDeviceIcon(d.type)} size={12} color="var(--color-muted)" />
                <span>{d.name}</span>
                <span style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--color-muted)' }}>{d.ip}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
