-- Run in the Supabase SQL Editor. The hospital schema remains unexposed to PostgREST.
BEGIN;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM hospital.roles
    WHERE code IN ('receptionist', 'front_desk', 'reception')
  ) THEN
    RAISE EXCEPTION 'No se encontró un rol de recepción en hospital.roles';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM hospital.permissions
    WHERE code = 'appointments.all'
  ) THEN
    RAISE EXCEPTION 'No se encontró el permiso appointments.all en hospital.permissions';
  END IF;
END
$$;

INSERT INTO hospital.role_permissions (role_id, permission_id)
SELECT role.id, permission.id
FROM hospital.roles AS role
CROSS JOIN hospital.permissions AS permission
WHERE role.code IN ('receptionist', 'front_desk', 'reception')
  AND permission.code = 'appointments.all'
  AND NOT EXISTS (
    SELECT 1
    FROM hospital.role_permissions AS existing
    WHERE existing.role_id = role.id
      AND existing.permission_id = permission.id
  );

CREATE OR REPLACE FUNCTION private.register_patient_appointment_request(
  p_facility uuid,
  p_given_names text,
  p_family_names text,
  p_birth_date date,
  p_sex text,
  p_specialty uuid,
  p_reason text,
  p_preferred_date date,
  p_preferred_start time without time zone,
  p_preferred_end time without time zone,
  p_request_key uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
DECLARE
  v_patient jsonb;
  v_patient_id uuid;
  v_request_id uuid;
  v_request_key uuid;
  v_request_operation text;
BEGIN
  IF p_request_key IS NULL OR p_facility IS NULL OR p_specialty IS NULL
      OR p_preferred_date IS NULL OR p_preferred_start IS NULL OR p_preferred_end IS NULL
      OR p_preferred_end <= p_preferred_start
      OR p_preferred_date < current_date
      OR p_reason IS NULL OR length(trim(p_reason)) NOT BETWEEN 1 AND 2000 THEN
    RAISE invalid_parameter_value USING message = 'Datos de paciente o solicitud de cita inválidos';
  END IF;

  IF NOT private.session_active(true)
      OR NOT private.has_permission(p_facility, 'patients.write')
      OR NOT private.has_permission(p_facility, 'appointments.all') THEN
    RAISE insufficient_privilege USING message = 'Se requieren permisos para registrar pacientes y solicitar citas';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM hospital.specialties WHERE id = p_specialty) THEN
    RAISE foreign_key_violation USING message = 'La especialidad seleccionada no existe';
  END IF;

  v_patient := public.register_patient(
    p_facility,
    p_given_names,
    p_family_names,
    p_birth_date,
    p_sex,
    md5(p_request_key::text || ':patient')::uuid
  );
  v_patient_id := (v_patient->>'id')::uuid;
  v_request_key := md5(p_request_key::text || ':appointment-request')::uuid;
  v_request_operation := 'patient_appointment_request:' || md5(jsonb_build_array(
    v_patient_id,
    p_facility,
    p_specialty,
    trim(p_reason),
    p_preferred_date,
    p_preferred_start,
    p_preferred_end
  )::text);

  PERFORM pg_advisory_xact_lock(hashtextextended(
    private.current_profile_id()::text || v_request_key::text,
    0
  ));
  v_request_id := private.idempotency_lookup(v_request_key, v_request_operation);
  IF v_request_id IS NULL THEN
    INSERT INTO hospital.appointment_requests (
      patient_id,
      facility_id,
      specialty_id,
      reason,
      preferred_date,
      preferred_start,
      preferred_end
    )
    VALUES (
      v_patient_id,
      p_facility,
      p_specialty,
      trim(p_reason),
      p_preferred_date,
      p_preferred_start,
      p_preferred_end
    )
    RETURNING id INTO v_request_id;
    PERFORM private.remember_request(v_request_key, v_request_operation, v_request_id);
  END IF;

  RETURN jsonb_build_object(
    'patient_id', v_patient_id,
    'request_id', v_request_id,
    'status', 'pending'
  );
END
$function$;

CREATE OR REPLACE FUNCTION public.register_patient_appointment_request(
  p_facility uuid,
  p_given_names text,
  p_family_names text,
  p_birth_date date,
  p_sex text,
  p_specialty uuid,
  p_reason text,
  p_preferred_date date,
  p_preferred_start time without time zone,
  p_preferred_end time without time zone,
  p_request_key uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
BEGIN
  RETURN private.register_patient_appointment_request(
    p_facility,
    p_given_names,
    p_family_names,
    p_birth_date,
    p_sex,
    p_specialty,
    p_reason,
    p_preferred_date,
    p_preferred_start,
    p_preferred_end,
    p_request_key
  );
EXCEPTION
  WHEN serialization_failure OR deadlock_detected OR unique_violation OR exclusion_violation OR foreign_key_violation THEN
    RAISE SQLSTATE 'PT409' USING MESSAGE = 'Conflicto al registrar paciente o solicitud', DETAIL = SQLSTATE;
  WHEN data_exception OR check_violation OR not_null_violation THEN
    RAISE SQLSTATE 'PT422' USING MESSAGE = 'Datos inválidos para registrar paciente o solicitud', DETAIL = SQLSTATE;
END
$function$;

CREATE OR REPLACE FUNCTION private.list_assignable_physicians(
  p_facility uuid,
  p_department uuid
)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path TO ''
AS $function$
DECLARE
  v_physicians jsonb;
BEGIN
  IF p_facility IS NULL OR p_department IS NULL
      OR private.department_facility(p_department) IS DISTINCT FROM p_facility THEN
    RAISE invalid_parameter_value USING message = 'Departamento inválido para la institución';
  END IF;

  IF NOT private.session_active(true)
      OR (
        NOT private.has_permission(p_facility, 'appointments.all')
        AND NOT private.has_permission(p_facility, 'admissions.write')
      ) THEN
    RAISE insufficient_privilege USING message = 'No autorizado para consultar médicos asignables';
  END IF;

  SELECT COALESCE(jsonb_agg(
    jsonb_build_object(
      'id', physician.id,
      'name', concat_ws(' ', person.given_names, person.family_names)
    )
    ORDER BY person.family_names, person.given_names, physician.id
  ), '[]'::jsonb)
  INTO v_physicians
  FROM hospital.staff_members AS physician
  JOIN hospital.persons AS person ON person.id = physician.person_id
  WHERE physician.active
    AND NULLIF(trim(physician.license_number), '') IS NOT NULL
    AND EXISTS (
      SELECT 1
      FROM hospital.staff_assignments AS assignment
      WHERE assignment.staff_id = physician.id
        AND assignment.department_id = p_department
        AND assignment.valid_during @> now()
    );

  RETURN v_physicians;
END
$function$;

CREATE OR REPLACE FUNCTION public.list_assignable_physicians(
  p_facility uuid,
  p_department uuid
)
RETURNS jsonb
LANGUAGE sql
SECURITY DEFINER
SET search_path TO ''
AS $function$
  SELECT private.list_assignable_physicians(p_facility, p_department)
$function$;

CREATE OR REPLACE FUNCTION private.receptionist_pending_appointment_requests(p_facility uuid)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path TO ''
AS $function$
DECLARE
  v_requests jsonb;
BEGIN
  IF NOT private.session_active(true)
      OR NOT private.has_permission(p_facility, 'appointments.all') THEN
    RAISE insufficient_privilege USING message = 'No autorizado para consultar solicitudes de citas';
  END IF;

  SELECT COALESCE(jsonb_agg(
    jsonb_build_object(
      'id', pending.id,
      'patient_id', pending.patient_id,
      'patient_name', concat_ws(' ', pending.given_names, pending.family_names),
      'record_number', pending.medical_record_number,
      'facility_id', pending.facility_id,
      'specialty_id', pending.specialty_id,
      'specialty_name', pending.specialty_name,
      'reason', pending.reason,
      'preferred_date', pending.preferred_date,
      'preferred_start', pending.preferred_start,
      'preferred_end', pending.preferred_end,
      'row_version', pending.row_version
    )
    ORDER BY pending.created_at
  ), '[]'::jsonb)
  INTO v_requests
  FROM (
    SELECT
      request.id,
      request.patient_id,
      person.given_names,
      person.family_names,
      patient.medical_record_number,
      request.facility_id,
      request.specialty_id,
      specialty.name AS specialty_name,
      request.reason,
      request.preferred_date,
      request.preferred_start,
      request.preferred_end,
      request.row_version,
      request.created_at
    FROM hospital.appointment_requests AS request
    JOIN hospital.patients AS patient ON patient.id = request.patient_id
    JOIN hospital.persons AS person ON person.id = patient.person_id
    JOIN hospital.specialties AS specialty ON specialty.id = request.specialty_id
    WHERE request.facility_id = p_facility
      AND request.status = 'pending'
    ORDER BY request.created_at
    LIMIT 50
  ) AS pending;

  RETURN v_requests;
END
$function$;

CREATE OR REPLACE FUNCTION public.receptionist_pending_appointment_requests(p_facility uuid)
RETURNS jsonb
LANGUAGE sql
SECURITY DEFINER
SET search_path TO ''
AS $function$
  SELECT private.receptionist_pending_appointment_requests(p_facility)
$function$;

CREATE OR REPLACE FUNCTION private.receptionist_doctor_availability(
  p_facility uuid,
  p_physician uuid,
  p_from timestamp with time zone,
  p_to timestamp with time zone
)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path TO ''
AS $function$
DECLARE
  v_availability jsonb;
BEGIN
  IF p_facility IS NULL OR p_physician IS NULL OR p_from IS NULL OR p_to IS NULL OR p_from >= p_to THEN
    RAISE invalid_parameter_value USING message = 'Intervalo de disponibilidad inválido';
  END IF;
  IF p_to > p_from + interval '2 days' THEN
    RAISE invalid_parameter_value USING message = 'El intervalo de disponibilidad no puede superar dos días';
  END IF;
  IF NOT private.session_active(true)
      OR NOT private.has_permission(p_facility, 'appointments.all') THEN
    RAISE insufficient_privilege USING message = 'No autorizado para consultar disponibilidad médica';
  END IF;

  SELECT COALESCE(
    jsonb_agg(
      jsonb_build_object('period', appointment.period::text, 'status', appointment.status)
      ORDER BY lower(appointment.period)
    ),
    '[]'::jsonb
  )
  INTO v_availability
  FROM hospital.appointments AS appointment
  WHERE appointment.facility_id = p_facility
    AND appointment.physician_id = p_physician
    AND appointment.period && tstzrange(p_from, p_to, '[)')
    AND appointment.status <> 'cancelled';

  RETURN v_availability;
END
$function$;

CREATE OR REPLACE FUNCTION public.receptionist_doctor_availability(
  p_facility uuid,
  p_physician uuid,
  p_from timestamp with time zone,
  p_to timestamp with time zone
)
RETURNS jsonb
LANGUAGE sql
SECURITY DEFINER
SET search_path TO ''
AS $function$
  SELECT private.receptionist_doctor_availability(p_facility, p_physician, p_from, p_to)
$function$;

REVOKE ALL ON FUNCTION private.receptionist_pending_appointment_requests(uuid) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION private.receptionist_doctor_availability(uuid, uuid, timestamp with time zone, timestamp with time zone) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION private.list_assignable_physicians(uuid, uuid) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION private.register_patient_appointment_request(uuid, text, text, date, text, uuid, text, date, time without time zone, time without time zone, uuid) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.receptionist_pending_appointment_requests(uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.receptionist_doctor_availability(uuid, uuid, timestamp with time zone, timestamp with time zone) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.list_assignable_physicians(uuid, uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.register_patient_appointment_request(uuid, text, text, date, text, uuid, text, date, time without time zone, time without time zone, uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.receptionist_pending_appointment_requests(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.receptionist_doctor_availability(uuid, uuid, timestamp with time zone, timestamp with time zone) TO authenticated;
GRANT EXECUTE ON FUNCTION public.list_assignable_physicians(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.register_patient_appointment_request(uuid, text, text, date, text, uuid, text, date, time without time zone, time without time zone, uuid) TO authenticated;

COMMIT;
