import { skipToken } from '@reduxjs/toolkit/dist/query'
import { api } from 'app/services/api'
import { Avatar } from 'components/Avatar/Avatar'
import { URI } from 'types'

export const PersonMini = ({
  webId,
  className,
}: {
  webId: URI
  className?: string
}) => {
  const { data: person } = api.endpoints.readUser.useQuery(webId || skipToken)
  return (
    <Avatar
      photo={person?.hasPhoto?.['@id'] ?? person?.img}
      square
      size={1.25}
      className={className}
    />
  )
}
