import { useState } from 'react'
import { Icon } from '../components/Icon'
import { Panel, StatCard } from '../components/ui'

const inventoryItems = [
  { code: 'MED-001', name: 'Paracetamol 500 mg', category: 'Medicamentos', quantity: 240, unit: 'uds', status: 'Disponible' },
  { code: 'MED-002', name: 'Amoxicilina 500 mg', category: 'Medicamentos', quantity: 18, unit: 'uds', status: 'Stock bajo' },
  { code: 'INF-011', name: 'Guantes de nitrilo', category: 'Material clínico', quantity: 1250, unit: 'uds', status: 'Disponible' },
  { code: 'INF-021', name: 'Jeringas estériles 5 ml', category: 'Material clínico', quantity: 65, unit: 'uds', status: 'Stock bajo' },
  { code: 'MED-046', name: 'Solución salina 0.9%', category: 'Medicamentos', quantity: 12, unit: 'uds', status: 'Crítico' },
  { code: 'EQU-015', name: 'Oxímetro portátil', category: 'Equipo médico', quantity: 8, unit: 'uds', status: 'Disponible' },
]

export function InventoryPage() {
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState('Todas')
  const [status, setStatus] = useState('Todos')
  const filteredItems = inventoryItems.filter((item) =>
    `${item.code} ${item.name} ${item.category}`.toLowerCase().includes(query.toLowerCase())
    && (category === 'Todas' || item.category === category)
    && (status === 'Todos' || item.status === status),
  )
  const itemStatusStyle: Record<string, string> = {
    Disponible: 'bg-emerald-50 text-emerald-700',
    'Stock bajo': 'bg-amber-50 text-amber-700',
    Crítico: 'bg-rose-50 text-rose-700',
  }
  return (
    <>
      <div className="mb-4 grid grid-cols-2 gap-3 xl:grid-cols-4">
        <StatCard icon="box" label="Productos registrados" value="328" detail="Insumos y medicamentos" />
        <StatCard icon="activity" label="Stock crítico" value="14" detail="Requieren reposición" tone="amber" />
        <StatCard icon="clock" label="Próximos a vencer" value="9" detail="Control de caducidad" tone="blue" />
        <StatCard icon="check" label="Equipos disponibles" value="46" detail="Equipos operativos" tone="green" />
      </div>
      <section className="mb-4 flex flex-wrap items-center gap-2 rounded-xl border border-slate-100 bg-white p-3 shadow-[0_2px_10px_rgba(15,23,42,0.025)]">
        <label className="flex min-w-[200px] flex-1 items-center gap-2 rounded-md bg-slate-50 px-3 py-2 text-slate-400"><Icon name="search" size={13} /><input aria-label="Buscar en inventario" className="w-full bg-transparent text-[9px] text-slate-700 outline-none placeholder:text-slate-400" onChange={(event) => setQuery(event.target.value)} placeholder="Buscar por código, producto o categoría..." value={query} /></label>
        <label className="flex items-center gap-2 text-[9px] text-slate-500">Categoría:
          <select aria-label="Categoría de inventario" className="rounded-md bg-slate-50 px-2 py-2 text-slate-700 outline-none" onChange={(event) => setCategory(event.target.value)} value={category}><option>Todas</option>{[...new Set(inventoryItems.map((item) => item.category))].map((item) => <option key={item}>{item}</option>)}</select>
        </label>
        <label className="flex items-center gap-2 text-[9px] text-slate-500">Estado:
          <select aria-label="Estado de inventario" className="rounded-md bg-slate-50 px-2 py-2 text-slate-700 outline-none" onChange={(event) => setStatus(event.target.value)} value={status}><option>Todos</option><option>Disponible</option><option>Stock bajo</option><option>Crítico</option></select>
        </label>
        <button className="flex items-center justify-center gap-1 rounded-md bg-[#870b30] px-3 py-2 text-[9px] font-semibold text-white hover:bg-[#6f0827]" type="button"><Icon name="plus" size={12} /> Nuevo producto</button>
      </section>
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-12">
        <Panel className="xl:col-span-8" subtitle={`${filteredItems.length} productos · Existencias por producto, categoría y estado`} title="Inventario de suministros">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[570px] text-left text-[9px]">
              <thead><tr className="border-b border-slate-100 text-slate-400"><th className="pb-3 font-medium">Código</th><th className="pb-3 font-medium">Producto</th><th className="pb-3 font-medium">Categoría</th><th className="pb-3 font-medium">Existencia</th><th className="pb-3 font-medium">Estado</th><th className="pb-3 font-medium">Acciones</th></tr></thead>
              <tbody className="divide-y divide-slate-50">{filteredItems.map((item) => <tr key={item.code}><td className="py-3 font-semibold text-[#870b30]">{item.code}</td><td className="py-3 font-medium text-slate-700">{item.name}</td><td className="py-3 text-slate-500">{item.category}</td><td className="py-3 text-slate-600">{item.quantity} {item.unit}</td><td className="py-3"><span className={`rounded-full px-2 py-1 text-[8px] ${itemStatusStyle[item.status]}`}>{item.status}</span></td><td className="py-3"><button className="font-medium text-[#870b30] hover:underline" type="button">Ver</button></td></tr>)}
                {filteredItems.length === 0 && <tr><td className="py-8 text-center text-slate-400" colSpan={6}>No se encontraron productos.</td></tr>}
              </tbody>
            </table>
          </div>
          <p className="mt-3 text-[9px] text-slate-400">Mostrando {filteredItems.length} de 328 productos</p>
        </Panel>
        <div className="space-y-4 xl:col-span-4">
          <Panel title="Alertas de inventario">
            <div className="space-y-2">{[
              ['Solución salina · stock crítico', '12 uds · reponer hoy', 'bg-rose-50 text-rose-800'],
              ['Amoxicilina · stock bajo', '18 uds · revisar pedido', 'bg-amber-50 text-amber-800'],
              ['Guantes estériles · próximo a vencer', 'Lote vence en 30 días', 'bg-sky-50 text-sky-800'],
              ['Jeringas 5 ml · stock bajo', '65 uds · revisar mínimo', 'bg-amber-50 text-amber-800'],
            ].map(([title, detail, style]) => <div className={`rounded-lg p-2.5 ${style}`} key={title}><p className="text-[9px] font-semibold">{title}</p><p className="mt-1 text-[8px] opacity-75">{detail}</p></div>)}</div>
          </Panel>
          <Panel title="Distribución por categoría">
            <div className="space-y-3">{[['Medicamentos', 145], ['Insumos clínicos', 110], ['Equipos', 46], ['Otros', 27]].map(([label, value], index) => <div key={String(label)}><div className="mb-1 flex justify-between text-[8px]"><span className="text-slate-500">{label}</span><strong className="text-slate-700">{value}</strong></div><div className="h-1.5 rounded-full bg-slate-100"><div className={`h-full rounded-full ${index === 0 ? 'bg-[#870b30]' : 'bg-[#c57794]'}`} style={{ width: `${Number(value) / 1.5}%` }} /></div></div>)}</div>
          </Panel>
        </div>
        <Panel className="xl:col-span-12" subtitle="Últimos movimientos de suministros" title="Movimientos recientes">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[520px] text-left text-[9px]">
              <thead><tr className="border-b border-slate-100 text-slate-400"><th className="pb-2 font-medium">Fecha</th><th className="pb-2 font-medium">Movimiento</th><th className="pb-2 font-medium">Producto / Recurso</th><th className="pb-2 font-medium">Cantidad</th><th className="pb-2 font-medium">Responsable</th></tr></thead>
              <tbody className="divide-y divide-slate-50">{[['24 oct. · 09:15', 'Entrada', 'Guantes de nitrilo', '+500', 'Almacén'], ['23 oct. · 16:30', 'Salida', 'Solución salina 0.9%', '−20', 'Enfermería'], ['23 oct. · 11:05', 'Salida', 'Paracetamol 500 mg', '−35', 'Farmacia']].map(([date, movement, product, amount, person]) => <tr key={`${date}-${product}`}><td className="py-2.5 text-slate-500">{date}</td><td className={`py-2.5 font-medium ${movement === 'Entrada' ? 'text-emerald-700' : 'text-rose-700'}`}>{movement}</td><td className="py-2.5 text-slate-600">{product}</td><td className="py-2.5 font-semibold text-slate-700">{amount}</td><td className="py-2.5 text-slate-500">{person}</td></tr>)}</tbody>
            </table>
          </div>
        </Panel>
      </div>
    </>
  )
}
