import { lazy, Suspense, useState } from 'react'
import type { Session } from '@supabase/supabase-js'
import { AuthGate } from './components/AuthGate'
import { Sidebar } from './components/Sidebar'
import { Topbar } from './components/Topbar'
import { PageHeading } from './components/PageHeading'
import type { Page } from './types'

const GeneralDashboard = lazy(() => import('./pages/GeneralDashboard').then(({ GeneralDashboard }) => ({ default: GeneralDashboard })))
const UsersPage = lazy(() => import('./pages/UsersPage').then(({ UsersPage }) => ({ default: UsersPage })))
const PatientsPage = lazy(() => import('./pages/PatientsPage').then(({ PatientsPage }) => ({ default: PatientsPage })))
const ClinicalRecordPage = lazy(() => import('./pages/ClinicalRecordPage').then(({ ClinicalRecordPage }) => ({ default: ClinicalRecordPage })))
const AppointmentsPage = lazy(() => import('./pages/AppointmentsPage').then(({ AppointmentsPage }) => ({ default: AppointmentsPage })))
const RoomsPage = lazy(() => import('./pages/RoomsPage').then(({ RoomsPage }) => ({ default: RoomsPage })))
const StaffShiftsPage = lazy(() => import('./pages/StaffShiftsPage').then(({ StaffShiftsPage }) => ({ default: StaffShiftsPage })))
const LaboratoryPage = lazy(() => import('./pages/LaboratoryPage').then(({ LaboratoryPage }) => ({ default: LaboratoryPage })))
const InventoryPage = lazy(() => import('./pages/InventoryPage').then(({ InventoryPage }) => ({ default: InventoryPage })))
const AmbulancePage = lazy(() => import('./pages/AmbulancePage').then(({ AmbulancePage }) => ({ default: AmbulancePage })))
const ReportsPage = lazy(() => import('./pages/ReportsPage').then(({ ReportsPage }) => ({ default: ReportsPage })))
const ConfigurationPage = lazy(() => import('./pages/ConfigurationPage').then(({ ConfigurationPage }) => ({ default: ConfigurationPage })))

function HospitalApp({ session, onSignOut }: { session: Session; onSignOut: () => Promise<void> }) {
  const [page, setPage] = useState<Page>('Resumen general')

  return (
    <div className="min-h-screen bg-[#f7f8fa] text-slate-800 md:flex">
      <Sidebar onNavigate={setPage} page={page} />
      <div className="min-w-0 flex-1">
        <Topbar onSignOut={onSignOut} session={session} />
        <main className="mx-auto max-w-[1600px] px-4 py-5 sm:px-7 sm:py-7">
          <PageHeading page={page} />
          <Suspense fallback={<p className="rounded-lg bg-white p-5 text-xs text-slate-500">Cargando pantalla...</p>}>
            {page === 'Resumen general' && <GeneralDashboard />}
            {page === 'Usuarios y roles' && <UsersPage />}
            {page === 'Pacientes e ingresos' && <PatientsPage />}
            {page === 'Expediente Clínico' && <ClinicalRecordPage />}
            {page === 'Citas y Turnos' && <AppointmentsPage />}
            {page === 'Habitaciones y Camas' && <RoomsPage />}
            {page === 'Turnos del Personal' && <StaffShiftsPage />}
            {page === 'Laboratorio' && <LaboratoryPage />}
            {page === 'Inventario y Recursos' && <InventoryPage />}
            {page === 'Ambulancia' && <AmbulancePage />}
            {page === 'Reportes y Analítica' && <ReportsPage />}
            {page === 'Configuración' && <ConfigurationPage />}
          </Suspense>
          <footer className="mt-5 flex items-center justify-between border-t border-slate-200 py-3 text-[9px] text-slate-400">
            <span>Hospital Universitario · San Gabriel</span>
            <span className="flex items-center gap-1"><span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> Datos actualizados hace unos segundos</span>
          </footer>
        </main>
      </div>
    </div>
  )
}

function App() {
  return <AuthGate>{(session, signOut) => <HospitalApp onSignOut={signOut} session={session} />}</AuthGate>
}

export default App
