-- Grants clinical.read to the authenticated physician assigned to a non-cancelled appointment.
-- It does not grant clinical writes; those still require the existing open-encounter checks.
CREATE OR REPLACE FUNCTION private.can_patient(p uuid, permission_code text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO ''
AS $function$
  SELECT
    (
      permission_code IN ('patients.read', 'clinical.read')
      AND EXISTS (
        SELECT 1
        FROM hospital.patient_facility_registrations AS registration
        WHERE registration.patient_id = p
          AND private.has_permission(registration.facility_id, 'clinical.admin.read')
      )
    )
    OR (permission_code = 'patients.read' AND private.own_patient(p))
    OR (
      permission_code = 'clinical.read'
      AND private.own_patient(p)
      AND private.session_active(true)
    )
    OR EXISTS (
      SELECT 1
      FROM hospital.patient_facility_registrations AS registration
      WHERE registration.patient_id = p
        AND private.has_permission(registration.facility_id, permission_code)
        AND (
          permission_code = 'patients.write'
          OR (
            permission_code = 'patients.read'
            AND (
              private.has_permission(registration.facility_id, 'appointments.all')
              OR private.has_permission(registration.facility_id, 'users.write')
              OR (
                private.has_permission(registration.facility_id, 'lab.process')
                AND EXISTS (
                  SELECT 1
                  FROM hospital.diagnostic_orders AS orders
                  JOIN hospital.encounters AS encounters ON encounters.id = orders.encounter_id
                  WHERE encounters.patient_id = p
                    AND private.department_facility(encounters.department_id) = registration.facility_id
                    AND orders.status <> 'draft'
                )
              )
            )
          )
          OR EXISTS (
            SELECT 1
            FROM hospital.care_assignments AS care
            JOIN hospital.departments AS department ON department.id = care.department_id
            WHERE care.patient_id = p
              AND care.staff_id = private.staff_id()
              AND care.valid_during @> now()
              AND department.facility_id = registration.facility_id
          )
        )
    )
    OR (
      permission_code = 'clinical.read'
      AND private.session_active(true)
      AND EXISTS (
        SELECT 1
        FROM hospital.appointments AS appointment
        JOIN hospital.departments AS department
          ON department.id = appointment.department_id
        WHERE appointment.patient_id = p
          AND appointment.physician_id = private.staff_id()
          AND department.facility_id IS NOT NULL
          AND appointment.status IN ('scheduled', 'confirmed', 'arrived', 'in_progress')
          AND appointment.period && tstzrange(now(), NULL, '[)')
      )
    );
$function$;
