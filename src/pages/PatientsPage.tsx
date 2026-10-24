import { useMemo, useState } from 'react'
import { Icon } from '../components/Icon'
import { Panel, StatCard, StatusBadge } from '../components/ui'

const patients = [
  { id: 'EXP-2024-00121', initials: 'CM', name: 'Carlos Mendoza', detail: '54 años · Masculino', reason: 'Urgencias · 08:30', doctor: 'Dr. Jorge Méndez', room: 'HAB-301 · 2 camas', status: 'Ingresado' },
  { id: 'EXP-2024-00122', initials: 'MR', name: 'María López', detail: '42 años · Femenino', reason: 'Observación · 09:10', doctor: 'Dra. Ana Castillo', room: 'HAB-202 · 2 camas', status: 'Observación' },
  { id: 'EXP-2024-00123', initials: 'JP', name: 'Juan Pérez', detail: '67 años · Masculino', reason: 'Urgencias · 10:15', doctor: 'Dr. Luis Ramírez', room: 'Sin asignar', status: 'En triage' },
  { id: 'EXP-2024-00124', initials: 'LG', name: 'Lucía García', detail: '29 años · Femenino', reason: 'Programado · 09:00', doctor: 'Dra. Mariana Torres', room: 'HAB-204 · 2 camas', status: 'Alta prevista' },
  { id: 'EXP-2024-00125', initials: 'RD', name: 'Roberto Díaz', detail: '71 años · Masculino', reason: 'Urgencias · 06:31', doctor: 'Dr. Jorge Méndez', room: 'UCI-201 · 1 cama', status: 'Ingresado' },
]

export function PatientsPage() {
  const [query, setQuery] = useState('')
  const filteredPatients = useMemo(() => patients.filter((patient) => `${patient.name} ${patient.id} ${patient.reason} ${patient.room}`.toLowerCase().includes(query.toLowerCase())), [query])
  return (
    <>
      <div className="mb-4 grid grid-cols-2 gap-3 xl:grid-cols-4">
        <StatCard icon="patient" label="Ingresos hoy" value="18" detail="12% vs. ayer" />
        <StatCard icon="bed" label="Altas" value="12" detail="Pacientes dados de alta" tone="green" />
        <StatCard icon="clock" label="En observación" value="8" detail="Seguimiento pendiente" tone="amber" />
        <StatCard icon="activity" label="En triage" value="6" detail="Priorización clínica" tone="blue" />
      </div>
      <section className="mb-4 rounded-xl border border-slate-100 bg-white p-3 shadow-[0_2px_10px_rgba(15,23,42,0.025)]">
        <div className="flex flex-col gap-2 sm:flex-row">
          <label className="flex flex-1 items-center gap-2 rounded-md bg-slate-50 px-3 py-2 text-slate-400"><Icon name="search" size={14} /><input aria-label="Buscar pacientes" className="w-full bg-transparent text-[10px] text-slate-700 outline-none placeholder:text-slate-400" onChange={(event) => setQuery(event.target.value)} placeholder="Buscar por nombre, expediente o habitación..." value={query} /></label>
          <button className="flex items-center justify-center gap-1.5 rounded-md bg-[#870b30] px-3 py-2 text-[10px] font-semibold text-white transition hover:bg-[#6f0827]" type="button"><Icon name="plus" size={13} /> Registrar ingreso</button>
        </div>
        <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-[9px] text-slate-400"><span>Estado: <strong className="font-medium text-slate-600">Todos</strong></span><span>Tipo de ingreso: <strong className="font-medium text-slate-600">Todos</strong></span><span>Área / habitación: <strong className="font-medium text-slate-600">Todas</strong></span><span>Médico: <strong className="font-medium text-slate-600">Todos</strong></span><span>Fecha: <strong className="font-medium text-slate-600">Hoy</strong></span></div>
      </section>
      <Panel title="Pacientes hospitalizados y admisiones" subtitle={`${filteredPatients.length} pacientes ingresados · En observación, en triage o con alta programada`}>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[850px] text-left text-[10px]">
            <thead><tr className="border-b border-slate-100 text-slate-400"><th className="pb-3 font-medium">Expediente</th><th className="pb-3 font-medium">Paciente</th><th className="pb-3 font-medium">Ingreso</th><th className="pb-3 font-medium">Médico</th><th className="pb-3 font-medium">Habitación</th><th className="pb-3 font-medium">Estado</th><th className="pb-3 font-medium">Acciones</th></tr></thead>
            <tbody className="divide-y divide-slate-50">
              {filteredPatients.map((patient) => <tr key={patient.id}><td className="py-3 font-semibold text-[#870b30]">{patient.id}</td><td className="py-3"><div className="flex items-center gap-2"><span className="flex h-7 w-7 items-center justify-center rounded-full bg-rose-50 text-[8px] font-semibold text-[#870b30]">{patient.initials}</span><div><p className="font-semibold text-slate-700">{patient.name}</p><p className="mt-0.5 text-[9px] text-slate-400">{patient.detail}</p></div></div></td><td className="py-3 text-slate-500">{patient.reason}</td><td className="py-3 text-slate-500">{patient.doctor}</td><td className="py-3 text-slate-500">{patient.room}</td><td className="py-3"><StatusBadge status={patient.status} /></td><td className="py-3"><button className="font-medium text-[#870b30] hover:underline" type="button">Ver más</button></td></tr>)}
              {filteredPatients.length === 0 && <tr><td className="py-8 text-center text-slate-400" colSpan={7}>No se encontraron pacientes.</td></tr>}
            </tbody>
          </table>
        </div>
        <div className="mt-3 flex items-center justify-between text-[9px] text-slate-400"><span>Mostrando {filteredPatients.length} pacientes</span><div className="flex gap-2"><button className="rounded border border-slate-200 px-2 py-1" type="button">Anterior</button><button className="rounded border border-slate-200 px-2 py-1 text-slate-600" type="button">1</button><button className="rounded border border-slate-200 px-2 py-1" type="button">2</button><button className="rounded border border-slate-200 px-2 py-1" type="button">Siguiente</button></div></div>
      </Panel>
      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Panel title="Distribución de pacientes" subtitle="Ingresos por área">
          <div className="space-y-3">{[['Hospitalización', 28], ['Observación', 8], ['Triage', 6], ['Altas programadas', 12]].map(([label, count], index) => <div className="flex items-center gap-3 text-[9px]" key={String(label)}><span className="w-28 text-slate-500">{label}</span><div className="h-1.5 flex-1 rounded-full bg-slate-100"><div className={`h-full rounded-full ${index === 0 ? 'bg-[#870b30]' : index === 1 ? 'bg-amber-500' : index === 2 ? 'bg-rose-400' : 'bg-sky-500'}`} style={{ width: `${Number(count) * 3}%` }} /></div><strong className="w-4 text-right text-slate-600">{count}</strong></div>)}</div>
        </Panel>
        <Panel title="Capacidad hospitalaria" subtitle="Ocupación de camas">
          <div className="space-y-3 text-[9px]"><div className="flex justify-between text-slate-500"><span>Habitaciones VIP · 5 camas</span><strong className="text-slate-700">2 ocupadas</strong></div><div className="flex justify-between text-slate-500"><span>Semi privadas · 12 camas</span><strong className="text-slate-700">6 ocupadas</strong></div><div className="mt-3 rounded-lg bg-rose-50 p-2.5"><p className="text-slate-500">Capacidad total · 17 camas</p><p className="mt-1 text-base font-bold text-[#870b30]">59% <span className="text-[9px] font-normal text-slate-400">ocupación actual</span></p></div></div>
        </Panel>
        <Panel title="Prioridades de admisión" subtitle="Seguimiento requerido">
          <div className="space-y-2">{[['Prioridad alta', '6', 'bg-rose-50 text-rose-700'], ['Prioridad media', '4', 'bg-amber-50 text-amber-700'], ['Prioridad baja', '8', 'bg-emerald-50 text-emerald-700']].map(([label, count, color]) => <div className={`flex items-center justify-between rounded-lg px-3 py-2 text-[10px] ${color}`} key={label}><span className="font-medium">{label}</span><strong>{count}</strong></div>)}</div>
        </Panel>
      </div>
    </>
  )
}
