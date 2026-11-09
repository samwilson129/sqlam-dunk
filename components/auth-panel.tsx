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

  if (user) return <div className="flex items-center gap-3"><span data-testid="signed-in-user-email" className="hidden font-mono text-[11px] text-smoke lg:inline">{user.email}</span><button type="button" onClick={() => void signOut()} data-testid="auth-sign-out-button" className="btn-paper !px-3 !py-2.5"><LogOut size={14} /> Sign out</button></div>

  return <>
    <button type="button" onClick={() => { setMode('login'); setOpen(true) }} data-testid="auth-modal-trigger" className="btn-paper !px-3 !py-2.5"><LogIn size={14} /> Log in</button>
    {open && <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/75 p-5" role="dialog" aria-modal="true" aria-labelledby="auth-title" data-testid="auth-dialog">
      <div className="slide-in relative w-full max-w-md border-2 border-ink bg-sheet shadow-[10px_10px_0_#e0412a]">
        <div className="flex items-center justify-between border-b-2 border-ink bg-ink px-5 py-2 font-mono text-[10px] uppercase tracking-[.2em] text-paper"><span>Press credentials</span><span>Finals desk · 2016</span></div>
        <div className="p-6 sm:p-8">
          <div className="flex items-start justify-between gap-4">
            <div><p className="font-serif text-lg italic text-riso">Analyst access</p><h2 id="auth-title" className="mt-1 font-anton text-5xl uppercase leading-[.9]">{mode === 'login' ? 'Welcome back.' : 'Create your profile.'}</h2></div>
            <button type="button" onClick={() => setOpen(false)} data-testid="auth-dialog-close-button" aria-label="Close authentication dialog" className="border-2 border-ink p-1 transition-colors hover:bg-gold"><X size={20} /></button>
          </div>
          <form onSubmit={submit} className="mt-7 space-y-4">
            <label className="block font-mono text-[11px] font-semibold uppercase tracking-[.14em]">Email<input required type="email" value={email} onChange={(event) => setEmail(event.target.value)} data-testid="auth-email-input" className="mt-2 w-full border-2 border-ink bg-paper px-3 py-3 font-sans text-[15px] normal-case tracking-normal outline-none transition-shadow focus:shadow-[4px_4px_0_#f2b632]" /></label>
            <label className="block font-mono text-[11px] font-semibold uppercase tracking-[.14em]">Password<input required minLength={6} type="password" value={password} onChange={(event) => setPassword(event.target.value)} data-testid="auth-password-input" className="mt-2 w-full border-2 border-ink bg-paper px-3 py-3 font-sans text-[15px] outline-none transition-shadow focus:shadow-[4px_4px_0_#f2b632]" /></label>
            {message && <p data-testid="auth-feedback-message" className="border-l-4 border-riso bg-riso/10 px-3 py-2 text-sm leading-6">{message}</p>}
            <button disabled={busy} data-testid="auth-submit-button" className="btn-ink w-full">{mode === 'login' ? <LogIn size={15} /> : <UserPlus size={15} />}{busy ? 'Working…' : mode === 'login' ? 'Log in' : 'Sign up'}</button>
          </form>
          <button type="button" onClick={() => { setMode(mode === 'login' ? 'signup' : 'login'); setMessage('') }} data-testid="auth-mode-toggle-button" className="link-ink mt-6 !text-[11px]">{mode === 'login' ? 'Need an account? Sign up' : 'Already have an account? Log in'}</button>
        </div>
      </div>
    </div>}
  </>
}
