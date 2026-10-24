import { useMemo, useState } from 'react'
import { Icon } from '../components/Icon'
import { Panel, StatCard } from '../components/ui'

const users = [
  { initials: 'MT', name: 'Dra. Mariana Torres', email: 'mariana.torres@hospital.edu', role: 'Administradora · Doctora', area: 'Sede Central', status: 'Activo' },
  { initials: 'LR', name: 'Dr. Luis Ramírez', email: 'luis.ramirez@hospital.edu', role: 'Doctor', area: 'Urgencias', status: 'Activo' },
  { initials: 'AC', name: 'Ana Ruiz', email: 'ana.ruiz@hospital.edu', role: 'Recepcionista', area: 'Admisiones', status: 'Activo' },
  { initials: 'JM', name: 'Jorge Méndez', email: 'jorge.mendez@hospital.edu', role: 'Asistente', area: 'Sede Central', status: 'Inactivo' },
  { initials: 'EV', name: 'Dra. Elena Vargas', email: 'elena.vargas@hospital.edu', role: 'Administradora', area: 'Sede Central', status: 'Activo' },
  { initials: 'LM', name: 'Laura Méndez', email: 'laura.mendez@hospital.edu', role: 'Doctora', area: 'Laboratorio', status: 'Activo' },
]

export function UsersPage() {
  const [query, setQuery] = useState('')
  const filteredUsers = useMemo(() => users.filter((user) => `${user.name} ${user.role} ${user.area}`.toLowerCase().includes(query.toLowerCase())), [query])
  return (
    <>
      <div className="mb-4 grid grid-cols-2 gap-3 xl:grid-cols-4">
        <StatCard icon="users" label="Usuarios registrados" value="58" detail="Cuentas en el sistema" />
        <StatCard icon="check" label="Personal activo" value="52" detail="Acceso habilitado" tone="green" />
        <StatCard icon="patient" label="Doctores" value="18" detail="Personal médico" tone="blue" />
        <StatCard icon="activity" label="Recepción y apoyo" value="22" detail="Administración y recepción" tone="amber" />
      </div>
      <section className="mb-4 rounded-xl border border-slate-100 bg-white p-3 shadow-[0_2px_10px_rgba(15,23,42,0.025)]">
        <div className="flex flex-col gap-2 sm:flex-row">
          <label className="flex flex-1 items-center gap-2 rounded-md bg-slate-50 px-3 py-2 text-slate-400"><Icon name="search" size={14} /><input aria-label="Buscar usuarios" className="w-full bg-transparent text-[10px] text-slate-700 outline-none placeholder:text-slate-400" onChange={(event) => setQuery(event.target.value)} placeholder="Buscar por nombre, correo electrónico o cargo..." value={query} /></label>
          <button className="flex items-center justify-center gap-1.5 rounded-md bg-[#870b30] px-3 py-2 text-[10px] font-semibold text-white transition hover:bg-[#6f0827]" type="button"><Icon name="plus" size={13} /> Nuevo usuario</button>
        </div>
        <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-[9px] text-slate-400"><span>Rol: <strong className="font-medium text-slate-600">Todos</strong></span><span>Estado: <strong className="font-medium text-slate-600">Todos</strong></span><span>Área: <strong className="font-medium text-slate-600">Todas</strong></span></div>
      </section>
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-12">
        <Panel title="Listado de usuarios" subtitle={`${filteredUsers.length} usuarios · Ordenados por nombre`} className="xl:col-span-8">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[620px] text-left text-[10px]">
              <thead><tr className="border-b border-slate-100 text-slate-400"><th className="pb-3 font-medium">Usuario</th><th className="pb-3 font-medium">Rol / Área</th><th className="pb-3 font-medium">Establecimiento</th><th className="pb-3 font-medium">Estado</th><th className="pb-3 font-medium">Acción</th></tr></thead>
              <tbody className="divide-y divide-slate-50">
                {filteredUsers.map((user) => <tr key={user.email}><td className="py-3"><div className="flex items-center gap-2"><span className="flex h-7 w-7 items-center justify-center rounded-full bg-rose-50 text-[8px] font-semibold text-[#870b30]">{user.initials}</span><div><p className="font-semibold text-slate-700">{user.name}</p><p className="mt-0.5 text-[9px] text-slate-400">{user.email}</p></div></div></td><td className="py-3 text-slate-500">{user.role}</td><td className="py-3 text-slate-500">{user.area}</td><td className="py-3"><span className={`rounded-full px-2 py-1 text-[9px] ${user.status === 'Activo' ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>{user.status}</span></td><td className="py-3"><button aria-label={`Más opciones para ${user.name}`} className="text-slate-400 hover:text-[#870b30]" type="button"><Icon name="more" size={15} /></button></td></tr>)}
                {filteredUsers.length === 0 && <tr><td className="py-8 text-center text-slate-400" colSpan={5}>No se encontraron usuarios.</td></tr>}
              </tbody>
            </table>
          </div>
          <div className="mt-3 flex items-center justify-between text-[9px] text-slate-400"><span>Mostrando {filteredUsers.length} de 58 usuarios</span><div className="flex gap-2"><button className="rounded border border-slate-200 px-2 py-1" type="button">Anterior</button><button className="rounded border border-slate-200 px-2 py-1 text-slate-600" type="button">1</button><button className="rounded border border-slate-200 px-2 py-1" type="button">2</button><button className="rounded border border-slate-200 px-2 py-1" type="button">Siguiente</button></div></div>
        </Panel>
        <div className="space-y-4 xl:col-span-4">
          <Panel title="Roles del sistema" subtitle="Permisos por perfil">
            <div className="space-y-2">
              {[
                ['Administrador', 'Control total y configuración', '8 usuarios'],
                ['Doctor', 'Acceso a pacientes y expedientes', '18 usuarios'],
                ['Recepcionista', 'Gestión de citas e ingresos', '12 usuarios'],
                ['Paciente', 'Consulta de información personal', '20 usuarios'],
              ].map(([role, detail, count], index) => <div className={`rounded-lg p-2.5 ${index === 0 ? 'bg-rose-50' : 'bg-slate-50'}`} key={role}><div className="flex items-center justify-between"><p className="text-[10px] font-semibold text-slate-700">{role}</p><span className="text-[9px] text-slate-400">{count}</span></div><p className="mt-1 text-[9px] text-slate-400">{detail}</p></div>)}
            </div>
          </Panel>
          <Panel title="Permisos y accesos" subtitle="Configuración de seguridad">
            <div className="space-y-2 text-[10px]">
              <div className="flex items-center justify-between rounded-lg bg-rose-50 p-2.5"><span className="font-medium text-slate-700">Asignar roles</span><span className="text-emerald-700">Activo</span></div>
              <div className="flex items-center justify-between rounded-lg bg-slate-50 p-2.5"><span className="font-medium text-slate-700">Áreas del hospital</span><span className="text-emerald-700">Activo</span></div>
              <div className="flex items-center justify-between rounded-lg bg-slate-50 p-2.5"><span className="font-medium text-slate-700">Auditoría</span><span className="text-emerald-700">Activo</span></div>
            </div>
          </Panel>
        </div>
      </div>
    </>
  )
}
