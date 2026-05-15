'use client'

export const dynamic = 'force-dynamic'

import { useCallback, useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { fmt, getMonthSummary, getNextMonths, statusLabel, monthLabel } from '@/lib/finance'
import type { CardTransaction, IncomeEntry, FixedExpense, VariableExpense, MonthSummary } from '@/lib/types'
import PageHeader from '@/components/PageHeader'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, Cell, ReferenceLine,
} from 'recharts'
import { RefreshCw, AlertTriangle, TrendingUp } from 'lucide-react'

const STATUS_CONFIG = {
  tranquilo: { color: '#2DD4BF', dim: 'rgba(45,212,191,0.12)',  border: 'rgba(45,212,191,0.3)'  },
  atencao:   { color: '#FBBF24', dim: 'rgba(251,191,36,0.12)',  border: 'rgba(251,191,36,0.3)'  },
  segurar:   { color: '#F43F5E', dim: 'rgba(244,63,94,0.12)',   border: 'rgba(244,63,94,0.3)'   },
}

export default function ProjecoesPage() {
  const [transactions, setTransactions] = useState<CardTransaction[]>([])
  const [income, setIncome] = useState<IncomeEntry[]>([])
  const [fixed, setFixed] = useState<FixedExpense[]>([])
  const [variable, setVariable] = useState<VariableExpense[]>([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    const [t, i, f, v] = await Promise.all([
      supabase.from('card_transactions').select('*'),
      supabase.from('income_entries').select('*'),
      supabase.from('fixed_expenses').select('*').eq('active', true),
      supabase.from('variable_expenses').select('*'),
    ])
    setTransactions(t.data ?? [])
    setIncome(i.data ?? [])
    setFixed(f.data ?? [])
    setVariable(v.data ?? [])
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  const months = getNextMonths(7)
  const summaries: MonthSummary[] = months.map(({ month, year }) =>
    getMonthSummary(month, year, income, fixed, transactions, variable)
  )

  const criticals = summaries.filter(s => s.status === 'segurar')
  const warnings  = summaries.filter(s => s.status === 'atencao')

  const chartData = summaries.map(s => ({
    name: monthLabel(s.month, s.year),
    disponivel: Math.max(s.available, 0),
    negativo: s.available < 0 ? Math.abs(s.available) : 0,
    fixos: s.fixedExpenses,
    faturas: s.cardInvoices,
    variaveis: s.variableExpenses,
    status: s.status,
    available: s.available,
  }))

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null
    return (
      <div style={{ background: 'var(--surface-3)', border: '1px solid var(--border-2)', borderRadius: 12, padding: '10px 14px', minWidth: 160 }}>
        <p style={{ color: 'var(--text-2)', fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8 }}>{label}</p>
        {payload.map((p: any) => (
          <div key={p.name} style={{ display: 'flex', justifyContent: 'space-between', gap: 16, fontSize: 12, color: 'var(--text)', fontFamily: '"Fira Code"', marginBottom: 2 }}>
            <span style={{ color: p.fill }}>{p.name}</span>
            <span>{fmt(p.value)}</span>
          </div>
        ))}
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <RefreshCw size={16} className="animate-spin" style={{ color: 'var(--lime)' }} />
      </div>
    )
  }

  return (
    <div className="px-4 py-5 md:px-8 md:py-8 max-w-5xl mx-auto space-y-4">
      <PageHeader
        title="Projeções"
        subtitle="Visão financeira dos próximos meses"
        action={
          <button onClick={load} className="btn-ghost">
            <RefreshCw size={12} /> Atualizar
          </button>
        }
      />

      {/* Alerts */}
      {criticals.length > 0 && (
        <div className="flex items-start gap-3 rounded-xl px-4 py-3 anim-fade-up"
          style={{ background: 'rgba(244,63,94,0.08)', border: '1px solid rgba(244,63,94,0.25)' }}>
          <AlertTriangle size={15} style={{ color: 'var(--rose)', marginTop: 1 }} className="shrink-0" />
          <div>
            <p className="text-sm font-semibold" style={{ color: 'var(--rose)' }}>Meses críticos</p>
            <p className="text-xs mt-0.5" style={{ color: 'var(--text-2)' }}>
              {criticals.map(s => monthLabel(s.month, s.year)).join(', ')} — segura o gasto pra regularizar.
            </p>
          </div>
        </div>
      )}
      {warnings.length > 0 && (
        <div className="flex items-start gap-3 rounded-xl px-4 py-3 anim-fade-up delay-1"
          style={{ background: 'rgba(251,191,36,0.08)', border: '1px solid rgba(251,191,36,0.25)' }}>
          <AlertTriangle size={15} style={{ color: 'var(--amber)', marginTop: 1 }} className="shrink-0" />
          <div>
            <p className="text-sm font-semibold" style={{ color: 'var(--amber)' }}>Meses de atenção</p>
            <p className="text-xs mt-0.5" style={{ color: 'var(--text-2)' }}>
              {warnings.map(s => monthLabel(s.month, s.year)).join(', ')} — margem pequena, evite extras.
            </p>
          </div>
        </div>
      )}

      {/* Main chart */}
      <div className="card anim-fade-up delay-2">
        <div className="flex items-center gap-2 mb-6">
          <TrendingUp size={14} style={{ color: 'var(--lime)' }} />
          <p className="text-xs font-medium uppercase tracking-widest" style={{ color: 'var(--text-2)' }}>
            Disponível por mês
          </p>
        </div>
        <div style={{ height: 200 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} barSize={36} barGap={4}>
              <XAxis
                dataKey="name"
                tick={{ fill: 'var(--text-2)', fontSize: 11, fontFamily: '"Fira Code"' }}
                axisLine={false} tickLine={false}
              />
              <YAxis
                tick={{ fill: 'var(--text-2)', fontSize: 10, fontFamily: '"Fira Code"' }}
                axisLine={false} tickLine={false}
                tickFormatter={v => `${(v / 1000).toFixed(0)}k`}
                width={32}
              />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
              <ReferenceLine y={0} stroke="rgba(255,255,255,0.08)" strokeWidth={1} />
              <Bar dataKey="disponivel" name="Disponível" radius={[6, 6, 0, 0]}>
                {chartData.map((entry, i) => (
                  <Cell key={i} fill={STATUS_CONFIG[entry.status].color} fillOpacity={0.85} />
                ))}
              </Bar>
              <Bar dataKey="negativo" name="Negativo" radius={[6, 6, 0, 0]} fill="var(--rose)" fillOpacity={0.4} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Stacked chart */}
      <div className="card anim-fade-up delay-3">
        <p className="text-xs font-medium uppercase tracking-widest mb-6" style={{ color: 'var(--text-2)' }}>
          Composição de gastos
        </p>
        <div style={{ height: 160 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} barSize={18} barGap={3}>
              <XAxis dataKey="name" tick={{ fill: 'var(--text-2)', fontSize: 11, fontFamily: '"Fira Code"' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: 'var(--text-2)', fontSize: 10, fontFamily: '"Fira Code"' }} axisLine={false} tickLine={false} tickFormatter={v => `${(v/1000).toFixed(0)}k`} width={32} />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
              <Bar dataKey="fixos"     name="Fixos"     fill="#3B82F6" fillOpacity={0.75} radius={[3,3,0,0]} />
              <Bar dataKey="faturas"   name="Faturas"   fill="#A78BFA" fillOpacity={0.75} radius={[3,3,0,0]} />
              <Bar dataKey="variaveis" name="Variáveis" fill="#FBBF24" fillOpacity={0.75} radius={[3,3,0,0]} />
              <Bar dataKey="disponivel" name="Livre"    fill="#2DD4BF" fillOpacity={0.75} radius={[3,3,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="flex gap-4 mt-4 justify-center flex-wrap">
          {[
            { color: '#3B82F6', label: 'Fixos' },
            { color: '#A78BFA', label: 'Faturas' },
            { color: '#FBBF24', label: 'Variáveis' },
            { color: '#2DD4BF', label: 'Livre' },
          ].map(({ color, label }) => (
            <div key={label} className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-sm" style={{ background: color }} />
              <span className="text-[10px] uppercase tracking-widest" style={{ color: 'var(--text-2)', fontFamily: '"Fira Code"' }}>{label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="card anim-fade-up delay-4">
        <p className="text-xs font-medium uppercase tracking-widest mb-4" style={{ color: 'var(--text-2)' }}>
          Detalhamento
        </p>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)' }}>
                {['Mês', 'Renda', 'Fixos', 'Faturas', 'Variáveis', 'Disponível', ''].map(h => (
                  <th key={h} className="pb-3 pr-4 last:pr-0 text-right first:text-left"
                    style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-2)', fontWeight: 500 }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {summaries.map(s => {
                const sc = STATUS_CONFIG[s.status]
                const now = new Date()
                const isCurrent = s.month === now.getMonth() + 1 && s.year === now.getFullYear()
                return (
                  <tr
                    key={`${s.month}-${s.year}`}
                    style={{
                      borderBottom: '1px solid var(--border)',
                      background: isCurrent ? 'rgba(200,241,53,0.04)' : 'transparent',
                    }}
                  >
                    <td className="py-3 pr-4">
                      <span className="mono text-xs font-medium" style={{ color: isCurrent ? 'var(--lime)' : 'var(--text-2)', fontFamily: '"Fira Code"' }}>
                        {monthLabel(s.month, s.year)}
                      </span>
                    </td>
                    <td className="py-3 pr-4 text-right mono text-xs" style={{ color: 'var(--teal)', fontFamily: '"Fira Code"' }}>{fmt(s.income)}</td>
                    <td className="py-3 pr-4 text-right mono text-xs" style={{ color: 'var(--text-2)', fontFamily: '"Fira Code"' }}>{fmt(s.fixedExpenses)}</td>
                    <td className="py-3 pr-4 text-right mono text-xs" style={{ color: 'var(--text-2)', fontFamily: '"Fira Code"' }}>{fmt(s.cardInvoices)}</td>
                    <td className="py-3 pr-4 text-right mono text-xs" style={{ color: 'var(--text-2)', fontFamily: '"Fira Code"' }}>{fmt(s.variableExpenses)}</td>
                    <td className="py-3 pr-4 text-right mono text-xs font-semibold" style={{ color: s.available >= 0 ? sc.color : 'var(--rose)', fontFamily: '"Fira Code"' }}>
                      {fmt(s.available)}
                    </td>
                    <td className="py-3">
                      <span className="tag-pill text-[9px]" style={{ color: sc.color, borderColor: sc.border, background: sc.dim }}>
                        {statusLabel(s.status)}
                      </span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
