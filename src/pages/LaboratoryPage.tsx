import { useState } from 'react'
import { Icon } from '../components/Icon'
import { Panel, StatCard } from '../components/ui'

const labOrders = [
  { id: 'LAB-2048', patient: 'Carlos Mendoza', exam: 'Biometría hemática', priority: 'Urgente', status: 'Pendiente' },
  { id: 'LAB-2049', patient: 'María López', exam: 'Química sanguínea', priority: 'Normal', status: 'En proceso' },
  { id: 'LAB-2050', patient: 'Juan Pérez', exam: 'Perfil lipídico', priority: 'Normal', status: 'Completada' },
  { id: 'LAB-2051', patient: 'Lucía García', exam: 'Uroanálisis', priority: 'Normal', status: 'Pendiente' },
  { id: 'LAB-2052', patient: 'Roberto Díaz', exam: 'PCR / Proteína C reactiva', priority: 'Urgente', status: 'En proceso' },
  { id: 'LAB-2053', patient: 'Ana Herrera', exam: 'Glucosa en ayunas', priority: 'Normal', status: 'Completada' },
]

export function LaboratoryPage() {
  const [query, setQuery] = useState('')
  const [status, setStatus] = useState('Todos')
  const filteredOrders = labOrders.filter((order) =>
    `${order.id} ${order.patient} ${order.exam}`.toLowerCase().includes(query.toLowerCase())
    && (status === 'Todos' || order.status === status),
  )
  const orderStatuses = [
    ['Pendiente', '18', 'bg-amber-50 text-amber-700'],
    ['En proceso', '22', 'bg-sky-50 text-sky-700'],
    ['Completada', '30', 'bg-emerald-50 text-emerald-700'],
    ['Urgente', '6', 'bg-rose-50 text-rose-700'],
  ]
  return (
    <>
      <div className="mb-4 grid grid-cols-2 gap-3 xl:grid-cols-4">
        <StatCard icon="file" label="Órdenes activas" value="76" detail="Solicitudes registradas" />
        <StatCard icon="clock" label="Pendientes" value="18" detail="Por recibir o analizar" tone="amber" />
        <StatCard icon="flask" label="En proceso" value="22" detail="Muestras en estudio" tone="blue" />
        <StatCard icon="check" label="Completadas" value="30" detail="Resultados disponibles" tone="green" />
      </div>
      <section className="mb-4 flex flex-wrap items-center gap-2 rounded-xl border border-slate-100 bg-white p-3 shadow-[0_2px_10px_rgba(15,23,42,0.025)]">
        <label className="flex min-w-[220px] flex-1 items-center gap-2 rounded-md bg-slate-50 px-3 py-2 text-slate-400"><Icon name="search" size={13} /><input aria-label="Buscar órdenes de laboratorio" className="w-full bg-transparent text-[9px] text-slate-700 outline-none placeholder:text-slate-400" onChange={(event) => setQuery(event.target.value)} placeholder="Buscar por orden, paciente o tipo de examen..." value={query} /></label>
        <label className="flex items-center gap-2 text-[9px] text-slate-500">Estado:
          <select aria-label="Estado de órdenes" className="rounded-md bg-slate-50 px-2 py-2 text-slate-700 outline-none" onChange={(event) => setStatus(event.target.value)} value={status}><option>Todos</option><option>Pendiente</option><option>En proceso</option><option>Completada</option></select>
        </label>
        <label className="flex items-center gap-2 text-[9px] text-slate-500">Prioridad:
          <select aria-label="Prioridad de órdenes" className="rounded-md bg-slate-50 px-2 py-2 text-slate-700 outline-none"><option>Todas</option><option>Urgente</option><option>Normal</option></select>
        </label>
        <button className="flex items-center justify-center gap-1 rounded-md bg-[#870b30] px-3 py-2 text-[9px] font-semibold text-white hover:bg-[#6f0827]" type="button"><Icon name="plus" size={12} /> Nueva orden</button>
      </section>
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-12">
        <Panel className="xl:col-span-8" subtitle={`${filteredOrders.length} órdenes · Solicitudes pendientes, en proceso y completadas`} title="Órdenes de laboratorio">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[620px] text-left text-[9px]">
              <thead><tr className="border-b border-slate-100 text-slate-400"><th className="pb-3 font-medium">Orden</th><th className="pb-3 font-medium">Paciente</th><th className="pb-3 font-medium">Examen</th><th className="pb-3 font-medium">Prioridad</th><th className="pb-3 font-medium">Estado</th><th className="pb-3 font-medium">Acción</th></tr></thead>
              <tbody className="divide-y divide-slate-50">{filteredOrders.map((order) => <tr key={order.id}><td className="py-3 font-semibold text-[#870b30]">{order.id}</td><td className="py-3 font-medium text-slate-700">{order.patient}</td><td className="py-3 text-slate-500">{order.exam}</td><td className="py-3"><span className={`rounded-full px-2 py-1 text-[8px] ${order.priority === 'Urgente' ? 'bg-rose-50 text-rose-700' : 'bg-sky-50 text-sky-700'}`}>{order.priority}</span></td><td className="py-3"><span className={`rounded-full px-2 py-1 text-[8px] ${order.status === 'Pendiente' ? 'bg-amber-50 text-amber-700' : order.status === 'En proceso' ? 'bg-sky-50 text-sky-700' : 'bg-emerald-50 text-emerald-700'}`}>{order.status}</span></td><td className="py-3"><button className="font-medium text-[#870b30] hover:underline" type="button">Ver</button></td></tr>)}
                {filteredOrders.length === 0 && <tr><td className="py-8 text-center text-slate-400" colSpan={6}>No se encontraron órdenes.</td></tr>}
              </tbody>
            </table>
          </div>
          <p className="mt-3 text-[9px] text-slate-400">Mostrando {filteredOrders.length} de 76 órdenes</p>
        </Panel>
        <div className="space-y-4 xl:col-span-4">
          <Panel title="Estado de muestras">
            <div className="space-y-2">{orderStatuses.map(([label, value, style]) => <button className={`flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-[9px] ${style}`} key={label} onClick={() => setStatus(label === 'Urgente' ? 'Todos' : label)} type="button"><span className="font-medium">{label}</span><strong>{value}</strong></button>)}</div>
          </Panel>
          <Panel title="Resultados recientes">
            <div className="space-y-2">{[['Biometría hemática', 'Carlos Mendoza · Normal'], ['Glucosa en ayunas', 'Ana Herrera · Normal'], ['Perfil metabólico', 'Completado · Disponible']].map(([test, detail]) => <div className="rounded-lg bg-slate-50 p-2.5" key={test}><p className="text-[9px] font-semibold text-slate-700">{test}</p><p className="mt-1 text-[8px] text-slate-400">{detail}</p></div>)}</div>
          </Panel>
        </div>
        <Panel className="xl:col-span-12" subtitle="Órdenes procesadas esta semana" title="Estadísticas del laboratorio">
          <div className="mb-3 flex items-center justify-between"><span className="text-[9px] text-slate-500">Tiempo promedio de procesamiento: <strong className="text-[#870b30]">4.2 h</strong></span><span className="text-[8px] text-slate-400">Últimos 7 días</span></div>
          <div className="flex h-24 items-end justify-around gap-3 border-b border-slate-100 px-3">{[['Lun', 42], ['Mar', 64], ['Mié', 58], ['Jue', 78], ['Vie', 68], ['Sáb', 92], ['Dom', 76]].map(([day, value]) => <div className="flex h-full flex-1 flex-col items-center justify-end gap-1.5" key={String(day)}><div className={`w-full max-w-8 rounded-t-md ${day === 'Sáb' ? 'bg-[#870b30]' : 'bg-[#c57794]'}`} style={{ height: `${value}%` }} /><span className="mb-1 text-[8px] text-slate-400">{day}</span></div>)}</div>
        </Panel>
      </div>
    </>
  )
}
