import { useEffect, useState } from 'react'
import { FacilityPicker } from '../components/FacilityPicker'
import { Icon } from '../components/Icon'
import { readHospitalOverview, type HospitalOverview } from '../lib/api'
import { useFacilities } from '../lib/useFacilities'

interface OverviewResponse {
  facilityId: string
  overview: HospitalOverview | null
  error: string
}

const pendingMetrics = [
  { icon: 'bed' as const, label: 'Habitaciones VIP' },
  { icon: 'bed' as const, label: 'Habitaciones semiprivadas' },
  { icon: 'activity' as const, label: 'Ambulancia' },
  { icon: 'calendar' as const, label: 'Citas del día' },
  { icon: 'flask' as const, label: 'Estudios de laboratorio' },
]

const pendingPanels = [
  { icon: 'bed' as const, title: 'Infraestructura hospitalaria' },
  { icon: 'flask' as const, title: 'Laboratorio · estado de estudios' },
  { icon: 'patient' as const, title: 'Ingresos recientes de pacientes' },
  { icon: 'calendar' as const, title: 'Citas de hoy' },
]

function initials(name: string): string {
  return name.split(/\s+/).slice(0, 2).map((part) => part[0] ?? '').join('').toUpperCase()
}

function time(value: string): string {
  return new Date(value).toLocaleTimeString('es-SV', { hour: '2-digit', minute: '2-digit' })
}

export function GeneralDashboard() {
  const { facilities, loading: facilitiesLoading, error: facilitiesError } = useFacilities()
  const [selectedFacilityId, setSelectedFacilityId] = useState('')
  const [showUnconnected, setShowUnconnected] = useState(true)
  const [response, setResponse] = useState<OverviewResponse | null>(null)
  const facilityId = facilities.find((facility) => facility.id === selectedFacilityId)?.id ?? facilities[0]?.id ?? ''
  const currentResponse = response?.facilityId === facilityId ? response : null
  const loading = Boolean(facilityId) && !currentResponse

  useEffect(() => {
    if (!facilityId) return
    let active = true
    readHospitalOverview(facilityId).then((overview) => {
      if (active) setResponse({ facilityId, overview, error: '' })
    }).catch((loadError: unknown) => {
      if (active) setResponse({
        facilityId,
        overview: null,
        error: loadError instanceof Error ? loadError.message : 'No se pudo cargar el resumen hospitalario.',
      })
    })
    return () => {
      active = false
    }
  }, [facilityId])

  const overview = currentResponse?.overview
  const occupancy = overview && overview.capacity > 0
    ? Math.min(100, Math.round((overview.occupied / overview.capacity) * 100))
    : 0
  const availableBeds = overview ? Math.max(0, overview.capacity - overview.occupied) : 0
  const metrics = overview ? [
    { icon: 'bed' as const, label: 'Capacidad de camas', value: overview.capacity, detail: 'Camas activas', tone: 'text-[#870b30]', bar: 'bg-[#870b30]', percent: 100 },
    { icon: 'patient' as const, label: 'Camas ocupadas', value: overview.occupied, detail: `${occupancy}% de ocupación`, tone: 'text-[#870b30]', bar: 'bg-[#870b30]', percent: occupancy },
    { icon: 'check' as const, label: 'Camas disponibles', value: availableBeds, detail: 'Disponibles para asignación', tone: 'text-emerald-700', bar: 'bg-emerald-600', percent: overview.capacity > 0 ? Math.round((availableBeds / overview.capacity) * 100) : 0 },
    { icon: 'activity' as const, label: 'Personal de turno', value: overview.onDuty.length, detail: 'Turnos activos confirmados', tone: 'text-[#870b30]', bar: 'bg-[#870b30]', percent: overview.onDuty.length > 0 ? 100 : 0 },
  ] : []

  return (
    <>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <FacilityPicker facilities={facilities} loading={facilitiesLoading} onChange={setSelectedFacilityId} selectedId={facilityId} />
        <button
          aria-pressed={showUnconnected}
          className="mb-4 rounded-md border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-600 transition-colors hover:border-rose-200 hover:bg-rose-50 hover:text-[#870b30] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#870b30]"
          onClick={() => setShowUnconnected((visible) => !visible)}
          type="button"
        >
          {showUnconnected ? 'Ocultar sin endpoint' : 'Mostrar todo'}
        </button>
      </div>
      {facilitiesError && <p className="mb-4 rounded-lg bg-rose-50 px-3 py-2 text-xs text-rose-800" role="alert">{facilitiesError}</p>}
      {!facilitiesLoading && !facilitiesError && facilities.length === 0 && <p className="mb-4 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800" role="status">No hay instituciones activas disponibles para esta cuenta.</p>}
      {loading && <p className="mb-4 rounded-lg bg-white p-4 text-xs text-slate-500" role="status">Cargando resumen hospitalario...</p>}
      {currentResponse?.error && <p className="mb-4 rounded-lg bg-rose-50 px-3 py-2 text-xs text-rose-800" role="alert">{currentResponse.error}</p>}
      {overview && (
        <div className="space-y-3">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {metrics.map((metric) => (
              <article className="rounded-xl border border-slate-100 bg-white p-3 shadow-[0_2px_10px_rgba(15,23,42,0.025)]" key={metric.label}>
                <div className="flex items-center gap-2">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-rose-50 text-[#870b30]"><Icon name={metric.icon} size={14} /></span>
                  <h2 className="text-[11px] font-medium text-slate-700">{metric.label}</h2>
                </div>
                <p className={`mt-2 text-2xl font-semibold leading-none ${metric.tone}`}>{metric.value}</p>
                <p className="mt-1.5 text-[10px] text-slate-400">{metric.detail}</p>
                <div className="mt-2 h-1 overflow-hidden rounded-full bg-rose-100">
                  <div className={`h-full rounded-full ${metric.bar}`} style={{ width: `${metric.percent}%` }} />
                </div>
              </article>
            ))}
            {showUnconnected && pendingMetrics.map((metric) => (
              <article className="rounded-xl border border-dashed border-slate-200 bg-white p-3" key={metric.label}>
                <div className="flex items-center gap-2">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-400"><Icon name={metric.icon} size={14} /></span>
                  <h2 className="text-[11px] font-medium text-slate-600">{metric.label}</h2>
                </div>
                <p className="mt-2 text-sm font-medium text-slate-400">Sin datos</p>
                <p className="mt-1.5 text-[10px] text-slate-400">Pendiente de integrar al dashboard</p>
              </article>
            ))}
          </div>

          <div className="grid grid-cols-1 gap-3 xl:grid-cols-3">
            <section className="rounded-xl border border-slate-100 bg-white p-4 shadow-[0_2px_10px_rgba(15,23,42,0.025)]">
              <h2 className="text-xs font-semibold text-slate-800">Ocupación de camas</h2>
              <div className="my-4 flex justify-center">
                <div className="relative flex h-28 w-28 items-center justify-center rounded-full" style={{ background: `conic-gradient(#870b30 0% ${occupancy}%, #f8e5eb ${occupancy}% 100%)` }}>
                  <div className="flex h-[84px] w-[84px] flex-col items-center justify-center rounded-full bg-white">
                    <span className="text-xl font-semibold text-[#870b30]">{occupancy}%</span>
                    <span className="text-[10px] text-slate-400">{overview.occupied} ocupadas</span>
                  </div>
                </div>
              </div>
              <div className="space-y-2 border-t border-slate-100 pt-3 text-[11px]">
                <p className="flex justify-between text-slate-500"><span>Capacidad total</span><strong className="text-[#870b30]">{overview.capacity}</strong></p>
                <p className="flex justify-between text-slate-500"><span>Camas disponibles</span><strong className="text-[#870b30]">{availableBeds}</strong></p>
                <p className="flex justify-between text-slate-500"><span>Actualizado</span><span>{new Date(overview.asOf).toLocaleTimeString('es-SV', { hour: '2-digit', minute: '2-digit' })}</span></p>
              </div>
            </section>

            <section className="rounded-xl border border-slate-100 bg-white p-4 shadow-[0_2px_10px_rgba(15,23,42,0.025)]">
              <div className="mb-3 flex items-center justify-between gap-2">
                <h2 className="text-xs font-semibold text-slate-800">Médicos de turno</h2>
                <span className="rounded-full bg-rose-50 px-2 py-1 text-[10px] font-medium text-[#870b30]">{overview.onDuty.length} activos</span>
              </div>
              {overview.onDuty.length > 0
                ? <div className="max-h-64 space-y-2 overflow-y-auto">{overview.onDuty.map((staff) => (
                  <article className="flex items-center gap-2.5 rounded-lg bg-slate-50 p-2.5" key={`${staff.name}-${staff.department}-${staff.startsAt}`}>
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-rose-100 text-[9px] font-semibold text-[#870b30]">{initials(staff.name)}</span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[11px] font-semibold text-slate-700">{staff.name}</p>
                      <p className="mt-0.5 truncate text-[10px] text-slate-400">{staff.specialty} · {staff.department}</p>
                    </div>
                    <span className="whitespace-nowrap rounded-full bg-emerald-100 px-2 py-1 text-[9px] text-emerald-700">{time(staff.startsAt)}–{time(staff.endsAt)}</span>
                  </article>
                ))}</div>
                : <p className="rounded-lg bg-slate-50 p-3 text-[11px] text-slate-400">No hay personal de turno para mostrar.</p>}
            </section>

            <section className="rounded-xl border border-slate-100 bg-white p-4 shadow-[0_2px_10px_rgba(15,23,42,0.025)]">
              <div className="mb-3 flex items-center justify-between gap-2">
                <h2 className="text-xs font-semibold text-slate-800">Avisos institucionales</h2>
                <span className="rounded-full bg-rose-50 px-2 py-1 text-[10px] font-medium text-[#870b30]">{overview.information.length}</span>
              </div>
              {overview.information.length > 0
                ? <div className="max-h-64 space-y-2 overflow-y-auto">{overview.information.map((notice) => (
                  <article className="rounded-lg bg-slate-50 p-3" key={notice.id}>
                    <p className="text-[9px] font-semibold uppercase tracking-wide text-[#870b30]">{notice.category}</p>
                    <h3 className="mt-1 text-[11px] font-semibold text-slate-700">{notice.title}</h3>
                    <p className="mt-1 whitespace-pre-wrap text-[10px] leading-relaxed text-slate-500">{notice.body}</p>
                  </article>
                ))}</div>
                : <p className="rounded-lg bg-slate-50 p-3 text-[11px] text-slate-400">No hay avisos vigentes.</p>}
            </section>

            {showUnconnected && pendingPanels.map((panel) => (
              <section className="rounded-xl border border-dashed border-slate-200 bg-white p-4" key={panel.title}>
                <div className="mb-3 flex items-center gap-2">
                  <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-100 text-slate-400"><Icon name={panel.icon} size={14} /></span>
                  <h2 className="text-xs font-semibold text-slate-700">{panel.title}</h2>
                </div>
                <p className="rounded-lg bg-slate-50 p-3 text-[11px] leading-relaxed text-slate-400">
                  Sin datos en el resumen. Este módulo está pendiente de integración al dashboard.
                </p>
              </section>
            ))}
          </div>
        </div>
      )}
    </>
  )
}
