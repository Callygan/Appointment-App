import { useState } from 'react'
import { Header } from '../../components/Header/Header'
import {
  validateName, validateEmail, validateMessage, validatePhone,
  capitalizeWords, formatPhoneNumber, inputCls, labelCls, inputBorderCls,
} from '../../utils/validation'
import { ConfirmModal } from '../../components/ui/ConfirmModal'

const FORMSPREE_ID = 'maqgyqvo'

export function ContactPage() {
  const [name, setName] = useState('')
  const [nameError, setNameError] = useState<string | null>(null)
  const [email, setEmail] = useState('')
  const [emailError, setEmailError] = useState<string | null>(null)
  const [phoneDialCode, setPhoneDialCode] = useState('+40')
  const [phoneNumber, setPhoneNumber] = useState('')
  const [phoneError, setPhoneError] = useState<string | null>(null)
  const [message, setMessage] = useState('')
  const [messageError, setMessageError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    const nErr = validateName(name)
    const eErr = validateEmail(email)
    const pErr = phoneNumber.trim() ? validatePhone(phoneDialCode, phoneNumber) : null
    const mErr = validateMessage(message)
    setNameError(nErr)
    setEmailError(eErr)
    setPhoneError(pErr)
    setMessageError(mErr)
    if (nErr || eErr || pErr || mErr) return

    setSubmitting(true)
    setStatus('idle')

    const fullPhone = phoneNumber.trim() ? phoneDialCode.trim() + phoneNumber.replace(/\D/g, '') : ''

    try {
      const res = await fetch(`https://formspree.io/f/${FORMSPREE_ID}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ name, email, phone: fullPhone || undefined, message }),
      })
      if (res.ok) {
        setStatus('success')
        setName(''); setEmail(''); setPhoneDialCode('+40'); setPhoneNumber(''); setMessage('')
        setNameError(null); setEmailError(null); setPhoneError(null); setMessageError(null)
      } else {
        setStatus('error')
      }
    } catch {
      setStatus('error')
    }

    setSubmitting(false)
  }

  return (
    <div className="flex flex-col items-center px-4 pt-28 pb-16">
      <Header />


      <div className="w-full max-w-4xl">
        <header className="text-center mb-10">
          <h1 className="text-3xl font-semibold text-[#1d1d1f] tracking-tight mb-2">Contact</h1>
          <p className="text-sm text-[#6e6e73]">Trimite-ne un mesaj și te contactăm în cel mai scurt timp.</p>
        </header>

        <div className="flex flex-col lg:flex-row gap-6 lg:items-start">

        <div className="glass rounded-3xl px-4 py-6 sm:px-8 sm:py-8 shadow-[inset_0_2px_4px_rgba(0,0,0,0.04)] flex-1">
          <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-2">
              <label className={labelCls}>
                <span className="flex items-center gap-1 pl-2">Nume complet <span className="text-red-500 normal-case tracking-normal font-normal">*</span></span>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => { setName(capitalizeWords(e.target.value)); setNameError(null) }}
                  autoComplete="name"
                  placeholder="e.g. Maria Popescu"
                  className={`${inputCls} ${inputBorderCls(!!nameError)}`}
                />
                <span className={`text-xs text-red-500 pl-2 font-normal normal-case tracking-normal ${nameError ? 'visible' : 'invisible'}`}>
                  {nameError ?? 'placeholder'}
                </span>
              </label>

              <label className={labelCls}>
                <span className="flex items-center gap-1 pl-2">Email <span className="text-red-500 normal-case tracking-normal font-normal">*</span></span>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); setEmailError(null) }}
                  autoComplete="email"
                  placeholder="e.g. maria@email.com"
                  className={`${inputCls} ${inputBorderCls(!!emailError)}`}
                />
                <span className={`text-xs text-red-500 pl-2 font-normal normal-case tracking-normal ${emailError ? 'visible' : 'invisible'}`}>
                  {emailError ?? 'placeholder'}
                </span>
              </label>

              <label className={labelCls}>
                <span className="pl-2">Telefon <span className="normal-case tracking-normal font-normal text-[#6e6e73]">(opțional)</span></span>
                <div className={`flex items-center bg-white/50 backdrop-blur-sm border rounded-2xl overflow-hidden focus-within:bg-white/85 transition-all shadow-[inset_0_2px_4px_rgba(0,0,0,0.04)] ${phoneError ? 'border-red-400' : 'border-white/60 focus-within:border-[#34c759]'}`}>
                  <input
                    type="text"
                    value={phoneDialCode}
                    onChange={(e) => { setPhoneDialCode(e.target.value); setPhoneError(null) }}
                    className="w-16 px-3 py-3 text-sm font-medium text-[#1d1d1f] bg-white/30 border-r border-white/60 outline-none text-center shrink-0"
                    placeholder="+40"
                    autoComplete="off"
                  />
                  <input
                    type="tel"
                    value={phoneNumber}
                    onChange={(e) => { setPhoneNumber(formatPhoneNumber(e.target.value)); setPhoneError(null) }}
                    placeholder="7XX XXX XXX"
                    autoComplete="tel"
                    className="flex-1 px-3 py-3 text-sm font-normal text-[#1d1d1f] bg-transparent outline-none"
                  />
                </div>
                <span className={`text-xs text-red-500 pl-2 font-normal normal-case tracking-normal ${phoneError ? 'visible' : 'invisible'}`}>
                  {phoneError ?? 'placeholder'}
                </span>
              </label>

              <label className={labelCls}>
                <span className="flex items-center gap-1 pl-2">Mesaj <span className="text-red-500 normal-case tracking-normal font-normal">*</span></span>
                <textarea
                  value={message}
                  onChange={(e) => { setMessage(e.target.value); setMessageError(null) }}
                  rows={5}
                  placeholder="Scrie mesajul tău aici..."
                  className={`${inputCls} ${inputBorderCls(!!messageError)} resize-none`}
                />
                <span className={`text-xs text-red-500 pl-2 font-normal normal-case tracking-normal ${messageError ? 'visible' : 'invisible'}`}>
                  {messageError ?? 'placeholder'}
                </span>
              </label>

              {/* error modal is rendered at page level below */}

              <div className="flex gap-3 justify-end mt-2">
                <button
                  type="submit"
                  disabled={submitting}
                  className="bg-[#34c759] hover:bg-[#28a745] text-white border-none rounded-full px-6 py-2.5 text-sm font-semibold cursor-pointer transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_4px_16px_rgba(52,199,89,0.35)]"
                >
                  {submitting ? 'Se trimite...' : 'Trimite mesajul'}
                </button>
              </div>
            </form>
        </div>

        {/* Business card widget */}
        <div className="glass rounded-3xl overflow-hidden shadow-[0_4px_24px_rgba(0,0,0,0.08)] lg:w-80 shrink-0 self-stretch flex flex-col">
          {/* Map embed */}
          <div className="w-full h-44 lg:flex-1 overflow-hidden">
            <iframe
              title="Locație salon"
              src="https://maps.google.com/maps?q=Strada+Mihail+Sebastian+nr.+18,+Sibiu,+Romania&output=embed&z=16"
              width="100%"
              height="100%"
              style={{ border: 0, display: 'block' }}
              allowFullScreen
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
          </div>

          {/* Info */}
          <div className="px-5 py-4 flex flex-col gap-3">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-xl bg-[#34c759]/15 flex items-center justify-center shrink-0 mt-0.5">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#34c759" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 0118 0z" />
                  <circle cx="12" cy="10" r="3" />
                </svg>
              </div>
              <div>
                <p className="text-xs font-semibold text-[#6e6e73] uppercase tracking-wide mb-0.5">Adresă</p>
                <a
                  href="https://maps.google.com/?q=Strada+Mihail+Sebastian+nr.+18,+Sibiu"
                  target="_blank"
                  rel="noreferrer"
                  className="text-sm text-[#1d1d1f] no-underline hover:text-[#34c759] transition-colors"
                >
                  Strada Mihail Sebastian nr. 18<br />550326 Sibiu
                </a>
              </div>
            </div>

            <div className="h-px bg-white/40" />

            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-[#5e5ce6]/15 flex items-center justify-center shrink-0">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#5e5ce6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
                  <circle cx="12" cy="12" r="4.5" />
                  <circle cx="17.5" cy="6.5" r="1" fill="#5e5ce6" stroke="none" />
                </svg>
              </div>
              <div>
                <p className="text-xs font-semibold text-[#6e6e73] uppercase tracking-wide mb-0.5">Instagram</p>
                <a
                  href="https://www.instagram.com/nail.bar_sibiu/"
                  target="_blank"
                  rel="noreferrer"
                  className="text-sm text-[#1d1d1f] no-underline hover:text-[#5e5ce6] transition-colors"
                >
                  @nail.bar_sibiu
                </a>
              </div>
            </div>
          </div>
        </div>

        </div>{/* end flex row */}
      </div>

      {status === 'success' && (
        <ConfirmModal
          variant="success"
          title="Mesaj trimis!"
          description="Îți mulțumim. Te vom contacta în cel mai scurt timp."
          confirmLabel="Închide"
          hideCancel
          onDismiss={() => setStatus('idle')}
        />
      )}
      {status === 'error' && (
        <ConfirmModal
          variant="danger"
          title="Eroare la trimitere"
          description="A apărut o eroare. Te rugăm să încerci din nou."
          confirmLabel="Închide"
          hideCancel
          onDismiss={() => setStatus('idle')}
        />
      )}
    </div>
  )
}
