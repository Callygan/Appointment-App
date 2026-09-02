import { createClient } from '@supabase/supabase-js'
import type { PostgrestError } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Lipsesc variabilele de mediu VITE_SUPABASE_URL sau VITE_SUPABASE_ANON_KEY')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

type QueryResult<T> = { data: T | null; error: PostgrestError | null }

/**
 * Runs a Supabase query that requires the admin session.
 *
 * Ensures the auth token (JWT) is restored/attached BEFORE the request fires,
 * avoiding a race right after page load / tab refocus where the first query can
 * leave as the `anon` role. Since tables like `appointments` are revoked for
 * `anon`, such a stray request fails with "permission denied for table ...".
 *
 * If it still lands as `anon` (e.g. exactly during a token refresh), it waits
 * for the session again and retries the query once.
 */
export async function runAuthed<T>(
  makeQuery: () => PromiseLike<QueryResult<T>>,
): Promise<QueryResult<T>> {
  await supabase.auth.getSession()
  let res = await makeQuery()
  if (res.error && /permission denied/i.test(res.error.message)) {
    await supabase.auth.getSession()
    res = await makeQuery()
  }
  return res
}
