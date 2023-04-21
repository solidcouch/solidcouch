import { skipToken } from '@reduxjs/toolkit/dist/query'
import { ldoApi } from 'app/services/ldoApi'
import { useMemo } from 'react'

export const usePersonalHospexDocuments = (webId?: string) => {
  const { data: solidProfile, ...solidProfileStatus } =
    ldoApi.endpoints.readSolidProfile.useQuery(webId ?? skipToken)
  const { data: registrations, ...registrationsStatus } =
    ldoApi.endpoints.readTypeRegistrations.useQuery(
      solidProfile?.publicTypeIndex?.[0]['@id'] ?? skipToken,
    )

  const hospexDocuments = useMemo(
    () =>
      registrations
        ?.filter(reg =>
          reg.forClass.find(
            c =>
              c['@id'] === 'http://w3id.org/hospex/ns#PersonalHospexDocument',
          ),
        )
        .map(
          registration =>
            registration.instance?.map(i => i['@id']) ??
            registration.instanceContainer?.map(c => c['@id']) ??
            [],
        )
        .flat(4),
    [registrations],
  )

  const isTypeIndexMissing =
    solidProfile && !solidProfile.publicTypeIndex?.[0]['@id']

  const isHospexMissing =
    !isTypeIndexMissing && registrations && hospexDocuments?.length === 0

  return {
    data: hospexDocuments,
    isLoading: solidProfileStatus.isLoading || registrationsStatus.isLoading,
    isSuccess: solidProfileStatus.isSuccess && registrationsStatus.isSuccess,
    isError:
      solidProfileStatus.isError ||
      registrationsStatus.isError ||
      isTypeIndexMissing ||
      isHospexMissing,
    error:
      solidProfileStatus.error ||
      registrationsStatus.error ||
      (isTypeIndexMissing && 'TYPE_INDEX_MISSING') ||
      (isHospexMissing && 'HOSPEX_NOT_SET_UP') ||
      undefined,
  }
}
