'use client'

export const dynamic = 'force-dynamic'

import { useCallback, useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { fmt, MONTH_NAMES } from '@/lib/finance'
import type { IncomeEntry } from '@/lib/types'
import Modal from '@/components/Modal'
import PageHeader from '@/components/PageHeader'
import { Plus, Pencil, Trash2 } from 'lucide-react'
import clsx from 'clsx'

const CY = new Date().getFullYear()
const YEARS = [CY - 1, CY, CY + 1]

export default function RendaPage() {
  const [entries, setEntries] = useState<IncomeEntry[]>([])
  const [viewYear, setViewYear] = useState(CY)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<IncomeEntry | null>(null)

  const load = useCallback(async () => {
    const { data } = await supabase.from('income_entries').select('*').order('year').order('month')
    setEntries(data ?? [])
  }, [])

  useEffect(() => { load() }, [load])

  const yearEntries = entries.filter(e => e.year === viewYear)
  const totalYear = yearEntries.reduce((s, e) => s + e.amount, 0)
  const avgMonth  = yearEntries.length > 0 ? totalYear / yearEntries.length : 0

  async function deleteEntry(id: string) {
    await supabase.from('income_entries').delete().eq('id', id)
    load()
  }

  return (
    <div className="px-4 py-5 md:px-8 md:py-8 max-w-3xl mx-auto">
      <PageHeader
        title="Renda"
        subtitle="Registre sua renda mensal"
        action={
          <button className="btn-lime" onClick={() => { setEditing(null); setModalOpen(true) }}>
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
            className="px-4 py-2 rounded-xl text-sm mono transition-all"
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
          <p className="font-display font-700" style={{ fontFamily: '"Barlow Condensed"', fontWeight: 700, fontSize: 30, color: 'var(--teal)' }}>
            {fmt(totalYear)}
          </p>
        </div>
        <div className="card">
          <p className="text-[10px] uppercase tracking-widest mb-2" style={{ color: 'var(--text-2)' }}>Média mensal</p>
          <p className="font-display font-700" style={{ fontFamily: '"Barlow Condensed"', fontWeight: 700, fontSize: 30, color: 'var(--text)' }}>
            {fmt(avgMonth)}
          </p>
        </div>
      </div>

      {/* Month grid */}
      <div className="grid grid-cols-3 gap-2 anim-fade-up delay-3">
        {Array.from({ length: 12 }, (_, i) => i + 1).map(m => {
          const entry = yearEntries.find(e => e.month === m)
          const isCurrent = m === new Date().getMonth() + 1 && viewYear === CY

          return (
            <div
              key={m}
              className="group rounded-2xl p-4 transition-all card-hover relative"
              style={{
                background: isCurrent ? 'var(--lime-dim)' : 'var(--surface)',
                border: `1px solid ${isCurrent ? 'rgba(200,241,53,0.3)' : 'var(--border)'}`,
              }}
            >
              <p
                className="text-[10px] uppercase tracking-widest mb-1"
                style={{ color: isCurrent ? 'var(--lime)' : 'var(--text-2)' }}
              >
                {MONTH_NAMES[m - 1]}
              </p>

              {entry ? (
                <>
                  <p
                    className="font-display font-700"
                    style={{ fontFamily: '"Barlow Condensed"', fontWeight: 700, fontSize: 18, color: 'var(--teal)', lineHeight: 1.1 }}
                  >
                    {fmt(entry.amount)}
                  </p>
                  <p className="text-[10px] mt-1 truncate" style={{ color: 'var(--text-3)' }}>
                    {entry.description}
                  </p>
                  <div className="absolute top-2 right-2 flex gap-1 delete-btn opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => { setEditing(entry); setModalOpen(true) }}
                      className="w-6 h-6 rounded-lg flex items-center justify-center transition-colors"
                      style={{ background: 'var(--surface-3)', color: 'var(--text-2)' }}
                    >
                      <Pencil size={10} />
                    </button>
                    <button
                      onClick={() => deleteEntry(entry.id)}
                      className="w-6 h-6 rounded-lg flex items-center justify-center transition-colors"
                      style={{ background: 'var(--surface-3)', color: 'var(--rose)' }}
                    >
                      <Trash2 size={10} />
                    </button>
                  </div>
                </>
              ) : (
                <button
                  className="w-full text-left"
                  onClick={() => { setEditing(null); setModalOpen(true) }}
                >
                  <p className="mono text-xs" style={{ color: 'var(--text-3)', fontFamily: '"Fira Code"' }}>—</p>
                </button>
              )}
            </div>
          )
        })}
      </div>

      <IncomeModal
        open={modalOpen}
        onClose={() => { setModalOpen(false); setEditing(null) }}
        onSaved={load}
        editing={editing}
        defaultYear={viewYear}
      />
    </div>
  )
}

function IncomeModal({ open, onClose, onSaved, editing, defaultYear }: {
  open: boolean; onClose: () => void; onSaved: () => void
  editing: IncomeEntry | null; defaultYear: number
}) {
  const now = new Date()
  const [month, setMonth] = useState(editing?.month ?? now.getMonth() + 1)
  const [year, setYear] = useState(editing?.year ?? defaultYear)
  const [amount, setAmount] = useState(editing ? String(editing.amount) : '')
  const [description, setDescription] = useState(editing?.description ?? 'Salário')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (editing) {
      setMonth(editing.month); setYear(editing.year)
      setAmount(String(editing.amount)); setDescription(editing.description)
    } else {
      setMonth(now.getMonth() + 1); setYear(defaultYear)
      setAmount(''); setDescription('Salário')
    }
  }, [editing, defaultYear])

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
          <input className="input" placeholder="5.000,00" value={amount} onChange={e => setAmount(e.target.value)} style={{ fontFamily: '"Fira Code"', fontSize: 18 }} />
        </div>
        <div>
          <label className="label">Descrição</label>
          <input className="input" placeholder="Salário, Freelance..." value={description} onChange={e => setDescription(e.target.value)} />
        </div>
        <button className="btn-lime w-full justify-center" onClick={save} disabled={saving}>
          {saving ? 'Salvando...' : editing ? 'Atualizar' : 'Registrar'}
        </button>
      </div>
    </Modal>
  )
}
