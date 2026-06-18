import { useState } from 'react'
import { supabase } from '../../lib/supabase'
import { useServices } from '../../hooks/useServices'
import type { Service } from '../../types'

export function ServiceManager() {
  const { services, refresh } = useServices()

  const [editId, setEditId] = useState<string | null>(null)
  const [showAdd, setShowAdd] = useState(false)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  // form fields
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [duration, setDuration] = useState(60)
  const [price, setPrice] = useState<number | ''>('')

  const inputCls = "bg-white/50 backdrop-blur-sm border border-white/60 rounded-2xl px-4 py-2.5 text-sm font-normal text-[#1d1d1f] outline-none focus:bg-white/85 focus:border-[#34c759] transition-all w-full shadow-[inset_0_2px_4px_rgba(0,0,0,0.04)]"
  const labelCls = "flex flex-col gap-1.5 text-xs font-semibold text-[#6e6e73] uppercase tracking-wide"

  function openAdd() {
    setEditId(null)
    setName(''); setDescription(''); setDuration(60); setPrice('')
    setMessage(null)
    setShowAdd(true)
  }

  function openEdit(s: Service) {
    setEditId(s.id)
    setName(s.name)
    setDescription(s.description ?? '')
    setDuration(s.duration_minutes)
    setPrice(s.price ?? '')
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
    }

    const { error } = editId
      ? await supabase.from('services').update(payload).eq('id', editId)
      : await supabase.from('services').insert(payload)

    if (error) {
      setMessage({ type: 'error', text: error.message })
    } else {
      setMessage({ type: 'success', text: editId ? 'Serviciu actualizat.' : 'Serviciu adăugat.' })
      refresh()
      setTimeout(closeForm, 800)
    }
    setSaving(false)
  }

  async function handleDelete(id: string, svcName: string) {
    if (!confirm(`Ștergi serviciul "${svcName}"?`)) return
    const { error } = await supabase.from('services').delete().eq('id', id)
    if (error) alert(error.message)
    else refresh()
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-[#6e6e73]">{services.length} serviciu(i)</p>
        <button
          onClick={openAdd}
          className="bg-[#34c759] hover:bg-[#28a745] text-white border-none rounded-full px-4 py-2 text-xs font-semibold cursor-pointer transition-all hover:scale-105 active:scale-95 shadow-[0_2px_8px_rgba(52,199,89,0.3)]"
        >
          + Adaugă serviciu
        </button>
      </div>

      {/* Form add/edit */}
      {showAdd && (
        <div className="glass rounded-2xl p-5">
          <h3 className="text-sm font-semibold text-[#1d1d1f] mb-4">{editId ? 'Editează serviciu' : 'Serviciu nou'}</h3>
          <form onSubmit={handleSave} className="flex flex-col gap-3">
            <label className={labelCls}>
              Nume *
              <input type="text" value={name} onChange={(e) => setName(e.target.value)} required placeholder="ex. Manichiură gel" className={inputCls} />
            </label>
            <label className={labelCls}>
              Descriere <span className="normal-case tracking-normal font-normal text-[#6e6e73]">(opțional)</span>
              <input type="text" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="ex. Pilire + lac gel culori standard" className={inputCls} />
            </label>
            <div className="grid grid-cols-2 gap-3">
              <label className={labelCls}>
                Durată (min)
                <input type="number" value={duration} min={5} step={5} onChange={(e) => setDuration(Number(e.target.value))} required className={inputCls} />
              </label>
              <label className={labelCls}>
                Preț (RON)
                <input type="number" value={price} min={0} step={1} onChange={(e) => setPrice(e.target.value === '' ? '' : Number(e.target.value))} placeholder="—" className={inputCls} />
              </label>
            </div>

            {message && (
              <p className={`text-sm rounded-2xl px-4 py-3 m-0 ${message.type === 'success' ? 'bg-[#34c759]/15 text-[#1a6b2e]' : 'bg-red-50/80 text-red-600'}`}>
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
      )}

      {/* Lista servicii */}
      <div className="glass rounded-2xl overflow-hidden">
        {services.length === 0 ? (
          <p className="text-sm text-[#6e6e73] px-5 py-6 text-center">Niciun serviciu adăugat.</p>
        ) : (
          <ul className="list-none m-0 p-0">
            {services.map((s, i) => (
              <li
                key={s.id}
                className={`flex items-center justify-between px-5 py-3.5 gap-4 ${i !== services.length - 1 ? 'border-b border-white/30' : ''}`}
              >
                <div className="flex flex-col gap-0.5 min-w-0">
                  <span className="text-sm font-semibold text-[#1d1d1f]">{s.name}</span>
                  {s.description && <span className="text-xs text-[#6e6e73]">{s.description}</span>}
                  <span className="text-xs text-[#6e6e73]/60">{s.duration_minutes} min</span>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <span className="text-sm font-semibold text-[#1d1d1f]">
                    {s.price != null ? `${s.price} RON` : '—'}
                  </span>
                  <button
                    onClick={() => openEdit(s)}
                    className="text-xs text-[#34c759] font-medium cursor-pointer hover:underline bg-transparent border-none p-0"
                  >
                    Editează
                  </button>
                  <button
                    onClick={() => handleDelete(s.id, s.name)}
                    className="text-xs text-red-400 font-medium cursor-pointer hover:underline bg-transparent border-none p-0"
                  >
                    Șterge
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
