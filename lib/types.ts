export type CardColor = 'gold' | 'blue' | 'green' | 'red' | 'purple'

export interface CreditCard {
  id: string
  name: string
  limit_amount: number
  closing_day: number
  due_day: number
  color: CardColor
  created_at: string
}

export interface CardTransaction {
  id: string
  card_id: string
  description: string
  total_amount: number
  installments: number
  current_installment: number
  invoice_month: number
  invoice_year: number
  category: string
  created_at: string
}

export interface IncomeEntry {
  id: string
  month: number
  year: number
  amount: number
  description: string
  created_at: string
}

export interface FixedExpense {
  id: string
  name: string
  amount: number
  category: string
  active: boolean
  created_at: string
}

export interface VariableExpense {
  id: string
  description: string
  amount: number
  month: number
  year: number
  category: string
  created_at: string
}

export type FinancialStatus = 'tranquilo' | 'atencao' | 'segurar'

export interface MonthSummary {
  month: number
  year: number
  income: number
  fixedExpenses: number
  cardInvoices: number
  variableExpenses: number
  available: number
  status: FinancialStatus
}

export const CATEGORIES = [
  'moradia',
  'alimentação',
  'transporte',
  'saúde',
  'educação',
  'lazer',
  'assinatura',
  'roupas',
  'outros',
] as const

export type Category = (typeof CATEGORIES)[number]

export const CARD_COLORS: Record<CardColor, string> = {
  gold: '#F59E0B',
  blue: '#3B82F6',
  green: '#10B981',
  red: '#EF4444',
  purple: '#8B5CF6',
}
