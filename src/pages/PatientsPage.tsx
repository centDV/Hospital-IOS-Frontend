import { useEffect, useState, type FormEvent, type ReactNode } from 'react'
import { FacilityPicker } from '../components/FacilityPicker'
import { Icon } from '../components/Icon'
import { Panel } from '../components/ui'
import {
  readAdmissionCatalogs,
  readAdmissionPhysicians,
  readPatients,
  registerAdmission,
  readPublicView,
  registerPatientWithAppointmentRequest,
  getAuthorizationErrorMessage,
  readMyAccess,
  type AdmissionDepartment,
  type AdmissionPhysician,
  type PatientRecord,
  type TriageLevel,
  type UserAccess,
} from '../lib/api'
import { useFacilities } from '../lib/useFacilities'

interface PatientResponse {
  key: string
  records: PatientRecord[]
  error: string
}

const today = new Date().toISOString().slice(0, 10)

function isSex(value: string): value is 'female' | 'male' | 'intersex' | 'unknown' {
  return value === 'female' || value === 'male' || value === 'intersex' || value === 'unknown'
}

function sexLabel(sex: string | null): string {
  if (!sex) return 'No especificado'
  const labels: Record<string, string> = {
    female: 'Femenino',
    intersex: 'Intersexual',
    male: 'Masculino',
    unknown: 'No especificado',
  }
  return labels[sex.trim().toLowerCase()] ?? sex
}

function isAdmissionType(value: string): value is 'emergency' | 'scheduled' | 'observation' {
  return value === 'emergency' || value === 'scheduled' || value === 'observation'
}

function createRequestKey(): string {
  if (!globalThis.crypto?.randomUUID) throw new Error('Este navegador no permite generar una clave segura para el registro.')
  return globalThis.crypto.randomUUID()
}

function Dialog({ title, onClose, children }: { title: string; onClose: () => void; children: ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4" onMouseDown={(event) => {
      if (event.target === event.currentTarget) onClose()
    }}>
      <section aria-labelledby="registration-dialog-title" aria-modal="true" className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-xl bg-white p-5 shadow-xl" role="dialog">
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 className="text-sm font-semibold text-slate-800" id="registration-dialog-title">{title}</h2>
          <button aria-label="Cerrar" className="rounded-md px-2 py-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700" onClick={onClose} type="button">×</button>
        </div>
        {children}
      </section>
    </div>
  )
}

export function PatientsPage({ onViewChart }: { onViewChart: (patientId: string, isDoctor: boolean) => void }) {
  const { facilities, loading: facilitiesLoading, error: facilitiesError } = useFacilities()
  const [selectedFacilityId, setSelectedFacilityId] = useState('')
  const [query, setQuery] = useState('')
  const [cursors, setCursors] = useState<Array<string | null>>([null])
  const [response, setResponse] = useState<PatientResponse | null>(null)
  const [userAccess, setUserAccess] = useState<UserAccess | null>(null)
  const [accessError, setAccessError] = useState('')
  const [accessLoading, setAccessLoading] = useState(true)
  const [reloadToken, setReloadToken] = useState(0)
  const [showPatientForm, setShowPatientForm] = useState(false)
  const [showAdmissionForm, setShowAdmissionForm] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [actionError, setActionError] = useState('')
  const [actionSuccess, setActionSuccess] = useState('')
  const [requestKey, setRequestKey] = useState('')
  const [givenNames, setGivenNames] = useState('')
  const [familyNames, setFamilyNames] = useState('')
  const [birthDate, setBirthDate] = useState('')
  const [sex, setSex] = useState<'female' | 'male' | 'intersex' | 'unknown'>('unknown')
  const [appointmentSpecialties, setAppointmentSpecialties] = useState<Array<{ id: string; name: string }>>([])
  const [appointmentSpecialtiesLoading, setAppointmentSpecialtiesLoading] = useState(false)
  const [appointmentSpecialtiesError, setAppointmentSpecialtiesError] = useState('')
  const [appointmentSpecialtyId, setAppointmentSpecialtyId] = useState('')
  const [appointmentReason, setAppointmentReason] = useState('')
  const [preferredDate, setPreferredDate] = useState(today)
  const [preferredStart, setPreferredStart] = useState('09:00')
  const [preferredEnd, setPreferredEnd] = useState('09:30')
  const [admissionCatalogs, setAdmissionCatalogs] = useState<{ departments: AdmissionDepartment[]; triageLevels: TriageLevel[] }>({ departments: [], triageLevels: [] })
  const [catalogResult, setCatalogResult] = useState<{ facilityId: string; error: string } | null>(null)
  const [selectedPatientId, setSelectedPatientId] = useState('')
  const [selectedDepartmentId, setSelectedDepartmentId] = useState('')
  const [physicianResult, setPhysicianResult] = useState<{ facilityId: string; departmentId: string; rows: AdmissionPhysician[]; error: string } | null>(null)
  const [selectedPhysicianId, setSelectedPhysicianId] = useState('')
  const [admissionType, setAdmissionType] = useState<'emergency' | 'scheduled' | 'observation'>('emergency')
  const [selectedTriageLevelId, setSelectedTriageLevelId] = useState('')
  const facilityId = facilities.find((facility) => facility.id === selectedFacilityId)?.id ?? facilities[0]?.id ?? ''
  const after = cursors[cursors.length - 1]
  const requestKeyForPage = `${facilityId}:${query}:${after ?? 'first'}:${reloadToken}`
  const currentResponse = response?.key === requestKeyForPage ? response : null
  const loading = Boolean(facilityId) && !currentResponse
  const patients = currentResponse?.records ?? []
  const catalogError = catalogResult?.facilityId === facilityId ? catalogResult.error : ''
  const catalogLoading = showAdmissionForm && Boolean(facilityId) && catalogResult?.facilityId !== facilityId
  const currentPhysicianResult = physicianResult?.facilityId === facilityId && physicianResult.departmentId === selectedDepartmentId ? physicianResult : null
  const physicians = currentPhysicianResult?.rows ?? []
  const physiciansLoading = showAdmissionForm && Boolean(selectedDepartmentId) && !currentPhysicianResult
  const physicianError = currentPhysicianResult?.error ?? ''
  const isDoctor = userAccess?.roles.some((role) => role.facilityId === facilityId && role.code === 'doctor') ?? false
  const showWriteActions = !accessLoading && !accessError && !isDoctor

  useEffect(() => {
    let active = true
    readMyAccess().then((access) => {
      if (active) setUserAccess(access)
    }).catch((loadError: unknown) => {
      if (active) setAccessError(loadError instanceof Error ? loadError.message : 'No se pudieron verificar los permisos del usuario.')
    }).finally(() => {
      if (active) setAccessLoading(false)
    })
    return () => {
      active = false
    }
  }, [])

  useEffect(() => {
    if (!facilityId) return
    let active = true
    readPatients(facilityId, query, after).then((records) => {
      if (active) setResponse({ key: requestKeyForPage, records, error: '' })
    }).catch((loadError: unknown) => {
      if (active) setResponse({
        key: requestKeyForPage,
        records: [],
        error: loadError instanceof Error ? loadError.message : 'No se pudo cargar el directorio de pacientes.',
      })
    })
    return () => {
      active = false
    }
  }, [after, facilityId, query, reloadToken, requestKeyForPage])

  useEffect(() => {
    if (!showAdmissionForm || !facilityId) return
    let active = true
    readAdmissionCatalogs(facilityId).then((catalogs) => {
      if (!active) return
      setAdmissionCatalogs(catalogs)
      setSelectedDepartmentId(catalogs.departments[0]?.id ?? '')
      setSelectedTriageLevelId(catalogs.triageLevels[0]?.id ?? '')
      setCatalogResult({ facilityId, error: '' })
    }).catch((loadError: unknown) => {
      if (active) setCatalogResult({
        facilityId,
        error: loadError instanceof Error ? loadError.message : 'No se pudieron cargar departamentos y niveles de triage.',
      })
    })
    return () => {
      active = false
    }
  }, [facilityId, showAdmissionForm])

  useEffect(() => {
    if (!showPatientForm || !facilityId) return
    let active = true
    readPublicView('catalog_specialties').then((rows) => {
      const specialties = rows.map((row) => {
        if (typeof row.id !== 'string' || typeof row.name !== 'string') {
          throw new Error('Catálogo de especialidades: registro inválido.')
        }
        return { id: row.id, name: row.name }
      })
      if (!active) return
      setAppointmentSpecialties(specialties)
      setAppointmentSpecialtyId(specialties[0]?.id ?? '')
    }).catch((loadError: unknown) => {
      if (active) setAppointmentSpecialtiesError(loadError instanceof Error ? loadError.message : 'No se pudieron cargar las especialidades.')
    }).finally(() => {
      if (active) setAppointmentSpecialtiesLoading(false)
    })
    return () => {
      active = false
    }
  }, [facilityId, showPatientForm])

  useEffect(() => {
    if (!showAdmissionForm || !facilityId || !selectedDepartmentId) {
      return
    }
    let active = true
    readAdmissionPhysicians(facilityId, selectedDepartmentId).then((rows) => {
      if (!active) return
      setPhysicianResult({ facilityId, departmentId: selectedDepartmentId, rows, error: '' })
      setSelectedPhysicianId(rows[0]?.id ?? '')
    }).catch((loadError: unknown) => {
      if (active) setPhysicianResult({
        facilityId,
        departmentId: selectedDepartmentId,
        rows: [],
        error: loadError instanceof Error ? loadError.message : 'No se pudieron cargar los médicos.',
      })
    })
    return () => {
      active = false
    }
  }, [facilityId, selectedDepartmentId, showAdmissionForm])

  function updateQuery(value: string) {
    setQuery(value)
    setCursors([null])
    setActionSuccess('')
  }

  function openPatientForm() {
    if (!showWriteActions) return
    setActionError('')
    setActionSuccess('')
    setRequestKey('')
    setAppointmentSpecialtiesLoading(true)
    setAppointmentSpecialtiesError('')
    setShowPatientForm(true)
  }

  function openAdmissionForm(patientId = '') {
    if (!showWriteActions) return
    setActionError('')
    setActionSuccess('')
    setRequestKey('')
    setSelectedPatientId(patientId)
    setShowAdmissionForm(true)
  }

  function closeForms() {
    if (submitting) return
    setShowPatientForm(false)
    setShowAdmissionForm(false)
    setActionError('')
    setRequestKey('')
  }

  async function submitPatient(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!facilityId || !showWriteActions) return
    if (preferredEnd <= preferredStart) {
      setActionError('La hora de fin debe ser posterior a la hora de inicio.')
      return
    }
    setSubmitting(true)
    setActionError('')
    try {
      const key = requestKey || createRequestKey()
      setRequestKey(key)
      await registerPatientWithAppointmentRequest({
        facilityId,
        givenNames: givenNames.trim(),
        familyNames: familyNames.trim(),
        birthDate: birthDate || null,
        sex,
        specialtyId: appointmentSpecialtyId,
        reason: appointmentReason.trim(),
        preferredDate,
        preferredStart,
        preferredEnd,
        requestKey: key,
      })
      setShowPatientForm(false)
      setGivenNames('')
      setFamilyNames('')
      setBirthDate('')
      setSex('unknown')
      setAppointmentReason('')
      setPreferredDate(today)
      setPreferredStart('09:00')
      setPreferredEnd('09:30')
      setRequestKey('')
      setQuery('')
      setCursors([null])
      setReloadToken((current) => current + 1)
      setActionSuccess('Paciente registrado y solicitud agregada a pendientes de asignación.')
    } catch (error) {
      setActionError(getAuthorizationErrorMessage(error, 'patients.write y appointments.all') ?? (error instanceof Error ? error.message : 'No se pudo registrar al paciente y su solicitud.'))
    } finally {
      setSubmitting(false)
    }
  }

  async function submitAdmission(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!showWriteActions || !selectedPatientId || !selectedDepartmentId || !selectedPhysicianId || !selectedTriageLevelId) return
    setSubmitting(true)
    setActionError('')
    try {
      const key = requestKey || createRequestKey()
      setRequestKey(key)
      await registerAdmission({
        patientId: selectedPatientId,
        departmentId: selectedDepartmentId,
        physicianId: selectedPhysicianId,
        admissionType,
        triageLevelId: selectedTriageLevelId,
        requestKey: key,
      })
      setShowAdmissionForm(false)
      setRequestKey('')
      setReloadToken((current) => current + 1)
      setActionSuccess('Ingreso registrado correctamente.')
    } catch (error) {
      setActionError(getAuthorizationErrorMessage(error, 'admissions.write') ?? (error instanceof Error ? error.message : 'No se pudo registrar el ingreso.'))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <>
      <FacilityPicker facilities={facilities} loading={facilitiesLoading} onChange={(id) => {
        setSelectedFacilityId(id)
        setCursors([null])
      }} selectedId={facilityId} />
      {facilitiesError && <p className="mb-4 rounded-lg bg-rose-50 px-3 py-2 text-[10px] text-rose-800" role="alert">{facilitiesError}</p>}
      {!facilitiesLoading && !facilitiesError && facilities.length === 0 && <p className="mb-4 rounded-lg bg-amber-50 px-3 py-2 text-[10px] text-amber-800" role="status">No hay instituciones activas disponibles para esta cuenta.</p>}
      {accessError && <p className="mb-4 rounded-lg bg-rose-50 px-3 py-2 text-[10px] text-rose-800" role="alert">No se pudieron verificar los permisos; las acciones de registro están ocultas. {accessError}</p>}
      {actionSuccess && <p className="mb-4 rounded-lg bg-emerald-50 px-3 py-2 text-[10px] text-emerald-800" role="status">{actionSuccess}</p>}
      <section className="mb-4 rounded-xl border border-slate-100 bg-white p-3 shadow-[0_2px_10px_rgba(15,23,42,0.025)]">
        <div className="flex flex-col gap-2 sm:flex-row">
          <label className="flex flex-1 items-center gap-2 rounded-md bg-slate-50 px-3 py-2 text-slate-400">
            <Icon name="search" size={14} />
            <input
              aria-label="Buscar pacientes"
              className="w-full bg-transparent text-[10px] text-slate-700 outline-none placeholder:text-slate-400"
              onChange={(event) => updateQuery(event.target.value)}
              placeholder="Buscar por nombre o número de expediente..."
              value={query}
            />
          </label>
          {showWriteActions && <>
            <button className="flex items-center justify-center gap-1.5 rounded-md border border-slate-200 px-3 py-2 text-[10px] font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50" disabled={!facilityId || facilitiesLoading} onClick={openPatientForm} type="button"><Icon name="plus" size={13} /> Nuevo paciente</button>
            <button className="flex items-center justify-center gap-1.5 rounded-md bg-[#870b30] px-3 py-2 text-[10px] font-semibold text-white transition hover:bg-[#6f0827] disabled:opacity-50" disabled={!facilityId || facilitiesLoading || patients.length === 0} onClick={() => openAdmissionForm()} type="button"><Icon name="plus" size={13} /> Registrar ingreso</button>
          </>}
        </div>
      </section>
      <Panel title="Directorio de pacientes" subtitle="Resultados autorizados por Supabase para la institución seleccionada">
        {loading && <p className="py-6 text-center text-[10px] text-slate-500" role="status">Cargando pacientes...</p>}
        {currentResponse?.error && <p className="rounded-md bg-rose-50 px-3 py-2 text-[10px] text-rose-800" role="alert">{currentResponse.error}</p>}
        {!loading && !currentResponse?.error && currentResponse && (
          <>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[700px] text-left text-[10px]">
                <thead><tr className="border-b border-slate-100 text-slate-400"><th className="pb-3 font-medium">Expediente</th><th className="pb-3 font-medium">Paciente</th><th className="pb-3 font-medium">Fecha de nacimiento</th><th className="pb-3 font-medium">Sexo administrativo</th><th className="pb-3 font-medium">Acción</th>{showWriteActions && <th className="pb-3 font-medium">Ingreso</th>}</tr></thead>
                <tbody className="divide-y divide-slate-50">
                  {patients.map((patient) => (
                    <tr key={patient.id}>
                      <td className="py-3 font-semibold text-[#870b30]">{patient.medicalRecordNumber}</td>
                      <td className="py-3 font-medium text-slate-700">{patient.givenNames} {patient.familyNames}</td>
                      <td className="py-3 text-slate-500">{patient.birthDate ?? 'No registrado'}</td>
                      <td className="py-3 text-slate-500">{sexLabel(patient.administrativeSex)}</td>
                      <td className="py-3"><button className="font-medium text-[#870b30] hover:underline disabled:opacity-50" disabled={accessLoading || Boolean(accessError)} onClick={() => onViewChart(patient.id, isDoctor)} type="button">Ver expediente</button></td>
                      {showWriteActions && <td className="py-3"><button className="font-medium text-[#870b30] hover:underline" onClick={() => openAdmissionForm(patient.id)} type="button">Registrar ingreso</button></td>}
                    </tr>
                  ))}
                  {patients.length === 0 && <tr><td className="py-8 text-center text-slate-400" colSpan={showWriteActions ? 6 : 5}>No se encontraron pacientes.</td></tr>}
                </tbody>
              </table>
            </div>
            <div className="mt-3 flex items-center justify-between text-[9px] text-slate-400">
              <span>{patients.length} resultados en esta página · Máximo 25</span>
              <div className="flex gap-2">
                <button className="rounded border border-slate-200 px-2 py-1 text-slate-600 disabled:opacity-40" disabled={cursors.length === 1} onClick={() => setCursors((current) => current.slice(0, -1))} type="button">Anterior</button>
                <button className="rounded border border-slate-200 px-2 py-1 text-slate-600 disabled:opacity-40" disabled={patients.length < 25} onClick={() => setCursors((current) => [...current, patients[patients.length - 1].id])} type="button">Siguiente</button>
              </div>
            </div>
          </>
        )}
      </Panel>
      {showWriteActions && showPatientForm && (
        <Dialog onClose={closeForms} title="Registrar paciente y solicitar cita">
          <form className="space-y-3" onSubmit={(event) => void submitPatient(event)}>
            <label className="block text-[10px] text-slate-600">Nombres
              <input autoComplete="given-name" className="mt-1 w-full rounded-md border border-slate-200 px-3 py-2 text-[11px] outline-none focus:border-rose-300" maxLength={100} onChange={(event) => setGivenNames(event.target.value)} required value={givenNames} />
            </label>
            <label className="block text-[10px] text-slate-600">Apellidos
              <input autoComplete="family-name" className="mt-1 w-full rounded-md border border-slate-200 px-3 py-2 text-[11px] outline-none focus:border-rose-300" maxLength={100} onChange={(event) => setFamilyNames(event.target.value)} required value={familyNames} />
            </label>
            <label className="block text-[10px] text-slate-600">Fecha de nacimiento (opcional)
              <input className="mt-1 w-full rounded-md border border-slate-200 px-3 py-2 text-[11px] outline-none focus:border-rose-300" max={today} onChange={(event) => setBirthDate(event.target.value)} type="date" value={birthDate} />
            </label>
            <label className="block text-[10px] text-slate-600">Sexo administrativo
              <select className="mt-1 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-[11px] outline-none focus:border-rose-300" onChange={(event) => {
                if (isSex(event.target.value)) setSex(event.target.value)
              }} value={sex}>
                <option value="unknown">No especificado</option><option value="female">Femenino</option><option value="male">Masculino</option><option value="intersex">Intersexual</option>
              </select>
            </label>
            <div className="border-t border-slate-100 pt-3">
              <p className="mb-2 text-[11px] font-semibold text-slate-700">Solicitud para asignación de cita</p>
              <label className="block text-[10px] text-slate-600">Especialidad
                <select className="mt-1 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-[11px] outline-none focus:border-rose-300" disabled={appointmentSpecialtiesLoading || appointmentSpecialties.length === 0} onChange={(event) => setAppointmentSpecialtyId(event.target.value)} required value={appointmentSpecialtyId}>
                  <option value="">{appointmentSpecialtiesLoading ? 'Cargando especialidades...' : 'Selecciona una especialidad'}</option>
                  {appointmentSpecialties.map((specialty) => <option key={specialty.id} value={specialty.id}>{specialty.name}</option>)}
                </select>
              </label>
              <label className="mt-2 block text-[10px] text-slate-600">Motivo de consulta
                <textarea className="mt-1 w-full resize-y rounded-md border border-slate-200 px-3 py-2 text-[11px] outline-none focus:border-rose-300" maxLength={2000} onChange={(event) => setAppointmentReason(event.target.value)} required rows={3} value={appointmentReason} />
              </label>
              <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-3">
                <label className="text-[10px] text-slate-600">Fecha preferida
                  <input className="mt-1 w-full rounded-md border border-slate-200 px-2 py-2 text-[11px]" min={today} onChange={(event) => setPreferredDate(event.target.value)} required type="date" value={preferredDate} />
                </label>
                <label className="text-[10px] text-slate-600">Desde
                  <input className="mt-1 w-full rounded-md border border-slate-200 px-2 py-2 text-[11px]" onChange={(event) => setPreferredStart(event.target.value)} required type="time" value={preferredStart} />
                </label>
                <label className="text-[10px] text-slate-600">Hasta
                  <input className="mt-1 w-full rounded-md border border-slate-200 px-2 py-2 text-[11px]" onChange={(event) => setPreferredEnd(event.target.value)} required type="time" value={preferredEnd} />
                </label>
              </div>
            </div>
            {appointmentSpecialtiesError && <p className="rounded-md bg-rose-50 px-3 py-2 text-[10px] text-rose-800" role="alert">{appointmentSpecialtiesError}</p>}
            {!appointmentSpecialtiesLoading && !appointmentSpecialtiesError && appointmentSpecialties.length === 0 && <p className="text-[10px] text-amber-700" role="status">No hay especialidades disponibles para crear la solicitud.</p>}
            {actionError && <p className="rounded-md bg-rose-50 px-3 py-2 text-[10px] text-rose-800" role="alert">{actionError}</p>}
            <div className="flex justify-end gap-2 pt-2">
              <button className="rounded-md border border-slate-200 px-3 py-2 text-[10px] text-slate-600 disabled:opacity-50" disabled={submitting} onClick={closeForms} type="button">Cancelar</button>
              <button className="rounded-md bg-[#870b30] px-3 py-2 text-[10px] font-semibold text-white disabled:opacity-50" disabled={submitting || appointmentSpecialtiesLoading || appointmentSpecialties.length === 0} type="submit">{submitting ? 'Guardando...' : 'Registrar y enviar a pendientes'}</button>
            </div>
          </form>
        </Dialog>
      )}
      {showWriteActions && showAdmissionForm && (
        <Dialog onClose={closeForms} title="Registrar ingreso hospitalario">
          <form className="space-y-3" onSubmit={(event) => void submitAdmission(event)}>
            <label className="block text-[10px] text-slate-600">Paciente
              <select className="mt-1 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-[11px] outline-none focus:border-rose-300" onChange={(event) => setSelectedPatientId(event.target.value)} required value={selectedPatientId}>
                <option value="">Selecciona un paciente</option>{patients.map((patient) => <option key={patient.id} value={patient.id}>{patient.medicalRecordNumber} · {patient.givenNames} {patient.familyNames}</option>)}
              </select>
            </label>
            <label className="block text-[10px] text-slate-600">Departamento
              <select className="mt-1 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-[11px] outline-none focus:border-rose-300" disabled={catalogLoading} onChange={(event) => setSelectedDepartmentId(event.target.value)} required value={selectedDepartmentId}>
                <option value="">Selecciona un departamento</option>{admissionCatalogs.departments.map((department) => <option key={department.id} value={department.id}>{department.name}</option>)}
              </select>
            </label>
            <label className="block text-[10px] text-slate-600">Médico responsable
              <select className="mt-1 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-[11px] outline-none focus:border-rose-300" disabled={physiciansLoading || physicians.length === 0} onChange={(event) => setSelectedPhysicianId(event.target.value)} required value={selectedPhysicianId}>
                <option value="">{physiciansLoading ? 'Cargando médicos...' : 'Selecciona un médico'}</option>{physicians.map((physician) => <option key={physician.id} value={physician.id}>{physician.name}</option>)}
              </select>
            </label>
            <label className="block text-[10px] text-slate-600">Tipo de ingreso
              <select className="mt-1 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-[11px] outline-none focus:border-rose-300" onChange={(event) => {
                if (isAdmissionType(event.target.value)) setAdmissionType(event.target.value)
              }} value={admissionType}>
                <option value="emergency">Urgencias</option><option value="scheduled">Programado</option><option value="observation">Observación</option>
              </select>
            </label>
            <label className="block text-[10px] text-slate-600">Prioridad de triage
              <select className="mt-1 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-[11px] outline-none focus:border-rose-300" disabled={catalogLoading} onChange={(event) => setSelectedTriageLevelId(event.target.value)} required value={selectedTriageLevelId}>
                <option value="">Selecciona una prioridad</option>{admissionCatalogs.triageLevels.map((level) => <option key={level.id} value={level.id}>{level.name} ({level.code})</option>)}
              </select>
            </label>
            {catalogLoading && <p className="text-[9px] text-slate-500" role="status">Cargando catálogos...</p>}
            {!catalogLoading && admissionCatalogs.departments.length === 0 && <p className="text-[9px] text-amber-700" role="status">No hay departamentos activos para esta institución.</p>}
            {!catalogLoading && selectedDepartmentId && !physiciansLoading && physicians.length === 0 && <p className="text-[9px] text-amber-700" role="status">No se encontraron médicos habilitados en el departamento seleccionado.</p>}
            {catalogError && <p className="rounded-md bg-rose-50 px-3 py-2 text-[10px] text-rose-800" role="alert">{catalogError}</p>}
            {physicianError && <p className="rounded-md bg-rose-50 px-3 py-2 text-[10px] text-rose-800" role="alert">{physicianError}</p>}
            {actionError && <p className="rounded-md bg-rose-50 px-3 py-2 text-[10px] text-rose-800" role="alert">{actionError}</p>}
            <div className="flex justify-end gap-2 pt-2">
              <button className="rounded-md border border-slate-200 px-3 py-2 text-[10px] text-slate-600 disabled:opacity-50" disabled={submitting} onClick={closeForms} type="button">Cancelar</button>
              <button className="rounded-md bg-[#870b30] px-3 py-2 text-[10px] font-semibold text-white disabled:opacity-50" disabled={submitting || catalogLoading || physiciansLoading || !selectedPatientId || !selectedDepartmentId || !selectedPhysicianId || !selectedTriageLevelId} type="submit">{submitting ? 'Registrando...' : 'Confirmar ingreso'}</button>
            </div>
          </form>
        </Dialog>
      )}
    </>
  )
}
