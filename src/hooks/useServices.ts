import { useEffect, useState, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import type { Service } from '../types'

export function useServices() {
  const [services, setServices] = useState<Service[]>([])

  const load = useCallback(() => {
    supabase
      .from('services')
      .select('*')
      .order('name')
      .then(({ data }) => setServices(data ?? []))
  }, [])

  useEffect(() => { load() }, [load])

  return { services, refresh: load }
}
