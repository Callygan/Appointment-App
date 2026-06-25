import { useState } from 'react'
import { supabase } from '../../lib/supabase'
import { getDateStr } from '../../utils/dateUtils'
import { ConfirmModal } from '../../components/ui/ConfirmModal'

interface AnonResult {
  count: number
}

interface PersonResult {
  ids: string[]
  name: string
  phone: string
}

export function GdprTab() {
  const [checking, setChecking] = useState(false)
  const [eligible, setEligible] = useState<AnonResult | null>(null)
  const [showConfirm, setShowConfirm] = useState(false)
  const [running, setRunning] = useState(false)
  const [done, setDone] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)

  // Individual erasure request
  const [phoneInput, setPhoneInput] = useState('')
  const [searching, setSearching] = useState(false)
  const [personResult, setPersonResult] = useState<PersonResult | null>(null)
  const [personNotFound, setPersonNotFound] = useState(false)
  const [showPersonConfirm, setShowPersonConfirm] = useState(false)
  const [personRunning, setPersonRunning] = useState(false)
  const [personDone, setPersonDone] = useState(false)
  const [personError, setPersonError] = useState<string | null>(null)

  const cutoff = new Date()
  cutoff.setMonth(cutoff.getMonth() - 12)
  const cutoffStr = getDateStr(cutoff)

  async function checkEligible() {
    setChecking(true)
    setError(null)
    setDone(null)
    setEligible(null)

    // Fetch appointments older than 12 months not yet anonymized
    const { data: old, error: err } = await supabase
      .from('appointments')
      .select('id, client_phone')
      .neq('client_phone', 'Număr anonim')
      .or(`appointment_date.lt.${cutoffStr},available_slots.date.lt.${cutoffStr}`)

    if (err || !old) {
      // Fallback: query by appointment_date only
      const { data: old2, error: err2 } = await supabase
        .from('appointments')
        .select('id, client_phone')
        .neq('client_phone', 'Număr anonim')
        .lt('appointment_date', cutoffStr)

      if (err2) {
        setError('Nu s-au putut verifica datele. Încearcă din nou.')
        setChecking(false)
        return
      }

      await processEligible(old2 ?? [])
    } else {
      await processEligible(old)
    }

    setChecking(false)
  }

  async function processEligible(oldAppts: { id: string; client_phone: string }[]) {
    if (oldAppts.length === 0) {
      setEligible({ count: 0 })
      return
    }

    // Get unique phones from old appointments
    const oldPhones = [...new Set(oldAppts.map((a) => a.client_phone).filter(Boolean))]

    // Check which phones also have recent appointments (< 12 months)
    const { data: recent } = await supabase
      .from('appointments')
      .select('client_phone')
      .in('client_phone', oldPhones)
      .gte('appointment_date', cutoffStr)

    const recentPhones = new Set((recent ?? []).map((a) => a.client_phone))

    // Eligible = old appointments whose phone has NO recent appointment
    const eligibleIds = oldAppts.filter((a) => !recentPhones.has(a.client_phone))
    setEligible({ count: eligibleIds.length })
  }

  async function runAnonymization() {
    setRunning(true)
    setShowConfirm(false)
    setError(null)

    // Step 1: get old appointments not yet anonymized
    const { data: old, error: fetchErr } = await supabase
      .from('appointments')
      .select('id, client_phone')
      .neq('client_phone', 'Număr anonim')
      .lt('appointment_date', cutoffStr)

    if (fetchErr || !old) {
      setError('Eroare la preluarea datelor. Încearcă din nou.')
      setRunning(false)
      return
    }

    if (old.length === 0) {
      setDone(0)
      setRunning(false)
      return
    }

    const oldPhones = [...new Set(old.map((a) => a.client_phone).filter(Boolean))]

    // Step 2: check which phones have recent appointments
    const { data: recent } = await supabase
      .from('appointments')
      .select('client_phone')
      .in('client_phone', oldPhones)
      .gte('appointment_date', cutoffStr)

    const recentPhones = new Set((recent ?? []).map((a) => a.client_phone))
    const toAnon = old.filter((a) => !recentPhones.has(a.client_phone)).map((a) => a.id)

    if (toAnon.length === 0) {
      setDone(0)
      setRunning(false)
      return
    }

    // Step 3: anonymize in batches of 100
    let anonymized = 0
    const BATCH = 100
    for (let i = 0; i < toAnon.length; i += BATCH) {
      const batch = toAnon.slice(i, i + BATCH)
      const { error: updateErr } = await supabase
        .from('appointments')
        .update({
          client_name: 'client anonim',
          client_phone: 'număr anonim',
          client_instagram: null,
        })
        .in('id', batch)

      if (updateErr) {
        if (import.meta.env.DEV) console.error('anonymize batch error:', updateErr)
        setError(`Eroare la anonimizare (batch ${Math.floor(i / BATCH) + 1}). ${anonymized} înregistrări procesate.`)
        setRunning(false)
        setDone(anonymized)
        return
      }
      anonymized += batch.length
    }

    setDone(anonymized)
    setEligible(null)
    setRunning(false)
  }

  async function searchPerson() {
    const phone = phoneInput.trim()
    if (!phone) return
    setSearching(true)
    setPersonResult(null)
    setPersonNotFound(false)
    setPersonDone(false)
    setPersonError(null)

    const { data, error: searchErr } = await supabase
      .from('appointments')
      .select('id, client_name, client_phone')
      .eq('client_phone', phone)
      .neq('client_phone', 'Număr anonim')

    setSearching(false)

    if (searchErr || !data || data.length === 0) {
      setPersonNotFound(true)
      return
    }

    setPersonResult({
      ids: data.map((a) => a.id),
      name: data[0].client_name,
      phone: data[0].client_phone,
    })
  }

  async function runPersonAnonymization() {
    if (!personResult) return
    setPersonRunning(true)
    setShowPersonConfirm(false)
    setPersonError(null)

    const { error: updateErr } = await supabase
      .from('appointments')
      .update({ client_name: 'client anonim', client_phone: 'număr anonim', client_instagram: null })
      .in('id', personResult.ids)

    if (updateErr) {
      if (import.meta.env.DEV) console.error('person anonymize error:', updateErr)
      setPersonError('Eroare la anonimizare. Încearcă din nou.')
      setPersonRunning(false)
      return
    }

    setPersonRunning(false)
    setPersonDone(true)
    setPersonResult(null)
    setPhoneInput('')
  }

  return (
    <div className="flex flex-col lg:flex-row gap-6 items-start max-w-4xl">

    {/* ── Cerere individuală ── */}
    <div className="flex-1 glass rounded-2xl p-6 flex flex-col gap-5">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center shrink-0">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
          </svg>
        </div>
        <div>
          <h2 className="text-base font-semibold text-[#1d1d1f] m-0">Cerere individuală de ștergere</h2>
          <p className="text-xs text-[#6e6e73] mt-0.5">Art. 17 GDPR — dreptul la ștergere</p>
        </div>
      </div>

      <div className="bg-red-50/60 border border-red-200/50 rounded-xl px-4 py-3 text-xs text-red-700 leading-relaxed">
        Când un client solicită ștergerea datelor sale, caută după numărul de telefon și anonimizează <strong>toate</strong> programările asociate, indiferent de dată.
      </div>

      <form onSubmit={(e) => { e.preventDefault(); searchPerson() }} className="flex gap-2">
        <input
          type="text"
          value={phoneInput}
          onChange={(e) => { setPhoneInput(e.target.value); setPersonResult(null); setPersonNotFound(false); setPersonDone(false) }}
          placeholder="e.g. +40722111222"
          className="flex-1 bg-white/50 backdrop-blur-sm border border-white/60 focus:border-red-400 focus:bg-white/85 rounded-2xl px-4 py-2.5 text-sm text-[#1d1d1f] outline-none transition-all shadow-[inset_0_2px_4px_rgba(0,0,0,0.04)]"
        />
        <button
          type="submit"
          disabled={!phoneInput.trim() || searching || personRunning}
          className="glass rounded-full px-4 py-2.5 text-sm font-medium text-[#1d1d1f] border-none cursor-pointer hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
        >
          {searching ? 'Caută...' : 'Caută'}
        </button>
      </form>

      {personNotFound && (
        <div
          className="glass rounded-3xl overflow-hidden shadow-[0_4px_24px_rgba(0,0,0,0.06)]"
          style={{ animation: 'slideDown 0.35s cubic-bezier(0.4, 0, 0.2, 1)' }}
        >
          <div className="bg-[#34c759]/10 border-b border-[#34c759]/30 px-5 py-2.5 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#34c759]" />
            <span className="text-xs font-semibold uppercase tracking-wide text-[#34c759]">Finalizat</span>
          </div>
          <div className="px-5 py-4">
            <p className="text-sm font-medium text-[#1d1d1f]">Nicio programare găsită pentru acest număr.</p>
          </div>
        </div>
      )}

      {personDone && (
        <div
          className="glass rounded-3xl overflow-hidden shadow-[0_4px_24px_rgba(0,0,0,0.06)]"
          style={{ animation: 'slideDown 0.35s cubic-bezier(0.4, 0, 0.2, 1)' }}
        >
          <div className="bg-[#34c759]/10 border-b border-[#34c759]/30 px-5 py-2.5 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#34c759]" />
            <span className="text-xs font-semibold uppercase tracking-wide text-[#34c759]">Finalizat</span>
          </div>
          <div className="px-5 py-4">
            <p className="text-sm font-medium text-[#1d1d1f]">Datele personale au fost anonimizate cu succes.</p>
          </div>
        </div>
      )}

      {personError && (
        <div className="text-sm text-red-500 px-4 py-3 bg-red-50/60 border border-red-200/50 rounded-xl">{personError}</div>
      )}

      {personResult && (
        <div
          className="glass rounded-3xl overflow-hidden shadow-[0_4px_24px_rgba(0,0,0,0.06)]"
          style={{ animation: 'slideDown 0.35s cubic-bezier(0.4, 0, 0.2, 1)' }}
        >
          {/* Status banner */}
          <div className="bg-red-500/10 border-b border-red-200/40 px-5 py-2.5 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-red-400" />
            <span className="text-xs font-semibold uppercase tracking-wide text-red-500">Client identificat</span>
          </div>

          {/* Info rows */}
          <div className="px-5 py-4 flex flex-col gap-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-[#6e6e73] uppercase tracking-wide">Nume</span>
              <span className="text-sm font-medium text-[#1d1d1f]">{personResult.name}</span>
            </div>
            <div className="h-px bg-white/40" />
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-[#6e6e73] uppercase tracking-wide">Telefon</span>
              <span className="text-sm font-medium text-[#1d1d1f]">{personResult.phone}</span>
            </div>
            <div className="h-px bg-white/40" />
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-[#6e6e73] uppercase tracking-wide">Programări găsite</span>
              <span className="text-sm font-bold text-red-500">{personResult.ids.length}</span>
            </div>
          </div>

          {/* Action */}
          <div className="px-5 pb-5">
            <button
              onClick={() => setShowPersonConfirm(true)}
              disabled={personRunning}
              className="w-full bg-red-500 hover:bg-red-600 text-white border-none rounded-full px-4 py-2.5 text-sm font-semibold cursor-pointer hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_4px_16px_rgba(239,68,68,0.3)]"
            >
              {personRunning ? 'Se anonimizează...' : 'Anonimizează persoana'}
            </button>
          </div>
        </div>
      )}

    </div>

    {showPersonConfirm && personResult && (
      <ConfirmModal
        title="Confirmi ștergerea datelor?"
        description={
          <>
            Datele personale ale lui <strong className="text-[#1d1d1f]">{personResult.name}</strong> ({personResult.phone}) vor fi anonimizate în toate cele <strong className="text-[#1d1d1f]">{personResult.ids.length}</strong> programări. Acțiunea este <strong>ireversibilă</strong>.
          </>
        }
        confirmLabel="Da, anonimizează"
        cancelLabel="Anulează"
        onConfirm={runPersonAnonymization}
        onDismiss={() => setShowPersonConfirm(false)}
      />
    )}

    {/* ── Anonimizare în masă ── */}
    <div className="flex-1 glass rounded-2xl p-6 flex flex-col gap-5">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-[#5e5ce6]/15 flex items-center justify-center shrink-0">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#5e5ce6" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
          </svg>
        </div>
        <div>
          <h2 className="text-base font-semibold text-[#1d1d1f] m-0">Retenție date GDPR</h2>
          <p className="text-xs text-[#6e6e73] mt-0.5">Anonimizare automată conform politicii de confidențialitate</p>
        </div>
      </div>

      {/* Info box */}
      <div className="bg-[#5e5ce6]/8 border border-[#5e5ce6]/20 rounded-xl px-4 py-3 text-xs text-[#3a3a8c] leading-relaxed">
        <strong>Politică:</strong> Datele personale (nume, telefon, Instagram) ale clienților a căror ultimă programare a fost acum <strong>mai mult de 12 luni</strong> vor fi anonimizate. Istoricul programărilor (dată, oră, serviciu, status) se păstrează pentru statistici.
      </div>

      {/* Cutoff date info */}
      <div className="flex items-center justify-between px-4 py-3 glass rounded-xl">
        <span className="text-xs text-[#6e6e73]">Dată limită anonimizare</span>
        <span className="text-xs font-semibold text-[#1d1d1f]">
          {cutoff.toLocaleDateString('ro-RO', { day: 'numeric', month: 'long', year: 'numeric' })}
        </span>
      </div>

      {/* Result */}
      {done !== null && (
        <div
          className="glass rounded-3xl overflow-hidden shadow-[0_4px_24px_rgba(0,0,0,0.06)]"
          style={{ animation: 'slideDown 0.35s cubic-bezier(0.4, 0, 0.2, 1)' }}
        >
          <div className="bg-[#34c759]/10 border-b border-[#34c759]/30 px-5 py-2.5 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#34c759]" />
            <span className="text-xs font-semibold uppercase tracking-wide text-[#34c759]">Finalizat</span>
          </div>
          <div className="px-5 py-4">
            <p className="text-sm font-medium text-[#1d1d1f]">
              {done === 0 ? 'Nicio înregistrare de anonimizat.' : `${done} înregistrări anonimizate cu succes.`}
            </p>
          </div>
        </div>
      )}

      {eligible !== null && done === null && (
        <div
          className="glass rounded-3xl overflow-hidden shadow-[0_4px_24px_rgba(0,0,0,0.06)]"
          style={{ animation: 'slideDown 0.35s cubic-bezier(0.4, 0, 0.2, 1)' }}
        >
          <div className={`border-b px-5 py-2.5 flex items-center gap-2 ${eligible.count === 0 ? 'bg-[#34c759]/10 border-[#34c759]/30' : 'bg-[#f59e0b]/10 border-[#f59e0b]/30'}`}>
            <span className={`w-2 h-2 rounded-full ${eligible.count === 0 ? 'bg-[#34c759]' : 'bg-[#f59e0b] animate-pulse'}`} />
            <span className={`text-xs font-semibold uppercase tracking-wide ${eligible.count === 0 ? 'text-[#34c759]' : 'text-[#f59e0b]'}`}>
              {eligible.count === 0 ? 'Date conforme' : 'Acțiune necesară'}
            </span>
          </div>
          <div className="px-5 py-4 flex items-center justify-between">
            <span className="text-xs font-semibold text-[#6e6e73] uppercase tracking-wide">Înregistrări eligibile</span>
            <span className={`text-sm font-bold ${eligible.count === 0 ? 'text-[#34c759]' : 'text-[#f59e0b]'}`}>{eligible.count}</span>
          </div>
        </div>
      )}

      {error && (
        <div className="text-sm text-red-500 px-4 py-3 bg-red-50/60 border border-red-200/50 rounded-xl">{error}</div>
      )}

      {/* Actions */}
      <div className="flex gap-3">
        <button
          onClick={checkEligible}
          disabled={checking || running}
          className="flex-1 glass rounded-full px-4 py-2.5 text-sm font-medium text-[#1d1d1f] border-none cursor-pointer hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {checking ? 'Se verifică...' : 'Verifică acum'}
        </button>

        {eligible !== null && eligible.count > 0 && done === null && (
          <button
            onClick={() => setShowConfirm(true)}
            disabled={running}
            className="flex-1 bg-[#5e5ce6] hover:bg-[#4b48d6] text-white border-none rounded-full px-4 py-2.5 text-sm font-semibold cursor-pointer hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_4px_16px_rgba(94,92,230,0.35)]"
          >
            {running ? 'Se anonimizează...' : 'Anonimizează'}
          </button>
        )}
      </div>

    </div>

    {showConfirm && (
      <ConfirmModal
        title="Confirmi anonimizarea?"
        description={
          <>
            Vor fi anonimizate <strong className="text-[#1d1d1f]">{eligible?.count} înregistrări</strong>.{' '}
            Datele personale (nume, telefon, Instagram) vor fi înlocuite cu <em>"Client anonim"</em>. Această acțiune este <strong>ireversibilă</strong>.
          </>
        }
        confirmLabel="Da, anonimizează"
        cancelLabel="Anulează"
        onConfirm={runAnonymization}
        onDismiss={() => setShowConfirm(false)}
      />
    )}
    </div>
  )
}
