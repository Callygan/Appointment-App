import { useEffect, useState, useRef, useCallback, createContext, useContext } from 'react'
import type { ReactNode } from 'react'
import { supabase } from '../lib/supabase'
import type { Session, AuthError } from '@supabase/supabase-js'

const INACTIVITY_MS = 60 * 60 * 1000   // 1 oră
const ABSOLUTE_MS   = 10 * 60 * 60 * 1000 // 10 ore
const LS_LAST_ACTIVITY = 'admin_last_activity'
const LS_LOGIN_TIME    = 'admin_login_time'
const ACTIVITY_EVENTS  = ['mousemove', 'mousedown', 'keydown', 'scroll', 'touchstart'] as const

interface AuthContextValue {
  session: Session | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<AuthError | null>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const forceSignOut = useCallback(async () => {
    localStorage.removeItem(LS_LAST_ACTIVITY)
    localStorage.removeItem(LS_LOGIN_TIME)
    await supabase.auth.signOut()
  }, [])

  // Update activity timestamp
  const onActivity = useCallback(() => {
    localStorage.setItem(LS_LAST_ACTIVITY, String(Date.now()))
  }, [])

  // Start / stop inactivity watcher
  const startWatcher = useCallback(() => {
    ACTIVITY_EVENTS.forEach(e => window.addEventListener(e, onActivity, { passive: true }))

    timerRef.current = setInterval(async () => {
      const lastActivity = Number(localStorage.getItem(LS_LAST_ACTIVITY) ?? 0)
      const loginTime    = Number(localStorage.getItem(LS_LOGIN_TIME) ?? 0)
      const now = Date.now()
      if (now - lastActivity > INACTIVITY_MS || now - loginTime > ABSOLUTE_MS) {
        await forceSignOut()
      }
    }, 60_000) // verifică la fiecare minut
  }, [onActivity, forceSignOut])

  const stopWatcher = useCallback(() => {
    ACTIVITY_EVENTS.forEach(e => window.removeEventListener(e, onActivity))
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null }
  }, [onActivity])

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
      setLoading(false)
      if (data.session) {
        // If a session exists at mount (tab reloaded), check expiration immediately
        const loginTime    = Number(localStorage.getItem(LS_LOGIN_TIME) ?? 0)
        const lastActivity = Number(localStorage.getItem(LS_LAST_ACTIVITY) ?? 0)
        const now = Date.now()
        if (loginTime && (now - lastActivity > INACTIVITY_MS || now - loginTime > ABSOLUTE_MS)) {
          forceSignOut()
          return
        }
        if (!localStorage.getItem(LS_LAST_ACTIVITY)) {
          localStorage.setItem(LS_LAST_ACTIVITY, String(now))
        }
        startWatcher()
      }
    })

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })

    return () => {
      listener.subscription.unsubscribe()
      stopWatcher()
    }
  }, [forceSignOut, startWatcher, stopWatcher])

  const signIn = useCallback(async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (!error) {
      const now = String(Date.now())
      localStorage.setItem(LS_LOGIN_TIME, now)
      localStorage.setItem(LS_LAST_ACTIVITY, now)
      startWatcher()
    }
    return error
  }, [startWatcher])

  const signOut = useCallback(async () => {
    stopWatcher()
    await forceSignOut()
  }, [stopWatcher, forceSignOut])

  return (
    <AuthContext.Provider value={{ session, loading, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider')
  return ctx
}
