import type { Page } from '../types'

const endpointConnectedPages = new Set<Page>([
  'Resumen general',
  'Usuarios y roles',
  'Pacientes e ingresos',
  'Expediente Clínico',
  'Citas y Turnos',
])

export function isEndpointConnectedPage(page: Page): boolean {
  return endpointConnectedPages.has(page)
}
