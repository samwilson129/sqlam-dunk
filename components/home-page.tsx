'use client'

import { ArrowDown, ArrowRight, LockKeyhole } from 'lucide-react'
import { campaignChapters, case001Challenges, case001Meta, case001Tables } from '@/lib/case-001-data'
import { finalsArt, gameTapes } from '@/lib/game-tapes'
import { AuthPanel, type AuthUser } from '@/components/auth-panel'

const totalChallenges = case001Challenges.length

const persons = [
  { name: 'LeBron James', no: '23', team: 'Cleveland Cavaliers', abbr: 'CLE', gif: '/gifs/lebron-icon.gif', band: 'bg-wine text-gold', tilt: '-rotate-2' },
  { name: 'Kyrie Irving', no: '2', team: 'Cleveland Cavaliers', abbr: 'CLE', gif: '/gifs/Kyrie-icon.png', band: 'bg-wine text-gold', tilt: 'rotate-1' },
  { name: 'Stephen Curry', no: '30', team: 'Golden State Warriors', abbr: 'GSW', gif: '/gifs/curry-icon.gif', band: 'bg-court text-gold', tilt: '-rotate-1' },
  { name: 'Klay Thompson', no: '11', team: 'Golden State Warriors', abbr: 'GSW', gif: '/gifs/Klay-icon.gif', band: 'bg-court text-gold', tilt: 'rotate-2' },
]

const slug = (name: string) => name.toLowerCase().replace(/\s+/g, '-')

function Ticker() {
  const items = campaignChapters.flatMap((c) => [`Game ${c.number} · ${c.date}`, c.title, c.concepts.join(' / ')])
  const row = items.map((item, i) => <span key={i} className="flex items-center gap-10"><span>{item}</span><span aria-hidden className="text-ink">✶</span></span>)
  return <div className="ticker border-y-2 border-ink bg-riso py-2.5 font-mono text-[12px] font-semibold uppercase tracking-[.16em] text-paper" data-testid="home-ticker" aria-label="Case 001 chapters">
    <div className="ticker-track">{row}{row}</div>
  </div>
}

export function HomePage({ onStart, user, onUser }: { onStart: () => void; user: AuthUser | null; onUser: (user: AuthUser | null) => void }) {
  return <main className="paper-page grain min-h-screen overflow-x-hidden" data-testid="home-page">
    {/* dateline strip */}
    <div className="bg-ink text-paper">
      <div className="mx-auto flex max-w-[1400px] items-center justify-between gap-4 px-4 py-2 font-mono text-[10px] uppercase tracking-[.22em] sm:px-8">
        <span>Vol. 001 · The Finals Desk</span>
        <span className="hidden sm:inline">{case001Meta.dates}</span>
      </div>
    </div>

    {/* masthead */}
    <header id="top" className="mx-auto max-w-[1400px] px-4 pt-5 sm:px-8">
      <div className="relative z-10 flex items-center justify-between gap-3">
        <a href="#top" data-testid="brand-home-link" className="flex items-center gap-3" aria-label="SQLAM Dunk home">
          <img src="/chicken-basketball.avif" alt="SQLAM Dunk chicken mascot" className="h-11 w-11 rounded-full border-2 border-ink object-cover" />
          <span className="font-serif text-lg italic leading-[1.05]">The SQLAM<br />Dunk Gazette</span>
        </a>
        <nav className="flex items-center gap-2 sm:gap-4" aria-label="Main navigation">
          <a href="#games" data-testid="nav-games-link" className="link-ink hidden md:inline">The seven games</a>
          <a href="#cases" data-testid="nav-cases-link" className="link-ink hidden md:inline">Cases</a>
          <AuthPanel user={user} onUser={onUser} />
          <button type="button" onClick={onStart} data-testid="case-nav-start-button" className="btn-riso !px-3 !py-2.5">Start case</button>
        </nav>
      </div>

      <div className="pointer-events-none relative mt-8 select-none sm:mt-10">
        <h2 aria-label="SQLAM Dunk" className="pt-[.06em] font-anton text-[clamp(4.6rem,18.5vw,17rem)] uppercase leading-[.78] tracking-[-.01em]">
          SQLAM<span className="text-riso"> Dunk</span>
        </h2>
        <img src="/chicken-basketball.avif" alt="" aria-hidden className="bob absolute -top-4 right-[3%] hidden h-28 w-28 rotate-6 rounded-full border-[3px] border-ink object-cover shadow-[5px_5px_0_#16130f] md:block lg:h-36 lg:w-36" />
      </div>
      <div className="double-rule mt-4" />
      <div className="flex flex-wrap items-center justify-between gap-2 py-2 font-mono text-[11px] uppercase tracking-[.18em]">
        <span>Cleveland edition</span>
        <span className="font-serif text-base normal-case italic tracking-normal">“The 3–1 Comeback” issue</span>
        <span>{totalChallenges} questions · {campaignChapters.length} games · {case001Tables.length} tables</span>
      </div>
    </header>

    <Ticker />

    {/* lead story */}
    <section className="mx-auto grid max-w-[1400px] gap-12 px-4 py-14 sm:px-8 lg:grid-cols-12 lg:py-20">
      <div className="lg:col-span-7">
        <p className="font-serif text-2xl italic text-riso">Extra — a Finals special for analysts</p>
        <h1 data-testid="hero-headline" className="mt-3 font-anton text-[clamp(3.4rem,8.4vw,7.6rem)] uppercase leading-[.9]">
          Every query <br /><span className="marker">is a shot.</span>
        </h1>
        <div className="mt-8 grid gap-6 border-t-2 border-ink pt-6 md:grid-cols-2">
          <p data-testid="hero-description" className="border-l-4 border-riso pl-4 font-serif text-[1.35rem] leading-[1.4]">Investigate the moments that made NBA history. Write SQL, uncover evidence, and build your case from the numbers.</p>
          <p className="text-[15px] leading-7 text-smoke">Seven games. Real box scores. A browser-local SQL engine that only lets you see the games that have already been played — so you rebuild the comeback exactly as it unfolded, one night at a time.</p>
        </div>
        <div className="mt-9 flex flex-wrap items-center gap-6">
          <button type="button" onClick={onStart} data-testid="case-start-button" className="btn-ink !px-7 !py-4 !text-[13px]">Start investigation <ArrowRight size={16} /></button>
          <a href="#games" data-testid="hero-games-link" className="link-ink inline-flex items-center gap-2">Read the seven games <ArrowDown size={14} /></a>
        </div>
      </div>

      <div className="relative min-h-[460px] lg:col-span-5" data-testid="finals-artwork" aria-label="Pixel-art illustrations from the 2016 NBA Finals">
        <figure className="photo tape absolute left-0 top-2 w-[64%] -rotate-3 bg-[#fbf7ee]">
          <div className="bg-[#b8173b]"><img src={finalsArt.lebron} alt="Pixel-art LeBron James basketball illustration" className="aspect-[4/5] object-contain" /></div>
          <figcaption>Fig. 1 — The King, rendered pixel by pixel.</figcaption>
        </figure>
        <figure className="photo tape absolute bottom-0 right-0 w-[60%] rotate-[4deg]">
          <div className="bg-[#f2b12b]"><img src={finalsArt.kyrie} alt="Pixel-art Kyrie Irving basketball illustration" className="aspect-[4/5] object-contain" /></div>
          <figcaption>Fig. 2 — Kyrie, isolation on the wing.</figcaption>
        </figure>
        <div className="absolute right-[8%] top-0 grid h-28 w-28 rotate-12 place-items-center rounded-full border-2 border-ink bg-riso text-center font-anton text-2xl uppercase leading-none text-paper shadow-[4px_4px_0_#16130f]">
          <span>{totalChallenges}<br /><span className="font-mono text-[10px] tracking-[.2em]">questions</span></span>
        </div>
      </div>
    </section>

    {/* case file */}
    <section className="border-t-[6px] border-ink bg-paper2/60 halftone" data-testid="featured-case-card">
      <div className="mx-auto grid max-w-[1400px] gap-10 px-4 py-14 sm:px-8 lg:grid-cols-12">
        <div className="lg:col-span-4">
          <div className="ink-card p-6">
            <div className="flex items-start justify-between gap-3">
              <p className="font-mono text-[11px] uppercase tracking-[.2em]">Case file No. 001</p>
              <span className="stamp text-court">Open</span>
            </div>
            <h2 className="mt-6 font-anton text-6xl uppercase leading-[.85]">The 3–1<br /><span className="text-riso">Comeback.</span></h2>
            <p className="mt-5 font-serif text-xl leading-snug">Reconstruct the 2016 NBA Finals through {totalChallenges} SQL challenges across seven chronological game chapters. The evidence is yours to uncover.</p>
            <dl className="mt-6 space-y-2 font-mono text-[12px] uppercase tracking-[.1em]">
              {[['Subject', 'NBA Finals'], ['Matchup', 'CLE vs GSW'], ['Challenges', String(totalChallenges).padStart(2, '0')], ['Difficulty', 'Advanced']].map(([k, v]) => <div key={k} className="flex items-baseline gap-2"><dt>{k}</dt><span className="flex-1 border-b-2 border-dotted border-ink/40" /><dd className="font-semibold">{v}</dd></div>)}
            </dl>
            <button type="button" onClick={onStart} data-testid="featured-case-open-button" className="btn-ink mt-7 w-full">Open investigation <ArrowRight size={15} /></button>
            <p className="mt-4 text-[11px] uppercase tracking-[.14em] text-smoke">Historical reference only</p>
          </div>
        </div>
        <div className="lg:col-span-8">
          <div className="flex flex-wrap items-end justify-between gap-3 border-b-2 border-ink pb-3">
            <h3 className="font-anton text-4xl uppercase">Persons of interest</h3>
            <p className="font-serif text-lg italic text-smoke">Trading cards from the evidence locker</p>
          </div>
          <div className="mt-8 grid grid-cols-2 gap-5 md:grid-cols-4">
            {persons.map((p) => <article key={p.name} data-testid={`key-figure-${slug(p.name)}`} className={`ink-card lift overflow-hidden ${p.tilt}`}>
              <div className={`flex items-center justify-between px-3 py-1.5 font-mono text-[11px] font-semibold uppercase tracking-[.14em] ${p.band}`}><span>{p.abbr}</span><span>No. {p.no}</span></div>
              <div className="halftone-gold border-y-2 border-ink bg-paper p-3"><img src={p.gif} alt={p.name} loading="lazy" className="pixelated aspect-square w-full object-cover" /></div>
              <div className="p-3"><p className="font-anton text-xl uppercase leading-none">{p.name}</p><p className="mt-1.5 font-mono text-[10px] uppercase tracking-[.1em] text-smoke">{p.team}</p></div>
            </article>)}
          </div>
        </div>
      </div>
    </section>

    {/* the seven games */}
    <section id="games" className="border-t-[6px] border-ink pt-14" data-testid="learning-path">
      <div className="mx-auto flex max-w-[1400px] flex-wrap items-end justify-between gap-4 px-4 sm:px-8">
        <div>
          <p className="font-mono text-[11px] uppercase tracking-[.2em] text-riso">The learning path · game tape</p>
          <h2 className="mt-2 font-anton text-[clamp(2.8rem,6vw,5.5rem)] uppercase leading-[.88]">Seven games.<br />Twenty-one questions.</h2>
        </div>
        <p className="max-w-sm font-serif text-xl italic leading-snug text-smoke">From reading your first rows to ranking a whole series with window functions. Scroll the reel →</p>
      </div>
      <div className="filmstrip mt-10">
        <div className="no-scrollbar flex snap-x gap-5 overflow-x-auto px-4 pb-2 sm:px-8">
          {campaignChapters.map((c) => <article key={c.number} data-testid={`learning-chapter-${c.number}`} className="film-frame w-[290px] shrink-0 snap-start border-2 border-paper/80 bg-[#211c16] text-paper">
            <div className="relative aspect-[4/3] overflow-hidden border-b-2 border-paper/80 bg-paper">
              <img src={gameTapes[c.number]} alt={`Game ${c.number} pixel-art tape`} loading="lazy" className="pixelated h-full w-full object-cover" />
              <span className="absolute left-2 top-2 bg-ink px-2 py-1 font-anton text-xl leading-none text-gold">G{c.number}</span>
            </div>
            <div className="p-4">
              <p className="font-mono text-[10px] uppercase tracking-[.18em] text-gold">{c.date} · 3 challenges</p>
              <h3 className="mt-2 font-anton text-2xl uppercase leading-none">{c.title}</h3>
              <div className="mt-3 flex flex-wrap gap-1.5 text-paper/85">{c.concepts.map((k) => <span key={k} className="chip">{k}</span>)}</div>
              <p className="mt-3 text-[13px] leading-5 text-paper/70">{c.outcome}</p>
            </div>
          </article>)}
        </div>
      </div>
    </section>

    {/* your desk */}
    <section className="mx-auto grid max-w-[1400px] gap-12 px-4 py-16 sm:px-8 lg:grid-cols-12 lg:py-24" data-testid="analyst-desk">
      <div className="lg:col-span-7">
        <div className="ink-card lined relative p-6 sm:p-9">
          <span className="stamp absolute right-6 top-6 text-riso">Confidential</span>
          <p className="font-anton text-5xl uppercase">Memo</p>
          <dl className="mt-4 space-y-1 border-b-2 border-ink pb-4 font-mono text-[12px] uppercase tracking-[.08em]">
            <div><dt className="inline text-smoke">To: </dt><dd className="inline">Maya Carter, Junior Analyst</dd></div>
            <div><dt className="inline text-smoke">From: </dt><dd className="inline">Jordan Ellis, Senior Analytics Manager</dd></div>
            <div><dt className="inline text-smoke">Re: </dt><dd className="inline">Step into the analyst&apos;s seat</dd></div>
          </dl>
          <h2 className="mt-6 font-serif text-4xl leading-tight">You&apos;re on the analytics team.</h2>
          <p className="mt-4 text-[16px] leading-8 text-[#3b342b]">Take on a fictional analyst role, receive assignments from your senior manager, and investigate real NBA history using SQL. Every query uncovers evidence. Every report earns trust.</p>
          <button type="button" onClick={onStart} data-testid="analyst-seat-start-button" className="btn-paper mt-7">Enter your first case <ArrowRight size={15} /></button>
        </div>
      </div>
      <div className="relative flex min-h-[340px] items-start justify-center gap-6 lg:col-span-5">
        <figure className="photo tape mt-8 w-44 -rotate-6 sm:w-52"><div className="bg-court/15"><img src="/gifs/manager.gif" alt="Jordan Ellis pixel portrait" className="aspect-square object-cover" /></div><figcaption>Jordan Ellis — your boss.</figcaption></figure>
        <figure className="photo tape w-44 rotate-[5deg] sm:w-52"><div className="bg-riso/15"><img src="/gifs/maya_happy.gif" alt="Maya Carter pixel portrait" className="aspect-square object-cover" /></div><figcaption>Maya Carter — that&apos;s you.</figcaption></figure>
      </div>
    </section>

    {/* roadmap tickets */}
    <section id="cases" className="border-t-[6px] border-ink bg-paper2/60 py-16" data-testid="roadmap">
      <div className="mx-auto max-w-[1400px] px-4 sm:px-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <h2 className="font-anton text-[clamp(2.6rem,5vw,4.5rem)] uppercase leading-none">Cases worth cracking.</h2>
          <p className="max-w-xs font-serif text-xl italic text-smoke">Real history. Verified data. No shortcuts. Start with Case 001.</p>
        </div>
        <div className="mt-10 grid gap-8 lg:grid-cols-2">
          <article data-testid="roadmap-case-001" className="ticket lift flex shadow-[6px_6px_0_#16130f]">
            <div className="flex-1 p-6">
              <p className="font-mono text-[11px] uppercase tracking-[.2em] text-riso">Admit one · Now showing</p>
              <h3 className="mt-3 font-anton text-5xl uppercase leading-[.9]">The 3–1 Comeback</h3>
              <p className="mt-2 font-serif text-lg italic">{case001Meta.teams}</p>
              <button type="button" onClick={onStart} data-testid="roadmap-case-001-button" className="btn-ink mt-6">Begin investigation <ArrowRight size={15} /></button>
            </div>
            <div className="ticket-stub grid w-[90px] place-items-center bg-gold"><span className="rotate-90 whitespace-nowrap font-anton text-3xl">No. 001</span></div>
          </article>
          <article data-testid="roadmap-case-002" className="ticket relative flex overflow-hidden opacity-80">
            <div className="flex-1 p-6 grayscale">
              <p className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-[.2em] text-smoke"><LockKeyhole size={13} /> Locked · coming later</p>
              <h3 className="mt-3 font-anton text-5xl uppercase leading-[.9] text-smoke">The 2023 Playoff Run</h3>
              <p className="mt-2 font-serif text-lg italic text-smoke">Denver Nuggets championship path</p>
            </div>
            <div className="ticket-stub grid w-[90px] place-items-center bg-paper2"><span className="rotate-90 whitespace-nowrap font-anton text-3xl text-smoke">No. 002</span></div>
            <span className="stamp absolute left-1/3 top-1/2 -translate-y-1/2 bg-paper/70 !text-base text-riso">Sold out — for now</span>
          </article>
        </div>
      </div>
    </section>

    <footer className="bg-ink text-paper">
      <div className="mx-auto max-w-[1400px] px-4 pb-8 pt-12 sm:px-8">
        <p aria-hidden className="text-outline font-anton text-[clamp(3.5rem,14vw,12rem)] uppercase leading-[.8]">SQLAM Dunk</p>
        <div className="mt-8 flex flex-col gap-4 border-t border-paper/30 pt-6 font-mono text-[11px] uppercase tracking-[.12em] text-paper/70 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3"><img src="/chicken-basketball.avif" alt="SQLAM Dunk mascot" className="h-9 w-9 rounded-full border-2 border-gold object-cover" /><span>SQLAM Dunk</span></div>
          <p>Independent educational project. Not affiliated with the NBA or its teams.</p>
          <p>© 2026 SQLAM Dunk</p>
        </div>
      </div>
    </footer>
  </main>
}
