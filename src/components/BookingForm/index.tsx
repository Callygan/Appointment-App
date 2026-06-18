import { useState } from 'react'
import { supabase } from '../../lib/supabase'
import { useServices } from '../../hooks/useServices'
import { Select } from '../Select'
import PhoneInput, { isValidPhoneNumber } from 'react-phone-number-input'
import 'react-phone-number-input/style.css'
import type { AvailableSlot } from '../../types'

interface Props {
  slot: AvailableSlot
  onSuccess: () => void
  onCancel: () => void
}

function formatTime(time: string) {
  return time.slice(0, 5)
}

function formatDate(date: string) {
  return new Date(date + 'T00:00:00').toLocaleDateString('ro-RO', {
    weekday: 'long', day: 'numeric', month: 'long',
  })
}

export function BookingForm({ slot, onSuccess, onCancel }: Props) {
  const { services } = useServices()

  const [name, setName] = useState('')
  const [phone, setPhone] = useState<string | undefined>(undefined)
  const [phoneError, setPhoneError] = useState(false)
  const [instagram, setInstagram] = useState('')
  const [serviceId, setServiceId] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    if (!phone || !isValidPhoneNumber(phone)) {
      setPhoneError(true)
      return
    }
    setPhoneError(false)
    setSubmitting(true)
    setError(null)

    const { error: rpcError } = await supabase.rpc('book_slot', {
      p_slot_id: slot.id,
      p_client_name: name.trim(),
      p_client_phone: phone,
      p_service_id: serviceId || null,
    })

    if (rpcError) {
      setError(
        rpcError.message.includes('no longer available')
          ? 'Acest interval tocmai a fost rezervat de altcineva. Te rugăm să alegi altul.'
          : 'A apărut o eroare. Te rugăm să încerci din nou.'
      )
      setSubmitting(false)
      return
    }

    // Save instagram separately if provided (appointments row already created)
    if (instagram.trim()) {
      // fetch the latest appointment for this slot and update instagram
      await supabase
        .from('appointments')
        .update({ client_instagram: instagram.trim() })
        .eq('slot_id', slot.id)
        .eq('client_name', name.trim())
    }

    onSuccess()
  }

  const inputCls = "bg-white/50 backdrop-blur-sm border border-white/60 rounded-2xl px-4 py-3 text-sm font-normal text-[#1d1d1f] outline-none focus:bg-white/85 focus:border-[#34c759] transition-all shadow-[inset_0_2px_4px_rgba(0,0,0,0.04)] w-full"
  const labelCls = "flex flex-col gap-1.5 text-xs font-semibold text-[#6e6e73] uppercase tracking-wide"

  return (
    <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-end sm:items-center justify-center z-50 p-0 sm:p-6" onClick={onCancel}>
      <div className="glass-heavy rounded-t-3xl sm:rounded-3xl p-7 w-full max-w-md relative overflow-y-auto max-h-[90vh]" onClick={(e) => e.stopPropagation()}>
        <div className="w-10 h-1 bg-[#1d1d1f]/15 rounded-full mx-auto mb-5 sm:hidden" />
        <button
          className="absolute top-5 right-5 w-7 h-7 rounded-full bg-[#1d1d1f]/10 flex items-center justify-center text-[#6e6e73] hover:bg-[#1d1d1f]/15 transition-colors cursor-pointer border-none"
          onClick={onCancel}
          aria-label="Închide"
        >
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <line x1="1" y1="1" x2="11" y2="11" />
            <line x1="11" y1="1" x2="1" y2="11" />
          </svg>
        </button>

        <h2 className="text-lg font-semibold text-[#1d1d1f] tracking-tight mb-1">Confirmă rezervarea</h2>
        <p className="text-sm text-[#6e6e73] mb-6 leading-relaxed">
          {formatDate(slot.date)} · <strong className="text-[#1d1d1f] font-medium">{formatTime(slot.start_time)} – {formatTime(slot.end_time)}</strong>
        </p>

        <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
          <label className={labelCls}>
            <span className="flex items-center gap-1">Nume complet <span className="text-red-500 normal-case tracking-normal font-normal">*</span></span>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              autoComplete="name"
              placeholder="e.g. Maria Popescu"
              className={inputCls}
            />
          </label>

          <label className={labelCls}>
            <span className="flex items-center gap-1">Telefon <span className="text-red-500 normal-case tracking-normal font-normal">*</span></span>
            <div className={`phone-input-wrapper ${phoneError ? 'phone-input-error' : ''}`}>
              <PhoneInput
                international
                defaultCountry="RO"
                value={phone}
                onChange={(val) => { setPhone(val); setPhoneError(false) }}
                placeholder="07XX XXX XXX"
              />
            </div>
            {phoneError && (
              <span className="text-xs text-red-500 font-normal normal-case tracking-normal">Număr de telefon invalid.</span>
            )}
          </label>

          <label className={labelCls}>
            <span className="flex items-center gap-1">Instagram <span className="text-red-500 normal-case tracking-normal font-normal">*</span></span>
            <div className="flex items-center bg-white/50 backdrop-blur-sm border border-white/60 rounded-2xl overflow-hidden focus-within:bg-white/85 focus-within:border-[#34c759] transition-all shadow-[inset_0_2px_4px_rgba(0,0,0,0.04)]">
              <span className="px-3 py-3 text-sm text-[#6e6e73] border-r border-white/60 bg-white/30">@</span>
              <input
                type="text"
                value={instagram}
                onChange={(e) => setInstagram(e.target.value)}
                required
                placeholder="username"
                autoComplete="off"
                className="flex-1 px-3 py-3 text-sm font-normal text-[#1d1d1f] bg-transparent outline-none"
              />
            </div>
          </label>

          {services.length > 0 && (
            <label className={labelCls}>
              <span className="flex items-center gap-1">Serviciu <span className="text-red-500 normal-case tracking-normal font-normal">*</span></span>
              <Select
                value={serviceId}
                onChange={setServiceId}
                placeholder="— Selectează un serviciu —"
                options={services.map((s) => ({
                  value: s.id,
                  label: s.name + (s.price ? ` — ${s.price} RON` : ''),
                }))}
                className="w-full"
              />
            </label>
          )}

          {error && (
            <p className="text-sm text-red-600 bg-red-50/80 border border-red-200/50 rounded-2xl px-4 py-3 m-0">{error}</p>
          )}

          <div className="flex gap-3 justify-end mt-2">
            <button
              type="button"
              onClick={onCancel}
              disabled={submitting}
              className="px-5 py-2.5 rounded-full text-sm font-medium text-[#6e6e73] glass cursor-pointer hover:scale-105 active:scale-95 transition-all disabled:opacity-50 border-none"
            >
              Anulează
            </button>
            <button
              type="submit"
              disabled={submitting || !name.trim() || !phone || !instagram.trim() || (services.length > 0 && !serviceId)}
              className="bg-[#34c759] hover:bg-[#28a745] text-white border-none rounded-full px-6 py-2.5 text-sm font-semibold cursor-pointer transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:scale-100 shadow-[0_4px_16px_rgba(52,199,89,0.35)]"
            >
              {submitting ? 'Se procesează...' : 'Rezervă'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
