'use client'

import { FormEvent, useEffect, useState } from 'react'
import { LogIn, LogOut, UserPlus, X } from 'lucide-react'
import { createSupabaseBrowserClient } from '@/lib/supabase-browser'

export type AuthUser = { id: string; email?: string }

type AuthPanelProps = {
  user: AuthUser | null
  onUser: (user: AuthUser | null) => void
}

export function AuthPanel({ user, onUser }: AuthPanelProps) {
  const [supabase, setSupabase] = useState<ReturnType<typeof createSupabaseBrowserClient>>(null)
  const [open, setOpen] = useState(false)
  const [mode, setMode] = useState<'login' | 'signup'>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [message, setMessage] = useState('')
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    const client = createSupabaseBrowserClient()
    setSupabase(client)
    if (!client) return
    client.auth.getUser().then(({ data }) => onUser(data.user ? { id: data.user.id, email: data.user.email } : null)).catch(() => onUser(null))
    const { data: listener } = client.auth.onAuthStateChange((_event, session) => onUser(session?.user ? { id: session.user.id, email: session.user.email } : null))
    return () => listener.subscription.unsubscribe()
  }, [onUser])

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    if (!supabase) {
      setMessage('Authentication is unavailable in this deployment. You can still investigate locally.')
      return
    }
    setBusy(true)
    setMessage('')
    try {
      if (mode === 'login') {
        const { error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) setMessage(error.message)
        else { setPassword(''); setOpen(false) }
      } else {
        const { data, error } = await supabase.auth.signUp({ email, password, options: { emailRedirectTo: process.env.NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL ?? `${window.location.origin}/auth/callback` } })
        if (error) setMessage(error.message)
        else if (data.session) { setPassword(''); setOpen(false) }
        else if (data.user && data.user.identities?.length === 0) setMessage('An account with this email already exists. Log in instead.')
        else { setPassword(''); setMessage('Account created. Check your email to confirm your address, then log in.') }
      }
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'The authentication service could not be reached. Try again.')
    } finally {
      setBusy(false)
    }
  }

  const signOut = async () => {
    if (!supabase) return
    const { error } = await supabase.auth.signOut()
    if (error) setMessage(error.message)
  }

  if (user) return <div className="flex items-center gap-3"><span data-testid="signed-in-user-email" className="hidden text-xs text-[#8a9cb0] sm:inline">{user.email}</span><button type="button" onClick={() => void signOut()} data-testid="auth-sign-out-button" className="inline-flex items-center gap-2 border-2 border-[#22354a] px-3 py-2 text-xs font-bold uppercase tracking-[.12em] text-[#8a9cb0] shadow-[2px_2px_0_#070c14] hover:border-[#e05a2b] hover:text-white"><LogOut size={14} /> Sign out</button></div>

  return <>
    <button type="button" onClick={() => { setMode('login'); setOpen(true) }} data-testid="auth-modal-trigger" className="inline-flex items-center gap-2 border-2 border-[#22354a] px-3 py-2 text-xs font-bold uppercase tracking-[.12em] text-[#8a9cb0] shadow-[2px_2px_0_#070c14] hover:border-[#f0a830] hover:text-white"><LogIn size={14} /> Log in</button>
    {open && <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#070c14]/90 p-5 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="auth-title" data-testid="auth-dialog"><div className="paper-note w-full max-w-md p-6 shadow-[7px_7px_0_#070c14] sm:p-8"><div className="relative z-10 flex items-start justify-between"><div><p className="eyebrow text-[#8b2612]">Analyst access / personnel file</p><h2 id="auth-title" className="mt-2 font-display text-4xl font-black uppercase">{mode === 'login' ? 'Welcome back.' : 'Create your profile.'}</h2></div><button type="button" onClick={() => setOpen(false)} data-testid="auth-dialog-close-button" aria-label="Close authentication dialog" className="border-2 border-[#132032] p-1 text-[#132032]"><X size={20} /></button></div><form onSubmit={submit} className="relative z-10 mt-7 space-y-4"><label className="block text-xs font-bold uppercase tracking-[.12em] text-[#132032]">Email<input required type="email" value={email} onChange={(event) => setEmail(event.target.value)} data-testid="auth-email-input" className="mt-2 w-full border-2 border-[#22354a] bg-white/60 px-3 py-3 text-sm text-[#132032] outline-none focus:border-[#e05a2b]" /></label><label className="block text-xs font-bold uppercase tracking-[.12em] text-[#132032]">Password<input required minLength={6} type="password" value={password} onChange={(event) => setPassword(event.target.value)} data-testid="auth-password-input" className="mt-2 w-full border-2 border-[#22354a] bg-white/60 px-3 py-3 text-sm text-[#132032] outline-none focus:border-[#e05a2b]" /></label>{message && <p data-testid="auth-feedback-message" className="text-sm leading-6 text-[#8b2612]">{message}</p>}<button disabled={busy} data-testid="auth-submit-button" className="inline-flex w-full items-center justify-center gap-2 border-2 border-[#e05a2b] bg-[#e05a2b] px-5 py-3 text-xs font-bold uppercase tracking-[.12em] text-white shadow-[3px_3px_0_#132032] disabled:opacity-50">{mode === 'login' ? <LogIn size={15} /> : <UserPlus size={15} />}{busy ? 'Working…' : mode === 'login' ? 'Log in' : 'Sign up'}</button></form><button type="button" onClick={() => { setMode(mode === 'login' ? 'signup' : 'login'); setMessage('') }} data-testid="auth-mode-toggle-button" className="relative z-10 mt-5 text-xs font-bold text-[#132032] underline underline-offset-4">{mode === 'login' ? 'Need an account? Sign up' : 'Already have an account? Log in'}</button></div></div>}
  </>
}
