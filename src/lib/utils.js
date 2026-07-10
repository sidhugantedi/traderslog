export const fmt = n => (n >= 0 ? '+' : '') + '$' + Math.abs(n).toFixed(2)
export const fmtD = n => (n >= 0 ? '+' : '') + Math.abs(n).toFixed(2) + '%'
export const today = () => new Date().toISOString().slice(0, 10)
export const uid = () => 'id' + Date.now() + Math.random().toString(36).slice(2, 6)

export function calcPnl(ep, xp, q) {
  if (!ep || !xp || !q) return 0
  return (parseFloat(xp) - parseFloat(ep)) * parseFloat(q) * 100
}

export function calcTrade(t) {
  const p1 = calcPnl(t.entry_price, t.t1_price, t.t1_qty)
  const p2 = calcPnl(t.entry_price, t.t2_price, t.t2_qty)
  const p3 = calcPnl(t.entry_price, t.tf_price, t.tf_qty)
  const total = p1 + p2 + p3
  const tq = (parseFloat(t.t1_qty) || 0) + (parseFloat(t.t2_qty) || 0) + (parseFloat(t.tf_qty) || 0)
  const cost = parseFloat(t.entry_price) * tq * 100
  return { p1, p2, p3, total, pct: cost ? (total / cost) * 100 : 0 }
}

export const DEFAULT_RULES = {
  sections: [
    { id: 's1', name: 'Pre-Trade Setup', rules: [
      { id: 'r1', text: 'Premarket levels marked' },
      { id: 'r2', text: 'No trade before 9:35 AM' },
      { id: 'r3', text: 'POC bias identified' },
    ]},
    { id: 's2', name: 'Entry Discipline', rules: [
      { id: 'r4', text: 'Waited 1-min candle close' },
      { id: 'r5', text: 'Break & Retest confirmed' },
      { id: 'r6', text: '9 EMA aligned with trade' },
      { id: 'r7', text: 'LVN gap checked before entry' },
    ]},
    { id: 's3', name: 'Risk Management', rules: [
      { id: 'r8', text: 'Stop defined before entry' },
      { id: 'r9', text: 'No averaging down' },
      { id: 'r10', text: 'Max 3 losses respected' },
      { id: 'r11', text: 'Daily loss limit respected' },
    ]},
    { id: 's4', name: 'Psychology', rules: [
      { id: 'r12', text: 'No revenge trade after loss' },
      { id: 'r13', text: '15-min cool down after loss' },
      { id: 'r14', text: 'No signal apps / Discord used' },
    ]},
  ],
  answers: {}
}

export const DEFAULT_TICKERS = ['SPY', 'SPX', 'QQQ', 'IWM', 'NVDA', 'TSLA', 'AAPL', 'MSFT']

export function getTickers() {
  return JSON.parse(localStorage.getItem('ej_tickers') || JSON.stringify(DEFAULT_TICKERS))
}
export function saveTickers(a) {
  localStorage.setItem('ej_tickers', JSON.stringify([...new Set(a)]))
}
export function addTickerToList(s) {
  s = s.trim().toUpperCase()
  if (!s) return
  const a = getTickers()
  if (!a.includes(s)) a.push(s)
  saveTickers(a)
}
export function removeTickerFromList(s) {
  saveTickers(getTickers().filter(t => t !== s))
}

export function getPMTickers(userId) {
  const key = `ej_pm_${userId}_${today()}`
  return JSON.parse(localStorage.getItem(key) || '[]')
}
export function setPMTickers(userId, a) {
  const key = `ej_pm_${userId}_${today()}`
  localStorage.setItem(key, JSON.stringify(a))
}

export function getMindsetParams() {
  return JSON.parse(localStorage.getItem('ej_mindset_params') || '[]')
}
export function saveMindsetParams(p) {
  localStorage.setItem('ej_mindset_params', JSON.stringify(p))
}

export const HIGH_MACRO_KEYWORDS = [
  'Federal Funds Rate','CPI','Core CPI','Non-Farm','Nonfarm',
  'GDP','Unemployment','PPI','Retail Sales','FOMC',
  'ISM Manufacturing','ISM Services','Durable Goods','PCE','ADP'
]
