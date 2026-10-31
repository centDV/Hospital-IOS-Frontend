import { useEffect, useState, type FormEvent, type ReactNode } from 'react'
import type { Session } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'

export function AuthGate({
  children,
}: {
  children: (session: Session, signOut: () => Promise<void>) => ReactNode
}) {
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(() => Boolean(supabase))
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [passwordConfirmation, setPasswordConfirmation] = useState('')
  const [givenNames, setGivenNames] = useState('')
  const [familyNames, setFamilyNames] = useState('')
  const [mode, setMode] = useState<'sign-in' | 'sign-up'>('sign-in')
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (!supabase) {
      return
    }

    let active = true
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      if (active) {
        setSession(nextSession)
        setLoading(false)
        setError('')
      }
    })

    void supabase.auth.getSession().then(({ data, error: sessionError }) => {
      if (!active) return
      if (sessionError) {
        setError(sessionError.message)
      } else {
        setSession(data.session)
      }
      setLoading(false)
    }).catch((sessionError: unknown) => {
      if (!active) return
      setError(sessionError instanceof Error ? sessionError.message : 'No se pudo verificar la sesión.')
      setLoading(false)
    })

    return () => {
      active = false
      subscription.unsubscribe()
    }
  }, [])

  async function handleSignIn(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!supabase) return

    setSubmitting(true)
    setError('')
    setNotice('')
    try {
      const { error: signInError } = await supabase.auth.signInWithPassword({ email, password })
      if (signInError) setError(signInError.message)
    } catch (signInError) {
      setError(signInError instanceof Error ? signInError.message : 'No se pudo iniciar sesión.')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleSignUp(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!supabase) return
    if (password !== passwordConfirmation) {
      setError('Las contraseñas no coinciden.')
      return
    }

    setSubmitting(true)
    setError('')
    setNotice('')
    try {
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            given_names: givenNames.trim(),
            family_names: familyNames.trim(),
          },
          emailRedirectTo: window.location.origin,
        },
      })
      if (signUpError) {
        setError(signUpError.message)
        return
      }

      if (data.session) {
        const { error: signOutError } = await supabase.auth.signOut()
        if (signOutError) {
          setError(`La cuenta se creó, pero no se pudo cerrar la sesión automáticamente: ${signOutError.message}`)
          return
        }
      }

      setPassword('')
      setPasswordConfirmation('')
      setNotice('Si la cuenta puede crearse, recibirás las instrucciones de confirmación por correo. Crear una cuenta no concede acceso al panel: solicita a la administración que te asigne el rol correspondiente.')
      setMode('sign-in')
    } catch (signUpError) {
      setError(signUpError instanceof Error ? signUpError.message : 'No se pudo crear la cuenta.')
    } finally {
      setSubmitting(false)
    }
  }

  function changeMode(nextMode: 'sign-in' | 'sign-up') {
    setMode(nextMode)
    setError('')
    setNotice('')
  }

  async function signOut() {
    if (!supabase) return
    const { error: signOutError } = await supabase.auth.signOut()
    if (signOutError) setError(signOutError.message)
  }

  if (!supabase) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f7f8fa] p-4">
        <section className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h1 className="text-lg font-bold text-[#870b30]">Falta configurar Supabase</h1>
          <p className="mt-2 text-sm text-slate-600">Define <code>VITE_SUPABASE_URL</code> y <code>VITE_SUPABASE_PUBLISHABLE_KEY</code> en <code>.env.local</code>, y reinicia Vite.</p>
        </section>
      </main>
    )
  }

  if (loading) {
    return <main className="flex min-h-screen items-center justify-center bg-[#f7f8fa] text-sm text-slate-500">Verificando sesión...</main>
  }

  if (session) {
    return (
      <>
        {error && <p className="fixed right-4 top-4 z-50 rounded-md bg-rose-50 p-3 text-xs text-rose-800 shadow" role="alert">{error}</p>}
        {children(session, signOut)}
      </>
    )
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f7f8fa] p-4">
      <form className="w-full max-w-sm rounded-xl border border-slate-200 bg-white p-6 shadow-sm" onSubmit={mode === 'sign-in' ? handleSignIn : handleSignUp}>
        <div className="mb-6 text-center">
          <span className="mx-auto flex h-10 w-10 items-center justify-center rounded-lg bg-rose-50 text-[#870b30]">+</span>
          <h1 className="mt-3 text-lg font-bold text-[#870b30]">Hospital Universitario</h1>
          <p className="mt-1 text-xs text-slate-500">{mode === 'sign-in' ? 'Inicia sesión con tu cuenta institucional' : 'Crea tu cuenta institucional'}</p>
        </div>
        {mode === 'sign-up' && (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <label className="block text-xs font-medium text-slate-600">Nombres
              <input autoComplete="given-name" className="mt-1.5 w-full rounded-md border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-rose-400" maxLength={100} onChange={(event) => setGivenNames(event.target.value)} required value={givenNames} />
            </label>
            <label className="block text-xs font-medium text-slate-600">Apellidos
              <input autoComplete="family-name" className="mt-1.5 w-full rounded-md border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-rose-400" maxLength={100} onChange={(event) => setFamilyNames(event.target.value)} required value={familyNames} />
            </label>
          </div>
        )}
        <label className="mb-3 mt-3 block text-xs font-medium text-slate-600">Correo electrónico
          <input autoComplete="username" className="mt-1.5 w-full rounded-md border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-rose-400" onChange={(event) => setEmail(event.target.value)} required type="email" value={email} />
        </label>
        <label className="mb-3 block text-xs font-medium text-slate-600">Contraseña
          <input autoComplete={mode === 'sign-in' ? 'current-password' : 'new-password'} className="mt-1.5 w-full rounded-md border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-rose-400" minLength={mode === 'sign-up' ? 8 : undefined} onChange={(event) => setPassword(event.target.value)} required type="password" value={password} />
        </label>
        {mode === 'sign-up' && (
          <label className="mb-4 block text-xs font-medium text-slate-600">Confirmar contraseña
            <input autoComplete="new-password" className="mt-1.5 w-full rounded-md border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-rose-400" minLength={8} onChange={(event) => setPasswordConfirmation(event.target.value)} required type="password" value={passwordConfirmation} />
          </label>
        )}
        {notice && <p className="mb-3 rounded-md bg-emerald-50 p-2.5 text-xs leading-relaxed text-emerald-800" role="status">{notice}</p>}
        {error && <p className="mb-3 rounded-md bg-rose-50 p-2.5 text-xs text-rose-800" role="alert">{error}</p>}
        <button className="w-full rounded-md bg-[#870b30] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#6f0827] disabled:opacity-60" disabled={submitting} type="submit">
          {submitting ? (mode === 'sign-in' ? 'Iniciando sesión...' : 'Creando cuenta...') : (mode === 'sign-in' ? 'Iniciar sesión' : 'Crear cuenta')}
        </button>
        <p className="mt-4 text-center text-xs text-slate-500">
          {mode === 'sign-in' ? '¿Aún no tienes cuenta?' : '¿Ya tienes una cuenta?'}{' '}
          <button className="font-semibold text-[#870b30] hover:underline" disabled={submitting} onClick={() => changeMode(mode === 'sign-in' ? 'sign-up' : 'sign-in')} type="button">
            {mode === 'sign-in' ? 'Crear cuenta' : 'Volver a iniciar sesión'}
          </button>
        </p>
      </form>
    </main>
  )
}
