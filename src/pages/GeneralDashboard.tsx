import { useEffect, useState } from 'react'
import { FacilityPicker } from '../components/FacilityPicker'
import { Panel, StatCard } from '../components/ui'
import { readHospitalOverview, type HospitalOverview } from '../lib/api'
import { useFacilities } from '../lib/useFacilities'

interface OverviewResponse {
  facilityId: string
  overview: HospitalOverview | null
  error: string
}

function initials(name: string): string {
  return name.split(/\s+/).slice(0, 2).map((part) => part[0] ?? '').join('')
}

export function GeneralDashboard() {
  const { facilities, loading: facilitiesLoading, error: facilitiesError } = useFacilities()
  const [selectedFacilityId, setSelectedFacilityId] = useState('')
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

  return (
    <>
      <FacilityPicker facilities={facilities} loading={facilitiesLoading} onChange={setSelectedFacilityId} selectedId={facilityId} />
      {facilitiesError && <p className="mb-4 rounded-lg bg-rose-50 px-3 py-2 text-[10px] text-rose-800" role="alert">{facilitiesError}</p>}
      {!facilitiesLoading && !facilitiesError && facilities.length === 0 && <p className="mb-4 rounded-lg bg-amber-50 px-3 py-2 text-[10px] text-amber-800" role="status">No hay instituciones activas disponibles para esta cuenta.</p>}
      {loading && <p className="mb-4 rounded-lg bg-white p-4 text-[10px] text-slate-500" role="status">Cargando resumen hospitalario...</p>}
      {currentResponse?.error && <p className="mb-4 rounded-lg bg-rose-50 px-3 py-2 text-[10px] text-rose-800" role="alert">{currentResponse.error}</p>}
      {overview && (
        <>
          <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
            <StatCard icon="bed" label="Capacidad de camas" value={String(overview.capacity)} detail="Camas activas de la institución" />
            <StatCard icon="patient" label="Camas ocupadas" value={String(overview.occupied)} detail={`${occupancy}% de ocupación`} tone="blue" />
            <StatCard icon="check" label="Camas disponibles" value={String(availableBeds)} detail="Según asignaciones actuales" tone="green" />
          </div>
          <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
            <Panel title="Ocupación de camas" subtitle={`Actualizado ${new Date(overview.asOf).toLocaleString('es-SV')}`}>
              <div className="flex items-center gap-5 py-2">
                <div className="relative flex h-28 w-28 shrink-0 items-center justify-center rounded-full" style={{ background: `conic-gradient(#890b32 0% ${occupancy}%, #f6dce5 ${occupancy}% 100%)` }}>
                  <div className="flex h-[82px] w-[82px] flex-col items-center justify-center rounded-full bg-white">
                    <span className="text-xl font-bold text-[#850b30]">{occupancy}%</span>
                    <span className="text-[9px] text-slate-400">{overview.occupied} ocupadas</span>
                  </div>
                </div>
                <div className="space-y-2 text-[10px] text-slate-500">
                  <p>Capacidad total: <strong className="text-slate-700">{overview.capacity}</strong></p>
                  <p>Disponibles: <strong className="text-slate-700">{availableBeds}</strong></p>
                </div>
              </div>
            </Panel>
            <Panel title="Personal de turno" subtitle="Personal confirmado con turno activo">
              {overview.onDuty.length > 0
                ? <div className="space-y-3">{overview.onDuty.map((staff) => <div className="flex items-center gap-3" key={`${staff.name}-${staff.department}-${staff.startsAt}`}><span className="flex h-8 w-8 items-center justify-center rounded-lg bg-rose-50 text-[9px] font-semibold text-[#870b30]">{initials(staff.name)}</span><div className="min-w-0"><p className="text-[10px] font-semibold text-slate-700">{staff.name}</p><p className="mt-0.5 text-[9px] text-slate-400">{staff.specialty} · {staff.department}</p></div><span className="ml-auto whitespace-nowrap text-[9px] text-slate-500">{new Date(staff.startsAt).toLocaleTimeString('es-SV', { hour: '2-digit', minute: '2-digit' })}–{new Date(staff.endsAt).toLocaleTimeString('es-SV', { hour: '2-digit', minute: '2-digit' })}</span></div>)}</div>
                : <p className="text-[10px] text-slate-400">No hay personal de turno para mostrar.</p>}
            </Panel>
            <Panel className="xl:col-span-2" title="Avisos institucionales" subtitle="Información publicada y vigente">
              {overview.information.length > 0
                ? <div className="grid gap-3 md:grid-cols-2">{overview.information.map((notice) => <article className="rounded-lg bg-slate-50 p-3" key={notice.id}><p className="text-[8px] font-semibold uppercase tracking-wide text-[#870b30]">{notice.category}</p><h3 className="mt-1 text-[10px] font-semibold text-slate-700">{notice.title}</h3><p className="mt-1 whitespace-pre-wrap text-[9px] leading-relaxed text-slate-500">{notice.body}</p></article>)}</div>
                : <p className="text-[10px] text-slate-400">No hay avisos vigentes.</p>}
            </Panel>
          </div>
        </>
      )}
    </>
  )
}
