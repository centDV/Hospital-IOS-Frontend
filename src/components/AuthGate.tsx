import { useEffect, useState, type FormEvent, type ReactNode } from 'react'
import type { Session } from '@supabase/supabase-js'
import { Icon } from './Icon'
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
  const [showPassword, setShowPassword] = useState(false)
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
            display_name: `${givenNames.trim()} ${familyNames.trim()}`.trim(),
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

      setPassword('')
      setPasswordConfirmation('')
      if (data.session) {
        setNotice('Cuenta creada. Para usar las funciones del hospital, solicita a la administración que te asigne el rol correspondiente.')
      } else {
        setNotice('Supabase aceptó la solicitud, pero no inició sesión. Revisa la configuración de confirmación de correo en Supabase Auth.')
        setMode('sign-in')
      }
    } catch (signUpError) {
      setError(signUpError instanceof Error ? signUpError.message : 'No se pudo crear la cuenta.')
    } finally {
      setSubmitting(false)
    }
  }

  async function handlePasswordReset() {
    if (!supabase) return
    if (!email.trim()) {
      setError('Ingresa tu correo electrónico para recuperar tu contraseña.')
      setNotice('')
      return
    }

    setSubmitting(true)
    setError('')
    setNotice('')
    try {
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: window.location.origin,
      })
      if (resetError) {
        setError(resetError.message)
      } else {
        setNotice('Si existe una cuenta con ese correo, recibirás instrucciones para restablecer tu contraseña.')
      }
    } catch (resetError) {
      setError(resetError instanceof Error ? resetError.message : 'No se pudo solicitar la recuperación de contraseña.')
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
    <main className="min-h-screen bg-[#faf8f9]">
      <div className="grid min-h-screen overflow-hidden md:grid-cols-[0.9fr_1fr]">
        <section className="flex min-h-[230px] flex-col justify-between bg-[#800b2c] px-6 py-5 text-white sm:px-10 sm:py-7 md:min-h-0 md:px-[9%] md:py-8">
          <div className="border-t border-white/20 pt-3" />
          <div className="py-5 text-center">
            <span className="mx-auto flex h-[68px] w-[68px] items-center justify-center rounded-2xl bg-white text-[#870b30] sm:h-[86px] sm:w-[86px]">
              <span className="flex h-[48px] w-[48px] items-center justify-center rounded-xl bg-[#fbeaf0] sm:h-[58px] sm:w-[58px]">
                <svg aria-hidden="true" className="h-8 w-8" fill="currentColor" viewBox="0 0 48 48">
                  <path d="M18 5h12v13h13v12H30v13H18V30H5V18h13z" />
                </svg>
              </span>
            </span>
            <h1 className="mt-5 text-xl font-semibold tracking-tight sm:text-2xl">Hospital Universitario</h1>
            <p className="mt-1 text-xs text-white/90">Santa Ana</p>
            <p className="mt-3 text-sm text-white/70">Plataforma de atención hospitalaria</p>
          </div>
          <div>
            <div className="border-t border-white/20 pt-3 text-xs leading-relaxed text-white/75">
              <p>Atención médica conectada, segura y eficiente</p>
              <p className="mt-2 text-white/50">Sistema de gestión hospitalaria.</p>
            </div>
            <p className="mt-8 text-[10px] text-white/55">© Hospital Universitario San Gabriel</p>
          </div>
        </section>

        <section className="flex flex-col items-center justify-center bg-[#faf8f9] px-5 py-8 sm:px-8">
          <form className="w-full max-w-[420px] rounded-xl bg-white px-6 py-7 sm:px-9 sm:py-8" onSubmit={mode === 'sign-in' ? handleSignIn : handleSignUp}>
            <div className="mb-6">
              <h2 className="text-lg font-semibold tracking-tight text-slate-800">
                {mode === 'sign-in' ? 'Bienvenido de nuevo' : 'Crea tu cuenta'}
              </h2>
              <p className="mt-1 text-xs text-slate-500">
                {mode === 'sign-in' ? 'Inicia sesión con tu cuenta institucional' : 'Regístrate para solicitar acceso institucional'}
              </p>
            </div>

            {mode === 'sign-up' && (
              <div className="mb-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
                <label className="block text-xs font-medium text-slate-700">Nombres
                  <input autoComplete="given-name" className="mt-1.5 w-full rounded-md bg-[#f8f6f7] px-3 py-2.5 text-sm outline-none ring-1 ring-transparent focus:ring-[#870b30]/30" maxLength={100} onChange={(event) => setGivenNames(event.target.value)} required value={givenNames} />
                </label>
                <label className="block text-xs font-medium text-slate-700">Apellidos
                  <input autoComplete="family-name" className="mt-1.5 w-full rounded-md bg-[#f8f6f7] px-3 py-2.5 text-sm outline-none ring-1 ring-transparent focus:ring-[#870b30]/30" maxLength={100} onChange={(event) => setFamilyNames(event.target.value)} required value={familyNames} />
                </label>
              </div>
            )}

            <label className="mb-3 block text-xs font-medium text-slate-700">Correo electrónico
              <span className="mt-1.5 flex items-center rounded-md bg-[#f8f6f7] px-3 focus-within:ring-1 focus-within:ring-[#870b30]/30">
                <Icon className="shrink-0 text-slate-400" name="mail" size={13} />
                <input autoComplete="username" className="min-w-0 flex-1 bg-transparent px-2.5 py-2.5 text-sm outline-none placeholder:text-slate-400" onChange={(event) => setEmail(event.target.value)} placeholder="nombre@hospital.edu" required type="email" value={email} />
              </span>
            </label>

            <label className="block text-xs font-medium text-slate-700">Contraseña
              <span className="mt-1.5 flex items-center rounded-md bg-[#f8f6f7] px-3 focus-within:ring-1 focus-within:ring-[#870b30]/30">
                <Icon className="shrink-0 text-[#870b30]" name="lock" size={13} />
                <input autoComplete={mode === 'sign-in' ? 'current-password' : 'new-password'} className="min-w-0 flex-1 bg-transparent px-2.5 py-2.5 text-sm outline-none" minLength={mode === 'sign-up' ? 8 : undefined} onChange={(event) => setPassword(event.target.value)} required type={showPassword ? 'text' : 'password'} value={password} />
                <button aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'} className="shrink-0 text-slate-400 hover:text-slate-700" onClick={() => setShowPassword((visible) => !visible)} type="button">
                  <Icon name={showPassword ? 'eyeOff' : 'eye'} size={13} />
                </button>
              </span>
            </label>

            {mode === 'sign-in' && (
              <div className="mt-2 flex justify-end">
                <button className="text-xs text-[#870b30] hover:underline disabled:opacity-60" disabled={submitting} onClick={() => void handlePasswordReset()} type="button">
                  ¿Olvidaste tu contraseña?
                </button>
              </div>
            )}

            {mode === 'sign-up' && (
              <label className="mt-3 block text-xs font-medium text-slate-700">Confirmar contraseña
                <input autoComplete="new-password" className="mt-1.5 w-full rounded-md bg-[#f8f6f7] px-3 py-2.5 text-sm outline-none ring-1 ring-transparent focus:ring-[#870b30]/30" minLength={8} onChange={(event) => setPasswordConfirmation(event.target.value)} required type={showPassword ? 'text' : 'password'} value={passwordConfirmation} />
              </label>
            )}

            {notice && <p className="mt-4 rounded-md bg-emerald-50 p-2.5 text-xs leading-relaxed text-emerald-800" role="status">{notice}</p>}
            {error && <p className="mt-4 rounded-md bg-rose-50 p-2.5 text-xs text-rose-800" role="alert">{error}</p>}

            <button className="mt-5 flex w-full items-center justify-center gap-2 rounded-md bg-[#800b2c] px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#6f0827] disabled:opacity-60" disabled={submitting} type="submit">
              {submitting ? (mode === 'sign-in' ? 'Iniciando sesión...' : 'Creando cuenta...') : (mode === 'sign-in' ? 'Iniciar sesión' : 'Crear cuenta')}
              {!submitting && <Icon name="arrowRight" size={13} />}
            </button>
            <p className="mt-4 text-center text-xs text-slate-500">Acceso exclusivo para personal autorizado</p>

            <p className="mt-5 text-center text-xs text-slate-500">
              {mode === 'sign-in' ? '¿Aún no tienes cuenta?' : '¿Ya tienes una cuenta?'}{' '}
              <button className="font-semibold text-[#870b30] hover:underline" disabled={submitting} onClick={() => changeMode(mode === 'sign-in' ? 'sign-up' : 'sign-in')} type="button">
                {mode === 'sign-in' ? 'Crear cuenta' : 'Volver a iniciar sesión'}
              </button>
            </p>
          </form>
          <p className="mt-5 text-center text-xs text-slate-500">Una sola plataforma · Acceso según tu rol</p>
        </section>
      </div>
    </main>
  )
}
