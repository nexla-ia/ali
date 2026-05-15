interface PageHeaderProps {
  title: string
  subtitle?: string
  action?: React.ReactNode
}

export default function PageHeader({ title, subtitle, action }: PageHeaderProps) {
  return (
    <div className="flex items-start justify-between mb-6 md:mb-8 gap-3 anim-fade-up">
      <div className="min-w-0">
        <h1
          style={{
            fontFamily: '"Barlow Condensed", sans-serif',
            fontWeight: 700,
            fontSize: 'clamp(26px, 6vw, 32px)',
            color: 'var(--text)',
            lineHeight: 1,
            letterSpacing: '-0.01em',
          }}
        >
          {title}
        </h1>
        {subtitle && (
          <p className="text-sm mt-1.5 truncate" style={{ color: 'var(--text-2)' }}>
            {subtitle}
          </p>
        )}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  )
}
