import { skipToken } from '@reduxjs/toolkit/dist/query'
import { ldoApi } from 'app/services/ldoApi'
import { Avatar } from 'components'
import { URI } from 'types'

export const PersonMini = ({
  webId,
  className,
}: {
  webId: URI
  className?: string
}) => {
  const { data: person } = ldoApi.endpoints.readUser.useQuery(
    webId || skipToken,
  )
  return (
    <Avatar
      photo={person?.hasPhoto?.['@id'] ?? person?.img}
      square
      size={1.25}
      className={className}
    />
  )
}
