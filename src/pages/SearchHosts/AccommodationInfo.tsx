import { Avatar, ButtonLink, Loading } from '@/components'
import { LocaleText } from '@/components/LocaleText/LocaleText'
import { useReadAccommodation } from '@/hooks/data/useReadAccommodation'
import { useAuth } from '@/hooks/useAuth'
import { useAppSelector } from '@/redux/hooks'
import { selectLocale } from '@/redux/uiSlice'
import { URI } from '@/types'
import { Trans } from '@lingui/react/macro'
import { Link } from 'react-router'
import encodeURIComponent from 'strict-uri-encode'
import styles from './AccommodationInfo.module.scss'

export const AccommodationInfo = ({
  accommodationId,
}: {
  accommodationId: URI
}) => {
  const { webId } = useAuth()
  const locale = useAppSelector(selectLocale)

  const [{ accommodation, person }] = useReadAccommodation({ accommodationId })

  const isOther =
    webId && accommodation?.offeredBy && webId !== accommodation.offeredBy

  return (
    <div className={styles.container}>
      {accommodation ? (
        <>
          <div className={styles.person}>
            <Link
              to={`/profile/${encodeURIComponent(accommodation.offeredBy)}`}
              style={{ display: 'contents' }}
            >
              <Avatar {...person} size={1.5} square />
              <span className={styles.name} data-cy="accommodation-info-name">
                {person?.name}
              </span>
            </Link>
          </div>
          <LocaleText
            text={accommodation.description}
            locale={locale}
            as="div"
            className={styles.accommodation}
            data-cy="accommodation-info-description"
          />
        </>
      ) : (
        <Loading>
          <Trans>Loading...</Trans>
        </Loading>
      )}
      {isOther ? (
        <ButtonLink
          primary
          to={`/messages-with/${encodeURIComponent(accommodation.offeredBy)}`}
        >
          <Trans>Write a message</Trans>
        </ButtonLink>
      ) : null}
    </div>
  )
}
