'use client'

import { FormEvent, useEffect, useMemo, useState } from 'react'
import { LogIn, LogOut, UserPlus, X } from 'lucide-react'
import { createSupabaseBrowserClient } from '@/lib/supabase-browser'

export type AuthUser = { id: string; email?: string }

type AuthPanelProps = {
  user: AuthUser | null
  onUser: (user: AuthUser | null) => void
}

export function AuthPanel({ user, onUser }: AuthPanelProps) {
  const supabase = useMemo(() => createSupabaseBrowserClient(), [])
  const [open, setOpen] = useState(false)
  const [mode, setMode] = useState<'login' | 'signup'>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [message, setMessage] = useState('')
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => onUser(data.user ? { id: data.user.id, email: data.user.email } : null))
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => onUser(session?.user ? { id: session.user.id, email: session.user.email } : null))
    return () => listener.subscription.unsubscribe()
  }, [onUser, supabase.auth])

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    setBusy(true)
    setMessage('')
    const result = mode === 'login'
      ? await supabase.auth.signInWithPassword({ email, password })
      : await supabase.auth.signUp({ email, password })
    if (result.error) setMessage(result.error.message)
    else {
      setMessage(mode === 'signup' ? 'Account created. Check your email if confirmation is enabled.' : 'Signed in.')
      if (mode === 'login') setOpen(false)
    }
    setBusy(false)
  }

  if (user) return <div className="flex items-center gap-3"><span className="hidden text-xs text-white/55 sm:inline">{user.email}</span><button type="button" onClick={() => supabase.auth.signOut()} className="inline-flex items-center gap-2 rounded-full border border-white/15 px-4 py-2 text-xs font-bold uppercase tracking-[.12em] text-white/65 hover:border-[#f28c28] hover:text-white"><LogOut size={14} /> Sign out</button></div>

  return <>
    <button type="button" onClick={() => { setMode('login'); setOpen(true) }} className="inline-flex items-center gap-2 rounded-full border border-white/15 px-4 py-2 text-xs font-bold uppercase tracking-[.12em] text-white/65 hover:border-[#f28c28] hover:text-white"><LogIn size={14} /> Log in</button>
    {open && <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#07111f]/85 p-5 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="auth-title"><div className="w-full max-w-md border border-[#f0b84a]/35 bg-[#0d1b2b] p-6 shadow-2xl sm:p-8"><div className="flex items-start justify-between"><div><p className="eyebrow text-[#f0b84a]">Analyst access</p><h2 id="auth-title" className="mt-2 font-display text-3xl font-bold">{mode === 'login' ? 'Welcome back.' : 'Create your profile.'}</h2></div><button type="button" onClick={() => setOpen(false)} aria-label="Close authentication dialog" className="text-white/45 hover:text-white"><X size={20} /></button></div><form onSubmit={submit} className="mt-7 space-y-4"><label className="block text-xs uppercase tracking-[.12em] text-white/50">Email<input required type="email" value={email} onChange={(event) => setEmail(event.target.value)} className="mt-2 w-full border border-white/15 bg-[#07111f] px-3 py-3 text-sm text-white outline-none focus:border-[#f28c28]" /></label><label className="block text-xs uppercase tracking-[.12em] text-white/50">Password<input required minLength={6} type="password" value={password} onChange={(event) => setPassword(event.target.value)} className="mt-2 w-full border border-white/15 bg-[#07111f] px-3 py-3 text-sm text-white outline-none focus:border-[#f28c28]" /></label>{message && <p className="text-sm leading-6 text-[#f0b84a]">{message}</p>}<button disabled={busy} className="inline-flex w-full items-center justify-center gap-2 bg-[#f28c28] px-5 py-3 text-xs font-bold uppercase tracking-[.12em] text-[#07111f] disabled:opacity-50">{mode === 'login' ? <LogIn size={15} /> : <UserPlus size={15} />}{busy ? 'Working…' : mode === 'login' ? 'Log in' : 'Sign up'}</button></form><button type="button" onClick={() => { setMode(mode === 'login' ? 'signup' : 'login'); setMessage('') }} className="mt-5 text-xs text-white/55 underline underline-offset-4 hover:text-white">{mode === 'login' ? 'Need an account? Sign up' : 'Already have an account? Log in'}</button></div></div>}
  </>
}
