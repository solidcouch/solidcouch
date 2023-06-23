import { Button } from 'components'
import { SelectLocation } from 'components/SelectLocation'
import { merge } from 'lodash'
import styles from 'pages/MyOffers.module.scss'
import { Controller, useForm } from 'react-hook-form'
import { Accommodation } from 'types'

export const AccommodationForm = ({
  initialData,
  onSubmit,
  onCancel,
}: {
  initialData?: Partial<Accommodation>
  onSubmit: (data: Accommodation) => void
  onCancel: () => void
}) => {
  const { handleSubmit, register, control } = useForm<Accommodation>({
    defaultValues: merge({ location: { lat: 50, long: 15 } }, initialData),
  })

  const handleFormSubmit = handleSubmit(data => {
    onSubmit(data)
  })

  return (
    <form
      onSubmit={handleFormSubmit}
      onReset={onCancel}
      className={styles.accommodation}
    >
      <Controller
        control={control}
        name="location"
        render={({ field }) => (
          <SelectLocation value={field.value} onChange={field.onChange} />
        )}
      />
      <textarea {...register('description')} style={{ width: '100%' }} />

      <div className={styles.actions}>
        <Button type="reset" secondary>
          Cancel
        </Button>
        <Button type="submit" primary>
          Submit
        </Button>
      </div>
    </form>
  )
}
