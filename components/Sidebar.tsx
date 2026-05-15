'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  CreditCard,
  Receipt,
  TrendingUp,
  Wallet,
} from 'lucide-react'
import clsx from 'clsx'

const links = [
  { href: '/',          label: 'Início',    icon: LayoutDashboard },
  { href: '/cartoes',   label: 'Cartões',   icon: CreditCard },
  { href: '/despesas',  label: 'Despesas',  icon: Receipt },
  { href: '/renda',     label: 'Renda',     icon: Wallet },
  { href: '/projecoes', label: 'Projeções', icon: TrendingUp },
]

export default function Sidebar() {
  const pathname = usePathname()

  return (
    <>
      {/* ── Desktop sidebar ── */}
      <aside
        className="hidden md:flex flex-col shrink-0 border-r h-full"
        style={{ width: 64, background: 'var(--surface)', borderColor: 'var(--border)' }}
      >
        <div
          className="flex items-center justify-center h-16 shrink-0 border-b"
          style={{ borderColor: 'var(--border)' }}
        >
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center select-none"
            style={{
              background: 'var(--lime)',
              color: '#07080D',
              fontFamily: '"Barlow Condensed", sans-serif',
              fontWeight: 900,
              fontSize: 14,
              letterSpacing: '-0.01em',
            }}
          >
            CF
          </div>
        </div>

        <nav className="flex-1 flex flex-col gap-1 px-2 py-4">
          {links.map(({ href, label, icon: Icon }) => {
            const active = pathname === href
            return (
              <Link
                key={href}
                href={href}
                title={label}
                className={clsx(
                  'flex items-center justify-center w-10 h-10 rounded-xl mx-auto transition-all duration-150',
                  !active && 'hover:bg-surface-3'
                )}
                style={
                  active
                    ? { background: 'var(--lime)', color: '#07080D' }
                    : { color: 'var(--text-2)' }
                }
              >
                <Icon size={17} strokeWidth={active ? 2.5 : 1.8} />
              </Link>
            )
          })}
        </nav>

        <div
          className="flex items-center justify-center py-5 border-t"
          style={{ borderColor: 'var(--border)' }}
        >
          <div
            className="w-1.5 h-1.5 rounded-full anim-pulse"
            style={{ background: 'var(--lime)', boxShadow: '0 0 8px var(--lime)' }}
          />
        </div>
      </aside>

      {/* ── Mobile bottom nav ── */}
      <nav
        className="md:hidden fixed bottom-0 left-0 right-0 z-40 flex items-stretch justify-around"
        style={{
          background: 'var(--surface)',
          borderTop: '1px solid var(--border)',
          paddingBottom: 'env(safe-area-inset-bottom)',
        }}
      >
        {links.map(({ href, label, icon: Icon }) => {
          const active = pathname === href
          return (
            <Link
              key={href}
              href={href}
              className="flex flex-col items-center justify-center gap-0.5 py-2 flex-1 transition-all"
              style={{ color: active ? 'var(--lime)' : 'var(--text-2)', minHeight: 56 }}
            >
              <div
                className="flex items-center justify-center w-8 h-6 rounded-xl transition-all"
                style={{ background: active ? 'var(--lime-dim)' : 'transparent' }}
              >
                <Icon size={18} strokeWidth={active ? 2.5 : 1.8} />
              </div>
              <span
                style={{
                  fontSize: 9,
                  fontWeight: active ? 700 : 400,
                  letterSpacing: '0.07em',
                  textTransform: 'uppercase',
                  fontFamily: '"DM Sans", sans-serif',
                }}
              >
                {label}
              </span>
            </Link>
          )
        })}
      </nav>
    </>
  )
}
