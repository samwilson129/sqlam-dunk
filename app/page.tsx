'use client'

import { ArrowUpRight, BarChart3, BookOpen, Check, ChevronRight, CircleDot, Database, LockKeyhole, Play, Search, ShieldCheck, Trophy, Zap } from 'lucide-react'

const cases = [
  { number: '01', title: 'The 2016 Finals', subject: 'Cleveland Cavaliers vs. Golden State Warriors', note: 'Proposed concept · verification pending', accent: 'orange' },
  { number: '02', title: 'The 2023 Playoff Run', subject: 'Denver Nuggets championship path', note: 'Proposed concept · verification pending', accent: 'gold' },
]

const keyFigures = [
  { name: 'LeBron James', initials: 'LJ', team: 'Cleveland Cavaliers', tone: 'wine' },
  { name: 'Kyrie Irving', initials: 'KI', team: 'Cleveland Cavaliers', tone: 'wine' },
  { name: 'Stephen Curry', initials: 'SC', team: 'Golden State Warriors', tone: 'blue' },
  { name: 'Klay Thompson', initials: 'KT', team: 'Golden State Warriors', tone: 'blue' },
]

export default function Page() {
  return (
    <main className="min-h-screen overflow-hidden bg-[#07111f] text-[#f6f1e8]">
      <div className="site-shell">
        <nav className="mx-auto flex max-w-7xl items-center justify-between border-b border-white/10 px-6 py-5 lg:px-10" aria-label="Main navigation">
          <a href="#top" className="flex items-center gap-3" aria-label="SQLAM Dunk home">
            <span className="brand-mark"><span /></span>
            <span className="font-display text-xl font-bold tracking-[-0.04em]">SQLAM <span className="text-[#f28c28]">DUNK</span></span>
          </a>
          <div className="hidden items-center gap-8 text-xs font-semibold uppercase tracking-[0.18em] text-white/55 md:flex">
            <a href="#roadmap" className="transition hover:text-white">Roadmaps</a>
            <a href="#how-it-works" className="transition hover:text-white">My Profile</a>
          </div>
          <div className="flex items-center gap-3">
            <a href="#login" className="hidden text-xs font-semibold uppercase tracking-[0.16em] text-white/60 transition hover:text-white sm:block">Log in</a>
            <a href="#signup" className="rounded-full border border-[#f28c28]/60 bg-[#f28c28] px-4 py-2 text-xs font-bold uppercase tracking-[0.15em] text-[#07111f] transition hover:bg-[#ffad4d]">Sign up</a>
          </div>
        </nav>

        <section id="top" className="relative mx-auto grid max-w-7xl items-center gap-12 px-6 pb-20 pt-20 lg:grid-cols-[1.05fr_.95fr] lg:px-10 lg:pb-28 lg:pt-28">
          <div className="pointer-events-none absolute -left-32 top-12 h-96 w-96 rounded-full bg-[#f28c28]/10 blur-3xl" />
          <div className="relative z-10">
            <div className="mb-7 flex items-center gap-3 text-[10px] font-bold uppercase tracking-[0.3em] text-[#f0b84a]"><span className="h-px w-8 bg-[#f0b84a]" /> NBA HISTORY, ONE QUERY AT A TIME</div>
            <h1 className="max-w-2xl font-display text-6xl font-bold leading-[.93] tracking-[-0.07em] text-[#fbf7ef] sm:text-7xl lg:text-[6.5rem]">Every query<br /><span className="text-[#f28c28]">is a shot.</span></h1>
            <p className="mt-8 max-w-lg text-base leading-7 text-white/55">Investigate the moments that made NBA history. Write SQL, uncover evidence, and build your case from the numbers.</p>
            <div className="mt-9 flex flex-wrap items-center gap-4">
              <a href="#roadmap" className="inline-flex items-center gap-2 rounded-full bg-[#f28c28] px-6 py-3.5 text-sm font-bold text-[#07111f] transition hover:bg-[#ffad4d]">Explore the roadmap <ArrowUpRight size={16} /></a>
              <a href="#how-it-works" className="inline-flex items-center gap-2 px-2 py-3 text-sm font-semibold text-white/65 transition hover:text-white"><Play size={15} fill="currentColor" /> See how it works</a>
            </div>
          </div>
          <div className="relative mx-auto w-full max-w-[510px] lg:justify-self-end">
            <div className="case-card relative overflow-hidden rounded-[2px] border border-[#f0b84a]/30 bg-[#101e2e] p-6 shadow-2xl shadow-black/30 sm:p-8">
              <div className="absolute right-0 top-0 h-32 w-32 bg-[#f28c28]/10 blur-2xl" />
              <div className="relative flex items-start justify-between"><div><p className="eyebrow text-[#f0b84a]">Featured investigation</p><p className="mt-3 font-mono text-xs text-white/40">CASE FILE / 001</p></div><span className="rounded-sm border border-[#f0b84a]/35 px-2 py-1 text-[9px] font-bold uppercase tracking-[.16em] text-[#f0b84a]">Concept</span></div>
              <h2 className="relative mt-10 max-w-sm font-display text-4xl font-bold leading-none tracking-[-.05em]">The 2016<br /><span className="text-[#f28c28]">Finals.</span></h2>
              <p className="mt-5 max-w-sm text-sm leading-6 text-white/60">A proposed investigation into the Cleveland Cavaliers and Golden State Warriors. Can your queries reconstruct the evidence?</p>
              <div className="mt-7 border-y border-white/10 py-5">
                <p className="font-mono text-[10px] font-bold uppercase tracking-[.2em] text-white/35">Key figures</p>
                <div className="mt-4 grid grid-cols-2 gap-3">
                  {keyFigures.map((player) => (
                    <div key={player.name} className="flex items-center gap-3 border border-white/10 bg-[#0b1726]/70 px-3 py-3">
                      <span className={`player-glyph ${player.tone}`} aria-hidden="true">{player.initials}</span>
                      <div className="min-w-0">
                        <p className="truncate text-xs font-bold text-white/90">{player.name}</p>
                        <p className="mt-1 truncate text-[9px] uppercase tracking-[.08em] text-white/40">{player.team}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="mt-0 grid grid-cols-3 border-b border-white/10 py-4 text-xs"><div><p className="text-white/35">SUBJECT</p><p className="mt-1 font-semibold">NBA Finals</p></div><div><p className="text-white/35">STATUS</p><p className="mt-1 font-semibold text-[#f0b84a]">Verifying data</p></div><div><p className="text-white/35">DIFFICULTY</p><p className="mt-1 font-semibold">Advanced</p></div></div>
              <div className="mt-6 flex items-center justify-between"><p className="text-[10px] uppercase tracking-[.16em] text-white/35">Historical reference only</p><CircleDot size={20} className="text-[#f28c28]" /></div>
            </div>
            <div className="absolute -bottom-5 -left-5 hidden border border-white/10 bg-[#0b1726] px-4 py-3 sm:block"><p className="font-mono text-[10px] text-white/40">DATASET STATUS</p><p className="mt-1 flex items-center gap-2 text-xs font-semibold"><span className="h-1.5 w-1.5 rounded-full bg-[#f0b84a]" /> Awaiting verification</p></div>
          </div>
        </section>

        <section id="roadmap" className="border-y border-white/10 bg-[#091624] px-6 py-20 lg:px-10 lg:py-24"><div className="mx-auto max-w-7xl"><div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end"><div><p className="eyebrow text-[#f28c28]">The roadmap</p><h2 className="mt-3 font-display text-4xl font-bold tracking-[-.05em] sm:text-5xl">Cases worth cracking.</h2></div><p className="max-w-xs text-sm leading-6 text-white/45">Real history. Verified data. No shortcuts. New investigations are currently in development.</p></div><div className="mt-12 grid gap-4 md:grid-cols-2">{cases.map((item) => <article key={item.number} className="group relative flex min-h-64 flex-col justify-between overflow-hidden border border-white/10 bg-[#0d1b2b] p-6 transition hover:border-[#f28c28]/50"><span className={`absolute -right-4 -top-12 font-display text-[12rem] font-bold leading-none ${item.accent === 'orange' ? 'text-[#f28c28]/[.06]' : 'text-[#f0b84a]/[.06]'}`}>{item.number}</span><div className="relative"><div className="flex items-center justify-between"><span className="font-mono text-xs text-white/35">CASE {item.number}</span><LockKeyhole size={15} className="text-white/35" /></div><h3 className="mt-8 font-display text-3xl font-bold tracking-[-.04em]">{item.title}</h3><p className="mt-2 text-sm text-white/55">{item.subject}</p></div><div className="relative mt-8 flex items-center justify-between border-t border-white/10 pt-4"><span className="text-[10px] font-semibold uppercase tracking-[.12em] text-[#f0b84a]">{item.note}</span><ChevronRight size={17} className="text-white/40 transition group-hover:translate-x-1 group-hover:text-[#f28c28]" /></div></article>)}</div></div></section>

        <section id="how-it-works" className="mx-auto max-w-7xl px-6 py-20 lg:px-10 lg:py-28"><div className="grid gap-14 lg:grid-cols-[.7fr_1.3fr]"><div><p className="eyebrow text-[#f0b84a]">The investigation</p><h2 className="mt-3 max-w-md font-display text-4xl font-bold leading-tight tracking-[-.05em] sm:text-5xl">The box score is only the beginning.</h2><p className="mt-6 max-w-sm text-sm leading-7 text-white/50">SQLAM Dunk turns NBA history into a trail of evidence. Learn the language of data while exploring the players, teams, and games that shaped the league.</p></div><div className="grid gap-8 sm:grid-cols-3">{[{icon: Database, n:'01', t:'Query the evidence', d:'Use SQL to filter seasons, players, games, and statistics.'},{icon: Search, n:'02', t:'Find the signal', d:'Follow the clues and test your own historical hypotheses.'},{icon: Trophy, n:'03', t:'Earn your badge', d:'Build fluency through cases that reward sharp thinking.'}].map(({icon: Icon,n,t,d})=><div key={n} className="border-l border-[#f28c28]/40 pl-5"><Icon size={20} className="text-[#f28c28]" /><p className="mt-6 font-mono text-xs text-white/35">STAGE {n}</p><h3 className="mt-2 font-display text-xl font-bold">{t}</h3><p className="mt-3 text-sm leading-6 text-white/45">{d}</p></div>)}</div></div></section>

        <section className="mx-6 mb-20 border border-[#f0b84a]/20 bg-[#0d1b2b] px-6 py-10 sm:px-10 lg:mx-auto lg:max-w-7xl"><div className="flex flex-col items-start justify-between gap-8 md:flex-row md:items-center"><div><p className="eyebrow text-[#f28c28]">Built for curious minds</p><h2 className="mt-2 font-display text-3xl font-bold tracking-[-.04em]">Ready to read the tape differently?</h2></div><div className="flex items-center gap-3 text-sm text-white/55"><ShieldCheck size={20} className="text-[#f0b84a]" /> Verification comes before gameplay.</div></div></section>

        <footer className="border-t border-white/10 px-6 py-8 lg:px-10"><div className="mx-auto flex max-w-7xl flex-col gap-5 text-xs text-white/35 sm:flex-row sm:items-center sm:justify-between"><div className="flex items-center gap-3"><span className="brand-mark small"><span /></span><span>SQLAM DUNK</span></div><p>Independent educational project. Not affiliated with the NBA or its teams.</p><p>© 2026 SQLAM Dunk</p></div></footer>
      </div>
    </main>
  )
}
