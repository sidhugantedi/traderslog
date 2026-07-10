import { useState, useEffect, useRef } from 'react'
import { useApp } from '../../context/AppContext'
import { calcPnl, today, uid, getTickers, addTickerToList, removeTickerFromList } from '../../lib/utils'
import Modal from './Modal'

const fmt = n => (n >= 0 ? '+' : '') + '$' + Math.abs(n).toFixed(2)
const fmtD = n => (n >= 0 ? '+' : '') + Math.abs(n).toFixed(2) + '%'

const empty = {
  date: today(), inst: '', dir: 'CALL', strike: '',
  entry_time: '', entry_price: '', level: '',
  t1_time: '', t1_price: '', t1_qty: '',
  t2_time: '', t2_price: '', t2_qty: '',
  tf_time: '', tf_price: '', tf_qty: '',
  bnr: '', ema: '', rules_followed: '', notes: ''
}

export default function TradeForm({ open, onClose, editTrade = null }) {
  const { saveTrade } = useApp()
  const [form, setForm] = useState(empty)
  const [calc, setCalc] = useState({ total: 0, pct: 0, p1: 0, p2: 0, p3: 0 })
  const [dropOpen, setDropOpen] = useState(false)
  const [tickers, setTickers] = useState(getTickers())
  const comboRef = useRef(null)

  useEffect(() => {
    if (editTrade) setForm({ ...empty, ...editTrade })
    else setForm({ ...empty, date: today() })
  }, [editTrade, open])

  useEffect(() => {
    const ep = parseFloat(form.entry_price) || 0
    const p1 = calcPnl(ep, form.t1_price, form.t1_qty)
    const p2 = calcPnl(ep, form.t2_price, form.t2_qty)
    const p3 = calcPnl(ep, form.tf_price, form.tf_qty)
    const total = p1 + p2 + p3
    const tq = (parseFloat(form.t1_qty) || 0) + (parseFloat(form.t2_qty) || 0) + (parseFloat(form.tf_qty) || 0)
    const cost = ep * tq * 100
    setCalc({ p1, p2, p3, total, pct: cost ? (total / cost) * 100 : 0 })
  }, [form.entry_price, form.t1_price, form.t1_qty, form.t2_price, form.t2_qty, form.tf_price, form.tf_qty])

  // close dropdown on outside click
  useEffect(() => {
    function handler(e) { if (comboRef.current && !comboRef.current.contains(e.target)) setDropOpen(false) }
    document.addEventListener('click', handler)
    return () => document.removeEventListener('click', handler)
  }, [])

  const f = (key, val) => setForm(p => ({ ...p, [key]: val }))
  const pnlColor = v => v > 0 ? 'var(--green)' : v < 0 ? 'var(--red)' : 'var(--accent2)'

  async function handleSave() {
    const ep = parseFloat(form.entry_price)
    if (!ep) { alert('Entry price required'); return }
    const instVal = form.inst.trim().toUpperCase()
    if (instVal) addTickerToList(instVal)
    const trade = {
      id: editTrade?.id || uid(),
      _isEdit: !!editTrade,
      ...form,
      inst: instVal,
      entry_price: ep,
      t1_price: parseFloat(form.t1_price) || 0, t1_qty: parseFloat(form.t1_qty) || 0,
      t2_price: parseFloat(form.t2_price) || 0, t2_qty: parseFloat(form.t2_qty) || 0,
      tf_price: parseFloat(form.tf_price) || 0, tf_qty: parseFloat(form.tf_qty) || 0,
    }
    const ok = await saveTrade(trade)
    if (ok) onClose()
  }

  function selectTicker(sym) { f('inst', sym); setDropOpen(false) }
  function delTicker(sym) { removeTickerFromList(sym); setTickers(getTickers()) }
  function addNewTicker(val) {
    const sym = val.trim().toUpperCase()
    if (!sym) return
    addTickerToList(sym); setTickers(getTickers()); f('inst', sym); setDropOpen(false)
  }

  const filteredTickers = form.inst
    ? tickers.filter(t => t.startsWith(form.inst.toUpperCase()))
    : tickers

  return (
    <Modal open={open} onClose={onClose} title={editTrade ? 'Edit Trade' : 'New Trade'}>
      <div className="section-label">Setup</div>
      <div className="form-row-4" style={{ marginBottom: 14 }}>
        <div className="form-group" style={{ marginBottom: 0 }}>
          <label className="form-label">Date</label>
          <input type="date" className="form-input" value={form.date} onChange={e => f('date', e.target.value)} />
        </div>
        <div className="form-group" style={{ marginBottom: 0 }}>
          <label className="form-label">Instrument</label>
          <div className="ticker-combo" ref={comboRef}>
            <input className="form-input" placeholder="SPY" value={form.inst}
              onChange={e => { f('inst', e.target.value); setDropOpen(true) }}
              onFocus={() => { setTickers(getTickers()); setDropOpen(true) }}
              autoComplete="off" />
            <div className={`ticker-dropdown${dropOpen ? ' open' : ''}`}>
              <div className="ticker-options-list">
                {filteredTickers.map(t => (
                  <div key={t} className="ticker-option" onClick={() => selectTicker(t)}>
                    <span>{t}</span>
                    <button className="ticker-del-btn" onClick={e => { e.stopPropagation(); delTicker(t) }}>✕</button>
                  </div>
                ))}
              </div>
              <div className="ticker-add-row">
                <input className="ticker-add-input" placeholder="Add ticker..." maxLength={10}
                  onKeyDown={e => { if (e.key === 'Enter') { addNewTicker(e.target.value); e.target.value = '' } }} />
                <button className="ticker-add-btn" onClick={e => {
                  const inp = e.target.previousSibling
                  addNewTicker(inp.value); inp.value = ''
                }}>+ Add</button>
              </div>
            </div>
          </div>
        </div>
        <div className="form-group" style={{ marginBottom: 0 }}>
          <label className="form-label">Direction</label>
          <select className="form-select" value={form.dir} onChange={e => f('dir', e.target.value)}>
            <option>CALL</option><option>PUT</option>
          </select>
        </div>
        <div className="form-group" style={{ marginBottom: 0 }}>
          <label className="form-label">Strike</label>
          <input className="form-input" placeholder="e.g. 572" value={form.strike} onChange={e => f('strike', e.target.value)} />
        </div>
      </div>

      <div className="section-label">Entry</div>
      <div className="form-row-3" style={{ marginBottom: 14 }}>
        <div className="form-group" style={{ marginBottom: 0 }}><label className="form-label">Time</label><input type="time" className="form-input" value={form.entry_time} onChange={e => f('entry_time', e.target.value)} /></div>
        <div className="form-group" style={{ marginBottom: 0 }}><label className="form-label">Entry Price</label><input type="number" step="0.01" className="form-input" placeholder="0.00" value={form.entry_price} onChange={e => f('entry_price', e.target.value)} /></div>
        <div className="form-group" style={{ marginBottom: 0 }}><label className="form-label">Level Used</label><input className="form-input" placeholder="e.g. LVN 572.50" value={form.level} onChange={e => f('level', e.target.value)} /></div>
      </div>

      {[['Trim 1', 'var(--accent2)', 't1'], ['Trim 2', 'rgba(196,181,253,.7)', 't2'], ['Final Exit', 'var(--accent2)', 'tf']].map(([label, color, prefix]) => (
        <div key={prefix}>
          <div className="section-label" style={{ color }}>{label}</div>
          <div className="form-row-4" style={{ marginBottom: 14 }}>
            <div className="form-group" style={{ marginBottom: 0 }}><label className="form-label">Time</label><input type="time" className="form-input" value={form[`${prefix}_time`]} onChange={e => f(`${prefix}_time`, e.target.value)} /></div>
            <div className="form-group" style={{ marginBottom: 0 }}><label className="form-label">Exit Price</label><input type="number" step="0.01" className="form-input" value={form[`${prefix}_price`]} onChange={e => f(`${prefix}_price`, e.target.value)} /></div>
            <div className="form-group" style={{ marginBottom: 0 }}><label className="form-label">Qty</label><input type="number" className="form-input" value={form[`${prefix}_qty`]} onChange={e => f(`${prefix}_qty`, e.target.value)} /></div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">P&L</label>
              <input className="form-input" readOnly style={{ color: 'var(--text3)' }}
                value={form[`${prefix}_price`] && form[`${prefix}_qty`] ? fmt(calc[prefix === 'tf' ? 'p3' : prefix === 't2' ? 'p2' : 'p1']) : ''} />
            </div>
          </div>
        </div>
      ))}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, background: 'var(--bg3)', border: '0.5px solid var(--border2)', borderRadius: 10, padding: 16, marginBottom: 14 }}>
        <div style={{ textAlign: 'center' }}>
          <div className="form-label" style={{ marginBottom: 6 }}>Total P&L</div>
          <div style={{ fontSize: 22, fontWeight: 700, color: pnlColor(calc.total), fontVariantNumeric: 'tabular-nums' }}>{fmt(calc.total)}</div>
        </div>
        <div style={{ textAlign: 'center' }}>
          <div className="form-label" style={{ marginBottom: 6 }}>Return %</div>
          <div style={{ fontSize: 22, fontWeight: 700, color: pnlColor(calc.pct), fontVariantNumeric: 'tabular-nums' }}>{fmtD(calc.pct)}</div>
        </div>
      </div>

      <div className="section-label">Checklist</div>
      <div className="form-row-3" style={{ marginBottom: 14 }}>
        {[['Break & Retest?', 'bnr'], ['EMA Aligned?', 'ema'], ['Rules Followed?', 'rules_followed']].map(([label, key]) => (
          <div key={key} className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">{label}</label>
            <select className="form-select" value={form[key]} onChange={e => f(key, e.target.value)}>
              <option value="">—</option>
              {key === 'rules_followed' ? ['All', 'Most', 'Some', 'None'].map(v => <option key={v}>{v}</option>) : ['Yes', 'No', 'Partial'].map(v => <option key={v}>{v}</option>)}
            </select>
          </div>
        ))}
      </div>
      <div className="form-group">
        <label className="form-label">Notes / Lesson</label>
        <textarea className="form-textarea" placeholder="What happened? What did you learn?" value={form.notes} onChange={e => f('notes', e.target.value)} />
      </div>
      <div className="flex-gap" style={{ justifyContent: 'flex-end', marginTop: 8 }}>
        <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
        <button className="btn btn-accent" onClick={handleSave}>Save Trade</button>
      </div>
    </Modal>
  )
}
