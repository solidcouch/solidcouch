import { Button } from 'components/Button/Button'
import { Accommodation } from 'ldo/accommodation.typings'
import { useForm } from 'react-hook-form'

export const OfferForm = ({
  initialData,
  onSubmit,
  onCancel,
}: {
  initialData?: Partial<Accommodation>
  onSubmit: (data: Accommodation) => void
  onCancel: () => void
}) => {
  const { handleSubmit, register } = useForm<Accommodation>({
    defaultValues: initialData,
  })

  const handleFormSubmit = handleSubmit(data => {
    onSubmit(data)
  })

  return (
    <form onSubmit={handleFormSubmit} onReset={onCancel}>
      <textarea {...register('comment')} />
      <Button type="submit" primary>
        Submit
      </Button>
      <Button type="reset" secondary>
        Cancel
      </Button>
    </form>
  )
}
