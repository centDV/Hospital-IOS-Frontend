-- Devuelve contratos, definiciones y restricciones; no ejecuta RPC ni consulta filas clínicas.
WITH function_metadata AS (
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
    AND p.proname IN ('list_staff', 'register_admission', 'register_patient')
),
column_metadata AS (
  SELECT
    table_name,
    column_name,
    data_type,
    udt_name,
    is_nullable
  FROM information_schema.columns
  WHERE table_schema = 'hospital'
    AND (
      (table_name = 'persons' AND column_name IN ('given_names', 'family_names', 'birth_date', 'administrative_sex'))
      OR (table_name = 'admissions' AND column_name = 'admission_type')
    )
),
constraint_metadata AS (
  SELECT
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
  WHERE table_constraint.constraint_schema = 'hospital'
    AND table_constraint.constraint_type = 'CHECK'
    AND table_constraint.table_name IN ('persons', 'admissions')
)
SELECT jsonb_pretty(jsonb_build_object(
  'functions', COALESCE((
    SELECT jsonb_agg(to_jsonb(function_metadata) ORDER BY function_schema, function_name, arguments)
    FROM function_metadata
  ), '[]'::jsonb),
  'columns', COALESCE((
    SELECT jsonb_agg(to_jsonb(column_metadata) ORDER BY table_name, column_name)
    FROM column_metadata
  ), '[]'::jsonb),
  'constraints', COALESCE((
    SELECT jsonb_agg(to_jsonb(constraint_metadata) ORDER BY table_name, constraint_name)
    FROM constraint_metadata
  ), '[]'::jsonb)
));
