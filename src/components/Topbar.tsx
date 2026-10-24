import { Icon } from './Icon'

export function Topbar() {
  return (
    <header className="flex min-h-[64px] flex-wrap items-center justify-between gap-3 border-b border-slate-100 bg-white px-4 py-3 sm:px-7">
      <label className="flex min-w-[190px] max-w-[430px] flex-1 items-center gap-2 rounded-md bg-slate-50 px-3 py-2 text-slate-400">
        <Icon name="search" size={15} />
        <input aria-label="Buscar en el sistema" className="w-full bg-transparent text-xs text-slate-700 outline-none placeholder:text-slate-400" placeholder="Buscar pacientes, expedientes, citas..." />
        <kbd className="hidden rounded border border-slate-200 bg-white px-1.5 py-0.5 text-[9px] sm:inline">⌘ K</kbd>
      </label>
      <div className="flex items-center gap-4">
        <button aria-label="Notificaciones" className="relative text-slate-500 hover:text-[#800b2c]" type="button">
          <Icon name="bell" size={17} />
          <span className="absolute -right-0.5 -top-0.5 h-1.5 w-1.5 rounded-full bg-[#a30b39]" />
        </button>
        <button aria-label="Ayuda" className="text-slate-500 hover:text-[#800b2c]" type="button"><Icon name="help" size={17} /></button>
        <div className="flex items-center gap-2 border-l border-slate-100 pl-3">
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#f8e9ef] text-[10px] font-semibold text-[#800b2c]">EV</span>
          <span className="hidden sm:block">
            <span className="block text-[11px] font-semibold text-slate-800">Dra. Emily Díaz</span>
            <span className="block text-[10px] text-slate-400">Administradora</span>
          </span>
          <Icon name="chevron" size={13} className="rotate-90 text-slate-400" />
        </div>
      </div>
    </header>
  )
}
