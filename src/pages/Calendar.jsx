import { useState } from 'react'
import { useApp } from '../context/AppContext'
import { calcTrade, fmt, fmtD } from '../lib/utils'
import Modal from '../components/ui/Modal'
import TradeForm from '../components/ui/TradeForm'

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December']

export default function Calendar() {
  const { trades, deleteTrade } = useApp()
  const now = new Date()
  const [year, setYear] = useState(now.getFullYear())
  const [month, setMonth] = useState(now.getMonth())
  const [dayDate, setDayDate] = useState('')
  const [dayOpen, setDayOpen] = useState(false)
  const [formOpen, setFormOpen] = useState(false)
  const [editTrade, setEditTrade] = useState(null)

  function prev() { if (month === 0) { setMonth(11); setYear(y => y - 1) } else setMonth(m => m - 1) }
  function next() { if (month === 11) { setMonth(0); setYear(y => y + 1) } else setMonth(m => m + 1) }

  // build byDate
  const byDate = {}
  trades.forEach(t => {
    let dk = t.date || ''
    if (dk && !/^\d{4}-\d{2}-\d{2}$/.test(dk)) { const p = new Date(dk); if (!isNaN(p)) dk = p.toISOString().slice(0, 10) }
    if (!dk) return
    const { total } = calcTrade(t)
    if (!byDate[dk]) byDate[dk] = { pnl: 0, cost: 0, count: 0, wins: 0, losses: 0 }
    byDate[dk].pnl += total; byDate[dk].count += 1
    if (total > 0) byDate[dk].wins += 1; else if (total < 0) byDate[dk].losses += 1
    const tq = (parseFloat(t.t1_qty)||0)+(parseFloat(t.t2_qty)||0)+(parseFloat(t.tf_qty)||0)
    byDate[dk].cost += parseFloat(t.entry_price) * tq * 100
  })

  const first = new Date(year, month, 1)
  const lastDay = new Date(year, month + 1, 0).getDate()
  let startDow = first.getDay(); startDow = startDow === 0 ? 6 : startDow - 1

  const cells = []
  for (let i = 0; i < startDow; i++) cells.push(<div key={`e${i}`} className="cal-cell empty" />)
  for (let d = 1; d <= lastDay; d++) {
    const ds = `${year}-${String(month+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`
    const day = byDate[ds]
    if (day) {
      const pct = day.cost ? day.pnl / day.cost * 100 : 0
      const isGreen = day.pnl >= 0
      cells.push(
        <div key={ds} className={`cal-cell has-trades ${isGreen ? 'green' : 'red'}`}
          onClick={() => { setDayDate(ds); setDayOpen(true) }}>
          <div className="cal-day">{d}</div>
          <div className="cal-pct">{(pct >= 0 ? '+' : '') + Math.abs(pct).toFixed(1)}%</div>
          <div className="cal-pnl">{(isGreen ? '+' : '') + '$' + Math.abs(day.pnl).toFixed(2)}</div>
          <div className="cal-count">{day.count}T · {day.wins}W/{day.losses}L</div>
        </div>
      )
    } else {
      cells.push(<div key={ds} className="cal-cell"><div className="cal-day" style={{ color: 'var(--text3)' }}>{d}</div></div>)
    }
  }

  // monthly summary
  const mDates = Object.keys(byDate).filter(dk => { const td = new Date(dk + 'T12:00:00'); return td.getFullYear() === year && td.getMonth() === month })
  const gDays = mDates.filter(dk => byDate[dk].pnl > 0).length
  const rDays = mDates.filter(dk => byDate[dk].pnl < 0).length
  const mCount = mDates.reduce((s, dk) => s + byDate[dk].count, 0)
  const mWins = mDates.reduce((s, dk) => s + byDate[dk].wins, 0)
  const mPnl = mDates.reduce((s, dk) => s + byDate[dk].pnl, 0)

  const pc = c => c > 0 ? 'pnl-pos' : c < 0 ? 'pnl-neg' : 'pnl-neu'
  const yn = v => v === 'Yes' ? <span style={{color:'var(--green)',fontSize:12}}>Yes</span> : v === 'No' ? <span style={{color:'var(--red)',fontSize:12}}>No</span> : v ? <span style={{color:'var(--accent2)',fontSize:12}}>{v}</span> : '—'

  // live list of trades for the selected day (stays fresh after edits/deletes)
  const dayTrades = dayDate ? trades.filter(t => t.date === dayDate) : []
  const dayTotal = dayTrades.reduce((s, t) => s + calcTrade(t).total, 0)

  return (
    <div className="main">
      <div className="flex-between mb-lg">
        <div className="page-header" style={{ marginBottom: 0 }}>
          <div className="page-title">{MONTHS[month]} {year}</div>
          <div className="page-sub">{gDays} green · {rDays} red · {mCount} trades</div>
        </div>
        <div className="flex-gap">
          <button className="btn btn-ghost" onClick={prev}>← Prev</button>
          <button className="btn btn-ghost" onClick={next}>Next →</button>
        </div>
      </div>

      <div className="card">
        <div className="cal-grid">
          {[ 'MON','TUE','WED','THU','FRI','SAT', 'SUN'].map(d => <div key={d} className="cal-dow">{d}</div>)}
        </div>
        <div className="cal-grid" style={{ marginTop: 5 }}>{cells}</div>
      </div>

      <div className="cal-summary">
        {[
          { v: fmt(mPnl), l: 'Monthly P&L', c: mPnl > 0 ? 'var(--green)' : mPnl < 0 ? 'var(--red)' : 'var(--accent2)' },
          { v: mCount, l: 'Total Trades', c: 'var(--text)' },
          { v: mCount ? (mWins / mCount * 100).toFixed(1) + '%' : '—', l: 'Win Rate', c: 'var(--accent2)' },
          { v: `${gDays} green · ${rDays} red`, l: 'Green / Red Days', c: 'var(--text2)' },
        ].map((s, i) => (
          <div key={i} className="metric-card">
            <div className="metric-val" style={{ color: s.c, fontSize: 20 }}>{s.v}</div>
            <div className="metric-lbl">{s.l}</div>
          </div>
        ))}
      </div>

      <Modal open={dayOpen} onClose={() => setDayOpen(false)} title={dayDate ? `Trades — ${dayDate}` : 'Trades'} maxWidth={1200}>
        {dayTrades.length ? (
          <>
            <div className="table-wrap">
              <table>
                <thead><tr><th>#</th><th>Inst</th><th>Dir</th><th>Entry</th><th>T1 P&L</th><th>T2 P&L</th><th>Final P&L</th><th>Total P&L</th><th>Return %</th><th>Level</th><th>B&R</th><th>EMA</th><th>Rules</th><th>Outcome</th><th>Actions</th></tr></thead>
                <tbody>
                  {dayTrades.map((t, i) => {
                    const { p1, p2, p3, total, pct } = calcTrade(t)
                    return (
                      <tr key={t.id}>
                        <td style={{ color: 'var(--text3)' }}>{i+1}</td>
                        <td><span className="inst-tag">{t.inst}</span></td>
                        <td><span className={`chip ${t.dir === 'CALL' ? 'chip-call' : 'chip-put'}`}>{t.dir}</span></td>
                        <td className="pnl-neu">{t.entry_price}</td>
                        <td className={pc(p1)}>{t.t1_qty ? fmt(p1) : '—'}</td>
                        <td className={pc(p2)}>{t.t2_qty ? fmt(p2) : '—'}</td>
                        <td className={pc(p3)}>{t.tf_qty ? fmt(p3) : '—'}</td>
                        <td className={pc(total)} style={{ fontWeight: 600 }}>{fmt(total)}</td>
                        <td className={pc(pct)}>{fmtD(pct)}</td>
                        <td style={{ color: 'var(--text2)', maxWidth: 100, overflow: 'hidden', textOverflow: 'ellipsis' }}>{t.level || '—'}</td>
                        <td>{yn(t.bnr)}</td><td>{yn(t.ema)}</td>
                        <td style={{ color: 'var(--text2)' }}>{t.rules_followed || '—'}</td>
                        <td><span className={`chip ${total > 0 ? 'chip-win' : total < 0 ? 'chip-loss' : 'chip-be'}`}>{total > 0 ? 'Win' : total < 0 ? 'Loss' : 'BE'}</span></td>
                        <td>
                          <div className="flex-gap">
                            <button className="btn btn-ghost btn-sm" onClick={() => { setEditTrade(t); setFormOpen(true) }}>Edit</button>
                            <button className="btn btn-danger btn-sm" onClick={() => confirm('Delete?') && deleteTrade(t.id)}>Del</button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', marginTop: 16, fontSize: 14, color: 'var(--text2)' }}>
              Day Total: <span className={pc(dayTotal)} style={{ marginLeft: 10, fontSize: 16 }}>{fmt(dayTotal)}</span>
            </div>
          </>
        ) : <div className="empty-state">No trades this day</div>}
      </Modal>

      <TradeForm open={formOpen} onClose={() => setFormOpen(false)} editTrade={editTrade} />
    </div>
  )
}
