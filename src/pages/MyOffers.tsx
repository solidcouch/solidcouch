import { Button, Loading } from '@/components'
import {
  AccommodationCard,
  NewAccommodation,
} from '@/components/Accommodation/Accommodation'
import { useConfig } from '@/config/hooks'
import { useReadAccommodations } from '@/hooks/data/useReadAccommodations'
import { useAuth } from '@/hooks/useAuth'
import { Trans } from '@lingui/react/macro'
import { useState } from 'react'
import { FaDoorOpen } from 'react-icons/fa'
import styles from './MyOffers.module.scss'

export const MyOffers = () => {
  const [creating, setCreating] = useState(false)

  const { communityId } = useConfig()
  const auth = useAuth()

  const [accommodations] = useReadAccommodations(auth.webId!, communityId)

  if (!accommodations)
    return (
      <Loading>
        <Trans>Loading...</Trans>
      </Loading>
    )

  return (
    <div className={styles.container}>
      <h1 className={styles.header}>
        <FaDoorOpen size={32} /> <Trans>My Accommodation Offers</Trans>
      </h1>
      <ul style={{ display: 'contents' }}>
        {accommodations.map(accommodation => (
          <li
            key={accommodation.id}
            data-testid="offer-accommodation-item"
            className={styles.item}
          >
            <AccommodationCard editable uri={accommodation.id} />
          </li>
        ))}
      </ul>
      {creating ? (
        <NewAccommodation
          onSuccess={() => setCreating(false)}
          onCancel={() => setCreating(false)}
          className={styles.item}
        />
      ) : (
        <Button
          primary
          onClick={() => setCreating(true)}
          className={styles.item}
        >
          <Trans>Add Accommodation</Trans>
        </Button>
      )}
    </div>
  )
}
