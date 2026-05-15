-- Cofre — Schema Supabase
-- Execute no SQL Editor do Supabase

-- Cartões de crédito
CREATE TABLE credit_cards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  limit_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
  closing_day INTEGER NOT NULL DEFAULT 20,
  due_day INTEGER NOT NULL DEFAULT 27,
  color TEXT NOT NULL DEFAULT 'gold',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Transações dos cartões (incluindo parceladas)
-- Cada parcela vira uma row separada com invoice_month/year correspondente
CREATE TABLE card_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  card_id UUID REFERENCES credit_cards(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  total_amount DECIMAL(10,2) NOT NULL,
  installments INTEGER NOT NULL DEFAULT 1,
  current_installment INTEGER NOT NULL DEFAULT 1,
  invoice_month INTEGER NOT NULL CHECK (invoice_month BETWEEN 1 AND 12),
  invoice_year INTEGER NOT NULL,
  category TEXT NOT NULL DEFAULT 'outros',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Renda mensal (uma entrada por mês/ano)
CREATE TABLE income_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  month INTEGER NOT NULL CHECK (month BETWEEN 1 AND 12),
  year INTEGER NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  description TEXT NOT NULL DEFAULT 'Salário',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  -- removed UNIQUE(month, year) to allow multiple income sources per month
);

-- Despesas fixas recorrentes (ativas todo mês)
CREATE TABLE fixed_expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  category TEXT NOT NULL DEFAULT 'outros',
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Despesas variáveis (avulsas por mês)
CREATE TABLE variable_expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  description TEXT NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  month INTEGER NOT NULL CHECK (month BETWEEN 1 AND 12),
  year INTEGER NOT NULL,
  category TEXT NOT NULL DEFAULT 'outros',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para performance nas queries de fatura
CREATE INDEX idx_card_transactions_invoice ON card_transactions(invoice_month, invoice_year);
CREATE INDEX idx_card_transactions_card ON card_transactions(card_id);
CREATE INDEX idx_variable_expenses_month ON variable_expenses(month, year);
CREATE INDEX idx_income_entries_month ON income_entries(month, year);

-- RLS (Row Level Security) — desative se não usar auth
ALTER TABLE credit_cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE card_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE income_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE fixed_expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE variable_expenses ENABLE ROW LEVEL SECURITY;

-- Políticas permissivas (acesso total enquanto não há auth configurada)
-- Substitua por políticas baseadas em auth.uid() se adicionar login
CREATE POLICY "allow_all" ON credit_cards FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all" ON card_transactions FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all" ON income_entries FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all" ON fixed_expenses FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all" ON variable_expenses FOR ALL USING (true) WITH CHECK (true);
