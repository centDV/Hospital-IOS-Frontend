-- Devuelve las implementaciones internas de tres RPC de solo lectura.
-- No ejecuta funciones ni consulta datos clínicos.
SELECT
  namespace.nspname AS function_schema,
  p.proname AS function_name,
  pg_get_functiondef(p.oid) AS definition
FROM pg_proc AS p
JOIN pg_namespace AS namespace ON namespace.oid = p.pronamespace
WHERE namespace.nspname = 'private'
  AND p.prokind = 'f'
  AND p.proname IN (
    'hospital_overview',
    'laboratory_worklist',
    'list_patients'
  )
ORDER BY p.proname;
