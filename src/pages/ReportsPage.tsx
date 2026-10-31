import { useState } from 'react'
import { Icon } from '../components/Icon'
import { Panel, StatCard } from '../components/ui'

export function ReportsPage() {
  const [period, setPeriod] = useState('Últimos 30 días')
  const [area, setArea] = useState('Todas las áreas')
  const [exported, setExported] = useState(false)
  const reportValues = period === 'Últimos 7 días'
    ? [['Consultas y admisiones', '312'], ['Ocupación promedio', '54%'], ['Citas atendidas', '224'], ['Ingresos procesados', '78']]
    : period === 'Este año'
      ? [['Consultas y admisiones', '14,820'], ['Ocupación promedio', '72%'], ['Citas atendidas', '10,896'], ['Ingresos procesados', '3,412']]
      : [['Consultas y admisiones', '1,248'], ['Ocupación promedio', '59%'], ['Citas atendidas', '896'], ['Ingresos procesados', '312']]
  const areaMetrics = [
    ['Urgencias', 88],
    ['Hospitalización', 72],
    ['Consultas externas', 96],
    ['Enfermería', 91],
  ].filter(([name]) => area === 'Todas las áreas' || name === area)

  return (
    <>
      <section className="mb-4 flex flex-wrap items-center gap-2 rounded-xl border border-slate-100 bg-white p-3 shadow-[0_2px_10px_rgba(15,23,42,0.025)]">
        <label className="text-[9px] text-slate-500">Periodo:
          <select aria-label="Periodo de reportes" className="ml-2 rounded-md bg-slate-50 px-2 py-2 text-slate-700 outline-none" onChange={(event) => { setPeriod(event.target.value); setExported(false) }} value={period}><option>Últimos 30 días</option><option>Últimos 7 días</option><option>Este año</option></select>
        </label>
        <label className="text-[9px] text-slate-500">Área:
          <select aria-label="Área de reportes" className="ml-2 rounded-md bg-slate-50 px-2 py-2 text-slate-700 outline-none" onChange={(event) => setArea(event.target.value)} value={area}><option>Todas las áreas</option><option>Urgencias</option><option>Hospitalización</option><option>Consultas externas</option><option>Enfermería</option></select>
        </label>
        <label className="text-[9px] text-slate-500">Tipo de reporte:
          <select aria-label="Tipo de reporte" className="ml-2 rounded-md bg-slate-50 px-2 py-2 text-slate-700 outline-none"><option>General</option><option>Clínico</option><option>Financiero</option><option>Operativo</option></select>
        </label>
        <button className="ml-auto flex items-center gap-1 rounded-md bg-[#870b30] px-3 py-2 text-[9px] font-semibold text-white hover:bg-[#6f0827]" onClick={() => setExported(true)} type="button"><Icon name="arrow" size={12} /> Exportar reporte</button>
      </section>
      {exported && <p className="mb-3 rounded-lg bg-emerald-50 px-3 py-2 text-[9px] text-emerald-700" role="status">Reporte de {period.toLowerCase()} preparado para exportación.</p>}
      <div className="mb-4 grid grid-cols-2 gap-3 xl:grid-cols-4">
        {reportValues.map(([label, value], index) => <StatCard icon={index === 0 ? 'patient' : index === 1 ? 'bed' : index === 2 ? 'calendar' : 'activity'} label={label} value={value} detail={period} key={label} tone={index === 1 ? 'green' : index === 2 ? 'blue' : index === 3 ? 'amber' : 'rose'} />)}
      </div>
      <div className="mb-4 grid grid-cols-1 gap-4 xl:grid-cols-12">
        <Panel className="xl:col-span-7" subtitle="Consultas registradas en el periodo seleccionado" title="Tendencia de atenciones">
          <div className="mb-3 flex justify-end gap-3 text-[8px]"><span className="text-rose-700">● Atenciones</span><span className="text-slate-400">● Ingresos</span></div>
          <div className="flex h-40 items-end justify-around gap-2 border-b border-slate-100 px-2">{[['01', 42], ['03', 56], ['05', 47], ['07', 72], ['09', 61], ['11', 80], ['13', 70], ['15', 93], ['17', 85], ['19', 100], ['21', 68], ['23', 74]].map(([day, height], index) => <div className="flex h-full flex-1 items-end justify-center gap-0.5" key={String(day)}><div className="w-2 rounded-t-sm bg-[#c57794]" style={{ height: `${height}%` }} /><div className={`w-2 rounded-t-sm ${index === 9 ? 'bg-[#870b30]' : 'bg-rose-200'}`} style={{ height: `${Number(height) * 0.76}%` }} /></div>)}</div>
          <div className="mt-2 flex justify-between text-[8px] text-slate-400"><span>Inicio del periodo</span><span>{period}</span></div>
        </Panel>
        <Panel className="xl:col-span-5" subtitle="Capacidad y disponibilidad de camas" title="Ocupación hospitalaria">
          <div className="space-y-4">{[['Camas ocupadas', 10, 17, 'bg-[#870b30]'], ['Camas libres', 7, 17, 'bg-rose-300']].map(([label, value, total, color]) => <div key={String(label)}><div className="mb-1 flex justify-between text-[9px]"><span className="text-slate-600">{label}</span><strong className="text-slate-700">{value}</strong></div><div className="h-2 rounded-full bg-slate-100"><div className={`h-full rounded-full ${color}`} style={{ width: `${Number(value) / Number(total) * 100}%` }} /></div></div>)}</div>
          <p className="mt-4 rounded-lg bg-rose-50 p-3 text-[9px] text-slate-600">Capacidad total: <strong className="text-[#870b30]">17 camas</strong> · Ocupación: <strong className="text-[#870b30]">59%</strong></p>
        </Panel>
      </div>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Panel subtitle={`Indicadores de ${area.toLowerCase()}`} title="Indicadores por servicio">
          <div className="space-y-3">{areaMetrics.map(([label, value]) => <div key={String(label)}><div className="mb-1 flex justify-between text-[9px]"><span className="font-medium text-slate-600">{label}</span><strong className="text-slate-700">{value}%</strong></div><div className="h-1.5 rounded-full bg-slate-100"><div className="h-full rounded-full bg-[#870b30]" style={{ width: `${value}%` }} /></div></div>)}</div>
        </Panel>
        <Panel subtitle="Informes listos para consultar" title="Reportes disponibles">
          <div className="space-y-2">{[['Informe de ocupación', 'Camas, habitaciones y disponibilidad', 'PDF'], ['Reporte de consultas externas', 'Citas, atenciones y especialidades', 'Excel'], ['Reporte de inventario', 'Existencias, movimientos y alertas', 'Excel']].map(([title, detail, format]) => <div className="flex items-center justify-between gap-3 rounded-lg bg-slate-50 px-3 py-2" key={title}><div><p className="text-[9px] font-semibold text-slate-700">{title}</p><p className="mt-0.5 text-[8px] text-slate-400">{detail}</p></div><button className="shrink-0 rounded-md bg-rose-50 px-2.5 py-1.5 text-[8px] font-semibold text-[#870b30]" onClick={() => setExported(true)} type="button">{format} ↓</button></div>)}</div>
        </Panel>
      </div>
    </>
  )
}
