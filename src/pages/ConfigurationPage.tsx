import { useEffect, useState } from 'react'
import { Panel } from '../components/ui'
import { readPublicView } from '../lib/api'

interface Facility {
  id: string
  name: string
  address: string | null
  active: boolean
}

interface Department {
  id: string
  facilityId: string
  name: string
  active: boolean
}

function parseCatalogRows<T>(rows: Record<string, unknown>[], viewName: string, parse: (row: Record<string, unknown>) => T): T[] {
  return rows.map((row) => {
    try {
      return parse(row)
    } catch (error) {
      throw new Error(`La vista "${viewName}" devolvió datos inválidos.`, { cause: error })
    }
  })
}

function requiredString(row: Record<string, unknown>, key: string): string {
  const value = row[key]
  if (typeof value !== 'string') throw new Error(`Falta el campo "${key}".`)
  return value
}

function requiredBoolean(row: Record<string, unknown>, key: string): boolean {
  const value = row[key]
  if (typeof value !== 'boolean') throw new Error(`Falta el campo "${key}".`)
  return value
}

export function ConfigurationPage() {
  const [saved, setSaved] = useState(false)
  const [theme, setTheme] = useState('Claro')
  const [facilities, setFacilities] = useState<Facility[]>([])
  const [departments, setDepartments] = useState<Department[]>([])
  const [catalogLoading, setCatalogLoading] = useState(true)
  const [catalogError, setCatalogError] = useState('')
  const [notifications, setNotifications] = useState<Record<string, boolean>>({
    'Alertas de nuevos ingresos': true,
    'Resultados de laboratorio': true,
    'Cambios de turno del personal': true,
    'Avisos de inventario crítico': true,
    'Reportes programados': false,
  })

  useEffect(() => {
    let active = true

    Promise.all([
      readPublicView('catalog_facilities').then((rows) => parseCatalogRows(rows, 'catalog_facilities', (row) => ({
        id: requiredString(row, 'id'),
        name: requiredString(row, 'name'),
        address: typeof row.address === 'string' ? row.address : null,
        active: requiredBoolean(row, 'active'),
      }))),
      readPublicView('catalog_departments').then((rows) => parseCatalogRows(rows, 'catalog_departments', (row) => ({
        id: requiredString(row, 'id'),
        facilityId: requiredString(row, 'facility_id'),
        name: requiredString(row, 'name'),
        active: requiredBoolean(row, 'active'),
      }))),
    ]).then(([nextFacilities, nextDepartments]) => {
      if (!active) return
      setFacilities(nextFacilities)
      setDepartments(nextDepartments)
    }).catch((error: unknown) => {
      if (!active) return
      setCatalogError(error instanceof Error ? error.message : 'No se pudieron cargar los catálogos de Supabase.')
    }).finally(() => {
      if (active) setCatalogLoading(false)
    })

    return () => {
      active = false
    }
  }, [])

  const toggleNotification = (name: string) => {
    setNotifications((current) => ({ ...current, [name]: !current[name] }))
    setSaved(false)
  }
  return (
    <>
      <div className="mb-4 flex gap-2 rounded-xl border border-slate-100 bg-white p-3 shadow-[0_2px_10px_rgba(15,23,42,0.025)]">
        <button className="rounded-md bg-[#870b30] px-3 py-2 text-[9px] font-semibold text-white" type="button">General</button>
        <button className="rounded-md px-3 py-2 text-[9px] text-slate-500 hover:bg-slate-50" onClick={() => document.getElementById('notification-settings')?.scrollIntoView({ behavior: 'smooth' })} type="button">Notificaciones</button>
        <button className="rounded-md px-3 py-2 text-[9px] text-slate-500 hover:bg-slate-50" onClick={() => document.getElementById('system-settings')?.scrollIntoView({ behavior: 'smooth' })} type="button">Sistema</button>
      </div>
      {saved && <p className="mb-3 rounded-lg bg-emerald-50 px-3 py-2 text-[9px] text-emerald-700" role="status">La configuración se guardó correctamente.</p>}
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-12">
        <Panel className="xl:col-span-7" subtitle="Datos de identificación de la institución" title="Información institucional">
          <form className="grid grid-cols-1 gap-3 sm:grid-cols-2" onSubmit={(event) => { event.preventDefault(); setSaved(true) }}>
            <label className="text-[9px] text-slate-500">Nombre de la institución<input className="mt-1 w-full rounded-md border border-slate-200 bg-slate-50 px-2.5 py-2 text-[10px] text-slate-700 outline-none focus:border-rose-300" defaultValue="Hospital Universitario San Gabriel" /></label>
            <label className="text-[9px] text-slate-500">Correo institucional<input className="mt-1 w-full rounded-md border border-slate-200 bg-slate-50 px-2.5 py-2 text-[10px] text-slate-700 outline-none focus:border-rose-300" defaultValue="contacto@hospital.edu" type="email" /></label>
            <label className="text-[9px] text-slate-500">Teléfono de contacto<input className="mt-1 w-full rounded-md border border-slate-200 bg-slate-50 px-2.5 py-2 text-[10px] text-slate-700 outline-none focus:border-rose-300" defaultValue="+000 0000-0000" /></label>
            <label className="text-[9px] text-slate-500">Dirección administrativa<input className="mt-1 w-full rounded-md border border-slate-200 bg-slate-50 px-2.5 py-2 text-[10px] text-slate-700 outline-none focus:border-rose-300" defaultValue="Dirección por configurar" /></label>
            <label className="text-[9px] text-slate-500">Zona horaria<select className="mt-1 w-full rounded-md border border-slate-200 bg-slate-50 px-2.5 py-2 text-[10px] text-slate-700 outline-none"><option>America/El_Salvador</option><option>America/Mexico_City</option><option>America/Bogota</option></select></label>
            <label className="text-[9px] text-slate-500">Idioma del sistema<select className="mt-1 w-full rounded-md border border-slate-200 bg-slate-50 px-2.5 py-2 text-[10px] text-slate-700 outline-none"><option>Español</option><option>English</option></select></label>
            <div className="flex justify-end sm:col-span-2"><button className="rounded-md bg-[#870b30] px-3 py-2 text-[9px] font-semibold text-white hover:bg-[#6f0827]" type="submit">Guardar cambios</button></div>
          </form>
        </Panel>
        <Panel className="xl:col-span-5" subtitle="Preferencias visuales y accesibilidad" title="Apariencia del sistema">
          <fieldset>
            <legend className="mb-2 text-[9px] font-medium text-slate-600">Tema de interfaz</legend>
            <div className="space-y-2">{['Claro', 'Oscuro', 'Alto contraste'].map((option) => <label className={`flex cursor-pointer items-center gap-2 rounded-lg px-3 py-2.5 text-[9px] ${theme === option ? 'bg-rose-50 text-[#870b30]' : 'bg-slate-50 text-slate-600'}`} key={option}><input checked={theme === option} className="accent-[#870b30]" name="theme" onChange={() => setTheme(option)} type="radio" value={option} />{option}</label>)}</div>
          </fieldset>
          <div className="mt-4 flex items-center justify-between rounded-lg bg-slate-50 p-3"><div><p className="text-[9px] font-medium text-slate-700">Ajustes de accesibilidad</p><p className="mt-1 text-[8px] text-slate-400">Mayor legibilidad y contraste visual</p></div><button aria-label="Alternar accesibilidad" aria-pressed={theme === 'Alto contraste'} className={`h-5 w-9 rounded-full p-0.5 transition ${theme === 'Alto contraste' ? 'bg-[#870b30]' : 'bg-slate-300'}`} onClick={() => setTheme(theme === 'Alto contraste' ? 'Claro' : 'Alto contraste')} type="button"><span className={`block h-4 w-4 rounded-full bg-white transition ${theme === 'Alto contraste' ? 'translate-x-4' : ''}`} /></button></div>
        </Panel>
        <Panel className="xl:col-span-5" subtitle="Controla qué avisos recibe el personal" title="Notificaciones">
          <div className="space-y-1" id="notification-settings">{Object.entries(notifications).map(([label, enabled]) => <label className="flex items-center justify-between gap-2 rounded-lg px-2 py-2 text-[9px] text-slate-600 hover:bg-slate-50" key={label}>{label}<button aria-label={`${enabled ? 'Desactivar' : 'Activar'} ${label}`} aria-pressed={enabled} className={`h-5 w-9 shrink-0 rounded-full p-0.5 transition ${enabled ? 'bg-[#870b30]' : 'bg-slate-300'}`} onClick={() => toggleNotification(label)} type="button"><span className={`block h-4 w-4 rounded-full bg-white transition ${enabled ? 'translate-x-4' : ''}`} /></button></label>)}</div>
        </Panel>
        <Panel className="xl:col-span-7" subtitle="Límites y permisos de la operación hospitalaria" title="Parámetros operativos y permisos">
          <form className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4" id="system-settings" onSubmit={(event) => { event.preventDefault(); setSaved(true) }}>
            <label className="text-[8px] text-slate-500">Capacidad VIP<input className="mt-1 w-full rounded-md border border-slate-200 bg-slate-50 px-2 py-2 text-[9px] text-slate-700 outline-none" defaultValue="5 habitaciones / 5 camas" /></label>
            <label className="text-[8px] text-slate-500">Capacidad semiprivada<input className="mt-1 w-full rounded-md border border-slate-200 bg-slate-50 px-2 py-2 text-[9px] text-slate-700 outline-none" defaultValue="6 habitaciones / 12 camas" /></label>
            <label className="text-[8px] text-slate-500">Unidades de ambulancia<input className="mt-1 w-full rounded-md border border-slate-200 bg-slate-50 px-2 py-2 text-[9px] text-slate-700 outline-none" defaultValue="1 unidad" /></label>
            <label className="text-[8px] text-slate-500">Permisos administrativos<select className="mt-1 w-full rounded-md border border-slate-200 bg-slate-50 px-2 py-2 text-[9px] text-slate-700 outline-none"><option>Administrar usuarios y permisos</option><option>Solo lectura</option></select></label>
            <p className="text-[8px] leading-relaxed text-slate-400 sm:col-span-2 lg:col-span-4">Los cambios operativos se aplicarán a los módulos que utilizan estos parámetros.</p>
            <div className="flex justify-end sm:col-span-2 lg:col-span-4"><button className="rounded-md bg-[#870b30] px-3 py-2 text-[9px] font-semibold text-white hover:bg-[#6f0827]" type="submit">Guardar parámetros</button></div>
          </form>
        </Panel>
        <Panel className="xl:col-span-12" subtitle="Lectura autenticada desde vistas públicas protegidas por RLS" title="Instituciones y departamentos conectados">
          {catalogLoading && <p className="text-[9px] text-slate-500">Cargando catálogos de Supabase...</p>}
          {catalogError && <p className="rounded-md bg-rose-50 px-3 py-2 text-[9px] text-rose-800" role="alert">{catalogError}</p>}
          {!catalogLoading && !catalogError && facilities.length === 0 && <p className="text-[9px] text-slate-500">No hay instituciones disponibles para esta cuenta.</p>}
          {!catalogLoading && !catalogError && facilities.length > 0 && (
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {facilities.map((facility) => {
                const facilityDepartments = departments.filter((department) => department.facilityId === facility.id)
                return (
                  <article className="rounded-lg border border-slate-100 bg-slate-50 p-3" key={facility.id}>
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h3 className="text-[10px] font-semibold text-slate-700">{facility.name}</h3>
                        <p className="mt-1 text-[9px] text-slate-500">{facility.address || 'Sin dirección registrada'}</p>
                      </div>
                      <span className={`rounded-full px-2 py-1 text-[8px] ${facility.active ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-200 text-slate-600'}`}>
                        {facility.active ? 'Activa' : 'Inactiva'}
                      </span>
                    </div>
                    <p className="mt-3 text-[8px] font-medium uppercase tracking-wide text-slate-400">Departamentos</p>
                    {facilityDepartments.length > 0
                      ? <ul className="mt-1 flex flex-wrap gap-1">{facilityDepartments.map((department) => <li className={`rounded px-2 py-1 text-[8px] ${department.active ? 'bg-white text-slate-600' : 'bg-slate-200 text-slate-500'}`} key={department.id}>{department.name}</li>)}</ul>
                      : <p className="mt-1 text-[8px] text-slate-400">Sin departamentos registrados</p>}
                  </article>
                )
              })}
            </div>
          )}
        </Panel>
      </div>
    </>
  )
}
