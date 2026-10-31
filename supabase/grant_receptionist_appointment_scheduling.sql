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

COMMIT;
