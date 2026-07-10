import { useEffect, useState } from 'react'
import { useApp } from '../context/AppContext'
import { calcTrade, today, fmt, fmtD, HIGH_MACRO_KEYWORDS, getPMTickers } from '../lib/utils'
import TradeDetail from '../components/ui/TradeDetail'

export default function Dashboard() {
  const { user, trades, rulesData, mindset, briefs } = useApp()
  const [macroEvents, setMacroEvents] = useState([])
  const [detailTrade, setDetailTrade] = useState(null)

  const calcs = trades.map(t => ({ ...t, ...calcTrade(t) }))
  const wins = calcs.filter(t => t.total > 0)
  const losses = calcs.filter(t => t.total < 0)
  const totalPnl = calcs.reduce((s, t) => s + t.total, 0)
  const winRate = calcs.length ? wins.length / calcs.length * 100 : 0
  const avgWin = wins.length ? wins.reduce((s, t) => s + t.total, 0) / wins.length : 0
  const avgLoss = losses.length ? losses.reduce((s, t) => s + t.total, 0) / losses.length : 0
  const pf = losses.length && wins.reduce((s, t) => s + t.total, 0) > 0
    ? Math.abs(wins.reduce((s, t) => s + t.total, 0) / losses.reduce((s, t) => s + t.total, 0)) : 0
  const todayPnl = calcs.filter(t => t.date === today()).reduce((s, t) => s + t.total, 0)

  const todayAns = rulesData.answers?.[today()] || {}
  const todayScore = Object.values(todayAns).filter(v => v === 'Y').length
  const totalRules = rulesData.sections?.reduce((s, sec) => s + sec.rules.length, 0) || 0

  const bestCalc = calcs.length ? calcs.reduce((a, b) => a.total > b.total ? a : b) : null
  const worstCalc = calcs.length ? calcs.reduce((a, b) => a.total < b.total ? a : b) : null

  const hr = new Date().getHours()
  const firstName = user?.user_metadata?.full_name?.split(' ')[0] || user?.email?.split('@')[0] || ''
  const greeting = (hr < 12 ? 'Good Morning' : hr < 17 ? 'Good Afternoon' : 'Good Evening') + (firstName ? ` ${firstName}` : '') + '!'

  const macroToday = mindset[today()]?.macro || 'None'
  const todayEventsStr = macroEvents.filter(e => e.date === today()).map(e => `⚠️ ${e.title}`).join(' · ')
  const subText = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })
    + (todayEventsStr ? ' · ' + todayEventsStr : macroToday !== 'None' ? ' · ' + macroToday : ' · No high-impact events today')

  // mini chart
  const byDate = {}
  calcs.forEach(t => { byDate[t.date] = (byDate[t.date] || 0) + t.total })
  const dates = Object.keys(byDate).sort().slice(-14)
  const vals = dates.map(d => byDate[d])
  const maxV = Math.max(...vals.map(Math.abs), 1)

  // streak
  let streak = 0, sDir = ''
  for (let i = dates.length - 1; i >= 0; i--) {
    const d = vals[i] >= 0 ? 'g' : 'r'
    if (!sDir) { sDir = d; streak = 1 } else if (d === sDir) streak++; else break
  }

  // watchlist
  const pmTickers = getPMTickers(user?.id || '')
  const d = today()

  const stats = [
    { v: fmt(totalPnl), l: 'Total P&L', c: totalPnl > 0 ? 'var(--green)' : totalPnl < 0 ? 'var(--red)' : 'var(--accent2)' },
    { v: winRate.toFixed(1) + '%', l: 'Win Rate', c: 'var(--accent2)' },
    { v: calcs.length, l: 'Total Trades', c: 'var(--text)' },
    { v: wins.length, l: 'Wins', c: 'var(--green)' },
    { v: losses.length, l: 'Losses', c: 'var(--red)' },
    { v: fmt(avgWin), l: 'Avg Win', c: 'var(--green)' },
    { v: fmt(avgLoss), l: 'Avg Loss', c: 'var(--red)' },
    { v: pf.toFixed(2) + '×', l: 'Profit Factor', c: 'var(--accent2)' },
    { v: bestCalc ? fmt(bestCalc.total) : '—', l: 'Best Trade', c: 'var(--green)', click: () => bestCalc && setDetailTrade(bestCalc) },
    { v: worstCalc ? fmt(worstCalc.total) : '—', l: 'Worst Trade', c: 'var(--red)', click: () => worstCalc && setDetailTrade(worstCalc) },
    { v: totalRules ? `${todayScore}/${totalRules}` : '—', l: "Today's Rules", c: todayScore >= totalRules * 0.8 ? 'var(--green)' : todayScore >= totalRules * 0.5 ? 'var(--accent2)' : 'var(--red)' },
  ]

  useEffect(() => {
    async function fetchMacro() {
      const HIGH = HIGH_MACRO_KEYWORDS
      const sources = [
        () => fetch('https://nfs.faireconomy.media/ff_calendar_thisweek.json', { cache: 'no-store' }).then(r => r.json()),
        () => fetch('https://api.allorigins.win/get?url=' + encodeURIComponent('https://nfs.faireconomy.media/ff_calendar_thisweek.json')).then(r => r.json()).then(j => JSON.parse(j.contents)),
        () => fetch('https://corsproxy.io/?' + encodeURIComponent('https://nfs.faireconomy.media/ff_calendar_thisweek.json')).then(r => r.json()),
      ]
      for (const source of sources) {
        try {
          const data = await source()
          if (Array.isArray(data) && data.length) {
            const events = data.filter(e => {
              if (!e.date) return false
              const isUSD = (e.country || '').toUpperCase() === 'USD'
              const isHigh = (e.impact || '').toLowerCase() === 'high' || HIGH.some(k => e.title?.includes(k))
              return isUSD && isHigh
            }).map(e => ({ date: e.date.slice(0, 10), time: e.date.length > 10 ? e.date.slice(11, 16) : '', title: e.title || '' }))
            setMacroEvents(events)
            return
          }
        } catch { continue }
      }
    }
    fetchMacro()
  }, [])

  const macroByDate = {}
  macroEvents.forEach(e => { if (!macroByDate[e.date]) macroByDate[e.date] = []; macroByDate[e.date].push(e) })
  const macroWeekDates = Object.keys(macroByDate).sort()

  return (
    <div className="main">
      <div className="page-header">
        <div className="page-title">{greeting}</div>
        <div className="page-sub">{subText}</div>
      </div>

      <div className="metrics-grid">
        {stats.map((s, i) => (
          <div key={i} className={`metric-card${s.click ? ' clickable' : ''}`}
            onClick={s.click} style={s.click ? { cursor: 'pointer' } : {}}>
            <div className="metric-val" style={{ color: s.c }}>{s.v}</div>
            <div className="metric-lbl">{s.l}</div>
          </div>
        ))}
      </div>

      {/* macro week strip */}
      {macroWeekDates.length > 0 && (
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 28 }}>
          {macroWeekDates.map(d => {
            const isToday = d === today()
            return (
              <div key={d} style={{ flex: 1, minWidth: 120, background: isToday ? 'var(--accentbg)' : 'var(--bg3)', border: `0.5px solid ${isToday ? 'var(--accentborder)' : 'var(--border)'}`, borderRadius: 10, padding: '12px 14px' }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: isToday ? 'var(--accent2)' : 'var(--text3)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '.5px' }}>
                  {new Date(d + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'short', day: 'numeric' })}{isToday ? ' · Today' : ''}
                </div>
                {macroByDate[d].map((e, i) => (
                  <div key={i} style={{ fontSize: 12, color: 'var(--text2)', padding: '3px 0', borderBottom: '0.5px solid var(--border)', display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ color: 'var(--red)', fontSize: 10 }}>⚠</span>{e.title}
                  </div>
                ))}
              </div>
            )
          })}
        </div>
      )}

      {/* watchlist */}
      {pmTickers.length > 0 && (
        <div style={{ marginBottom: 28 }}>
          <div className="card-title" style={{ marginBottom: 12 }}>Today's Watchlist</div>
          <div className="watchlist-grid">
            {pmTickers.map(tk => {
              const b = briefs[today()]?.[tk]
              const bc = !b ? 'var(--text3)' : b.bias === 'bull' ? 'var(--green)' : b.bias === 'bear' ? 'var(--red)' : 'var(--accent2)'
              const bl = !b ? 'No brief' : b.bias === 'bull' ? '▲ Bullish' : b.bias === 'bear' ? '▼ Bearish' : '◆ Neutral'
              return (
                <div key={tk} className="watchlist-card">
                  <div className="watchlist-ticker">{tk}</div>
                  <div className="watchlist-bias" style={{ color: bc }}>{bl}</div>
                  {b && <div className="watchlist-levels">Call LVN {b.lvn_call || '—'}<br />Put LVN {b.lvn_put || '—'}</div>}
                </div>
              )
            })}
          </div>
        </div>
      )}

      <div className="grid-2">
        <div className="card">
          <div className="card-title">Recent Trades</div>
          {calcs.slice(0, 8).length ? calcs.slice(0, 8).map((t, i) => (
            <div key={i} className="tr" style={{ cursor: 'pointer' }} onClick={() => setDetailTrade(t)}>
              <span className="tr-date">{t.date}</span>
              <span className="tr-inst">{t.inst}</span>
              <span className={`chip ${t.dir === 'CALL' ? 'chip-call' : 'chip-put'}`}>{t.dir}</span>
              <span className="tr-sub">{t.strike ? t.strike + ' strike' : ''}</span>
              <span className={`tr-pnl ${t.total > 0 ? 'g' : t.total < 0 ? 'r' : ''}`}>{fmt(t.total)}</span>
            </div>
          )) : <div className="empty-state"><div className="empty-icon">📋</div>No trades yet</div>}
        </div>
        <div className="card">
          <div className="card-title">P&L — Last 14 Days</div>
          <div className="mini-chart">
            {vals.map((v, i) => (
              <div key={i} className={`mini-bar ${v >= 0 ? 'pos' : 'neg'}`}
                style={{ height: Math.max(4, Math.abs(v) / maxV * 48) + 'px' }} title={fmt(v)} />
            ))}
          </div>
          {streak > 0 && <div style={{ marginTop: 12, fontSize: 12, color: 'var(--text3)' }}>{streak} {sDir === 'g' ? 'green' : 'red'} day streak</div>}
          <div style={{ marginTop: 20 }}>
            <div className="stat-row"><span className="stat-l">Avg win</span><span className="stat-v g">{fmt(avgWin)}</span></div>
            <div className="stat-row"><span className="stat-l">Avg loss</span><span className="stat-v r">{fmt(avgLoss)}</span></div>
            <div className="stat-row"><span className="stat-l">Profit factor</span><span className="stat-v a">{pf.toFixed(2)}×</span></div>
          </div>
        </div>
      </div>

      <TradeDetail trade={detailTrade} open={!!detailTrade} onClose={() => setDetailTrade(null)} onEdit={() => setDetailTrade(null)} />
    </div>
  )
}
