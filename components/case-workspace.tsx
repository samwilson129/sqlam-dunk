'use client'

import { useEffect, useRef, useState } from 'react'
import { ArrowLeft, Check, ChevronDown, CircleDot, Database, FileText, Lightbulb, LockKeyhole, Play, RotateCcw, Sparkles, Target, Trophy } from 'lucide-react'
import { case001Meta, case001Report, case001Tables, type CaseChallenge } from '@/lib/case-001-data'
import { campaignChallenges, campaignChapters, chapterForChallenge } from '@/lib/campaign-data'
import { evaluateAttempt, formatSort, mentionedFutureGame, QueryRejectedError, scopedCountSql, type QueryResult } from '@/lib/campaign-sql'
import { createSupabaseBrowserClient } from '@/lib/supabase-browser'
import { runSql } from '@/lib/duckdb-engine'
import { gameTapes } from '@/lib/game-tapes'
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

function ResultTable({ result, caption, testId }: { result: QueryResult; caption: string; testId: string }) {
  if (result.rows.length === 0) return <p data-testid={`${testId}-empty`} className="px-4 py-4 font-serif text-lg italic text-smoke">The query ran and returned no rows.</p>
  return <div className="max-h-[420px] max-w-full overflow-auto overscroll-contain"><table data-testid={testId} className="w-max min-w-full text-left font-mono text-[12px]"><caption className="sr-only">{caption}</caption><thead className="sticky top-0 bg-paper2"><tr>{result.columns.map((column) => <th key={column} scope="col" className="whitespace-nowrap border-b-2 border-ink px-3 py-2 text-[11px] font-semibold uppercase tracking-[.08em]">{column}</th>)}</tr></thead><tbody>{result.rows.map((row, index) => <tr key={index} className="border-b border-dashed border-ink/30 even:bg-paper2/40">{result.columns.map((column) => <td key={column} className={`whitespace-nowrap px-3 py-2 ${typeof row[column] === 'number' ? 'text-right tabular-nums' : ''}`}>{row[column] === null || row[column] === undefined ? <span className="italic text-smoke">NULL</span> : String(row[column])}</td>)}</tr>)}</tbody></table></div>
}

function ExpectedOutput({ challenge, result, open, onToggle, error }: { challenge: CaseChallenge; result: QueryResult | null; open: boolean; onToggle: () => void; error: string }) {
  const sortBy = challenge.expectedOutput.sortBy
  return <section className="mt-6 border-2 border-dashed border-ink bg-sheet/70" data-testid="expected-output-panel"><div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3"><div className="font-mono text-[11px] uppercase tracking-[.1em]"><p><strong className="text-riso">Expected columns:</strong> <span className="normal-case tracking-normal">{challenge.expectedOutput.columns.join(', ')}</span></p><p className="mt-1"><strong className="text-riso">Rows:</strong> {challenge.expectedOutput.rows}{sortBy ? <> · <strong className="text-riso">Order:</strong> <span className="normal-case tracking-normal">{formatSort(sortBy)}</span></> : ' · Any row order'}</p></div><button type="button" aria-expanded={open} onClick={onToggle} data-testid="expected-output-toggle-button" className="btn-paper !px-3 !py-2 !text-[11px]"><span>{open ? 'Hide expected output' : 'Show expected output'}</span><ChevronDown size={15} className={open ? 'rotate-180 transition-transform' : 'transition-transform'} /></button></div>{open && <div className="slide-in border-t-2 border-dashed border-ink text-sm">{error ? <p className="px-4 py-3 text-riso">Expected output unavailable: {error}</p> : !result ? <p className="px-4 py-3 font-serif italic">Loading the verified result…</p> : <ResultTable result={result} caption={`Expected result for ${challenge.title}`} testId="expected-result-table" />}</div>}</section>
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
    const doneChapter = campaignChapters[completionGame - 1]
    return <main className="paper-page grain min-h-screen px-5 py-8 sm:px-10" data-testid="game-complete-screen">
      <div className="mx-auto max-w-6xl">
        <div className="flex items-center justify-between gap-3 bg-ink px-4 py-2 font-mono text-[10px] uppercase tracking-[.2em] text-paper"><span>Extra edition</span><span className="hidden sm:inline">Case 001 · {case001Meta.title}</span><span>{doneChapter.date}</span></div>
        <div className="double-rule mt-3" />
        <div className="grid gap-10 pt-10 md:grid-cols-[1.1fr_.9fr] md:items-center">
          <div>
            <span className="stamp stamp-animate !text-base text-riso">Game {completionGame} · Final</span>
            <h1 className="mt-6 font-anton text-[clamp(3.6rem,10vw,8rem)] uppercase leading-[.84]">Evidence<br /><span className="marker">confirmed.</span></h1>
            <p className="drop-cap mt-7 max-w-xl font-serif text-[1.4rem] leading-[1.4]">{nextChapter ? <>You closed the Game {completionGame} file. Game {nextChapter.number} ({nextChapter.date}) is now unlocked and added to the evidence. Next focus: {nextChapter.title}.</> : 'You reconstructed all seven games of the 2016 NBA Finals from the box score.'}</p>
            <div className="mt-9 flex flex-wrap gap-4">
              {nextChapter && <button type="button" onClick={continueGame} data-testid="continue-next-game-button" className="btn-ink">Continue to Game {nextChapter.number} <ArrowLeft className="rotate-180" size={15} /></button>}
              <button type="button" onClick={() => setCompletionGame(null)} data-testid="review-game-button" className="btn-paper">{nextChapter ? 'Review this game' : 'Review final report'}</button>
            </div>
          </div>
          <figure className="photo tape rotate-[3deg]"><div className="bg-gold"><img src={gameTapes[completionGame]} alt={`Game ${completionGame} pixel-art tape`} className="aspect-[4/3] object-cover" /></div><figcaption>Game {completionGame} tape — {doneChapter.title}.</figcaption></figure>
        </div>
      </div>
    </main>
  }

  const journalEntries = journal.filter((entry) => entry.challenge === active)
  const nextHintCost = hintCosts[hintLevel]
  const isSolved = solved.includes(active)

  return <main className="case-workspace paper-page grain min-h-screen" data-testid="case-workspace">
    <header className="sticky top-0 z-20 border-b-[3px] border-ink bg-paper/95 backdrop-blur-sm">
      <div className="mx-auto flex max-w-[1680px] flex-wrap items-center justify-between gap-3 px-4 py-3 lg:px-8">
        <button type="button" onClick={onExit} data-testid="exit-case-button" className="btn-paper !px-3 !py-2.5"><ArrowLeft size={14} /> Exit case</button>
        <div className="order-3 w-full min-w-0 sm:order-none sm:w-auto sm:flex-1 sm:px-4">
          <p className="font-mono text-[10px] uppercase tracking-[.2em] text-smoke">Case file 001 · Game {chapter.number} · {chapter.date}</p>
          <h1 data-testid="workspace-title" className="truncate font-anton text-2xl uppercase leading-none sm:text-[2rem]">{case001Meta.title}</h1>
        </div>
        <div className="flex items-stretch gap-2 font-mono text-[11px] font-semibold uppercase">
          <span data-testid="user-coins-display" className="border-2 border-ink bg-gold px-2.5 py-1.5 shadow-[3px_3px_0_#16130f]">{career.currency} coins</span>
          <span data-testid="user-xp-display" className="border-2 border-ink bg-sheet px-2.5 py-1.5 shadow-[3px_3px_0_#16130f]">{career.xp} XP</span>
          <span data-testid="solved-count-display" className="flex items-center gap-1.5 border-2 border-ink bg-ink px-2.5 py-1.5 text-paper shadow-[3px_3px_0_#e0412a]"><Trophy size={13} className="text-gold" />{solved.length}/{allChallenges.length}</span>
        </div>
      </div>
      <div className="border-t-2 border-ink bg-sheet/80">
        <div className="mx-auto flex max-w-[1680px] flex-col gap-2 px-4 py-2 sm:flex-row sm:items-center sm:justify-between lg:px-8">
          <div className="flex flex-wrap items-center gap-2"><span className="font-serif text-base italic">Game {chapter.number} · {chapter.title}</span>{chapter.concepts.map((concept) => <span key={concept} className="chip">{concept}</span>)}</div>
          <div className="flex flex-wrap gap-x-4 gap-y-1 font-mono text-[10px] uppercase tracking-[.12em] text-smoke"><span>Evidence through game {challenge.allowedThroughGame}</span><span>Campaign {solved.length}/{allChallenges.length}</span><span>Game {chapter.number}: {chapterSolved}/3</span></div>
        </div>
      </div>
    </header>

    {!user && <div data-testid="guest-mode-notice" className="halftone-gold border-b-2 border-ink bg-gold/60 px-4 py-2 text-center font-mono text-[11px] font-semibold uppercase tracking-[.1em]">Guest mode: your solved challenges are saved on this device, but XP and coins are only credited after you log in.</div>}

    <div className="mx-auto grid max-w-[1680px] lg:grid-cols-[300px_minmax(0,1fr)]">
      <aside data-testid="career-sidebar" className="border-b-[3px] border-ink bg-paper2/50 p-5 lg:border-b-0 lg:border-r-[3px]">
        <div className="ink-card overflow-hidden">
          <div className="flex items-center justify-between bg-ink px-3 py-1.5 font-mono text-[10px] uppercase tracking-[.2em] text-paper"><span>Press pass</span><span className="text-gold">Career profile</span></div>
          <div className="flex items-start gap-3 p-4">
            <img src="/gifs/maya.gif" alt="Maya Carter" className="pixelated h-16 w-16 shrink-0 border-2 border-ink bg-court/20 object-cover" />
            <div className="min-w-0"><p data-testid="career-rank" className="font-anton text-2xl uppercase leading-none">{rank}</p><p className="mt-1 text-[13px] font-semibold leading-tight">{analystProfile.name}</p><p className="text-[12px] leading-tight text-smoke">{analystProfile.role}</p></div>
          </div>
          <p className="border-t-2 border-dashed border-ink/40 px-4 py-2 text-[11px] leading-4 text-smoke">{analystProfile.department}<br />Manager: {analystProfile.manager}</p>
          <div className="grid grid-cols-3 divide-x-2 divide-ink border-t-2 border-ink text-center">
            {[['Solved', solved.length, 'career-solved-stat'], ['Coins', career.currency, 'career-coins-stat'], ['Hints', career.hintsUsed, 'career-hints-stat']].map(([label, value, id]) => <div key={label} data-testid={id} className="px-2 py-2.5"><p className="font-anton text-2xl leading-none">{value}</p><p className="mt-1 font-mono text-[9px] uppercase tracking-[.14em] text-smoke">{label}</p></div>)}
          </div>
        </div>

        <div className="mt-6" data-testid="campaign-progress">
          <div className="flex items-center justify-between font-mono text-[10px] font-semibold uppercase tracking-[.14em]"><span>Campaign progress</span><span>{pct}%</span></div>
          <div className="mt-2 grid grid-cols-[repeat(21,minmax(0,1fr))] gap-[3px]" aria-hidden>{allChallenges.map((item, index) => <span key={item.id} className={`h-3.5 border border-ink ${solved.includes(index) ? 'bg-ink' : index === active ? 'bg-riso' : 'bg-sheet'}`} />)}</div>
        </div>

        <nav className="mt-6 flex max-h-[360px] flex-col gap-5 overflow-y-auto pr-1 lg:max-h-none lg:overflow-visible" aria-label="Investigation challenges">{campaignChapters.map((item) => { const firstIndex = item.challengeIds[0] - 1; const unlocked = available(firstIndex); const done = item.challengeIds.every((id) => solved.includes(id - 1)); return <div key={item.number} data-testid={`game-group-${item.number}`}>
          <div className={`flex items-center justify-between border-b-2 border-ink pb-1 font-mono text-[10px] font-semibold uppercase tracking-[.16em] ${unlocked ? '' : 'opacity-40'}`}><span>Game {item.number} · {item.date.replace(', 2016', '')}</span>{done ? <span className="flex items-center gap-1 text-court"><Check size={13} /> Final</span> : !unlocked && <LockKeyhole size={12} />}</div>
          <div className="flex flex-col">{item.challengeIds.map((id) => { const index = id - 1; const entry = allChallenges[index]; return <button key={id} type="button" onClick={() => selectChallenge(index)} disabled={!available(index)} data-testid={`challenge-nav-item-${id}`} aria-current={active === index ? 'step' : undefined} className="nav-row flex w-full items-center gap-3 border-b border-dashed border-ink/35 px-2 py-2.5 text-left">
            <span className="nav-q w-8 shrink-0 font-mono text-[11px] font-semibold text-riso">Q{entry.id}</span>
            <span className="min-w-0 flex-1 text-[13px] font-semibold leading-snug">{entry.title}</span>
            {solved.includes(index) ? <Check size={15} className="shrink-0" /> : available(index) ? <CircleDot size={14} className="shrink-0" /> : <LockKeyhole size={14} className="shrink-0" />}
          </button> })}</div>
        </div> })}</nav>

        <div className="mt-7 border-l-4 border-riso pl-3"><p className="font-mono text-[10px] font-semibold uppercase tracking-[.16em]">Investigation rules</p><p className="mt-2 font-serif text-[15px] italic leading-snug">Solve each challenge to unlock the next. Each completed game adds the next game&apos;s box score to the evidence.</p></div>
        <button type="button" onClick={resetProgress} data-testid="replay-case-button" className="btn-paper mt-6 !px-3 !py-2.5 !text-[11px]"><RotateCcw size={13} /> Replay case</button>
      </aside>

      <section className="min-w-0 px-4 py-7 sm:px-8 lg:px-12 lg:py-10"><div className="mx-auto max-w-6xl">
        <div className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_300px]">
          <div className="min-w-0">
            <div className="flex flex-wrap items-end justify-between gap-4 border-b-[3px] border-ink pb-4">
              <div className="min-w-0"><p className="font-mono text-[11px] font-semibold uppercase tracking-[.2em] text-riso">Q{challenge.id} · {challenge.eyebrow}</p><h2 data-testid="challenge-title" className="mt-2 font-anton text-[clamp(2.6rem,6vw,5rem)] uppercase leading-[.9]">{challenge.title}</h2></div>
              <span key={isSolved ? 'solved' : 'open'} data-testid="challenge-status-stamp" className={`stamp ${isSolved ? 'stamp-animate text-court' : 'text-riso'}`}>{isSolved ? 'Solved' : 'Open file'}</span>
            </div>
            <article className="mt-7 grid gap-6 md:grid-cols-[170px_minmax(0,1fr)]">
              <figure className="photo tape w-40 -rotate-2 self-start md:w-auto"><div className="bg-court/15"><img src="/gifs/manager.gif" alt="Manager" className="aspect-square object-cover" loading="lazy" /></div><figcaption>Jordan Ellis, Sr. Manager</figcaption></figure>
              <div className="ink-card lined p-5 sm:p-6">
                <p className="font-mono text-[10px] font-semibold uppercase tracking-[.2em] text-smoke">Memo · Manager briefing</p>
                <p data-testid="manager-briefing" className="mt-3 font-serif text-[1.3rem] leading-[1.45]">&ldquo;{challenge.briefing}&rdquo;</p>
              </div>
            </article>
            <div className="mt-6 flex gap-3 border-2 border-ink bg-gold/35 p-4 shadow-[4px_4px_0_#16130f]" data-testid="sql-objective"><Target size={18} className="mt-0.5 shrink-0 text-riso" /><div><p className="font-mono text-[10px] font-semibold uppercase tracking-[.18em]">SQL objective</p><p className="mt-1 text-[15px] leading-6">{challenge.learningObjective}</p></div></div>
          </div>
          <aside className="flex flex-col gap-6">
            <figure className="photo rotate-[1.5deg]" data-testid="game-tape"><div className="bg-gold"><img src={gameTapes[chapter.number]} alt={`Game ${chapter.number} pixel-art tape`} className="aspect-[4/3] object-cover" loading="lazy" /></div><figcaption>Game {chapter.number} tape — {chapter.title}.</figcaption></figure>
            <div className="ink-card p-4" data-testid="evidence-board">
              <div className="flex items-center gap-2 border-b-2 border-ink pb-2"><Database size={15} className="text-riso" /><p className="font-mono text-[11px] font-semibold uppercase tracking-[.16em]">Evidence board</p></div>
              <p className="mt-2 font-mono text-[10px] uppercase tracking-[.12em] text-smoke">Games 1{challenge.allowedThroughGame > 1 ? `–${challenge.allowedThroughGame}` : ''} unlocked</p>
              <div className="mt-3 flex flex-col">{case001Tables.map((table) => <div key={table.name} className="border-b border-dashed border-ink/30 py-2 last:border-0"><div className="flex items-baseline justify-between gap-2"><p className="font-mono text-[13px] font-semibold">{table.name}</p><p className="font-mono text-[11px] text-riso">{scopeCounts ? `${scopeCounts[table.name] ?? table.rows} ${Number(scopeCounts[table.name]) === 1 ? 'row' : 'rows'}` : '…'}</p></div><p className="mt-0.5 text-[12px] text-smoke">In scope · {table.description}</p></div>)}</div>
            </div>
          </aside>
        </div>

        <div className="mt-10 grid gap-8 xl:grid-cols-[minmax(0,1fr)_300px]"><div className="min-w-0">
          <div className="terminal overflow-hidden" data-testid="sql-console">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b-2 border-paper/15 px-4 py-3">
              <div className="flex items-center gap-2"><span className="h-3 w-3 rounded-full bg-riso" /><span className="h-3 w-3 rounded-full bg-gold" /><span className="h-3 w-3 rounded-full bg-paper/40" /><span className="ml-2 font-mono text-[10px] uppercase tracking-[.16em] text-paper/70">SQL console / DuckDB · read only</span></div>
              <div className="flex items-center gap-3"><img src={isSolved ? '/gifs/maya_happy.gif' : '/gifs/maya.gif'} alt="Maya" data-testid="maya-avatar" className="pixelated h-12 w-12 border-2 border-gold bg-paper/10 object-cover" loading="lazy" /><button type="button" onClick={execute} disabled={loading} data-testid="run-query-button" className={`btn-riso !py-2.5 !shadow-[4px_4px_0_#f2b632] ${loading ? 'pulse-run' : ''}`}><Play size={13} fill="currentColor" /> {loading ? 'Running' : 'Run query'}</button></div>
            </div>
            <textarea value={query} onChange={(event) => setQuery(event.target.value)} onKeyDown={(event) => { if ((event.metaKey || event.ctrlKey) && event.key === 'Enter') { event.preventDefault(); if (!loading) void execute() } }} spellCheck={false} data-testid="sql-editor-textarea" className="block min-h-[260px] w-full resize-y border-0 p-5 font-mono text-[13px] leading-6 outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-gold" aria-label="SQL query editor" />
            <div className="flex items-center justify-between border-t-2 border-paper/15 px-4 py-2 font-mono text-[10px] uppercase tracking-[.14em] text-paper/50"><span>⌘ / Ctrl + Enter to run</span><span>{career.queriesRun} queries run</span></div>
          </div>
          {error && <div role="alert" data-testid="query-error" className="slide-in mt-6 border-2 border-riso bg-sheet p-4 shadow-[5px_5px_0_#e0412a]"><p className="font-mono text-[11px] font-semibold uppercase tracking-[.14em] text-riso">Query error</p><p className="mt-2 whitespace-pre-wrap font-mono text-[12px] leading-5">{error}</p></div>}
          {feedback && <div role="status" data-testid="query-feedback" className={`slide-in mt-6 border-2 border-ink p-5 shadow-[6px_6px_0_#16130f] ${feedback.tone === 'success' ? 'bg-court text-paper' : feedback.tone === 'retry' ? 'bg-[#f6d3c9]' : 'bg-gold/50'}`}><p className="font-anton text-3xl uppercase leading-none">{feedback.title}</p><p className="mt-3 font-serif text-[1.15rem] leading-[1.45]">{feedback.body}</p>{feedback.lesson && <p className={`mt-4 border-t-2 border-dashed pt-3 text-[13px] leading-5 ${feedback.tone === 'success' ? 'border-paper/40' : 'border-ink/40'}`}><strong className="font-mono text-[11px] uppercase tracking-[.12em] text-gold">SQL concept · {challenge.eyebrow}:</strong> {feedback.lesson}</p>}</div>}
          {result && <section className="slide-in ink-card mt-6 overflow-hidden" data-testid="query-result-section"><p className="flex items-center justify-between bg-ink px-4 py-2 font-mono text-[10px] uppercase tracking-[.16em] text-paper"><span>Your result · box score</span><span className="text-gold">{result.rows.length} row{result.rows.length === 1 ? '' : 's'}</span></p><ResultTable result={result} caption="Your query result" testId="query-result-table" /></section>}
          <ExpectedOutput challenge={challenge} result={expectedResult} open={expectedOpen} onToggle={toggleExpectedOutput} error={expectedError} />
        </div>
        <aside className="flex flex-col gap-6">
          <div className="ink-card -rotate-[.6deg] p-5" data-testid="hints-panel">
            <div className="flex items-center justify-between border-b-2 border-ink pb-2"><p className="font-mono text-[11px] font-semibold uppercase tracking-[.16em]">Scouting notes · hints</p><Lightbulb size={16} className="text-riso" /></div>
            {hintLevel === 0 ? <p className="mt-3 font-serif text-[1.05rem] italic leading-snug">Stuck? Hints go from a concept nudge to the query structure to a fill-in-the-blanks outline. None of them hands you the answer.</p> : <ol className="mt-3 flex flex-col gap-4">{Array.from({ length: hintLevel }, (_, index) => <li key={index} data-testid={`hint-${index + 1}`} className="slide-in"><p className="font-mono text-[10px] font-semibold uppercase tracking-[.14em] text-riso">{index + 1}. {hintLabels[index]}</p><p className={`mt-1 text-[13px] leading-5 ${index === 2 ? 'whitespace-pre-wrap border-2 border-ink bg-ink p-2 font-mono text-[11px] text-paper' : ''}`}>{hintText(challenge, index + 1)}</p></li>)}</ol>}
            <button type="button" onClick={revealHint} disabled={hintLevel >= 3} data-testid="reveal-hint-button" className="btn-paper mt-5 w-full !px-3 !py-2.5 !text-[10px]">{hintLevel >= 3 ? 'All hints revealed' : `Reveal ${hintLabels[hintLevel].toLowerCase()}${nextHintCost ? ` · ${nextHintCost} coins` : ' · free'}`}</button>
          </div>
          <div className="ink-card lined rotate-[.5deg] p-5" data-testid="query-journal">
            <div className="flex items-center gap-2 border-b-2 border-ink pb-2"><FileText size={15} className="text-riso" /><p className="font-mono text-[11px] font-semibold uppercase tracking-[.16em]">Query journal</p></div>
            {journalEntries.length === 0 ? <p className="mt-3 font-serif text-[1.05rem] italic leading-snug text-smoke">Your latest attempt for this challenge will appear here.</p> : journalEntries.map((entry) => <p key={entry.at} data-testid="journal-entry" className="mt-3 line-clamp-5 whitespace-pre-wrap font-mono text-[11px] leading-5">{entry.query}</p>)}
          </div>
        </aside></div>

        {allSolved && <article className="mt-14 border-t-[6px] border-ink pt-6" data-testid="final-case-report">
          <div className="flex flex-wrap items-start justify-between gap-4"><div><p className="font-mono text-[11px] uppercase tracking-[.2em] text-riso">Case report · final edition</p><h2 className="mt-2 font-anton text-[clamp(3rem,7vw,6rem)] uppercase leading-[.88]">The evidence holds.</h2></div><span className="stamp stamp-animate !text-base text-court"><Sparkles size={14} className="mr-1 inline" /> Case closed</span></div>
          <div className="double-rule mt-5" />
          <div className="mt-6 grid gap-6 md:grid-cols-3">{case001Report.map((item, index) => <div key={item} className="border-t-2 border-ink pt-3"><span className="font-anton text-4xl text-riso">0{index + 1}</span><p className="mt-2 font-serif text-[1.15rem] leading-snug">{item}</p></div>)}</div>
          <div className="mt-8 bg-ink p-5 text-paper"><p className="font-mono text-[10px] uppercase tracking-[.16em] text-gold">Promotion earned · {rank}</p><p className="mt-2 font-serif text-xl italic">You reconstructed all seven games of the 2016 Finals from the box score.</p></div>
        </article>}
      </div></section>
    </div>
  </main>
}

export default CaseWorkspace
