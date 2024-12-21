import { URI } from 'types'
import { Avatar } from '../../components'
import { useConfig } from '../../config/hooks'
import { useProfile } from '../../hooks/data/useProfile'

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
