'use client'

export const dynamic = 'force-dynamic'

import { useCallback, useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { fmt, getNextMonths, monthLabel, MONTH_NAMES } from '@/lib/finance'
import type { CardColor, CreditCard, CardTransaction } from '@/lib/types'
import { CARD_COLORS } from '@/lib/types'
import Modal from '@/components/Modal'
import PageHeader from '@/components/PageHeader'
import { Plus, Trash2, ChevronRight, CreditCard as CardIcon } from 'lucide-react'
import clsx from 'clsx'

const COLORS: CardColor[] = ['gold', 'blue', 'green', 'red', 'purple']
const COLOR_HEX: Record<CardColor, string> = {
  gold: '#C8F135', blue: '#3B82F6', green: '#2DD4BF', red: '#F43F5E', purple: '#A78BFA',
}

export default function CartoesPage() {
  const [cards, setCards] = useState<CreditCard[]>([])
  const [transactions, setTransactions] = useState<CardTransaction[]>([])
  const [selectedCard, setSelectedCard] = useState<CreditCard | null>(null)
  const [addCardOpen, setAddCardOpen] = useState(false)
  const [addTxOpen, setAddTxOpen] = useState(false)
  const [viewMonth, setViewMonth] = useState(() => {
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
    <div className="px-8 py-8 max-w-5xl mx-auto">
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
                    <div
                      className="w-8 h-5 rounded-md"
                      style={{ background: `${hex}18`, border: `1.5px solid ${hex}50` }}
                    />
                    <span className="text-sm font-semibold" style={{ color: 'var(--text)' }}>
                      {card.name}
                    </span>
                  </div>
                  <ChevronRight size={13} style={{ color: 'var(--text-3)' }} />
                </div>
                <div className="mb-1.5">
                  <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--surface-3)' }}>
                    <div className="h-full rounded-full" style={{ width: `${pct}%`, background: hex, transition: 'width 0.6s ease' }} />
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <span className="mono text-[11px]" style={{ color: 'var(--text-2)', fontFamily: '"Fira Code"' }}>
                    {fmt(monthTotal)}
                  </span>
                  <span className="mono text-[10px]" style={{ color: 'var(--text-3)', fontFamily: '"Fira Code"' }}>
                    fecha {card.closing_day} · vence {card.due_day}
                  </span>
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
                <div className="flex items-center justify-between mb-5">
                  <div>
                    <h2 className="font-semibold text-base" style={{ color: 'var(--text)' }}>
                      {selectedCard.name}
                    </h2>
                    <p className="mono text-xs mt-0.5" style={{ color: 'var(--text-2)', fontFamily: '"Fira Code"' }}>
                      limite {fmt(selectedCard.limit_amount)}
                    </p>
                  </div>
                  <div className="flex gap-2">
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
                    <div className="flex items-center justify-center py-10">
                      <p className="text-sm" style={{ color: 'var(--text-3)' }}>
                        Nenhuma transação em {MONTH_NAMES[viewMonth.month - 1]}/{viewMonth.year}
                      </p>
                    </div>
                  ) : selectedTransactions.map((tx) => (
                    <div
                      key={tx.id}
                      className="group flex items-center justify-between px-3 py-2.5 rounded-xl transition-colors"
                      style={{ background: 'var(--surface-2)', border: '1px solid var(--border)' }}
                    >
                      <div>
                        <p className="text-sm font-medium" style={{ color: 'var(--text)' }}>{tx.description}</p>
                        <p className="text-[10px] mt-0.5 uppercase tracking-wide" style={{ color: 'var(--text-3)' }}>
                          {tx.category}{tx.installments > 1 && ` · ${tx.current_installment}/${tx.installments}x`}
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="mono text-sm font-medium" style={{ color: 'var(--text)', fontFamily: '"Fira Code"' }}>
                          {fmt(tx.total_amount)}
                        </span>
                        <button
                          onClick={() => deleteTx(tx.id)}
                          className="opacity-0 group-hover:opacity-100 transition-opacity"
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
                    <span className="text-xs uppercase tracking-widest font-medium" style={{ color: 'var(--text-2)' }}>
                      Total fatura
                    </span>
                    <span
                      className="font-display font-700"
                      style={{ fontFamily: '"Barlow Condensed"', fontWeight: 700, fontSize: 24, color: hex }}
                    >
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
        <AddTransactionModal
          open={addTxOpen}
          onClose={() => setAddTxOpen(false)}
          onSaved={load}
          cardId={selectedCard.id}
        />
      )}
    </div>
  )
}

function AddCardModal({ open, onClose, onSaved }: { open: boolean; onClose: () => void; onSaved: () => void }) {
  const [name, setName] = useState('')
  const [limit, setLimit] = useState('')
  const [closing, setClosing] = useState('20')
  const [due, setDue] = useState('27')
  const [color, setColor] = useState<CardColor>('gold')
  const [saving, setSaving] = useState(false)

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
          <input className="input mono" placeholder="5.000,00" value={limit} onChange={e => setLimit(e.target.value)} style={{ fontFamily: '"Fira Code"' }} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">Fecha dia</label>
            <input className="input mono" type="number" min={1} max={31} value={closing} onChange={e => setClosing(e.target.value)} style={{ fontFamily: '"Fira Code"' }} />
          </div>
          <div>
            <label className="label">Vence dia</label>
            <input className="input mono" type="number" min={1} max={31} value={due} onChange={e => setDue(e.target.value)} style={{ fontFamily: '"Fira Code"' }} />
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

function AddTransactionModal({ open, onClose, onSaved, cardId }: {
  open: boolean; onClose: () => void; onSaved: () => void; cardId: string
}) {
  const now = new Date()
  const [desc, setDesc] = useState('')
  const [amount, setAmount] = useState('')
  const [installments, setInstallments] = useState('1')
  const [category, setCategory] = useState('outros')
  const [startMonth, setStartMonth] = useState(now.getMonth() + 1)
  const [startYear, setStartYear] = useState(now.getFullYear())
  const [saving, setSaving] = useState(false)

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
    setDesc(''); setAmount(''); setInstallments('1')
    onSaved(); onClose()
  }

  const n = parseInt(installments) || 1
  const perInstallment = amount ? parseFloat(amount.replace(',', '.')) / n : 0

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
            <input className="input" type="number" min={1} max={48} value={installments} onChange={e => setInstallments(e.target.value)} style={{ fontFamily: '"Fira Code"' }} />
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
          <div className="rounded-xl px-3 py-2.5 text-center mono text-xs" style={{ background: 'var(--surface-2)', color: 'var(--teal)', fontFamily: '"Fira Code"', border: '1px solid var(--border)' }}>
            {n}x de {fmt(perInstallment)} / mês
          </div>
        )}
        <button className="btn-lime w-full justify-center" onClick={save} disabled={saving}>
          {saving ? 'Salvando...' : 'Lançar compra'}
        </button>
      </div>
    </Modal>
  )
}
