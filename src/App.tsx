import { useState } from 'react'
import { Sidebar } from './components/Sidebar'
import { Topbar } from './components/Topbar'
import { PageHeading } from './components/PageHeading'
import type { Page } from './types'
import { GeneralDashboard } from './pages/GeneralDashboard'
import { UsersPage } from './pages/UsersPage'
import { PatientsPage } from './pages/PatientsPage'
import { ClinicalRecordPage } from './pages/ClinicalRecordPage'
import { AppointmentsPage } from './pages/AppointmentsPage'
import { RoomsPage } from './pages/RoomsPage'
import { StaffShiftsPage } from './pages/StaffShiftsPage'
import { LaboratoryPage } from './pages/LaboratoryPage'
import { InventoryPage } from './pages/InventoryPage'
import { AmbulancePage } from './pages/AmbulancePage'
import { ReportsPage } from './pages/ReportsPage'
import { ConfigurationPage } from './pages/ConfigurationPage'

function App() {
  const [page, setPage] = useState<Page>('Resumen general')

  return (
    <div className="min-h-screen bg-[#f7f8fa] text-slate-800 md:flex">
      <Sidebar onNavigate={setPage} page={page} />
      <div className="min-w-0 flex-1">
        <Topbar />
        <main className="mx-auto max-w-[1600px] px-4 py-5 sm:px-7 sm:py-7">
          <PageHeading page={page} />
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
          <footer className="mt-5 flex items-center justify-between border-t border-slate-200 py-3 text-[9px] text-slate-400">
            <span>Hospital Universitario · San Gabriel</span>
            <span className="flex items-center gap-1"><span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> Datos actualizados hace unos segundos</span>
          </footer>
        </main>
      </div>
    </div>
  )
}

export default App
