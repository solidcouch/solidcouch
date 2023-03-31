import { skipToken } from '@reduxjs/toolkit/dist/query'
import { api } from 'app/services/api'
import { useAuth } from './useAuth'

export const useStorage = () => {
  const auth = useAuth()
  const { data: solidProfile, ...state } =
    api.endpoints.readSolidProfile.useQuery(auth.webId ?? skipToken)

  const storages = solidProfile
    ? (solidProfile.storage ?? []).map(s => s['@id'])
    : undefined

  return [storages, state]
}
