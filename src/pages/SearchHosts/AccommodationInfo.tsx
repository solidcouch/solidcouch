import { skipToken } from '@reduxjs/toolkit/dist/query'
import { comunicaApi } from 'app/services/comunicaApi'
import { ButtonLink } from 'components'
import { Avatar } from 'components/Avatar/Avatar'
import { communityId } from 'config'
import { useProfile } from 'hooks/data/useProfile'
import { useAuth } from 'hooks/useAuth'
import { FaExternalLinkAlt } from 'react-icons/fa'
import { Link } from 'react-router-dom'
import { URI } from 'types'
import styles from './AccommodationInfo.module.scss'

export const AccommodationInfo = ({
  accommodationId,
}: {
  accommodationId: URI
}) => {
  const { webId } = useAuth()

  const { data: accommodation, ...accommodationStatus } =
    comunicaApi.endpoints.readAccommodation.useQuery(
      accommodationId ? { accommodationId: accommodationId } : skipToken,
    )

  const [person] = useProfile(accommodation?.offeredBy ?? '', communityId)

  const isAccommodationLoaded =
    accommodation &&
    accommodationStatus.isSuccess &&
    !accommodationStatus.isFetching

  const isPersonLoaded =
    person && isAccommodationLoaded && person.id === accommodation?.offeredBy

  const isOther =
    webId && accommodation?.offeredBy && webId !== accommodation.offeredBy

  return (
    <div className={styles.container}>
      {isAccommodationLoaded ? (
        <>
          {isAccommodationLoaded && isPersonLoaded ? (
            <div className={styles.person}>
              <Avatar {...person} size={1.5} square />
              <Link to={`/profile/${encodeURIComponent(person.id)}`}>
                <span className={styles.name}>{person.name}</span>
              </Link>
              <a href={person.id} target="_blank" rel="noopener noreferrer">
                <FaExternalLinkAlt />
              </a>
            </div>
          ) : (
            'loading person...'
          )}
          <div className={styles.accommodation}>
            {accommodation.description}
            <a
              href={accommodation.id}
              target="_blank"
              rel="noopener noreferrer"
            >
              <FaExternalLinkAlt />
            </a>
          </div>
        </>
      ) : (
        'loading info...'
      )}
      {isOther ? (
        <ButtonLink
          primary
          to={`/messages/${encodeURIComponent(accommodation.offeredBy)}`}
        >
          Write a message
        </ButtonLink>
      ) : null}
    </div>
  )
}
