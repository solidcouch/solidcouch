import { useConfig } from '@/config/hooks'
import { URI } from '@/types'
import { useProfile } from './useProfile'

/**
 * Fetch a person's profile tied to the current community.
 */
export const useCommunityProfile = (webId: URI) => {
  const { communityId } = useConfig()
  return useProfile(webId, communityId)
}
