import { useState } from 'react'
import { supabase } from '../../lib/supabase'
import { getDateStr } from '../../utils/dateUtils'
import { alertCls, adminInputCls, labelCls } from '../../components/ui/formStyles'
import { useServices } from '../../hooks/useServices'
import type { Service } from '../../types'
import { ConfirmModal } from '../../components/ui/ConfirmModal'

export function ServicesTab() {
  const { services, refresh, reorder } = useServices()

  const [editId, setEditId] = useState<string | null>(null)
  const [showAdd, setShowAdd] = useState(false)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [pendingDelete, setPendingDelete] = useState<{ id: string; name: string } | null>(null)
  const [deleteError, setDeleteError] = useState<string | null>(null)

  // form fields
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [duration, setDuration] = useState(60)
  const [price, setPrice] = useState<number | ''>('')
  const [serviceType, setServiceType] = useState<'main' | 'extra'>('main')

  const inputCls = adminInputCls

  function openAdd() {
    setEditId(null)
    setName(''); setDescription(''); setDuration(60); setPrice(''); setServiceType('main')
    setMessage(null)
    setShowAdd(true)
  }

  function openEdit(s: Service) {
    setEditId(s.id)
    setName(s.name)
    setDescription(s.description ?? '')
    setDuration(s.duration_minutes)
    setPrice(s.price ?? '')
    setServiceType(s.service_type)
    setMessage(null)
    setShowAdd(true)
  }

  function closeForm() {
    setShowAdd(false)
    setEditId(null)
    setMessage(null)
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) return
    setSaving(true)
    setMessage(null)

    const payload = {
      name: name.trim(),
      description: description.trim() || null,
      duration_minutes: duration,
      price: price === '' ? null : Number(price),
      service_type: serviceType,
    }

    const { error } = editId
      ? await supabase.from('services').update(payload).eq('id', editId)
      : await supabase.from('services').insert(payload)

    if (error) {
      if (import.meta.env.DEV) console.error('saveService error:', error)
      setMessage({ type: 'error', text: 'Nu s-a putut salva serviciul. Încearcă din nou.' })
    } else {
      setMessage({ type: 'success', text: editId ? 'Serviciu actualizat.' : 'Serviciu adăugat.' })
      refresh()
      setTimeout(closeForm, 800)
    }
    setSaving(false)
  }

  async function handleDelete(id: string, svcName: string) {
    const todayStr = getDateStr(new Date())

    // Verificăm manual dacă există programări active viitoare
    const { data: activeAppts } = await supabase
      .from('appointments')
      .select('id, appointment_date, available_slots(date)')
      .eq('service_id', id)
      .in('status', ['pending', 'confirmed'])

    const hasFutureActive = (activeAppts ?? []).some((a: {
      appointment_date: string | null
      available_slots: { date: string } | Array<{ date: string }> | null
    }) => {
      const slots = a.available_slots
      const slotDate = Array.isArray(slots) ? slots[0]?.date : slots?.date
      const date = slotDate ?? a.appointment_date ?? null
      return date === null || date >= todayStr
    })

    if (hasFutureActive) {
      setDeleteError(`Nu poți șterge serviciul "${svcName}" — există programări viitoare active pentru el.`)
      setPendingDelete(null)
      return
    }

    // Fără programări viitoare active — nullificăm toate referințele și ștergem
    await supabase.from('appointments').update({ service_id: null }).eq('service_id', id)

    const { error } = await supabase.from('services').delete().eq('id', id)
    if (error) {
      if (import.meta.env.DEV) console.error('deleteService error:', error)
      setDeleteError('Nu s-a putut șterge serviciul. Încearcă din nou.')
    } else {
      setDeleteError(null)
      refresh()
    }
    setPendingDelete(null)
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-[#6e6e73] pl-1"> SERVICII ({services.length})</p>
        <button
          onClick={openAdd}
          className="bg-[#34c759] hover:bg-[#28a745] text-white border-none rounded-full px-4 py-2 text-xs font-semibold cursor-pointer transition-all hover:scale-105 active:scale-95 shadow-[0_2px_8px_rgba(52,199,89,0.3)]"
        >
          + Adaugă serviciu
        </button>
      </div>

      {/* Form add/edit — slide-down to center */}
      <div
        className={`fixed inset-0 z-50 flex items-center justify-center ${showAdd ? 'pointer-events-auto' : 'pointer-events-none'}`}
        aria-hidden={!showAdd}
      >
        {/* Backdrop */}
        <div
          onClick={closeForm}
          className="absolute inset-0 bg-black/30 backdrop-blur-sm"
          style={{
            opacity: showAdd ? 1 : 0,
            transition: 'opacity 0.3s ease',
            pointerEvents: showAdd ? 'auto' : 'none',
          }}
        />
        {/* Panel */}
        <div
          className={`relative w-full max-w-md mx-4 glass-heavy rounded-3xl px-6 pt-6 pb-7 shadow-[0_8px_40px_rgba(0,0,0,0.18)] ${showAdd ? 'pointer-events-auto' : 'pointer-events-none'}`}
          style={{
            transform: showAdd ? 'translateY(0)' : 'translateY(-60px)',
            opacity: showAdd ? 1 : 0,
            transition: 'transform 0.35s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.3s ease',
          }}
        >
          <h3 className="text-sm font-semibold text-[#1d1d1f] mb-4">{editId ? 'Editează serviciu' : 'Serviciu nou'}</h3>
          <form onSubmit={handleSave} className="flex flex-col gap-3">
            <label className={labelCls}>
              <span className="flex items-center gap-1 pl-2">Denumire Serviciu <span className="text-red-500 normal-case tracking-normal font-normal">*</span></span>
              <input type="text" value={name} onChange={(e) => setName(e.target.value)} required placeholder="e.g. Manichiură gel" className={inputCls} />
            </label>
            <label className={labelCls}>
              <span className="flex items-center gap-1 pl-2">Descriere <span className="normal-case tracking-normal font-normal text-[#6e6e73]">(opțional)</span></span>
              <input type="text" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="e.g. Pilire + lac gel culori standard" className={inputCls} />
            </label>
            <div className="grid grid-cols-2 gap-3">
              <label className={labelCls}>
                <span className="flex items-center gap-1 pl-2">
                  Durată (min)
                  {serviceType === 'extra'
                    ? <span className="normal-case tracking-normal font-normal text-[#6e6e73]"></span>
                    : <span className="text-red-500 normal-case tracking-normal font-normal">*</span>
                  }
                </span>
                <input
                  type="number"
                  value={duration}
                  min={5}
                  step={5}
                  onChange={(e) => setDuration(Number(e.target.value))}
                  required={serviceType !== 'extra'}
                  disabled={serviceType === 'extra'}
                  className={`${inputCls} ${serviceType === 'extra' ? 'opacity-40 cursor-not-allowed' : ''}`}
                />
              </label>
              <label className={labelCls}>
                <span className="flex items-center gap-1 pl-2">Preț (RON) <span className="text-red-500 normal-case tracking-normal font-normal">*</span></span>
                <input type="number" value={price} min={0} step={1} onChange={(e) => setPrice(e.target.value === '' ? '' : Number(e.target.value))} required placeholder="e.g. 10" className={inputCls} />
              </label>
            </div>
            <label className={labelCls}>
              Tip serviciu
              <div className="relative flex bg-white/30 rounded-xl p-1 mt-0.5">
                <div
                  className="absolute top-1 bottom-1 w-[calc(50%-4px)] rounded-lg bg-white/80 shadow-sm pointer-events-none"
                  style={{
                    transition: 'transform 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                    transform: serviceType === 'extra' ? 'translateX(calc(100% + 8px))' : 'translateX(0)',
                  }}
                />
                <button
                  type="button"
                  onClick={() => setServiceType('main')}
                  className={`relative z-10 flex-1 rounded-lg py-2 text-xs font-semibold cursor-pointer border-none bg-transparent transition-colors duration-200 ${serviceType === 'main' ? 'text-[#1a6b2e]' : 'text-[#6e6e73]'}`}
                >
                  Principal
                </button>
                <button
                  type="button"
                  onClick={() => setServiceType('extra')}
                  className={`relative z-10 flex-1 rounded-lg py-2 text-xs font-semibold cursor-pointer border-none bg-transparent transition-colors duration-200 ${serviceType === 'extra' ? 'text-[#3634a3]' : 'text-[#6e6e73]'}`}
                >
                  Extra
                </button>
              </div>
            </label>

            {message && (
              <p className={alertCls(message.type)}>
                {message.text}
              </p>
            )}

            <div className="flex gap-2 justify-end mt-1">
              <button type="button" onClick={closeForm} className="px-4 py-2 rounded-full text-sm font-medium text-[#6e6e73] glass cursor-pointer border-none hover:scale-105 transition-all">
                Anulează
              </button>
              <button type="submit" disabled={saving || !name.trim()} className="bg-[#34c759] hover:bg-[#28a745] text-white border-none rounded-full px-5 py-2 text-sm font-semibold cursor-pointer transition-all hover:scale-105 disabled:opacity-50">
                {saving ? 'Se salvează...' : 'Salvează'}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Lista servicii */}
      <div className="glass rounded-2xl">
        {services.length === 0 ? (
          <p className="text-sm text-[#6e6e73] px-5 py-6 text-center">Niciun serviciu adăugat.</p>
        ) : (
          <ul className="list-none m-0 p-0">
            {services.map((s, i) => (
              <li
                key={s.id}
                className={`flex items-start gap-3 px-4 py-3.5 ${i !== services.length - 1 ? 'border-b border-white/30' : ''}`}
              >
                {/* Reorder buttons */}
                <div className="flex flex-col gap-0.5 shrink-0 mt-0.5">
                  <button
                    onClick={() => reorder(i, 'up')}
                    disabled={i === 0}
                    className="w-5 h-5 flex items-center justify-center rounded text-[#6e6e73] hover:text-[#1d1d1f] hover:bg-white/50 disabled:opacity-20 disabled:cursor-not-allowed bg-transparent border-none cursor-pointer transition-all"
                    aria-label="Mută sus"
                  >
                    <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M2 7l3-4 3 4" />
                    </svg>
                  </button>
                  <button
                    onClick={() => reorder(i, 'down')}
                    disabled={i === services.length - 1}
                    className="w-5 h-5 flex items-center justify-center rounded text-[#6e6e73] hover:text-[#1d1d1f] hover:bg-white/50 disabled:opacity-20 disabled:cursor-not-allowed bg-transparent border-none cursor-pointer transition-all"
                    aria-label="Mută jos"
                  >
                    <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M2 3l3 4 3-4" />
                    </svg>
                  </button>
                </div>

                {/* Name + details */}
                <div className="flex flex-col gap-0.5 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-[#1d1d1f]">{s.name}</span>
                    <span className={`hidden sm:inline text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${
                      s.service_type === 'extra'
                        ? 'bg-[#5e5ce6]/15 text-[#3634a3]'
                        : 'bg-[#34c759]/15 text-[#1a6b2e]'
                    }`}>
                      {s.service_type === 'extra' ? 'extra' : 'principal'}
                    </span>
                  </div>
                  {s.description && <span className="text-xs text-[#6e6e73]">{s.description}</span>}
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-[#6e6e73]/60">{s.duration_minutes} min</span>
                    <span className={`sm:hidden text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${
                      s.service_type === 'extra'
                        ? 'bg-[#5e5ce6]/15 text-[#3634a3]'
                        : 'bg-[#34c759]/15 text-[#1a6b2e]'
                    }`}>
                      {s.service_type === 'extra' ? 'extra' : 'principal'}
                    </span>
                  </div>
                </div>

                {/* Price + Actions */}
                <div className="ml-auto shrink-0 flex flex-col items-end gap-1 sm:flex-row sm:items-center sm:gap-1">
                  <span className="text-sm font-semibold text-[#1d1d1f] w-20 text-right sm:text-center">
                    {s.price != null ? `${s.price} RON` : '—'}
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => openEdit(s)}
                      className="w-8 h-8 flex items-center justify-center rounded-lg text-[#6e6e73] hover:text-[#34c759] hover:bg-white/50 bg-transparent border-none cursor-pointer transition-all"
                      aria-label="Editează"
                    >
                      <svg width="18" height="18" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M9.5 2.5l2 2L4 12H2v-2L9.5 2.5z" />
                      </svg>
                    </button>
                    <button
                      onClick={() => setPendingDelete({ id: s.id, name: s.name })}
                      className="w-8 h-8 flex items-center justify-center rounded-lg text-[#6e6e73] hover:text-red-400 hover:bg-red-50/50 bg-transparent border-none cursor-pointer transition-all"
                      aria-label="Șterge"
                    >
                      <svg width="18" height="18" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M2 3.5h10M5.5 3.5V2.5h3v1M5 6l.5 5M9 6l-.5 5" />
                        <rect x="3" y="3.5" width="8" height="9" rx="1.5" />
                      </svg>
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {pendingDelete && (
        <ConfirmModal
          title="Ștergi serviciul?"
          description={<>Serviciul <strong className="text-[#1d1d1f]">"{pendingDelete.name}"</strong> va fi șters definitiv.</>}
          confirmLabel="Da, șterge"
          onConfirm={() => handleDelete(pendingDelete.id, pendingDelete.name)}
          onDismiss={() => setPendingDelete(null)}
        />
      )}

      {deleteError && (
        <div className="glass rounded-2xl px-5 py-4 flex items-start gap-3">
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="#ef4444" strokeWidth="1.8" strokeLinecap="round" className="shrink-0 mt-0.5"><circle cx="9" cy="9" r="7.5"/><path d="M9 5.5v4M9 12h.01"/></svg>
          <div className="flex-1 min-w-0">
            <p className="text-sm text-red-600">{deleteError}</p>
          </div>
          <button onClick={() => setDeleteError(null)} className="shrink-0 text-[#6e6e73] hover:text-red-500 bg-transparent border-none cursor-pointer p-0.5">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>
      )}
    </div>
  )
}
