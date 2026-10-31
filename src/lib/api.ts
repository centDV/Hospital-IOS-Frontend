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
  profileId: string | null
  roles: Array<{ facilityId: string; code: string }>
  permissions: Array<{ facilityId: string; code: string }>
}

export type PatientChart = Record<string, unknown>

export interface AppointmentRequest {
  id: string
  patientId: string
  patientName: string
  recordNumber: string | null
  facilityId: string
  specialtyId: string
  specialtyName: string
  reason: string
  preferredDate: string
  preferredStart: string | null
  preferredEnd: string | null
  rowVersion: number
}

export interface DoctorAppointment {
  id: string
  patientId: string
  patientName: string
  recordNumber: string
  phone: string | null
  period: string
  status: string
  encounterId: string | null
}

export interface AppointmentTimeBlock {
  period: string
  status: string
}

export interface ManagedUser {
  id: string
  email: string
  givenNames: string
  familyNames: string
  status: string
  roles: Array<{ id: string; code: string; name: string }>
}

export interface SystemRole {
  id: string
  code: string
  name: string
}

export interface PrescriptionCatalogs {
  medications: Array<{ id: string; name: string; strength: string | null }>
  units: Array<{ id: string; name: string }>
  routes: Array<{ id: string; name: string }>
}

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
    profileId: isRecord(data.profile) && typeof data.profile.id === 'string' ? data.profile.id : null,
    roles: data.roles.map((value) => {
      if (!isRecord(value)) throw new Error('Permisos del usuario: rol con formato inválido.')
      return {
        facilityId: requiredString(value, 'facility_id', 'Permisos del usuario'),
        code: requiredString(value, 'code', 'Permisos del usuario'),
      }
    }),
    permissions: parseRows(data.permissions, 'Permisos del usuario', (value) => ({
      facilityId: requiredString(value, 'facility_id', 'Permisos del usuario'),
      code: requiredString(value, 'code', 'Permisos del usuario'),
    })),
  }
}

export async function readPendingAppointmentRequests(facilityId: string): Promise<AppointmentRequest[]> {
  if (!supabase) throw new Error('Supabase no está configurado. Revisa las variables de entorno.')
  const { data, error } = await supabase.schema('hospital').from('appointment_requests')
    .select('id,patient_id,facility_id,specialty_id,reason,preferred_date,preferred_start,preferred_end,row_version,patients(medical_record_number,persons(given_names,family_names)),specialties(name)')
    .eq('facility_id', facilityId)
    .eq('status', 'pending')
    .order('created_at', { ascending: true })
    .limit(50)
  if (error) throw error
  return parseRows(data, 'Solicitudes de atención', (row) => {
    const patient = Array.isArray(row.patients) ? row.patients[0] : row.patients
    const person = isRecord(patient) ? (Array.isArray(patient.persons) ? patient.persons[0] : patient.persons) : null
    const specialty = Array.isArray(row.specialties) ? row.specialties[0] : row.specialties
    const patientName = isRecord(person)
      ? `${requiredString(person, 'given_names', 'Solicitudes de atención')} ${requiredString(person, 'family_names', 'Solicitudes de atención')}`.trim()
      : ''
    return {
      id: requiredString(row, 'id', 'Solicitudes de atención'),
      patientId: requiredString(row, 'patient_id', 'Solicitudes de atención'),
      patientName: patientName || 'Paciente',
      recordNumber: isRecord(patient) && typeof patient.medical_record_number === 'string' ? patient.medical_record_number : null,
      facilityId: requiredString(row, 'facility_id', 'Solicitudes de atención'),
      specialtyId: requiredString(row, 'specialty_id', 'Solicitudes de atención'),
      specialtyName: isRecord(specialty) && typeof specialty.name === 'string' ? specialty.name : 'Especialidad no disponible',
      reason: requiredString(row, 'reason', 'Solicitudes de atención'),
      preferredDate: requiredString(row, 'preferred_date', 'Solicitudes de atención'),
      preferredStart: optionalString(row, 'preferred_start', 'Solicitudes de atención'),
      preferredEnd: optionalString(row, 'preferred_end', 'Solicitudes de atención'),
      rowVersion: requiredNumber(row, 'row_version', 'Solicitudes de atención'),
    }
  })
}

export async function readDoctorAppointments(facilityId: string, from: string, to: string): Promise<DoctorAppointment[]> {
  if (!supabase) throw new Error('Supabase no está configurado. Revisa las variables de entorno.')
  const { data, error } = await supabase.rpc('doctor_workspace', {
    p_facility: facilityId,
    p_from: from,
    p_to: to,
  })
  if (error) throw error
  if (!isRecord(data)) throw new Error('Agenda médica: respuesta con formato inválido.')
  return parseRows(data.appointments, 'Agenda médica', (row) => ({
    id: requiredString(row, 'id', 'Agenda médica'),
    patientId: requiredString(row, 'patient_id', 'Agenda médica'),
    patientName: requiredString(row, 'patient_name', 'Agenda médica'),
    recordNumber: requiredString(row, 'record_number', 'Agenda médica'),
    phone: optionalString(row, 'phone', 'Agenda médica'),
    period: requiredString(row, 'period', 'Agenda médica'),
    status: requiredString(row, 'status', 'Agenda médica'),
    encounterId: optionalString(row, 'encounter_id', 'Agenda médica'),
  }))
}

export async function readDoctorAvailability(physicianId: string, date: string): Promise<AppointmentTimeBlock[]> {
  if (!supabase) throw new Error('Supabase no está configurado. Revisa las variables de entorno.')
  const start = new Date(`${date}T00:00:00`)
  if (Number.isNaN(start.getTime())) throw new Error('La fecha seleccionada para consultar disponibilidad no es válida.')
  const end = new Date(start)
  end.setDate(end.getDate() + 1)
  const from = start.toISOString()
  const to = end.toISOString()
  const { data, error } = await supabase.schema('hospital').from('appointments')
    .select('period,status')
    .eq('physician_id', physicianId)
    .filter('period', 'ov', `[${from},${to})`)
  if (error) throw error
  return parseRows(data, 'Disponibilidad médica', (row) => ({
    period: requiredString(row, 'period', 'Disponibilidad médica'),
    status: requiredString(row, 'status', 'Disponibilidad médica'),
  })).filter((block) => block.status !== 'cancelled')
}

export async function scheduleAppointmentRequest(input: {
  requestId: string
  departmentId: string
  physicianId: string
  startsAt: string
  endsAt: string
  expectedVersion: number
  requestKey: string
}): Promise<void> {
  if (!supabase) throw new Error('Supabase no está configurado. Revisa las variables de entorno.')
  const { data, error } = await supabase.rpc('schedule_appointment_request', {
    p_id: input.requestId,
    p_department: input.departmentId,
    p_physician: input.physicianId,
    p_starts_at: input.startsAt,
    p_ends_at: input.endsAt,
    p_room: null,
    p_expected_version: input.expectedVersion,
    p_request_key: input.requestKey,
  })
  if (error) throw error
  if (!isRecord(data) || typeof data.appointment_id !== 'string') {
    throw new Error('La programación no devolvió un identificador de cita válido.')
  }
}

export async function searchManagedUsers(
  facilityId: string,
  query: string,
  after: string | null = null,
): Promise<{ users: ManagedUser[]; after: string | null }> {
  if (!supabase) throw new Error('Supabase no está configurado. Revisa las variables de entorno.')
  const { data, error } = await supabase.rpc('search_users', {
    p_facility: facilityId,
    p_filters: query.trim() ? { query: query.trim() } : {},
    p_limit: 50,
    p_after: after,
  })
  if (error) throw error
  if (!isRecord(data) || !Array.isArray(data.data)) {
    throw new Error('Directorio de usuarios: respuesta con formato inválido.')
  }
  const users = parseRows(data.data, 'Directorio de usuarios', (row) => ({
    id: requiredString(row, 'id', 'Directorio de usuarios'),
    email: optionalString(row, 'email', 'Directorio de usuarios') ?? '',
    givenNames: optionalString(row, 'given_names', 'Directorio de usuarios') ?? '',
    familyNames: optionalString(row, 'family_names', 'Directorio de usuarios') ?? '',
    status: requiredString(row, 'status', 'Directorio de usuarios'),
    roles: parseRows(row.roles, 'Roles del usuario', (role) => ({
      id: requiredString(role, 'id', 'Roles del usuario'),
      code: requiredString(role, 'code', 'Roles del usuario'),
      name: requiredString(role, 'name', 'Roles del usuario'),
    })),
  }))
  return {
    users,
    after: typeof data.after === 'string' ? data.after : null,
  }
}

export async function readSystemRoles(facilityId: string): Promise<SystemRole[]> {
  if (!supabase) throw new Error('Supabase no está configurado. Revisa las variables de entorno.')
  const { data, error } = await supabase.rpc('access_roles', { p_facility: facilityId })
  if (error) throw error
  return parseRows(data, 'Roles del sistema', (row) => ({
    id: requiredString(row, 'id', 'Roles del sistema'),
    code: requiredString(row, 'code', 'Roles del sistema'),
    name: requiredString(row, 'name', 'Roles del sistema'),
  }))
}

export async function setUserRoles(profileId: string, facilityId: string, roleIds: string[]): Promise<void> {
  if (!supabase) throw new Error('Supabase no está configurado. Revisa las variables de entorno.')
  const { error } = await supabase.rpc('set_user_roles', {
    p_profile: profileId,
    p_facility: facilityId,
    p_roles: roleIds,
  })
  if (error) throw error
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

export async function readPrescriptionCatalogs(): Promise<PrescriptionCatalogs> {
  const [medicationRows, unitRows, routeRows] = await Promise.all([
    readPublicView('catalog_medications'),
    readPublicView('catalog_units'),
    readPublicView('catalog_administration_routes'),
  ])
  return {
    medications: parseRows(medicationRows, 'Medicamentos', (row) => {
      if (typeof row.active !== 'boolean') throw new Error('Medicamentos: campo "active" inválido.')
      const strength = row.strength
      if (strength !== null && strength !== undefined && typeof strength !== 'string'
        && (typeof strength !== 'number' || !Number.isFinite(strength))) {
        throw new Error('Medicamentos: campo "strength" inválido.')
      }
      return {
        id: requiredString(row, 'id', 'Medicamentos'),
        name: requiredString(row, 'generic_name', 'Medicamentos'),
        strength: strength === null || strength === undefined ? null : String(strength),
        active: row.active,
      }
    }).filter((medication) => medication.active),
    units: parseRows(unitRows, 'Unidades', (row) => ({
      id: requiredString(row, 'id', 'Unidades'),
      name: requiredString(row, 'name', 'Unidades'),
    })),
    routes: parseRows(routeRows, 'Vías de administración', (row) => ({
      id: requiredString(row, 'id', 'Vías de administración'),
      name: requiredString(row, 'name', 'Vías de administración'),
    })),
  }
}

export async function issuePrescription(input: {
  encounterId: string
  medicationId: string
  dose: number
  doseUnitId: string
  routeId: string
  intervalHours: number | null
  instructions: string
  startsOn: string
  endsOn: string | null
  quantity: number | null
  requestKey: string
}): Promise<void> {
  if (!supabase) throw new Error('Supabase no está configurado. Revisa las variables de entorno.')
  const { data, error } = await supabase.rpc('mobile_issue_prescription', {
    p_encounter: input.encounterId,
    p_request_key: input.requestKey,
    p_items: [{
      medication_id: input.medicationId,
      dose: input.dose,
      dose_unit_id: input.doseUnitId,
      route_id: input.routeId,
      interval_hours: input.intervalHours,
      instructions: input.instructions,
      starts_on: input.startsOn,
      ends_on: input.endsOn,
      quantity: input.quantity,
    }],
  })
  if (error) throw error
  if (!isRecord(data) || typeof data.id !== 'string') {
    throw new Error('La receta no devolvió un identificador válido.')
  }
}

export async function createClinicalObservation(input: {
  encounterId: string
  observation: string
  requestKey: string
}): Promise<void> {
  if (!supabase) throw new Error('Supabase no está configurado. Revisa las variables de entorno.')
  const { data: note, error: createError } = await supabase.rpc('create_record', {
    p_resource: 'clinical_notes',
    p_values: {
      encounter_id: input.encounterId,
      kind: 'consultation',
      objective: input.observation,
    },
    p_request_key: input.requestKey,
  })
  if (createError) throw createError
  if (!isRecord(note) || typeof note.id !== 'string' || typeof note.row_version !== 'number') {
    throw new Error('La observación no devolvió los datos de versión esperados.')
  }
  const { error: signError } = await supabase.rpc('finalize_clinical_record', {
    p_resource: 'clinical_notes',
    p_id: note.id,
    p_action: 'sign',
    p_expected_version: note.row_version,
  })
  if (signError) throw signError
}

export async function rejectAppointmentRequest(requestId: string, expectedVersion: number, reason: string): Promise<void> {
  if (!supabase) throw new Error('Supabase no está configurado. Revisa las variables de entorno.')
  const { data, error } = await supabase.rpc('resolve_appointment_request', {
    p_id: requestId,
    p_status: 'rejected',
    p_appointment: null,
    p_reason: reason.trim() || null,
    p_expected_version: expectedVersion,
  })
  if (error) throw error
  if (!isRecord(data) || data.status !== 'rejected') {
    throw new Error('La solicitud no confirmó el rechazo.')
  }
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
