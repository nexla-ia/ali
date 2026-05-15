'use client'

export const dynamic = 'force-dynamic'

import { useCallback, useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import {
  fmt, getMonthSummary, getNextMonths,
  statusColors, statusLabel, monthLabel, MONTH_NAMES,
} from '@/lib/finance'
import type {
  CreditCard, CardTransaction, IncomeEntry,
  FixedExpense, VariableExpense, MonthSummary,
} from '@/lib/types'
import { CARD_COLORS } from '@/lib/types'
import { RefreshCw, ArrowUpRight, ArrowDownRight } from 'lucide-react'
import clsx from 'clsx'

const STATUS_CONFIG = {
  tranquilo: { label: 'TRANQUILO',      color: 'var(--teal)',  dimColor: 'var(--teal-dim)',  glow: 'rgba(45,212,191,0.25)' },
  atencao:   { label: 'ATENÇÃO',        color: 'var(--amber)', dimColor: 'var(--amber-dim)', glow: 'rgba(251,191,36,0.2)' },
  segurar:   { label: 'SEGURA O GASTO', color: 'var(--rose)',  dimColor: 'var(--rose-dim)',  glow: 'rgba(244,63,94,0.2)' },
}

export default function Dashboard() {
  const [cards, setCards] = useState<CreditCard[]>([])
  const [transactions, setTransactions] = useState<CardTransaction[]>([])
  const [income, setIncome] = useState<IncomeEntry[]>([])
  const [fixed, setFixed] = useState<FixedExpense[]>([])
  const [variable, setVariable] = useState<VariableExpense[]>([])
  const [loading, setLoading] = useState(true)

  const now = new Date()
  const currentMonth = now.getMonth() + 1
  const currentYear  = now.getFullYear()

  const load = useCallback(async () => {
    setLoading(true)
    const [c, t, i, f, v] = await Promise.all([
      supabase.from('credit_cards').select('*'),
      supabase.from('card_transactions').select('*'),
      supabase.from('income_entries').select('*'),
      supabase.from('fixed_expenses').select('*').eq('active', true),
      supabase.from('variable_expenses').select('*'),
    ])
    setCards(c.data ?? [])
    setTransactions(t.data ?? [])
    setIncome(i.data ?? [])
    setFixed(f.data ?? [])
    setVariable(v.data ?? [])
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  const months = getNextMonths(5)
  const summaries: MonthSummary[] = months.map(({ month, year }) =>
    getMonthSummary(month, year, income, fixed, transactions, variable)
  )
  const current = summaries[0]
  const cfg = STATUS_CONFIG[current.status]

  const cardInvoicesByCard = cards.map((card) => {
    const total = transactions
      .filter(t => t.card_id === card.id && t.invoice_month === currentMonth && t.invoice_year === currentYear)
      .reduce((s, t) => s + t.total_amount, 0)
    return { card, total }
  })

  const pct = current.income > 0 ? Math.round((current.available / current.income) * 100) : 0

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <RefreshCw size={16} className="animate-spin" style={{ color: 'var(--lime)' }} />
      </div>
    )
  }

  return (
    <div className="px-8 py-8 max-w-5xl mx-auto space-y-4">

      {/* Top bar */}
      <div className="flex items-center justify-between anim-fade-up">
        <div style={{ color: 'var(--text-2)' }}>
          <span className="mono text-xs">
            {MONTH_NAMES[currentMonth - 1].toUpperCase()} · {currentYear}
          </span>
        </div>
        <button onClick={load} className="btn-ghost">
          <RefreshCw size={12} /> Atualizar
        </button>
      </div>

      {/* HERO STATUS CARD */}
      <div
        className="rounded-2xl p-8 anim-fade-up delay-1 relative overflow-hidden"
        style={{
          background: `linear-gradient(135deg, var(--surface) 0%, ${cfg.dimColor} 100%)`,
          border: `1px solid ${cfg.color}30`,
          boxShadow: `0 0 60px ${cfg.glow}`,
        }}
      >
        {/* Decorative ring */}
        <div
          className="absolute -right-16 -top-16 w-64 h-64 rounded-full opacity-10 anim-pulse"
          style={{ border: `1.5px solid ${cfg.color}` }}
        />
        <div
          className="absolute -right-8 -top-8 w-40 h-40 rounded-full opacity-10"
          style={{ border: `1.5px solid ${cfg.color}` }}
        />

        <div className="relative flex items-end justify-between">
          <div>
            <p className="text-xs font-medium uppercase tracking-widest mb-4" style={{ color: cfg.color }}>
              disponível para gastar
            </p>

            {/* Big number */}
            <div
              className="anim-num-pop delay-2"
              style={{
                fontFamily: '"Barlow Condensed", sans-serif',
                fontWeight: 800,
                fontSize: 'clamp(48px, 8vw, 80px)',
                lineHeight: 1,
                color: 'var(--text)',
                letterSpacing: '-0.02em',
              }}
            >
              {fmt(current.available)}
            </div>

            {/* Status pill */}
            <div className="flex items-center gap-3 mt-4">
              <span
                className="tag-pill"
                style={{ color: cfg.color, borderColor: `${cfg.color}40`, background: `${cfg.color}12` }}
              >
                {cfg.label}
              </span>
              {current.income > 0 && (
                <span className="mono text-xs" style={{ color: 'var(--text-2)' }}>
                  {pct}% da renda
                </span>
              )}
            </div>
          </div>

          {/* Progress arc */}
          <div className="hidden lg:flex flex-col items-end gap-2">
            <svg width="80" height="80" viewBox="0 0 80 80">
              <circle cx="40" cy="40" r="34" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="6" />
              <circle
                cx="40" cy="40" r="34"
                fill="none"
                stroke={cfg.color}
                strokeWidth="6"
                strokeLinecap="round"
                strokeDasharray={`${2 * Math.PI * 34}`}
                strokeDashoffset={`${2 * Math.PI * 34 * (1 - Math.max(0, Math.min(pct, 100)) / 100)}`}
                transform="rotate(-90 40 40)"
                style={{ transition: 'stroke-dashoffset 1s cubic-bezier(0.34,1.56,0.64,1)' }}
              />
              <text
                x="40" y="44"
                textAnchor="middle"
                style={{ fontFamily: '"Fira Code"', fontSize: 13, fontWeight: 500, fill: cfg.color }}
              >
                {pct}%
              </text>
            </svg>
          </div>
        </div>
      </div>

      {/* Metric cards row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: 'Renda',      value: current.income,           positive: true,  delay: 'delay-2' },
          { label: 'Fixos',      value: current.fixedExpenses,    positive: false, delay: 'delay-3' },
          { label: 'Faturas',    value: current.cardInvoices,     positive: false, delay: 'delay-4' },
          { label: 'Variáveis',  value: current.variableExpenses, positive: false, delay: 'delay-5' },
        ].map(({ label, value, positive, delay }) => (
          <div key={label} className={`card card-hover anim-fade-up ${delay}`}>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-medium uppercase tracking-widest" style={{ color: 'var(--text-2)' }}>
                {label}
              </span>
              {positive
                ? <ArrowUpRight size={14} style={{ color: 'var(--teal)' }} />
                : <ArrowDownRight size={14} style={{ color: 'var(--rose)' }} />
              }
            </div>
            <p
              className="mono font-medium"
              style={{
                fontSize: 18,
                color: positive ? 'var(--teal)' : 'var(--text)',
                fontFamily: '"Fira Code", monospace',
              }}
            >
              {fmt(value)}
            </p>
          </div>
        ))}
      </div>

      {/* Bottom grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

        {/* Next months */}
        <div className="card anim-fade-up delay-3">
          <p className="text-xs font-medium uppercase tracking-widest mb-4" style={{ color: 'var(--text-2)' }}>
            Próximos meses
          </p>
          <div className="space-y-2">
            {summaries.map((s, i) => {
              const sc = STATUS_CONFIG[s.status]
              const isCurrent = s.month === currentMonth && s.year === currentYear
              return (
                <div
                  key={`${s.month}-${s.year}`}
                  className="flex items-center justify-between px-3 py-2.5 rounded-xl transition-all"
                  style={{
                    background: isCurrent ? `${sc.color}10` : 'var(--surface-2)',
                    border: `1px solid ${isCurrent ? `${sc.color}30` : 'var(--border)'}`,
                  }}
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-1.5 h-1.5 rounded-full" style={{ background: sc.color }} />
                    <span
                      className="mono text-xs"
                      style={{ color: isCurrent ? sc.color : 'var(--text-2)', fontWeight: isCurrent ? 600 : 400 }}
                    >
                      {monthLabel(s.month, s.year)}
                    </span>
                    {isCurrent && (
                      <span className="text-[9px] uppercase tracking-widest" style={{ color: 'var(--text-3)' }}>
                        atual
                      </span>
                    )}
                  </div>
                  <div className="text-right">
                    <p
                      className="mono text-sm font-medium"
                      style={{ color: s.available >= 0 ? 'var(--text)' : 'var(--rose)', fontFamily: '"Fira Code"' }}
                    >
                      {fmt(s.available)}
                    </p>
                    <p className="mono text-[10px]" style={{ color: 'var(--text-3)', fontFamily: '"Fira Code"' }}>
                      fat. {fmt(s.cardInvoices)}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Card invoices */}
        <div className="card anim-fade-up delay-4">
          <p className="text-xs font-medium uppercase tracking-widest mb-4" style={{ color: 'var(--text-2)' }}>
            Faturas do mês
          </p>
          {cardInvoicesByCard.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 gap-2">
              <p className="text-sm" style={{ color: 'var(--text-3)' }}>Nenhum cartão cadastrado</p>
              <a
                href="/cartoes"
                className="text-xs font-medium"
                style={{ color: 'var(--lime)' }}
              >
                + Adicionar cartão →
              </a>
            </div>
          ) : (
            <div className="space-y-4">
              {cardInvoicesByCard.map(({ card, total }) => {
                const hex = CARD_COLORS[card.color as keyof typeof CARD_COLORS] ?? '#C8F135'
                const pctUsed = card.limit_amount > 0
                  ? Math.min((total / card.limit_amount) * 100, 100)
                  : 0
                return (
                  <div key={card.id}>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-6 h-4 rounded"
                          style={{ background: `${hex}20`, border: `1.5px solid ${hex}50` }}
                        />
                        <span className="text-sm font-medium" style={{ color: 'var(--text)' }}>
                          {card.name}
                        </span>
                      </div>
                      <span className="mono text-sm font-medium" style={{ color: 'var(--text)', fontFamily: '"Fira Code"' }}>
                        {fmt(total)}
                      </span>
                    </div>
                    <div
                      className="h-1.5 rounded-full overflow-hidden"
                      style={{ background: 'var(--surface-3)' }}
                    >
                      <div
                        className="h-full rounded-full transition-all duration-700"
                        style={{
                          width: `${pctUsed}%`,
                          background: pctUsed > 80 ? 'var(--rose)' : pctUsed > 50 ? 'var(--amber)' : hex,
                        }}
                      />
                    </div>
                    <p className="mono text-[10px] mt-1 text-right" style={{ color: 'var(--text-3)', fontFamily: '"Fira Code"' }}>
                      {pctUsed.toFixed(0)}% de {fmt(card.limit_amount)}
                    </p>
                  </div>
                )
              })}
            </div>
          )}
        </div>

      </div>
    </div>
  )
}
