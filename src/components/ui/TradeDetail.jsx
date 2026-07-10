import { calcTrade } from '../../lib/utils'
import Modal from './Modal'

const fmt = n => (n >= 0 ? '+' : '') + '$' + Math.abs(n).toFixed(2)
const fmtD = n => (n >= 0 ? '+' : '') + Math.abs(n).toFixed(2) + '%'
const pc = c => c > 0 ? 'var(--green)' : c < 0 ? 'var(--red)' : 'var(--text3)'

function Row({ label, value, color }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '0.5px solid var(--border)' }}>
      <span style={{ fontSize: 13, color: 'var(--text3)' }} dangerouslySetInnerHTML={{ __html: label }} />
      <span style={{ fontSize: 13, fontWeight: 600, color: color || 'var(--text2)', fontVariantNumeric: 'tabular-nums' }}>{value}</span>
    </div>
  )
}

export default function TradeDetail({ trade, open, onClose, onEdit }) {
  if (!trade) return null
  const { p1, p2, p3, total, pct } = calcTrade(trade)

  return (
    <Modal open={open} onClose={onClose} maxWidth={700}
      title={
        <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span className="inst-tag">{trade.inst}</span>
          <span className={`chip ${trade.dir === 'CALL' ? 'chip-call' : 'chip-put'}`}>{trade.dir}</span>
          <span style={{ fontSize: 14, fontWeight: 600, color: pc(total) }}>{fmt(total)}</span>
        </span>
      }>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
        <div>
          <div className="card-title">Setup</div>
          <Row label="Date" value={trade.date || '—'} />
          <Row label="Strike" value={trade.strike || '—'} />
          <Row label="Entry Time" value={trade.entry_time || '—'} />
          <Row label="Entry Price" value={trade.entry_price ? `$${trade.entry_price}` : '—'} />
          <Row label="Level Used" value={trade.level || '—'} />
        </div>
        <div>
          <div className="card-title">Exits</div>
          {trade.t1_qty ? <><Row label="Trim 1" value={`${trade.t1_price} × ${trade.t1_qty} contracts`} color={pc(p1)} /><Row label="Trim 1 P&L" value={fmt(p1)} color={pc(p1)} /></> : null}
          {trade.t2_qty ? <><Row label="Trim 2" value={`${trade.t2_price} × ${trade.t2_qty} contracts`} color={pc(p2)} /><Row label="Trim 2 P&L" value={fmt(p2)} color={pc(p2)} /></> : null}
          {trade.tf_qty ? <><Row label="Final Exit" value={`${trade.tf_price} × ${trade.tf_qty} contracts`} color={pc(p3)} /><Row label="Final P&L" value={fmt(p3)} color={pc(p3)} /></> : null}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, margin: '20px 0', background: 'var(--bg3)', borderRadius: 12, padding: 16 }}>
        {[['Total P&L', fmt(total), pc(total)], ['Return %', fmtD(pct), pc(pct)], ['Outcome', total > 0 ? 'Win' : total < 0 ? 'Loss' : 'BE', pc(total)]].map(([l, v, c]) => (
          <div key={l} style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 11, color: 'var(--text3)', marginBottom: 4 }}>{l}</div>
            {l === 'Outcome'
              ? <span className={`chip ${total > 0 ? 'chip-win' : total < 0 ? 'chip-loss' : 'chip-be'}`}>{v}</span>
              : <div style={{ fontSize: 22, fontWeight: 700, color: c, fontVariantNumeric: 'tabular-nums' }}>{v}</div>}
          </div>
        ))}
      </div>

      <div style={{ marginBottom: 20 }}>
        <div className="card-title">Checklist</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
          {[['Break & Retest', trade.bnr], ['EMA Aligned', trade.ema], ['Rules Followed', trade.rules_followed]].map(([l, v]) => (
            <div key={l} style={{ background: 'var(--bg3)', borderRadius: 9, padding: 12, textAlign: 'center' }}>
              <div style={{ fontSize: 10, color: 'var(--text3)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '.5px' }}>{l}</div>
              <div style={{ fontSize: 13, fontWeight: 600, color: v === 'Yes' ? 'var(--green)' : v === 'No' ? 'var(--red)' : 'var(--text2)' }}>{v || '—'}</div>
            </div>
          ))}
        </div>
      </div>

      {trade.notes && (
        <div style={{ background: 'var(--bg3)', borderRadius: 9, padding: 14, marginBottom: 20 }}>
          <div style={{ fontSize: 11, color: 'var(--text3)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '.5px' }}>Notes</div>
          <div style={{ fontSize: 13, color: 'var(--text2)', lineHeight: 1.6 }}>{trade.notes}</div>
        </div>
      )}

      <div className="flex-gap" style={{ justifyContent: 'flex-end' }}>
        <button className="btn btn-ghost" onClick={onClose}>Close</button>
        <button className="btn btn-accent" onClick={onEdit}>Edit Trade</button>
      </div>
    </Modal>
  )
}
