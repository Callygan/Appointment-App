import { useEffect, useState, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import type { Service } from '../types'

export function useServices() {
  const [services, setServices] = useState<Service[]>([])

  const load = useCallback(() => {
    supabase
      .from('services')
      .select('*')
      .order('sort_order')
      .then(({ data }) => setServices(data ?? []))
  }, [])

  useEffect(() => { load() }, [load])

  async function reorder(index: number, direction: 'up' | 'down') {
    const target = index + (direction === 'up' ? -1 : 1)
    if (target < 0 || target >= services.length) return

    const a = services[index]
    const b = services[target]

    // optimistic update — swap instantly in UI
    const updated = [...services]
    updated[index] = { ...b, sort_order: a.sort_order }
    updated[target] = { ...a, sort_order: b.sort_order }
    updated.sort((x, y) => x.sort_order - y.sort_order)
    setServices(updated)

    // sync to DB in background
    await Promise.all([
      supabase.from('services').update({ sort_order: b.sort_order }).eq('id', a.id),
      supabase.from('services').update({ sort_order: a.sort_order }).eq('id', b.id),
    ])
  }

  return { services, refresh: load, reorder }
}
