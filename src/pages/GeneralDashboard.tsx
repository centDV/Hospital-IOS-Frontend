import { Icon } from '../components/Icon'
import { Panel, StatCard } from '../components/ui'

export function GeneralDashboard() {
  const appointments = [
    ['08:00', 'Ana Ruiz', 'Consulta general', 'AR'],
    ['09:30', 'Pedro Sánchez', 'Cardiología', 'PS'],
    ['11:00', 'Laura Méndez', 'Laboratorio', 'LM'],
    ['13:30', 'Miguel Torres', 'Medicina interna', 'MT'],
    ['15:00', 'Sofía Ramírez', 'Consulta general', 'SR'],
  ]
  const recentPatients = [
    ['Carlos Mendoza', 'HAB-301', 'Ingresado'],
    ['María López', 'HAB-202', 'Observación'],
    ['Juan Pérez', 'Sin habitación', 'En triage'],
    ['Lucía García', 'HAB-204', 'Ingresado'],
  ]
  return (
    <>
      <div className="mb-4 grid grid-cols-2 gap-3 xl:grid-cols-4">
        <StatCard icon="bed" label="Ocupación general" value="10 / 17" detail="59% de ocupación" />
        <StatCard icon="activity" label="VIP disponibles" value="2 / 5" detail="3 ocupadas" tone="green" />
        <StatCard icon="patient" label="Hospitalizados" value="7 / 12" detail="5 camas libres" tone="blue" />
        <StatCard icon="calendar" label="Citas del día" value="42" detail="5 citas programadas" tone="amber" />
      </div>
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-12">
        <Panel title="Ocupación de camas" subtitle="Estado actual de hospitalización" className="xl:col-span-4">
          <div className="flex items-center gap-5 py-2">
            <div className="relative flex h-28 w-28 shrink-0 items-center justify-center rounded-full" style={{ background: 'conic-gradient(#890b32 0% 59%, #f6dce5 59% 100%)' }}>
              <div className="flex h-[82px] w-[82px] flex-col items-center justify-center rounded-full bg-white">
                <span className="text-xl font-bold text-[#850b30]">59%</span>
                <span className="text-[9px] text-slate-400">10 ocupadas</span>
              </div>
            </div>
            <div className="flex-1 space-y-3">
              {[['VIP individuales', '2', 'bg-[#870b30]'], ['Semi privadas', '6', 'bg-rose-400'], ['Generales', '12', 'bg-slate-300']].map(([label, value, color]) => (
                <div className="flex items-center justify-between text-[10px]" key={label}>
                  <span className="flex items-center gap-2 text-slate-500"><span className={`h-2 w-2 rounded-full ${color}`} />{label}</span><strong className="text-slate-700">{value}</strong>
                </div>
              ))}
            </div>
          </div>
        </Panel>
        <Panel title="Infraestructura hospitalaria" subtitle="Estado de habitaciones y camas" className="xl:col-span-5">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[360px] text-left text-[10px]">
              <thead className="text-slate-400"><tr><th className="pb-2 font-medium">Habitación</th><th className="pb-2 font-medium">Tipo</th><th className="pb-2 font-medium">Estado</th><th className="pb-2 font-medium">Camas</th></tr></thead>
              <tbody className="divide-y divide-slate-50">
                {[
                  ['VIP-301', 'Ocupada', 'VIP · 1 cama', 'Ocupada'],
                  ['VIP-302', 'Disponible', 'VIP · 1 cama', 'Disponible'],
                  ['HAB-202', 'Ocupada', 'Semi privada · 2 camas', 'Ocupada'],
                  ['HAB-203', 'Disponible', 'Semi privada · 2 camas', 'Disponible'],
                  ['HAB-204', 'Ocupada', 'Semi privada · 2 camas', 'Ocupada'],
                ].map((row) => <tr key={row[0]}><td className="py-2 font-medium text-slate-700">{row[0]}</td><td className="py-2 text-slate-500">{row[1]}</td><td className="py-2 text-slate-500">{row[2]}</td><td className="py-2"><span className={`rounded-full px-2 py-1 text-[9px] ${row[3] === 'Disponible' ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>{row[3]}</span></td></tr>)}
              </tbody>
            </table>
          </div>
        </Panel>
        <Panel title="Laboratorio · Estado de estudios" subtitle="Resultados y pruebas de hoy" className="xl:col-span-3">
          <div className="flex h-[126px] items-end justify-around gap-3 border-b border-slate-100 px-2">
            {[['Pendiente', 32, 'bg-[#870b30]'], ['En proceso', 66, 'bg-[#870b30]'], ['Completado', 92, 'bg-emerald-600'], ['Urgente', 22, 'bg-rose-300']].map(([label, height, color]) => (
              <div className="flex h-full flex-1 flex-col items-center justify-end gap-2" key={String(label)}>
                <span className="text-[9px] font-semibold text-slate-500">{height === 32 ? '8' : height === 66 ? '12' : height === 92 ? '18' : '4'}</span>
                <div className={`w-full max-w-7 rounded-t-md ${color}`} style={{ height: `${height}%` }} />
                <span className="mb-2 text-center text-[8px] text-slate-400">{label}</span>
              </div>
            ))}
          </div>
        </Panel>
        <Panel title="Médicos de turno" subtitle="Personal disponible" className="xl:col-span-4">
          <div className="space-y-3">
            {[
              ['MT', 'Dra. Mariana Torres', 'Medicina interna · 8:00–16:00'],
              ['LR', 'Dr. Luis Ramírez', 'Cirugía · 8:00–16:00'],
              ['AC', 'Dra. Ana Castillo', 'Pediatría · 9:00–17:00'],
              ['JM', 'Dr. Jorge Méndez', 'Urgencias · 7:00–19:00'],
            ].map(([initials, name, detail]) => <div className="flex items-center gap-3" key={name}><span className="flex h-8 w-8 items-center justify-center rounded-lg bg-rose-50 text-[9px] font-semibold text-[#870b30]">{initials}</span><div><p className="text-[10px] font-semibold text-slate-700">{name}</p><p className="mt-0.5 text-[9px] text-slate-400">{detail}</p></div><span className="ml-auto h-2 w-2 rounded-full bg-emerald-500" /></div>)}
          </div>
        </Panel>
        <Panel title="Ingresos recientes" subtitle="Últimos pacientes registrados" className="xl:col-span-4">
          <div className="space-y-3">
            {recentPatients.map(([name, room, status], index) => <div className="flex items-center gap-3" key={name}><span className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-[9px] font-semibold text-slate-500">{name.split(' ').map((part) => part[0]).slice(0, 2).join('')}</span><div className="min-w-0"><p className="text-[10px] font-semibold text-slate-700">{name}</p><p className="mt-0.5 text-[9px] text-slate-400">{room}</p></div><span className={`ml-auto whitespace-nowrap rounded-full px-2 py-1 text-[9px] ${index === 1 ? 'bg-amber-50 text-amber-700' : 'bg-emerald-50 text-emerald-700'}`}>{status}</span></div>)}
          </div>
        </Panel>
        <Panel title="Citas de hoy" subtitle="Agenda de consultas" className="xl:col-span-4">
          <div className="space-y-2">
            {appointments.map(([time, name, detail, initials]) => <div className="flex items-center gap-2 rounded-lg bg-slate-50/80 px-2.5 py-2" key={`${time}-${name}`}><span className="w-9 text-[9px] font-semibold text-[#870b30]">{time}</span><span className="flex h-7 w-7 items-center justify-center rounded-full bg-white text-[8px] font-semibold text-slate-500">{initials}</span><div className="min-w-0"><p className="truncate text-[9px] font-semibold text-slate-700">{name}</p><p className="truncate text-[8px] text-slate-400">{detail}</p></div><Icon className="ml-auto shrink-0 text-slate-300" name="chevron" size={12} /></div>)}
          </div>
        </Panel>
      </div>
    </>
  )
}
