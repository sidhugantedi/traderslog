import { useState, useEffect, useRef } from 'react'
import { useApp } from '../context/AppContext'
import { today, uid, getPMTickers, setPMTickers, getMindsetParams, saveMindsetParams } from '../lib/utils'

export default function Premarket() {
  const { user, briefs, saveBrief, mindset, saveMindsetEntry } = useApp()
  const [date, setDate] = useState(today())
  const [pmTickers, setPMTickersState] = useState([])
  const [newTicker, setNewTicker] = useState('')
  const [expandedTickers, setExpandedTickers] = useState(new Set())
  const [tickerData, setTickerData] = useState({})
  const [mindsetForm, setMindsetForm] = useState({ calm: '', sleep: '', macro: 'None', notes: '' })
  const [customParams, setCustomParams] = useState(getMindsetParams())
  const [customValues, setCustomValues] = useState({})
  const [newParam, setNewParam] = useState('')

  useEffect(() => {
    const tickers = getPMTickers(user?.id || '')
    setPMTickersState(tickers)
  }, [user])

  useEffect(() => {
    const m = mindset[date]
    if (m) {
      setMindsetForm({ calm: m.calm || '', sleep: m.sleep || '', macro: m.macro || 'None', notes: m.notes || '' })
      if (m.custom) setCustomValues(m.custom)
    }
  }, [date, mindset])

  useEffect(() => {
    const data = {}
    pmTickers.forEach(tk => {
      const b = briefs[date]?.[tk]
      data[tk] = b ? { ...b } : { bias: '', lvn_call: '', lvn_put: '', poc: '', hvn1: '', hvn2: '', pdc: '', pdh: '', pdl: '', call_entry: '', call_stop: '', put_entry: '', put_stop: '', poc_pos: '', ema5: '', ema3: '', ema1: '', confluence: '' }
    })
    setTickerData(data)
  }, [date, pmTickers, briefs])

  function addTicker() {
    const sym = newTicker.trim().toUpperCase()
    if (!sym) return
    const list = [...pmTickers]
    if (!list.includes(sym)) list.push(sym)
    setPMTickers(user?.id || '', list)
    setPMTickersState(list)
    setNewTicker('')
  }

  function removeTicker(sym) {
    const list = pmTickers.filter(t => t !== sym)
    setPMTickers(user?.id || '', list)
    setPMTickersState(list)
    setExpandedTickers(prev => { const n = new Set(prev); n.delete(sym); return n })
  }

  function toggleExpand(sym) {
    setExpandedTickers(prev => {
      const n = new Set(prev)
      if (n.has(sym)) n.delete(sym); else n.add(sym)
      return n
    })
  }

  function setField(tk, field, val) {
    setTickerData(prev => ({ ...prev, [tk]: { ...prev[tk], [field]: val } }))
  }

  async function saveTicker(tk) {
    const data = { ...tickerData[tk] }
    const existing = briefs[date] || {}
    await saveBrief(date, { ...existing, [tk]: data })
  }

  async function handleSaveMindset() {
    const custom = {}
    customParams.forEach(p => { custom[p.id] = customValues[p.id] || '' })
    await saveMindsetEntry(date, { ...mindsetForm, custom })
  }

  function loadMindset() {
    const m = mindset[date]
    if (m) {
      setMindsetForm({ calm: m.calm || '', sleep: m.sleep || '', macro: m.macro || 'None', notes: m.notes || '' })
      if (m.custom) setCustomValues(m.custom)
    }
  }

  function addCustomParam() {
    const label = newParam.trim()
    if (!label) return
    const params = [...customParams, { id: 'mp_' + uid(), label }]
    saveMindsetParams(params); setCustomParams(params); setNewParam('')
  }

  function deleteCustomParam(id) {
    const params = customParams.filter(p => p.id !== id)
    saveMindsetParams(params); setCustomParams(params)
  }

  const biasColor = bias => bias === 'bull' ? 'var(--green)' : bias === 'bear' ? 'var(--red)' : bias === 'neut' ? 'var(--accent2)' : 'var(--text3)'
  const biasLabel = bias => bias === 'bull' ? '▲ Bullish' : bias === 'bear' ? '▼ Bearish' : bias === 'neut' ? '◆ Neutral' : 'No brief'

  return (
    <div className="main">
      <div className="page-header">
        <div className="page-title">Premarket Brief</div>
        <div className="page-sub">Add tickers to analyze · auto-clears at midnight</div>
      </div>
      <div className="pm-layout">
        {/* LEFT: ticker analysis */}
        <div>
          <div className="flex-between mb" style={{ marginBottom: 14 }}>
            <div style={{ fontSize: 12, color: 'var(--text3)', letterSpacing: '.5px', textTransform: 'uppercase', fontWeight: 500 }}>Ticker Analysis</div>
            <div className="flex-gap">
              <input className="form-input" style={{ width: 110 }} placeholder="SPY, SPX..." maxLength={8} value={newTicker}
                onChange={e => setNewTicker(e.target.value)} onKeyDown={e => e.key === 'Enter' && addTicker()} />
              <button className="btn btn-accent btn-sm" onClick={addTicker}>+ Add</button>
            </div>
          </div>
          {pmTickers.length === 0 && <div className="empty-state"><div className="empty-icon">📊</div>Add a ticker to start your analysis</div>}
          {pmTickers.map(tk => {
            const d = tickerData[tk] || {}
            const isOpen = expandedTickers.has(tk)
            return (
              <div key={tk}>
                <div className={`pm-ticker-row${isOpen ? ' expanded' : ''}`} onClick={() => toggleExpand(tk)}>
                  <div className="pm-ticker-sym">{tk}</div>
                  <div style={{ fontSize: 11, fontWeight: 600, padding: '3px 10px', borderRadius: 20, background: d.bias ? (d.bias === 'bull' ? 'var(--greenbg)' : d.bias === 'bear' ? 'var(--redbg)' : 'var(--accentbg)') : 'rgba(255,255,255,.05)', color: biasColor(d.bias) }}>
                    {biasLabel(d.bias)}
                  </div>
                  <div className="pm-ticker-levels">
                    <span>Call <b>{d.lvn_call || '—'}</b></span>
                    <span>Put <b>{d.lvn_put || '—'}</b></span>
                    <span>POC <b>{d.poc || '—'}</b></span>
                    <span>HVN1 <b>{d.hvn1 || '—'}</b></span>
                  </div>
                  <div onClick={e => e.stopPropagation()} style={{ display: 'flex', gap: 8, marginLeft: 'auto', alignItems: 'center' }}>
                    <button className="btn btn-ghost btn-sm" onClick={() => removeTicker(tk)}>Remove</button>
                    <span style={{ fontSize: 11, color: 'var(--text3)', transition: 'transform .2s', display: 'inline-block', transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}>▼</span>
                  </div>
                </div>
                {isOpen && (
                  <div className="pm-ticker-panel">
                    <div className="pm-grid-inner">
                      <div>
                        <div className="pm-section-title">Key Levels</div>
                        <div className="form-row-3" style={{ marginBottom: 12 }}>
                          {['pdc','pdh','pdl'].map(f => <div key={f} className="form-group" style={{ marginBottom: 0 }}><label className="form-label">{f.toUpperCase()}</label><input className="form-input" value={d[f]||''} onChange={e => setField(tk,f,e.target.value)} /></div>)}
                        </div>
                        <div className="form-row-2" style={{ marginBottom: 12 }}>
                          <div className="form-group" style={{ marginBottom: 0 }}><label className="form-label"><span className="level-badge lbl-call">Call</span>LVN</label><input className="form-input" value={d.lvn_call||''} onChange={e => setField(tk,'lvn_call',e.target.value)} /></div>
                          <div className="form-group" style={{ marginBottom: 0 }}><label className="form-label"><span className="level-badge lbl-put">Put</span>LVN</label><input className="form-input" value={d.lvn_put||''} onChange={e => setField(tk,'lvn_put',e.target.value)} /></div>
                        </div>
                        <div className="form-row-3" style={{ marginBottom: 16 }}>
                          {[['poc','lbl-poc','POC'],['hvn1','lbl-hvn','HVN1'],['hvn2','lbl-hvn','HVN2']].map(([f,cls,lbl]) => <div key={f} className="form-group" style={{ marginBottom: 0 }}><label className="form-label"><span className={`level-badge ${cls}`}>{lbl}</span></label><input className="form-input" value={d[f]||''} onChange={e => setField(tk,f,e.target.value)} /></div>)}
                        </div>
                        <div className="pm-section-title" style={{ color: 'var(--green)' }}>Call Setup</div>
                        <div className="form-row-2" style={{ marginBottom: 16 }}>
                          <div className="form-group" style={{ marginBottom: 0 }}><label className="form-label">Entry</label><input className="form-input" value={d.call_entry||''} onChange={e => setField(tk,'call_entry',e.target.value)} /></div>
                          <div className="form-group" style={{ marginBottom: 0 }}><label className="form-label">Stop</label><input className="form-input" value={d.call_stop||''} onChange={e => setField(tk,'call_stop',e.target.value)} /></div>
                        </div>
                        <div className="pm-section-title" style={{ color: 'var(--red)' }}>Put Setup</div>
                        <div className="form-row-2">
                          <div className="form-group" style={{ marginBottom: 0 }}><label className="form-label">Entry</label><input className="form-input" value={d.put_entry||''} onChange={e => setField(tk,'put_entry',e.target.value)} /></div>
                          <div className="form-group" style={{ marginBottom: 0 }}><label className="form-label">Stop</label><input className="form-input" value={d.put_stop||''} onChange={e => setField(tk,'put_stop',e.target.value)} /></div>
                        </div>
                      </div>
                      <div>
                        <div className="pm-section-title">Bias & EMA</div>
                        <div className="form-group" style={{ marginBottom: 14 }}>
                          <label className="form-label">Overall Bias</label>
                          <div className="bias-row">
                            {['bull','bear','neut'].map(b => (
                              <button key={b} className={`bias-btn ${b}${d.bias === b ? ' active' : ''}`} onClick={() => setField(tk, 'bias', d.bias === b ? '' : b)}>
                                {b === 'bull' ? '▲ Bull' : b === 'bear' ? '▼ Bear' : '◆ Neut'}
                              </button>
                            ))}
                          </div>
                        </div>
                        <div className="form-group" style={{ marginBottom: 14 }}>
                          <label className="form-label">POC Position</label>
                          <select className="form-select" value={d.poc_pos||''} onChange={e => setField(tk,'poc_pos',e.target.value)}>
                            <option value="">Select...</option>
                            <option>Price ABOVE POC — Bullish</option>
                            <option>Price BELOW POC — Bearish</option>
                            <option>Price AT POC — Wait</option>
                          </select>
                        </div>
                        <div className="pm-section-title">9 EMA Context</div>
                        <div className="form-row-3" style={{ marginBottom: 14 }}>
                          {['ema5','ema3','ema1'].map((f,i) => (
                            <div key={f} className="form-group" style={{ marginBottom: 0 }}>
                              <label className="form-label">{['5min','3min','1min'][i]}</label>
                              <select className="form-select" value={d[f]||''} onChange={e => setField(tk,f,e.target.value)}>
                                <option value="">—</option><option>Above ↑</option><option>Below ↓</option><option>At EMA</option>
                              </select>
                            </div>
                          ))}
                        </div>
                        <div className="form-group">
                          <label className="form-label">Confluence?</label>
                          <select className="form-select" value={d.confluence||''} onChange={e => setField(tk,'confluence',e.target.value)}>
                            <option value="">—</option><option>Yes ✓</option><option>No ✗</option><option>Partial</option>
                          </select>
                        </div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: 16, borderTop: '0.5px solid var(--border)', marginTop: 8 }}>
                      <button className="btn btn-accent" onClick={() => saveTicker(tk)}>Save {tk}</button>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {/* RIGHT: mindset */}
        <div className="mindset-panel">
          <div className="card-title">Pre-Trade Mindset</div>
          <div className="form-group">
            <label className="form-label">Date</label>
            <input type="date" className="form-input" value={date} onChange={e => setDate(e.target.value)} />
          </div>
          <div className="form-group">
            <label className="form-label">Am I calm?</label>
            <select className="form-select" value={mindsetForm.calm} onChange={e => setMindsetForm(p => ({ ...p, calm: e.target.value }))}>
              <option value="">—</option><option>Yes ✓</option><option>No ✗</option>
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Sleep Quality</label>
            <select className="form-select" value={mindsetForm.sleep} onChange={e => setMindsetForm(p => ({ ...p, sleep: e.target.value }))}>
              <option value="">—</option><option>Great</option><option>Good</option><option>Fair</option><option>Poor</option>
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Macro Flag</label>
            <select className="form-select" value={mindsetForm.macro} onChange={e => setMindsetForm(p => ({ ...p, macro: e.target.value }))}>
              <option value="None">None</option><option>⚠ CPI</option><option>⚠ FOMC</option><option>⚠ Jobs</option><option>⚠ Other</option>
            </select>
          </div>
          {customParams.map(p => (
            <div key={p.id} className="form-group">
              <label className="form-label" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>{p.label}</span>
                <button onClick={() => deleteCustomParam(p.id)} style={{ background: 'none', border: 'none', color: 'var(--text3)', cursor: 'pointer', fontSize: 11 }}>✕</button>
              </label>
              <input className="form-input" placeholder={p.label + '...'} value={customValues[p.id] || ''} onChange={e => setCustomValues(prev => ({ ...prev, [p.id]: e.target.value }))} />
            </div>
          ))}
          <div className="add-rule-row">
            <input className="form-input" style={{ padding: '6px 10px', fontSize: 12 }} placeholder="Add parameter..." value={newParam} onChange={e => setNewParam(e.target.value)} onKeyDown={e => e.key === 'Enter' && addCustomParam()} />
            <button className="btn btn-ghost btn-sm" onClick={addCustomParam}>+ Add</button>
          </div>
          <div className="form-group" style={{ marginTop: 14 }}>
            <label className="form-label">Notes</label>
            <textarea className="form-textarea" placeholder="Market context, observations..." value={mindsetForm.notes} onChange={e => setMindsetForm(p => ({ ...p, notes: e.target.value }))} />
          </div>
          <div className="flex-gap" style={{ marginTop: 4 }}>
            <button className="btn btn-accent" style={{ flex: 1 }} onClick={handleSaveMindset}>Save</button>
            <button className="btn btn-ghost btn-sm" onClick={loadMindset}>Load</button>
          </div>
        </div>
      </div>
    </div>
  )
}
