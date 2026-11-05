-- Returns the agenda RPC implementation only; does not read appointment or patient rows.
SELECT
  namespace.nspname AS function_schema,
  procedure.proname AS function_name,
  pg_get_function_arguments(procedure.oid) AS arguments,
  pg_get_functiondef(procedure.oid) AS definition
FROM pg_proc AS procedure
JOIN pg_namespace AS namespace ON namespace.oid = procedure.pronamespace
WHERE procedure.prokind = 'f'
  AND procedure.proname = 'doctor_workspace'
  AND namespace.nspname IN ('public', 'private')
ORDER BY namespace.nspname;
