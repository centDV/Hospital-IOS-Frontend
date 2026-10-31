import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { FacilityPicker } from '../components/FacilityPicker'
import { readAdmissionPhysicians, readDoctorAppointments, readDoctorAvailability, readMyAccess, readPendingAppointmentRequests, readPublicView, rejectAppointmentRequest, scheduleAppointmentRequest, type AppointmentRequest, type AppointmentTimeBlock, type DoctorAppointment, type UserAccess, type AdmissionPhysician } from '../lib/api'
import { useFacilities } from '../lib/useFacilities'

interface SchedulingCatalogs {
  departments: Array<{ id: string; name: string }>
  specialties: Array<{ id: string; name: string }>
}

interface ScheduleForm {
  request: AppointmentRequest
  departmentId: string
  physicianId: string
  date: string
  startsAt: string
  endsAt: string
}

function localDateValue(date: Date): string {
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${date.getFullYear()}-${month}-${day}`
}

function dateRange(date: string): { from: string; to: string } {
  const start = new Date(`${date}T00:00:00`)
  const end = new Date(start)
  end.setDate(end.getDate() + 1)
  return { from: start.toISOString(), to: end.toISOString() }
}

function periodValues(period: string): { date: string; start: string; end: string } {
  const match = period.match(/^\[([^,]+),([^)]+)\)$/)
  if (!match) return { date: '', start: '', end: '' }
  const startDate = new Date(match[1])
  const endDate = new Date(match[2])
  return {
    date: Number.isNaN(startDate.getTime()) ? '' : startDate.toLocaleDateString('es-SV', { dateStyle: 'medium' }),
    start: Number.isNaN(startDate.getTime()) ? '' : startDate.toLocaleTimeString('es-SV', { hour: '2-digit', minute: '2-digit' }),
    end: Number.isNaN(endDate.getTime()) ? '' : endDate.toLocaleTimeString('es-SV', { hour: '2-digit', minute: '2-digit' }),
  }
}

function timeFromRange(value: string | null, fallback: string): string {
  return value ? value.slice(0, 5) : fallback
}

function localDateTimeToIso(date: string, time: string): string {
  const value = new Date(`${date}T${time}`)
  if (Number.isNaN(value.getTime())) throw new Error('La fecha y hora seleccionadas no son válidas.')
  return value.toISOString()
}

function statusLabel(status: string): string {
  const labels: Record<string, string> = {
    scheduled: 'Programada',
    confirmed: 'Confirmada',
    arrived: 'Llegó',
    in_progress: 'En atención',
    completed: 'Atendida',
    cancelled: 'Cancelada',
    no_show: 'No asistió',
    pending: 'Pendiente',
  }
  return labels[status] ?? status.replaceAll('_', ' ')
}

export function AppointmentsPage() {
  const { facilities, loading: facilitiesLoading, error: facilitiesError } = useFacilities()
  const [access, setAccess] = useState<UserAccess | null>(null)
  const [accessError, setAccessError] = useState('')
  const [accessLoading, setAccessLoading] = useState(true)
  const [selectedFacilityId, setSelectedFacilityId] = useState('')
  const [todayDate] = useState(() => localDateValue(new Date()))
  const [selectedDate, setSelectedDate] = useState(todayDate)
  const [agenda, setAgenda] = useState<DoctorAppointment[]>([])
  const [requests, setRequests] = useState<AppointmentRequest[]>([])
  const [availability, setAvailability] = useState<AppointmentTimeBlock[]>([])
  const [catalogs, setCatalogs] = useState<SchedulingCatalogs>({ departments: [], specialties: [] })
  const [physicians, setPhysicians] = useState<AdmissionPhysician[]>([])
  const [scheduleForm, setScheduleForm] = useState<ScheduleForm | null>(null)
  const [loading, setLoading] = useState(false)
  const [catalogLoading, setCatalogLoading] = useState(true)
  const [physiciansLoading, setPhysiciansLoading] = useState(false)
  const [availabilityLoading, setAvailabilityLoading] = useState(false)
  const [error, setError] = useState('')
  const [scheduleError, setScheduleError] = useState('')
  const [actionMessage, setActionMessage] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    let active = true
    readMyAccess().then((result) => {
      if (active) setAccess(result)
    }).catch((loadError: unknown) => {
      if (active) setAccessError(loadError instanceof Error ? loadError.message : 'No se pudieron verificar los permisos.')
    }).finally(() => {
      if (active) setAccessLoading(false)
    })
    return () => {
      active = false
    }
  }, [])

  const authorizedFacilities = useMemo(() => facilities.filter((facility) => {
    const roles = access?.roles.filter((role) => role.facilityId === facility.id) ?? []
    const permissions = access?.permissions.filter((permission) => permission.facilityId === facility.id) ?? []
    const doctor = roles.some((role) => role.code === 'doctor')
    const receptionist = roles.some((role) => ['receptionist', 'front_desk', 'reception'].includes(role.code))
      && permissions.some((permission) => permission.code === 'appointments.all')
    return doctor || receptionist
  }), [access, facilities])
  const facilityId = authorizedFacilities.find((facility) => facility.id === selectedFacilityId)?.id
    ?? authorizedFacilities[0]?.id
    ?? ''
  const roles = access?.roles.filter((role) => role.facilityId === facilityId) ?? []
  const permissions = access?.permissions.filter((permission) => permission.facilityId === facilityId) ?? []
  const isDoctor = roles.some((role) => role.code === 'doctor')
  const isReceptionist = !isDoctor && roles.some((role) => ['receptionist', 'front_desk', 'reception'].includes(role.code))
    && permissions.some((permission) => permission.code === 'appointments.all')

  useEffect(() => {
    if (!facilityId || (!isDoctor && !isReceptionist)) return
    let active = true
    const load = isDoctor
      ? readDoctorAppointments(facilityId, dateRange(selectedDate).from, dateRange(selectedDate).to).then((rows) => {
        if (active) setAgenda(rows)
      })
      : readPendingAppointmentRequests(facilityId).then((rows) => {
        if (active) setRequests(rows)
      })
    load.catch((loadError: unknown) => {
      if (active) setError(loadError instanceof Error ? loadError.message : 'No se pudo cargar la agenda.')
    }).finally(() => {
      if (active) setLoading(false)
    })
    return () => {
      active = false
    }
  }, [facilityId, isDoctor, isReceptionist, selectedDate])

  useEffect(() => {
    if (!isReceptionist || !facilityId) return
    let active = true
    Promise.all([
      readPublicView('catalog_departments'),
      readPublicView('catalog_specialties'),
    ]).then(([departmentRows, specialtyRows]) => {
      const departments = departmentRows
        .filter((row) => row.facility_id === facilityId && row.active === true)
        .map((row) => {
          if (typeof row.id !== 'string' || typeof row.name !== 'string') throw new Error('Catálogo de departamentos: registro inválido.')
          return { id: row.id, name: row.name }
        })
      const specialties = specialtyRows.map((row) => {
        if (typeof row.id !== 'string' || typeof row.name !== 'string') throw new Error('Catálogo de especialidades: registro inválido.')
        return { id: row.id, name: row.name }
      })
      if (active) setCatalogs({ departments, specialties })
    }).catch((loadError: unknown) => {
      if (active) setError(loadError instanceof Error ? loadError.message : 'No se pudieron cargar departamentos y especialidades.')
    }).finally(() => {
      if (active) setCatalogLoading(false)
    })
    return () => {
      active = false
    }
  }, [facilityId, isReceptionist])

  useEffect(() => {
    if (!scheduleForm?.departmentId || !facilityId) {
      return
    }
    let active = true
    readAdmissionPhysicians(facilityId, scheduleForm.departmentId).then((rows) => {
      if (active) {
        setPhysicians(rows)
        setScheduleForm((current) => current ? { ...current, physicianId: rows[0]?.id ?? '' } : current)
        if (rows.length === 0) setAvailabilityLoading(false)
      }
    }).catch((loadError: unknown) => {
      if (active) setScheduleError(loadError instanceof Error ? loadError.message : 'No se pudieron cargar los médicos disponibles.')
    }).finally(() => {
      if (active) setPhysiciansLoading(false)
    })
    return () => {
      active = false
    }
  }, [facilityId, scheduleForm?.departmentId])

  useEffect(() => {
    if (!facilityId || !scheduleForm?.physicianId || !scheduleForm.date) {
      return
    }
    let active = true
    readDoctorAvailability(scheduleForm.physicianId, scheduleForm.date).then((blocks) => {
      if (active) setAvailability(blocks)
    }).catch((loadError: unknown) => {
      if (active) setScheduleError(loadError instanceof Error ? loadError.message : 'No se pudo consultar la disponibilidad del médico.')
    }).finally(() => {
      if (active) setAvailabilityLoading(false)
    })
    return () => {
      active = false
    }
  }, [facilityId, scheduleForm?.date, scheduleForm?.physicianId])

  function beginScheduling(request: AppointmentRequest) {
    const departmentId = catalogs.departments[0]?.id ?? ''
    const preferredStart = timeFromRange(request.preferredStart, '09:00')
    const preferredEnd = timeFromRange(request.preferredEnd, '09:30')
    setScheduleError('')
    setPhysicians([])
    setPhysiciansLoading(true)
    setAvailability([])
    setAvailabilityLoading(false)
    setScheduleForm({
      request,
      departmentId,
      physicianId: '',
      date: request.preferredDate,
      startsAt: preferredStart,
      endsAt: preferredEnd,
    })
  }

  async function submitSchedule(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!scheduleForm) return
    setSaving(true)
    setScheduleError('')
    setActionMessage('')
    try {
      const start = new Date(`${scheduleForm.date}T${scheduleForm.startsAt}`).getTime()
      const end = new Date(`${scheduleForm.date}T${scheduleForm.endsAt}`).getTime()
      if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start) {
        throw new Error('La hora de fin debe ser posterior a la hora de inicio.')
      }
      const conflicts = availability.some((block) => {
        const values = block.period.match(/^\[([^,]+),([^)]+)\)$/)
        if (!values) return false
        const busyStart = new Date(values[1]).getTime()
        const busyEnd = new Date(values[2]).getTime()
        return start < busyEnd && end > busyStart
      })
      if (conflicts) throw new Error('El médico ya tiene una cita en ese horario. Selecciona otro intervalo.')
      await scheduleAppointmentRequest({
        requestId: scheduleForm.request.id,
        departmentId: scheduleForm.departmentId,
        physicianId: scheduleForm.physicianId,
        startsAt: localDateTimeToIso(scheduleForm.date, scheduleForm.startsAt),
        endsAt: localDateTimeToIso(scheduleForm.date, scheduleForm.endsAt),
        expectedVersion: scheduleForm.request.rowVersion,
        requestKey: globalThis.crypto.randomUUID(),
      })
      setActionMessage('Cita asignada correctamente. El paciente y el médico podrán verla en sus agendas.')
      setScheduleForm(null)
      setRequests((current) => current.filter((request) => request.id !== scheduleForm.request.id))
    } catch (saveError: unknown) {
      setScheduleError(saveError instanceof Error ? saveError.message : 'No se pudo asignar la cita.')
    } finally {
      setSaving(false)
    }
  }

  async function rejectRequest(request: AppointmentRequest) {
    setSaving(true)
    setError('')
    setActionMessage('')
    try {
      await rejectAppointmentRequest(request.id, request.rowVersion, 'Solicitud no programada por recepción.')
      setRequests((current) => current.filter((item) => item.id !== request.id))
      setActionMessage('Solicitud rechazada.')
    } catch (rejectError: unknown) {
      setError(rejectError instanceof Error ? rejectError.message : 'No se pudo rechazar la solicitud.')
    } finally {
      setSaving(false)
    }
  }

  if (accessLoading || facilitiesLoading) {
    return <p className="rounded-lg bg-white p-5 text-xs text-slate-500" role="status">Cargando permisos y agendas...</p>
  }
  if (accessError || facilitiesError) {
    return <p className="rounded-lg bg-rose-50 p-4 text-xs text-rose-800" role="alert">{accessError || facilitiesError}</p>
  }
  if (!isDoctor && !isReceptionist) {
    return <p className="rounded-lg bg-white p-5 text-xs text-slate-500">Este módulo está disponible para médicos y personal de recepción autorizado.</p>
  }

  return (
    <div className="space-y-4">
      {authorizedFacilities.length > 1 && (
        <FacilityPicker facilities={authorizedFacilities} loading={false} onChange={(id) => {
          setSelectedFacilityId(id)
          setScheduleForm(null)
          setPhysicians([])
          setCatalogs({ departments: [], specialties: [] })
          setCatalogLoading(true)
          setError('')
          setLoading(true)
        }} selectedId={facilityId} />
      )}
      <section className="rounded-xl border border-slate-100 bg-white p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-semibold text-slate-800">{isDoctor ? 'Mi agenda médica' : 'Solicitudes de atención'}</h2>
            <p className="mt-1 text-xs text-slate-500">{isDoctor ? 'Consulta únicamente las citas que te fueron asignadas.' : 'Revisa solicitudes pendientes y asigna las citas desde recepción.'}</p>
          </div>
          {isDoctor && (
            <label className="flex items-center gap-2 rounded-md bg-slate-50 px-3 py-2 text-xs text-slate-600">
              Fecha
              <input aria-label="Fecha de agenda" className="bg-transparent outline-none" min={todayDate} onChange={(event) => {
                setSelectedDate(event.target.value)
                setLoading(true)
                setError('')
              }} type="date" value={selectedDate} />
            </label>
          )}
        </div>
      </section>

      {error && <p className="rounded-lg bg-rose-50 p-3 text-xs text-rose-800" role="alert">{error}</p>}
      {actionMessage && <p className="rounded-lg bg-emerald-50 p-3 text-xs text-emerald-800" role="status">{actionMessage}</p>}
      {loading && <p className="rounded-lg bg-white p-5 text-xs text-slate-500" role="status">Cargando...</p>}

      {isDoctor && !loading && (
        <section className="rounded-xl border border-slate-100 bg-white p-4">
          <h3 className="mb-3 text-xs font-semibold text-slate-800">Citas asignadas</h3>
          {agenda.length === 0 ? <p className="py-6 text-center text-xs text-slate-500">No tienes citas asignadas para esta fecha.</p> : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[650px] text-left text-xs">
                <thead><tr className="border-b border-slate-100 text-slate-500"><th className="pb-3 font-medium">Hora</th><th className="pb-3 font-medium">Paciente</th><th className="pb-3 font-medium">Expediente</th><th className="pb-3 font-medium">Teléfono</th><th className="pb-3 font-medium">Estado</th></tr></thead>
                <tbody className="divide-y divide-slate-50">
                  {agenda.map((appointment) => {
                    const time = periodValues(appointment.period)
                    return <tr key={appointment.id}>
                      <td className="py-3 font-semibold text-[#870b30]">{time.start}{time.end ? ` – ${time.end}` : ''}</td>
                      <td className="py-3 font-medium text-slate-700">{appointment.patientName}</td>
                      <td className="py-3 text-slate-500">{appointment.recordNumber}</td>
                      <td className="py-3 text-slate-500">{appointment.phone || 'No registrado'}</td>
                      <td className="py-3 text-slate-600">{statusLabel(appointment.status)}</td>
                    </tr>
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}

      {isReceptionist && !loading && (
        <section className="rounded-xl border border-slate-100 bg-white p-4">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-xs font-semibold text-slate-800">Pendientes de asignación</h3>
            <span className="rounded-full bg-amber-50 px-2 py-1 text-[10px] font-medium text-amber-800">{requests.length} solicitudes</span>
          </div>
          {catalogLoading && <p className="py-3 text-xs text-slate-500">Cargando departamentos y especialidades...</p>}
          {!requests.length ? <p className="py-6 text-center text-xs text-slate-500">No hay solicitudes pendientes.</p> : (
            <div className="space-y-3">
              {requests.map((request) => (
                <article className="rounded-lg border border-slate-100 bg-slate-50 p-3" key={request.id}>
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-[220px] flex-1">
                      <h4 className="text-sm font-semibold text-slate-800">{request.patientName}</h4>
                      <p className="mt-1 text-xs text-slate-500">Expediente: {request.recordNumber || 'No disponible'} · {request.specialtyName}</p>
                      <p className="mt-2 text-xs leading-relaxed text-slate-700">{request.reason}</p>
                      <p className="mt-2 text-[11px] text-slate-500">Preferencia: {request.preferredDate}{request.preferredStart ? ` · ${request.preferredStart.slice(0, 5)}` : ''}{request.preferredEnd ? `–${request.preferredEnd.slice(0, 5)}` : ''}</p>
                    </div>
                    <div className="flex gap-2">
                      <button className="rounded-md bg-[#870b30] px-3 py-2 text-xs font-medium text-white disabled:opacity-50" disabled={saving || catalogLoading || catalogs.departments.length === 0} onClick={() => beginScheduling(request)} type="button">Asignar cita</button>
                      <button className="rounded-md border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-600 disabled:opacity-50" disabled={saving} onClick={() => void rejectRequest(request)} type="button">Rechazar</button>
                    </div>
                  </div>
                  {scheduleForm?.request.id === request.id && (
                    <form className="mt-4 grid grid-cols-1 gap-3 border-t border-slate-200 pt-4 sm:grid-cols-2 lg:grid-cols-3" onSubmit={(event) => void submitSchedule(event)}>
                      <label className="space-y-1 text-xs font-medium text-slate-700">Departamento
                        <select className="w-full rounded-md border border-slate-200 bg-white px-3 py-2" onChange={(event) => {
                          setPhysicians([])
                          setPhysiciansLoading(true)
                          setAvailability([])
                          setAvailabilityLoading(true)
                          setScheduleError('')
                          setScheduleForm({ ...scheduleForm, departmentId: event.target.value, physicianId: '' })
                        }} required value={scheduleForm.departmentId}>
                          <option value="">Selecciona un departamento</option>
                          {catalogs.departments.map((department) => <option key={department.id} value={department.id}>{department.name}</option>)}
                        </select>
                      </label>
                      <label className="space-y-1 text-xs font-medium text-slate-700">Médico asignado
                        <select className="w-full rounded-md border border-slate-200 bg-white px-3 py-2" disabled={physiciansLoading || physicians.length === 0} onChange={(event) => {
                          setAvailability([])
                          setAvailabilityLoading(true)
                          setScheduleForm({ ...scheduleForm, physicianId: event.target.value })
                        }} required value={scheduleForm.physicianId}>
                          <option value="">{physiciansLoading ? 'Cargando médicos...' : 'Selecciona un médico'}</option>
                          {physicians.map((physician) => <option key={physician.id} value={physician.id}>{physician.name}</option>)}
                        </select>
                      </label>
                      <label className="space-y-1 text-xs font-medium text-slate-700">Fecha
                        <input className="w-full rounded-md border border-slate-200 bg-white px-3 py-2" min={todayDate} onChange={(event) => {
                          setAvailability([])
                          setAvailabilityLoading(Boolean(scheduleForm.physicianId && event.target.value))
                          setScheduleForm({ ...scheduleForm, date: event.target.value })
                        }} required type="date" value={scheduleForm.date} />
                      </label>
                      <label className="space-y-1 text-xs font-medium text-slate-700">Hora de inicio
                        <input className="w-full rounded-md border border-slate-200 bg-white px-3 py-2" onChange={(event) => setScheduleForm({ ...scheduleForm, startsAt: event.target.value })} required type="time" value={scheduleForm.startsAt} />
                      </label>
                      <label className="space-y-1 text-xs font-medium text-slate-700">Hora de fin
                        <input className="w-full rounded-md border border-slate-200 bg-white px-3 py-2" onChange={(event) => setScheduleForm({ ...scheduleForm, endsAt: event.target.value })} required type="time" value={scheduleForm.endsAt} />
                      </label>
                      <div className="rounded-md bg-white p-3 text-xs text-slate-600 sm:col-span-2 lg:col-span-3">
                        <p className="font-semibold text-slate-700">Disponibilidad del médico</p>
                        {availabilityLoading ? <p className="mt-1">Consultando citas existentes...</p> : availability.length === 0
                          ? <p className="mt-1">Sin citas registradas para ese día.</p>
                          : <ul className="mt-1 flex flex-wrap gap-x-4 gap-y-1">
                            {availability.map((block, index) => {
                              const time = periodValues(block.period)
                              return <li key={`${block.period}-${index}`}>{time.start}–{time.end} · {statusLabel(block.status)}</li>
                            })}
                          </ul>}
                      </div>
                      <div className="flex items-end gap-2">
                        <button className="rounded-md bg-[#870b30] px-3 py-2 text-xs font-medium text-white disabled:opacity-50" disabled={saving || physiciansLoading || availabilityLoading || !scheduleForm.physicianId} type="submit">{saving ? 'Asignando...' : 'Confirmar cita'}</button>
                        <button className="rounded-md border border-slate-200 bg-white px-3 py-2 text-xs text-slate-600" onClick={() => setScheduleForm(null)} type="button">Cancelar</button>
                      </div>
                      <p className="text-[11px] text-slate-500 sm:col-span-2 lg:col-span-3">La disponibilidad y los conflictos de horario se validan al confirmar. Esta cita quedará asignada al paciente y al médico seleccionados.</p>
                      {scheduleError && <p className="text-xs text-rose-700 sm:col-span-2 lg:col-span-3" role="alert">{scheduleError}</p>}
                    </form>
                  )}
                </article>
              ))}
            </div>
          )}
        </section>
      )}
    </div>
  )
}
