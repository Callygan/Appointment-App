import { useState } from 'react'
import { supabase } from '../../lib/supabase'
import { adminInputCls, labelCls as baseLabelCls } from '../../components/ui/formStyles'
import { greenBtnCls } from '../../components/ui/buttons'
import { MonthCalendar } from '../../components/MonthCalendar/MonthCalendar'
import { useAdminSlots } from '../../hooks/useAdminSlots'
import { ConfirmModal } from '../../components/ui/ConfirmModal'

function localDateStr(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

function getDatesInRange(from: string, to: string, daysOfWeek: number[]): string[] {
  const dates: string[] = []
  const current = new Date(from + 'T00:00:00')
  const end = new Date(to + 'T00:00:00')
  while (current <= end) {
    const dow = current.getDay() === 0 ? 7 : current.getDay()
    if (daysOfWeek.length === 0 || daysOfWeek.includes(dow)) {
      dates.push(localDateStr(current))
    }
    current.setDate(current.getDate() + 1)
  }
  return dates
}

function generateTimeSlots(startTime: string, endTime: string, durationMinutes: number) {
  const slots: { start_time: string; end_time: string }[] = []
  const [sh, sm] = startTime.split(':').map(Number)
  const [eh, em] = endTime.split(':').map(Number)
  let current = sh * 60 + sm
  const end = eh * 60 + em
  while (current + durationMinutes <= end) {
    const s = `${String(Math.floor(current / 60)).padStart(2, '0')}:${String(current % 60).padStart(2, '0')}`
    const e = `${String(Math.floor((current + durationMinutes) / 60)).padStart(2, '0')}:${String((current + durationMinutes) % 60).padStart(2, '0')}`
    slots.push({ start_time: s, end_time: e })
    current += durationMinutes
  }
  return slots
}

function toMinutes(hhmmOrHhmmss: string): number {
  const [h = '0', m = '0'] = hhmmOrHhmmss.split(':')
  return Number(h) * 60 + Number(m)
}

function overlaps(s1: string, e1: string, s2: string, e2: string): boolean {
  const aStart = toMinutes(s1)
  const aEnd = toMinutes(e1)
  const bStart = toMinutes(s2)
  const bEnd = toMinutes(e2)
  return aStart < bEnd && bStart < aEnd
}

const DAY_LABELS = ['Lun', 'Mar', 'Mie', 'Joi', 'Vin', 'Sam', 'Dum']
const DAY_VALUES = [1, 2, 3, 4, 5, 6, 7]

export function SlotsTab() {
  const [tab, setTab] = useState<'single' | 'bulk'>('single')
  const [sDate, setSDate] = useState('')
  const [sStart, setSStart] = useState('10:00')
  const [sDuration, setSDuration] = useState(60)
  const [bFrom, setBFrom] = useState('')
  const [bTo, setBTo] = useState('')
  const [bStart, setBStart] = useState('10:00')
  const [bEnd, setBEnd] = useState('18:00')
  const [bDuration, setBDuration] = useState(120)
  const [bDays, setBDays] = useState<number[]>([1, 2, 3, 4, 5])
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const today = new Date()
  const [adminYear, setAdminYear] = useState(today.getFullYear())
  const [adminMonth, setAdminMonth] = useState(today.getMonth() + 1)
  const [adminSelectedDate, setAdminSelectedDate] = useState<string | null>(null)
  const [showDeleteModal, setShowDeleteModal] = useState<{ id: string; label: string } | null>(null)
  const [overlapConfirm, setOverlapConfirm] = useState<{ date: string; start: string; end: string; newLabel: string; conflictLabel: string } | null>(null)
  const { slots: adminSlots, datesWithSlots: adminDates, loading: adminLoading, deleteSlot, refresh: adminRefresh } = useAdminSlots(adminYear, adminMonth)

  const inputCls = `${adminInputCls} cursor-pointer`
  const compactInputCls = `${inputCls} py-2`
  const labelCls = `${baseLabelCls} cursor-pointer`
  const openPicker = (e: React.MouseEvent<HTMLLabelElement>) => {
    const input = e.currentTarget.querySelector('input') as HTMLInputElement | null
    input?.showPicker?.()
  }
  const submitBtnCls = `${greenBtnCls} w-full py-3`

  function toggleDay(day: number) {
    setBDays((prev) => prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day])
  }

  async function doInsertSingle(date: string, start: string, end: string) {
    setSaving(true); setMessage(null)
    const { error } = await supabase.from('available_slots').insert({ date, start_time: start, end_time: end })
    if (import.meta.env.DEV && error) console.error('insertSlot error:', error)
    setMessage(error ? { type: 'error', text: 'Nu s-a putut adăuga slotul. Încearcă din nou.' } : { type: 'success', text: 'Slot adaugat cu succes.' })
    adminRefresh(); setSaving(false)
  }

  async function handleSingleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const [sh, sm] = sStart.split(':').map(Number)
    const endTotal = sh * 60 + sm + sDuration
    if (endTotal > 24 * 60) {
      setMessage({ type: 'error', text: 'Intervalul selectat depaseste ora 24:00. Alege o ora/durata mai mica.' })
      return
    }
    const sEnd = `${String(Math.floor(endTotal / 60)).padStart(2, '0')}:${String(endTotal % 60).padStart(2, '0')}`
    setMessage(null)
    const { data: existing } = await supabase.from('available_slots').select('start_time, end_time').eq('date', sDate)
    const conflict = existing?.find(s => overlaps(sStart, sEnd, s.start_time, s.end_time))
    if (conflict) {
      // Suprapunerea nu mai blocheaza: cerem confirmarea adminului si adaugam oricum.
      setOverlapConfirm({
        date: sDate,
        start: sStart,
        end: sEnd,
        newLabel: `${sStart} - ${sEnd}`,
        conflictLabel: `${conflict.start_time.slice(0, 5)} - ${conflict.end_time.slice(0, 5)}`,
      })
      return
    }
    await doInsertSingle(sDate, sStart, sEnd)
  }

  async function handleBulkSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (bFrom > bTo) { setMessage({ type: 'error', text: 'Data de sfarsit trebuie sa fie dupa data de start.' }); return }
    if (bStart >= bEnd) { setMessage({ type: 'error', text: 'Ora de sfarsit trebuie sa fie dupa ora de start.' }); return }
    setSaving(true); setMessage(null)
    const dates = getDatesInRange(bFrom, bTo, bDays)
    const timeSlots = generateTimeSlots(bStart, bEnd, bDuration)
    if (dates.length === 0 || timeSlots.length === 0) { setMessage({ type: 'error', text: 'Nu s-au generat sloturi. Verifica setarile.' }); setSaving(false); return }
    const { data: existing } = await supabase.from('available_slots').select('date, start_time, end_time').gte('date', bFrom).lte('date', bTo)
    const allRows = dates.flatMap((date) => timeSlots.map(({ start_time, end_time }) => ({ date, start_time, end_time })))
    const overlappingRows = allRows.filter(row => existing?.some(s => s.date === row.date && overlaps(row.start_time, row.end_time, s.start_time, s.end_time)))
    if (overlappingRows.length > 0) {
      setMessage({ type: 'error', text: 'Exista deja sloturi care se suprapun pe data si ora selectate. Ajusteaza intervalul.' })
      setSaving(false)
      return
    }
    const newRows = allRows
    const { error } = await supabase.from('available_slots').insert(newRows)
    if (import.meta.env.DEV && error) console.error('insertBulkSlots error:', error)
    setMessage(error ? { type: 'error', text: 'Nu s-au putut adăuga sloturile. Încearcă din nou.' } : { type: 'success', text: `${newRows.length} slot(uri) adaugate in ${dates.length} zi(le).` })
    adminRefresh(); setSaving(false)
  }

  const slotsForAdminDate = adminSelectedDate ? adminSlots.filter(s => s.date === adminSelectedDate).sort((a, b) => a.start_time.localeCompare(b.start_time)) : []

  return (
    <div className="flex flex-col xl:flex-row gap-6 items-start">
      <div className="glass rounded-3xl p-6 w-full xl:w-[500px] xl:shrink-0">
        <div className="relative flex bg-white/30 rounded-xl p-1 mb-5">
          <div className="absolute top-1 bottom-1 w-[calc(50%-4px)] rounded-lg bg-white/80 shadow-sm pointer-events-none" style={{ transition: 'transform 0.25s cubic-bezier(0.4, 0, 0.2, 1)', transform: tab === 'bulk' ? 'translateX(calc(100% + 8px))' : 'translateX(0)' }} />
          <button type="button" onClick={() => { setTab('single'); setMessage(null) }} className={`relative z-10 flex-1 rounded-lg py-2 text-sm font-semibold cursor-pointer border-none bg-transparent transition-colors duration-200 ${tab === 'single' ? 'text-[#1d1d1f]' : 'text-[#6e6e73]'}`}>Slot individual</button>
          <button type="button" onClick={() => { setTab('bulk'); setMessage(null) }} className={`relative z-10 flex-1 rounded-lg py-2 text-sm font-semibold cursor-pointer border-none bg-transparent transition-colors duration-200 ${tab === 'bulk' ? 'text-[#1d1d1f]' : 'text-[#6e6e73]'}`}>Generare in masa</button>
        </div>
        {tab === 'single' && (
          <form className="flex flex-col gap-4" onSubmit={handleSingleSubmit}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <label className={`${labelCls} min-w-0`} onClick={openPicker}>Data
                <div className="relative">
                  <input lang="en-GB" type="date" value={sDate} onChange={(e) => setSDate(e.target.value)} required min={localDateStr(today)} className={compactInputCls} />
                  {!sDate && <span className="date-placeholder absolute inset-0 flex items-center px-4 text-sm text-[#aaa] pointer-events-none">Alege data</span>}
                </div>
              </label>
              <label className={`${labelCls} min-w-0`} onClick={openPicker}>Ora<input type="time" value={sStart} onChange={(e) => setSStart(e.target.value)} required className={compactInputCls} /></label>
            </div>
            <label className={labelCls}>Durata
              {(() => {
                const opts = [{ value: 30, label: '30 min' }, { value: 60, label: '1h' }, { value: 90, label: '1.5h' }, { value: 120, label: '2h' }]
                const idx = opts.findIndex((o) => o.value === sDuration)
                return (
                  <div className="relative flex bg-white/30 rounded-xl p-1 mt-0.5">
                    <div className="absolute top-1 bottom-1 rounded-lg bg-white/80 shadow-sm pointer-events-none" style={{ width: `calc((100% - 8px) / ${opts.length})`, transition: 'transform 0.25s cubic-bezier(0.4, 0, 0.2, 1)', transform: `translateX(calc(${idx} * 100% + ${idx} * 2px))` }} />
                    {opts.map((o) => (<button key={o.value} type="button" onClick={() => setSDuration(o.value)} className={`relative z-10 flex-1 rounded-lg py-2 text-xs font-semibold cursor-pointer border-none bg-transparent transition-colors duration-200 ${sDuration === o.value ? 'text-[#1d1d1f]' : 'text-[#6e6e73]'}`}>{o.label}</button>))}
                  </div>
                )
              })()}
            </label>
            <p className={`text-xs text-center m-0 min-h-4 ${message ? (message.type === 'success' ? 'text-[#1a6b2e]' : 'text-red-600') : 'text-transparent'}`}>
              {message?.text ?? '\u00A0'}
            </p>
            <button type="submit" disabled={saving || !sDate || !sStart} className={submitBtnCls}>{saving ? 'Se salveaza...' : 'Adauga slot'}</button>
          </form>
        )}
        {tab === 'bulk' && (
          <form className="flex flex-col gap-4" onSubmit={handleBulkSubmit}>
            <div className="grid grid-cols-2 gap-3">
              <label className={`${labelCls} min-w-0`} onClick={openPicker}>De la data
                <div className="relative">
                  <input lang="en-GB" type="date" value={bFrom} onChange={(e) => { setBFrom(e.target.value); if (bTo && bTo < e.target.value) setBTo('') }} required min={localDateStr(today)} className={compactInputCls} />
                  {!bFrom && <span className="date-placeholder absolute inset-0 flex items-center px-4 text-sm text-[#aaa] pointer-events-none">Alege data</span>}
                </div>
              </label>
              <label className={`${labelCls} min-w-0`} onClick={openPicker}>Pana la data
                <div className="relative">
                  <input lang="en-GB" type="date" value={bTo} onChange={(e) => setBTo(e.target.value)} required min={bFrom || localDateStr(today)} className={compactInputCls} />
                  {!bTo && <span className="date-placeholder absolute inset-0 flex items-center px-4 text-sm text-[#aaa] pointer-events-none">Alege data</span>}
                </div>
              </label>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <label className={`${labelCls} min-w-0`} onClick={openPicker}>Ora start<input type="time" value={bStart} onChange={(e) => setBStart(e.target.value)} required className={compactInputCls} /></label>
              <label className={`${labelCls} min-w-0`} onClick={openPicker}>Ora sfarsit<input type="time" value={bEnd} onChange={(e) => setBEnd(e.target.value)} required className={compactInputCls} /></label>
            </div>
            <label className={labelCls}>Durata slotului
              {(() => {
                const opts = [{ value: 30, label: '30 min' }, { value: 60, label: '1h' }, { value: 90, label: '1.5h' }, { value: 120, label: '2h' }]
                const idx = opts.findIndex((o) => o.value === bDuration)
                return (
                  <div className="relative flex bg-white/30 rounded-xl p-1 mt-0.5">
                    <div className="absolute top-1 bottom-1 rounded-lg bg-white/80 shadow-sm pointer-events-none" style={{ width: `calc((100% - 8px) / ${opts.length})`, transition: 'transform 0.25s cubic-bezier(0.4, 0, 0.2, 1)', transform: `translateX(calc(${idx} * 100% + ${idx} * 2px))` }} />
                    {opts.map((o) => (<button key={o.value} type="button" onClick={() => setBDuration(o.value)} className={`relative z-10 flex-1 rounded-lg py-2 text-xs font-semibold cursor-pointer border-none bg-transparent transition-colors duration-200 ${bDuration === o.value ? 'text-[#1d1d1f]' : 'text-[#6e6e73]'}`}>{o.label}</button>))}
                  </div>
                )
              })()}
            </label>
            <div className="flex flex-col gap-2">
              <span className="text-xs font-semibold text-[#6e6e73] uppercase tracking-wide">Zile din saptamana</span>
              <div className="flex flex-wrap gap-2">
                {DAY_VALUES.map((day, i) => (
                  <button key={day} type="button" onClick={() => toggleDay(day)} className={`rounded-full px-3 py-1.5 text-xs font-semibold cursor-pointer transition-all border ${bDays.includes(day) ? 'bg-[#34c759]/15 border-[#34c759]/40 text-[#1a6b2e] scale-105' : 'bg-white/40 border-white/60 text-[#6e6e73] hover:bg-white/60'}`}>{DAY_LABELS[i]}</button>
                ))}
              </div>
            </div>
            <p className={`text-xs text-center m-0 min-h-4 ${message ? (message.type === 'success' ? 'text-[#1a6b2e]' : 'text-red-600') : 'text-transparent'}`}>
              {message?.text ?? '\u00A0'}
            </p>
            <button type="submit" disabled={saving || !bFrom || !bTo || !bStart || !bEnd || bDays.length === 0} className={submitBtnCls}>{saving ? 'Se genereaza...' : 'Genereaza sloturi'}</button>
          </form>
        )}
      </div>

      <div className="w-full xl:w-[400px] xl:shrink-0 flex flex-col gap-4">
        <div className="glass rounded-3xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-[#1d1d1f]">Sloturi existente</h3>
            {adminLoading && <span className="text-xs text-[#6e6e73]">Se incarca...</span>}
          </div>
          <MonthCalendar year={adminYear} month={adminMonth} datesWithSlots={adminDates} selectedDate={adminSelectedDate} onDaySelect={setAdminSelectedDate}
            onPrev={() => { if (adminMonth === 1) { setAdminYear(y => y - 1); setAdminMonth(12) } else setAdminMonth(m => m - 1); setAdminSelectedDate(null) }}
            onNext={() => { if (adminMonth === 12) { setAdminYear(y => y + 1); setAdminMonth(1) } else setAdminMonth(m => m + 1); setAdminSelectedDate(null) }}
            disablePrev={adminYear === today.getFullYear() && adminMonth === today.getMonth() + 1}
            />
        </div>
        {adminSelectedDate && (
          <div className="glass rounded-3xl overflow-hidden">
            <div className="px-5 py-4 border-b border-white/30 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-[#1d1d1f]">{new Date(adminSelectedDate + 'T00:00:00').toLocaleDateString('ro-RO', { weekday: 'long', day: 'numeric', month: 'long' })}</h3>
              <span className="text-xs text-[#6e6e73]">{slotsForAdminDate.length} slot(uri)</span>
            </div>
            {slotsForAdminDate.length === 0 ? (
              <p className="text-sm text-[#6e6e73] px-5 py-6 text-center">Niciun slot pentru aceasta zi.</p>
            ) : (
              <ul className="list-none m-0 p-0">
                {slotsForAdminDate.map((slot, i) => (
                  <li key={slot.id} className={`flex items-center justify-between px-5 py-3 ${i !== slotsForAdminDate.length - 1 ? 'border-b border-white/30' : ''}`}>
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-semibold text-[#1d1d1f] tabular-nums">{slot.start_time.slice(0, 5)} - {slot.end_time.slice(0, 5)}</span>
                      {slot.is_booked ? <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[#f59e0b]/15 text-[#b45309]">Rezervat</span> : <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[#34c759]/15 text-[#1a6b2e]">Liber</span>}
                    </div>
                    {!slot.is_booked && (
                      <button onClick={() => setShowDeleteModal({ id: slot.id, label: `${slot.start_time.slice(0, 5)} - ${slot.end_time.slice(0, 5)}` })} className="w-7 h-7 flex items-center justify-center rounded-lg text-[#6e6e73] hover:text-red-400 hover:bg-red-50/50 bg-transparent border-none cursor-pointer transition-all" aria-label="Sterge slot">
                        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M2 3.5h10M5.5 3.5V2.5h3v1M5 6l.5 5M9 6l-.5 5" /><rect x="3" y="3.5" width="8" height="9" rx="1.5" /></svg>
                      </button>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>

      {showDeleteModal && (
        <ConfirmModal
          title="Ștergi slotul?"
          description={<>Slotul <strong className="text-[#1d1d1f]">{showDeleteModal.label}</strong> va fi șters definitiv.</>}
          confirmLabel="Da, șterge"
          onConfirm={async () => { const err = await deleteSlot(showDeleteModal.id); if (!err) setShowDeleteModal(null); else setMessage({ type: 'error', text: err }) }}
          onDismiss={() => setShowDeleteModal(null)}
        />
      )}
      {overlapConfirm && (
        <ConfirmModal
          title="Slot suprapus"
          description={<>Noul slot <strong className="text-[#1d1d1f]">{overlapConfirm.newLabel}</strong> se suprapune cu <strong className="text-[#1d1d1f]">{overlapConfirm.conflictLabel}</strong>. Îl adaugi oricum?</>}
          confirmLabel="Da, adaugă"
          onConfirm={async () => { const c = overlapConfirm; setOverlapConfirm(null); await doInsertSingle(c.date, c.start, c.end) }}
          onDismiss={() => setOverlapConfirm(null)}
        />
      )}
    </div>
  )
}
