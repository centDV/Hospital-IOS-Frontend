import type { Facility } from '../lib/api'

export function FacilityPicker({
  facilities,
  loading,
  selectedId,
  onChange,
}: {
  facilities: Facility[]
  loading: boolean
  selectedId: string
  onChange: (facilityId: string) => void
}) {
  if (loading || facilities.length === 0) return null

  return (
    <label className="mb-4 flex items-center gap-2 text-[10px] text-slate-500">
      Institución
      <select
        aria-label="Institución"
        className="max-w-full rounded-md border border-slate-200 bg-white px-2.5 py-2 text-[10px] text-slate-700 outline-none focus:border-rose-300"
        onChange={(event) => onChange(event.target.value)}
        value={selectedId}
      >
        {facilities.map((facility) => <option key={facility.id} value={facility.id}>{facility.name}</option>)}
      </select>
    </label>
  )
}
