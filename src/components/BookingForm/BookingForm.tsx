import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { Select } from '../Select/Select'
import { validateName, validatePhone, capitalizeWords, formatPhoneNumber, sanitizeName, sanitizeInstagram } from '../../utils/validation'
import { inputCls, labelCls, inputBorderCls } from '../ui/formStyles'
import { greenBtnCls } from '../ui/buttons'
import { formatTime, formatDate } from '../../utils/dateUtils'
import type { AvailableSlot, Service } from '../../types'

interface Props {
  slot: AvailableSlot
  services: Service[]
  onSuccess: (bookingNumber: number, serviceName?: string, servicePrice?: number) => void
  onCancel: () => void
}

export function BookingForm({ slot, services, onSuccess, onCancel }: Props) {
  const mainServices = services.filter((s) => s.service_type === 'main')

  const [name, setName] = useState('')
  const [nameError, setNameError] = useState<string | null>(null)
  const [phoneDialCode, setPhoneDialCode] = useState('+40')
  const [phoneNumber, setPhoneNumber] = useState('')
  const [phoneError, setPhoneError] = useState(false)
  const [serviceError, setServiceError] = useState(false)
  const [instagram, setInstagram] = useState('')
  const [serviceId, setServiceId] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    let hasError = false

    const nameErr = validateName(name)
    if (nameErr) {
      setNameError(nameErr)
      hasError = true
    } else {
      setNameError(null)
    }

    if (validatePhone(phoneDialCode, phoneNumber)) {
      setPhoneError(true)
      hasError = true
    } else {
      setPhoneError(false)
    }

    if (mainServices.length > 0 && !serviceId) {
      setServiceError(true)
      hasError = true
    } else {
      setServiceError(false)
    }

    if (hasError) return
    setSubmitting(true)
    setError(null)

    const fullPhone = phoneDialCode.trim() + phoneNumber.replace(/\D/g, '')

    const { data: bookingNumber, error: rpcError } = await supabase.rpc('book_slot', {
      p_slot_id: slot.id,
      p_client_name: name.trim(),
      p_client_phone: fullPhone,
      p_service_id: serviceId || null,
      p_client_instagram: instagram.replace(/\.+$/, '') || null,
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

    const selectedService = mainServices.find((s) => s.id === serviceId)
    onSuccess(bookingNumber as number, selectedService?.name, selectedService?.price)
  }

  const [visible, setVisible] = useState(false)
  useEffect(() => { const t = setTimeout(() => setVisible(true), 10); return () => clearTimeout(t) }, [])

  const inputBorder = (hasErr: boolean) => inputBorderCls(hasErr)

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none"
      onClick={onCancel}
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/30 backdrop-blur-sm pointer-events-auto"
        style={{ opacity: visible ? 1 : 0, transition: 'opacity 0.3s ease' }}
      />
      <div
        className="relative glass-heavy rounded-3xl p-7 w-full max-w-md mx-4 overflow-y-auto max-h-[90vh] pointer-events-auto"
        style={{
          transform: visible ? 'translateY(0)' : 'translateY(-60px)',
          opacity: visible ? 1 : 0,
          transition: 'transform 0.35s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.3s ease',
        }}
        onClick={(e) => e.stopPropagation()}
      >
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
          {formatDate(slot.date, { weekday: 'long', day: 'numeric', month: 'long' })} · <strong className="text-[#1d1d1f] font-medium">{formatTime(slot.start_time)}</strong>
        </p>

        <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-2">
          <label className={labelCls}>
            <span className="flex items-center gap-1 pl-2">Nume complet <span className="text-red-500 normal-case tracking-normal font-normal">*</span></span>
            <input
              type="text"
              value={name}
              onChange={(e) => {
                  setName(capitalizeWords(sanitizeName(e.target.value)))
                  setNameError(null)
                }}
              autoComplete="name"
              placeholder="e.g. Maria Popescu"
              className={`${inputCls} ${inputBorder(Boolean(nameError))}`}
            />
            <span className={`text-xs text-red-500 pl-2 font-normal normal-case tracking-normal ${nameError ? 'visible' : 'invisible'}`}>{nameError ?? 'Introdu numele complet (minim 5 caractere).'}</span>
          </label>

          <label className={labelCls}>
            <span className="flex items-center gap-1 pl-2">Telefon <span className="text-red-500 normal-case tracking-normal font-normal">*</span></span>
            <div className={`flex items-center bg-white/50 backdrop-blur-sm border rounded-2xl overflow-hidden focus-within:bg-white/85 transition-all shadow-[inset_0_2px_4px_rgba(0,0,0,0.04)] ${phoneError ? 'border-red-400' : 'border-white/60 focus-within:border-[#34c759]'}`}>
              <input
                type="text"
                value={phoneDialCode}
                onChange={(e) => { setPhoneDialCode(e.target.value); setPhoneError(false) }}
                className="w-16 px-3 py-3 text-sm font-medium text-[#1d1d1f] bg-white/30 border-r border-white/60 outline-none text-center shrink-0"
                placeholder="+40"
                autoComplete="off"
              />
              <input
                type="tel"
                value={phoneNumber}
                onChange={(e) => {
                  setPhoneNumber(formatPhoneNumber(e.target.value))
                  setPhoneError(false)
                }}
                placeholder="7XX XXX XXX"
                autoComplete="tel"
                className="flex-1 px-3 py-3 text-sm font-normal text-[#1d1d1f] bg-transparent outline-none"
              />
            </div>
            <span className={`text-xs text-red-500 pl-2 font-normal normal-case tracking-normal ${phoneError ? 'visible' : 'invisible'}`}>Număr de telefon invalid.</span>
          </label>

          <label className={labelCls}>
            <span className="pl-2">Instagram</span>
            <div className="flex items-center bg-white/50 backdrop-blur-sm border border-white/60 rounded-2xl overflow-hidden focus-within:bg-white/85 focus-within:border-[#34c759] transition-all shadow-[inset_0_2px_4px_rgba(0,0,0,0.04)]">
              <span className="px-3 py-3 text-sm text-[#6e6e73] border-r border-white/60 bg-white/30">@</span>
              <input
                type="text"
                value={instagram}
                onChange={(e) => {
                  setInstagram(sanitizeInstagram(e.target.value))
                }}
                placeholder="username"
                autoComplete="off"
                autoCapitalize="none"
                autoCorrect="off"
                spellCheck={false}
                className="flex-1 px-3 py-3 text-sm font-normal text-[#1d1d1f] bg-transparent outline-none"
              />
            </div>
          </label>

          {mainServices.length > 0 && (
            <label className={labelCls}>
              <span className="flex items-center gap-1 pl-2 pt-5">Serviciu <span className="text-red-500 normal-case tracking-normal font-normal">*</span></span>
              <Select
                value={serviceId}
                onChange={(v) => { setServiceId(v); setServiceError(false) }}
                error={serviceError}
                placeholder="— Selectează un serviciu —"
                options={mainServices.map((s) => ({
                  value: s.id,
                  label: s.name + (s.price ? ` — ${s.price} RON` : ''),
                }))}
                className="w-full"
              />
              <span className={`text-xs text-red-500 pl-2 font-normal normal-case tracking-normal ${serviceError ? 'visible' : 'invisible'}`}>Te rugăm să selectezi un serviciu.</span>
            </label>
          )}

          {error && (
            <p className="text-sm text-red-600 bg-red-50/80 border border-red-200/50 rounded-2xl px-4 py-3 m-0">{error}</p>
          )}

          <div className="flex gap-3 justify-center mt-2">
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
              disabled={submitting}
              className={`${greenBtnCls} px-6 py-2.5`}
            >
              {submitting ? 'Se procesează...' : 'Rezervă'}
            </button>
          </div>
          <p className="text-center text-[11px] pt-2 text-[#9ca3af] leading-relaxed px-2">
            Prin trimiterea acestui formular, ești de acord cu{' '}
            <a href="/politica-de-confidentialitate" target="_blank" rel="noreferrer" className="underline hover:text-[#6e6e73] transition-colors">
              politica noastră de confidențialitate
            </a>{' '}
            și cu prelucrarea datelor tale personale în scopul gestionării programării.
          </p>
        </form>
      </div>
    </div>
  )
}
