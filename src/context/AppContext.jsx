import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react'
import { sb } from '../lib/supabase'
import { DEFAULT_RULES, today, uid } from '../lib/utils'

const AppContext = createContext(null)

export function AppProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [trades, setTrades] = useState([])
  const [rulesData, setRulesData] = useState({ sections: [], answers: {} })
  const [briefs, setBriefs] = useState({})
  const [mindset, setMindset] = useState({})
  const [toast, setToast] = useState({ msg: '', err: false, show: false })
  const toastTimer = useRef(null)

  // ── toast ──────────────────────────────────────
  const showToast = useCallback((msg, err = false) => {
    if (toastTimer.current) clearTimeout(toastTimer.current)
    setToast({ msg, err, show: true })
    toastTimer.current = setTimeout(() => setToast(t => ({ ...t, show: false })), 2800)
  }, [])

  // ── auth ───────────────────────────────────────
  useEffect(() => {
    // timeout fallback — show auth screen if Supabase takes too long
    const timeout = setTimeout(() => setLoading(false), 8000)

    // Guard so we only load data once per sign-in.
    let dataLoaded = false
    // IMPORTANT: never call Supabase DB queries synchronously inside the
    // onAuthStateChange callback — it holds an internal auth lock and the
    // query would wait on that same lock, deadlocking. Defer with setTimeout
    // so the load runs after the callback releases the lock.
    const triggerLoad = (u) => {
      if (dataLoaded) return
      dataLoaded = true
      setTimeout(() => {
        loadAllData(u.id)
          .catch(() => {})
          .finally(() => { clearTimeout(timeout); setLoading(false) })
      }, 0)
    }

    sb.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setUser(session.user)
        triggerLoad(session.user)
      } else {
        clearTimeout(timeout)
        setLoading(false)
      }
    }).catch(() => { clearTimeout(timeout); setLoading(false) })

    const { data: { subscription } } = sb.auth.onAuthStateChange((event, session) => {
      if ((event === 'SIGNED_IN' || event === 'INITIAL_SESSION') && session) {
        setUser(session.user)
        triggerLoad(session.user)
      }
      if (event === 'TOKEN_REFRESHED' && session) setUser(session.user)
      if (event === 'SIGNED_OUT') {
        dataLoaded = false
        setUser(null)
        setTrades([])
        setRulesData({ sections: [], answers: {} })
        setBriefs({})
        setMindset({})
      }
    })

    // refresh session every 10 min
    const interval = setInterval(async () => {
      const { data: { session } } = await sb.auth.getSession()
      if (session) setUser(session.user)
    }, 10 * 60 * 1000)

    return () => { subscription.unsubscribe(); clearInterval(interval) }
  }, [])

  // ── load all data ──────────────────────────────
  async function loadAllData(userId) {
    const [{ data: t }, { data: r }, { data: b }, { data: m }] = await Promise.all([
      sb.from('trades').select('*').eq('user_id', userId).order('date', { ascending: false }),
      sb.from('rules_data').select('*').eq('user_id', userId).maybeSingle(),
      sb.from('briefs').select('*').eq('user_id', userId),
      sb.from('mindset').select('*').eq('user_id', userId),
    ])

    setTrades(t || [])

    if (r) {
      setRulesData(r.data)
    } else {
      const defaultRules = { ...DEFAULT_RULES }
      setRulesData(defaultRules)
      await sb.from('rules_data').upsert({ user_id: userId, data: defaultRules }, { onConflict: 'user_id' })
    }

    const briefMap = {}
    ;(b || []).forEach(row => { briefMap[row.date] = row.data })
    setBriefs(briefMap)

    const mindsetMap = {}
    ;(m || []).forEach(row => { mindsetMap[row.date] = row.data })
    setMindset(mindsetMap)
  }

  // ── trades ─────────────────────────────────────
  const saveTrade = useCallback(async (trade) => {
    const { data: { session } } = await sb.auth.getSession()
    if (!session) { showToast('Session expired — please log in again', true); return false }

    const tradeWithUser = { ...trade, user_id: session.user.id }
    const { error } = await sb.from('trades').upsert(tradeWithUser, { onConflict: 'id' })
    if (error) { showToast('Failed to save trade', true); return false }

    setTrades(prev => {
      const idx = prev.findIndex(t => t.id === trade.id)
      if (idx >= 0) {
        const next = [...prev]
        next[idx] = tradeWithUser
        return next
      }
      return [tradeWithUser, ...prev]
    })
    showToast(trade._isEdit ? 'Trade updated' : 'Trade saved')
    return true
  }, [showToast])

  const deleteTrade = useCallback(async (id) => {
    const { error } = await sb.from('trades').delete().eq('id', id).eq('user_id', user.id)
    if (error) { showToast('Failed to delete trade', true); return }
    setTrades(prev => prev.filter(t => t.id !== id))
    showToast('Trade deleted')
  }, [user, showToast])

  // ── rules ──────────────────────────────────────
  const saveRulesData = useCallback(async (newData) => {
    const { error } = await sb.from('rules_data').upsert({ user_id: user.id, data: newData }, { onConflict: 'user_id' })
    if (error) { showToast('Failed to save rules', true); return }
    setRulesData(newData)
  }, [user, showToast])

  // ── briefs ─────────────────────────────────────
  const saveBrief = useCallback(async (date, data) => {
    const { error } = await sb.from('briefs').upsert({ user_id: user.id, date, data }, { onConflict: 'user_id,date' })
    if (error) { showToast('Failed to save brief', true); return }
    setBriefs(prev => ({ ...prev, [date]: data }))
  }, [user, showToast])

  // ── mindset ────────────────────────────────────
  const saveMindsetEntry = useCallback(async (date, data) => {
    const { error } = await sb.from('mindset').upsert({ user_id: user.id, date, data }, { onConflict: 'user_id,date' })
    if (error) { showToast('Failed to save mindset', true); return }
    setMindset(prev => ({ ...prev, [date]: data }))
    showToast('Mindset saved')
  }, [user, showToast])

  // ── import trades ──────────────────────────────
  const importTrades = useCallback(async (newTrades, mode) => {
    let toInsert = []
    let skipped = 0

    newTrades.forEach(t => {
      const withUser = { ...t, user_id: user.id }
      if (mode === 'skip') {
        const exists = trades.some(x => x.date === t.date && x.inst === t.inst && x.entry_price === t.entry_price)
        if (exists) { skipped++; return }
      }
      toInsert.push(withUser)
    })

    if (toInsert.length) {
      const { error } = await sb.from('trades').upsert(toInsert, { onConflict: 'id' })
      if (error) { showToast('Import failed', true); return }
      setTrades(prev => {
        const existing = mode === 'replace'
          ? prev.filter(x => !toInsert.some(t => t.date === x.date && t.inst === x.inst && t.entry_price === x.entry_price))
          : prev
        return [...toInsert, ...existing]
      })
    }

    showToast(`Imported ${toInsert.length} trades${skipped ? ` (${skipped} skipped)` : ''}`)
    return toInsert.length
  }, [user, trades, showToast])

  const value = {
    user, loading,
    trades, saveTrade, deleteTrade, importTrades,
    rulesData, saveRulesData,
    briefs, saveBrief,
    mindset, saveMindsetEntry,
    showToast,
    toast,
    reload: () => user && loadAllData(user.id),
  }

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}

export const useApp = () => useContext(AppContext)
