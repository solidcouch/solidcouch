import { Button } from '@/components'
import { Trans, useLingui } from '@lingui/react/macro'
import { useForm } from 'react-hook-form'
import styles from './AddContactForm.module.scss'

export const AddContactForm = ({
  onSubmit,
  onCancel,
}: {
  onSubmit: (data: { invitation: string }) => Promise<void>
  onCancel: () => Promise<void>
}) => {
  const { t } = useLingui()
  const { register, handleSubmit } = useForm<{ invitation: string }>({
    defaultValues: { invitation: t`Hi! I'd like to add you as a contact!` },
  })

  const handleFormSubmit = handleSubmit(async data => {
    await onSubmit(data)
  })

  return (
    <div className={styles.container}>
      <h2>
        <Trans>Add person as a contact</Trans>
      </h2>
      <div>
        <Trans>Please invite only people you know personally.</Trans>
      </div>
      <form
        onSubmit={handleFormSubmit}
        onReset={onCancel}
        className={styles.form}
      >
        <textarea {...register('invitation')} />
        <div className={styles.actions}>
          <Button secondary type="reset">
            <Trans>Cancel</Trans>
          </Button>
          <Button primary type="submit">
            <Trans>Send contact invitation</Trans>
          </Button>
        </div>
      </form>
    </div>
  )
}
