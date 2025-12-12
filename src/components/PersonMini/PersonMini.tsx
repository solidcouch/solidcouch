import { Avatar } from '@/components'
import { useConfig } from '@/config/hooks'
import { useProfile } from '@/hooks/data/useProfile'
import { URI } from '@/types'

export const PersonMini = ({
  webId,
  className,
  square,
  size = 1.25,
}: {
  webId: URI
  className?: string
  square?: boolean
  size?: number
}) => {
  const { communityId } = useConfig()
  const [person] = useProfile(webId, communityId)
  return (
    <Avatar
      photo={person.photo}
      name={person.name}
      square={square}
      size={size}
      className={className}
    />
  )
}
