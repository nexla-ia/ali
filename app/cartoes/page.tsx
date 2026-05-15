'use client'

export const dynamic = 'force-dynamic'

import { useCallback, useEffect, useRef, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { fmt, getNextMonths, monthLabel, MONTH_NAMES } from '@/lib/finance'
import { parseCsv, inferExpenseSign } from '@/lib/csv'
import type { CardColor, CreditCard, CardTransaction } from '@/lib/types'
import { CARD_COLORS } from '@/lib/types'
import Modal from '@/components/Modal'
import PageHeader from '@/components/PageHeader'
import {
  Plus, Trash2, ChevronRight, CreditCard as CardIcon,
  Upload, Check, AlertCircle, FileText, CheckSquare, Square,
} from 'lucide-react'
import clsx from 'clsx'

const COLORS: CardColor[] = ['gold', 'blue', 'green', 'red', 'purple']
const COLOR_HEX: Record<CardColor, string> = {
  gold: '#C8F135', blue: '#3B82F6', green: '#2DD4BF', red: '#F43F5E', purple: '#A78BFA',
}

export default function CartoesPage() {
  const [cards, setCards]               = useState<CreditCard[]>([])
  const [transactions, setTransactions] = useState<CardTransaction[]>([])
  const [selectedCard, setSelectedCard] = useState<CreditCard | null>(null)
  const [addCardOpen, setAddCardOpen]   = useState(false)
  const [addTxOpen, setAddTxOpen]       = useState(false)
  const [csvOpen, setCsvOpen]           = useState(false)
  const [viewMonth, setViewMonth]       = useState(() => {
    const n = new Date()
    return { month: n.getMonth() + 1, year: n.getFullYear() }
  })

  const load = useCallback(async () => {
    const [c, t] = await Promise.all([
      supabase.from('credit_cards').select('*').order('created_at'),
      supabase.from('card_transactions').select('*').order('created_at', { ascending: false }),
    ])
    const cardData = c.data ?? []
    setCards(cardData)
    setTransactions(t.data ?? [])
    if (!selectedCard && cardData.length > 0) setSelectedCard(cardData[0])
  }, [selectedCard])

  useEffect(() => { load() }, [load])

  const nextMonths = getNextMonths(6)

  const selectedTransactions = transactions.filter(
    t => t.card_id === selectedCard?.id &&
         t.invoice_month === viewMonth.month &&
         t.invoice_year === viewMonth.year
  )
  const selectedTotal = selectedTransactions.reduce((s, t) => s + t.total_amount, 0)

  async function deleteTx(id: string) {
    await supabase.from('card_transactions').delete().eq('id', id)
    load()
  }
  async function deleteCard(id: string) {
    if (!confirm('Excluir cartão e todas as transações?')) return
    await supabase.from('card_transactions').delete().eq('card_id', id)
    await supabase.from('credit_cards').delete().eq('id', id)
    setSelectedCard(null)
    load()
  }

  return (
    <div className="px-4 py-5 md:px-8 md:py-8 max-w-5xl mx-auto">
      <PageHeader
        title="Cartões"
        subtitle="Faturas e compras parceladas"
        action={
          <button className="btn-lime" onClick={() => setAddCardOpen(true)}>
            <Plus size={13} /> Novo cartão
          </button>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Card list */}
        <div className="space-y-2">
          {cards.length === 0 ? (
            <div className="card flex flex-col items-center justify-center py-12 gap-3">
              <CardIcon size={26} style={{ color: 'var(--text-3)' }} />
              <p className="text-sm" style={{ color: 'var(--text-3)' }}>Nenhum cartão ainda</p>
              <button className="btn-lime" onClick={() => setAddCardOpen(true)}>
                <Plus size={12} /> Adicionar
              </button>
            </div>
          ) : cards.map((card) => {
            const hex = COLOR_HEX[card.color as CardColor] ?? '#C8F135'
            const monthTotal = transactions
              .filter(t => t.card_id === card.id && t.invoice_month === viewMonth.month && t.invoice_year === viewMonth.year)
              .reduce((s, t) => s + t.total_amount, 0)
            const pct = card.limit_amount > 0 ? Math.min((monthTotal / card.limit_amount) * 100, 100) : 0
            const isSelected = selectedCard?.id === card.id

            return (
              <button
                key={card.id}
                onClick={() => setSelectedCard(card)}
                className="w-full text-left rounded-2xl p-4 transition-all duration-150"
                style={{
                  background: isSelected ? `${hex}10` : 'var(--surface)',
                  border: `1px solid ${isSelected ? `${hex}40` : 'var(--border)'}`,
                }}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-5 rounded-md" style={{ background: `${hex}18`, border: `1.5px solid ${hex}50` }} />
                    <span className="text-sm font-semibold" style={{ color: 'var(--text)' }}>{card.name}</span>
                  </div>
                  <ChevronRight size={13} style={{ color: 'var(--text-3)' }} />
                </div>
                <div className="mb-1.5">
                  <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--surface-3)' }}>
                    <div className="h-full rounded-full" style={{ width: `${pct}%`, background: hex, transition: 'width 0.6s ease' }} />
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <span className="mono text-[11px]" style={{ color: 'var(--text-2)', fontFamily: '"Fira Code"' }}>{fmt(monthTotal)}</span>
                  <span className="mono text-[10px]" style={{ color: 'var(--text-3)', fontFamily: '"Fira Code"' }}>fecha {card.closing_day} · vence {card.due_day}</span>
                </div>
              </button>
            )
          })}
        </div>

        {/* Detail panel */}
        <div className="lg:col-span-2">
          {selectedCard ? (() => {
            const hex = COLOR_HEX[selectedCard.color as CardColor] ?? '#C8F135'
            return (
              <div className="card h-full" style={{ minHeight: 400 }}>
                {/* Header */}
                <div className="flex items-center justify-between mb-5 gap-2 flex-wrap">
                  <div>
                    <h2 className="font-semibold text-base" style={{ color: 'var(--text)' }}>{selectedCard.name}</h2>
                    <p className="mono text-xs mt-0.5" style={{ color: 'var(--text-2)', fontFamily: '"Fira Code"' }}>limite {fmt(selectedCard.limit_amount)}</p>
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    <button className="btn-ghost" onClick={() => setCsvOpen(true)}>
                      <Upload size={12} /> Importar CSV
                    </button>
                    <button className="btn-lime" onClick={() => setAddTxOpen(true)}>
                      <Plus size={12} /> Lançar
                    </button>
                    <button className="btn-danger" onClick={() => deleteCard(selectedCard.id)}>
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>

                {/* Month tabs */}
                <div className="flex gap-2 mb-5 overflow-x-auto pb-1">
                  {nextMonths.map(({ month, year }) => {
                    const isActive = viewMonth.month === month && viewMonth.year === year
                    const mTotal = transactions
                      .filter(t => t.card_id === selectedCard.id && t.invoice_month === month && t.invoice_year === year)
                      .reduce((s, t) => s + t.total_amount, 0)
                    return (
                      <button
                        key={`${month}-${year}`}
                        onClick={() => setViewMonth({ month, year })}
                        className="shrink-0 px-3 py-2 rounded-xl text-xs transition-all"
                        style={{
                          background: isActive ? `${hex}15` : 'var(--surface-2)',
                          border: `1px solid ${isActive ? `${hex}40` : 'var(--border)'}`,
                          color: isActive ? hex : 'var(--text-2)',
                          fontFamily: '"Fira Code", monospace',
                        }}
                      >
                        <div className="font-medium">{monthLabel(month, year)}</div>
                        <div className="text-[10px] mt-0.5 opacity-70">{fmt(mTotal)}</div>
                      </button>
                    )
                  })}
                </div>

                {/* Transactions */}
                <div className="space-y-1.5 mb-4">
                  {selectedTransactions.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-10 gap-3">
                      <p className="text-sm" style={{ color: 'var(--text-3)' }}>
                        Nenhuma transação em {MONTH_NAMES[viewMonth.month - 1]}/{viewMonth.year}
                      </p>
                      <button
                        onClick={() => setCsvOpen(true)}
                        className="flex items-center gap-1.5 text-xs font-medium transition-colors"
                        style={{ color: 'var(--lime)' }}
                      >
                        <Upload size={11} /> Importar extrato CSV
                      </button>
                    </div>
                  ) : selectedTransactions.map((tx) => (
                    <div
                      key={tx.id}
                      className="group flex items-center justify-between px-3 py-2.5 rounded-xl transition-colors"
                      style={{ background: 'var(--surface-2)', border: '1px solid var(--border)' }}
                    >
                      <div className="min-w-0 mr-3">
                        <p className="text-sm font-medium truncate" style={{ color: 'var(--text)' }}>{tx.description}</p>
                        <p className="text-[10px] mt-0.5 uppercase tracking-wide" style={{ color: 'var(--text-3)' }}>
                          {tx.category}{tx.installments > 1 && ` · ${tx.current_installment}/${tx.installments}x`}
                        </p>
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        <span className="mono text-sm font-medium" style={{ color: 'var(--text)', fontFamily: '"Fira Code"' }}>
                          {fmt(tx.total_amount)}
                        </span>
                        <button
                          onClick={() => deleteTx(tx.id)}
                          className="delete-btn opacity-0 group-hover:opacity-100 transition-opacity"
                          style={{ color: 'var(--rose)' }}
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {selectedTransactions.length > 0 && (
                  <div className="flex justify-between items-center pt-4" style={{ borderTop: '1px solid var(--border)' }}>
                    <span className="text-xs uppercase tracking-widest font-medium" style={{ color: 'var(--text-2)' }}>Total fatura</span>
                    <span style={{ fontFamily: '"Barlow Condensed"', fontWeight: 700, fontSize: 24, color: hex }}>
                      {fmt(selectedTotal)}
                    </span>
                  </div>
                )}
              </div>
            )
          })() : (
            <div className="card flex items-center justify-center" style={{ minHeight: 400 }}>
              <p className="text-sm" style={{ color: 'var(--text-3)' }}>Selecione um cartão</p>
            </div>
          )}
        </div>
      </div>

      <AddCardModal open={addCardOpen} onClose={() => setAddCardOpen(false)} onSaved={load} />
      {selectedCard && (
        <>
          <AddTransactionModal
            open={addTxOpen}
            onClose={() => setAddTxOpen(false)}
            onSaved={load}
            cardId={selectedCard.id}
          />
          <CsvImportModal
            open={csvOpen}
            onClose={() => setCsvOpen(false)}
            onSaved={load}
            cardId={selectedCard.id}
            defaultMonth={viewMonth.month}
            defaultYear={viewMonth.year}
          />
        </>
      )}
    </div>
  )
}

// ── Add Card ─────────────────────────────────────────────────────────────────

function AddCardModal({ open, onClose, onSaved }: { open: boolean; onClose: () => void; onSaved: () => void }) {
  const [name, setName]       = useState('')
  const [limit, setLimit]     = useState('')
  const [closing, setClosing] = useState('20')
  const [due, setDue]         = useState('27')
  const [color, setColor]     = useState<CardColor>('gold')
  const [saving, setSaving]   = useState(false)

  async function save() {
    if (!name || !limit) return
    setSaving(true)
    await supabase.from('credit_cards').insert({
      name, limit_amount: parseFloat(limit.replace(',', '.')),
      closing_day: parseInt(closing), due_day: parseInt(due), color,
    })
    setSaving(false)
    setName(''); setLimit('')
    onSaved(); onClose()
  }

  return (
    <Modal open={open} onClose={onClose} title="Novo Cartão">
      <div className="space-y-4">
        <div>
          <label className="label">Nome do cartão</label>
          <input className="input" placeholder="Ex: Nubank, Inter..." value={name} onChange={e => setName(e.target.value)} />
        </div>
        <div>
          <label className="label">Limite (R$)</label>
          <input className="input" placeholder="5.000,00" value={limit} onChange={e => setLimit(e.target.value)} style={{ fontFamily: '"Fira Code"' }} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">Fecha dia</label>
            <input className="input" type="number" min={1} max={31} value={closing} onChange={e => setClosing(e.target.value)} style={{ fontFamily: '"Fira Code"' }} />
          </div>
          <div>
            <label className="label">Vence dia</label>
            <input className="input" type="number" min={1} max={31} value={due} onChange={e => setDue(e.target.value)} style={{ fontFamily: '"Fira Code"' }} />
          </div>
        </div>
        <div>
          <label className="label">Cor</label>
          <div className="flex gap-2 mt-1">
            {COLORS.map(c => (
              <button
                key={c}
                onClick={() => setColor(c)}
                className="w-7 h-7 rounded-full transition-all"
                style={{
                  background: COLOR_HEX[c],
                  transform: color === c ? 'scale(1.25)' : 'scale(1)',
                  boxShadow: color === c ? `0 0 10px ${COLOR_HEX[c]}80` : 'none',
                }}
              />
            ))}
          </div>
        </div>
        <button className="btn-lime w-full justify-center mt-2" onClick={save} disabled={saving}>
          {saving ? 'Salvando...' : 'Adicionar cartão'}
        </button>
      </div>
    </Modal>
  )
}

// ── Add Transaction ──────────────────────────────────────────────────────────

function AddTransactionModal({ open, onClose, onSaved, cardId }: {
  open: boolean; onClose: () => void; onSaved: () => void; cardId: string
}) {
  const now = new Date()
  const [desc, setDesc]             = useState('')
  const [amount, setAmount]         = useState('')
  const [installments, setInstall]  = useState('1')
  const [category, setCategory]     = useState('outros')
  const [startMonth, setStartMonth] = useState(now.getMonth() + 1)
  const [startYear, setStartYear]   = useState(now.getFullYear())
  const [saving, setSaving]         = useState(false)

  async function save() {
    if (!desc || !amount) return
    setSaving(true)
    const n = parseInt(installments) || 1
    const perInstallment = parseFloat(amount.replace(',', '.')) / n
    const rows = Array.from({ length: n }, (_, i) => {
      const d = new Date(startYear, startMonth - 1 + i, 1)
      return { card_id: cardId, description: desc, total_amount: perInstallment, installments: n, current_installment: i + 1, invoice_month: d.getMonth() + 1, invoice_year: d.getFullYear(), category }
    })
    await supabase.from('card_transactions').insert(rows)
    setSaving(false)
    setDesc(''); setAmount(''); setInstall('1')
    onSaved(); onClose()
  }

  const n = parseInt(installments) || 1
  const per = amount ? parseFloat(amount.replace(',', '.')) / n : 0

  return (
    <Modal open={open} onClose={onClose} title="Lançar Compra">
      <div className="space-y-4">
        <div>
          <label className="label">Descrição</label>
          <input className="input" placeholder="Ex: iFood, Mercado..." value={desc} onChange={e => setDesc(e.target.value)} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">Valor total (R$)</label>
            <input className="input" placeholder="250,00" value={amount} onChange={e => setAmount(e.target.value)} style={{ fontFamily: '"Fira Code"' }} />
          </div>
          <div>
            <label className="label">Parcelas</label>
            <input className="input" type="number" min={1} max={48} value={installments} onChange={e => setInstall(e.target.value)} style={{ fontFamily: '"Fira Code"' }} />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">Mês inicial</label>
            <select className="input" value={startMonth} onChange={e => setStartMonth(Number(e.target.value))}>
              {MONTH_NAMES.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Ano</label>
            <input className="input" type="number" value={startYear} onChange={e => setStartYear(Number(e.target.value))} style={{ fontFamily: '"Fira Code"' }} />
          </div>
        </div>
        <div>
          <label className="label">Categoria</label>
          <select className="input" value={category} onChange={e => setCategory(e.target.value)}>
            {['alimentação','transporte','saúde','lazer','roupas','assinatura','outros'].map(c => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>
        {n > 1 && amount && (
          <div className="rounded-xl px-3 py-2.5 text-center text-xs" style={{ background: 'var(--surface-2)', color: 'var(--teal)', fontFamily: '"Fira Code"', border: '1px solid var(--border)' }}>
            {n}x de {fmt(per)} / mês
          </div>
        )}
        <button className="btn-lime w-full justify-center" onClick={save} disabled={saving}>
          {saving ? 'Salvando...' : 'Lançar compra'}
        </button>
      </div>
    </Modal>
  )
}

// ── CSV Import ───────────────────────────────────────────────────────────────

interface ParsedRow { description: string; amount: number; rawAmount: number }

function CsvImportModal({ open, onClose, onSaved, cardId, defaultMonth, defaultYear }: {
  open: boolean; onClose: () => void; onSaved: () => void
  cardId: string; defaultMonth: number; defaultYear: number
}) {
  const fileRef = useRef<HTMLInputElement>(null)
  const [step, setStep]           = useState<'upload' | 'preview'>('upload')
  const [rows, setRows]           = useState<ParsedRow[]>([])
  const [selected, setSelected]   = useState<Set<number>>(new Set())
  const [invoiceMonth, setMonth]  = useState(defaultMonth)
  const [invoiceYear, setYear]    = useState(defaultYear)
  const [saving, setSaving]       = useState(false)
  const [error, setError]         = useState('')
  const [dragging, setDragging]   = useState(false)

  function reset() {
    setStep('upload'); setRows([]); setSelected(new Set())
    setError(''); setSaving(false)
  }

  function handleClose() { reset(); onClose() }

  function processFile(file: File) {
    if (!file.name.toLowerCase().endsWith('.csv') && file.type !== 'text/csv') {
      setError('Selecione um arquivo .csv')
      return
    }
    const reader = new FileReader()
    reader.onload = (e) => {
      const text = e.target?.result as string
      const parsed = parseCsv(text)
      if (!parsed.length) {
        setError('Não foi possível identificar as colunas. Verifique se o arquivo é um extrato CSV válido.')
        return
      }
      setError('')
      setRows(parsed)
      // Pre-select expense rows (negative for Nubank, positive for others)
      const sign = inferExpenseSign(parsed)
      const presel = new Set(
        parsed
          .map((r, i) => ({ r, i }))
          .filter(({ r }) => sign === 'negative' ? r.rawAmount < 0 : r.rawAmount > 0)
          .map(({ i }) => i)
      )
      // If nothing pre-selected, select all
      setSelected(presel.size > 0 ? presel : new Set(parsed.map((_, i) => i)))
      setStep('preview')
    }
    reader.onerror = () => setError('Erro ao ler o arquivo.')
    reader.readAsText(file, 'UTF-8')
  }

  function onFileInput(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]
    if (f) processFile(f)
    e.target.value = ''
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault(); setDragging(false)
    const f = e.dataTransfer.files?.[0]
    if (f) processFile(f)
  }

  function toggleRow(i: number) {
    setSelected(prev => {
      const next = new Set(prev)
      next.has(i) ? next.delete(i) : next.add(i)
      return next
    })
  }

  function toggleAll() {
    setSelected(prev => prev.size === rows.length ? new Set() : new Set(rows.map((_, i) => i)))
  }

  async function importRows() {
    const toImport = rows.filter((_, i) => selected.has(i))
    if (!toImport.length) return
    setSaving(true)
    const inserts = toImport.map(row => ({
      card_id: cardId,
      description: row.description,
      total_amount: row.amount,
      installments: 1,
      current_installment: 1,
      invoice_month: invoiceMonth,
      invoice_year: invoiceYear,
      category: 'outros',
    }))
    await supabase.from('card_transactions').insert(inserts)
    setSaving(false)
    onSaved()
    handleClose()
  }

  const totalSelected = rows
    .filter((_, i) => selected.has(i))
    .reduce((s, r) => s + r.amount, 0)

  return (
    <Modal open={open} onClose={handleClose} title="Importar Extrato CSV">
      {step === 'upload' ? (
        <div className="space-y-4">
          {/* Drop zone */}
          <div
            onClick={() => fileRef.current?.click()}
            onDragOver={e => { e.preventDefault(); setDragging(true) }}
            onDragLeave={() => setDragging(false)}
            onDrop={onDrop}
            className="flex flex-col items-center justify-center gap-3 rounded-2xl cursor-pointer transition-all"
            style={{
              border: `2px dashed ${dragging ? 'var(--lime)' : 'var(--border-2)'}`,
              background: dragging ? 'var(--lime-dim)' : 'var(--surface-2)',
              padding: '32px 20px',
            }}
          >
            <div
              className="w-12 h-12 rounded-2xl flex items-center justify-center"
              style={{ background: 'var(--surface-3)' }}
            >
              <FileText size={22} style={{ color: 'var(--lime)' }} />
            </div>
            <div className="text-center">
              <p className="text-sm font-medium" style={{ color: 'var(--text)' }}>
                Selecionar arquivo CSV
              </p>
              <p className="text-xs mt-1" style={{ color: 'var(--text-2)' }}>
                ou arraste e solte aqui
              </p>
            </div>
            <input ref={fileRef} type="file" accept=".csv,text/csv" className="hidden" onChange={onFileInput} />
          </div>

          {error && (
            <div className="flex items-start gap-2 rounded-xl px-3 py-2.5" style={{ background: 'var(--rose-dim)', border: '1px solid rgba(244,63,94,0.25)' }}>
              <AlertCircle size={14} style={{ color: 'var(--rose)', marginTop: 1, shrink: 0 }} />
              <p className="text-xs" style={{ color: 'var(--rose)' }}>{error}</p>
            </div>
          )}

          {/* Info */}
          <div className="rounded-xl px-3 py-3 space-y-1" style={{ background: 'var(--surface-2)', border: '1px solid var(--border)' }}>
            <p className="text-[11px] font-semibold uppercase tracking-widest" style={{ color: 'var(--text-2)' }}>
              Formatos suportados
            </p>
            <p className="text-xs" style={{ color: 'var(--text-3)', lineHeight: 1.6 }}>
              Nubank, Inter, C6, Itaú, Bradesco e qualquer CSV com colunas de descrição e valor. Separador vírgula ou ponto-e-vírgula.
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Month selector */}
          <div className="flex items-center gap-2">
            <div className="flex-1">
              <label className="label">Mês da fatura</label>
              <select className="input" value={invoiceMonth} onChange={e => setMonth(Number(e.target.value))}>
                {MONTH_NAMES.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
              </select>
            </div>
            <div style={{ width: 80 }}>
              <label className="label">Ano</label>
              <input className="input" type="number" value={invoiceYear} onChange={e => setYear(Number(e.target.value))} style={{ fontFamily: '"Fira Code"' }} />
            </div>
          </div>

          {/* Select all + summary */}
          <div className="flex items-center justify-between">
            <button
              onClick={toggleAll}
              className="flex items-center gap-1.5 text-xs transition-colors"
              style={{ color: 'var(--text-2)' }}
            >
              {selected.size === rows.length
                ? <CheckSquare size={13} style={{ color: 'var(--lime)' }} />
                : <Square size={13} />
              }
              {selected.size === rows.length ? 'Desmarcar todos' : 'Marcar todos'}
            </button>
            <span className="mono text-xs" style={{ color: 'var(--text-2)', fontFamily: '"Fira Code"' }}>
              {selected.size}/{rows.length} · {fmt(totalSelected)}
            </span>
          </div>

          {/* Row list */}
          <div className="space-y-1 max-h-64 overflow-y-auto pr-1">
            {rows.map((row, i) => {
              const on = selected.has(i)
              return (
                <button
                  key={i}
                  onClick={() => toggleRow(i)}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all text-left"
                  style={{
                    background: on ? 'var(--surface-2)' : 'transparent',
                    border: `1px solid ${on ? 'var(--border)' : 'transparent'}`,
                    opacity: on ? 1 : 0.45,
                  }}
                >
                  <div
                    className="w-5 h-5 rounded-md flex items-center justify-center shrink-0 transition-all"
                    style={{
                      background: on ? 'var(--lime)' : 'var(--surface-3)',
                      border: `1px solid ${on ? 'var(--lime)' : 'var(--border-2)'}`,
                    }}
                  >
                    {on && <Check size={10} color="#07080D" strokeWidth={3} />}
                  </div>
                  <span className="text-sm flex-1 truncate" style={{ color: 'var(--text)' }}>
                    {row.description}
                  </span>
                  <span className="mono text-sm shrink-0" style={{ color: 'var(--text)', fontFamily: '"Fira Code"' }}>
                    {fmt(row.amount)}
                  </span>
                </button>
              )
            })}
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-1">
            <button className="btn-ghost flex-1 justify-center" onClick={reset}>
              Voltar
            </button>
            <button
              className="btn-lime flex-1 justify-center"
              onClick={importRows}
              disabled={saving || selected.size === 0}
            >
              {saving ? 'Importando...' : `Importar ${selected.size}`}
            </button>
          </div>
        </div>
      )}
    </Modal>
  )
}
