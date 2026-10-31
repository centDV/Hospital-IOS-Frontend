import { useEffect, useState } from 'react'
import { readFacilities, type Facility } from './api'

export function useFacilities() {
  const [facilities, setFacilities] = useState<Facility[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true
    readFacilities().then((rows) => {
      if (active) setFacilities(rows)
    }).catch((loadError: unknown) => {
      if (active) setError(loadError instanceof Error ? loadError.message : 'No se pudieron cargar las instituciones.')
    }).finally(() => {
      if (active) setLoading(false)
    })
    return () => {
      active = false
    }
  }, [])

  return { facilities, loading, error }
}
