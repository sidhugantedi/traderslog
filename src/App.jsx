import { useState } from 'react'
import { useApp } from './context/AppContext'
import Auth from './components/Auth'
import Nav from './components/Nav'
import Toast from './components/ui/Toast'
import Dashboard from './pages/Dashboard'
import TradeLog from './pages/TradeLog'
import Calendar from './pages/Calendar'
import Rules from './pages/Rules'
import Premarket from './pages/Premarket'
import './styles.css'

function AppShell() {
  const { user, loading } = useApp()
  const [activeTab, setActiveTab] = useState('dashboard')

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="spinner" />
        <div className="loading-text">Loading TradersLog...</div>
      </div>
    )
  }

  if (!user) return <Auth />

  const pages = {
    dashboard: <Dashboard />,
    tradelog: <TradeLog />,
    calendar: <Calendar />,
    rules: <Rules />,
    premarket: <Premarket />,
  }

  return (
    <div>
      <Nav activeTab={activeTab} setActiveTab={setActiveTab} />
      {pages[activeTab] || <Dashboard />}
      <Toast />
    </div>
  )
}

export default function App() {
  return <AppShell />
}
