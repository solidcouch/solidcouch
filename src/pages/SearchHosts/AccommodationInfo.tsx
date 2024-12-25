import { Avatar, ButtonLink } from '@/components/index.ts'
import { useReadAccommodation } from '@/hooks/data/useReadAccommodation.ts'
import { useAuth } from '@/hooks/useAuth.ts'
import { URI } from '@/types/index.ts'
import { Link } from 'react-router-dom'
import styles from './AccommodationInfo.module.scss'

export const AccommodationInfo = ({
  accommodationId,
}: {
  accommodationId: URI
}) => {
  const { webId } = useAuth()

  const [accommodation] = useReadAccommodation({ accommodationId })

  const isOther =
    webId && accommodation?.offeredBy && webId !== accommodation.offeredBy.id

  return (
    <div className={styles.container}>
      {accommodation ? (
        <>
          <div className={styles.person}>
            <Link
              to={`/profile/${encodeURIComponent(accommodation.offeredBy.id)}`}
              style={{ display: 'contents' }}
            >
              <Avatar {...accommodation.offeredBy} size={1.5} square />
              <span className={styles.name} data-cy="accommodation-info-name">
                {accommodation.offeredBy.name}
              </span>
            </Link>
          </div>
          <div
            className={styles.accommodation}
            data-cy="accommodation-info-description"
          >
            {accommodation.description}
          </div>
        </>
      ) : (
        'loading...'
      )}
      {isOther ? (
        <ButtonLink
          primary
          to={`/messages/${encodeURIComponent(accommodation.offeredBy.id)}`}
        >
          Write a message
        </ButtonLink>
      ) : null}
    </div>
  )
}
