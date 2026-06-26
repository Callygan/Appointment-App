import { useState } from 'react'
import { useAuth } from '../../hooks/useAuth'
import { greenBtnCls } from '../../components/ui/buttons'

export function LoginPage() {
  const { signIn } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const err = await signIn(email.trim(), password)
    if (err) {
      setError('Email sau parolă incorectă.')
      setLoading(false)
    }
    // On success, useAuth updates session → ProtectedRoute renders admin
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="glass-heavy rounded-3xl p-6 w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="text-xl font-semibold text-[#1d1d1f] tracking-tight">Autentificare admin</h1>
        </div>

        <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
          <label className="flex flex-col gap-1.5 text-xs font-semibold text-[#6e6e73] uppercase tracking-wide">
            Email
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              placeholder="nume.prenume@mail.com"
              className="bg-white/50 backdrop-blur-sm border border-white/60 rounded-2xl px-4 py-3 text-sm font-normal text-[#1d1d1f] outline-none focus:bg-white/85 focus:border-[#34c759] transition-all shadow-[inset_0_2px_4px_rgba(0,0,0,0.04)]"
            />
          </label>

          <label className="flex flex-col gap-1.5 text-xs font-semibold text-[#6e6e73] uppercase tracking-wide">
            Parolă
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                placeholder="***********"
                className="bg-white/50 backdrop-blur-sm border border-white/60 rounded-2xl px-4 py-3 pr-11 text-sm font-normal text-[#1d1d1f] outline-none focus:bg-white/85 focus:border-[#34c759] transition-all shadow-[inset_0_2px_4px_rgba(0,0,0,0.04)] w-full"
              />
              <button
                type="button"
                onClick={() => setShowPassword(v => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#6e6e73] hover:text-[#1d1d1f] transition-colors p-1"
                aria-label={showPassword ? 'Ascunde parola' : 'Arată parola'}
              >
                {showPassword ? (
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
                    <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
                    <line x1="1" y1="1" x2="23" y2="23"/>
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                    <circle cx="12" cy="12" r="3"/>
                  </svg>
                )}
              </button>
            </div>
          </label>

          <button
            type="submit"
            disabled={loading || !email || !password}
            className={`${greenBtnCls} w-full py-3 mt-2`}
          >
            {loading ? 'Se autentifică...' : 'Intră în cont'}
          </button>
        </form>

        <div className="min-h-[2rem] mt-3 flex items-center justify-center">
          {error && <p className="text-sm text-red-500 text-center m-0">{error}</p>}
        </div>
      </div>
    </div>
  )
}
