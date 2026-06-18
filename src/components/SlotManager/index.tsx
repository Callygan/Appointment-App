import { useState } from 'react'
import { supabase } from '../../lib/supabase'
import { Select } from '../Select'

// Returns all dates between from and to (inclusive) that match selected days of week
function getDatesInRange(from: string, to: string, daysOfWeek: number[]): string[] {
  const dates: string[] = []
  const current = new Date(from + 'T00:00:00')
  const end = new Date(to + 'T00:00:00')

  while (current <= end) {
    // getDay(): 0=Sun, 1=Mon ... 6=Sat — we store Mon=1..Sun=7
    const dow = current.getDay() === 0 ? 7 : current.getDay()
    if (daysOfWeek.length === 0 || daysOfWeek.includes(dow)) {
      dates.push(current.toISOString().slice(0, 10))
    }
    current.setDate(current.getDate() + 1)
  }
  return dates
}

// Generates slots of duration_minutes between startTime and endTime
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

const DAY_LABELS = ['Lun', 'Mar', 'Mie', 'Joi', 'Vin', 'Sâm', 'Dum']
const DAY_VALUES = [1, 2, 3, 4, 5, 6, 7]

export function SlotManager() {
  const [tab, setTab] = useState<'single' | 'bulk'>('single')

  // Single slot state
  const [sDate, setSDate] = useState('')
  const [sStart, setSStart] = useState('10:00')
  const [sEnd, setSEnd] = useState('12:00')

  // Bulk state
  const [bFrom, setBFrom] = useState('')
  const [bTo, setBTo] = useState('')
  const [bStart, setBStart] = useState('10:00')
  const [bEnd, setBEnd] = useState('18:00')
  const [bDuration, setBDuration] = useState(120)
  const [bDays, setBDays] = useState<number[]>([1, 2, 3, 4, 5]) // Mon-Fri

  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const inputCls = "bg-white/50 backdrop-blur-sm border border-white/60 rounded-2xl px-4 py-2.5 text-sm font-normal text-[#1d1d1f] outline-none focus:bg-white/85 focus:border-[#34c759] transition-all w-full shadow-[inset_0_2px_4px_rgba(0,0,0,0.04)]"
  const labelCls = "flex flex-col gap-1.5 text-xs font-semibold text-[#6e6e73] uppercase tracking-wide"
  const tabBtnCls = (active: boolean) => `flex-1 rounded-xl py-2 text-sm font-medium transition-all cursor-pointer border-none ${active ? 'bg-white/80 text-[#1d1d1f] shadow-sm' : 'text-[#6e6e73] bg-transparent'}`
  const submitBtnCls = "bg-[#34c759] hover:bg-[#28a745] text-white border-none rounded-full py-3 text-sm font-semibold cursor-pointer transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:scale-100 shadow-[0_4px_16px_rgba(52,199,89,0.3)]"
  const msgCls = (type: 'success' | 'error') => `text-sm rounded-2xl px-4 py-3 m-0 ${type === 'success' ? 'bg-[#34c759]/15 text-[#1a6b2e]' : 'bg-red-50/80 text-red-600'}`

  function toggleDay(day: number) {
    setBDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    )
  }

  async function handleSingleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (sStart >= sEnd) {
      setMessage({ type: 'error', text: 'End time must be after start time.' })
      return
    }
    setSaving(true)
    setMessage(null)

    const { error } = await supabase
      .from('available_slots')
      .insert({ date: sDate, start_time: sStart, end_time: sEnd })

    setMessage(error
      ? { type: 'error', text: error.message }
      : { type: 'success', text: 'Slot adăugat cu succes.' }
    )
    setSaving(false)
  }

  async function handleBulkSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (bFrom > bTo) {
      setMessage({ type: 'error', text: 'Data de sfârșit trebuie să fie după data de start.' })
      return
    }
    if (bStart >= bEnd) {
      setMessage({ type: 'error', text: 'Ora de sfârșit trebuie să fie după ora de start.' })
      return
    }

    setSaving(true)
    setMessage(null)

    const dates = getDatesInRange(bFrom, bTo, bDays)
    const timeSlots = generateTimeSlots(bStart, bEnd, bDuration)

    if (dates.length === 0 || timeSlots.length === 0) {
      setMessage({ type: 'error', text: 'Nu s-au generat sloturi. Verifică setările.' })
      setSaving(false)
      return
    }

    const rows = dates.flatMap((date) =>
      timeSlots.map(({ start_time, end_time }) => ({ date, start_time, end_time }))
    )

    const { error } = await supabase.from('available_slots').insert(rows)

    setMessage(error
      ? { type: 'error', text: error.message }
      : { type: 'success', text: `${rows.length} slot(uri) adăugate în ${dates.length} zi(le).` }
    )
    setSaving(false)
  }

  return (
    <div className="glass rounded-3xl p-6 max-w-lg">
      <div className="flex gap-1 mb-5 bg-white/40 rounded-2xl p-1">
        <button className={tabBtnCls(tab === 'single')} onClick={() => { setTab('single'); setMessage(null) }}>Slot individual</button>
        <button className={tabBtnCls(tab === 'bulk')} onClick={() => { setTab('bulk'); setMessage(null) }}>Generare în masă</button>
      </div>

      {tab === 'single' && (
        <form className="flex flex-col gap-4" onSubmit={handleSingleSubmit}>
          <label className={labelCls}>
            Dată
            <input type="date" value={sDate} onChange={(e) => setSDate(e.target.value)} required className={inputCls} />
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label className={labelCls}>
              Oră start
              <input type="time" value={sStart} onChange={(e) => setSStart(e.target.value)} required className={inputCls} />
            </label>
            <label className={labelCls}>
              Oră sfârșit
              <input type="time" value={sEnd} onChange={(e) => setSEnd(e.target.value)} required className={inputCls} />
            </label>
          </div>
          {message && <p className={msgCls(message.type)}>{message.text}</p>}
          <button type="submit" disabled={saving} className={submitBtnCls}>
            {saving ? 'Se salvează...' : 'Adaugă slot'}
          </button>
        </form>
      )}

      {tab === 'bulk' && (
        <form className="flex flex-col gap-4" onSubmit={handleBulkSubmit}>
          <div className="grid grid-cols-2 gap-3">
            <label className={labelCls}>
              De la data
              <input type="date" value={bFrom} onChange={(e) => setBFrom(e.target.value)} required className={inputCls} />
            </label>
            <label className={labelCls}>
              Până la data
              <input type="date" value={bTo} onChange={(e) => setBTo(e.target.value)} required className={inputCls} />
            </label>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <label className={labelCls}>
              Oră start
              <input type="time" value={bStart} onChange={(e) => setBStart(e.target.value)} required className={inputCls} />
            </label>
            <label className={labelCls}>
              Oră sfârșit
              <input type="time" value={bEnd} onChange={(e) => setBEnd(e.target.value)} required className={inputCls} />
            </label>
          </div>

          <label className={labelCls}>
            Durata slotului
            <Select
              value={String(bDuration)}
              onChange={(v) => setBDuration(Number(v))}
              options={[
                { value: '30', label: '30 min' },
                { value: '60', label: '1 oră' },
                { value: '90', label: '1.5 ore' },
                { value: '120', label: '2 ore' },
                { value: '180', label: '3 ore' },
              ]}
            />
          </label>

          <div className="flex flex-col gap-2">
            <span className="text-xs font-semibold text-[#6e6e73] uppercase tracking-wide">Zile din săptămână</span>
            <div className="flex flex-wrap gap-2">
              {DAY_VALUES.map((day, i) => (
                <button
                  key={day}
                  type="button"
                  onClick={() => toggleDay(day)}
                  className={`rounded-full px-3 py-1.5 text-xs font-semibold cursor-pointer transition-all border ${
                    bDays.includes(day)
                      ? 'bg-[#34c759]/15 border-[#34c759]/40 text-[#1a6b2e] scale-105'
                      : 'bg-white/40 border-white/60 text-[#6e6e73] hover:bg-white/60'
                  }`}
                >
                  {DAY_LABELS[i]}
                </button>
              ))}
            </div>
          </div>

          {message && <p className={msgCls(message.type)}>{message.text}</p>}
          <button type="submit" disabled={saving} className={submitBtnCls}>
            {saving ? 'Se generează...' : 'Generează sloturi'}
          </button>
        </form>
      )}
    </div>
  )
}
