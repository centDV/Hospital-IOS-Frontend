import { useState } from 'react'
import { Icon } from '../components/Icon'
import { Panel, StatCard, StatusBadge } from '../components/ui'

const staffMembers = [
  { name: 'Dra. Mariana Torres', area: 'Medicina Interna', role: 'Doctora', shifts: ['Mañana', 'Mañana', 'Tarde', 'Tarde', 'Libre', 'Noche', 'Noche'] },
  { name: 'Dr. Jorge Méndez', area: 'Emergencias', role: 'Doctor', shifts: ['Tarde', 'Noche', 'Mañana', 'Mañana', 'Libre', 'Tarde', 'Tarde'] },
  { name: 'Dra. Ana Castillo', area: 'Pediatría', role: 'Doctora', shifts: ['Noche', 'Tarde', 'Libre', 'Mañana', 'Mañana', 'Tarde', 'Tarde'] },
  { name: 'Dr. Luis Ramírez', area: 'Cirugía', role: 'Doctor', shifts: ['Mañana', 'Tarde', 'Libre', 'Noche', 'Noche', 'Mañana', 'Mañana'] },
  { name: 'Enf. Laura Díaz', area: 'Enfermería', role: 'Enfermera', shifts: ['Tarde', 'Mañana', 'Mañana', 'Tarde', 'Tarde', 'Libre', 'Libre'] },
  { name: 'Ana Ruiz', area: 'Recepción', role: 'Recepcionista', shifts: ['Mañana', 'Mañana', 'Tarde', 'Tarde', 'Libre', 'Libre', 'Libre'] },
]

const shiftStyles: Record<string, string> = {
  Mañana: 'bg-emerald-50 text-emerald-700',
  Tarde: 'bg-sky-50 text-sky-700',
  Noche: 'bg-amber-50 text-amber-700',
  Libre: 'bg-slate-100 text-slate-500',
}

export function StaffShiftsPage() {
  const [query, setQuery] = useState('')
  const [period, setPeriod] = useState('Semana')
  const [area, setArea] = useState('Todas')
  const filteredStaff = staffMembers.filter((member) =>
    `${member.name} ${member.area} ${member.role}`.toLowerCase().includes(query.toLowerCase())
    && (area === 'Todas' || member.area === area),
  )
  const days = period === 'Semana'
    ? ['Lun 19', 'Mar 20', 'Mié 21', 'Jue 22', 'Vie 23', 'Sáb 24', 'Dom 25']
    : period === 'Hoy'
      ? ['Hoy']
      : ['Lun 19', 'Mar 20', 'Mié 21', 'Jue 22', 'Vie 23', 'Sáb 24', 'Dom 25']

  return (
    <>
      <div className="mb-4 grid grid-cols-2 gap-3 xl:grid-cols-4">
        <StatCard icon="users" label="Personal en turno" value="38" detail="Colaboradores activos" />
        <StatCard icon="patient" label="Médicos de guardia" value="12" detail="Profesionales asignados" tone="blue" />
        <StatCard icon="clock" label="Turnos pendientes" value="6" detail="Por confirmar" tone="amber" />
        <StatCard icon="check" label="Cobertura global" value="96%" detail="Disponibilidad operativa" tone="green" />
      </div>
      <section className="mb-4 flex flex-wrap items-center gap-2 rounded-xl border border-slate-100 bg-white p-3 shadow-[0_2px_10px_rgba(15,23,42,0.025)]">
        <label className="flex items-center gap-2 text-[9px] text-slate-500">Periodo:
          <select aria-label="Periodo de turnos" className="rounded-md bg-slate-50 px-2 py-2 text-slate-700 outline-none" onChange={(event) => setPeriod(event.target.value)} value={period}><option>Semana</option><option>Hoy</option><option>Mes</option></select>
        </label>
        <label className="flex items-center gap-2 text-[9px] text-slate-500">Área:
          <select aria-label="Área de personal" className="rounded-md bg-slate-50 px-2 py-2 text-slate-700 outline-none" onChange={(event) => setArea(event.target.value)} value={area}><option>Todas</option>{[...new Set(staffMembers.map((member) => member.area))].map((item) => <option key={item}>{item}</option>)}</select>
        </label>
        <label className="flex items-center gap-2 text-[9px] text-slate-500">Cargo:
          <select aria-label="Cargo del personal" className="rounded-md bg-slate-50 px-2 py-2 text-slate-700 outline-none"><option>Todos</option><option>Doctora</option><option>Enfermera</option><option>Recepcionista</option></select>
        </label>
        <label className="ml-auto flex min-w-[180px] items-center gap-2 rounded-md bg-slate-50 px-3 py-2 text-slate-400"><Icon name="search" size={13} /><input aria-label="Buscar personal" className="w-full bg-transparent text-[9px] text-slate-700 outline-none placeholder:text-slate-400" onChange={(event) => setQuery(event.target.value)} placeholder="Buscar empleados o especialidad..." value={query} /></label>
        <button className="flex items-center justify-center gap-1 rounded-md bg-[#870b30] px-3 py-2 text-[9px] font-semibold text-white hover:bg-[#6f0827]" type="button"><Icon name="plus" size={12} /> Asignar turno</button>
      </section>
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-12">
        <Panel className="xl:col-span-9" subtitle={`Vista semanal · Distribución de guardias por colaborador · ${filteredStaff.length} personas`} title="Calendario semanal de turnos">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[700px] text-left text-[9px]">
              <thead><tr className="border-b border-slate-100 text-slate-400"><th className="pb-2 font-medium">Personal</th>{days.map((day) => <th className="pb-2 text-center font-medium" key={day}>{day}</th>)}</tr></thead>
              <tbody className="divide-y divide-slate-50">
                {filteredStaff.map((member) => <tr key={member.name}><td className="py-2.5 pr-2"><p className="font-semibold text-slate-700">{member.name}</p><p className="mt-0.5 text-[8px] text-slate-400">{member.area}</p></td>{days.map((day, index) => { const shift = member.shifts[index]; return <td className="px-1 py-2.5 text-center" key={`${member.name}-${day}`}><span className={`inline-block min-w-[48px] rounded-md px-1.5 py-1 text-[8px] ${shiftStyles[shift]}`}>{shift}</span></td> })}</tr>)}
                {filteredStaff.length === 0 && <tr><td className="py-8 text-center text-slate-400" colSpan={days.length + 1}>No se encontró personal.</td></tr>}
              </tbody>
            </table>
          </div>
          <div className="mt-3 flex flex-wrap gap-3 border-t border-slate-100 pt-3 text-[8px] text-slate-500">{Object.entries(shiftStyles).map(([label, style]) => <span className={`rounded px-2 py-1 ${style}`} key={label}>{label}</span>)}</div>
        </Panel>
        <div className="space-y-4 xl:col-span-3">
          <Panel title="Cobertura por área">
            <div className="space-y-3">{[['Emergencias', 100], ['Medicina interna', 96], ['Enfermería', 93], ['Recepción', 100]].map(([label, value]) => <div key={String(label)}><div className="mb-1 flex justify-between text-[9px]"><span className="text-slate-500">{label}</span><strong className="text-slate-700">{value}%</strong></div><div className="h-1.5 rounded-full bg-slate-100"><div className="h-full rounded-full bg-[#870b30]" style={{ width: `${value}%` }} /></div></div>)}</div>
          </Panel>
          <Panel title="Alertas de turnos">
            <div className="space-y-2">{[['2 cambios solicitados', 'bg-amber-50 text-amber-800'], ['1 guardia por confirmar', 'bg-rose-50 text-rose-800'], ['3 descansos aprobados', 'bg-emerald-50 text-emerald-800']].map(([label, style]) => <div className={`rounded-lg px-3 py-2 text-[9px] ${style}`} key={label}>{label}</div>)}</div>
          </Panel>
        </div>
        <Panel className="xl:col-span-12" subtitle="Próximos turnos confirmados" title="Turnos y próximas guardias">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[560px] text-left text-[9px]">
              <thead><tr className="border-b border-slate-100 text-slate-400"><th className="pb-2 font-medium">Colaborador</th><th className="pb-2 font-medium">Área</th><th className="pb-2 font-medium">Horario</th><th className="pb-2 font-medium">Estado</th></tr></thead>
              <tbody className="divide-y divide-slate-50">{[['Dra. Mariana Torres', 'Medicina Interna', '06:00–14:00', 'Confirmado'], ['Dr. Jorge Méndez', 'Emergencias', '22:00–06:00', 'Por confirmar']].map(([name, department, hours, status]) => <tr key={name}><td className="py-2.5 font-medium text-slate-700">{name}</td><td className="py-2.5 text-slate-500">{department}</td><td className="py-2.5 text-slate-500">{hours}</td><td className="py-2.5"><StatusBadge status={status === 'Confirmado' ? 'Ingresado' : 'Observación'} /></td></tr>)}</tbody>
            </table>
          </div>
        </Panel>
      </div>
    </>
  )
}
