-- Solo inspecciona contratos, definiciones, columnas, restricciones y políticas de acceso.
-- No consulta usuarios, asignaciones ni datos clínicos y no modifica permisos.
WITH functions AS (
  SELECT
    namespace.nspname AS function_schema,
    p.proname AS function_name,
    pg_get_function_arguments(p.oid) AS arguments,
    pg_get_function_result(p.oid) AS return_type,
    p.prosecdef AS security_definer,
    has_function_privilege('authenticated', p.oid, 'EXECUTE') AS authenticated_can_execute,
    pg_get_functiondef(p.oid) AS definition
  FROM pg_proc AS p
  JOIN pg_namespace AS namespace ON namespace.oid = p.pronamespace
  WHERE namespace.nspname IN ('public', 'private')
    AND p.prokind = 'f'
    AND p.proname IN (
      'access_roles',
      'bootstrap_administrator',
      'has_permission',
      'my_access',
      'set_user_roles'
    )
),
access_tables AS (
  SELECT DISTINCT table_schema, table_name
  FROM information_schema.columns
  WHERE table_schema IN ('hospital', 'private')
    AND (
      table_name ILIKE '%role%'
      OR table_name ILIKE '%permission%'
      OR table_name ILIKE '%access%'
    )
),
columns AS (
  SELECT
    column_metadata.table_schema,
    column_metadata.table_name,
    column_metadata.column_name,
    column_metadata.data_type,
    column_metadata.udt_name,
    column_metadata.is_nullable
  FROM information_schema.columns AS column_metadata
  JOIN access_tables
    ON access_tables.table_schema = column_metadata.table_schema
    AND access_tables.table_name = column_metadata.table_name
),
constraints AS (
  SELECT
    table_constraint.constraint_schema AS table_schema,
    table_constraint.table_name,
    table_constraint.constraint_name,
    pg_get_constraintdef(constraint_row.oid) AS definition
  FROM information_schema.table_constraints AS table_constraint
  JOIN pg_namespace AS namespace ON namespace.nspname = table_constraint.constraint_schema
  JOIN pg_class AS relation
    ON relation.relnamespace = namespace.oid
    AND relation.relname = table_constraint.table_name
  JOIN pg_constraint AS constraint_row
    ON constraint_row.conrelid = relation.oid
    AND constraint_row.conname = table_constraint.constraint_name
  JOIN access_tables
    ON access_tables.table_schema = table_constraint.constraint_schema
    AND access_tables.table_name = table_constraint.table_name
),
policies AS (
  SELECT
    namespace.nspname AS table_schema,
    relation.relname AS table_name,
    policy.polname AS policy_name,
    policy.polcmd AS command,
    policy.polroles::regrole[] AS roles,
    pg_get_expr(policy.polqual, policy.polrelid) AS using_expression,
    pg_get_expr(policy.polwithcheck, policy.polrelid) AS check_expression
  FROM pg_policy AS policy
  JOIN pg_class AS relation ON relation.oid = policy.polrelid
  JOIN pg_namespace AS namespace ON namespace.oid = relation.relnamespace
  JOIN access_tables
    ON access_tables.table_schema = namespace.nspname
    AND access_tables.table_name = relation.relname
)
SELECT jsonb_pretty(jsonb_build_object(
  'functions', COALESCE((
    SELECT jsonb_agg(to_jsonb(functions) ORDER BY function_schema, function_name, arguments)
    FROM functions
  ), '[]'::jsonb),
  'columns', COALESCE((
    SELECT jsonb_agg(to_jsonb(columns) ORDER BY table_schema, table_name, column_name)
    FROM columns
  ), '[]'::jsonb),
  'constraints', COALESCE((
    SELECT jsonb_agg(to_jsonb(constraints) ORDER BY table_schema, table_name, constraint_name)
    FROM constraints
  ), '[]'::jsonb),
  'policies', COALESCE((
    SELECT jsonb_agg(to_jsonb(policies) ORDER BY table_schema, table_name, policy_name)
    FROM policies
  ), '[]'::jsonb)
));

-- Muestra qué permisos concede cada rol, sin incluir asignaciones de usuarios.
SELECT
  role.id AS role_id,
  role.code AS role_code,
  role.name AS role_name,
  COALESCE(
    jsonb_agg(permission.code ORDER BY permission.code)
      FILTER (WHERE permission.id IS NOT NULL),
    '[]'::jsonb
  ) AS permissions
FROM hospital.roles AS role
LEFT JOIN hospital.role_permissions AS role_permission ON role_permission.role_id = role.id
LEFT JOIN hospital.permissions AS permission ON permission.id = role_permission.permission_id
GROUP BY role.id, role.code, role.name
ORDER BY role.name;
