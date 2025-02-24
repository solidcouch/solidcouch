import { Avatar, ButtonLink, Loading } from '@/components'
import { useReadAccommodation } from '@/hooks/data/useReadAccommodation'
import { useAuth } from '@/hooks/useAuth'
import { URI } from '@/types'
import { Trans } from '@lingui/react/macro'
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
        <Loading>
          <Trans>Loading...</Trans>
        </Loading>
      )}
      {isOther ? (
        <ButtonLink
          primary
          to={`/messages/${encodeURIComponent(accommodation.offeredBy.id)}`}
        >
          <Trans>Write a message</Trans>
        </ButtonLink>
      ) : null}
    </div>
  )
}
