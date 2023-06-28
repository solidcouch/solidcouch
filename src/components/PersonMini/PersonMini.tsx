import { Avatar } from 'components'
import { communityId } from 'config'
import { useProfile } from 'hooks/data/useProfile'
import { URI } from 'types'

export const PersonMini = ({
  webId,
  className,
}: {
  webId: URI
  className?: string
}) => {
  const [person] = useProfile(webId, communityId)
  return (
    <Avatar photo={person.photo} square size={1.25} className={className} />
  )
}
