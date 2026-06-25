import { useState } from 'react'
import { useAuth } from '../../hooks/useAuth'
import { greenBtnCls } from '../../components/ui/buttons'

export function LoginPage() {
  const { signIn } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
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
      <div className="glass-heavy rounded-3xl p-8 w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="text-xl font-semibold text-[#1d1d1f] tracking-tight">Autentificare admin</h1>
          <p className="text-sm text-[#6e6e73] mt-1">Gestionare salon unghii</p>
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
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
              placeholder="***********"
              className="bg-white/50 backdrop-blur-sm border border-white/60 rounded-2xl px-4 py-3 text-sm font-normal text-[#1d1d1f] outline-none focus:bg-white/85 focus:border-[#34c759] transition-all shadow-[inset_0_2px_4px_rgba(0,0,0,0.04)]"
            />
          </label>

          {error && (
            <p className="text-sm text-red-600 bg-red-50/80 border border-red-200/50 rounded-2xl px-4 py-3 m-0">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading || !email || !password}
            className={`${greenBtnCls} w-full py-3 mt-2`}
          >
            {loading ? 'Se autentifică...' : 'Intră în cont'}
          </button>
        </form>
      </div>
    </div>
  )
}
