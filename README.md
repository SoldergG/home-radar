# HomeRadar

Dashboard de rede domestica com radar de dispositivos inspirado no RuView. Monitoriza dispositivos, utilizadores, velocidade e seguranca da tua rede — tudo num visual cyberpunk.

## Features

- **Radar de Rede** — Visualizacao em tempo real dos dispositivos com sweep animado (estilo RuView)
- **Gestao de Dispositivos** — Lista, filtra e inspeciona todos os dispositivos na rede
- **Utilizadores** — Associa dispositivos a pessoas da casa com avatares e cores
- **Speed Test** — Testa a velocidade da internet com historico
- **Monitorizacao de Rede** — Consumo de banda, latencia, consultas DNS
- **Seguranca** — Score de seguranca com verificacao de portas, encriptacao, firmware
- **Alertas** — Notificacoes para novos dispositivos, disconnexoes, latencia alta
- **Definicoes** — Configuracao do agente local e acesso Tailscale

## Stack

- React + TypeScript + Vite
- Tailwind CSS v4
- Recharts (graficos)
- Zustand (estado)
- Canvas API (radar)
- Python (agente local)

## Quickstart

```bash
npm install
npm run dev
```

## Agente Local (scan de rede)

O agente corre no teu MacBook e descobre dispositivos na rede:

```bash
python agent/scanner.py
# ou para acesso Tailscale:
python agent/scanner.py --host 0.0.0.0 --port 7890
```

## Acesso via Tailscale

1. Instalar Tailscale: `brew install tailscale`
2. Correr o dev server com `--host 0.0.0.0`
3. Aceder via IP Tailscale: `http://100.x.x.x:5173/home-radar/`

## Deploy (GitHub Pages)

```bash
npm run build
# O output fica em dist/ — deploy para GitHub Pages
```
