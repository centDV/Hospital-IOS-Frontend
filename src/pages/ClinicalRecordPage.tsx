import { useEffect, useState } from 'react'
import { Icon } from '../components/Icon'
import {
  createClinicalNote,
  issuePrescription,
  readLaboratoryTests,
  readPatientChart,
  readPrescriptionCatalogs,
  requestLaboratoryStudy,
  type LaboratoryTest,
  type PatientChart,
  type PrescriptionCatalogs,
} from '../lib/api'

const chartSections = [
  { key: 'history', title: 'Consultas y evolución' },
  { key: 'medical_history', title: 'Antecedentes médicos' },
  { key: 'conditions', title: 'Condiciones' },
  { key: 'allergies', title: 'Alergias' },
  { key: 'medications', title: 'Medicamentos' },
  { key: 'vitals', title: 'Signos vitales' },
  { key: 'latest_vitals', title: 'Últimos signos vitales' },
  { key: 'laboratories', title: 'Estudios' },
]

const fieldLabels: Record<string, string> = {
  assessment: 'Evaluación',
  blood_type: 'Tipo de sangre',
  chief_complaint: 'Motivo de consulta',
  conditions: 'Condiciones',
  date: 'Fecha',
  email: 'Correo electrónico',
  ended_at: 'Finalizó',
  family: 'Familiar',
  given_names: 'Nombres',
  history: 'Antecedente',
  instructions: 'Indicaciones',
  kind: 'Tipo',
  label: 'Signo vital',
  medical_history: 'Antecedentes',
  medications: 'Medicamentos',
  narrative: 'Resultado',
  name: 'Analito',
  objective: 'Hallazgos',
  patient_name: 'Paciente',
  period: 'Cita asignada',
  phone: 'Teléfono',
  plan: 'Plan',
  record_number: 'Expediente',
  reference: 'Referencia',
  released_at: 'Fecha de resultado',
  requested_at: 'Fecha de solicitud',
  started_at: 'Fecha de consulta',
  status: 'Estado',
  subjective: 'Síntomas y relato',
  value: 'Resultado',
}

const statusLabels: Record<string, string> = {
  active: 'Activa',
  cancelled: 'Cancelado',
  closed: 'Cerrada',
  completed: 'Completado',
  draft: 'Borrador',
  in_progress: 'En proceso',
  open: 'Abierta',
  ordered: 'Solicitado',
  pending: 'Pendiente',
  resolved: 'Resuelta',
  signed: 'Firmada',
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value)
}

function getLocalDateInputValue(): string {
  const date = new Date()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${date.getFullYear()}-${month}-${day}`
}

function formatLabel(key: string): string {
  return fieldLabels[key] ?? key.replaceAll('_', ' ').replace(/\b\w/g, (letter) => letter.toUpperCase())
}

function formatValue(value: unknown, key = ''): string {
  if (value === null || value === undefined || value === '') return 'No registrado'
  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase()
    if (normalized === 'unknown') return 'No especificado'
    if (key === 'sex' || key === 'administrative_sex') {
      const sexes: Record<string, string> = {
        female: 'Femenino',
        male: 'Masculino',
        intersex: 'Intersexual',
        unknown: 'No especificado',
      }
      if (sexes[normalized]) return sexes[normalized]
    }
    if (key === 'status') return statusLabels[normalized] ?? value.replaceAll('_', ' ')
    if (key === 'kind') {
      const kinds: Record<string, string> = {
        family: 'Familiar',
        personal: 'Personal',
        surgical: 'Quirúrgico',
        medical: 'Médico',
      }
      if (kinds[normalized]) return kinds[normalized]
    }
    if (key.endsWith('_at') || key.endsWith('_on')) {
      const date = /^\d{4}-\d{2}-\d{2}$/.test(value)
        ? new Date(`${value}T12:00:00`)
        : new Date(value)
      if (!Number.isNaN(date.getTime())) {
        return key.endsWith('_at') && value.includes('T')
          ? date.toLocaleString('es-SV', { dateStyle: 'medium', timeStyle: 'short' })
          : date.toLocaleDateString('es-SV', { dateStyle: 'medium' })
      }
    }
    return value
  }
  if (typeof value === 'number' || typeof value === 'boolean') return String(value)
  if (Array.isArray(value)) return value.map((entry) => formatValue(entry)).join(', ')
  if (isRecord(value)) {
    return Object.entries(value)
      .filter(([entryKey, entry]) => !isHiddenField(entryKey) && entry !== null && entry !== undefined && entry !== '')
      .map(([entryKey, entry]) => `${formatLabel(entryKey)}: ${formatValue(entry, entryKey)}`)
      .join(' · ')
  }
  return 'No disponible'
}

function isHiddenField(key: string): boolean {
  return key === 'id' || key.endsWith('_id') || key === 'row_version' || key.endsWith('_version')
}

function getSectionItems(chart: PatientChart, key: string): unknown[] {
  const value = chart[key]
  if (Array.isArray(value)) return value
  if (isRecord(value)) return Object.entries(value).map(([label, entry]) => ({ label: label.replaceAll('_', ' '), value: entry }))
  return []
}

function getItemTitle(item: unknown, sectionKey: string): string {
  if (!isRecord(item)) return ''
  const titleKey = sectionKey === 'history'
    ? 'started_at'
    : ''
  return titleKey && item[titleKey] ? formatValue(item[titleKey], titleKey) : ''
}

function ChartItem({ item, sectionKey }: { item: unknown; sectionKey: string }) {
  if (!isRecord(item)) {
    if (sectionKey === 'medical_history' && typeof item === 'string') {
      const match = item.trim().match(/^([\p{L}\w]+)\s*-\s*(\d{4}-\d{2}-\d{2})\s*-\s*(.+)$/u)
      if (match) {
        return (
          <article className="grid grid-cols-1 gap-3 rounded-lg bg-slate-50 p-3 sm:grid-cols-3">
            <div><p className="text-[11px] font-medium text-slate-500">Tipo</p><p className="mt-1 text-sm text-slate-700">{formatValue(match[1], 'kind')}</p></div>
            <div><p className="text-[11px] font-medium text-slate-500">Fecha</p><p className="mt-1 text-sm text-slate-700">{formatValue(match[2], 'occurred_on')}</p></div>
            <div className="sm:col-span-3"><p className="text-[11px] font-medium text-slate-500">Antecedente</p><p className="mt-1 text-sm leading-relaxed text-slate-700">{match[3]}</p></div>
          </article>
        )
      }
    }
    return <p className="rounded-lg bg-slate-50 p-3 text-sm leading-relaxed text-slate-600">{formatValue(item)}</p>
  }

  if (sectionKey === 'laboratories') {
    const results = Array.isArray(item.values) ? item.values : []
    const details = Object.entries(item).filter(([key, value]) =>
      !isHiddenField(key)
        && !['values', 'test_name'].includes(key)
        && value !== null
        && value !== undefined
        && value !== '',
    )
    return (
      <article className="rounded-lg bg-slate-50 p-3">
        <h4 className="mb-3 text-sm font-semibold text-slate-800">{formatValue(item.test_name, 'test_name')}</h4>
        <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {details.map(([key, value]) => (
            <div className={key === 'instructions' || key === 'narrative' ? 'sm:col-span-2' : ''} key={key}>
              <dt className="block text-[11px] font-semibold text-slate-500">{formatLabel(key)}:</dt>
              <dd className="mt-1 block break-words text-sm leading-relaxed text-slate-700">{formatValue(value, key)}</dd>
            </div>
          ))}
        </dl>
        {results.length > 0 && (
          <div className="mt-3 border-t border-slate-200 pt-3">
            <h5 className="mb-2 text-[11px] font-semibold text-slate-600">Resultados</h5>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {results.map((result, index) => {
                if (!isRecord(result)) {
                  return <p className="rounded-md border border-slate-100 bg-white p-2.5 text-sm text-slate-700" key={`result-${index}`}>{formatValue(result)}</p>
                }
                const resultDetails = Object.entries(result).filter(([key, value]) =>
                  !isHiddenField(key) && value !== null && value !== undefined && value !== '',
                )
                const analyteName = typeof result.name === 'string' ? result.name : 'Resultado'
                return (
                  <dl className="rounded-md border border-slate-100 bg-white p-2.5" key={`result-${index}`}>
                    <dt className="text-xs font-semibold text-slate-800">{analyteName}</dt>
                    {resultDetails.filter(([key]) => key !== 'name').map(([key, value]) => (
                      <div className="mt-2" key={key}>
                        <dd className="break-words text-sm leading-relaxed text-slate-700">
                          <span className="font-medium text-slate-500">{formatLabel(key)}: </span>
                          {formatValue(value, key)}
                        </dd>
                      </div>
                    ))}
                  </dl>
                )
              })}
            </div>
          </div>
        )}
      </article>
    )
  }

  const fields = Object.entries(item).filter(([key, value]) =>
    !isHiddenField(key)
      && !(sectionKey === 'history' && key === 'started_at')
      && value !== null
      && value !== undefined
      && value !== '',
  )
  const title = getItemTitle(item, sectionKey)

  return (
    <article className="rounded-lg bg-slate-50 p-3">
      {title && <h4 className="mb-2 text-sm font-semibold text-slate-800">{title}</h4>}
      <dl className="grid grid-cols-1 gap-x-4 gap-y-2 sm:grid-cols-2">
        {fields.map(([key, value]) => (
          <div className="min-w-0" key={key}>
            <dt className="text-[11px] font-semibold text-slate-500">{formatLabel(key)}</dt>
            <dd className="mt-1 break-words text-sm leading-relaxed text-slate-700">{formatValue(value, key)}</dd>
          </div>
        ))}
      </dl>
    </article>
  )
}

export function ClinicalRecordPage({
  patientId,
  isDoctor,
  onBack,
}: {
  patientId: string | null
  isDoctor: boolean
  onBack: () => void
}) {
  const [response, setResponse] = useState<{ key: string; chart: PatientChart | null; error: string } | null>(null)
  const [refreshVersion, setRefreshVersion] = useState(0)
  const [catalogs, setCatalogs] = useState<PrescriptionCatalogs | null>(null)
  const [catalogError, setCatalogError] = useState('')
  const [showPrescriptionForm, setShowPrescriptionForm] = useState(false)
  const [showObservationForm, setShowObservationForm] = useState(false)
  const [showStudyForm, setShowStudyForm] = useState(false)
  const [prescriptionError, setPrescriptionError] = useState('')
  const [observationError, setObservationError] = useState('')
  const [studyError, setStudyError] = useState('')
  const [prescriptionSuccess, setPrescriptionSuccess] = useState('')
  const [observationSuccess, setObservationSuccess] = useState('')
  const [studySuccess, setStudySuccess] = useState('')
  const [savingPrescription, setSavingPrescription] = useState(false)
  const [savingObservation, setSavingObservation] = useState(false)
  const [savingStudy, setSavingStudy] = useState(false)
  const [laboratoryTests, setLaboratoryTests] = useState<LaboratoryTest[]>([])
  const [studyCatalogError, setStudyCatalogError] = useState('')
  const [study, setStudy] = useState({ testId: '', instructions: '' })
  const [clinicalNote, setClinicalNote] = useState({
    subjective: '',
    objective: '',
    assessment: '',
    plan: '',
  })
  const [prescription, setPrescription] = useState({
    medicationId: '',
    dose: '',
    doseUnitId: '',
    routeId: '',
    intervalHours: '',
    instructions: '',
    startsOn: '',
    endsOn: '',
    quantity: '',
  })
  const responseKey = `${patientId ?? ''}:${isDoctor}`
  const currentResponse = response?.key === responseKey ? response : null
  const chart = currentResponse?.chart ?? null
  const loading = Boolean(patientId) && !currentResponse
  const error = currentResponse?.error ?? ''

  useEffect(() => {
    if (!patientId) return

    let active = true
    readPatientChart(patientId, isDoctor).then((result) => {
      if (active) setResponse({ key: responseKey, chart: result, error: '' })
    }).catch((loadError: unknown) => {
      if (active) setResponse({
        key: responseKey,
        chart: null,
        error: loadError instanceof Error ? loadError.message : 'No se pudo cargar el expediente clínico.',
      })
    })
    return () => {
      active = false
    }
  }, [isDoctor, patientId, responseKey, refreshVersion])

  useEffect(() => {
    if (!isDoctor) return
    let active = true
    Promise.all([readPrescriptionCatalogs(), readLaboratoryTests()]).then(([prescriptionResult, tests]) => {
      if (!active) return
      setCatalogs(prescriptionResult)
      setLaboratoryTests(tests)
      setStudyCatalogError('')
    }).catch((loadError: unknown) => {
      if (!active) return
      const message = loadError instanceof Error ? loadError.message : 'No se pudieron cargar los catálogos clínicos.'
      setCatalogError(message)
      setStudyCatalogError(message)
    })
    return () => {
      active = false
    }
  }, [isDoctor])

  const patient = chart && isRecord(chart.patient) ? chart.patient : null
  const patientName = patient
    ? formatValue(patient.full_name ?? [patient.given_names, patient.family_names].filter((part) => typeof part === 'string').join(' '))
    : ''
  const openEncounter = getSectionItems(chart ?? {}, 'history').find((item) =>
    isRecord(item) && item.status === 'open' && typeof item.id === 'string',
  )

  async function submitPrescription(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!isRecord(openEncounter) || !catalogs) return
    setPrescriptionError('')
    setPrescriptionSuccess('')
    setSavingPrescription(true)
    try {
      await issuePrescription({
        encounterId: String(openEncounter.id),
        medicationId: prescription.medicationId,
        dose: Number(prescription.dose),
        doseUnitId: prescription.doseUnitId,
        routeId: prescription.routeId,
        intervalHours: prescription.intervalHours ? Number(prescription.intervalHours) : null,
        instructions: prescription.instructions.trim(),
        startsOn: prescription.startsOn,
        endsOn: prescription.endsOn || null,
        quantity: prescription.quantity ? Number(prescription.quantity) : null,
        requestKey: globalThis.crypto.randomUUID(),
      })
      setPrescriptionSuccess('Receta emitida correctamente.')
      setShowPrescriptionForm(false)
      setPrescription({ ...prescription, dose: '', instructions: '' })
      setRefreshVersion((version) => version + 1)
    } catch (saveError: unknown) {
      setPrescriptionError(saveError instanceof Error ? saveError.message : 'No se pudo emitir la receta.')
    } finally {
      setSavingPrescription(false)
    }
  }

  async function submitObservation(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!isRecord(openEncounter)) return
    setObservationError('')
    setObservationSuccess('')
    setSavingObservation(true)
    try {
      await createClinicalNote({
        encounterId: String(openEncounter.id),
        subjective: clinicalNote.subjective.trim(),
        objective: clinicalNote.objective.trim(),
        assessment: clinicalNote.assessment.trim(),
        plan: clinicalNote.plan.trim(),
        requestKey: globalThis.crypto.randomUUID(),
      })
      setObservationSuccess('Nota clínica guardada y firmada.')
      setClinicalNote({ subjective: '', objective: '', assessment: '', plan: '' })
      setShowObservationForm(false)
      setRefreshVersion((version) => version + 1)
    } catch (saveError: unknown) {
      setObservationError(saveError instanceof Error ? saveError.message : 'No se pudo guardar la observación.')
    } finally {
      setSavingObservation(false)
    }
  }

  async function submitStudy(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!isRecord(openEncounter)) return
    setStudyError('')
    setStudySuccess('')
    setSavingStudy(true)
    try {
      await requestLaboratoryStudy({
        encounterId: String(openEncounter.id),
        testId: study.testId,
        instructions: study.instructions.trim(),
        requestKey: globalThis.crypto.randomUUID(),
      })
      setStudySuccess('Estudio solicitado correctamente.')
      setStudy({ testId: '', instructions: '' })
      setShowStudyForm(false)
      setRefreshVersion((version) => version + 1)
    } catch (saveError: unknown) {
      setStudyError(saveError instanceof Error ? saveError.message : 'No se pudo solicitar el estudio.')
    } finally {
      setSavingStudy(false)
    }
  }

  return (
    <div className="space-y-4">
      <button className="inline-flex items-center gap-2 text-xs font-medium text-[#870b30] hover:underline" onClick={onBack} type="button">
        <Icon className="rotate-180" name="arrowRight" size={14} /> Volver a pacientes
      </button>
      {loading && <p className="rounded-lg bg-white p-5 text-xs text-slate-500" role="status">Cargando expediente autorizado...</p>}
      {error && <p className="rounded-lg bg-rose-50 p-3 text-xs text-rose-800" role="alert">{error}</p>}
      {!patientId && <p className="rounded-lg bg-white p-5 text-xs text-slate-500">Selecciona un paciente desde el directorio para consultar su expediente.</p>}
      {patient && chart && (
        <>
          <section className="rounded-xl border border-slate-100 bg-white p-4 shadow-[0_2px_10px_rgba(15,23,42,0.025)]">
            <div className="flex flex-wrap items-start gap-4">
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-rose-50 text-sm font-semibold text-[#870b30]">
                {patientName.split(/\s+/).slice(0, 2).map((part) => part[0] ?? '').join('').toUpperCase()}
              </span>
              <div className="min-w-[180px] flex-1">
                <h2 className="text-base font-semibold text-slate-800">{patientName}</h2>
                <p className="mt-1 text-xs text-slate-500">Expediente: {formatValue(patient.record_number ?? patient.medical_record_number)}</p>
                <div className="mt-3 flex flex-wrap gap-x-6 gap-y-2 text-xs">
                  <p><span className="text-slate-400">Nacimiento: </span><span className="text-slate-700">{formatValue(patient.birth_date)}</span></p>
                  <p><span className="text-slate-400">Sexo: </span><span className="text-slate-700">{formatValue(patient.sex ?? patient.administrative_sex, patient.sex !== undefined ? 'sex' : 'administrative_sex')}</span></p>
                  <p><span className="text-slate-400">Teléfono: </span><span className="text-slate-700">{formatValue(patient.phone)}</span></p>
                  <p><span className="text-slate-400">Tipo de sangre: </span><span className="text-slate-700">{formatValue(chart.blood_type ?? chart.blood_group, 'blood_type')}</span></p>
                </div>
              </div>
            </div>
          </section>

          {isDoctor && (
            <section className="rounded-xl border border-slate-100 bg-white p-4 shadow-[0_2px_10px_rgba(15,23,42,0.025)]">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h3 className="text-sm font-semibold text-slate-800">Atención clínica</h3>
                  <p className="mt-1 text-xs text-slate-500">
                    {isRecord(openEncounter) ? 'Puedes documentar la consulta y emitir recetas en la atención abierta.' : 'No hay una atención abierta de este médico para agregar registros. Recepción programa la cita; el registro clínico se habilita al iniciar la atención.'}
                  </p>
                </div>
                {isRecord(openEncounter) && (
                  <div className="flex flex-wrap gap-2">
                    <button className="rounded-md border border-slate-200 px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50" onClick={() => setShowObservationForm((show) => !show)} type="button">Agregar nota clínica</button>
                    <button className="rounded-md bg-[#870b30] px-3 py-2 text-xs font-medium text-white hover:bg-[#6f0826]" onClick={() => {
                      setPrescription((current) => ({ ...current, startsOn: current.startsOn || getLocalDateInputValue() }))
                      setShowPrescriptionForm((show) => !show)
                    }} type="button">Agregar receta</button>
                    <button className="rounded-md border border-slate-200 px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50" onClick={() => setShowStudyForm((show) => !show)} type="button">Solicitar estudio</button>
                  </div>
                )}
              </div>

              {catalogError && <p className="mt-3 rounded-md bg-rose-50 p-2 text-xs text-rose-800" role="alert">{catalogError}</p>}
              {observationSuccess && <p className="mt-3 rounded-md bg-emerald-50 p-2 text-xs text-emerald-800" role="status">{observationSuccess}</p>}
              {prescriptionSuccess && <p className="mt-3 rounded-md bg-emerald-50 p-2 text-xs text-emerald-800" role="status">{prescriptionSuccess}</p>}
              {studyCatalogError && <p className="mt-3 rounded-md bg-rose-50 p-2 text-xs text-rose-800" role="alert">{studyCatalogError}</p>}
              {studySuccess && <p className="mt-3 rounded-md bg-emerald-50 p-2 text-xs text-emerald-800" role="status">{studySuccess}</p>}

              {showObservationForm && isRecord(openEncounter) && (
                <form className="mt-4 space-y-3 border-t border-slate-100 pt-4" onSubmit={(event) => void submitObservation(event)}>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    {([
                      ['subjective', 'Síntomas y relato'],
                      ['objective', 'Hallazgos'],
                      ['assessment', 'Evaluación'],
                      ['plan', 'Plan'],
                    ] as const).map(([field, label]) => (
                      <label className="block text-xs font-medium text-slate-700" htmlFor={`clinical-note-${field}`} key={field}>
                        {label}
                        <textarea
                          className="mt-1.5 min-h-20 w-full rounded-md border border-slate-200 px-3 py-2 text-sm outline-none focus:border-[#870b30]"
                          id={`clinical-note-${field}`}
                          maxLength={10000}
                          onChange={(event) => setClinicalNote((current) => ({ ...current, [field]: event.target.value }))}
                          value={clinicalNote[field]}
                        />
                      </label>
                    ))}
                  </div>
                  {observationError && <p className="text-xs text-rose-700" role="alert">{observationError}</p>}
                  <button className="rounded-md bg-[#870b30] px-3 py-2 text-xs font-medium text-white disabled:opacity-50" disabled={savingObservation} type="submit">{savingObservation ? 'Guardando...' : 'Guardar y firmar nota clínica'}</button>
                </form>
              )}

              {showPrescriptionForm && isRecord(openEncounter) && (
                <form className="mt-4 grid grid-cols-1 gap-3 border-t border-slate-100 pt-4 sm:grid-cols-2" onSubmit={(event) => void submitPrescription(event)}>
                  <label className="space-y-1 text-xs font-medium text-slate-700 sm:col-span-2">Medicamento
                    <select className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm" onChange={(event) => setPrescription({ ...prescription, medicationId: event.target.value })} required value={prescription.medicationId}>
                      <option value="">Selecciona un medicamento</option>
                      {catalogs?.medications.map((medication) => <option key={medication.id} value={medication.id}>{medication.name}{medication.strength ? ` · ${medication.strength}` : ''}</option>)}
                    </select>
                  </label>
                  <label className="space-y-1 text-xs font-medium text-slate-700">Dosis
                    <input className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm" min="0.0001" onChange={(event) => setPrescription({ ...prescription, dose: event.target.value })} required step="any" type="number" value={prescription.dose} />
                  </label>
                  <label className="space-y-1 text-xs font-medium text-slate-700">Unidad de dosis
                    <select className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm" onChange={(event) => setPrescription({ ...prescription, doseUnitId: event.target.value })} required value={prescription.doseUnitId}>
                      <option value="">Selecciona unidad</option>
                      {catalogs?.units.map((unit) => <option key={unit.id} value={unit.id}>{unit.name}</option>)}
                    </select>
                  </label>
                  <label className="space-y-1 text-xs font-medium text-slate-700">Vía de administración
                    <select className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm" onChange={(event) => setPrescription({ ...prescription, routeId: event.target.value })} required value={prescription.routeId}>
                      <option value="">Selecciona vía</option>
                      {catalogs?.routes.map((route) => <option key={route.id} value={route.id}>{route.name}</option>)}
                    </select>
                  </label>
                  <label className="space-y-1 text-xs font-medium text-slate-700">Intervalo (horas)
                    <input className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm" min="0.1" onChange={(event) => setPrescription({ ...prescription, intervalHours: event.target.value })} step="any" type="number" value={prescription.intervalHours} />
                  </label>
                  <label className="space-y-1 text-xs font-medium text-slate-700">Cantidad
                    <input className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm" min="0.0001" onChange={(event) => setPrescription({ ...prescription, quantity: event.target.value })} step="any" type="number" value={prescription.quantity} />
                  </label>
                  <label className="space-y-1 text-xs font-medium text-slate-700">Fecha de inicio
                    <input className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm" onChange={(event) => setPrescription({ ...prescription, startsOn: event.target.value })} required type="date" value={prescription.startsOn} />
                  </label>
                  <label className="space-y-1 text-xs font-medium text-slate-700">Fecha de finalización
                    <input className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm" min={prescription.startsOn} onChange={(event) => setPrescription({ ...prescription, endsOn: event.target.value })} type="date" value={prescription.endsOn} />
                  </label>
                  <label className="space-y-1 text-xs font-medium text-slate-700 sm:col-span-2">Indicaciones
                    <textarea className="min-h-20 w-full rounded-md border border-slate-200 px-3 py-2 text-sm" maxLength={2000} onChange={(event) => setPrescription({ ...prescription, instructions: event.target.value })} required value={prescription.instructions} />
                  </label>
                  {prescriptionError && <p className="text-xs text-rose-700 sm:col-span-2" role="alert">{prescriptionError}</p>}
                  <button className="rounded-md bg-[#870b30] px-3 py-2 text-xs font-medium text-white disabled:opacity-50 sm:col-span-2" disabled={savingPrescription || !catalogs || catalogs.medications.length === 0 || catalogs.units.length === 0 || catalogs.routes.length === 0} type="submit">{savingPrescription ? 'Emitiendo...' : 'Emitir receta'}</button>
                </form>
              )}

              {showStudyForm && isRecord(openEncounter) && (
                <form className="mt-4 grid grid-cols-1 gap-3 border-t border-slate-100 pt-4 sm:grid-cols-2" onSubmit={(event) => void submitStudy(event)}>
                  <label className="space-y-1 text-xs font-medium text-slate-700 sm:col-span-2">Estudio
                    <select className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm" onChange={(event) => setStudy({ ...study, testId: event.target.value })} required value={study.testId}>
                      <option value="">Selecciona un estudio</option>
                      {laboratoryTests.map((test) => <option key={test.id} value={test.id}>{test.name}</option>)}
                    </select>
                  </label>
                  <label className="space-y-1 text-xs font-medium text-slate-700 sm:col-span-2">Indicaciones o pregunta clínica
                    <textarea className="min-h-20 w-full rounded-md border border-slate-200 px-3 py-2 text-sm" maxLength={10000} onChange={(event) => setStudy({ ...study, instructions: event.target.value })} value={study.instructions} />
                  </label>
                  {studyError && <p className="text-xs text-rose-700 sm:col-span-2" role="alert">{studyError}</p>}
                  <button className="rounded-md bg-[#870b30] px-3 py-2 text-xs font-medium text-white disabled:opacity-50 sm:col-span-2" disabled={savingStudy || laboratoryTests.length === 0} type="submit">{savingStudy ? 'Solicitando...' : 'Enviar solicitud de estudio'}</button>
                </form>
              )}
            </section>
          )}

          <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
            {chartSections.map(({ key, title }) => {
              const items = getSectionItems(chart, key)
              if (items.length === 0) return null
              return (
                <section className="rounded-xl border border-slate-100 bg-white p-4 shadow-[0_2px_10px_rgba(15,23,42,0.025)]" key={key}>
                  <h3 className="mb-3 text-xs font-semibold text-slate-800">{title}</h3>
                  <div className="space-y-2">
                    {items.map((item, index) => (
                      <ChartItem item={item} key={`${key}-${index}`} sectionKey={key} />
                    ))}
                  </div>
                </section>
              )
            })}
          </div>
        </>
      )}
    </div>
  )
}
