'use client'

import { X } from 'lucide-react'
import { useEffect } from 'react'

interface ModalProps {
  open: boolean
  onClose: () => void
  title: string
  children: React.ReactNode
}

export default function Modal({ open, onClose, title, children }: ModalProps) {
  useEffect(() => {
    const h = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  }, [onClose])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 anim-fade-in"
        style={{ background: 'rgba(7,8,13,0.8)', backdropFilter: 'blur(8px)' }}
        onClick={onClose}
      />

      {/* Panel — bottom sheet on mobile, centered on sm+ */}
      <div
        className="relative w-full sm:max-w-md anim-fade-up overflow-hidden rounded-t-3xl sm:rounded-2xl"
        style={{
          background: 'var(--surface)',
          border: '1px solid var(--border-2)',
          boxShadow: '0 24px 80px rgba(0,0,0,0.7), 0 0 0 1px rgba(255,255,255,0.04)',
          maxHeight: '92dvh',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* Drag handle (mobile only) */}
        <div className="flex justify-center pt-3 pb-1 sm:hidden">
          <div className="w-10 h-1 rounded-full" style={{ background: 'var(--border-2)' }} />
        </div>

        {/* Header */}
        <div
          className="flex items-center justify-between px-6 py-4 shrink-0"
          style={{ borderBottom: '1px solid var(--border)' }}
        >
          <h2
            className="text-xs font-semibold uppercase tracking-widest"
            style={{ color: 'var(--text-2)' }}
          >
            {title}
          </h2>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-lg flex items-center justify-center transition-colors"
            style={{ color: 'var(--text-2)' }}
          >
            <X size={14} />
          </button>
        </div>

        <div className="px-6 py-5 overflow-y-auto">{children}</div>
      </div>
    </div>
  )
}
