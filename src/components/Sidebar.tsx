import { Icon } from './Icon'
import { isEndpointConnectedPage } from '../lib/pageAvailability'
import type { Page, IconName } from '../types'

const navigation: { label: Page; icon: IconName }[] = [
  { label: 'Resumen general', icon: 'grid' },
  { label: 'Usuarios y roles', icon: 'users' },
  { label: 'Pacientes e ingresos', icon: 'patient' },
  { label: 'Expediente Clínico', icon: 'file' },
  { label: 'Citas y Turnos', icon: 'calendar' },
  { label: 'Habitaciones y Camas', icon: 'bed' },
  { label: 'Turnos del Personal', icon: 'clock' },
  { label: 'Inventario y Recursos', icon: 'box' },
  { label: 'Ambulancia', icon: 'activity' },
  { label: 'Reportes y Analítica', icon: 'arrow' },
  { label: 'Configuración', icon: 'more' },
]

export function Sidebar({
  page,
  onNavigate,
  showUnconnectedModules,
}: {
  page: Page
  onNavigate: (nextPage: Page) => void
  showUnconnectedModules: boolean
}) {
  const visibleNavigation = navigation.filter((item) =>
    showUnconnectedModules || isEndpointConnectedPage(item.label),
  )

  return (
    <aside className="flex w-full shrink-0 flex-col bg-[#800b2c] text-white md:sticky md:top-0 md:h-screen md:w-[230px]">
      <div className="flex min-h-[88px] flex-col items-center justify-center gap-1 border-b border-white/10 px-3 py-3 text-center">
        <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/10">
          <Icon name="plus" size={20} />
        </span>
        <div>
          <p className="text-xs font-semibold leading-tight">Hospital Universitario</p>
          <p className="mt-0.5 text-[9px] text-white/60">San Gabriel</p>
        </div>
      </div>
      <nav aria-label="Navegación principal" className="flex gap-1 overflow-x-auto p-3 md:flex-1 md:flex-col md:overflow-visible">
        <p className="hidden px-3 pb-2 pt-3 text-[9px] font-semibold uppercase tracking-[0.14em] text-white/40 md:block">Menú principal</p>
        {visibleNavigation.map((item) => (
          <button
            aria-current={page === item.label ? 'page' : undefined}
            className={`flex min-w-max items-center gap-3 rounded-lg px-3 py-2.5 text-left text-xs transition-colors ${
              page === item.label
                ? 'bg-white font-semibold text-[#800b2c]'
                : 'text-white/75 hover:bg-white/10 hover:text-white'
            }`}
            key={item.label}
            onClick={() => onNavigate(item.label)}
            type="button"
          >
            <Icon name={item.icon} size={15} />
            {item.label}
          </button>
        ))}
      </nav>
      <div className="hidden border-t border-white/10 p-4 text-[10px] leading-relaxed text-white/45 md:block">
        <p>© 2024 Hospital Universitario</p>
        <p>Información protegida por permisos</p>
      </div>
    </aside>
  )
}
