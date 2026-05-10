import { useState, useEffect } from 'react'
import {
  Settings, Save, RefreshCw, CheckCircle2, XCircle,
  Eye, EyeOff, Router, Server, Key, Wifi, Trash2,
} from 'lucide-react'
import { useStore } from '../hooks/useStore'
import { useAgent } from '../hooks/useAgent'

function Section({ title, icon: Icon, children }: {
  title: string; icon: typeof Settings; children: React.ReactNode
}) {
  return (
    <div className="card fade-up" style={{ padding: 24 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20, paddingBottom: 14, borderBottom: '1px solid var(--color-border)' }}>
        <div style={{ width: 32, height: 32, borderRadius: 8, background: 'var(--color-cyan-dim)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Icon size={15} color="var(--color-cyan)" />
        </div>
        <span style={{ fontWeight: 600, fontSize: 14 }}>{title}</span>
      </div>
      {children}
    </div>
  )
}

function Field({ label, help, children }: { label: string; help?: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: 'var(--color-text)', marginBottom: 6 }}>{label}</label>
      {children}
      {help && <p style={{ fontSize: 11, color: 'var(--color-muted)', marginTop: 5, lineHeight: 1.5 }}>{help}</p>}
    </div>
  )
}

function PasswordInput({ value, onChange, placeholder }: {
  value: string; onChange: (v: string) => void; placeholder?: string
}) {
  const [show, setShow] = useState(false)
  return (
    <div style={{ position: 'relative' }}>
      <input
        type={show ? 'text' : 'password'}
        className="input input-mono"
        style={{ paddingRight: 40 }}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder ?? '••••••••'}
      />
      <button
        type="button"
        onClick={() => setShow((s) => !s)}
        style={{
          position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)',
          background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-muted)',
          display: 'flex', alignItems: 'center',
        }}
      >
        {show ? <EyeOff size={14} /> : <Eye size={14} />}
      </button>
    </div>
  )
}

export default function SettingsPage() {
  const { settings, updateSettings } = useStore()
  const { status, sync, pushConfig } = useAgent()

  // Local form state — save only on click
  const [form, setForm] = useState({ ...settings })
  const [saved, setSaved] = useState(false)
  const [testResult, setTestResult] = useState<'idle' | 'ok' | 'fail'>('idle')

  // Keep form in sync if settings change externally
  useEffect(() => { setForm({ ...settings }) }, [settings])

  const save = async () => {
    updateSettings(form)
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
    // Push new config to agent immediately
    try {
      await fetch(`${form.agentUrl}/config`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ deco_password: form.decoPassword, gateway: form.gatewayIp }),
        signal: AbortSignal.timeout(3000),
      })
      await sync()
    } catch { /* agent offline */ }
  }

  const testAgent = async () => {
    setTestResult('idle')
    try {
      const r = await fetch(`${form.agentUrl}/health`, { signal: AbortSignal.timeout(4000) })
      setTestResult(r.ok ? 'ok' : 'fail')
    } catch {
      setTestResult('fail')
    }
    setTimeout(() => setTestResult('idle'), 4000)
  }

  const f = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm((s) => ({ ...s, [key]: e.target.type === 'checkbox' ? (e.target as HTMLInputElement).checked : e.target.value }))

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20, maxWidth: 680 }}>
      <div>
        <div className="page-title" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Settings size={18} color="var(--color-cyan)" /> Definições
        </div>
        <div className="page-sub">Configuração do HomeRadar e credenciais</div>
      </div>

      {/* TP-Link Deco */}
      <Section title="TP-Link Deco" icon={Router}>
        <Field
          label="Password da app Deco"
          help="A mesma password que usas na app TP-Link Deco no telemóvel. Necessária para ver os nomes reais dos dispositivos."
        >
          <PasswordInput
            value={form.decoPassword}
            onChange={(v) => setForm((s) => ({ ...s, decoPassword: v }))}
            placeholder="Password do Deco…"
          />
        </Field>
        <Field
          label="IP do Gateway (Deco principal)"
          help="Normalmente 192.168.68.1 para o TP-Link Deco com NOS."
        >
          <input className="input input-mono" value={form.gatewayIp}
            onChange={f('gatewayIp')} placeholder="192.168.68.1" />
        </Field>
      </Section>

      {/* Chave extra */}
      <Section title="Credencial Adicional" icon={Key}>
        <Field label="Nome da credencial">
          <input className="input" value={form.extraKeyLabel}
            onChange={f('extraKeyLabel')} placeholder="Ex: Router NOS, Tailscale, VPN…" />
        </Field>
        <Field
          label="Valor / Chave"
          help="Guardado localmente no browser, nunca enviado para qualquer servidor externo."
        >
          <PasswordInput
            value={form.extraKeyValue}
            onChange={(v) => setForm((s) => ({ ...s, extraKeyValue: v }))}
            placeholder="Chave ou password…"
          />
        </Field>
      </Section>

      {/* Agente local */}
      <Section title="Agente Local" icon={Server}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16, padding: '10px 14px', borderRadius: 8, background: 'var(--color-elevated)', border: '1px solid var(--color-border)' }}>
          <div style={{
            width: 8, height: 8, borderRadius: '50%', flexShrink: 0,
            background: status === 'online' ? 'var(--color-green)' : status === 'connecting' ? 'var(--color-amber)' : 'var(--color-red)',
          }} />
          <span style={{ flex: 1, fontSize: 13 }}>
            Agente: <strong>{status === 'online' ? 'online' : status === 'connecting' ? 'a ligar…' : 'offline'}</strong>
          </span>
          <button className="btn-ghost" style={{ padding: '4px 10px', fontSize: 11 }} onClick={sync}>
            <RefreshCw size={11} /> Scan agora
          </button>
        </div>

        <Field
          label="URL do Agente"
          help="Endereço onde corre o scanner.py. Para acesso Tailscale usa o IP da Tailnet."
        >
          <input className="input input-mono" value={form.agentUrl}
            onChange={f('agentUrl')} placeholder="http://localhost:7890" />
        </Field>
        <Field label="Intervalo de scan (segundos)">
          <input className="input input-mono" type="number" min={10} max={300}
            value={form.scanInterval} onChange={f('scanInterval')} style={{ width: 120 }} />
        </Field>

        <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
          <button className="btn-ghost" style={{ fontSize: 12 }} onClick={testAgent}>
            {testResult === 'idle' ? <Wifi size={13} /> : testResult === 'ok' ? <CheckCircle2 size={13} color="var(--color-green)" /> : <XCircle size={13} color="var(--color-red)" />}
            {testResult === 'idle' ? 'Testar ligação' : testResult === 'ok' ? 'Agente acessível' : 'Sem resposta'}
          </button>
        </div>

        <div style={{ marginTop: 16, padding: 14, background: 'var(--color-elevated)', borderRadius: 8, fontSize: 12 }}>
          <div style={{ color: 'var(--color-muted)', marginBottom: 8 }}>Iniciar o agente:</div>
          <code style={{ display: 'block', fontFamily: 'var(--font-mono)', color: 'var(--color-cyan)', marginBottom: 6 }}>
            python3 agent/scanner.py --deco-password SENHA
          </code>
          <div style={{ color: 'var(--color-muted)', marginBottom: 8, marginTop: 12 }}>Para acesso Tailscale:</div>
          <code style={{ display: 'block', fontFamily: 'var(--font-mono)', color: 'var(--color-cyan)' }}>
            python3 agent/scanner.py --host 0.0.0.0 --deco-password SENHA
          </code>
        </div>
      </Section>

      {/* Dados */}
      <Section title="Dados" icon={Trash2}>
        <Field label="Modo demo" help="Mostra dispositivos de exemplo quando o agente está offline.">
          <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
            <div
              style={{
                width: 38, height: 22, borderRadius: 11, transition: 'background 150ms', cursor: 'pointer',
                background: form.demoMode ? 'var(--color-cyan)' : 'var(--color-elevated)',
                border: '1px solid var(--color-border-hi)', position: 'relative',
              }}
              onClick={() => setForm((s) => ({ ...s, demoMode: !s.demoMode }))}
            >
              <div style={{
                position: 'absolute', top: 3, width: 14, height: 14, borderRadius: '50%', background: '#fff',
                transition: 'left 150ms', left: form.demoMode ? 21 : 3,
              }} />
            </div>
            <span style={{ fontSize: 13 }}>Activar modo demo</span>
          </label>
        </Field>
        <button
          className="btn-danger"
          style={{ fontSize: 12 }}
          onClick={() => {
            if (confirm('Limpar todos os dados guardados e recomeçar?')) {
              localStorage.removeItem('home-radar-v2')
              window.location.reload()
            }
          }}
        >
          <Trash2 size={12} /> Limpar todos os dados
        </button>
      </Section>

      {/* Save bar */}
      <div style={{
        position: 'sticky', bottom: 20, display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 10,
        padding: '12px 16px', borderRadius: 10,
        background: 'var(--color-surface)', border: '1px solid var(--color-border)',
      }}>
        {saved && (
          <span style={{ fontSize: 12, color: 'var(--color-green)', display: 'flex', alignItems: 'center', gap: 5 }}>
            <CheckCircle2 size={13} /> Guardado
          </span>
        )}
        <button className="btn-primary" onClick={save}>
          <Save size={13} /> Guardar definições
        </button>
      </div>
    </div>
  )
}
