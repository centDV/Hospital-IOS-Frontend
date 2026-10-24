import type { ReactNode } from 'react'
import { Icon } from './Icon'
import type { IconName } from '../types'

export function StatCard({
  icon,
  label,
  value,
  detail,
  tone = 'rose',
}: {
  icon: IconName
  label: string
  value: string
  detail: string
  tone?: 'rose' | 'green' | 'blue' | 'amber'
}) {
  const tones = {
    rose: 'bg-rose-50 text-[#990b36]',
    green: 'bg-emerald-50 text-emerald-700',
    blue: 'bg-sky-50 text-sky-700',
    amber: 'bg-amber-50 text-amber-700',
  }
  return (
    <article className="rounded-xl border border-slate-100 bg-white p-4 shadow-[0_2px_10px_rgba(15,23,42,0.025)]">
      <div className="flex items-start justify-between gap-2">
        <p className="text-[11px] font-medium text-slate-500">{label}</p>
        <span className={`flex h-7 w-7 items-center justify-center rounded-lg ${tones[tone]}`}><Icon name={icon} size={14} /></span>
      </div>
      <p className="mt-2 text-[24px] font-bold leading-none text-slate-900">{value}</p>
      <p className="mt-2 text-[10px] text-slate-400">{detail}</p>
    </article>
  )
}

export function Panel({
  title,
  subtitle,
  children,
  className = '',
}: {
  title: string
  subtitle?: string
  children: ReactNode
  className?: string
}) {
  return (
    <section className={`rounded-xl border border-slate-100 bg-white p-4 shadow-[0_2px_10px_rgba(15,23,42,0.025)] ${className}`}>
      <div className="mb-4 flex items-start justify-between gap-2">
        <div>
          <h2 className="text-xs font-semibold text-slate-800">{title}</h2>
          {subtitle && <p className="mt-1 text-[10px] text-slate-400">{subtitle}</p>}
        </div>
        <button aria-label={`Más opciones de ${title}`} className="text-slate-400 hover:text-slate-700" type="button"><Icon name="more" size={17} /></button>
      </div>
      {children}
    </section>
  )
}

export function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    Ingresado: 'bg-emerald-50 text-emerald-700',
    Observación: 'bg-amber-50 text-amber-700',
    'En triage': 'bg-rose-50 text-rose-700',
    'Alta prevista': 'bg-sky-50 text-sky-700',
  }
  return <span className={`whitespace-nowrap rounded-full px-2 py-1 text-[9px] ${styles[status] ?? 'bg-slate-100 text-slate-600'}`}>{status}</span>
}
