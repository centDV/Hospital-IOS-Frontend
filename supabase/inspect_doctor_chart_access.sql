-- Inspects chart RPC implementations and their authorization helpers.
-- Returns function definitions only; it does not read patient records.
SELECT
  namespace.nspname AS function_schema,
  procedure.proname AS function_name,
  pg_get_function_arguments(procedure.oid) AS arguments,
  pg_get_functiondef(procedure.oid) AS definition
FROM pg_proc AS procedure
JOIN pg_namespace AS namespace ON namespace.oid = procedure.pronamespace
WHERE procedure.prokind = 'f'
  AND (
    (namespace.nspname IN ('public', 'private')
      AND procedure.proname IN ('doctor_chart', 'patient_chart'))
    OR (namespace.nspname = 'private'
      AND procedure.proname IN (
        'can_encounter',
        'can_patient',
        'has_permission',
        'session_active'
      ))
  )
ORDER BY namespace.nspname, procedure.proname, arguments;
