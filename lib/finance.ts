import {
  CardTransaction,
  FinancialStatus,
  FixedExpense,
  IncomeEntry,
  MonthSummary,
  VariableExpense,
} from './types'

export function fmt(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value)
}

export function getStatus(available: number, income: number): FinancialStatus {
  if (income === 0) return 'segurar'
  const pct = (available / income) * 100
  if (pct > 25) return 'tranquilo'
  if (pct > 8) return 'atencao'
  return 'segurar'
}

export function statusLabel(s: FinancialStatus) {
  return { tranquilo: 'TRANQUILO', atencao: 'ATENÇÃO', segurar: 'SEGURA O GASTO' }[s]
}

export function statusColors(s: FinancialStatus) {
  return {
    tranquilo: {
      bg: 'bg-positive-dim',
      border: 'border-positive',
      text: 'text-positive',
      glow: 'shadow-green',
      hex: '#10B981',
    },
    atencao: {
      bg: 'bg-warning-dim',
      border: 'border-warning',
      text: 'text-warning',
      glow: '',
      hex: '#FBBF24',
    },
    segurar: {
      bg: 'bg-danger-dim',
      border: 'border-danger',
      text: 'text-danger',
      glow: 'shadow-red',
      hex: '#EF4444',
    },
  }[s]
}

export function cardInvoiceTotal(
  transactions: CardTransaction[],
  month: number,
  year: number,
  cardId?: string
): number {
  return transactions
    .filter(
      (t) =>
        t.invoice_month === month &&
        t.invoice_year === year &&
        (cardId ? t.card_id === cardId : true)
    )
    .reduce((sum, t) => sum + t.total_amount, 0)
}

export function getMonthSummary(
  month: number,
  year: number,
  income: IncomeEntry[],
  fixedExpenses: FixedExpense[],
  cardTransactions: CardTransaction[],
  variableExpenses: VariableExpense[]
): MonthSummary {
  const incomeAmount = income
    .filter((i) => i.month === month && i.year === year)
    .reduce((sum, e) => sum + e.amount, 0)

  const fixed = fixedExpenses
    .filter((e) => e.active)
    .reduce((sum, e) => sum + e.amount, 0)

  const cards = cardInvoiceTotal(cardTransactions, month, year)

  const variable = variableExpenses
    .filter((e) => e.month === month && e.year === year)
    .reduce((sum, e) => sum + e.amount, 0)

  const available = incomeAmount - fixed - cards - variable

  return {
    month,
    year,
    income: incomeAmount,
    fixedExpenses: fixed,
    cardInvoices: cards,
    variableExpenses: variable,
    available,
    status: getStatus(available, incomeAmount),
  }
}

export function getNextMonths(count: number): { month: number; year: number }[] {
  const result = []
  const now = new Date()
  for (let i = 0; i < count; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() + i, 1)
    result.push({ month: d.getMonth() + 1, year: d.getFullYear() })
  }
  return result
}

export const MONTH_NAMES = [
  'Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun',
  'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez',
]

export function monthLabel(month: number, year: number) {
  return `${MONTH_NAMES[month - 1]}/${String(year).slice(2)}`
}
