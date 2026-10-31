-- Solo devuelve firmas de RPC, permisos y columnas de vistas públicas.
-- No ejecuta funciones ni consulta datos clínicos.
SELECT
  routine.routine_name AS function_name,
  pg_get_function_arguments(p.oid) AS arguments,
  pg_get_function_result(p.oid) AS return_type,
  p.prosecdef AS security_definer,
  has_function_privilege('anon', p.oid, 'EXECUTE') AS anon_can_execute,
  has_function_privilege('authenticated', p.oid, 'EXECUTE') AS authenticated_can_execute
FROM information_schema.routines AS routine
JOIN pg_namespace AS namespace ON namespace.nspname = routine.routine_schema
JOIN pg_proc AS p
  ON p.pronamespace = namespace.oid
  AND p.proname = routine.routine_name
WHERE routine.routine_schema = 'public'
  AND p.prokind = 'f'
  AND routine.routine_name IN (
    'access_roles',
    'ambulance_history',
    'doctor_chart',
    'doctor_workspace',
    'hospital_overview',
    'laboratory_worklist',
    'list_admissions',
    'list_patients',
    'list_staff',
    'list_users',
    'my_profile',
    'operational_dashboard',
    'patient_chart',
    'read_resource',
    'search_admissions',
    'search_patients'
  )
ORDER BY routine.routine_name, arguments;

SELECT
  view_columns.table_name AS view_name,
  string_agg(
    format('%I %s', view_columns.column_name, view_columns.data_type),
    ', ' ORDER BY view_columns.ordinal_position
  ) AS columns,
  COALESCE(relation.reloptions @> ARRAY['security_invoker=true'], false) AS security_invoker
FROM information_schema.columns AS view_columns
JOIN pg_namespace AS namespace
  ON namespace.nspname = view_columns.table_schema
JOIN pg_class AS relation
  ON relation.relnamespace = namespace.oid
  AND relation.relname = view_columns.table_name
WHERE view_columns.table_schema = 'public'
  AND view_columns.table_name IN (
    'catalog_administration_routes',
    'catalog_allergens',
    'catalog_analytes',
    'catalog_departments',
    'catalog_diagnosis_codes',
    'catalog_facilities',
    'catalog_lab_reference_ranges',
    'catalog_medications',
    'catalog_notification_topics',
    'catalog_product_categories',
    'catalog_products',
    'catalog_room_types',
    'catalog_shift_templates',
    'catalog_specialties',
    'catalog_test_analytes',
    'catalog_test_definitions',
    'catalog_triage_levels',
    'catalog_units',
    'information'
  )
GROUP BY view_columns.table_name, relation.reloptions
ORDER BY view_columns.table_name;
