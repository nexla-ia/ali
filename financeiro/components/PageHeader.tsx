interface PageHeaderProps {
  title: string
  subtitle?: string
  action?: React.ReactNode
}

export default function PageHeader({ title, subtitle, action }: PageHeaderProps) {
  return (
    <div className="flex items-start justify-between mb-8 anim-fade-up">
      <div>
        <h1
          className="font-display font-700 tracking-tight"
          style={{ fontFamily: '"Barlow Condensed", sans-serif', fontWeight: 700, fontSize: 32, color: 'var(--text)', lineHeight: 1 }}
        >
          {title}
        </h1>
        {subtitle && (
          <p className="text-sm mt-1.5" style={{ color: 'var(--text-2)' }}>
            {subtitle}
          </p>
        )}
      </div>
      {action && <div>{action}</div>}
    </div>
  )
}
