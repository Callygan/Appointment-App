import { useEffect, useRef } from 'react'
import type { RefObject } from 'react'

/**
 * Calls `handler` when a pointerdown event occurs outside `ref`.
 * Uses `pointerdown` (instead of `mousedown`) for reliable mobile support —
 * iOS Safari does not fire `mousedown` on non-interactive elements (empty divs, disabled buttons).
 * Pass `enabled = false` to temporarily disable (e.g. when a dropdown is closed).
 */
export function useClickOutside<T extends HTMLElement>(
  ref: RefObject<T | null>,
  handler: () => void,
  enabled = true,
) {
  const handlerRef = useRef(handler)

  useEffect(() => {
    handlerRef.current = handler
  }, [handler])

  useEffect(() => {
    if (!enabled) return
    function handlePointerDown(e: PointerEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        handlerRef.current()
      }
    }
    document.addEventListener('pointerdown', handlePointerDown)
    return () => document.removeEventListener('pointerdown', handlePointerDown)
  }, [enabled, ref])
}
