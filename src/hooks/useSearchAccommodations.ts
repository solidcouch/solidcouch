import { comunicaApi } from 'app/services/comunicaApi'
import { URI } from 'types'

export const useSearchAccommodations = (communityId: URI, language = 'en') => {
  const { data: people } = comunicaApi.endpoints.readCommunityMembers.useQuery({
    communityId,
  })

  console.log(people, '****')
}
