import { useEffect, useMemo, useState } from 'react'
import { FacilityPicker } from '../components/FacilityPicker'
import { Panel } from '../components/ui'
import { readMyAccess, readSystemRoles, searchManagedUsers, setUserRoles, type ManagedUser, type SystemRole, type UserAccess } from '../lib/api'
import { useFacilities } from '../lib/useFacilities'

interface UsersResponse {
  key: string
  users: ManagedUser[]
  after: string | null
  error: string
}

function displayName(user: ManagedUser): string {
  return `${user.givenNames} ${user.familyNames}`.trim() || user.email || 'Usuario sin nombre'
}

function initials(user: ManagedUser): string {
  return displayName(user).split(/\s+/).slice(0, 2).map((part) => part[0] ?? '').join('').toUpperCase() || 'U'
}

function statusLabel(status: string): string {
  const labels: Record<string, string> = { active: 'Activo', pending: 'Pendiente', suspended: 'Suspendido', disabled: 'Desactivado' }
  return labels[status] ?? status.replaceAll('_', ' ')
}

export function UsersPage() {
  const { facilities, loading: facilitiesLoading, error: facilitiesError } = useFacilities()
  const [access, setAccess] = useState<UserAccess | null>(null)
  const [accessError, setAccessError] = useState('')
  const [accessLoading, setAccessLoading] = useState(true)
  const [selectedFacilityId, setSelectedFacilityId] = useState('')
  const [query, setQuery] = useState('')
  const [after, setAfter] = useState<string | null>(null)
  const [response, setResponse] = useState<UsersResponse | null>(null)
  const [roles, setRoles] = useState<SystemRole[]>([])
  const [rolesError, setRolesError] = useState('')
  const [savingUserId, setSavingUserId] = useState('')
  const [actionError, setActionError] = useState('')
  const [actionSuccess, setActionSuccess] = useState('')

  useEffect(() => {
    let active = true
    readMyAccess().then((result) => {
      if (active) setAccess(result)
    }).catch((loadError: unknown) => {
      if (active) setAccessError(loadError instanceof Error ? loadError.message : 'No se pudieron verificar los permisos del usuario.')
    }).finally(() => {
      if (active) setAccessLoading(false)
    })
    return () => {
      active = false
    }
  }, [])

  const authorizedFacilities = useMemo(() => facilities.filter((facility) =>
    access?.permissions.some((permission) => permission.facilityId === facility.id && permission.code === 'users.read'),
  ), [access, facilities])
  const facilityId = authorizedFacilities.find((facility) => facility.id === selectedFacilityId)?.id
    ?? authorizedFacilities[0]?.id
    ?? ''
  const canManageUsers = access?.permissions.some((permission) =>
    permission.facilityId === facilityId && permission.code === 'users.write',
  ) ?? false
  const receptionistRole = roles.find((role) => role.code === 'receptionist')
  const responseKey = `${facilityId}:${query.trim()}:${after ?? 'first'}`
  const currentResponse = response?.key === responseKey ? response : null
  const loading = Boolean(facilityId) && !currentResponse
  const users = currentResponse?.users ?? []
  const receptionistCount = users.filter((user) => user.roles.some((role) => role.code === 'receptionist')).length

  useEffect(() => {
    if (!facilityId) return
    let active = true
    readSystemRoles(facilityId).then((rows) => {
      if (active) {
        setRoles(rows)
        setRolesError('')
      }
    }).catch((loadError: unknown) => {
      if (active) setRolesError(loadError instanceof Error ? loadError.message : 'No se pudieron cargar los roles.')
    })
    return () => {
      active = false
    }
  }, [facilityId])

  useEffect(() => {
    if (!facilityId) return
    let active = true
    searchManagedUsers(facilityId, query, after).then((result) => {
      if (!active) return
      setResponse((current) => {
        const sameSearch = after && current?.key.startsWith(`${facilityId}:${query.trim()}:`)
        const combinedUsers = after && sameSearch && current
          ? [...current.users, ...result.users]
          : result.users
        return { key: responseKey, users: combinedUsers, after: result.after, error: '' }
      })
    }).catch((loadError: unknown) => {
      if (active) setResponse({ key: responseKey, users: [], after: null, error: loadError instanceof Error ? loadError.message : 'No se pudo cargar el directorio de usuarios.' })
    })
    return () => {
      active = false
    }
  }, [after, facilityId, query, responseKey])

  async function assignReceptionist(user: ManagedUser) {
    if (!facilityId || !receptionistRole || !canManageUsers || user.id === access?.profileId) return
    setSavingUserId(user.id)
    setActionError('')
    setActionSuccess('')
    try {
      const currentRoleIds = user.roles.map((role) => role.id)
      const roleIds = currentRoleIds.includes(receptionistRole.id)
        ? currentRoleIds
        : [...currentRoleIds, receptionistRole.id]
      await setUserRoles(user.id, facilityId, roleIds)
      setResponse((current) => current && current.key.startsWith(`${facilityId}:${query.trim()}:`)
        ? {
          ...current,
          users: current.users.map((item) => item.id === user.id && !item.roles.some((role) => role.id === receptionistRole.id)
            ? { ...item, roles: [...item.roles, receptionistRole] }
            : item),
        }
        : current)
      setActionSuccess(`Se asignó el rol de recepcionista a ${displayName(user)}.`)
    } catch (saveError: unknown) {
      setActionError(saveError instanceof Error ? saveError.message : 'No se pudo asignar el rol de recepcionista.')
    } finally {
      setSavingUserId('')
    }
  }

  if (accessLoading || facilitiesLoading) {
    return <p className="rounded-lg bg-white p-5 text-xs text-slate-500" role="status">Cargando usuarios y permisos...</p>
  }
  if (accessError || facilitiesError) {
    return <p className="rounded-lg bg-rose-50 p-4 text-xs text-rose-800" role="alert">{accessError || facilitiesError}</p>
  }
  if (authorizedFacilities.length === 0) {
    return <p className="rounded-lg bg-white p-5 text-xs text-slate-500">Tu usuario no tiene permiso para consultar el directorio de usuarios.</p>
  }

  return (
    <div className="space-y-4">
      {authorizedFacilities.length > 1 && <FacilityPicker facilities={authorizedFacilities} loading={false} onChange={(id) => {
        setSelectedFacilityId(id)
        setAfter(null)
        setResponse(null)
      }} selectedId={facilityId} />}

      <section className="rounded-xl border border-slate-100 bg-white p-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-sm font-semibold text-slate-800">Usuarios y roles</h2>
            <p className="mt-1 text-xs text-slate-500">Consulta los usuarios de la institución y asigna el rol de recepción.</p>
          </div>
          {receptionistRole && <span className="rounded-full bg-rose-50 px-3 py-1.5 text-xs font-medium text-[#870b30]">Rol disponible: {receptionistRole.name}</span>}
        </div>
        <label className="mt-4 flex max-w-xl items-center gap-2 rounded-md bg-slate-50 px-3 py-2 text-slate-400">
          <span aria-hidden="true">⌕</span>
          <input aria-label="Buscar usuarios" className="w-full bg-transparent text-xs text-slate-700 outline-none placeholder:text-slate-400" onChange={(event) => {
            setQuery(event.target.value)
            setAfter(null)
            setActionError('')
            setActionSuccess('')
          }} placeholder="Buscar por nombre o correo..." value={query} />
        </label>
      </section>

      {currentResponse?.error && <p className="rounded-lg bg-rose-50 p-3 text-xs text-rose-800" role="alert">{currentResponse.error}</p>}
      {rolesError && <p className="rounded-lg bg-rose-50 p-3 text-xs text-rose-800" role="alert">{rolesError}</p>}
      {actionError && <p className="rounded-lg bg-rose-50 p-3 text-xs text-rose-800" role="alert">{actionError}</p>}
      {actionSuccess && <p className="rounded-lg bg-emerald-50 p-3 text-xs text-emerald-800" role="status">{actionSuccess}</p>}

      <Panel title="Directorio de usuarios" subtitle={loading ? 'Cargando...' : `${users.length} usuarios encontrados · ${receptionistCount} con rol de recepcionista`}>
        {loading ? <p className="py-8 text-center text-xs text-slate-500" role="status">Cargando directorio...</p> : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[680px] text-left text-xs">
              <thead><tr className="border-b border-slate-100 text-slate-400"><th className="pb-3 font-medium">Usuario</th><th className="pb-3 font-medium">Roles asignados</th><th className="pb-3 font-medium">Estado</th><th className="pb-3 font-medium">Acción</th></tr></thead>
              <tbody className="divide-y divide-slate-50">
                {users.map((user) => {
                  const hasReceptionist = user.roles.some((role) => role.code === 'receptionist')
                  const isSelf = user.id === access?.profileId
                  return (
                    <tr key={user.id}>
                      <td className="py-3">
                        <div className="flex items-center gap-2">
                          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-rose-50 text-[10px] font-semibold text-[#870b30]">{initials(user)}</span>
                          <div><p className="font-semibold text-slate-700">{displayName(user)}</p><p className="mt-0.5 text-[11px] text-slate-400">{user.email || 'Correo no disponible'}</p></div>
                        </div>
                      </td>
                      <td className="py-3 text-slate-600">{user.roles.map((role) => role.name).join(' · ') || 'Sin roles'}</td>
                      <td className="py-3"><span className={`rounded-full px-2 py-1 text-[10px] ${user.status === 'active' ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>{statusLabel(user.status)}</span></td>
                      <td className="py-3">
                        {hasReceptionist
                          ? <span className="text-[11px] font-medium text-emerald-700">Recepcionista asignado</span>
                          : <button className="rounded-md bg-[#870b30] px-3 py-2 text-[11px] font-medium text-white hover:bg-[#6f0827] disabled:cursor-not-allowed disabled:opacity-50" disabled={!canManageUsers || !receptionistRole || isSelf || savingUserId === user.id} onClick={() => void assignReceptionist(user)} type="button">
                            {savingUserId === user.id ? 'Asignando...' : isSelf ? 'No disponible para ti' : canManageUsers ? 'Asignar recepcionista' : 'Sin permiso para asignar'}
                          </button>}
                      </td>
                    </tr>
                  )
                })}
                {!users.length && <tr><td className="py-8 text-center text-slate-400" colSpan={4}>No se encontraron usuarios para esta búsqueda.</td></tr>}
              </tbody>
            </table>
          </div>
        )}
        {currentResponse?.after && (
          <div className="mt-4 flex justify-center">
            <button className="rounded-md border border-slate-200 px-3 py-2 text-xs font-medium text-slate-600 hover:bg-slate-50" onClick={() => setAfter(currentResponse.after)} type="button">Cargar más usuarios</button>
          </div>
        )}
      </Panel>
      {!canManageUsers && <p className="text-[11px] text-slate-500">La asignación de roles requiere el permiso administrativo correspondiente.</p>}
    </div>
  )
}
