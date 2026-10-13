'use client'

import { useEffect, useMemo, useState } from 'react'
import { ArrowLeft, Check, CircleDot, Database, Lightbulb, LockKeyhole, Play, Trophy, Unlock, X } from 'lucide-react'
import { case001Challenges, case001Meta, case001Report, case001Tables } from '@/lib/case-001-data'
import { datasetCounts, runSql } from '@/lib/duckdb-engine'

type Result = { columns: string[]; rows: Record<string, unknown>[] }
const storageKey = 'sqlam-dunk-case-001-progress'

function passes(index: number, result: Result) {
  if (!result.rows.length) return false
  const columns = result.columns.map((column) => column.toLowerCase())
  if (index === 0) return columns.includes('game_id') && columns.includes('game_date') && result.rows.length === 7 && result.rows.every((row, i) => String(row.game_id).startsWith('00415004') && (i === 0 || String(row.game_date) >= String(result.rows[i - 1].game_date)))
  if (index === 1) return columns.includes('game_id') && result.rows.every((row) => String(row.game_id).startsWith('00415004')) && result.rows.length === 7
  if (index === 2) return columns.includes('total_points') && result.rows.length >= 5
  if (index === 3) return columns.includes('first_name') && columns.includes('last_name') && columns.includes('team_name')
  if (index === 4) return columns.includes('impact') && result.rows.every((row) => ['positive', 'negative', 'even'].includes(String(row.impact)))
  return columns.includes('scoring_rank') && result.rows.length >= 5
}

export function CaseWorkspace({ onExit }: { onExit: () => void }) {
  const [active, setActive] = useState(0)
  const [query, setQuery] = useState(case001Challenges[0].starterQuery)
  const [solved, setSolved] = useState<number[]>([])
  const [result, setResult] = useState<Result | null>(null)
  const [error, setError] = useState('')
  const [feedback, setFeedback] = useState('')
  const [loading, setLoading] = useState(true)
  const challenge = case001Challenges[active]
  const allSolved = solved.length === case001Challenges.length
  const available = (index: number) => index === 0 || solved.includes(index - 1)

  useEffect(() => {
    try { setSolved(JSON.parse(localStorage.getItem(storageKey) || '[]')) } catch { setSolved([]) }
    runSql('SELECT 1').then(() => setLoading(false)).catch((e) => { setError(e instanceof Error ? e.message : String(e)); setLoading(false) })
  }, [])

  const selectChallenge = (index: number) => {
    if (!available(index)) return
    setActive(index); setQuery(case001Challenges[index].starterQuery); setResult(null); setError(''); setFeedback('')
  }
  const execute = async () => {
    setLoading(true); setError(''); setFeedback(''); setResult(null)
    try {
      const next = await runSql(query); setResult(next)
      if (passes(active, next)) {
        const updated = solved.includes(active) ? solved : [...solved, active]
        setSolved(updated); localStorage.setItem(storageKey, JSON.stringify(updated)); setFeedback(`Correct. ${challenge.evidence}`)
      } else setFeedback(`Not quite. ${challenge.hint}`)
    } catch (e) { setError(e instanceof Error ? e.message : String(e)) } finally { setLoading(false) }
  }
  const pct = Math.round((solved.length / case001Challenges.length) * 100)

  return <main className="min-h-screen bg-[#07111f] text-[#f6f1e8]"><header className="border-b border-white/10 bg-[#091624]"><div className="mx-auto flex max-w-[1500px] items-center justify-between px-5 py-4 lg:px-8"><button onClick={onExit} className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[.14em] text-white/50 hover:text-white"><ArrowLeft size={15} /> Exit case</button><div><p className="font-mono text-[10px] uppercase tracking-[.2em] text-[#f0b84a]">Case file / {case001Meta.id}</p><h1 className="mt-1 font-display text-xl font-bold">{case001Meta.title}</h1></div><div className="flex items-center gap-4 text-xs font-bold text-[#f0b84a]"><span>{solved.length * 150} XP</span><Trophy size={15} /> {solved.length}/6</div></div></header><div className="mx-auto grid max-w-[1500px] lg:grid-cols-[250px_1fr]"><aside className="border-b border-white/10 bg-[#091624] p-5 lg:min-h-[calc(100vh-73px)] lg:border-b-0 lg:border-r lg:p-6"><div className="flex items-center justify-between"><p className="eyebrow text-white/40">Investigation</p><span className="font-mono text-xs text-[#f0b84a]">{pct}%</span></div><div className="mt-3 h-1 bg-white/10"><div className="h-full bg-[#f28c28]" style={{ width: `${pct}%` }} /></div><nav className="mt-7 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-1" aria-label="Case challenges">{case001Challenges.map((item, index) => <button key={item.id} onClick={() => selectChallenge(index)} disabled={!available(index)} className={`flex items-center gap-3 border px-3 py-3 text-left text-xs ${active === index ? 'border-[#f28c28]/60 bg-[#f28c28]/10' : 'border-white/10'} ${!available(index) ? 'cursor-not-allowed opacity-35' : 'hover:border-white/30'}`}>{solved.includes(index) ? <Check size={15} className="text-[#f0b84a]" /> : available(index) ? <CircleDot size={15} className="text-[#f28c28]" /> : <LockKeyhole size={15} />}<span><span className="block font-mono text-[9px] text-white/35">0{item.id}</span><span className="font-semibold">{item.title}</span></span></button>)}</nav><div className="mt-8 border-t border-white/10 pt-6"><p className="eyebrow text-white/35">Dataset explorer</p><div className="mt-4 grid gap-2">{case001Tables.map((table) => <div key={table.name} className="flex items-center justify-between text-xs"><span className="font-mono text-white/60">{table.name}</span><span className="text-[#f0b84a]">{datasetCounts[table.name as keyof typeof datasetCounts]} rows</span></div>)}</div></div></aside><section className="min-w-0 p-5 sm:p-8 lg:p-12"><div className="mx-auto max-w-5xl"><div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[.2em] text-[#f28c28]"><Database size={14} /> Challenge 0{challenge.id} · {challenge.eyebrow}</div><h2 className="mt-4 max-w-3xl font-display text-4xl font-bold tracking-[-.05em] sm:text-5xl">{challenge.title}</h2><p className="mt-4 max-w-3xl text-sm leading-7 text-white/60">{challenge.prompt}</p><div className="mt-8 overflow-hidden border border-white/10 bg-[#0b1726]"><div className="flex items-center justify-between border-b border-white/10 px-4 py-3"><span className="font-mono text-[10px] text-white/35">SQL EDITOR</span><button onClick={execute} disabled={loading} className="inline-flex items-center gap-2 rounded-sm bg-[#f28c28] px-4 py-2 text-xs font-bold text-[#07111f] disabled:opacity-50"><Play size={13} /> {loading ? 'Running…' : 'Run Query'}</button></div><textarea value={query} onChange={(e) => setQuery(e.target.value)} className="min-h-44 w-full resize-y bg-transparent p-4 font-mono text-xs leading-6 text-[#f0b84a] outline-none" spellCheck={false} aria-label="SQL query editor" /></div>{error && <div className="mt-4 border border-red-400/40 bg-red-400/10 p-4 text-sm text-red-200"><div className="flex items-center gap-2 font-bold"><X size={15} /> SQL error</div><p className="mt-2 break-words font-mono text-xs">{error}</p></div>}{feedback && <div className={`mt-4 border p-4 text-sm ${feedback.startsWith('Correct') ? 'border-[#f0b84a]/40 bg-[#f0b84a]/10 text-[#f6d88f]' : 'border-white/15 bg-white/5 text-white/70'}`}><div className="flex items-center gap-2 font-bold">{feedback.startsWith('Correct') ? <Unlock size={15} /> : <Lightbulb size={15} />} {feedback}</div></div>}<div className="mt-8"><div className="flex items-center justify-between"><p className="eyebrow text-white/35">Query results</p><span className="font-mono text-xs text-white/40">{result?.rows.length ?? 0} rows</span></div>{result && <div className="mt-3 overflow-auto border border-white/10"><table className="min-w-full text-left text-xs"><thead className="bg-white/5"><tr>{result.columns.map((column) => <th key={column} className="whitespace-nowrap px-3 py-3 font-mono text-[#f0b84a]">{column}</th>)}</tr></thead><tbody>{result.rows.map((row, rowIndex) => <tr key={rowIndex} className="border-t border-white/10">{result.columns.map((column) => <td key={column} className="whitespace-nowrap px-3 py-2 text-white/65">{String(row[column] ?? '')}</td>)}</tr>)}</tbody></table></div>}</div><div className="mt-8 border border-[#f0b84a]/35 bg-[#0d1b2b] p-5"><div className="flex items-center gap-3">{solved.includes(active) ? <Unlock className="text-[#f0b84a]" /> : <LockKeyhole className="text-white/45" />}<h3 className="font-display text-2xl font-bold">{solved.includes(active) ? 'EVIDENCE UNLOCKED' : 'EVIDENCE LOCKED'}</h3></div>{solved.includes(active) ? <><p className="mt-4 font-semibold text-[#f0b84a]">{challenge.evidenceTitle}</p><p className="mt-2 text-sm leading-6 text-white/60">{challenge.evidence}</p><p className="mt-4 font-mono text-[10px] uppercase tracking-[.15em] text-white/35">Source: {challenge.source}</p></> : <p className="mt-4 text-sm text-white/50">Solve the challenge to reveal this evidence.</p>}</div>{allSolved && <article className="mt-8 border border-[#f0b84a]/40 bg-[#0d1b2b] p-6"><p className="eyebrow text-[#f0b84a]">Case report / complete</p><h2 className="mt-3 font-display text-3xl font-bold">The evidence holds.</h2><div className="mt-6 grid gap-4">{case001Report.map((item, index) => <p key={item} className="border-t border-white/10 pt-4 text-sm leading-6 text-white/65"><span className="mr-4 font-mono text-[#f28c28]">0{index + 1}</span>{item}</p>)}</div></article>}</div></section></div></main>
}
