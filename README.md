# Hospital Universitario

Panel web desarrollado con React, TypeScript, Vite y Tailwind CSS.

## Desarrollo local

1. Instala dependencias con `npm install`.
2. Copia `.env.example` a `.env.local`.
3. Configura `VITE_SUPABASE_URL` y `VITE_SUPABASE_PUBLISHABLE_KEY` con los datos del proyecto Supabase.
4. Inicia Vite con `npm run dev`.

La aplicación inicia sesión y permite crear cuentas mediante Supabase Auth. Crear una cuenta no le asigna roles ni permisos; un administrador debe autorizarlos por institución. `src/lib/api.ts` centraliza lecturas de catálogos públicos y RPC. Están conectados el resumen general, el directorio de pacientes, el registro de pacientes e ingresos y la lista de laboratorio; los demás módulos todavía muestran datos de demostración. Las RPC usan la sesión autenticada y las autorizaciones definidas en la base de datos. No se debe exponer una clave `service_role` en el cliente.

## Esquema de la API

Las pantallas conectadas consultan `hospital_overview`, `list_patients`, `register_patient`, `register_admission`, `list_staff` y `laboratory_worklist`, que delegan en funciones privadas con autorización en la base de datos. Los catálogos de instituciones, departamentos y niveles de triage se leen desde vistas `public` con `security_invoker`.

El Data API no expone directamente el esquema `hospital`; las pantallas no necesitan acceso directo a sus tablas. Mantén ese esquema fuera de los esquemas expuestos por PostgREST y usa únicamente RPC/vistas con permisos revisados y políticas RLS adecuadas.

Los archivos `supabase/inspect_schema.sql`, `supabase/inspect_api_contract.sql` y `supabase/inspect_rpc_definitions.sql` contienen consultas de metadatos para revisar RLS, permisos, contratos e implementaciones de RPC. No leen filas clínicas.

## Validación

- `npm run build`
- `npm run lint`
