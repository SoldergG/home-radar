import { HashRouter, Routes, Route } from 'react-router-dom'
import Layout from './components/layout/Layout'
import DashboardPage from './pages/DashboardPage'
import RadarPage from './pages/RadarPage'
import DevicesPage from './pages/DevicesPage'
import UsersPage from './pages/UsersPage'
import NetworkPage from './pages/NetworkPage'
import SpeedTestPage from './pages/SpeedTestPage'
import SecurityPage from './pages/SecurityPage'
import AlertsPage from './pages/AlertsPage'
import SettingsPage from './pages/SettingsPage'

export default function App() {
  return (
    <HashRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/radar" element={<RadarPage />} />
          <Route path="/devices" element={<DevicesPage />} />
          <Route path="/users" element={<UsersPage />} />
          <Route path="/network" element={<NetworkPage />} />
          <Route path="/speedtest" element={<SpeedTestPage />} />
          <Route path="/security" element={<SecurityPage />} />
          <Route path="/alerts" element={<AlertsPage />} />
          <Route path="/settings" element={<SettingsPage />} />
        </Route>
      </Routes>
    </HashRouter>
  )
}
