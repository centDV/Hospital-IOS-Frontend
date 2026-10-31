-- Devuelve solo metadatos de seguridad y objetos API, nunca filas de pacientes.
WITH hospital_tables AS (
  SELECT
    namespace.nspname AS schema_name,
    relation.relname AS table_name,
    relation.relrowsecurity AS rls_enabled,
    relation.relforcerowsecurity AS rls_forced,
    jsonb_build_object(
      'anon', jsonb_build_object(
        'select', has_table_privilege('anon', relation.oid, 'SELECT'),
        'insert', has_table_privilege('anon', relation.oid, 'INSERT'),
        'update', has_table_privilege('anon', relation.oid, 'UPDATE'),
        'delete', has_table_privilege('anon', relation.oid, 'DELETE')
      ),
      'authenticated', jsonb_build_object(
        'select', has_table_privilege('authenticated', relation.oid, 'SELECT'),
        'insert', has_table_privilege('authenticated', relation.oid, 'INSERT'),
        'update', has_table_privilege('authenticated', relation.oid, 'UPDATE'),
        'delete', has_table_privilege('authenticated', relation.oid, 'DELETE')
      )
    ) AS privileges,
    COALESCE((
      SELECT jsonb_agg(
        jsonb_build_object(
          'name', pol.polname,
          'command', CASE pol.polcmd
            WHEN 'r' THEN 'SELECT'
            WHEN 'a' THEN 'INSERT'
            WHEN 'w' THEN 'UPDATE'
            WHEN 'd' THEN 'DELETE'
            ELSE 'ALL'
          END,
          'roles', (
            SELECT jsonb_agg(grantee_role.rolname ORDER BY grantee_role.rolname)
            FROM unnest(pol.polroles) AS policy_role(role_oid)
            JOIN pg_roles AS grantee_role ON grantee_role.oid = policy_role.role_oid
          ),
          'using', pg_get_expr(pol.polqual, pol.polrelid),
          'check', pg_get_expr(pol.polwithcheck, pol.polrelid)
        )
        ORDER BY pol.polname
      )
      FROM pg_policy AS pol
      WHERE pol.polrelid = relation.oid
    ), '[]'::jsonb) AS policies
  FROM pg_class AS relation
  JOIN pg_namespace AS namespace ON namespace.oid = relation.relnamespace
  WHERE namespace.nspname = 'hospital'
    AND relation.relkind IN ('r', 'p')
)
SELECT jsonb_pretty(jsonb_build_object(
  'hospital_schema_usage', jsonb_build_object(
    'anon', has_schema_privilege('anon', 'hospital', 'USAGE'),
    'authenticated', has_schema_privilege('authenticated', 'hospital', 'USAGE')
  ),
  'hospital_tables', COALESCE((
    SELECT jsonb_agg(
      jsonb_build_object(
        'table', table_name,
        'rls_enabled', rls_enabled,
        'rls_forced', rls_forced,
        'privileges', privileges,
        'policies', policies
      )
      ORDER BY table_name
    )
    FROM hospital_tables
  ), '[]'::jsonb),
  'public_views', COALESCE((
    SELECT jsonb_agg(table_name ORDER BY table_name)
    FROM information_schema.views
    WHERE table_schema = 'public'
  ), '[]'::jsonb),
  'public_functions', COALESCE((
    SELECT jsonb_agg(function_name ORDER BY function_name)
    FROM (
      SELECT DISTINCT routine_name AS function_name
      FROM information_schema.routines
      WHERE routine_schema = 'public'
    ) AS public_routines
  ), '[]'::jsonb)
));
