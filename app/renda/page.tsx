'use client'

export const dynamic = 'force-dynamic'

import { useCallback, useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { fmt, MONTH_NAMES } from '@/lib/finance'
import type { IncomeEntry } from '@/lib/types'
import Modal from '@/components/Modal'
import PageHeader from '@/components/PageHeader'
import { Plus, Pencil, Trash2, X, RefreshCw } from 'lucide-react'

const CY = new Date().getFullYear()
const YEARS = [CY - 1, CY, CY + 1]

export default function RendaPage() {
  const [entries, setEntries]     = useState<IncomeEntry[]>([])
  const [loading, setLoading]     = useState(true)
  const [viewYear, setViewYear]   = useState(CY)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing]     = useState<IncomeEntry | null>(null)
  const [addMonth, setAddMonth]   = useState<number | null>(null)
  const [addRecorrente, setAddRecorrente] = useState(false)
  const [openMonth, setOpenMonth] = useState<number | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    const { data } = await supabase.from('income_entries').select('*').order('year').order('month')
    setEntries(data ?? [])
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  const recurring      = entries.filter(e => e.year === 0)
  const recurringTotal = recurring.reduce((s, e) => s + e.amount, 0)

  const yearExtras  = entries.filter(e => e.year === viewYear)
  const extrasTotal = yearExtras.reduce((s, e) => s + e.amount, 0)
  const totalYear   = recurringTotal * 12 + extrasTotal
  const avgMonth    = recurringTotal + extrasTotal / 12

  async function deleteEntry(id: string) {
    await supabase.from('income_entries').delete().eq('id', id)
    load()
  }

  function openAdd(month: number | null, recorrente = false) {
    setEditing(null)
    setAddMonth(month)
    setAddRecorrente(recorrente)
    setModalOpen(true)
  }

  function openEdit(entry: IncomeEntry) {
    setEditing(entry)
    setAddMonth(null)
    setAddRecorrente(entry.recorrente)
    setModalOpen(true)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <RefreshCw size={16} className="animate-spin" style={{ color: 'var(--lime)' }} />
      </div>
    )
  }

  return (
    <div className="px-4 py-5 md:px-8 md:py-8 max-w-3xl mx-auto space-y-6">
      <PageHeader
        title="Renda"
        subtitle="Salário e entradas extras"
        action={
          <button className="btn-lime" onClick={() => openAdd(null, true)}>
            <Plus size={13} /> Registrar
          </button>
        }
      />

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 anim-fade-up delay-1">
        <div className="card">
          <p className="text-[10px] uppercase tracking-widest mb-2" style={{ color: 'var(--text-2)' }}>Total {viewYear}</p>
          <p style={{ fontFamily: '"Barlow Condensed"', fontWeight: 700, fontSize: 28, color: 'var(--teal)' }}>
            {fmt(totalYear)}
          </p>
        </div>
        <div className="card">
          <p className="text-[10px] uppercase tracking-widest mb-2" style={{ color: 'var(--text-2)' }}>Média mensal</p>
          <p style={{ fontFamily: '"Barlow Condensed"', fontWeight: 700, fontSize: 28, color: 'var(--text)' }}>
            {fmt(avgMonth)}
          </p>
        </div>
      </div>

      {/* ── Renda fixa (recorrente) ─────────────────────────────── */}
      <div className="anim-fade-up delay-2">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="text-xs font-semibold uppercase tracking-widest" style={{ color: 'var(--text)' }}>
              Renda fixa
            </h2>
            <p className="text-[10px] mt-0.5" style={{ color: 'var(--text-2)' }}>
              Repete todo mês automaticamente
            </p>
          </div>
          <button className="btn-lime" onClick={() => openAdd(null, true)}>
            <Plus size={12} /> Adicionar
          </button>
        </div>

        {recurring.length === 0 ? (
          <div
            className="rounded-2xl flex flex-col items-center justify-center py-8 gap-2"
            style={{ border: '1px dashed var(--border-2)', background: 'var(--surface)' }}
          >
            <p className="text-sm" style={{ color: 'var(--text-3)' }}>Nenhuma renda fixa cadastrada</p>
            <button
              onClick={() => openAdd(null, true)}
              className="text-xs font-medium"
              style={{ color: 'var(--lime)' }}
            >
              + Cadastrar salário
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            {recurring.map(e => (
              <div
                key={e.id}
                className="group flex items-center justify-between px-4 py-3 rounded-xl"
                style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
              >
                <div>
                  <p className="text-sm font-medium" style={{ color: 'var(--text)' }}>{e.description}</p>
                  <p className="text-[10px] mt-0.5 uppercase tracking-widest" style={{ color: 'var(--teal)' }}>
                    todo mês
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span style={{ fontFamily: '"Fira Code"', fontSize: 15, fontWeight: 600, color: 'var(--teal)' }}>
                    {fmt(e.amount)}
                  </span>
                  <div className="flex gap-1 delete-btn opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => openEdit(e)}
                      className="w-7 h-7 rounded-lg flex items-center justify-center"
                      style={{ background: 'var(--surface-3)', color: 'var(--text-2)' }}
                    >
                      <Pencil size={11} />
                    </button>
                    <button
                      onClick={() => deleteEntry(e.id)}
                      className="w-7 h-7 rounded-lg flex items-center justify-center"
                      style={{ background: 'var(--surface-3)', color: 'var(--rose)' }}
                    >
                      <Trash2 size={11} />
                    </button>
                  </div>
                </div>
              </div>
            ))}

            {/* Recurring total */}
            {recurring.length > 1 && (
              <div className="flex justify-between items-center px-4 py-2" style={{ borderTop: '1px solid var(--border)' }}>
                <span className="text-[10px] uppercase tracking-widest" style={{ color: 'var(--text-2)' }}>Total mensal</span>
                <span style={{ fontFamily: '"Barlow Condensed"', fontWeight: 700, fontSize: 18, color: 'var(--teal)' }}>
                  {fmt(recurringTotal)}
                </span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Extras por mês ──────────────────────────────────────── */}
      <div className="anim-fade-up delay-3">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="text-xs font-semibold uppercase tracking-widest" style={{ color: 'var(--text)' }}>
              Extras por mês
            </h2>
            <p className="text-[10px] mt-0.5" style={{ color: 'var(--text-2)' }}>
              Freelance, bônus, entradas únicas
            </p>
          </div>
          {/* Year tabs */}
          <div className="flex gap-1.5">
            {YEARS.map(y => (
              <button
                key={y}
                onClick={() => setViewYear(y)}
                className="px-3 py-1.5 rounded-lg text-xs transition-all"
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
        </div>

        <div className="grid grid-cols-3 gap-2">
          {Array.from({ length: 12 }, (_, i) => i + 1).map(m => {
            const cellEntries = yearExtras.filter(e => e.month === m)
            const total       = cellEntries.reduce((s, e) => s + e.amount, 0)
            const hasEntries  = cellEntries.length > 0
            const multi       = cellEntries.length > 1
            const isCurrent   = m === new Date().getMonth() + 1 && viewYear === CY
            const isOpen      = openMonth === m

            return (
              <div
                key={m}
                className="rounded-2xl p-3 transition-all"
                style={{
                  background: isCurrent ? 'var(--lime-dim)' : 'var(--surface)',
                  border: `1px solid ${isCurrent ? 'rgba(200,241,53,0.3)' : isOpen ? 'var(--border-2)' : 'var(--border)'}`,
                }}
              >
                <div className="flex items-center justify-between mb-1">
                  <p className="text-[10px] uppercase tracking-widest" style={{ color: isCurrent ? 'var(--lime)' : 'var(--text-2)' }}>
                    {MONTH_NAMES[m - 1]}
                  </p>
                  <button
                    onClick={() => openAdd(m, false)}
                    className="w-5 h-5 rounded-md flex items-center justify-center"
                    style={{ background: 'var(--surface-3)', color: 'var(--text-2)' }}
                  >
                    <Plus size={9} />
                  </button>
                </div>

                {hasEntries ? (
                  <>
                    <p style={{ fontFamily: '"Barlow Condensed"', fontWeight: 700, fontSize: 16, color: 'var(--amber)', lineHeight: 1.1 }}>
                      {fmt(total)}
                    </p>

                    {multi ? (
                      <button
                        onClick={() => setOpenMonth(isOpen ? null : m)}
                        className="flex items-center gap-1 mt-1"
                      >
                        <span className="text-[9px] uppercase tracking-widest" style={{ color: 'var(--text-3)' }}>
                          {cellEntries.length} extras
                        </span>
                        <span style={{ color: 'var(--lime)', fontSize: 9 }}>{isOpen ? '▲' : '▼'}</span>
                      </button>
                    ) : (
                      <div className="flex items-center justify-between mt-1 gap-1">
                        <p className="text-[9px] truncate flex-1" style={{ color: 'var(--text-3)' }}>
                          {cellEntries[0].description}
                        </p>
                        <div className="flex gap-0.5 shrink-0">
                          <button onClick={() => openEdit(cellEntries[0])} className="w-5 h-5 rounded flex items-center justify-center" style={{ color: 'var(--text-2)' }}>
                            <Pencil size={9} />
                          </button>
                          <button onClick={() => deleteEntry(cellEntries[0].id)} className="w-5 h-5 rounded flex items-center justify-center" style={{ color: 'var(--rose)' }}>
                            <Trash2 size={9} />
                          </button>
                        </div>
                      </div>
                    )}

                    {isOpen && (
                      <div className="mt-2 pt-2 space-y-1" style={{ borderTop: '1px solid var(--border)' }}>
                        {cellEntries.map(entry => (
                          <div key={entry.id} className="flex items-center gap-1">
                            <span className="text-[9px] truncate flex-1" style={{ color: 'var(--text-3)' }}>
                              {entry.description}
                            </span>
                            <span className="text-[9px] shrink-0" style={{ color: 'var(--amber)', fontFamily: '"Fira Code"' }}>
                              {fmt(entry.amount)}
                            </span>
                            <button onClick={() => openEdit(entry)} className="w-4 h-4 flex items-center justify-center shrink-0" style={{ color: 'var(--text-2)' }}>
                              <Pencil size={8} />
                            </button>
                            <button onClick={() => deleteEntry(entry.id)} className="w-4 h-4 flex items-center justify-center shrink-0" style={{ color: 'var(--rose)' }}>
                              <X size={8} />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </>
                ) : (
                  <button className="w-full text-left mt-1" onClick={() => openAdd(m, false)}>
                    <p className="text-xs" style={{ color: 'var(--text-3)', fontFamily: '"Fira Code"' }}>—</p>
                  </button>
                )}
              </div>
            )
          })}
        </div>
      </div>

      <IncomeModal
        key={`${modalOpen ? 1 : 0}-${addMonth ?? 0}-${editing?.id ?? 'new'}-${addRecorrente ? 1 : 0}`}
        open={modalOpen}
        onClose={() => { setModalOpen(false); setEditing(null); setAddMonth(null) }}
        onSaved={load}
        editing={editing}
        defaultMonth={addMonth ?? editing?.month ?? new Date().getMonth() + 1}
        defaultYear={viewYear}
        defaultRecorrente={addRecorrente}
      />
    </div>
  )
}

function IncomeModal({ open, onClose, onSaved, editing, defaultMonth, defaultYear, defaultRecorrente }: {
  open: boolean; onClose: () => void; onSaved: () => void
  editing: IncomeEntry | null; defaultMonth: number; defaultYear: number
  defaultRecorrente: boolean
}) {
  const [month, setMonth]           = useState(defaultMonth)
  const [year, setYear]             = useState(defaultYear)
  const [amount, setAmount]         = useState(editing ? String(editing.amount) : '')
  const [description, setDescription] = useState(editing?.description ?? 'Salário')
  const [recorrente, setRecorrente] = useState(defaultRecorrente)
  const [saving, setSaving]         = useState(false)
  const [error, setError]           = useState('')

  async function save() {
    if (!amount) return
    setError('')
    setSaving(true)
    const data = {
      month:  recorrente ? 1 : month,
      year:   recorrente ? 0 : year,   // year=0 marks recurring
      amount: parseFloat(amount.replace(',', '.')),
      description,
    }
    const { error: err } = editing
      ? await supabase.from('income_entries').update(data).eq('id', editing.id)
      : await supabase.from('income_entries').insert(data)
    setSaving(false)
    if (err) { setError(err.message); return }
    onSaved(); onClose()
  }

  return (
    <Modal open={open} onClose={onClose} title={editing ? 'Editar Renda' : 'Registrar Renda'}>
      <div className="space-y-4">
        {/* Recorrente toggle */}
        <button
          onClick={() => setRecorrente(r => !r)}
          className="w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all"
          style={{
            background: recorrente ? 'rgba(45,212,191,0.08)' : 'var(--surface-2)',
            border: `1px solid ${recorrente ? 'rgba(45,212,191,0.3)' : 'var(--border)'}`,
          }}
        >
          <div className="text-left">
            <p className="text-sm font-medium" style={{ color: recorrente ? 'var(--teal)' : 'var(--text)' }}>
              Todo mês (recorrente)
            </p>
            <p className="text-[10px] mt-0.5" style={{ color: 'var(--text-3)' }}>
              {recorrente ? 'Conta automaticamente em todos os meses' : 'Lançar só para um mês específico'}
            </p>
          </div>
          <div
            className="w-10 h-6 rounded-full transition-all flex items-center shrink-0"
            style={{
              background: recorrente ? 'var(--teal)' : 'var(--surface-3)',
              padding: '3px',
              justifyContent: recorrente ? 'flex-end' : 'flex-start',
            }}
          >
            <div className="w-4 h-4 rounded-full" style={{ background: recorrente ? '#07080D' : 'var(--text-3)' }} />
          </div>
        </button>

        {/* Month/year — only if not recorrente */}
        {!recorrente && (
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
        )}

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
          <input
            className="input"
            placeholder="Salário, Freelance, Aluguel..."
            value={description}
            onChange={e => setDescription(e.target.value)}
          />
        </div>
        {error && (
          <p className="text-xs rounded-xl px-3 py-2.5" style={{ background: 'var(--rose-dim)', color: 'var(--rose)', border: '1px solid rgba(244,63,94,0.25)' }}>
            {error}
          </p>
        )}
        <button className="btn-lime w-full justify-center" onClick={save} disabled={saving}>
          {saving ? 'Salvando...' : editing ? 'Atualizar' : 'Registrar'}
        </button>
      </div>
    </Modal>
  )
}
