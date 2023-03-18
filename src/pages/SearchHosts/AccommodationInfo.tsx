import { skipToken } from '@reduxjs/toolkit/dist/query'
import { comunicaApi } from 'app/services/comunicaApi'
import { Avatar } from 'components/Avatar/Avatar'
import { FaExternalLinkAlt } from 'react-icons/fa'
import { URI } from 'types'
import styles from './AccommodationInfo.module.scss'

export const AccommodationInfo = ({
  accommodationId,
}: {
  accommodationId: URI
}) => {
  const { data: accommodation, ...accommodationStatus } =
    comunicaApi.endpoints.readAccommodation.useQuery(
      accommodationId ? { accommodationId: accommodationId } : skipToken,
    )

  const { data: person, ...personStatus } =
    comunicaApi.endpoints.readPerson.useQuery(
      accommodation?.offeredBy ? { webId: accommodation.offeredBy } : skipToken,
    )

  const isAccommodationLoaded =
    accommodation &&
    accommodationStatus.isSuccess &&
    !accommodationStatus.isFetching

  const isPersonLoaded =
    person && personStatus.isSuccess && !personStatus.isFetching

  return (
    <div className={styles.container}>
      {isAccommodationLoaded ? (
        <>
          {isAccommodationLoaded && isPersonLoaded ? (
            <div className={styles.person}>
              <Avatar {...person} size={1.5} square />
              <span className={styles.name}>{person.name}</span>
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
      )}{' '}
    </div>
  )
}
