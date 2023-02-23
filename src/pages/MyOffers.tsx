import { Button } from 'components'
import { OfferForm } from 'components/OfferForm/OfferForm'
import { useState } from 'react'

export const MyOffers = () => {
  const [showNew, setShowNew] = useState(false)
  return (
    <div>
      {showNew ? (
        <OfferForm onSubmit={console.log} onCancel={() => setShowNew(false)} />
      ) : (
        <Button primary onClick={() => setShowNew(true)}>
          Add Accommodation
        </Button>
      )}
    </div>
  )
}
