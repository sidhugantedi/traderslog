import { useState, useMemo } from 'react'
import { useApp } from '../context/AppContext'
import { calcTrade, fmt, fmtD, uid, addTickerToList } from '../lib/utils'
import TradeForm from '../components/ui/TradeForm'
import TradeDetail from '../components/ui/TradeDetail'
import Modal from '../components/ui/Modal'

const parseDate = raw => {
  if (!raw) return ''
  raw = raw.trim()
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) return raw
  const m1 = raw.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/)
  if (m1) return `${m1[3]}-${m1[1].padStart(2,'0')}-${m1[2].padStart(2,'0')}`
  const m2 = raw.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2})$/)
  if (m2) return `20${m2[3]}-${m2[1].padStart(2,'0')}-${m2[2].padStart(2,'0')}`
  return raw
}
const parseNum = raw => {
  if (!raw && raw !== 0) return 0
  const s = String(raw).replace(/[$,\s]/g,'').replace(/[()]/g, m => m === '(' ? '-' : '')
  return parseFloat(s) || 0
}
const COL = { num:0,date:1,inst:2,dir:3,strike:4,entry_time:5,entry_price:6,t1_price:7,t1_qty:8,t1_pnl:9,t1_time:10,t2_price:11,t2_qty:12,t2_pnl:13,t2_time:14,tf_price:15,tf_qty:16,tf_pnl:17,tf_time:18,total_pnl:19,outcome:20,bnr:21,ema:22,rules_followed:23,went_right:24,went_wrong:25,setup_rating:26 }

export default function TradeLog() {
  const { trades, deleteTrade, importTrades } = useApp()
  const [formOpen, setFormOpen] = useState(false)
  const [editTrade, setEditTrade] = useState(null)
  const [detailTrade, setDetailTrade] = useState(null)
  const [importOpen, setImportOpen] = useState(false)
  const [importText, setImportText] = useState('')
  const [importMode, setImportMode] = useState('skip')
  const [parsedRows, setParsedRows] = useState([])
  const [filterDir, setFilterDir] = useState('')
  const [filterInst, setFilterInst] = useState('')
  const [filterOutcome, setFilterOutcome] = useState('')
  const [sortCol, setSortCol] = useState('date')
  const [sortDir, setSortDir] = useState(-1)

  function handleSort(col) {
    if (sortCol === col) setSortDir(d => d * -1)
    else { setSortCol(col); setSortDir(-1) }
  }

  const sortIcon = col => sortCol === col ? (sortDir === -1 ? ' ↓' : ' ↑') : ''

  const uniqueTickers = [...new Set(trades.map(t => t.inst).filter(Boolean))]

  const filtered = useMemo(() => {
    let t = trades.map((t, i) => ({ ...t, _i: i, ...calcTrade(t) }))
    if (filterDir) t = t.filter(x => x.dir === filterDir)
    if (filterInst) t = t.filter(x => x.inst === filterInst)
    if (filterOutcome) t = t.filter(x => filterOutcome === 'win' ? x.total > 0 : x.total < 0)
    return t.sort((a, b) => {
      let av, bv
      if (sortCol === 'date') { av = a.date || ''; bv = b.date || '' }
      else if (sortCol === 'inst') { av = a.inst || ''; bv = b.inst || '' }
      else if (sortCol === 'dir') { av = a.dir || ''; bv = b.dir || '' }
      else if (sortCol === 'entry') { av = parseFloat(a.entry_price) || 0; bv = parseFloat(b.entry_price) || 0 }
      else if (sortCol === 'pnl') { av = a.total; bv = b.total }
      else if (sortCol === 'pct') { av = a.pct; bv = b.pct }
      else if (sortCol === 'outcome') { av = a.total > 0 ? 1 : a.total < 0 ? -1 : 0; bv = b.total > 0 ? 1 : b.total < 0 ? -1 : 0 }
      else { av = a._i; bv = b._i }
      if (av < bv) return -1 * sortDir; if (av > bv) return 1 * sortDir; return 0
    })
  }, [trades, filterDir, filterInst, filterOutcome, sortCol, sortDir])

  function exportCSV() {
    if (!trades.length) return
    const h = ['Date','Inst','Dir','Strike','Entry Time','Entry Price','T1 P&L','T2 P&L','Final P&L','Total P&L','Return %','B&R','EMA','Rules','Notes']
    const rows = trades.map(t => {
      const { p1, p2, p3, total, pct } = calcTrade(t)
      return [t.date,t.inst,t.dir,t.strike,t.entry_time,t.entry_price,p1.toFixed(2),p2.toFixed(2),p3.toFixed(2),total.toFixed(2),pct.toFixed(2)+'%',t.bnr,t.ema,t.rules_followed,(t.notes||'').replace(/,/g,' ')].join(',')
    })
    const a = document.createElement('a')
    a.href = 'data:text/csv;charset=utf-8,' + encodeURIComponent([h.join(','), ...rows].join('\n'))
    a.download = 'trades.csv'; a.click()
  }

  function previewImport() {
    const lines = importText.trim().split('\n').map(l => l.split('\t'))
    const rows = []; let skippedH = false
    for (let i = 0; i < lines.length; i++) {
      const cols = lines[i].map(c => c.trim())
      if (!skippedH && (cols[0] === '#' || cols[1] === 'Date' || isNaN(parseFloat(cols[0])))) { skippedH = true; continue }
      if (cols.length < 7) continue
      const date = parseDate(cols[COL.date]); const ep = parseNum(cols[COL.entry_price])
      const errors = []
      if (!date) errors.push('no date'); if (!ep) errors.push('no price'); if (!cols[COL.inst]) errors.push('no inst')
      rows.push({ _row: i+1, _errors: errors, id: uid(), date, inst: (cols[COL.inst]||'').toUpperCase(), dir: cols[COL.dir]||'', strike: cols[COL.strike]||'', entry_time: cols[COL.entry_time]||'', entry_price: ep, level: '',
        t1_time: cols[COL.t1_time]||'', t1_price: parseNum(cols[COL.t1_price]), t1_qty: parseNum(cols[COL.t1_qty]),
        t2_time: cols[COL.t2_time]||'', t2_price: parseNum(cols[COL.t2_price]), t2_qty: parseNum(cols[COL.t2_qty]),
        tf_time: cols[COL.tf_time]||'', tf_price: parseNum(cols[COL.tf_price]), tf_qty: parseNum(cols[COL.tf_qty]),
        bnr: cols[COL.bnr]||'', ema: cols[COL.ema]||'', rules_followed: cols[COL.rules_followed]||'',
        notes: [cols[COL.went_right]?'✅ '+cols[COL.went_right]:'', cols[COL.went_wrong]?'❌ '+cols[COL.went_wrong]:''].filter(Boolean).join(' | ') })
    }
    setParsedRows(rows)
  }

  async function confirmImport() {
    const valid = parsedRows.filter(r => !r._errors.length)
    if (!valid.length) return
    valid.forEach(t => { if (t.inst) addTickerToList(t.inst) })
    await importTrades(valid, importMode)
    setImportOpen(false); setImportText(''); setParsedRows([])
  }

  const pc = c => c > 0 ? 'pnl-pos' : c < 0 ? 'pnl-neg' : 'pnl-neu'
  const yn = v => v === 'Yes' ? <span style={{color:'var(--green)',fontSize:12}}>Yes</span> : v === 'No' ? <span style={{color:'var(--red)',fontSize:12}}>No</span> : v ? <span style={{color:'var(--accent2)',fontSize:12}}>{v}</span> : '—'

  return (
    <div className="main">
      <div className="flex-between mb-lg">
        <div className="page-header" style={{ marginBottom: 0 }}>
          <div className="page-title">Trade Log</div>
          <div className="page-sub">{filtered.length} trade{filtered.length !== 1 ? 's' : ''}</div>
        </div>
        <div className="flex-wrap">
          <button className="btn btn-accent" onClick={() => { setEditTrade(null); setFormOpen(true) }}>+ New Trade</button>
          <button className="btn btn-ghost" onClick={() => setImportOpen(true)}>⬆ Import</button>
          <button className="btn btn-ghost" onClick={exportCSV}>⬇ Export</button>
          <select className="form-select" style={{ width: 130 }} value={filterDir} onChange={e => setFilterDir(e.target.value)}>
            <option value="">All Directions</option><option>CALL</option><option>PUT</option>
          </select>
          <select className="form-select" style={{ width: 130 }} value={filterInst} onChange={e => setFilterInst(e.target.value)}>
            <option value="">All Tickers</option>
            {uniqueTickers.map(t => <option key={t}>{t}</option>)}
          </select>
          <select className="form-select" style={{ width: 140 }} value={filterOutcome} onChange={e => setFilterOutcome(e.target.value)}>
            <option value="">All Outcomes</option>
            <option value="win">Wins only</option><option value="loss">Losses only</option>
          </select>
        </div>
      </div>

      <div className="card" style={{ padding: 0 }}>
        <div className="table-wrap">
          <table>
            <thead><tr>
              <th onClick={() => handleSort('date')}># {sortIcon('date')}</th>
              <th onClick={() => handleSort('date')}>Date</th>
              <th onClick={() => handleSort('inst')}>Inst{sortIcon('inst')}</th>
              <th onClick={() => handleSort('dir')}>Dir{sortIcon('dir')}</th>
              <th onClick={() => handleSort('entry')}>Entry{sortIcon('entry')}</th>
              <th>T1 P&L</th><th>T2 P&L</th><th>Final P&L</th>
              <th className="sort-active" onClick={() => handleSort('pnl')}>Total P&L{sortIcon('pnl')}</th>
              <th onClick={() => handleSort('pct')}>Return%{sortIcon('pct')}</th>
              <th>Level</th><th>B&R</th><th>EMA</th><th>Rules</th>
              <th onClick={() => handleSort('outcome')}>Outcome{sortIcon('outcome')}</th>
              <th>Actions</th>
            </tr></thead>
            <tbody>
              {filtered.length ? filtered.map((t, n) => {
                const { p1, p2, p3, total, pct } = t
                return (
                  <tr key={t.id} style={{ cursor: 'pointer' }} onClick={() => setDetailTrade(t)}>
                    <td style={{ color: 'var(--text3)' }}>{n + 1}</td>
                    <td style={{ color: 'var(--text2)' }}>{t.date}</td>
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
                    <td onClick={e => e.stopPropagation()}>
                      <div className="flex-gap">
                        <button className="btn btn-ghost btn-sm" onClick={() => { setEditTrade(t); setFormOpen(true) }}>Edit</button>
                        <button className="btn btn-danger btn-sm" onClick={() => confirm('Delete?') && deleteTrade(t.id)}>Del</button>
                      </div>
                    </td>
                  </tr>
                )
              }) : (
                <tr><td colSpan={16}><div className="empty-state"><div className="empty-icon">📋</div>No trades found</div></td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <TradeForm open={formOpen} onClose={() => setFormOpen(false)} editTrade={editTrade} />
      <TradeDetail trade={detailTrade} open={!!detailTrade} onClose={() => setDetailTrade(null)}
        onEdit={() => { setEditTrade(detailTrade); setDetailTrade(null); setFormOpen(true) }} />

      <Modal open={importOpen} onClose={() => setImportOpen(false)} title="Import Trades from Excel" maxWidth={760}>
        <div style={{ background: 'var(--bg3)', borderRadius: 9, padding: '12px 16px', marginBottom: 14, fontSize: 13, color: 'var(--text2)', lineHeight: 1.7 }}>
          Open Excel → Select rows → Ctrl+C → Paste below → Preview → Import
        </div>
        <div className="form-group">
          <label className="form-label">Paste Excel Data</label>
          <textarea className="form-textarea" style={{ minHeight: 100, fontSize: 12 }} placeholder="Paste your copied Excel rows here..." value={importText} onChange={e => setImportText(e.target.value)} />
        </div>
        <div className="flex-gap" style={{ marginTop: 10 }}>
          <button className="btn btn-ghost" onClick={previewImport}>Preview</button>
          <div style={{ flex: 1 }} />
          <select className="form-select" style={{ width: 200 }} value={importMode} onChange={e => setImportMode(e.target.value)}>
            <option value="skip">Skip duplicates</option>
            <option value="append">Append all</option>
            <option value="replace">Replace same-date</option>
          </select>
          {parsedRows.filter(r => !r._errors.length).length > 0 && (
            <button className="btn btn-accent" onClick={confirmImport}>Import Valid Rows</button>
          )}
        </div>
        {parsedRows.length > 0 && (
          <>
            <div className="import-stats">
              <span style={{ color: 'var(--green)' }}>✓ Valid: {parsedRows.filter(r => !r._errors.length).length}</span>
              <span style={{ color: 'var(--red)' }}>✗ Errors: {parsedRows.filter(r => r._errors.length).length}</span>
              <span style={{ color: 'var(--text3)' }}>Total: {parsedRows.length}</span>
            </div>
            <div className="import-preview">
              <div className="import-row hdr"><span>#</span><span>Date</span><span>Inst</span><span>Dir</span><span>Entry</span><span>P&L</span><span>Status</span></div>
              {parsedRows.map(r => {
                const { total } = calcTrade(r); const ok = !r._errors.length
                return (
                  <div key={r._row} className={`import-row${ok ? '' : ' err'}`}>
                    <span>{r._row}</span><span>{r.date||'—'}</span><span>{r.inst||'—'}</span>
                    <span>{r.dir||'—'}</span><span>{r.entry_price||'—'}</span>
                    <span className={total > 0 ? 'pnl-pos' : total < 0 ? 'pnl-neg' : 'pnl-neu'}>{ok ? fmt(total) : '—'}</span>
                    <span className={`import-badge ${ok ? 'ok' : 'err'}`}>{ok ? 'OK' : r._errors.join(', ')}</span>
                  </div>
                )
              })}
            </div>
          </>
        )}
      </Modal>
    </div>
  )
}
