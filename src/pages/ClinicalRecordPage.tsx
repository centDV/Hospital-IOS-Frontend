import { useState } from 'react'
import { Icon } from '../components/Icon'
import { Panel, StatusBadge } from '../components/ui'

const recordTabs = ['Resumen', 'Historia Clínica', 'Diagnósticos', 'Recetas', 'Órdenes', 'Laboratorio', 'Evolución']

export function ClinicalRecordPage() {
  const [activeTab, setActiveTab] = useState('Resumen')
  const [showConfidential, setShowConfidential] = useState(false)

  return (
    <>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2 text-[10px] text-slate-400">
        <span>Inicio <Icon className="mx-1 inline" name="chevron" size={10} /> Expediente Clínico <Icon className="mx-1 inline" name="chevron" size={10} /> EXP-2024-00124</span>
        <button className="rounded-md bg-[#870b30] px-3 py-2 font-semibold text-white hover:bg-[#6f0827]" onClick={() => setShowConfidential((visible) => !visible)} type="button">
          Acciones <Icon className="ml-1 inline" name="chevron" size={11} />
        </button>
      </div>
      {showConfidential && <div className="mb-3 rounded-lg border border-rose-200 bg-rose-50 p-3 text-[10px] text-rose-800">Acciones del expediente: imprimir resumen · descargar expediente · compartir con personal autorizado.</div>}
      <section className="mb-4 grid grid-cols-1 gap-3 rounded-xl border border-slate-100 bg-white p-4 shadow-[0_2px_10px_rgba(15,23,42,0.025)] lg:grid-cols-[1fr_230px]">
        <div className="flex flex-wrap items-center gap-4">
          <span className="flex h-14 w-14 items-center justify-center rounded-full bg-rose-50 text-base font-semibold text-[#870b30]">VA</span>
          <div className="min-w-[180px] flex-1">
            <h2 className="text-sm font-bold text-slate-800">Víctor Rafael Arevalo Sierra</h2>
            <p className="mt-1 text-[9px] text-slate-400">EXP-2024-00124 · Paciente desde 2019</p>
            <div className="mt-3 grid grid-cols-2 gap-x-5 gap-y-2 text-[9px] sm:grid-cols-4">
              <div><p className="text-slate-400">Edad</p><p className="mt-0.5 font-semibold text-slate-700">67 años</p></div>
              <div><p className="text-slate-400">Sexo</p><p className="mt-0.5 font-semibold text-slate-700">Masculino</p></div>
              <div><p className="text-slate-400">Tipo de sangre</p><p className="mt-0.5 font-semibold text-slate-700">O+</p></div>
              <div><p className="text-slate-400">Médico tratante</p><p className="mt-0.5 font-semibold text-slate-700">Dr. Luis Ramírez</p></div>
            </div>
          </div>
        </div>
        <div className="rounded-lg bg-rose-50 p-3">
          <p className="text-[10px] font-semibold text-[#870b30]">Información confidencial</p>
          <p className="mt-1 text-[9px] leading-relaxed text-slate-500">Este expediente contiene datos personales y clínicos protegidos. Acceso según autorización.</p>
          <p className="mt-2 text-[9px] text-rose-700">Última actualización: hoy, 10:24</p>
        </div>
      </section>
      <nav aria-label="Secciones del expediente" className="mb-4 flex gap-1 overflow-x-auto border-b border-slate-200">
        {recordTabs.map((tab) => <button aria-current={activeTab === tab ? 'page' : undefined} className={`shrink-0 border-b-2 px-3 py-2.5 text-[10px] ${activeTab === tab ? 'border-[#870b30] font-semibold text-[#870b30]' : 'border-transparent text-slate-500 hover:text-slate-800'}`} key={tab} onClick={() => setActiveTab(tab)} type="button">{tab}</button>)}
      </nav>
      {activeTab === 'Resumen' ? (
        <>
          <div className="grid grid-cols-1 gap-4 xl:grid-cols-12">
            <Panel className="xl:col-span-4" subtitle="Diagnóstico principal" title="Diagnóstico actual">
              <div className="rounded-lg bg-rose-50 p-3">
                <p className="text-[10px] font-semibold text-[#870b30]">Neumonía adquirida en la comunidad</p>
                <p className="mt-1 text-[9px] text-slate-500">CIE-10: J18.9 · Diagnóstico principal</p>
                <div className="mt-3 flex items-center justify-between text-[9px]"><span className="text-slate-400">Fecha de diagnóstico: 20 oct. 2024</span><StatusBadge status="Ingresado" /></div>
              </div>
              <div className="mt-3 flex gap-2 text-[9px]"><span className="rounded-full bg-emerald-50 px-2 py-1 text-emerald-700">En tratamiento</span><span className="rounded-full bg-sky-50 px-2 py-1 text-sky-700">Evolución favorable</span></div>
            </Panel>
            <Panel className="xl:col-span-5" subtitle="Último registro · Hoy, 10:15" title="Signos vitales">
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {[
                  ['Presión arterial', '128/76', 'mmHg'],
                  ['Frecuencia cardíaca', '78', 'lpm'],
                  ['Frecuencia respiratoria', '18', 'rpm'],
                  ['Temperatura', '36.8', '°C'],
                  ['Saturación O₂', '97', '%'],
                  ['Peso', '72.5', 'kg'],
                ].map(([label, value, unit]) => <div className="rounded-lg bg-slate-50 p-2.5" key={label}><p className="text-[9px] text-slate-400">{label}</p><p className="mt-1 text-sm font-bold text-[#870b30]">{value}<span className="ml-1 text-[9px] font-normal text-slate-400">{unit}</span></p></div>)}
              </div>
            </Panel>
            <Panel className="xl:col-span-3" title="Alertas y consideraciones">
              <div className="space-y-2">
                {[
                  ['Alergia a penicilina', 'Crítica'],
                  ['Alergia a sulfas', 'Crítica'],
                  ['Hipertensión arterial', 'Importante'],
                  ['Diabetes tipo 2', 'Importante'],
                ].map(([label, level], index) => <div className={`flex items-center justify-between gap-2 rounded-lg px-2.5 py-2 text-[9px] ${index < 2 ? 'bg-rose-50 text-rose-700' : 'bg-amber-50 text-amber-700'}`} key={label}><span className="font-medium">{label}</span><span>{level}</span></div>)}
              </div>
            </Panel>
            <Panel className="xl:col-span-4" title="Antecedentes">
              <div className="space-y-3 text-[9px]">
                <div><p className="font-semibold text-slate-700">Patológicos</p><p className="mt-0.5 text-slate-400">Hipertensión arterial · diagnosticada en 2018</p></div>
                <div><p className="font-semibold text-slate-700">Quirúrgicos</p><p className="mt-0.5 text-slate-400">Apendicectomía · 2015</p></div>
                <div><p className="font-semibold text-slate-700">Alergias</p><p className="mt-0.5 text-slate-400">Penicilina y sulfas</p></div>
              </div>
            </Panel>
            <Panel className="xl:col-span-4" title="Medicamentos activos">
              <div className="space-y-2 text-[9px]">
                {[
                  ['Levofloxacino 750 mg', 'Vía oral · cada 24 h · 7 días'],
                  ['Paracetamol 500 mg', 'Vía oral · cada 8 h · según dolor'],
                  ['Losartán 50 mg', 'Vía oral · cada 24 h · crónico'],
                  ['Metformina 850 mg', 'Vía oral · cada 12 h · crónico'],
                ].map(([medicine, dosage]) => <div className="rounded-lg bg-slate-50 p-2" key={medicine}><p className="font-semibold text-slate-700">{medicine}</p><p className="mt-0.5 text-slate-400">{dosage}</p></div>)}
              </div>
            </Panel>
            <Panel className="xl:col-span-4" title="Próxima cita">
              <div className="flex items-center gap-3 rounded-lg bg-slate-50 p-3">
                <div className="rounded-lg bg-white px-3 py-2 text-center"><p className="text-[8px] font-bold uppercase text-[#870b30]">Oct</p><p className="text-lg font-bold text-slate-800">30</p></div>
                <div><p className="text-[10px] font-semibold text-slate-700">Consulta de seguimiento</p><p className="mt-1 text-[9px] text-slate-400">Medicina interna · 10:00 a. m.</p><span className="mt-2 inline-block rounded-full bg-sky-50 px-2 py-1 text-[8px] text-sky-700">Programada</span></div>
              </div>
            </Panel>
            <Panel className="xl:col-span-6" title="Notas médicas recientes">
              <div className="space-y-3">{[['24 oct. 2024 · Dr. Luis Ramírez', 'Nota de evolución · Paciente con mejoría clínica'], ['23 oct. 2024 · Dra. Ana Castillo', 'Seguimiento de tratamiento y signos vitales'], ['20 oct. 2024 · Dr. Jorge Méndez', 'Nota de ingreso · Evaluación inicial']].map(([title, note]) => <div className="border-l-2 border-rose-200 pl-3" key={title}><p className="text-[9px] font-semibold text-slate-700">{title}</p><p className="mt-1 text-[9px] text-slate-400">{note}</p></div>)}</div>
            </Panel>
            <Panel className="xl:col-span-6" title="Órdenes y resultados recientes">
              <div className="space-y-3">{[['22 oct. · Biometría hemática', 'Completada'], ['22 oct. · Cultivo de esputo', 'En proceso'], ['21 oct. · Radiografía de tórax', 'Completada']].map(([label, state]) => <div className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2 text-[9px]" key={label}><span className="text-slate-600">{label}</span><span className={state === 'Completada' ? 'text-emerald-700' : 'text-amber-700'}>{state}</span></div>)}</div>
            </Panel>
          </div>
        </>
      ) : (
        <Panel subtitle={`Registro de ${activeTab.toLowerCase()} del paciente`} title={activeTab}>
          <div className="space-y-3">
            {[
              ['24 oct. 2024 · Dr. Luis Ramírez', 'Seguimiento de neumonía adquirida en la comunidad. Evolución estable, continuar esquema indicado y control de signos vitales.'],
              ['22 oct. 2024 · Dra. Ana Castillo', 'Paciente tolera tratamiento. Se solicitan estudios de control y evaluación clínica en 48 horas.'],
              ['20 oct. 2024 · Dr. Jorge Méndez', 'Ingreso y evaluación inicial. Se documentan antecedentes, alergias y plan terapéutico.'],
            ].map(([date, note]) => <article className="rounded-lg border border-slate-100 p-3" key={date}><p className="text-[10px] font-semibold text-[#870b30]">{date}</p><p className="mt-2 text-[10px] leading-relaxed text-slate-500">{note}</p></article>)}
          </div>
        </Panel>
      )}
    </>
  )
}
