import { useAuth } from '../../hooks/useAuth'
import { LoginPage } from '../../pages/LoginPage/LoginPage'
import { Spinner } from '../ui/Spinner'
import type { ReactNode } from 'react'

const ADMIN_EMAILS: string[] = (import.meta.env.VITE_ADMIN_EMAILS as string ?? '')
  .split(',')
  .map((e) => e.trim().toLowerCase())
  .filter(Boolean)

interface Props {
  children: ReactNode
}

export function ProtectedRoute({ children }: Props) {
  const { session, loading } = useAuth()

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <Spinner />
    </div>
  )
  if (!session) return <LoginPage />
  if (ADMIN_EMAILS.length > 0 && !ADMIN_EMAILS.includes((session.user.email ?? '').toLowerCase())) return <LoginPage />

  return <>{children}</>
}
