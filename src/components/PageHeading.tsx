import { Icon } from './Icon'
import type { Page } from '../types'

export function PageHeading({ page }: { page: Page }) {
  const descriptions: Record<Page, string> = {
    'Resumen general': 'Vista general de la operación hospitalaria, pacientes, personal y servicios.',
    'Usuarios y roles': 'Administra los usuarios, sus permisos y accesos al sistema.',
    'Pacientes e ingresos': 'Controla ingresos, hospitalización y seguimiento de pacientes.',
    'Expediente Clínico': 'Consulta y gestiona el historial clínico integral del paciente.',
    'Citas y Turnos': 'Gestiona la programación de consultas y los turnos de atención.',
    'Habitaciones y Camas': 'Controla la ocupación, disponibilidad y asignación de camas hospitalarias.',
    'Turnos del Personal': 'Planifica horarios, cobertura y disponibilidad del personal hospitalario.',
    'Laboratorio': 'Gestiona órdenes de laboratorio, muestras y resultados clínicos.',
    'Inventario y Recursos': 'Controla suministros médicos, equipos y niveles de existencias.',
    'Ambulancia': 'Monitorea la unidad hospitalaria, su disponibilidad y los despachos de emergencia.',
    'Reportes y Analítica': 'Indicadores estratégicos, estadísticas clínicas y reportes de gestión hospitalaria.',
    'Configuración': 'Personaliza el sistema, protege la información y gestiona preferencias institucionales.',
  }
  return (
    <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
      <div>
        <div className="mb-1 flex items-center gap-2 text-[10px] text-slate-400">
          <span>Administración</span><Icon name="chevron" size={11} /><span>{page}</span>
        </div>
        <h1 className="text-xl font-bold tracking-tight text-[#870b30] sm:text-2xl">{page}</h1>
        <p className="mt-1 text-xs text-slate-500">{descriptions[page]}</p>
      </div>
      <div className="hidden items-center gap-2 text-[10px] text-slate-400 sm:flex">
        <span className="h-2 w-2 rounded-full bg-emerald-500" /> Sistema operativo
      </div>
    </div>
  )
}
