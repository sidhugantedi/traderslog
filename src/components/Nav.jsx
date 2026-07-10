import { useEffect, useState } from 'react'
import { sb } from '../lib/supabase'
import { useApp } from '../context/AppContext'
import { calcTrade, today } from '../lib/utils'
import { LogoFull } from './Logo'

export default function Nav({ activeTab, setActiveTab }) {
  const { user, trades, rulesData } = useApp()
  const [theme, setThemeState] = useState(localStorage.getItem('ej_theme') || 'auto')
  const [isDark, setIsDark] = useState(document.documentElement.getAttribute('data-theme') === 'dark')

  const calcs = trades.map(t => ({ ...t, ...calcTrade(t) }))
  const totalPnl = calcs.reduce((s, t) => s + t.total, 0)
  const winRate = calcs.length ? (calcs.filter(t => t.total > 0).length / calcs.length * 100) : 0
  const todayPnl = calcs.filter(t => t.date === today()).reduce((s, t) => s + t.total, 0)
  const todayAns = rulesData.answers?.[today()] || {}
  const todayScore = Object.values(todayAns).filter(v => v === 'Y').length
  const totalRules = rulesData.sections?.reduce((s, sec) => s + sec.rules.length, 0) || 0

  const fmt = n => (n >= 0 ? '+' : '') + '$' + Math.abs(n).toFixed(2)
  const pnlClass = v => v > 0 ? 'pos' : v < 0 ? 'neg' : 'neu'

  function applyTheme(mode) {
    const h = new Date().getHours()
    const dark = mode === 'dark' || (mode === 'auto' && (h < 6 || h >= 18))
    document.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light')
    setIsDark(dark)
  }

  function setTheme(mode) {
    localStorage.setItem('ej_theme', mode)
    setThemeState(mode)
    applyTheme(mode)
  }

  useEffect(() => {
    const interval = setInterval(() => {
      if ((localStorage.getItem('ej_theme') || 'auto') === 'auto') applyTheme('auto')
    }, 60000)
    return () => clearInterval(interval)
  }, [])

  const tabs = ['dashboard', 'tradelog', 'calendar', 'rules', 'premarket']
  const tabLabels = ['Dashboard', 'Trade Log', 'Calendar', 'Rules', 'Premarket']

  return (
    <nav className="nav">
      <div className="nav-logo" onClick={() => setActiveTab('dashboard')}>
        <LogoFull markSize={26} fontSize={16} dark={isDark} />
      </div>
      <div className="nav-tabs">
        {tabs.map((tab, i) => (
          <button key={tab} className={`nav-btn${activeTab === tab ? ' active' : ''}`} onClick={() => setActiveTab(tab)}>
            {tabLabels[i]}
          </button>
        ))}
      </div>
      <div className="nav-right">
        <div className="hstat">
          <div className={`hstat-val ${pnlClass(totalPnl)}`}>{fmt(totalPnl)}</div>
          <div className="hstat-lbl">Total P&L</div>
        </div>
        <div className="hstat">
          <div className="hstat-val neu">{winRate.toFixed(1)}%</div>
          <div className="hstat-lbl">Win Rate</div>
        </div>
        <div className="hstat">
          <div className={`hstat-val ${pnlClass(todayPnl)}`}>{fmt(todayPnl)}</div>
          <div className="hstat-lbl">Today</div>
        </div>
        <div className="hstat">
          <div className={`hstat-val ${todayScore >= totalRules * 0.8 ? 'pos' : todayScore >= totalRules * 0.5 ? 'neu' : 'neg'}`}>
            {totalRules ? `${todayScore}/${totalRules}` : '—'}
          </div>
          <div className="hstat-lbl">Rules</div>
        </div>
        <div className="theme-toggle">
          <button className={`theme-btn${theme === 'auto' ? ' active' : ''}`} onClick={() => setTheme('auto')}>Auto</button>
          <button className={`theme-btn${theme === 'dark' ? ' active' : ''}`} onClick={() => setTheme('dark')}>🌙</button>
          <button className={`theme-btn${theme === 'light' ? ' active' : ''}`} onClick={() => setTheme('light')}>☀️</button>
        </div>
        <button className="user-btn" onClick={() => sb.auth.signOut()}>
          <span>{user?.email?.split('@')[0]}</span>
          <span style={{ opacity: .5 }}>Sign out</span>
        </button>
      </div>
    </nav>
  )
}
