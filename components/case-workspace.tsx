'use client'

import { useEffect, useRef, useState } from 'react'
import { ArrowLeft, Check, ChevronDown, CircleDot, Database, FileText, Lightbulb, LockKeyhole, Play, RotateCcw, Sparkles, Trophy } from 'lucide-react'
import { campaignChapters, case001Challenges, case001Meta, case001Report, case001Tables, type CaseChallenge } from '@/lib/case-001-data'
import { campaignChallenges } from '@/lib/campaign-data'
import { createSupabaseBrowserClient } from '@/lib/supabase-browser'
import type { AuthUser } from '@/components/auth-panel'

const allChallenges = campaignChallenges
import { runSql } from '@/lib/duckdb-engine'

type Result = { columns: string[]; rows: Record<string, unknown>[] }
type JournalEntry = { challenge: number; query: string; at: string }
type Career = { xp: number; completed: boolean; currency: number; hintsUsed: number; queriesRun: number }

const progressKey = 'sqlam-dunk-case-001-progress'
const careerKey = (userId: string) => `sqlam-dunk-career:${userId}`
const accountProgressKey = (userId: string) => `sqlam-dunk-case-001-progress:${userId}`
const emptyCareer: Career = { xp: 0, completed: false, currency: 0, hintsUsed: 0, queriesRun: 0 }
const hintCosts = [25, 60, 120]

function rewardForChallenge(challengeId: number) {
  if (challengeId <= 3) return 50
  if (challengeId <= 6) return 75
  if (challengeId <= 9) return 100
  return 125
}

const analystProfile = { name: 'Maya Carter', role: 'Junior Basketball Analytics Analyst', department: 'Cleveland Cavaliers Analysis — Retrospective Project', manager: 'Jordan Ellis, Senior Analytics Manager', objective: 'Reconstruct the 2016 NBA Finals from the public historical record.' }

function managerAssignment(challenge: CaseChallenge) {
  return { message: challenge.prompt, deliverable: challenge.prompt, concepts: challenge.eyebrow }
}

function normalizeValue(value: unknown) {
  if (value === null || value === undefined) return 'NULL'
  if (typeof value === 'number' || (typeof value === 'string' && value.trim() !== '' && Number.isFinite(Number(value)))) return `NUMBER:${Number(value).toFixed(6)}`
  return `TEXT:${String(value).trim()}`
}

function passes(challenge: CaseChallenge, result: Result, expected: Result) {
  const actualColumns = new Map(result.columns.map((column) => [column.toLowerCase(), column]))
  const expectedColumns = challenge.expectedOutput.columns.map((column) => column.toLowerCase())
  if (expectedColumns.some((column) => !actualColumns.has(column)) || result.rows.length === 0) return false
  if (challenge.expectedOutput.rows !== undefined && result.rows.length !== challenge.expectedOutput.rows) return false
  if (result.rows.length !== expected.rows.length) return false
  const key = (row: Record<string, unknown>) => expectedColumns.map((column) => normalizeValue(row[actualColumns.get(column) ?? column])).join('\\u001f')
  const actualCounts = new Map<string, number>()
  const expectedCounts = new Map<string, number>()
  result.rows.forEach((row) => actualCounts.set(key(row), (actualCounts.get(key(row)) ?? 0) + 1))
  expected.rows.forEach((row) => {
    const expectedKey = expectedColumns.map((column) => normalizeValue(row[expected.columns.find((name) => name.toLowerCase() === column) ?? column])).join('\\u001f')
    expectedCounts.set(expectedKey, (expectedCounts.get(expectedKey) ?? 0) + 1)
  })
  return actualCounts.size === expectedCounts.size && [...expectedCounts].every(([rowKey, count]) => actualCounts.get(rowKey) === count)
}

function ExpectedOutput({ challenge, result, open, onToggle, error }: { challenge: CaseChallenge; result: Result | null; open: boolean; onToggle: () => void; error: string }) {
  return <section className="mt-5 border border-white/10 bg-[#091624]/70"><button type="button" aria-expanded={open} onClick={onToggle} className="flex w-full items-center justify-between px-4 py-3 text-left text-[10px] font-bold uppercase tracking-[.16em] text-[#f0b84a]"><span>{open ? 'Hide Expected Output' : 'Show Expected Output'}</span><ChevronDown size={15} className={open ? 'rotate-180 transition' : 'transition'} /></button>{open && <div className="border-t border-white/10 px-4 py-4 text-xs text-white/55">{error ? <p className="text-[#ff9d7a]">Expected output unavailable: {error}</p> : !result ? <p>Loading the complete verified result…</p> : <div><div className="mb-3 flex flex-wrap gap-x-5 gap-y-1 text-[10px] uppercase tracking-[.12em]"><span><strong className="text-white/80">Columns:</strong> {result.columns.join(', ')}</span><span><strong className="text-white/80">Rows:</strong> {result.rows.length}</span></div><div className="max-h-[420px] max-w-full overflow-auto overscroll-contain"><table className="w-max min-w-full text-left font-mono text-[10px]"><caption className="sr-only">Complete expected result for {challenge.title}</caption><thead className="sticky top-0 bg-[#091624]"><tr>{result.columns.map((column) => <th key={column} scope="col" className="whitespace-nowrap border-b border-white/15 px-3 py-2 text-[#f0b84a]">{column}</th>)}</tr></thead><tbody>{result.rows.map((row, index) => <tr key={index} className="border-t border-white/10">{result.columns.map((column) => <td key={column} className="whitespace-nowrap px-3 py-2 text-white/70">{row[column] === null || row[column] === undefined ? <span className="italic text-white/35">NULL</span> : String(row[column])}</td>)}</tr>)}</tbody></table></div></div>}</div>}</section>
}

export function CaseWorkspace({ onExit, onActComplete, startIndex = 0, user }: { onExit: () => void; onActComplete?: (act: number) => void; startIndex?: number; user: AuthUser | null }) {
  const [active, setActive] = useState(startIndex)
  const [query, setQuery] = useState(allChallenges[startIndex].starterQuery)
  const [solved, setSolved] = useState<number[]>([])
  const [journal, setJournal] = useState<JournalEntry[]>([])
  const [result, setResult] = useState<Result | null>(null)
  const [expectedResult, setExpectedResult] = useState<Result | null>(null)
  const [expectedOpen, setExpectedOpen] = useState(false)
  const [expectedError, setExpectedError] = useState('')
  const [error, setError] = useState('')
  const [feedback, setFeedback] = useState('')
  const [hintLevel, setHintLevel] = useState(0)
  const [loading, setLoading] = useState(true)
  const [career, setCareer] = useState<Career>(emptyCareer)
  const [completionAct, setCompletionAct] = useState<number | null>(null)
  const completionNotified = useRef<number[]>([])
  const challenge = allChallenges[active]
  const chapter = campaignChapters.find((item) => item.challengeIds.some((id) => id === challenge.id)) ?? campaignChapters[0]
  const chapterSolved = chapter.challengeIds.filter((id) => solved.includes(id)).length
  const assignment = managerAssignment(challenge)
  const available = (index: number) => index === 0 || solved.includes(index - 1)
  const allSolved = allChallenges.every((item) => solved.includes(item.id - 1))
  const pct = Math.round((solved.filter((index) => index >= 0 && index < allChallenges.length).length / allChallenges.length) * 100)

  const [supabase, setSupabase] = useState<ReturnType<typeof createSupabaseBrowserClient>>(null)
  const displayedCareer = user ? career : emptyCareer
  const rank = displayedCareer.xp >= 750 ? 'Performance Analyst' : 'Data Explorer'

  useEffect(() => {
    const client = createSupabaseBrowserClient()
    setSupabase(client)
    setCareer(emptyCareer)
    setSolved([])
    setJournal([])
    if (user) {
      const saved = window.localStorage.getItem(accountProgressKey(user.id))
      const savedCareer = window.localStorage.getItem(careerKey(user.id))
      if (saved) {
      try {
        const progress = JSON.parse(saved)
        setSolved(Array.isArray(progress.solved) ? progress.solved : [])
        setJournal(Array.isArray(progress.journal) ? progress.journal : [])
      } catch { window.localStorage.removeItem(accountProgressKey(user.id)) }
    }
      if (savedCareer) {
        try { setCareer({ ...emptyCareer, ...JSON.parse(savedCareer) }) } catch { window.localStorage.removeItem(careerKey(user.id)) }
      }
    }
    if (client && user) {
      client.auth.getUser().then(({ data }) => {
        const metadata = data.user?.user_metadata?.sqlam_dunk_progress
        if (metadata) {
          setSolved(Array.isArray(metadata.solved) ? metadata.solved : [])
          setJournal(Array.isArray(metadata.journal) ? metadata.journal : [])
          setCareer({ ...emptyCareer, ...(metadata.career || {}) })
        }
      })
    }
    runSql('SELECT 1').then(() => setLoading(false)).catch((e) => { setError(e instanceof Error ? e.message : String(e)); setLoading(false) })
  }, [user])

  const persistLocalProgress = (nextSolved: number[], nextJournal: JournalEntry[], nextCareer: Career) => {
    if (!user) return
    window.localStorage.setItem(accountProgressKey(user.id), JSON.stringify({ solved: nextSolved, journal: nextJournal }))
    window.localStorage.setItem(careerKey(user.id), JSON.stringify(nextCareer))
  }

  const toggleExpectedOutput = async () => {
    const nextOpen = !expectedOpen
    setExpectedOpen(nextOpen)
    if (!nextOpen || expectedResult) return
    setExpectedError('')
    try { setExpectedResult(await runSql(challenge.solution, challenge.allowedThroughGame)) } catch (e) { setExpectedError(e instanceof Error ? e.message : String(e)) }
  }
  const selectChallenge = (index: number) => { if (!available(index)) return; setActive(index); setQuery(allChallenges[index].starterQuery); setResult(null); setExpectedResult(null); setExpectedOpen(false); setExpectedError(''); setError(''); setFeedback(''); setHintLevel(0) }
  const revealHint = async () => { const nextLevel = Math.min(3, hintLevel + 1); const cost = hintCosts[nextLevel - 1]; if (nextLevel === hintLevel || career.currency < cost) { setFeedback(`You need ${cost} coins for Hint ${nextLevel}. Solve questions to earn more.`); return } const nextCareer = { ...career, currency: career.currency - cost, hintsUsed: career.hintsUsed + 1 }; setHintLevel(nextLevel); setCareer(nextCareer); if (user && supabase) await supabase.auth.updateUser({ data: { sqlam_dunk_progress: { solved, journal, career: nextCareer } } }) }
  const continueGame = () => { const nextIndex = completionAct === 1 ? 3 : completionAct === 2 ? 6 : completionAct === 3 ? 9 : completionAct === 4 ? 12 : completionAct === 5 ? 15 : completionAct === 6 ? 18 : null; if (nextIndex === null) { setCompletionAct(null); return } setActive(nextIndex); setQuery(allChallenges[nextIndex].starterQuery); setResult(null); setExpectedResult(null); setExpectedOpen(false); setExpectedError(''); setError(''); setFeedback(''); setHintLevel(0); setCompletionAct(null) }
  const execute = async () => {
    setLoading(true); setError(''); setFeedback(''); setResult(null)
    try {
      const next = await runSql(query, challenge.allowedThroughGame)
      const expected = await runSql(challenge.solution, challenge.allowedThroughGame)
      const nextCareerRun = user ? { ...career, queriesRun: career.queriesRun + 1 } : emptyCareer
      const entry = { challenge: active, query, at: new Date().toISOString() }
      const nextJournal = [entry, ...journal.filter((item) => item.challenge !== active)].slice(0, 12)
      setCareer(nextCareerRun)
      setJournal(nextJournal)
      persistLocalProgress(solved, nextJournal, nextCareerRun)
      setResult(next)
      if (user && supabase) await supabase.auth.updateUser({ data: { sqlam_dunk_progress: { solved, journal: nextJournal, career: nextCareerRun } } })
      if (passes(challenge, next, expected)) {
        const wasAlreadySolved = solved.includes(active)
        const updated = wasAlreadySolved ? solved : [...solved, active]
        const nextCareer = user ? { ...nextCareerRun, xp: Math.max(career.xp, updated.length * 150 + (updated.length === allChallenges.length ? 100 : 0)), currency: career.currency + (wasAlreadySolved ? 0 : rewardForChallenge(challenge.id)), completed: updated.length === allChallenges.length } : nextCareerRun
        setSolved(updated); setCareer(nextCareer); persistLocalProgress(updated, nextJournal, nextCareer); if (user && supabase) await supabase.auth.updateUser({ data: { sqlam_dunk_progress: { solved: updated, journal: nextJournal, career: nextCareer } } }); const completedAct = updated.length === 3 ? 1 : updated.length === 6 ? 2 : updated.length === 9 ? 3 : updated.length === 12 ? 4 : updated.length === 15 ? 5 : updated.length === 18 ? 6 : updated.length === allChallenges.length ? 7 : 0
        if (!wasAlreadySolved && completedAct > 0 && !completionNotified.current.includes(completedAct)) { completionNotified.current = [...completionNotified.current, completedAct]; setCompletionAct(completedAct); onActComplete?.(completedAct) }
        setFeedback(`Evidence confirmed. ${challenge.evidence} ${challenge.basketballSignificance || ''} SQL concept: ${challenge.eyebrow}.`)
      } else setFeedback(`The query ran, but it does not answer this assignment yet. ${challenge.hint}`)
    } catch (e) { setError(e instanceof Error ? e.message : String(e)) } finally { setLoading(false) }
  }
  const resetProgress = async () => { setSolved([]); setJournal([]); setHintLevel(0); persistLocalProgress([], [], career); setResult(null); setError(''); setFeedback('Case 001 restarted. Your earned XP, coins, and profile statistics remain intact.'); if (user && supabase) await supabase.auth.updateUser({ data: { sqlam_dunk_progress: { solved: [], journal: [], career } } }); selectChallenge(0) }

  if (completionAct !== null) { const nextTitle = completionAct < 7 ? `Continue to Game ${completionAct + 1}` : 'Review final campaign'; const focus = chapter.title; return <main className="flex min-h-screen items-center justify-center bg-[#07111f] px-6 text-[#f6f1e8]"><section className="w-full max-w-2xl border border-[#f0b84a]/35 bg-[#0d1b2b] p-8 shadow-2xl sm:p-12"><p className="eyebrow text-[#f0b84a]">Game {completionAct} complete</p><h1 className="mt-3 font-display text-4xl font-bold tracking-[-.05em]">Evidence confirmed.</h1><p className="mt-5 max-w-xl text-sm leading-7 text-white/60">You completed the act and verified its capstone. Your next focus is {focus}.</p><div className="mt-8 flex flex-wrap gap-3"><button type="button" onClick={continueGame} className="inline-flex items-center gap-2 bg-[#f28c28] px-5 py-3 text-xs font-bold uppercase tracking-[.12em] text-white">{nextTitle} <ArrowLeft className="rotate-180" size={15} /></button><button type="button" onClick={() => setCompletionAct(null)} className="border border-white/15 px-5 py-3 text-xs font-bold uppercase tracking-[.12em] text-white/65">Review this act</button></div></section></main> }
  return <main className="case-workspace min-h-screen bg-[#07111f] text-[#f6f1e8]"><header className="sticky top-0 z-10 border-b border-white/10 bg-[#091624]/95 backdrop-blur"><div className="mx-auto flex max-w-[1680px] items-center justify-between gap-4 px-5 py-4 lg:px-8"><button type="button" onClick={onExit} className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[.14em] text-white/50 hover:text-white"><ArrowLeft size={15} /> Exit case</button><div className="min-w-0"><p className="font-mono text-[10px] uppercase tracking-[.2em] text-[#f0b84a]">Game {chapter.number} / Case file 001</p><h1 className="mt-1 truncate font-display text-xl font-bold">{case001Meta.title}</h1></div><div className="flex items-center gap-4 text-xs font-bold text-[#f0b84a]"><span>{displayedCareer.currency} coins</span><span>{displayedCareer.xp} XP</span><Trophy size={15} /><span>{solved.length}/{allChallenges.length}</span></div></div></header><div className="border-b border-white/10 bg-[#101e2e] px-5 py-3 lg:px-8"><div className="mx-auto flex max-w-[1680px] flex-col gap-2 sm:flex-row sm:items-center sm:justify-between"><div><p className="text-[10px] font-bold uppercase tracking-[.14em] text-[#f0b84a]">Game {chapter.number} · {chapter.title}</p><div className="mt-1 flex flex-wrap gap-1.5">{chapter.concepts.map((concept) => <span key={concept} className="rounded-sm border border-[#f28c28]/25 px-1.5 py-0.5 text-[9px] uppercase tracking-[.08em] text-white/55">{concept}</span>)}</div></div><div className="flex items-center gap-4 text-[10px] uppercase tracking-[.12em] text-white/45"><span>Campaign {solved.length}/{allChallenges.length}</span><span>Chapter {chapterSolved}/3</span></div></div></div><div className="mx-auto grid max-w-[1680px] lg:grid-cols-[220px_minmax(0,1fr)]">{!user && <div className="border-b border-[#f0b84a]/25 bg-[#f0b84a]/10 px-5 py-2 text-center text-[10px] font-bold uppercase tracking-[.12em] text-[#f0b84a] lg:col-span-2">Guest mode: you can run every query, but XP, coins, solved progress, and profile statistics are only credited after you log in.</div>}<aside className="border-b border-white/10 bg-[#091624] p-5 lg:min-h-[calc(100vh-73px)] lg:border-b-0 lg:border-r lg:p-5"><p className="eyebrow text-white/40">Career profile</p><div className="mt-5 border-l-2 border-[#f28c28] pl-3"><p className="font-mono text-[9px] uppercase tracking-[.14em] text-[#f0b84a]">{analystProfile.manager}</p><p className="mt-2 text-[10px] uppercase tracking-[.14em] text-[#f0b84a]">Assignment brief</p></div><p className="mt-2 font-display text-2xl font-bold text-[#f0b84a]">{rank}</p><p className="mt-1 text-xs text-white/40">{analystProfile.name} · {analystProfile.role}</p><p className="mt-3 text-[10px] leading-4 text-white/35">{analystProfile.department}<br />Manager: {analystProfile.manager}</p><div className="mt-5 grid grid-cols-2 gap-px border border-white/10 bg-white/10 text-center"><div className="bg-[#091624] px-2 py-3"><p className="font-display text-xl font-bold text-[#f0b84a]">{solved.length}</p><p className="mt-1 text-[9px] uppercase tracking-[.12em] text-white/35">Solved</p></div><div className="bg-[#091624] px-2 py-3"><p className="font-display text-xl font-bold text-[#f0b84a]">{career.currency}</p><p className="mt-1 text-[9px] uppercase tracking-[.12em] text-white/35">Coins</p></div><div className="bg-[#091624] px-2 py-3"><p className="font-display text-xl font-bold text-[#f0b84a]">{career.hintsUsed}</p><p className="mt-1 text-[9px] uppercase tracking-[.12em] text-white/35">Hints</p></div></div><div className="mt-5 flex items-center justify-between text-[10px] uppercase tracking-[.15em] text-white/40"><span>Campaign progress</span><span>{pct}%</span></div><div className="mt-2 h-1 bg-white/10"><div className="h-full bg-[#f28c28] transition-all" style={{ width: `${pct}%` }} /></div><nav className="mt-7 flex flex-col gap-2" aria-label="Investigation challenges">{allChallenges.map((item, index) => <button key={item.id} onClick={() => selectChallenge(index)} disabled={!available(index)} className={`flex items-center gap-3 border px-3 py-3 text-left text-xs ${active === index ? 'border-[#f28c28]/60 bg-[#f28c28]/10' : 'border-white/10'} ${!available(index) ? 'cursor-not-allowed opacity-35' : 'hover:border-white/30'}`}>{solved.includes(index) ? <Check size={15} className="text-[#f0b84a]" /> : available(index) ? <CircleDot size={15} className="text-[#f28c28]" /> : <LockKeyhole size={15} />}<span><span className="block font-mono text-[9px] text-white/35">0{item.id}</span><span className="font-semibold">{item.title}</span></span></button>)}</nav><div className="mt-7 border-t border-white/10 pt-5"><p className="eyebrow text-white/35">Investigation milestones</p><p className="mt-3 text-xs leading-5 text-white/40">Complete each challenge in order to unlock the next piece of evidence.</p></div><button type="button" onClick={resetProgress} className="mt-7 inline-flex items-center gap-2 text-[10px] uppercase tracking-[.12em] text-white/35 hover:text-white"><RotateCcw size={13} /> Replay case</button></aside><section className="min-w-0 p-5 sm:p-8 lg:p-12"><div className="mx-auto max-w-5xl"><div className="grid gap-6 lg:grid-cols-[1fr_280px]"><div><p className="eyebrow text-[#f28c28]">{challenge.eyebrow}</p><h2 className="mt-3 font-display text-4xl font-bold tracking-[-.05em] sm:text-5xl">{challenge.title}</h2><p className="mt-5 max-w-2xl text-base leading-7 text-white/65"></p><div className="mt-6 border-l-2 border-[#f0b84a] bg-[#0d1b2b] p-5"><p className="font-mono text-[10px] uppercase tracking-[.18em] text-[#f0b84a]">Manager question</p><p className="mt-3 text-sm leading-7 text-white/75">&quot;{assignment.message}&quot;</p><p className="mt-2 text-sm leading-6 text-white/65">{''}</p></div></div><aside className="border border-white/10 bg-[#0d1b2b] p-5"><div className="flex items-center gap-2 text-[#f0b84a]"><Database size={15} /><p className="eyebrow">Evidence board</p></div><div className="mt-4 flex flex-col gap-3">{case001Tables.map((table) => <div key={table.name} className="border-b border-white/10 pb-3"><p className="font-mono text-xs text-white/80">{table.name}</p><p className="mt-1 text-[10px] text-white/40">{table.rows} rows · {table.description}</p></div>)}</div></aside></div><div className="mt-8 grid gap-6 xl:grid-cols-[1fr_300px]"><div><div className="overflow-hidden border border-white/10 bg-[#091624]"><div className="flex items-center justify-between border-b border-white/10 px-4 py-3"><span className="font-mono text-[10px] uppercase tracking-[.15em] text-white/40">SQL console / DuckDB</span><button type="button" onClick={execute} disabled={loading} className="inline-flex items-center gap-2 bg-[#f28c28] px-4 py-2 text-[10px] font-bold uppercase tracking-[.12em] text-white disabled:opacity-50"><Play size={13} fill="currentColor" /> {loading ? 'Running' : 'Run query'}</button></div><textarea value={query} onChange={(event) => setQuery(event.target.value)} spellCheck={false} className="min-h-64 w-full resize-y bg-[#07111f] p-5 font-mono text-xs leading-6 text-[#f6f1e8] outline-none" aria-label="SQL query editor" /></div>{error && <p role="alert" className="mt-4 border border-red-400/30 bg-red-400/10 p-4 font-mono text-xs text-red-200">{error}</p>}{feedback && <p className={`mt-4 border p-4 text-sm leading-6 ${feedback.startsWith('Evidence') ? 'border-[#f0b84a]/40 bg-[#f0b84a]/10 text-[#f0d38a]' : 'border-[#f28c28]/30 bg-[#f28c28]/10 text-white/70'}`}>{feedback}</p>}<div className="mt-5 flex flex-wrap items-center gap-3"><button type="button" onClick={revealHint} className="inline-flex items-center gap-2 border border-[#f0b84a]/40 px-3 py-2 text-[10px] font-bold uppercase tracking-[.12em] text-[#f0b84a] hover:bg-[#f0b84a]/10"><Lightbulb size={14} /> {hintLevel >= 3 ? 'All hints unlocked' : `Unlock hint ${hintLevel + 1} · ${hintCosts[hintLevel]} coins`}</button>{hintLevel > 0 && <p className="text-xs leading-5 text-white/60">{hintLevel === 1 ? challenge.hint : hintLevel === 2 ? challenge.structureHint : challenge.syntaxHint || challenge.structureHint}</p>}</div>{result && <div className="mt-5 overflow-x-auto border border-white/10"><table className="min-w-full text-left font-mono text-[10px]"><thead className="bg-white/5"><tr>{result.columns.map((column) => <th key={column} className="whitespace-nowrap px-3 py-3 text-[#f0b84a]">{column}</th>)}</tr></thead><tbody>{result.rows.map((row, index) => <tr key={index} className="border-t border-white/10">{result.columns.map((column) => <td key={column} className="whitespace-nowrap px-3 py-2 text-white/60">{String(row[column] ?? '')}</td>)}</tr>)}</tbody></table></div>}</div><aside className="flex flex-col gap-5"><div className="border border-white/10 bg-[#0d1b2b] p-5"><div className="flex items-center justify-between"><p className="eyebrow text-[#f0b84a]">Analyst hint</p><Lightbulb size={16} className="text-[#f0b84a]" /></div><p className="mt-3 text-sm leading-6 text-white/60">{hintLevel === 0 ? 'Stuck? Reveal a nudge. Hints never reduce your XP.' : hintLevel === 1 ? challenge.hint : hintLevel === 2 ? challenge.structureHint : challenge.starterQuery}</p><button type="button" onClick={revealHint} disabled={hintLevel === 3} className="mt-4 text-[10px] font-bold uppercase tracking-[.14em] text-[#f28c28] disabled:text-white/25">{hintLevel === 0 ? 'Reveal conceptual hint' : hintLevel === 1 ? 'Show SQL structure' : hintLevel === 2 ? 'Reveal approach' : 'All guidance revealed'}</button></div><div className="border border-white/10 bg-[#0d1b2b] p-5"><div className="flex items-center gap-2"><FileText size={15} className="text-[#f28c28]" /><p className="eyebrow">Query journal</p></div>{journal.filter((entry) => entry.challenge === active).length === 0 ? <p className="mt-4 text-xs leading-5 text-white/35">Successful and attempted queries for this challenge will appear here.</p> : journal.filter((entry) => entry.challenge === active).map((entry) => <p key={entry.at} className="mt-4 line-clamp-4 whitespace-pre-wrap font-mono text-[10px] text-white/50">{entry.query}</p>)}</div></aside></div>{allSolved && <article className="mt-10 border border-[#f0b84a]/40 bg-[#0d1b2b] p-6 sm:p-8"><div className="flex items-start justify-between gap-5"><div><p className="eyebrow text-[#f0b84a]">Case report / complete</p><h2 className="mt-3 font-display text-4xl font-bold tracking-[-.05em]">The evidence holds.</h2></div><Sparkles className="text-[#f0b84a]" /></div><div className="mt-7 flex flex-col gap-4">{case001Report.map((item, index) => <div key={item} className="flex gap-4 border-t border-white/10 pt-4"><span className="font-mono text-xs text-[#f28c28]">0{index + 1}</span><p className="text-sm leading-6 text-white/65">{item}</p></div>)}</div><div className="mt-7 border-t border-white/10 pt-5"><p className="font-mono text-[10px] uppercase tracking-[.14em] text-[#f0b84a]">Promotion earned · {rank}</p><p className="mt-3 text-sm text-white/55">You reconstructed the comeback from the supplied records. The next act will ask you to find patterns beneath the headline.</p></div></article>}</div></section></div><ExpectedOutput challenge={challenge} result={expectedResult} open={expectedOpen} onToggle={toggleExpectedOutput} error={expectedError} /></main>
}

export default CaseWorkspace
