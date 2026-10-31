import type { Page } from '../types'

const endpointConnectedPages = new Set<Page>([
  'Resumen general',
  'Pacientes e ingresos',
  'Expediente Clínico',
])

export function isEndpointConnectedPage(page: Page): boolean {
  return endpointConnectedPages.has(page)
}
