import { supabase } from './supabase'

export interface Facility {
  id: string
  name: string
  active: boolean
}

export interface PatientRecord {
  id: string
  medicalRecordNumber: string
  givenNames: string
  familyNames: string
  birthDate: string | null
  administrativeSex: string | null
  archivedAt: string | null
}

export interface AdmissionDepartment {
  id: string
  name: string
}

export interface TriageLevel {
  id: string
  code: string
  name: string
  priority: number
}

export interface AdmissionPhysician {
  id: string
  name: string
}

export interface HospitalInformation {
  id: string
  category: string
  title: string
  body: string
  publishedAt: string
  expiresAt: string | null
}

export interface OnDutyStaff {
  name: string
  specialty: string
  department: string
  startsAt: string
  endsAt: string
}

export interface HospitalOverview {
  asOf: string
  capacity: number
  occupied: number
  information: HospitalInformation[]
  onDuty: OnDutyStaff[]
}

export interface UserAccess {
  roles: Array<{ facilityId: string; code: string }>
}

export type PatientChart = Record<string, unknown>

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value)
}

function requiredString(row: Record<string, unknown>, key: string, context: string): string {
  const value = row[key]
  if (typeof value !== 'string') throw new Error(`${context}: campo "${key}" inválido.`)
  return value
}

function optionalString(row: Record<string, unknown>, key: string, context: string): string | null {
  const value = row[key]
  if (value !== null && typeof value !== 'string') throw new Error(`${context}: campo "${key}" inválido.`)
  return value
}

function requiredNumber(row: Record<string, unknown>, key: string, context: string): number {
  const value = row[key]
  if (typeof value !== 'number' || !Number.isFinite(value)) throw new Error(`${context}: campo "${key}" inválido.`)
  return value
}

export function getAuthorizationErrorMessage(error: unknown, permission: string): string | null {
  if (!isRecord(error) || error.code !== '42501') return null
  return `Supabase rechazó la operación por permisos insuficientes. Verifica que tu usuario tenga "${permission}" asignado para la institución seleccionada.`
}

function parseRows<T>(data: unknown, context: string, parse: (row: Record<string, unknown>) => T): T[] {
  if (!Array.isArray(data)) throw new Error(`${context}: se esperaba una lista.`)
  return data.map((value) => {
    if (!isRecord(value)) throw new Error(`${context}: registro con formato inválido.`)
    return parse(value)
  })
}

export async function readFacilities(): Promise<Facility[]> {
  const rows = await readPublicView('catalog_facilities')
  return parseRows(rows, 'Catálogo de instituciones', (row) => {
    if (typeof row.active !== 'boolean') throw new Error('Catálogo de instituciones: campo "active" inválido.')
    return {
      id: requiredString(row, 'id', 'Catálogo de instituciones'),
      name: requiredString(row, 'name', 'Catálogo de instituciones'),
      active: row.active,
    }
  }).filter((facility) => facility.active)
}

export async function readMyAccess(): Promise<UserAccess> {
  if (!supabase) throw new Error('Supabase no está configurado. Revisa las variables de entorno.')
  const { data, error } = await supabase.rpc('my_access')
  if (error) throw error
  if (!isRecord(data) || !Array.isArray(data.roles)) {
    throw new Error('Permisos del usuario: respuesta con formato inválido.')
  }
  return {
    roles: data.roles.map((value) => {
      if (!isRecord(value)) throw new Error('Permisos del usuario: rol con formato inválido.')
      return {
        facilityId: requiredString(value, 'facility_id', 'Permisos del usuario'),
        code: requiredString(value, 'code', 'Permisos del usuario'),
      }
    }),
  }
}

export async function readPatientChart(patientId: string, isDoctor: boolean): Promise<PatientChart> {
  if (!supabase) throw new Error('Supabase no está configurado. Revisa las variables de entorno.')
  const { data, error } = isDoctor
    ? await supabase.rpc('doctor_chart', {
      p_patient: patientId,
      p_from: null,
      p_to: null,
      p_query: '',
    })
    : await supabase.rpc('patient_chart', { p_patient: patientId })
  if (error) throw error
  if (!isRecord(data) || !isRecord(data.patient)) {
    throw new Error('Expediente clínico: respuesta con formato inválido.')
  }
  return data
}

export async function readPatients(facilityId: string, query: string, after: string | null): Promise<PatientRecord[]> {
  if (!supabase) throw new Error('Supabase no está configurado. Revisa las variables de entorno.')
  const { data, error } = await supabase.rpc('list_patients', {
    p_facility: facilityId,
    p_query: query,
    p_archived: false,
    p_limit: 25,
    p_after: after,
  })
  if (error) throw error
  return parseRows(data, 'Directorio de pacientes', (row) => ({
    id: requiredString(row, 'id', 'Directorio de pacientes'),
    medicalRecordNumber: requiredString(row, 'medical_record_number', 'Directorio de pacientes'),
    givenNames: requiredString(row, 'given_names', 'Directorio de pacientes'),
    familyNames: requiredString(row, 'family_names', 'Directorio de pacientes'),
    birthDate: optionalString(row, 'birth_date', 'Directorio de pacientes'),
    administrativeSex: optionalString(row, 'administrative_sex', 'Directorio de pacientes'),
    archivedAt: optionalString(row, 'archived_at', 'Directorio de pacientes'),
  }))
}

export async function readAdmissionCatalogs(facilityId: string): Promise<{ departments: AdmissionDepartment[]; triageLevels: TriageLevel[] }> {
  const [departmentRows, triageRows] = await Promise.all([
    readPublicView('catalog_departments'),
    readPublicView('catalog_triage_levels'),
  ])
  const departments = parseRows(departmentRows, 'Departamentos', (row) => {
    if (typeof row.active !== 'boolean') throw new Error('Departamentos: campo "active" inválido.')
    return {
      id: requiredString(row, 'id', 'Departamentos'),
      facilityId: requiredString(row, 'facility_id', 'Departamentos'),
      name: requiredString(row, 'name', 'Departamentos'),
      active: row.active,
    }
  }).filter((department) => department.active && department.facilityId === facilityId)
  const triageLevels = parseRows(triageRows, 'Niveles de triage', (row) => ({
    id: requiredString(row, 'id', 'Niveles de triage'),
    code: requiredString(row, 'code', 'Niveles de triage'),
    name: requiredString(row, 'name', 'Niveles de triage'),
    priority: requiredNumber(row, 'priority', 'Niveles de triage'),
  })).sort((left, right) => left.priority - right.priority)
  return { departments, triageLevels }
}

export async function readAdmissionPhysicians(facilityId: string, departmentId: string): Promise<AdmissionPhysician[]> {
  if (!supabase) throw new Error('Supabase no está configurado. Revisa las variables de entorno.')
  const { data, error } = await supabase.rpc('list_staff', {
    p_facility: facilityId,
    p_query: '',
    p_active: true,
    p_department: departmentId,
    p_limit: 100,
    p_after: null,
  })
  if (error) throw error
  const staff = parseRows(data, 'Médicos asignados', (row) => {
    if (!Array.isArray(row.assignments)) throw new Error('Médicos asignados: campo "assignments" inválido.')
    return {
      id: requiredString(row, 'id', 'Médicos asignados'),
      name: `${requiredString(row, 'given_names', 'Médicos asignados')} ${requiredString(row, 'family_names', 'Médicos asignados')}`,
      licensed: typeof row.license_number === 'string' && row.license_number.trim().length > 0,
      assigned: row.assignments.some((assignment) =>
        isRecord(assignment) && assignment.department_id === departmentId,
      ),
    }
  })
  return staff.filter((physician) => physician.licensed && physician.assigned && physician.name.trim().length > 0)
    .map(({ id, name }) => ({ id, name }))
}

export async function registerPatient(input: {
  facilityId: string
  givenNames: string
  familyNames: string
  birthDate: string | null
  sex: 'female' | 'male' | 'intersex' | 'unknown'
  requestKey: string
}): Promise<void> {
  if (!supabase) throw new Error('Supabase no está configurado. Revisa las variables de entorno.')
  const { data, error } = await supabase.rpc('register_patient', {
    p_facility: input.facilityId,
    p_given_names: input.givenNames,
    p_family_names: input.familyNames,
    p_birth_date: input.birthDate,
    p_sex: input.sex,
    p_request_key: input.requestKey,
  })
  if (error) throw error
  if (!isRecord(data) || typeof data.id !== 'string') {
    throw new Error('El registro de paciente no devolvió un identificador válido.')
  }
}

export async function registerAdmission(input: {
  patientId: string
  departmentId: string
  physicianId: string
  admissionType: 'emergency' | 'scheduled' | 'observation'
  triageLevelId: string
  requestKey: string
}): Promise<void> {
  if (!supabase) throw new Error('Supabase no está configurado. Revisa las variables de entorno.')
  const { data, error } = await supabase.rpc('register_admission', {
    p_patient: input.patientId,
    p_department: input.departmentId,
    p_physician: input.physicianId,
    p_type: input.admissionType,
    p_priority: input.triageLevelId,
    p_request_key: input.requestKey,
  })
  if (error) throw error
  if (!isRecord(data) || typeof data.id !== 'string') {
    throw new Error('El registro de ingreso no devolvió un identificador válido.')
  }
}

export async function readHospitalOverview(facilityId: string): Promise<HospitalOverview> {
  if (!supabase) throw new Error('Supabase no está configurado. Revisa las variables de entorno.')
  const { data, error } = await supabase.rpc('hospital_overview', { p_facility: facilityId })
  if (error) throw error
  if (!isRecord(data)) throw new Error('Resumen hospitalario: respuesta con formato inválido.')
  const context = 'Resumen hospitalario'
  return {
    asOf: requiredString(data, 'as_of', context),
    capacity: requiredNumber(data, 'capacity', context),
    occupied: requiredNumber(data, 'occupied', context),
    information: parseRows(data.information, 'Avisos institucionales', (row) => ({
      id: requiredString(row, 'id', 'Avisos institucionales'),
      category: requiredString(row, 'category', 'Avisos institucionales'),
      title: requiredString(row, 'title', 'Avisos institucionales'),
      body: requiredString(row, 'body', 'Avisos institucionales'),
      publishedAt: requiredString(row, 'published_at', 'Avisos institucionales'),
      expiresAt: optionalString(row, 'expires_at', 'Avisos institucionales'),
    })),
    onDuty: parseRows(data.on_duty, 'Personal de turno', (row) => ({
      name: requiredString(row, 'name', 'Personal de turno'),
      specialty: requiredString(row, 'specialty', 'Personal de turno'),
      department: requiredString(row, 'department', 'Personal de turno'),
      startsAt: requiredString(row, 'starts_at', 'Personal de turno'),
      endsAt: requiredString(row, 'ends_at', 'Personal de turno'),
    })),
  }
}

export async function readPublicView(viewName: string): Promise<Record<string, unknown>[]> {
  if (!supabase) {
    throw new Error('Supabase no está configurado. Revisa las variables de entorno.')
  }

  const { data, error } = await supabase.schema('public').from(viewName).select('*')
  if (error) throw error
  if (!Array.isArray(data)) {
    throw new Error(`La vista pública "${viewName}" no devolvió una lista de registros.`)
  }

  return data.map((row: unknown) => {
    if (!isRecord(row)) {
      throw new Error(`La vista pública "${viewName}" devolvió un registro con formato inválido.`)
    }
    return row
  })
}
