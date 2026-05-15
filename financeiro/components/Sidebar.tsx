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
  { href: '/',          label: 'Dashboard', icon: LayoutDashboard },
  { href: '/cartoes',   label: 'Cartões',   icon: CreditCard },
  { href: '/despesas',  label: 'Despesas',  icon: Receipt },
  { href: '/renda',     label: 'Renda',     icon: Wallet },
  { href: '/projecoes', label: 'Projeções', icon: TrendingUp },
]

export default function Sidebar() {
  const pathname = usePathname()

  return (
    <aside
      className="flex flex-col shrink-0 border-r h-full"
      style={{ width: 64, background: 'var(--surface)', borderColor: 'var(--border)' }}
    >
      {/* Logo */}
      <div
        className="flex items-center justify-center h-16 shrink-0 border-b"
        style={{ borderColor: 'var(--border)' }}
      >
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center text-bg select-none"
          style={{
            background: 'var(--lime)',
            fontFamily: '"Barlow Condensed", sans-serif',
            fontWeight: 900,
            fontSize: 14,
            letterSpacing: '-0.01em',
          }}
        >
          CF
        </div>
      </div>

      {/* Nav */}
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

      {/* Status dot */}
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
  )
}
