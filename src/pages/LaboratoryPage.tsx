import { useEffect, useState } from 'react'
import { FacilityPicker } from '../components/FacilityPicker'
import { Icon } from '../components/Icon'
import { Panel } from '../components/ui'
import { readLaboratoryWorklist, type LaboratoryOrder } from '../lib/api'
import { useFacilities } from '../lib/useFacilities'

interface LaboratoryResponse {
  key: string
  orders: LaboratoryOrder[]
  error: string
}

export function LaboratoryPage() {
  const { facilities, loading: facilitiesLoading, error: facilitiesError } = useFacilities()
  const [selectedFacilityId, setSelectedFacilityId] = useState('')
  const [query, setQuery] = useState('')
  const [status, setStatus] = useState('Todos')
  const [priority, setPriority] = useState('Todas')
  const [cursors, setCursors] = useState<Array<string | null>>([null])
  const [response, setResponse] = useState<LaboratoryResponse | null>(null)
  const facilityId = facilities.find((facility) => facility.id === selectedFacilityId)?.id ?? facilities[0]?.id ?? ''
  const after = cursors[cursors.length - 1]
  const requestKey = `${facilityId}:${after ?? 'first'}`
  const currentResponse = response?.key === requestKey ? response : null
  const loading = Boolean(facilityId) && !currentResponse

  useEffect(() => {
    if (!facilityId) return
    let active = true
    readLaboratoryWorklist(facilityId, after).then((orders) => {
      if (active) setResponse({ key: requestKey, orders, error: '' })
    }).catch((loadError: unknown) => {
      if (active) setResponse({
        key: requestKey,
        orders: [],
        error: loadError instanceof Error ? loadError.message : 'No se pudo cargar la lista de laboratorio.',
      })
    })
    return () => {
      active = false
    }
  }, [after, facilityId, requestKey])

  const orders = currentResponse?.orders ?? []
  const filteredOrders = orders.filter((order) =>
    `${order.orderNumber} ${order.patientName} ${order.testName}`.toLowerCase().includes(query.toLowerCase())
    && (status === 'Todos' || order.status === status)
    && (priority === 'Todas' || order.priority === priority),
  )
  const statuses = [...new Set(orders.map((order) => order.status))]
  const priorities = [...new Set(orders.map((order) => order.priority))]

  return (
    <>
      <FacilityPicker facilities={facilities} loading={facilitiesLoading} onChange={setSelectedFacilityId} selectedId={facilityId} />
      {facilitiesError && <p className="mb-4 rounded-lg bg-rose-50 px-3 py-2 text-[10px] text-rose-800" role="alert">{facilitiesError}</p>}
      {!facilitiesLoading && !facilitiesError && facilities.length === 0 && <p className="mb-4 rounded-lg bg-amber-50 px-3 py-2 text-[10px] text-amber-800" role="status">No hay instituciones activas disponibles para esta cuenta.</p>}
      <section className="mb-4 flex flex-wrap items-center gap-2 rounded-xl border border-slate-100 bg-white p-3 shadow-[0_2px_10px_rgba(15,23,42,0.025)]">
        <label className="flex min-w-[220px] flex-1 items-center gap-2 rounded-md bg-slate-50 px-3 py-2 text-slate-400">
          <Icon name="search" size={13} />
          <input aria-label="Buscar en órdenes cargadas" className="w-full bg-transparent text-[9px] text-slate-700 outline-none placeholder:text-slate-400" onChange={(event) => setQuery(event.target.value)} placeholder="Buscar en las órdenes de esta página..." value={query} />
        </label>
        <label className="flex items-center gap-2 text-[9px] text-slate-500">Estado:
          <select aria-label="Estado de órdenes" className="max-w-40 rounded-md bg-slate-50 px-2 py-2 text-slate-700 outline-none" onChange={(event) => setStatus(event.target.value)} value={status}>
            <option>Todos</option>{statuses.map((value) => <option key={value} value={value}>{value}</option>)}
          </select>
        </label>
        <label className="flex items-center gap-2 text-[9px] text-slate-500">Prioridad:
          <select aria-label="Prioridad de órdenes" className="max-w-40 rounded-md bg-slate-50 px-2 py-2 text-slate-700 outline-none" onChange={(event) => setPriority(event.target.value)} value={priority}>
            <option>Todas</option>{priorities.map((value) => <option key={value} value={value}>{value}</option>)}
          </select>
        </label>
      </section>
      <Panel title="Órdenes de laboratorio" subtitle="Lista operativa protegida por los permisos de laboratorio de Supabase">
        {loading && <p className="py-6 text-center text-[10px] text-slate-500" role="status">Cargando órdenes...</p>}
        {currentResponse?.error && <p className="rounded-md bg-rose-50 px-3 py-2 text-[10px] text-rose-800" role="alert">{currentResponse.error}</p>}
        {!loading && !currentResponse?.error && currentResponse && (
          <>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[650px] text-left text-[9px]">
                <thead><tr className="border-b border-slate-100 text-slate-400"><th className="pb-3 font-medium">Orden</th><th className="pb-3 font-medium">Paciente</th><th className="pb-3 font-medium">Estudio</th><th className="pb-3 font-medium">Prioridad</th><th className="pb-3 font-medium">Estado</th><th className="pb-3 font-medium">Solicitada</th></tr></thead>
                <tbody className="divide-y divide-slate-50">
                  {filteredOrders.map((order) => (
                    <tr key={order.id}>
                      <td className="py-3 font-semibold text-[#870b30]">{order.orderNumber}</td>
                      <td className="py-3 font-medium text-slate-700">{order.patientName}</td>
                      <td className="py-3 text-slate-500">{order.testName}</td>
                      <td className="py-3 text-slate-500">{order.priority}</td>
                      <td className="py-3"><span className="rounded-full bg-sky-50 px-2 py-1 text-[8px] text-sky-700">{order.status}</span></td>
                      <td className="py-3 text-slate-500">{new Date(order.orderedAt).toLocaleString('es-SV')}</td>
                    </tr>
                  ))}
                  {filteredOrders.length === 0 && <tr><td className="py-8 text-center text-slate-400" colSpan={6}>No se encontraron órdenes en esta página.</td></tr>}
                </tbody>
              </table>
            </div>
            <div className="mt-3 flex items-center justify-between text-[9px] text-slate-400">
              <span>{filteredOrders.length} de {orders.length} órdenes · Máximo 25 por página</span>
              <div className="flex gap-2">
                <button className="rounded border border-slate-200 px-2 py-1 text-slate-600 disabled:opacity-40" disabled={cursors.length === 1} onClick={() => setCursors((current) => current.slice(0, -1))} type="button">Anterior</button>
                <button className="rounded border border-slate-200 px-2 py-1 text-slate-600 disabled:opacity-40" disabled={orders.length < 25} onClick={() => setCursors((current) => [...current, orders[orders.length - 1].id])} type="button">Siguiente</button>
              </div>
            </div>
          </>
        )}
      </Panel>
    </>
  )
}
