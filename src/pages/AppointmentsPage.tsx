import { useMemo, useState } from 'react'
import { Icon } from '../components/Icon'
import { Panel, StatCard } from '../components/ui'

const appointmentData = [
  { time: '07:00', patient: 'María López', specialty: 'Medicina interna', doctor: 'Dr. Luis Ramírez', status: 'Atendida' },
  { time: '07:30', patient: 'Carlos Mendoza', specialty: 'Cardiología', doctor: 'Dra. Ana Castillo', status: 'En curso' },
  { time: '08:00', patient: 'Lucía Herrera', specialty: 'Dermatología', doctor: 'Dr. Jorge Méndez', status: 'En espera' },
  { time: '08:30', patient: 'Juan Pérez', specialty: 'Traumatología', doctor: 'Dra. Mariana Torres', status: 'Atendida' },
  { time: '09:00', patient: 'Sofía Ramírez', specialty: 'Endocrinología', doctor: 'Dr. Luis Ramírez', status: 'Programada' },
  { time: '09:30', patient: 'Diego Castro', specialty: 'Neurología', doctor: 'Dra. Ana Castillo', status: 'En curso' },
]

export function AppointmentsPage() {
  const [query, setQuery] = useState('')
  const [period, setPeriod] = useState('Hoy')
  const [specialty, setSpecialty] = useState('Todas')
  const filteredAppointments = useMemo(() => appointmentData.filter((appointment) => {
    const matchesQuery = `${appointment.patient} ${appointment.doctor} ${appointment.specialty}`.toLowerCase().includes(query.toLowerCase())
    return matchesQuery && (specialty === 'Todas' || appointment.specialty === specialty)
  }), [query, specialty])
  const statusStyle: Record<string, string> = {
    Atendida: 'text-emerald-700',
    'En curso': 'text-sky-700',
    'En espera': 'text-amber-700',
    Programada: 'text-[#870b30]',
  }
  return (
    <>
      <div className="mb-4 grid grid-cols-2 gap-3 xl:grid-cols-4">
        <StatCard icon="calendar" label="Citas del día" value="42" detail="Programadas" />
        <StatCard icon="clock" label="En espera" value="8" detail="Por atender" tone="amber" />
        <StatCard icon="activity" label="En curso" value="12" detail="Atenciones activas" tone="blue" />
        <StatCard icon="check" label="Canceladas" value="4" detail="Del día" tone="green" />
      </div>
      <section className="mb-4 rounded-xl border border-slate-100 bg-white p-3 shadow-[0_2px_10px_rgba(15,23,42,0.025)]">
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-[1fr_1fr_1fr_1fr_auto]">
          <label className="flex items-center gap-2 rounded-md bg-slate-50 px-3 py-2 text-[9px] text-slate-400"><Icon name="calendar" size={13} /><input aria-label="Fecha de citas" className="w-full bg-transparent text-slate-600 outline-none" type="date" defaultValue="2024-10-24" /></label>
          <select aria-label="Filtrar especialidad" className="rounded-md bg-slate-50 px-3 py-2 text-[9px] text-slate-600 outline-none" onChange={(event) => setSpecialty(event.target.value)} value={specialty}><option>Todas</option>{[...new Set(appointmentData.map((item) => item.specialty))].map((item) => <option key={item}>{item}</option>)}</select>
          <select aria-label="Filtrar médico" className="rounded-md bg-slate-50 px-3 py-2 text-[9px] text-slate-600 outline-none"><option>Todos los médicos</option><option>Dr. Luis Ramírez</option><option>Dra. Ana Castillo</option></select>
          <label className="flex items-center gap-2 rounded-md bg-slate-50 px-3 py-2 text-slate-400"><Icon name="search" size={13} /><input aria-label="Buscar citas" className="w-full bg-transparent text-[9px] text-slate-700 outline-none placeholder:text-slate-400" onChange={(event) => setQuery(event.target.value)} placeholder="Buscar paciente o médico..." value={query} /></label>
          <button className="flex items-center justify-center gap-1.5 rounded-md bg-[#870b30] px-3 py-2 text-[9px] font-semibold text-white hover:bg-[#6f0827]" type="button"><Icon name="plus" size={12} /> Agendar cita</button>
        </div>
      </section>
      <div className="mb-4 grid grid-cols-1 gap-4 xl:grid-cols-12">
        <Panel className="xl:col-span-8" subtitle="Citas programadas por hora" title="Flujo de pacientes">
          <div className="mb-3 flex justify-end gap-1">{['Hoy', 'Semana', 'Mes'].map((item) => <button className={`rounded px-2 py-1 text-[9px] ${period === item ? 'bg-rose-50 font-semibold text-[#870b30]' : 'text-slate-400 hover:bg-slate-50'}`} key={item} onClick={() => setPeriod(item)} type="button">{item}</button>)}</div>
          <div className="flex h-36 items-end justify-around gap-2 border-b border-slate-100 px-1">
            {[['07:00', 28], ['08:00', 38], ['09:00', 52], ['10:00', 68], ['11:00', 88], ['12:00', 100], ['13:00', 64], ['14:00', 72], ['15:00', 54], ['16:00', 34], ['17:00', 24], ['18:00', 18]].map(([hour, height], index) => <div className="flex h-full min-w-0 flex-1 flex-col items-center justify-end gap-1.5" key={String(hour)}><div className={`w-full max-w-5 rounded-t-md ${index === 5 ? 'bg-[#870b30]' : 'bg-[#ca7b98]'}`} style={{ height: `${period === 'Hoy' ? height : Math.max(18, Number(height) - (period === 'Semana' ? 10 : 20))}%` }} /><span className="mb-1 text-[7px] text-slate-400">{hour}</span></div>)}
          </div>
          <p className="mt-2 text-right text-[9px] text-slate-400">Periodo: {period.toLowerCase()}</p>
        </Panel>
        <Panel className="xl:col-span-4" title="Resumen de atención">
          <div className="space-y-2">
            {[
              ['Atendidas', '18', 'bg-emerald-50 text-emerald-700'],
              ['En curso', '12', 'bg-sky-50 text-sky-700'],
              ['En espera', '8', 'bg-amber-50 text-amber-700'],
              ['Canceladas', '4', 'bg-rose-50 text-rose-700'],
            ].map(([label, value, style]) => <div className={`flex items-center justify-between rounded-lg px-3 py-2.5 text-[10px] ${style}`} key={label}><span className="font-medium">{label}</span><strong>{value}</strong></div>)}
          </div>
        </Panel>
      </div>
      <Panel subtitle={`Jueves 24 de octubre de 2024 · ${filteredAppointments.length} citas programadas`} title="Agenda del día">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[680px] text-left text-[10px]">
            <thead><tr className="border-b border-slate-100 text-slate-400"><th className="pb-3 font-medium">Hora</th><th className="pb-3 font-medium">Paciente</th><th className="pb-3 font-medium">Especialidad</th><th className="pb-3 font-medium">Médico</th><th className="pb-3 font-medium">Estado</th><th className="pb-3 font-medium">Acciones</th></tr></thead>
            <tbody className="divide-y divide-slate-50">{filteredAppointments.map((item) => <tr key={`${item.time}-${item.patient}`}><td className="py-2.5 font-semibold text-[#870b30]">{item.time}</td><td className="py-2.5 font-medium text-slate-700">{item.patient}</td><td className="py-2.5 text-slate-500">{item.specialty}</td><td className="py-2.5 text-slate-500">{item.doctor}</td><td className={`py-2.5 font-medium ${statusStyle[item.status]}`}>{item.status}</td><td className="py-2.5"><button className="text-[#870b30] hover:underline" type="button">Ver más</button></td></tr>)}
              {filteredAppointments.length === 0 && <tr><td className="py-8 text-center text-slate-400" colSpan={6}>No hay citas con esos criterios.</td></tr>}
            </tbody>
          </table>
        </div>
        <p className="mt-3 text-[9px] text-slate-400">Mostrando {filteredAppointments.length} de {appointmentData.length} citas</p>
      </Panel>
    </>
  )
}
