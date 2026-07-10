import { useState, useEffect } from 'react'
import { useApp } from '../context/AppContext'
import { today, uid } from '../lib/utils'
import Modal from '../components/ui/Modal'

export default function Rules() {
  const { rulesData, saveRulesData, showToast } = useApp()
  const [date, setDate] = useState(today())
  const [answers, setAnswers] = useState({})
  const [sectionModalOpen, setSectionModalOpen] = useState(false)
  const [newSectionName, setNewSectionName] = useState('')

  useEffect(() => {
    setAnswers(rulesData.answers?.[date] ? { ...rulesData.answers[date] } : {})
  }, [date, rulesData])

  const totalRules = rulesData.sections?.reduce((s, sec) => s + sec.rules.length, 0) || 0
  const score = Object.values(answers).filter(v => v === 'Y').length
  const pct = totalRules ? score / totalRules * 100 : 0
  const scoreColor = pct >= 80 ? 'var(--green)' : pct >= 50 ? 'var(--accent2)' : 'var(--red)'
  const scoreLabel = pct >= 90 ? 'Perfect' : pct >= 80 ? 'Great' : pct >= 60 ? 'Good' : pct >= 40 ? 'Average' : 'Needs work'

  function setAnswer(ruleId, val) {
    setAnswers(prev => ({ ...prev, [ruleId]: prev[ruleId] === val ? '' : val }))
  }

  async function handleSave() {
    const newData = { ...rulesData, answers: { ...rulesData.answers, [date]: { ...answers } } }
    await saveRulesData(newData)
    showToast('Rules saved for ' + date)
  }

  async function addSection() {
    const name = newSectionName.trim()
    if (!name) { showToast('Enter a section name', true); return }
    const newData = { ...rulesData, sections: [...(rulesData.sections || []), { id: uid(), name, rules: [] }] }
    await saveRulesData(newData)
    setSectionModalOpen(false); setNewSectionName('')
    showToast('Section added')
  }

  async function deleteSection(secId) {
    if (!confirm('Delete this section and all its rules?')) return
    const newData = { ...rulesData, sections: rulesData.sections.filter(s => s.id !== secId) }
    await saveRulesData(newData)
  }

  async function addRule(secId, text) {
    if (!text.trim()) { showToast('Enter a rule', true); return }
    if (totalRules >= 50) { showToast('Max 50 rules reached', true); return }
    const newData = {
      ...rulesData,
      sections: rulesData.sections.map(s => s.id === secId ? { ...s, rules: [...s.rules, { id: uid(), text: text.trim() }] } : s)
    }
    await saveRulesData(newData)
  }

  async function deleteRule(secId, ruleId) {
    const newData = {
      ...rulesData,
      sections: rulesData.sections.map(s => s.id === secId ? { ...s, rules: s.rules.filter(r => r.id !== ruleId) } : s)
    }
    setAnswers(prev => { const next = { ...prev }; delete next[ruleId]; return next })
    await saveRulesData(newData)
  }

  // 7-day chart
  const days = []
  for (let i = 6; i >= 0; i--) { const d = new Date(); d.setDate(d.getDate() - i); days.push(d.toISOString().slice(0, 10)) }

  return (
    <div className="main">
      <div className="score-bar-card">
        <div>
          <div className="big-score" style={{ color: scoreColor }}>{score}</div>
          <div className="big-score-sub">of {totalRules} rules</div>
        </div>
        <div>
          <div className="flex-between mb-sm">
            <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--text)' }}>{totalRules ? scoreLabel : 'No rules added'}</span>
            <span style={{ fontSize: 12, color: 'var(--text3)' }}>{date}</span>
          </div>
          <div className="prog"><div className="prog-fill" style={{ width: pct + '%', background: scoreColor }} /></div>
          <div style={{ marginTop: 18 }}>
            <div style={{ fontSize: 10, color: 'var(--text3)', letterSpacing: '.5px', textTransform: 'uppercase', marginBottom: 8 }}>Past 7 Days</div>
            <div className="week-chart">
              {days.map(d => {
                const ans = rulesData.answers?.[d] || {}
                const s = Object.values(ans).filter(v => v === 'Y').length
                const p = totalRules ? s / totalRules * 100 : 0
                const h = Math.max(4, p / 100 * 52)
                const c = p >= 80 ? 'g' : p >= 50 ? 'a' : 'r'
                const cv = p >= 80 ? 'var(--green)' : p >= 50 ? 'var(--accent2)' : 'var(--red)'
                return (
                  <div key={d} className="wc-col">
                    <div className={`wc-val ${c}`}>{s || ''}</div>
                    <div className={`wc-bar ${c}`} style={{ height: h }} />
                    <div className="wc-lbl">{d.slice(5)}</div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'flex-end' }}>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Date</label>
            <input type="date" className="form-input" style={{ width: 160 }} value={date} onChange={e => setDate(e.target.value)} />
          </div>
          <div className="flex-gap">
            <button className="btn btn-accent btn-sm" onClick={handleSave}>Save</button>
            <button className="btn btn-ghost btn-sm" style={{ color: 'var(--accent2)' }} onClick={() => setSectionModalOpen(true)}>+ Section</button>
          </div>
        </div>
      </div>

      <div className="rule-sections-grid">
        {(rulesData.sections || []).map(sec => {
          const secScore = sec.rules.filter(r => answers[r.id] === 'Y').length
          const sc = secScore === sec.rules.length ? 'var(--green)' : secScore > 0 ? 'var(--accent2)' : 'var(--text3)'
          return (
            <div key={sec.id} className="rule-section">
              <div className="rs-header">
                <div className="rs-name">{sec.name}</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div className="rs-score" style={{ color: sc }}>{secScore}/{sec.rules.length}</div>
                  <button className="btn btn-ghost btn-sm" style={{ padding: '3px 8px', color: 'var(--text3)' }} onClick={() => deleteSection(sec.id)}>✕</button>
                </div>
              </div>
              {sec.rules.map((r, ri) => (
                <div key={r.id} className="rule-item">
                  <div style={{ display: 'flex', alignItems: 'center', flex: 1 }}>
                    <span className="rule-num">{ri + 1}</span>
                    <span className="rule-text">{r.text}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <div className="yn-group">
                      <button className={`yn-btn${answers[r.id] === 'Y' ? ' y' : ''}`} onClick={() => setAnswer(r.id, 'Y')}>Y</button>
                      <button className={`yn-btn${answers[r.id] === 'N' ? ' n' : ''}`} onClick={() => setAnswer(r.id, 'N')}>N</button>
                    </div>
                    <button style={{ background: 'none', border: 'none', color: 'var(--text3)', cursor: 'pointer', fontSize: 11, padding: '2px 5px' }} onClick={() => deleteRule(sec.id, r.id)}>✕</button>
                  </div>
                </div>
              ))}
              <AddRuleRow onAdd={text => addRule(sec.id, text)} />
            </div>
          )
        })}
      </div>

      <Modal open={sectionModalOpen} onClose={() => setSectionModalOpen(false)} title="Add Section" maxWidth={460}>
        <div className="form-group">
          <label className="form-label">Section Name</label>
          <input className="form-input" placeholder="e.g. Pre-Trade Setup, Risk Management..." value={newSectionName} onChange={e => setNewSectionName(e.target.value)} onKeyDown={e => e.key === 'Enter' && addSection()} />
        </div>
        <div className="flex-gap" style={{ justifyContent: 'flex-end', marginTop: 8 }}>
          <button className="btn btn-ghost" onClick={() => setSectionModalOpen(false)}>Cancel</button>
          <button className="btn btn-accent" onClick={addSection}>Add Section</button>
        </div>
      </Modal>
    </div>
  )
}

function AddRuleRow({ onAdd }) {
  const [text, setText] = useState('')
  return (
    <div className="add-rule-row">
      <input className="form-input" placeholder="Add a rule..." style={{ padding: '6px 10px', fontSize: 12 }} value={text} onChange={e => setText(e.target.value)}
        onKeyDown={e => { if (e.key === 'Enter') { onAdd(text); setText('') } }} />
      <button className="btn btn-ghost btn-sm" onClick={() => { onAdd(text); setText('') }}>+ Add</button>
    </div>
  )
}
