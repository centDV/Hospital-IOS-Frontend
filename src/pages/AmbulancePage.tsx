import { useState } from 'react'
import { Icon } from '../components/Icon'
import { Panel, StatCard, StatusBadge } from '../components/ui'

const dispatches = [
  { id: 'DES-001', date: '24 oct. · 08:45', service: 'Traslado de urgencia', destination: 'Hospital Central', status: 'Completado' },
  { id: 'DES-002', date: '24 oct. · 07:20', service: 'Traslado interhospitalario', destination: 'Hospital Regional', status: 'En curso' },
  { id: 'DES-003', date: '23 oct. · 22:10', service: 'Atención de emergencia', destination: 'Zona urbana', status: 'Completado' },
  { id: 'DES-004', date: '23 oct. · 18:30', service: 'Traslado de paciente', destination: 'Centro de especialidades', status: 'Completado' },
]

export function AmbulancePage() {
  const [ambulanceStatus, setAmbulanceStatus] = useState('Disponible')
  const [showDispatchForm, setShowDispatchForm] = useState(false)
  const [showLog, setShowLog] = useState(false)
  const statusClass = ambulanceStatus === 'Disponible'
    ? 'bg-emerald-50 text-emerald-700'
    : ambulanceStatus === 'En servicio'
      ? 'bg-amber-50 text-amber-700'
      : 'bg-sky-50 text-sky-700'

  return (
    <>
      <div className="mb-4 grid grid-cols-2 gap-3 xl:grid-cols-4">
        <StatCard icon="activity" label="Unidades registradas" value="1" detail="Unidad activa del hospital" />
        <StatCard icon="check" label="Estado actual" value={ambulanceStatus} detail="Unidad AMB-001" tone={ambulanceStatus === 'Disponible' ? 'green' : 'amber'} />
        <StatCard icon="clock" label="Servicios del mes" value="24" detail="Traslados y emergencias" tone="blue" />
        <StatCard icon="patient" label="En mantenimiento" value="0" detail="Sin unidades detenidas" />
      </div>
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-12">
        <Panel className="xl:col-span-8" subtitle="Unidad de respuesta y traslado de pacientes" title="Unidad de Emergencias · AMB-001">
          <div className="grid items-center gap-4 md:grid-cols-[220px_1fr]">
            <div className="flex h-40 items-center justify-center rounded-xl bg-slate-50">
              <div className="relative flex h-20 w-40 items-center justify-center rounded-2xl border-2 border-slate-300 bg-white shadow-sm">
                <span className="absolute -top-2 left-5 h-3 w-10 rounded-t-md bg-rose-500" />
                <span className="text-3xl font-bold text-[#870b30]">+</span>
                <span className="absolute -bottom-2 left-6 h-5 w-5 rounded-full border-4 border-slate-500 bg-white" />
                <span className="absolute -bottom-2 right-6 h-5 w-5 rounded-full border-4 border-slate-500 bg-white" />
                <span className="absolute bottom-2 right-3 text-[7px] font-bold text-slate-400">AMB-001</span>
              </div>
            </div>
            <div>
              <div className="mb-3 flex items-center justify-between gap-2"><h3 className="text-sm font-semibold text-[#870b30]">Ambulancia institucional</h3><span className={`rounded-full px-2.5 py-1 text-[8px] font-medium ${statusClass}`}>{ambulanceStatus}</span></div>
              <div className="grid grid-cols-2 gap-3 text-[9px] sm:grid-cols-3">
                <div><p className="text-slate-400">Unidad</p><p className="mt-1 font-semibold text-slate-700">AMB-001</p></div>
                <div><p className="text-slate-400">Estado</p><p className="mt-1 font-semibold text-slate-700">{ambulanceStatus}</p></div>
                <div><p className="text-slate-400">Último servicio</p><p className="mt-1 font-semibold text-slate-700">Hoy · 08:45</p></div>
                <div><p className="text-slate-400">Ubicación</p><p className="mt-1 font-semibold text-slate-700">Base hospitalaria</p></div>
                <div><p className="text-slate-400">Dotación</p><p className="mt-1 font-semibold text-slate-700">2 profesionales</p></div>
                <div><p className="text-slate-400">Tipo</p><p className="mt-1 font-semibold text-slate-700">Emergencias</p></div>
              </div>
            </div>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            <button className="rounded-md bg-[#870b30] px-3 py-2 text-[9px] font-semibold text-white hover:bg-[#6f0827]" onClick={() => setShowDispatchForm((open) => !open)} type="button"><Icon className="mr-1 inline" name="plus" size={12} />Registrar despacho</button>
            <button className="rounded-md bg-rose-50 px-3 py-2 text-[9px] font-semibold text-[#870b30] hover:bg-rose-100" onClick={() => setShowLog((open) => !open)} type="button">Ver historial de la unidad</button>
          </div>
          {showDispatchForm && <form className="mt-4 grid grid-cols-1 gap-2 rounded-lg border border-slate-100 bg-slate-50 p-3 sm:grid-cols-3" onSubmit={(event) => { event.preventDefault(); setAmbulanceStatus('En servicio'); setShowDispatchForm(false) }}>
            <label className="text-[9px] text-slate-500">Destino<input className="mt-1 w-full rounded-md border border-slate-200 bg-white px-2 py-2 text-[10px] text-slate-700 outline-none focus:border-rose-300" placeholder="Dirección o centro" required /></label>
            <label className="text-[9px] text-slate-500">Tipo de servicio<select className="mt-1 w-full rounded-md border border-slate-200 bg-white px-2 py-2 text-[10px] text-slate-700 outline-none"><option>Emergencia</option><option>Traslado</option><option>Interhospitalario</option></select></label>
            <button className="self-end rounded-md bg-[#870b30] px-3 py-2 text-[9px] font-semibold text-white" type="submit">Confirmar despacho</button>
          </form>}
          {showLog && <div className="mt-3 rounded-lg bg-slate-50 p-3 text-[9px] text-slate-600">Último mantenimiento: 18 oct. 2024 · Próxima revisión: 18 nov. 2024 · Kilometraje: 24,850 km.</div>}
        </Panel>
        <Panel className="xl:col-span-4" subtitle="Disponibilidad y estado actual" title="Estado y disponibilidad">
          <div className="mb-3 rounded-lg bg-emerald-50 p-3"><div className="flex items-center justify-between"><span className="text-[10px] font-semibold text-emerald-800">Unidad AMB-001</span><span className="h-2 w-2 rounded-full bg-emerald-500" /></div><p className="mt-1 text-[9px] text-emerald-700">{ambulanceStatus} para emergencias</p></div>
          <p className="mb-2 text-[9px] font-semibold text-slate-700">Estados permitidos</p>
          <div className="space-y-2">{['Disponible', 'En servicio', 'En mantenimiento'].map((item) => <button className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-[9px] ${ambulanceStatus === item ? 'bg-emerald-50 font-semibold text-emerald-800' : 'bg-slate-50 text-slate-500 hover:bg-slate-100'}`} key={item} onClick={() => setAmbulanceStatus(item)} type="button">{item}{ambulanceStatus === item && <Icon name="check" size={12} />}</button>)}</div>
          <p className="mt-3 text-[8px] leading-relaxed text-slate-400">El cambio de estado se refleja en la disponibilidad de la unidad.</p>
        </Panel>
        <Panel className="xl:col-span-12" subtitle="Registro cronológico de servicios y traslados" title="Bitácora de despachos">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[580px] text-left text-[9px]">
              <thead><tr className="border-b border-slate-100 text-slate-400"><th className="pb-2 font-medium">Fecha</th><th className="pb-2 font-medium">Tipo de servicio</th><th className="pb-2 font-medium">Destino</th><th className="pb-2 font-medium">Estado</th><th className="pb-2 font-medium">Acción</th></tr></thead>
              <tbody className="divide-y divide-slate-50">{dispatches.map((dispatch) => <tr key={dispatch.id}><td className="py-2.5 text-slate-500">{dispatch.date}</td><td className="py-2.5 font-medium text-slate-700">{dispatch.service}</td><td className="py-2.5 text-slate-500">{dispatch.destination}</td><td className="py-2.5"><StatusBadge status={dispatch.status === 'Completado' ? 'Ingresado' : 'Observación'} /></td><td className="py-2.5"><button className="text-[#870b30] hover:underline" type="button">Ver</button></td></tr>)}</tbody>
            </table>
          </div>
        </Panel>
      </div>
    </>
  )
}
