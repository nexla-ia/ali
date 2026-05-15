'use client'

export const dynamic = 'force-dynamic'

import { useCallback, useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { fmt, MONTH_NAMES } from '@/lib/finance'
import type { IncomeEntry } from '@/lib/types'
import Modal from '@/components/Modal'
import PageHeader from '@/components/PageHeader'
import { Plus, Pencil, Trash2, X } from 'lucide-react'

const CY = new Date().getFullYear()
const YEARS = [CY - 1, CY, CY + 1]

export default function RendaPage() {
  const [entries, setEntries]       = useState<IncomeEntry[]>([])
  const [viewYear, setViewYear]     = useState(CY)
  const [modalOpen, setModalOpen]   = useState(false)
  const [editing, setEditing]       = useState<IncomeEntry | null>(null)
  const [addMonth, setAddMonth]     = useState<number | null>(null)
  // month whose entries are being listed inline
  const [openMonth, setOpenMonth]   = useState<number | null>(null)

  const load = useCallback(async () => {
    const { data } = await supabase.from('income_entries').select('*').order('year').order('month')
    setEntries(data ?? [])
  }, [])

  useEffect(() => { load() }, [load])

  const yearEntries = entries.filter(e => e.year === viewYear)
  const totalYear   = yearEntries.reduce((s, e) => s + e.amount, 0)

  // Average per month that has at least one entry
  const monthsWithEntries = new Set(yearEntries.map(e => e.month)).size
  const avgMonth = monthsWithEntries > 0 ? totalYear / monthsWithEntries : 0

  async function deleteEntry(id: string) {
    await supabase.from('income_entries').delete().eq('id', id)
    load()
  }

  function openAdd(month: number) {
    setAddMonth(month)
    setEditing(null)
    setModalOpen(true)
  }

  function openEdit(entry: IncomeEntry) {
    setEditing(entry)
    setAddMonth(null)
    setModalOpen(true)
  }

  return (
    <div className="px-4 py-5 md:px-8 md:py-8 max-w-3xl mx-auto">
      <PageHeader
        title="Renda"
        subtitle="Registre sua renda mensal"
        action={
          <button className="btn-lime" onClick={() => openAdd(new Date().getMonth() + 1)}>
            <Plus size={13} /> Registrar
          </button>
        }
      />

      {/* Year tabs */}
      <div className="flex gap-2 mb-6 anim-fade-up delay-1">
        {YEARS.map(y => (
          <button
            key={y}
            onClick={() => setViewYear(y)}
            className="px-4 py-2 rounded-xl text-sm transition-all"
            style={{
              fontFamily: '"Fira Code"',
              background: viewYear === y ? 'var(--lime-dim)' : 'var(--surface)',
              border: `1px solid ${viewYear === y ? 'var(--lime)' : 'var(--border)'}`,
              color: viewYear === y ? 'var(--lime)' : 'var(--text-2)',
            }}
          >
            {y}
          </button>
        ))}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 mb-6 anim-fade-up delay-2">
        <div className="card">
          <p className="text-[10px] uppercase tracking-widest mb-2" style={{ color: 'var(--text-2)' }}>Total {viewYear}</p>
          <p style={{ fontFamily: '"Barlow Condensed"', fontWeight: 700, fontSize: 30, color: 'var(--teal)' }}>
            {fmt(totalYear)}
          </p>
        </div>
        <div className="card">
          <p className="text-[10px] uppercase tracking-widest mb-2" style={{ color: 'var(--text-2)' }}>Média mensal</p>
          <p style={{ fontFamily: '"Barlow Condensed"', fontWeight: 700, fontSize: 30, color: 'var(--text)' }}>
            {fmt(avgMonth)}
          </p>
        </div>
      </div>

      {/* Month grid */}
      <div className="grid grid-cols-3 gap-2 anim-fade-up delay-3">
        {Array.from({ length: 12 }, (_, i) => i + 1).map(m => {
          const cellEntries = yearEntries.filter(e => e.month === m)
          const total       = cellEntries.reduce((s, e) => s + e.amount, 0)
          const hasEntries  = cellEntries.length > 0
          const multi       = cellEntries.length > 1
          const isCurrent   = m === new Date().getMonth() + 1 && viewYear === CY
          const isOpen      = openMonth === m

          return (
            <div
              key={m}
              className="rounded-2xl p-3 transition-all relative"
              style={{
                background: isCurrent ? 'var(--lime-dim)' : 'var(--surface)',
                border: `1px solid ${isCurrent ? 'rgba(200,241,53,0.3)' : isOpen ? 'var(--border-2)' : 'var(--border)'}`,
              }}
            >
              {/* Month name + add button */}
              <div className="flex items-center justify-between mb-1">
                <p
                  className="text-[10px] uppercase tracking-widest"
                  style={{ color: isCurrent ? 'var(--lime)' : 'var(--text-2)' }}
                >
                  {MONTH_NAMES[m - 1]}
                </p>
                <button
                  onClick={() => openAdd(m)}
                  className="w-5 h-5 rounded-md flex items-center justify-center transition-colors"
                  style={{ background: 'var(--surface-3)', color: 'var(--text-2)' }}
                >
                  <Plus size={9} />
                </button>
              </div>

              {hasEntries ? (
                <>
                  {/* Total */}
                  <p
                    style={{ fontFamily: '"Barlow Condensed"', fontWeight: 700, fontSize: 17, color: 'var(--teal)', lineHeight: 1.1 }}
                  >
                    {fmt(total)}
                  </p>

                  {multi ? (
                    /* Multiple entries — show count + expand toggle */
                    <button
                      onClick={() => setOpenMonth(isOpen ? null : m)}
                      className="flex items-center gap-1 mt-1"
                    >
                      <span className="text-[9px] uppercase tracking-widest" style={{ color: 'var(--text-3)' }}>
                        {cellEntries.length} fontes
                      </span>
                      <span style={{ color: 'var(--lime)', fontSize: 9 }}>{isOpen ? '▲' : '▼'}</span>
                    </button>
                  ) : (
                    /* Single entry — description + edit/delete */
                    <div className="flex items-center justify-between mt-1 gap-1">
                      <p className="text-[9px] truncate" style={{ color: 'var(--text-3)', flex: 1 }}>
                        {cellEntries[0].description}
                      </p>
                      <div className="flex gap-0.5 shrink-0">
                        <button
                          onClick={() => openEdit(cellEntries[0])}
                          className="w-5 h-5 rounded flex items-center justify-center"
                          style={{ color: 'var(--text-2)' }}
                        >
                          <Pencil size={9} />
                        </button>
                        <button
                          onClick={() => deleteEntry(cellEntries[0].id)}
                          className="w-5 h-5 rounded flex items-center justify-center"
                          style={{ color: 'var(--rose)' }}
                        >
                          <Trash2 size={9} />
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Expanded entries list (multi) */}
                  {isOpen && (
                    <div
                      className="mt-2 pt-2 space-y-1"
                      style={{ borderTop: '1px solid var(--border)' }}
                    >
                      {cellEntries.map(entry => (
                        <div key={entry.id} className="flex items-center gap-1">
                          <span className="text-[9px] truncate flex-1" style={{ color: 'var(--text-3)' }}>
                            {entry.description}
                          </span>
                          <span
                            className="text-[9px] shrink-0"
                            style={{ color: 'var(--teal)', fontFamily: '"Fira Code"' }}
                          >
                            {fmt(entry.amount)}
                          </span>
                          <button
                            onClick={() => openEdit(entry)}
                            className="w-4 h-4 flex items-center justify-center shrink-0"
                            style={{ color: 'var(--text-2)' }}
                          >
                            <Pencil size={8} />
                          </button>
                          <button
                            onClick={() => deleteEntry(entry.id)}
                            className="w-4 h-4 flex items-center justify-center shrink-0"
                            style={{ color: 'var(--rose)' }}
                          >
                            <X size={8} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              ) : (
                /* Empty — tap to add */
                <button className="w-full text-left mt-1" onClick={() => openAdd(m)}>
                  <p className="text-xs" style={{ color: 'var(--text-3)', fontFamily: '"Fira Code"' }}>—</p>
                </button>
              )}
            </div>
          )
        })}
      </div>

      <IncomeModal
        open={modalOpen}
        onClose={() => { setModalOpen(false); setEditing(null); setAddMonth(null) }}
        onSaved={load}
        editing={editing}
        defaultMonth={addMonth ?? editing?.month ?? new Date().getMonth() + 1}
        defaultYear={viewYear}
      />
    </div>
  )
}

function IncomeModal({ open, onClose, onSaved, editing, defaultMonth, defaultYear }: {
  open: boolean; onClose: () => void; onSaved: () => void
  editing: IncomeEntry | null; defaultMonth: number; defaultYear: number
}) {
  const [month, setMonth]           = useState(defaultMonth)
  const [year, setYear]             = useState(defaultYear)
  const [amount, setAmount]         = useState(editing ? String(editing.amount) : '')
  const [description, setDescription] = useState(editing?.description ?? 'Salário')
  const [saving, setSaving]         = useState(false)

  useEffect(() => {
    if (editing) {
      setMonth(editing.month); setYear(editing.year)
      setAmount(String(editing.amount)); setDescription(editing.description)
    } else {
      setMonth(defaultMonth); setYear(defaultYear)
      setAmount(''); setDescription('Salário')
    }
  }, [editing, defaultMonth, defaultYear])

  async function save() {
    if (!amount) return
    setSaving(true)
    const data = { month, year, amount: parseFloat(amount.replace(',', '.')), description }
    if (editing) await supabase.from('income_entries').update(data).eq('id', editing.id)
    else await supabase.from('income_entries').insert(data)
    setSaving(false)
    onSaved(); onClose()
  }

  return (
    <Modal open={open} onClose={onClose} title={editing ? 'Editar Renda' : 'Registrar Renda'}>
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">Mês</label>
            <select className="input" value={month} onChange={e => setMonth(Number(e.target.value))}>
              {Array.from({ length: 12 }, (_, i) => i + 1).map(m => (
                <option key={m} value={m}>{MONTH_NAMES[m - 1]}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Ano</label>
            <input className="input" type="number" value={year} onChange={e => setYear(Number(e.target.value))} style={{ fontFamily: '"Fira Code"' }} />
          </div>
        </div>
        <div>
          <label className="label">Valor (R$)</label>
          <input
            className="input"
            placeholder="5.000,00"
            value={amount}
            onChange={e => setAmount(e.target.value)}
            style={{ fontFamily: '"Fira Code"', fontSize: 18 }}
            autoFocus
          />
        </div>
        <div>
          <label className="label">Descrição</label>
          <input className="input" placeholder="Salário, Freelance, Extra..." value={description} onChange={e => setDescription(e.target.value)} />
        </div>
        <button className="btn-lime w-full justify-center" onClick={save} disabled={saving}>
          {saving ? 'Salvando...' : editing ? 'Atualizar' : 'Registrar'}
        </button>
      </div>
    </Modal>
  )
}
