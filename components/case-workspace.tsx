'use client'

import { useEffect, useRef, useState } from 'react'
import { ArrowLeft, Check, ChevronDown, CircleDot, Database, FileText, Lightbulb, LockKeyhole, Play, RotateCcw, Sparkles, Target, Trophy } from 'lucide-react'
import { case001Meta, case001Report, case001Tables, type CaseChallenge } from '@/lib/case-001-data'
import { campaignChallenges, campaignChapters, chapterForChallenge } from '@/lib/campaign-data'
import { evaluateAttempt, formatSort, mentionedFutureGame, QueryRejectedError, scopedCountSql, type QueryResult } from '@/lib/campaign-sql'
import { createSupabaseBrowserClient } from '@/lib/supabase-browser'
import { runSql } from '@/lib/duckdb-engine'
import type { AuthUser } from '@/components/auth-panel'

const allChallenges = campaignChallenges

type JournalEntry = { challenge: number; query: string; at: string }
type Career = { xp: number; completed: boolean; currency: number; hintsUsed: number; queriesRun: number }
type Feedback = { tone: 'success' | 'retry' | 'notice'; title: string; body: string; lesson?: string }

const progressKey = 'sqlam-dunk-case-001-progress'
const careerKey = 'sqlam-dunk-career'
const emptyCareer: Career = { xp: 0, completed: false, currency: 0, hintsUsed: 0, queriesRun: 0 }
const hintCosts = [0, 25, 60]
const hintLabels = ['Concept nudge', 'Query structure', 'Fill-in-the-blanks outline']

const chapterGifs: Record<number, string> = {
  1: '/gifs/game-1.gif',
  2: '/gifs/game-2.gif',
  3: '/gifs/game-3.gif',
  4: '/gifs/game-4.gif',
  5: '/gifs/game-5.gif',
  6: '/gifs/game-6.gif',
  7: '/gifs/game-7.gif',
}

function rewardForChallenge(challengeId: number) {
  if (challengeId <= 3) return 50
  if (challengeId <= 6) return 75
  if (challengeId <= 9) return 100
  return 125
}

const analystProfile = { name: 'Maya Carter', role: 'Junior Basketball Analytics Analyst', department: 'Cleveland Cavaliers Analysis — Retrospective Project', manager: 'Jordan Ellis, Senior Analytics Manager', objective: 'Reconstruct the 2016 NBA Finals from the public historical record.' }

function sanitizeSolved(value: unknown) {
  return Array.isArray(value) ? Array.from(new Set(value.filter((index): index is number => Number.isInteger(index) && index >= 0 && index < allChallenges.length))).sort((a, b) => a - b) : []
}

function hintText(challenge: CaseChallenge, level: number) {
  return level === 1 ? challenge.hint : level === 2 ? challenge.structureHint : challenge.syntaxHint
}

function ResultTable({ result, caption }: { result: QueryResult; caption: string }) {
  if (result.rows.length === 0) return <p data-testid="query-result-empty" className="px-4 py-3 text-xs text-[#8a9cb0]">The query ran and returned no rows.</p>
  return <div className="max-h-[420px] max-w-full overflow-auto overscroll-contain"><table data-testid="query-result-table" className="w-max min-w-full text-left font-mono text-[11px]"><caption className="sr-only">{caption}</caption><thead className="sticky top-0 bg-[#0d1624]"><tr>{result.columns.map((column) => <th key={column} scope="col" className="whitespace-nowrap border-b border-[#22354a] px-3 py-2 text-[#f0a830]">{column}</th>)}</tr></thead><tbody>{result.rows.map((row, index) => <tr key={index} className="border-t border-[#22354a] even:bg-white/[.02]">{result.columns.map((column) => <td key={column} className={`whitespace-nowrap px-3 py-2 text-[#f7f3e9]/80 ${typeof row[column] === 'number' ? 'text-right tabular-nums' : ''}`}>{row[column] === null || row[column] === undefined ? <span className="italic text-[#8a9cb0]">NULL</span> : String(row[column])}</td>)}</tr>)}</tbody></table></div>
}

function ExpectedOutput({ challenge, result, open, onToggle, error }: { challenge: CaseChallenge; result: QueryResult | null; open: boolean; onToggle: () => void; error: string }) {
  const sortBy = challenge.expectedOutput.sortBy
  return <section className="evidence-panel mt-5" data-testid="expected-output-panel"><div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3"><div className="text-[10px] uppercase tracking-[.12em] text-[#8a9cb0]"><p><strong className="text-[#f0a830]">Expected columns:</strong> <span className="font-mono normal-case tracking-normal text-[#f7f3e9]/80">{challenge.expectedOutput.columns.join(', ')}</span></p><p className="mt-1"><strong className="text-[#f0a830]">Rows:</strong> {challenge.expectedOutput.rows}{sortBy ? <> · <strong className="text-[#f0a830]">Order:</strong> <span className="font-mono normal-case tracking-normal text-[#f7f3e9]/80">{formatSort(sortBy)}</span></> : ' · Any row order'}</p></div><button type="button" aria-expanded={open} onClick={onToggle} data-testid="expected-output-toggle-button" className="inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-[.16em] text-[#f0a830]"><span>{open ? 'Hide expected output' : 'Show expected output'}</span><ChevronDown size={15} className={open ? 'rotate-180 transition' : 'transition'} /></button></div>{open && <div className="border-t border-[#22354a] text-xs text-[#8a9cb0]">{error ? <p className="px-4 py-3 text-[#e05a2b]">Expected output unavailable: {error}</p> : !result ? <p className="px-4 py-3">Loading the verified result…</p> : <ResultTable result={result} caption={`Expected result for ${challenge.title}`} />}</div>}</section>
}

export function CaseWorkspace({ onExit, onGameComplete, user }: { onExit: () => void; onGameComplete?: (game: number) => void; user: AuthUser | null }) {
  const [active, setActive] = useState(0)
  const [query, setQuery] = useState(allChallenges[0].starterQuery)
  const [solved, setSolved] = useState<number[]>([])
  const [journal, setJournal] = useState<JournalEntry[]>([])
  const [result, setResult] = useState<QueryResult | null>(null)
  const [expectedResult, setExpectedResult] = useState<QueryResult | null>(null)
  const [expectedOpen, setExpectedOpen] = useState(false)
  const [expectedError, setExpectedError] = useState('')
  const [error, setError] = useState('')
  const [feedback, setFeedback] = useState<Feedback | null>(null)
  const [hintLevel, setHintLevel] = useState(0)
  const [loading, setLoading] = useState(true)
  const [career, setCareer] = useState<Career>(emptyCareer)
  const [completionGame, setCompletionGame] = useState<number | null>(null)
  const [scopeCounts, setScopeCounts] = useState<Record<string, unknown> | null>(null)
  const completionNotified = useRef<number[]>([])
  const challenge = allChallenges[active]
  const chapter = chapterForChallenge(challenge)
  const chapterSolved = chapter.challengeIds.filter((id) => solved.includes(id - 1)).length
  const available = (index: number) => index === 0 || solved.includes(index - 1)
  const allSolved = allChallenges.every((item) => solved.includes(item.id - 1))
  const pct = Math.round((solved.length / allChallenges.length) * 100)
  const rank = career.xp >= 750 ? 'Performance Analyst' : 'Data Explorer'

  const [supabase, setSupabase] = useState<ReturnType<typeof createSupabaseBrowserClient>>(null)

  useEffect(() => {
    let cancelled = false
    const client = createSupabaseBrowserClient()
    setSupabase(client)
    setActive(0)
    setQuery(allChallenges[0].starterQuery)
    setSolved([])
    setJournal([])
    setCareer(emptyCareer)
    setCompletionGame(null)
    setHintLevel(0)
    if (client && user) {
      client.auth.getUser().then(({ data }) => {
        if (cancelled) return
        const metadata = data.user?.user_metadata?.sqlam_dunk_progress
        if (metadata) {
          setSolved(sanitizeSolved(metadata.solved))
          setJournal(Array.isArray(metadata.journal) ? metadata.journal : [])
          setCareer({ ...emptyCareer, ...(metadata.career || {}) })
        }
      })
    }
    runSql('SELECT 1').then(() => { if (!cancelled) setLoading(false) }).catch((e) => { if (!cancelled) { setError(e instanceof Error ? e.message : String(e)); setLoading(false) } })
    return () => { cancelled = true }
  }, [user])

  useEffect(() => {
    let cancelled = false
    setScopeCounts(null)
    runSql(scopedCountSql, challenge.allowedThroughGame).then((counts) => { if (!cancelled) setScopeCounts(counts.rows[0] ?? null) }).catch(() => undefined)
    return () => { cancelled = true }
  }, [challenge.allowedThroughGame])

  const persistLocalProgress = (nextSolved: number[], nextJournal: JournalEntry[], nextCareer: Career) => {
    window.localStorage.setItem(progressKey, JSON.stringify({ solved: nextSolved, journal: nextJournal }))
    window.localStorage.setItem(careerKey, JSON.stringify(nextCareer))
  }

  const openChallenge = (index: number) => {
    setActive(index); setQuery(allChallenges[index].starterQuery); setResult(null); setExpectedResult(null); setExpectedOpen(false); setExpectedError(''); setError(''); setFeedback(null); setHintLevel(0)
  }
  const selectChallenge = (index: number) => { if (available(index)) openChallenge(index) }

  const toggleExpectedOutput = async () => {
    const nextOpen = !expectedOpen
    setExpectedOpen(nextOpen)
    if (!nextOpen || expectedResult) return
    setExpectedError('')
    try { setExpectedResult(await runSql(challenge.solution, challenge.allowedThroughGame)) } catch (e) { setExpectedError(e instanceof Error ? e.message : String(e)) }
  }

  const revealHint = async () => {
    if (hintLevel >= 3) return
    const nextLevel = hintLevel + 1
    const cost = hintCosts[nextLevel - 1]
    if (nextLevel > 1 && !user) { setFeedback({ tone: 'notice', title: 'Log in to buy hints', body: 'The first hint is free. Log in to earn coins and unlock paid hints for your own profile.' }); return }
    if (career.currency < cost) { setFeedback({ tone: 'notice', title: `Hint ${nextLevel} costs ${cost} coins`, body: `You have ${career.currency}. Solve challenges to earn more coins, or use the expected output to check your shape.` }); return }
    const nextCareer = { ...career, currency: career.currency - cost, hintsUsed: career.hintsUsed + 1 }
    setHintLevel(nextLevel); setCareer(nextCareer); persistLocalProgress(solved, journal, nextCareer)
    if (user && supabase) await supabase.auth.updateUser({ data: { sqlam_dunk_progress: { solved, journal, career: nextCareer } } })
  }

  const continueGame = () => {
    const nextIndex = completionGame !== null && completionGame < campaignChapters.length ? campaignChapters[completionGame].challengeIds[0] - 1 : null
    setCompletionGame(null)
    if (nextIndex !== null && available(nextIndex)) openChallenge(nextIndex)
  }

  const execute = async () => {
    setLoading(true); setError(''); setFeedback(null); setResult(null)
    try {
      const next = await runSql(query, challenge.allowedThroughGame)
      const expected = await runSql(challenge.solution, challenge.allowedThroughGame)
      const nextCareerRun = { ...career, queriesRun: career.queriesRun + 1 }
      const entry = { challenge: active, query, at: new Date().toISOString() }
      const nextJournal = [entry, ...journal.filter((item) => item.challenge !== active)].slice(0, 12)
      setCareer(nextCareerRun)
      setJournal(nextJournal)
      persistLocalProgress(solved, nextJournal, nextCareerRun)
      setResult(next)
      const verdict = evaluateAttempt(query, next, expected, challenge.expectedOutput, challenge.requiredConcepts)
      if (verdict.ok) {
        const wasAlreadySolved = solved.includes(active)
        const updated = wasAlreadySolved ? solved : [...solved, active].sort((a, b) => a - b)
        const nextCareer = user ? { ...nextCareerRun, xp: Math.max(career.xp, updated.length * 150 + (updated.length === allChallenges.length ? 100 : 0)), currency: career.currency + (wasAlreadySolved ? 0 : rewardForChallenge(challenge.id)), completed: updated.length === allChallenges.length } : nextCareerRun
        setSolved(updated); setCareer(nextCareer); persistLocalProgress(updated, nextJournal, nextCareer)
        if (user && supabase) await supabase.auth.updateUser({ data: { sqlam_dunk_progress: { solved: updated, journal: nextJournal, career: nextCareer } } })
        setFeedback({ tone: 'success', title: 'Evidence confirmed.', body: challenge.explanation, lesson: challenge.learningObjective })
        const gameComplete = chapter.challengeIds.every((id) => updated.includes(id - 1))
        if (!wasAlreadySolved && gameComplete && !completionNotified.current.includes(chapter.number)) { completionNotified.current = [...completionNotified.current, chapter.number]; setCompletionGame(chapter.number); onGameComplete?.(chapter.number) }
      } else {
        const futureGame = next.rows.length === 0 ? mentionedFutureGame(query, challenge.allowedThroughGame) : null
        setFeedback({ tone: 'retry', title: 'Not quite yet.', body: futureGame ? `Game ${futureGame} is not in the case file yet: evidence is available through Game ${challenge.allowedThroughGame} only.` : verdict.reason })
        if (user && supabase) await supabase.auth.updateUser({ data: { sqlam_dunk_progress: { solved, journal: nextJournal, career: nextCareerRun } } })
      }
    } catch (e) {
      const message = e instanceof Error ? e.message : String(e)
      setError(e instanceof QueryRejectedError ? message : `DuckDB could not run this query. ${message}`)
    } finally { setLoading(false) }
  }

  const resetProgress = async () => {
    setSolved([]); setJournal([]); persistLocalProgress([], [], career); completionNotified.current = []
    if (user && supabase) await supabase.auth.updateUser({ data: { sqlam_dunk_progress: { solved: [], journal: [], career } } })
    openChallenge(0)
    setFeedback({ tone: 'notice', title: 'Case 001 restarted.', body: 'Your earned XP, coins, and profile statistics remain intact.' })
  }

  if (completionGame !== null) {
    const nextChapter = campaignChapters[completionGame]
    return <main className="flex min-h-screen items-center justify-center bg-[#07111f] px-6 text-[#f6f1e8]"><section className="w-full max-w-2xl border border-[#f0b84a]/35 bg-[#0d1b2b] p-8 shadow-2xl sm:p-12"><p className="eyebrow text-[#f0b84a]">Game {completionGame} complete · {campaignChapters[completionGame - 1].date}</p><h1 className="mt-3 font-display text-4xl font-bold tracking-[-.05em]">Evidence confirmed.</h1><p className="mt-5 max-w-xl text-sm leading-7 text-[#f6f1e8]/70">{nextChapter ? <>You closed the Game {completionGame} file. Game {nextChapter.number} ({nextChapter.date}) is now unlocked and added to the evidence. Next focus: {nextChapter.title}.</> : 'You reconstructed all seven games of the 2016 NBA Finals from the box score.'}</p><div className="mt-8 flex flex-wrap gap-3">{nextChapter && <button type="button" onClick={continueGame} className="inline-flex items-center gap-2 bg-[#f28c28] px-5 py-3 text-xs font-bold uppercase tracking-[.12em] text-white">Continue to Game {nextChapter.number} <ArrowLeft className="rotate-180" size={15} /></button>}<button type="button" onClick={() => setCompletionGame(null)} className="border border-[#f28c28]/30 px-5 py-3 text-xs font-bold uppercase tracking-[.12em] text-[#f6f1e8]/70">{nextChapter ? 'Review this game' : 'Review final report'}</button></div></section></main>
  }

  const journalEntries = journal.filter((entry) => entry.challenge === active)
  const nextHintCost = hintCosts[hintLevel]

  return <main className="case-workspace workspace-grid min-h-screen text-[#f7f3e9]" data-testid="case-workspace">
    <header className="sticky top-0 z-10 border-b-2 border-[#22354a] bg-[#0d1624]/95 backdrop-blur"><div className="mx-auto flex max-w-[1680px] items-center justify-between gap-4 px-5 py-4 lg:px-8"><button type="button" onClick={onExit} data-testid="exit-case-button" className="inline-flex items-center gap-2 border-2 border-[#22354a] bg-[#132032] px-3 py-2 text-[9px] font-bold uppercase tracking-[.15em] text-[#f7f3e9] shadow-[3px_3px_0_#070c14]"><ArrowLeft size={13} /> Exit case</button><div className="min-w-0"><p className="font-mono text-[9px] uppercase tracking-[.2em] text-[#f0a830]">Case file 001 · Game {chapter.number} · {chapter.date}</p><h1 data-testid="workspace-title" className="mt-1 truncate font-display text-3xl font-black uppercase tracking-[-.02em] text-[#f7f3e9]">{case001Meta.title}</h1></div><div className="flex items-center gap-3 text-[9px] font-black text-[#f7f3e9] sm:gap-4"><span data-testid="user-coins-display" className="text-[#f0a830]">{career.currency} COINS</span><span data-testid="user-xp-display">{career.xp} XP</span><Trophy size={15} className="text-[#e05a2b]" /><span data-testid="solved-count-display">{solved.length}/{allChallenges.length}</span></div></div></header>
    <div className="border-b border-slate-700/50 bg-[#020617]/80 px-5 py-3 lg:px-8"><div className="mx-auto flex max-w-[1680px] flex-col gap-2 sm:flex-row sm:items-center sm:justify-between"><div><p className="text-[9px] font-bold uppercase tracking-[.15em] text-slate-300/60">Game {chapter.number} · {chapter.title}</p><div className="mt-1 flex flex-wrap gap-1.5">{chapter.concepts.map((concept) => <span key={concept} className="rounded-lg border border-slate-600/20 bg-slate-700 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-[.08em] text-slate-300">{concept}</span>)}</div></div><div className="flex items-center gap-4 text-[9px] font-black text-white"><span>EVIDENCE THROUGH GAME {challenge.allowedThroughGame}</span><span>CAMPAIGN {solved.length}/{allChallenges.length}</span><span>GAME {chapter.number}: {chapterSolved}/3</span></div></div></div>
    <div className="mx-auto grid max-w-[1680px] lg:grid-cols-[240px_minmax(0,1fr)]">
      {!user && <div className="bg-white/5 border border-white/10 px-5 py-3 text-center text-[9px] font-bold uppercase tracking-[.1em] text-slate-300 rounded-lg shadow-sm lg:col-span-2">Guest mode: your solved challenges are saved on this device, but XP and coins are only credited after you log in.</div>}
      <aside className="border-r-2 border-[#22354a] bg-[#0d1624] p-6 lg:min-h-[calc(100vh-73px)] lg:p-6" data-testid="career-sidebar">
        <p className="eyebrow text-white/60">CAREER PROFILE</p><p className="mt-3 font-display text-2xl font-black text-white">{rank}</p><p className="mt-1 text-xs text-slate-300/70">{analystProfile.name} · {analystProfile.role}</p><p className="mt-3 text-[9px] leading-4 text-slate-400/50">{analystProfile.department}<br />Manager: {analystProfile.manager}</p>
        <div className="mt-5 grid grid-cols-3 gap-4 bg-[#1a1a1a] text-center"><div className="bg-[#1a1a1a] px-2 py-3 shadow-[2px_2px_0px_#000000]"><p className="font-display text-xl font-black text-white">{solved.length}</p><p className="mt-1 text-[9px] uppercase tracking-[.12em] text-white/70">SOLVED</p></div><div className="bg-[#1a1a1a] px-2 py-3 shadow-[2px_2px_0px_#000000]"><p className="font-display text-xl font-black text-white">{career.currency}</p><p className="mt-1 text-[9px] uppercase tracking-[.12em] text-white/70">COINS</p></div><div className="bg-[#1a1a1a] px-2 py-3 shadow-[2px_2px_0px_#000000]"><p className="font-display text-xl font-black text-white">{career.hintsUsed}</p><p className="mt-1 text-[9px] uppercase tracking-[.12em] text-white/70">HINTS</p></div></div>
        <div className="mt-6 flex items-center justify-between text-[9px] uppercase tracking-[.1em] text-slate-300"><span>Campaign progress</span><span>{pct}%</span></div><div className="mt-2 h-1.5 bg-white/10 rounded-full overflow-hidden"><div className="h-full bg-white shadow-[0_0_12px_rgba(255,255,255,0.1)]" style={{ width: `${pct}%` }} /></div>
        <nav className="mt-7 flex flex-col gap-4" aria-label="Investigation challenges">{campaignChapters.map((item) => { const firstIndex = item.challengeIds[0] - 1; const unlocked = available(firstIndex); const done = item.challengeIds.every((id) => solved.includes(id - 1)); return <div key={item.number}><div className={`flex items-center justify-between text-[9px] font-black uppercase tracking-[.14em] ${unlocked ? 'text-[#f7f3e9]' : 'text-[#8a9cb0]/40'}`}><span>GAME {item.number} · {item.date.replace(', 2016', '')}</span>{done ? <Check size={13} className="text-[#4ade80]" /> : !unlocked && <LockKeyhole size={12} className="text-[#8a9cb0]/40" />}</div><div className="mt-2 flex flex-col gap-2">{item.challengeIds.map((id) => { const index = id - 1; const entry = allChallenges[index]; return <button key={id} type="button" onClick={() => selectChallenge(index)} disabled={!available(index)} data-testid={`challenge-nav-item-${id}`} aria-current={active === index ? 'step' : undefined} className={`flex items-center gap-3 border-2 border-[#22354a] px-3 py-2 text-left text-xs font-black ${active === index ? 'active-nav' : ''} ${!available(index) ? 'cursor-not-allowed opacity-35' : ''}`}>{solved.includes(index) ? <Check size={15} className="shrink-0 text-[#4ade80]" /> : available(index) ? <CircleDot size={15} className="shrink-0 text-[#f0a830]" /> : <LockKeyhole size={15} className="shrink-0 text-[#8a9cb0]" />}<span><span className="block font-mono text-[9px] text-[#8a9cb0]">Q{entry.id}</span><span className="font-bold text-[#f7f3e9]">{entry.title}</span></span></button> })}</div></div> })}</nav>
        <div className="mt-7 border-t border-white/10 pt-5"><p className="eyebrow text-slate-300/50">Investigation rules</p><p className="mt-3 text-xs leading-5 text-slate-300">Solve each challenge to unlock the next. Each completed game adds the next game's box score to the evidence.</p></div>
        <button type="button" onClick={resetProgress} className="mt-7 inline-flex items-center gap-2 bg-white text-[#020617] px-3 py-1 text-[9px] font-bold uppercase tracking-[.1em] rounded-lg shadow-sm hover:bg-slate-200 active:scale-95 transition-all"><RotateCcw size={13} /> Replay case</button>
      </aside>
      <section className="min-w-0 p-5 sm:p-8 lg:p-12"><div className="mx-auto max-w-5xl">
        <div className="grid gap-6 lg:grid-cols-[1fr_280px]"><div><p className="eyebrow text-[#f0a830]">Q{challenge.id} · {challenge.eyebrow}</p><h2 data-testid="challenge-title" className="mt-3 font-display text-5xl font-black uppercase tracking-[-.04em] text-[#f7f3e9] sm:text-6xl">{challenge.title}</h2><div className="tactile-panel scanlines mt-6 flex flex-col gap-4 p-5 lg:flex-row lg:gap-6"><div className="h-32 w-32 flex-shrink-0 overflow-hidden border-2 border-[#f0a830] bg-[#070c14] lg:h-40 lg:w-40"><img src="/gifs/manager.gif" alt="Manager" className="h-full w-full object-cover" loading="lazy" /></div><div className="flex-1 space-y-3"><p className="font-mono text-[9px] uppercase tracking-[.2em] text-[#f0a830]">Manager briefing / Jordan Ellis</p><p className="mt-3 text-sm leading-7 text-[#f7f3e9]">&ldquo;{challenge.briefing}&rdquo;</p></div></div><div className="paper-note mt-1 p-4"><p className="relative z-10 flex items-center gap-2 font-mono text-[9px] uppercase tracking-[.18em] text-[#132032]"><Target size={13} /> SQL objective</p><p className="relative z-10 mt-2 text-sm leading-6 text-[#132032]">{challenge.learningObjective}</p></div></div>
          <aside className="bg-[#1a1a1a] p-5 shadow-[3px_3px_0px_#000000]"><div className="flex items-center gap-2 text-white"><Database size={15} /><p className="eyebrow">EVIDENCE BOARD</p></div><p className="mt-2 text-[9px] uppercase tracking-[.12em] text-slate-300/70">GAMES 1{challenge.allowedThroughGame > 1 ? `–${challenge.allowedThroughGame}` : ''} UNLOCKED</p><div className="mt-4 flex flex-col gap-3">{case001Tables.map((table) => <div key={table.name} className="pb-3"><p className="font-mono text-xs text-[#ffffff]/80">{table.name}</p><p className="mt-1 text-[9px] text-white/60">{scopeCounts ? `${scopeCounts[table.name] ?? table.rows} ${Number(scopeCounts[table.name]) === 1 ? 'row' : 'rows'}` : '…'} IN SCOPE · {table.description}</p></div>)}</div></aside></div>
        <div className="mt-4 grid gap-4 xl:grid-cols-[1fr_300px]"><div>
          <div className="evidence-panel overflow-hidden" data-testid="sql-console"><div className="flex items-center justify-between border-b border-[#22354a] px-4 py-3"><span className="font-mono text-[9px] uppercase tracking-[.15em] text-[#f0a830]">SQL console / DuckDB · read only</span><div className="flex items-center gap-2"><button type="button" onClick={execute} disabled={loading} data-testid="run-query-button" className="inline-flex items-center gap-2 border-2 border-[#e05a2b] bg-[#e05a2b] px-3 py-2 text-[9px] font-black text-white shadow-[3px_3px_0_#070c14] disabled:cursor-not-allowed disabled:opacity-50"><Play size={13} fill="currentColor" /> {loading ? 'RUNNING' : 'RUN QUERY'}</button><div className="flex-shrink-0"><img src={solved.includes(active) ? '/gifs/maya_happy.gif' : '/gifs/maya.gif'} alt="Maya" className="h-14 w-14 rounded-full border-2 border-[#f0a830]/60 shadow-md" loading="lazy" /></div></div></div><textarea value={query} onChange={(event) => setQuery(event.target.value)} onKeyDown={(event) => { if ((event.metaKey || event.ctrlKey) && event.key === 'Enter') { event.preventDefault(); if (!loading) void execute() } }} spellCheck={false} data-testid="sql-editor-textarea" className="min-h-64 w-full resize-y bg-[#070c14] p-5 font-mono text-xs leading-6 text-[#f7f3e9] outline-none focus-visible:ring-2 focus-visible:ring-[#f0a830]/60" aria-label="SQL query editor" /></div>
          {error && <div role="alert" className="mt-4 border border-red-500/30 bg-red-500/10 rounded-xl p-4"><p className="text-[9px] font-bold uppercase tracking-[.1em] text-red-400">Query error</p><p className="mt-2 whitespace-pre-wrap font-mono text-xs leading-5 text-slate-300">{error}</p></div>}
          {feedback && <div role="status" data-testid="query-feedback" className={`mt-4 border-2 p-4 text-sm leading-6 shadow-[3px_3px_0_#070c14] ${feedback.tone === 'success' ? 'border-[#4ade80] bg-[#4ade80]/10 text-[#f7f3e9]' : 'border-[#f0a830] bg-[#f0a830]/10 text-[#f7f3e9]'}`}><p className="font-bold">{feedback.title}</p><p className="mt-1">{feedback.body}</p>{feedback.lesson && <p className="mt-3 border-t border-[#22354a] pt-3 text-[9px] text-[#8a9cb0]"><strong className="uppercase tracking-[.12em] font-bold text-[#f0a830]">SQL concept · {challenge.eyebrow}:</strong> {feedback.lesson}</p>}</div>}
          {result && <section className="mt-5 border border-white/10 bg-slate-900 rounded-xl shadow-sm"><p className="border-b border-slate-700/50 bg-slate-900/50 px-4 py-2 text-[9px] uppercase tracking-[.14em] text-slate-300/60">Your result · {result.rows.length} row{result.rows.length === 1 ? '' : 's'}</p><ResultTable result={result} caption="Your query result" /></section>}
          <ExpectedOutput challenge={challenge} result={expectedResult} open={expectedOpen} onToggle={toggleExpectedOutput} error={expectedError} />
        </div>
        <aside className="flex flex-col gap-5"><div className="tactile-panel p-5" data-testid="hints-panel"><div className="flex items-center justify-between"><p className="eyebrow text-[#f0a830]">Analyst hints</p><Lightbulb size={16} className="text-[#e05a2b]" /></div>{hintLevel === 0 ? <p className="mt-3 text-sm leading-6 text-[#8a9cb0]">Stuck? Hints go from a concept nudge to the query structure to a fill-in-the-blanks outline. None of them hands you the answer.</p> : <ol className="mt-3 flex flex-col gap-3">{Array.from({ length: hintLevel }, (_, index) => <li key={index}><p className="font-mono text-[9px] uppercase tracking-[.14em] text-[#f0a830]">{hintLabels[index]}</p><p className={`mt-1 text-xs leading-5 text-[#f7f3e9]/80 ${index === 2 ? 'whitespace-pre-wrap font-mono text-[11px]' : ''}`}>{hintText(challenge, index + 1)}</p></li>)}</ol>}<button type="button" onClick={revealHint} disabled={hintLevel >= 3} data-testid="reveal-hint-button" className="mt-4 border-2 border-[#22354a] px-3 py-2 text-[9px] font-bold uppercase tracking-[.1em] text-[#f0a830] disabled:text-[#8a9cb0]">{hintLevel >= 3 ? 'All hints revealed' : `Reveal ${hintLabels[hintLevel].toLowerCase()}${nextHintCost ? ` · ${nextHintCost} coins` : ' · free'}`}</button></div>
          <div className="tactile-panel p-5" data-testid="query-journal"><div className="flex items-center gap-2 text-[#f7f3e9]"><FileText size={15} className="text-[#e05a2b]" /><p className="eyebrow text-[#f0a830]">Query journal</p></div>{journalEntries.length === 0 ? <p className="mt-4 text-xs leading-5 text-[#8a9cb0]">Your latest attempt for this challenge will appear here.</p> : journalEntries.map((entry) => <p key={entry.at} className="mt-4 line-clamp-4 whitespace-pre-wrap font-mono text-[9px] text-[#8a9cb0]">{entry.query}</p>)}</div></aside></div>
        {allSolved && <article className="mt-10 bg-[#1a1a1a] p-6 sm:p-8 shadow-[4px_4px_0px_#000000]"><div className="flex items-start justify-between gap-5"><div><p className="eyebrow text-white/60">CASE REPORT / COMPLETE</p><h2 className="mt-3 font-display text-4xl font-black tracking-[-.05em] text-[#ffffff] drop-shadow-[2px_2px_0px_#000000]">The evidence holds.</h2></div><Sparkles className="text-white" /></div><div className="mt-7 flex flex-col gap-4">{case001Report.map((item, index) => <div key={item} className="flex gap-4 border-t border-white/10 pt-4"><span className="font-mono text-[9px] text-slate-300">0{index + 1}</span><p className="text-sm leading-6 text-slate-300">{item}</p></div>)}</div><div className="mt-7 border-t border-white/10 pt-5"><p className="font-mono text-[9px] uppercase tracking-[.1em] text-slate-300/60">Promotion earned · {rank}</p><p className="mt-3 text-sm text-slate-300">You reconstructed all seven games of the 2016 Finals from the box score.</p></div></article>}
      </div></section>
    </div>
  </main>
}

export default CaseWorkspace
