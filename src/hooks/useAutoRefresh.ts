import { useEffect, useRef } from 'react'

/**
 * Runs `callback` periodically and whenever the app regains focus / becomes
 * visible again (e.g. reopening the installed PWA). Only fires while the
 * document is visible, to avoid pointless requests in the background.
 */
export function useAutoRefresh(callback: () => void, intervalMs = 30000) {
  const cbRef = useRef(callback)
  cbRef.current = callback

  useEffect(() => {
    const run = () => {
      if (document.visibilityState === 'visible') cbRef.current()
    }

    const id = setInterval(run, intervalMs)
    document.addEventListener('visibilitychange', run)
    window.addEventListener('focus', run)

    return () => {
      clearInterval(id)
      document.removeEventListener('visibilitychange', run)
      window.removeEventListener('focus', run)
    }
  }, [intervalMs])
}
