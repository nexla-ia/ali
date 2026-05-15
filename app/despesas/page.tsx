'use client'

export const dynamic = 'force-dynamic'

import { useCallback, useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { fmt, MONTH_NAMES } from '@/lib/finance'
import { CATEGORIES } from '@/lib/types'
import type { FixedExpense, VariableExpense } from '@/lib/types'
import Modal from '@/components/Modal'
import PageHeader from '@/components/PageHeader'
import { Plus, Trash2, Check } from 'lucide-react'

export default function DespesasPage() {
  const now = new Date()
  const [fixedExpenses, setFixed] = useState<FixedExpense[]>([])
  const [variableExpenses, setVariable] = useState<VariableExpense[]>([])
  const [viewMonth, setViewMonth] = useState(now.getMonth() + 1)
  const [viewYear, setViewYear] = useState(now.getFullYear())
  const [addFixedOpen, setAddFixedOpen] = useState(false)
  const [addVarOpen, setAddVarOpen] = useState(false)

  const load = useCallback(async () => {
    const [f, v] = await Promise.all([
      supabase.from('fixed_expenses').select('*').order('created_at'),
      supabase.from('variable_expenses').select('*').order('created_at', { ascending: false }),
    ])
    setFixed(f.data ?? [])
    setVariable(v.data ?? [])
  }, [])

  useEffect(() => { load() }, [load])

  const monthVariable = variableExpenses.filter(e => e.month === viewMonth && e.year === viewYear)
  const totalFixed    = fixedExpenses.filter(e => e.active).reduce((s, e) => s + e.amount, 0)
  const totalVariable = monthVariable.reduce((s, e) => s + e.amount, 0)

  async function toggleFixed(id: string, active: boolean) {
    await supabase.from('fixed_expenses').update({ active: !active }).eq('id', id)
    load()
  }
  async function deleteFixed(id: string) {
    await supabase.from('fixed_expenses').delete().eq('id', id)
    load()
  }
  async function deleteVariable(id: string) {
    await supabase.from('variable_expenses').delete().eq('id', id)
    load()
  }

  return (
    <div className="px-4 py-5 md:px-8 md:py-8 max-w-5xl mx-auto">
      <PageHeader title="Despesas" subtitle="Fixos recorrentes e variáveis por mês" />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Fixed */}
        <div className="anim-fade-up delay-1">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-semibold uppercase tracking-widest" style={{ color: 'var(--text)' }}>Fixos</h2>
              <p className="mono text-xs mt-0.5" style={{ color: 'var(--text-2)', fontFamily: '"Fira Code"' }}>
                {fmt(totalFixed)}/mês ativos
              </p>
            </div>
            <button className="btn-lime" onClick={() => setAddFixedOpen(true)}>
              <Plus size={13} /> Adicionar
            </button>
          </div>

          {fixedExpenses.length === 0 ? (
            <div className="card flex flex-col items-center justify-center py-10 gap-2">
              <p className="text-sm" style={{ color: 'var(--text-3)' }}>Nenhum gasto fixo</p>
            </div>
          ) : (
            <div className="space-y-2">
              {fixedExpenses.map(e => (
                <div
                  key={e.id}
                  className="group flex items-center justify-between px-4 py-3 rounded-xl transition-all"
                  style={{
                    background: 'var(--surface)',
                    border: `1px solid ${e.active ? 'var(--border)' : 'var(--border)'}`,
                    opacity: e.active ? 1 : 0.45,
                  }}
                >
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => toggleFixed(e.id, e.active)}
                      className="w-5 h-5 rounded-md flex items-center justify-center transition-all shrink-0"
                      style={{
                        background: e.active ? 'var(--teal)' : 'var(--surface-3)',
                        border: `1px solid ${e.active ? 'var(--teal)' : 'var(--border-2)'}`,
                      }}
                    >
                      {e.active && <Check size={11} color="#07080D" strokeWidth={3} />}
                    </button>
                    <div>
                      <p className="text-sm font-medium" style={{ color: 'var(--text)' }}>{e.name}</p>
                      <p className="text-[10px] uppercase tracking-wide mt-0.5" style={{ color: 'var(--text-3)' }}>{e.category}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="mono text-sm font-medium" style={{ color: 'var(--text)', fontFamily: '"Fira Code"' }}>
                      {fmt(e.amount)}
                    </span>
                    <button
                      onClick={() => deleteFixed(e.id)}
                      className="delete-btn opacity-0 group-hover:opacity-100 transition-opacity"
                      style={{ color: 'var(--rose)' }}
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Variable */}
        <div className="anim-fade-up delay-2">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-semibold uppercase tracking-widest" style={{ color: 'var(--text)' }}>Variáveis</h2>
              <div className="flex items-center gap-2 mt-1">
                <select
                  className="text-xs rounded-lg px-2 py-1 outline-none"
                  style={{ background: 'var(--surface-2)', border: '1px solid var(--border-2)', color: 'var(--text-2)', fontFamily: '"Fira Code"' }}
                  value={viewMonth}
                  onChange={e => setViewMonth(Number(e.target.value))}
                >
                  {Array.from({ length: 12 }, (_, i) => i + 1).map(m => (
                    <option key={m} value={m}>{MONTH_NAMES[m - 1]}</option>
                  ))}
                </select>
                <input
                  type="number"
                  className="text-xs rounded-lg px-2 py-1 w-16 outline-none"
                  style={{ background: 'var(--surface-2)', border: '1px solid var(--border-2)', color: 'var(--text-2)', fontFamily: '"Fira Code"' }}
                  value={viewYear}
                  onChange={e => setViewYear(Number(e.target.value))}
                />
                <span className="mono text-xs" style={{ color: 'var(--text-2)', fontFamily: '"Fira Code"' }}>
                  = {fmt(totalVariable)}
                </span>
              </div>
            </div>
            <button className="btn-lime" onClick={() => setAddVarOpen(true)}>
              <Plus size={13} /> Adicionar
            </button>
          </div>

          {monthVariable.length === 0 ? (
            <div className="card flex flex-col items-center justify-center py-10 gap-2">
              <p className="text-sm" style={{ color: 'var(--text-3)' }}>
                Nenhum gasto em {MONTH_NAMES[viewMonth - 1]}/{viewYear}
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {monthVariable.map(e => (
                <div
                  key={e.id}
                  className="group flex items-center justify-between px-4 py-3 rounded-xl transition-colors"
                  style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
                >
                  <div>
                    <p className="text-sm font-medium" style={{ color: 'var(--text)' }}>{e.description}</p>
                    <p className="text-[10px] uppercase tracking-wide mt-0.5" style={{ color: 'var(--text-3)' }}>{e.category}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="mono text-sm font-medium" style={{ color: 'var(--text)', fontFamily: '"Fira Code"' }}>
                      {fmt(e.amount)}
                    </span>
                    <button
                      onClick={() => deleteVariable(e.id)}
                      className="delete-btn opacity-0 group-hover:opacity-100 transition-opacity"
                      style={{ color: 'var(--rose)' }}
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              ))}
              <div
                className="flex justify-between items-center px-4 py-3"
                style={{ borderTop: '1px solid var(--border)' }}
              >
                <span className="text-xs uppercase tracking-widest" style={{ color: 'var(--text-2)' }}>Total</span>
                <span
                  className="font-display font-700"
                  style={{ fontFamily: '"Barlow Condensed"', fontWeight: 700, fontSize: 20, color: 'var(--text)' }}
                >
                  {fmt(totalVariable)}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      <AddFixedModal open={addFixedOpen} onClose={() => setAddFixedOpen(false)} onSaved={load} />
      <AddVariableModal open={addVarOpen} onClose={() => setAddVarOpen(false)} onSaved={load} defaultMonth={viewMonth} defaultYear={viewYear} />
    </div>
  )
}

function AddFixedModal({ open, onClose, onSaved }: { open: boolean; onClose: () => void; onSaved: () => void }) {
  const [name, setName] = useState('')
  const [amount, setAmount] = useState('')
  const [category, setCategory] = useState('moradia')
  const [saving, setSaving] = useState(false)

  async function save() {
    if (!name || !amount) return
    setSaving(true)
    await supabase.from('fixed_expenses').insert({ name, amount: parseFloat(amount.replace(',', '.')), category, active: true })
    setSaving(false)
    setName(''); setAmount('')
    onSaved(); onClose()
  }

  return (
    <Modal open={open} onClose={onClose} title="Novo Gasto Fixo">
      <div className="space-y-4">
        <div>
          <label className="label">Descrição</label>
          <input className="input" placeholder="Ex: Aluguel, Academia..." value={name} onChange={e => setName(e.target.value)} />
        </div>
        <div>
          <label className="label">Valor mensal (R$)</label>
          <input className="input" placeholder="800,00" value={amount} onChange={e => setAmount(e.target.value)} style={{ fontFamily: '"Fira Code"' }} />
        </div>
        <div>
          <label className="label">Categoria</label>
          <select className="input" value={category} onChange={e => setCategory(e.target.value)}>
            {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <button className="btn-lime w-full justify-center" onClick={save} disabled={saving}>
          {saving ? 'Salvando...' : 'Adicionar'}
        </button>
      </div>
    </Modal>
  )
}

function AddVariableModal({ open, onClose, onSaved, defaultMonth, defaultYear }: {
  open: boolean; onClose: () => void; onSaved: () => void; defaultMonth: number; defaultYear: number
}) {
  const [desc, setDesc] = useState('')
  const [amount, setAmount] = useState('')
  const [category, setCategory] = useState('outros')
  const [month, setMonth] = useState(defaultMonth)
  const [year, setYear] = useState(defaultYear)
  const [saving, setSaving] = useState(false)

  async function save() {
    if (!desc || !amount) return
    setSaving(true)
    await supabase.from('variable_expenses').insert({ description: desc, amount: parseFloat(amount.replace(',', '.')), category, month, year })
    setSaving(false)
    setDesc(''); setAmount('')
    onSaved(); onClose()
  }

  return (
    <Modal open={open} onClose={onClose} title="Novo Gasto Variável">
      <div className="space-y-4">
        <div>
          <label className="label">Descrição</label>
          <input className="input" placeholder="Ex: Supermercado..." value={desc} onChange={e => setDesc(e.target.value)} />
        </div>
        <div>
          <label className="label">Valor (R$)</label>
          <input className="input" placeholder="150,00" value={amount} onChange={e => setAmount(e.target.value)} style={{ fontFamily: '"Fira Code"' }} />
        </div>
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
          <label className="label">Categoria</label>
          <select className="input" value={category} onChange={e => setCategory(e.target.value)}>
            {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <button className="btn-lime w-full justify-center" onClick={save} disabled={saving}>
          {saving ? 'Salvando...' : 'Adicionar'}
        </button>
      </div>
    </Modal>
  )
}
