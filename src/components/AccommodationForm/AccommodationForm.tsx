import { Button } from 'components/Button/Button'
import { SelectLocation } from 'components/SelectLocation'
import { Accommodation } from 'ldo/accommodation.typings'
import { merge } from 'lodash'
import { Controller, useForm } from 'react-hook-form'

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
    <form onSubmit={handleFormSubmit} onReset={onCancel}>
      <Controller
        control={control}
        name="location"
        render={({ field }) => (
          <SelectLocation value={field.value} onChange={field.onChange} />
        )}
      />
      <textarea {...register('comment')} />
      <div>
        <Button type="submit" primary>
          Submit
        </Button>
        <Button type="reset" secondary>
          Cancel
        </Button>
      </div>
    </form>
  )
}
