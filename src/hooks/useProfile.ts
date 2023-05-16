import { skipToken } from '@reduxjs/toolkit/dist/query'
import '@szhsin/react-menu/dist/index.css'
import '@szhsin/react-menu/dist/transitions/slide.css'
import { comunicaApi } from 'app/services/comunicaApi'
import { ldoApi } from 'app/services/ldoApi'
import mergeWith from 'lodash/mergeWith'
import { useMemo } from 'react'
import { Person, URI } from 'types'

export const useProfile = (id: URI | undefined) => {
  const { data: profile } = ldoApi.endpoints.readUser.useQuery(id ?? skipToken)
  const { data: hospexProfile } =
    comunicaApi.endpoints.readHospexProfile.useQuery(
      id ? { id, language: 'en' } : skipToken,
    )
  const combinedProfile: Person = useMemo(() => {
    const basicProfile = {
      photo: profile?.hasPhoto?.['@id'] || profile?.img,
      name: profile?.name,
      id: profile?.['@id'],
    }

    return mergeWith(
      { id, name: '' },
      basicProfile,
      hospexProfile,
      (obj, src) => {
        if (!src) return obj
      },
    )
  }, [hospexProfile, id, profile])

  return combinedProfile

  // return [
  //   combinedProfile,
  //   mergeWith({}, profileStatus, hospexProfileStatus, (obj, src) => {
  //     if (!src) return obj
  //   }),
  // ]
}
