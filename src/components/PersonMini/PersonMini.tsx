import { Avatar } from '../../components/index.ts'
import { useConfig } from '../../config/hooks.ts'
import { useProfile } from '../../hooks/data/useProfile.ts'
import { URI } from '../../types/index.ts'

export const PersonMini = ({
  webId,
  className,
}: {
  webId: URI
  className?: string
}) => {
  const { communityId } = useConfig()
  const [person] = useProfile(webId, communityId)
  return (
    <Avatar photo={person.photo} square size={1.25} className={className} />
  )
}
