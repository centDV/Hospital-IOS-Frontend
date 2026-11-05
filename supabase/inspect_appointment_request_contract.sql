-- Inspects the appointment-request write contract without reading patient data.
SELECT jsonb_pretty(jsonb_build_object(
  'columns', COALESCE((
    SELECT jsonb_agg(jsonb_build_object(
      'column', column_metadata.column_name,
      'type', column_metadata.data_type,
      'nullable', column_metadata.is_nullable,
      'default', column_metadata.column_default
    ) ORDER BY column_metadata.ordinal_position)
    FROM information_schema.columns AS column_metadata
    WHERE column_metadata.table_schema = 'hospital'
      AND column_metadata.table_name = 'appointment_requests'
  ), '[]'::jsonb),
  'constraints', COALESCE((
    SELECT jsonb_agg(jsonb_build_object(
      'name', table_constraint.constraint_name,
      'type', table_constraint.constraint_type,
      'definition', pg_get_constraintdef(constraint_row.oid)
    ) ORDER BY table_constraint.constraint_name)
    FROM information_schema.table_constraints AS table_constraint
    JOIN pg_namespace AS namespace ON namespace.nspname = table_constraint.constraint_schema
    JOIN pg_class AS relation
      ON relation.relnamespace = namespace.oid
      AND relation.relname = table_constraint.table_name
    JOIN pg_constraint AS constraint_row
      ON constraint_row.conrelid = relation.oid
      AND constraint_row.conname = table_constraint.constraint_name
    WHERE table_constraint.constraint_schema = 'hospital'
      AND table_constraint.table_name = 'appointment_requests'
  ), '[]'::jsonb),
  'triggers', COALESCE((
    SELECT jsonb_agg(jsonb_build_object(
      'name', trigger_row.tgname,
      'definition', pg_get_triggerdef(trigger_row.oid)
    ) ORDER BY trigger_row.tgname)
    FROM pg_trigger AS trigger_row
    JOIN pg_class AS relation ON relation.oid = trigger_row.tgrelid
    JOIN pg_namespace AS namespace ON namespace.oid = relation.relnamespace
    WHERE namespace.nspname = 'hospital'
      AND relation.relname = 'appointment_requests'
      AND NOT trigger_row.tgisinternal
  ), '[]'::jsonb),
  'functions', COALESCE((
    SELECT jsonb_agg(jsonb_build_object(
      'schema', namespace.nspname,
      'name', procedure.proname,
      'arguments', pg_get_function_arguments(procedure.oid),
      'definition', pg_get_functiondef(procedure.oid)
    ) ORDER BY namespace.nspname, procedure.proname)
    FROM pg_proc AS procedure
    JOIN pg_namespace AS namespace ON namespace.oid = procedure.pronamespace
    WHERE namespace.nspname IN ('public', 'private')
      AND procedure.prokind = 'f'
      AND procedure.proname ILIKE '%appointment%request%'
  ), '[]'::jsonb)
));
