import { useState } from 'react'
import { Icon } from '../components/Icon'
import { Panel, StatCard } from '../components/ui'

type RoomStatus = 'Ocupada' | 'Disponible' | 'Limpieza' | 'En espera'
const rooms: { id: string; floor: number; type: string; beds: { patient: string; status: RoomStatus }[] }[] = [
  { id: 'VIP-01', floor: 3, type: 'VIP', beds: [{ patient: 'María López', status: 'Ocupada' }] },
  { id: 'VIP-02', floor: 3, type: 'VIP', beds: [{ patient: 'Sin paciente', status: 'Disponible' }] },
  { id: 'VIP-03', floor: 3, type: 'VIP', beds: [{ patient: 'En preparación', status: 'Limpieza' }] },
  { id: 'VIP-04', floor: 3, type: 'VIP', beds: [{ patient: 'Carlos Mendoza', status: 'Ocupada' }] },
  { id: 'VIP-05', floor: 3, type: 'VIP', beds: [{ patient: 'Sin paciente', status: 'Disponible' }] },
  { id: 'HAB-201', floor: 2, type: 'Semi privada', beds: [{ patient: 'Ana Ruiz', status: 'Ocupada' }, { patient: 'Luis Pérez', status: 'Ocupada' }] },
  { id: 'HAB-202', floor: 2, type: 'Semi privada', beds: [{ patient: 'María Torres', status: 'Ocupada' }, { patient: 'Disponible', status: 'Disponible' }] },
  { id: 'HAB-203', floor: 2, type: 'Semi privada', beds: [{ patient: 'Limpieza', status: 'Limpieza' }, { patient: 'Disponible', status: 'Disponible' }] },
  { id: 'HAB-204', floor: 2, type: 'Semi privada', beds: [{ patient: 'Lucía García', status: 'Ocupada' }, { patient: 'Disponible', status: 'Disponible' }] },
  { id: 'HAB-205', floor: 2, type: 'Semi privada', beds: [{ patient: 'Roberto Díaz', status: 'Ocupada' }, { patient: 'Pedro Sánchez', status: 'Ocupada' }] },
  { id: 'HAB-206', floor: 2, type: 'Semi privada', beds: [{ patient: 'Disponible', status: 'Disponible' }, { patient: 'Disponible', status: 'Disponible' }] },
]

export function RoomsPage() {
  const [floor, setFloor] = useState('Todas')
  const [roomType, setRoomType] = useState('Todos')
  const [assigning, setAssigning] = useState<string | null>(null)
  const visibleRooms = rooms.filter((room) => (floor === 'Todas' || room.floor === Number(floor)) && (roomType === 'Todos' || room.type === roomType))
  const statusClasses: Record<RoomStatus, string> = {
    Ocupada: 'bg-rose-50 text-rose-700',
    Disponible: 'bg-emerald-50 text-emerald-700',
    Limpieza: 'bg-sky-50 text-sky-700',
    'En espera': 'bg-amber-50 text-amber-700',
  }
  const availableBeds = visibleRooms.flatMap((room) => room.beds).filter((bed) => bed.status === 'Disponible').length
  return (
    <>
      <div className="mb-4 grid grid-cols-2 gap-3 xl:grid-cols-4">
        <StatCard icon="bed" label="Capacidad total" value="17" detail="Camas habilitadas" />
        <StatCard icon="activity" label="Ocupación actual" value="10 / 17" detail="59% de ocupación" tone="blue" />
        <StatCard icon="patient" label="VIP disponibles" value="2 / 5" detail="Individuales · 3ª planta" tone="green" />
        <StatCard icon="users" label="Semi privadas" value="7 / 12" detail="Compartidas · 2ª planta" tone="amber" />
      </div>
      <section className="mb-4 flex flex-wrap items-center gap-2 rounded-xl border border-slate-100 bg-white p-3 shadow-[0_2px_10px_rgba(15,23,42,0.025)]">
        <label className="flex items-center gap-2 text-[9px] text-slate-500">Planta:
          <select aria-label="Filtrar planta" className="rounded-md bg-slate-50 px-2.5 py-2 text-slate-700 outline-none" onChange={(event) => setFloor(event.target.value)} value={floor}><option>Todas</option><option value="3">3ª Planta</option><option value="2">2ª Planta</option></select>
        </label>
        <label className="flex items-center gap-2 text-[9px] text-slate-500">Tipo:
          <select aria-label="Filtrar tipo de habitación" className="rounded-md bg-slate-50 px-2.5 py-2 text-slate-700 outline-none" onChange={(event) => setRoomType(event.target.value)} value={roomType}><option>Todos</option><option>VIP</option><option>Semi privada</option></select>
        </label>
        <span className="ml-auto text-[9px] text-slate-400">{availableBeds} camas disponibles en la vista</span>
        <button className="flex items-center justify-center gap-1.5 rounded-md bg-[#870b30] px-3 py-2 text-[9px] font-semibold text-white hover:bg-[#6f0827]" onClick={() => setAssigning('Selecciona una habitación disponible')} type="button"><Icon name="plus" size={12} /> Asignar cama</button>
      </section>
      {assigning && <div className="mb-4 flex flex-wrap items-center justify-between gap-2 rounded-lg border border-rose-100 bg-rose-50 p-3 text-[10px] text-[#870b30]"><span>{assigning}. Selecciona una cama disponible para continuar.</span><button className="font-semibold underline" onClick={() => setAssigning(null)} type="button">Cerrar</button></div>}
      {visibleRooms.some((room) => room.floor === 3) && (
        <section className="mb-4 rounded-xl border border-slate-100 bg-white p-4 shadow-[0_2px_10px_rgba(15,23,42,0.025)]">
          <div className="mb-3 flex items-start justify-between gap-2"><div><h2 className="text-xs font-semibold text-[#870b30]">3ª Planta · Habitaciones VIP</h2><p className="mt-1 text-[9px] text-slate-400">5 habitaciones individuales · 1 cama por habitación</p></div><span className="rounded-full bg-slate-50 px-2 py-1 text-[8px] text-slate-500">5 habitaciones</span></div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-5">
            {visibleRooms.filter((room) => room.floor === 3).map((room) => <article className="rounded-lg border border-slate-100 p-3" key={room.id}><div className="mb-3 flex items-center justify-between"><span className="text-[10px] font-semibold text-slate-700">{room.type}</span><span className={`rounded-full px-2 py-1 text-[8px] ${statusClasses[room.beds[0].status]}`}>{room.beds[0].status}</span></div><p className="text-[9px] font-medium text-slate-700">Cama 1</p><p className="mt-1 min-h-4 text-[8px] text-slate-400">{room.beds[0].patient}</p><button className={`mt-3 w-full rounded-md px-2 py-1.5 text-[8px] font-semibold ${room.beds[0].status === 'Disponible' ? 'bg-[#870b30] text-white hover:bg-[#6f0827]' : 'bg-rose-50 text-[#870b30] hover:bg-rose-100'}`} onClick={() => setAssigning(`${room.id} · Cama 1 (${room.beds[0].status})`)} type="button">{room.beds[0].status === 'Disponible' ? 'Asignar paciente' : 'Ver habitación'}</button></article>)}
          </div>
        </section>
      )}
      {visibleRooms.some((room) => room.floor === 2) && (
        <section className="rounded-xl border border-slate-100 bg-white p-4 shadow-[0_2px_10px_rgba(15,23,42,0.025)]">
          <div className="mb-3 flex items-start justify-between gap-2"><div><h2 className="text-xs font-semibold text-[#870b30]">2ª Planta · Habitaciones semiprivadas</h2><p className="mt-1 text-[9px] text-slate-400">6 habitaciones · 2 camas por habitación · 12 camas semiprivadas</p></div><span className="rounded-full bg-rose-50 px-2 py-1 text-[8px] text-[#870b30]">7 / 12 ocupadas</span></div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {visibleRooms.filter((room) => room.floor === 2).map((room) => <article className="rounded-lg border border-slate-100 p-3" key={room.id}><div className="mb-2 flex items-center justify-between"><span className="text-[10px] font-semibold text-slate-700">{room.id}</span><span className="rounded-full bg-slate-50 px-2 py-1 text-[8px] text-slate-500">{room.beds.filter((bed) => bed.status === 'Ocupada').length} / 2 ocupadas</span></div><div className="grid grid-cols-2 gap-2">{room.beds.map((bed, index) => <div className="rounded-md bg-slate-50 p-2" key={`${room.id}-${index}`}><p className="text-[8px] font-medium text-slate-600">Cama {index + 1}</p><span className={`mt-1 inline-block rounded-full px-1.5 py-0.5 text-[8px] ${statusClasses[bed.status]}`}>{bed.patient}</span></div>)}</div><button className="mt-2 w-full rounded-md bg-slate-50 px-2 py-1.5 text-[8px] font-semibold text-slate-600 hover:bg-rose-50 hover:text-[#870b30]" onClick={() => setAssigning(`${room.id} · camas de habitación`)} type="button">Ver habitación</button></article>)}
          </div>
        </section>
      )}
      {visibleRooms.length === 0 && <Panel title="Sin habitaciones" subtitle="No hay habitaciones para los filtros seleccionados.">Ajusta la planta o el tipo de habitación.</Panel>}
      <div className="mt-4 flex flex-wrap items-center gap-4 text-[9px] text-slate-500"><span className="font-semibold text-slate-700">Estados de cama:</span>{(['Disponible', 'Ocupada', 'En espera', 'Limpieza'] as RoomStatus[]).map((status) => <span className="flex items-center gap-1.5" key={status}><span className={`h-2 w-2 rounded-full ${status === 'Disponible' ? 'bg-emerald-400' : status === 'Ocupada' ? 'bg-rose-400' : status === 'En espera' ? 'bg-amber-400' : 'bg-sky-400'}`} />{status}</span>)}</div>
    </>
  )
}
