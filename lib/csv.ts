export interface CsvRow {
  description: string
  amount: number      // always positive; rawAmount preserves original sign
  rawAmount: number
}

// ── Separator detection ──────────────────────────────────────────────────────

function detectSep(text: string): string {
  const line = text.split('\n')[0]
  const tabs      = (line.match(/\t/g) ?? []).length
  const semis     = (line.match(/;/g)  ?? []).length
  const commas    = (line.match(/,/g)  ?? []).length
  if (tabs > semis && tabs > commas)  return '\t'
  if (semis >= commas)                return ';'
  return ','
}

// ── Quoted-CSV line parser ────────────────────────────────────────────────────

function splitLine(line: string, sep: string): string[] {
  const out: string[] = []
  let cur = ''
  let inQ = false
  for (let i = 0; i < line.length; i++) {
    const c = line[i]
    if (c === '"') {
      if (inQ && line[i + 1] === '"') { cur += '"'; i++ }
      else inQ = !inQ
    } else if (c === sep && !inQ) {
      out.push(cur.trim())
      cur = ''
    } else {
      cur += c
    }
  }
  out.push(cur.trim())
  return out
}

// ── Amount parsing (handles BRL and USD formats) ──────────────────────────────

function parseAmount(raw: string): number {
  let s = raw.replace(/[R$\s"']/g, '').trim()
  if (!s) return NaN

  const neg = s.startsWith('-') || (s.startsWith('(') && s.endsWith(')'))
  s = s.replace(/^[-(]|[)]$/g, '')

  const hasComma = s.includes(',')
  const hasDot   = s.includes('.')

  if (hasComma && hasDot) {
    // Determine which is decimal separator by position of last occurrence
    if (s.lastIndexOf(',') > s.lastIndexOf('.')) {
      // BRL: 1.234,56
      s = s.replace(/\./g, '').replace(',', '.')
    } else {
      // USD: 1,234.56
      s = s.replace(/,/g, '')
    }
  } else if (hasComma) {
    const parts = s.split(',')
    if (parts.length === 2 && parts[1].length <= 2) {
      // BRL decimal: 89,90
      s = s.replace(',', '.')
    } else {
      // thousands: 1,234
      s = s.replace(/,/g, '')
    }
  }

  const v = parseFloat(s)
  return neg ? -Math.abs(v) : v
}

// ── Header column finder ──────────────────────────────────────────────────────

const DESC_KW   = ['descri', 'title', 'lançamento', 'lancamento', 'estabelecimento',
                   'memo', 'hist', 'detail', 'name', 'narr', 'benefi', 'comerci']
const AMOUNT_KW = ['valor', 'amount', 'value', 'montante', 'importan', 'debit', 'credit',
                   'transac']
const SKIP_KW   = ['saldo', 'balance', 'limit']

function colIdx(headers: string[], keywords: string[]): number {
  return headers.findIndex(h =>
    keywords.some(k => h.includes(k)) && !SKIP_KW.some(k => h.includes(k))
  )
}

// ── Main parser ───────────────────────────────────────────────────────────────

export function parseCsv(text: string): CsvRow[] {
  const normalized = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n')
  const sep   = detectSep(normalized)
  const lines = normalized.split('\n').map(l => l.trim()).filter(Boolean)
  if (lines.length < 2) return []

  // Find header row — skip metadata lines at top
  let hIdx = 0
  for (let i = 0; i < Math.min(12, lines.length); i++) {
    const low = lines[i].toLowerCase()
    if (DESC_KW.some(k => low.includes(k)) || AMOUNT_KW.some(k => low.includes(k))) {
      hIdx = i
      break
    }
  }

  const headers = splitLine(lines[hIdx], sep).map(h =>
    h.toLowerCase().replace(/['"]/g, '').trim()
  )

  let dIdx = colIdx(headers, DESC_KW)
  let aIdx = colIdx(headers, AMOUNT_KW)

  // Fallbacks for simple 2–3 column files
  if (dIdx === -1 && headers.length >= 2) dIdx = headers.length >= 3 ? 1 : 0
  if (aIdx === -1 && headers.length >= 1) aIdx = headers.length - 1

  if (dIdx === -1 || aIdx === -1 || dIdx === aIdx) return []

  const rows: CsvRow[] = []
  for (let i = hIdx + 1; i < lines.length; i++) {
    const cells = splitLine(lines[i], sep)
    if (cells.length <= Math.max(dIdx, aIdx)) continue

    const desc = cells[dIdx]?.replace(/['"]/g, '').trim()
    const raw  = cells[aIdx]?.replace(/['"]/g, '').trim()
    if (!desc || !raw || raw === '-' || raw === '') continue

    const rawAmount = parseAmount(raw)
    if (isNaN(rawAmount) || rawAmount === 0) continue

    rows.push({ description: desc, amount: Math.abs(rawAmount), rawAmount })
  }

  return rows
}

// ── Infer which rows are expenses ────────────────────────────────────────────
// If most amounts are negative → expenses are negative (Nubank style)
// Pre-select only the expense rows by default.

export function inferExpenseSign(rows: CsvRow[]): 'negative' | 'positive' {
  const neg = rows.filter(r => r.rawAmount < 0).length
  const pos = rows.filter(r => r.rawAmount > 0).length
  return neg >= pos ? 'negative' : 'positive'
}
