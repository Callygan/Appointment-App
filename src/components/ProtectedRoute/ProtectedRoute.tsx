import { useAuth } from '../../hooks/useAuth'
import { LoginPage } from '../../pages/LoginPage/LoginPage'
import type { ReactNode } from 'react'

interface Props {
  children: ReactNode
}

export function ProtectedRoute({ children }: Props) {
  const { session, loading } = useAuth()

  if (loading) return <div style={{ padding: 32, color: '#888' }}>Loading...</div>
  if (!session) return <LoginPage />

  return <>{children}</>
}
