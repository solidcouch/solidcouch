import { Button } from '@/components'
import { SelectLocation } from '@/components/SelectLocation.tsx'
import styles from '@/pages/MyOffers.module.scss'
import { Accommodation } from '@/types'
import { ajvResolver } from '@hookform/resolvers/ajv'
import { Trans, useLingui } from '@lingui/react/macro'
import { JSONSchemaType } from 'ajv'
import clsx from 'clsx'
import merge from 'lodash/merge'
import { Controller, useForm } from 'react-hook-form'
import { FaExclamationTriangle, FaLocationArrow } from 'react-icons/fa'

const validationSchema: JSONSchemaType<
  Pick<Accommodation, 'location' | 'description'>
> = {
  type: 'object',
  required: ['location', 'description'],
  properties: {
    location: {
      type: 'object',
      required: ['lat', 'long'],
      properties: { lat: { type: 'number' }, long: { type: 'number' } },
      anyOf: [
        {
          not: {
            properties: { lat: { const: 0 }, long: { const: 0 } },
            required: ['lat', 'long'],
          },
        },
      ],
    },
    description: { type: 'string', minLength: 1 },
  },
}

export const AccommodationForm = ({
  initialData,
  onSubmit,
  onCancel,
}: {
  initialData?: Partial<Accommodation>
  onSubmit: (data: Accommodation) => void
  onCancel: () => void
}) => {
  const { t } = useLingui()

  const {
    handleSubmit,
    register,
    control,
    formState: { errors },
  } = useForm<Accommodation>({
    defaultValues: merge({ location: { lat: 0, long: 0 } }, initialData),
    resolver:
      ajvResolver<Pick<Accommodation, 'description' | 'location'>>(
        validationSchema,
      ),
  })

  const handleFormSubmit = handleSubmit(data => {
    onSubmit(data)
  })

  return (
    <form
      onSubmit={handleFormSubmit}
      onReset={onCancel}
      className={clsx(styles.accommodationForm, styles.accommodation)}
      data-cy="accommodation-form"
    >
      <label>
        <Trans>
          Hosting location (click <FaLocationArrow /> or drag & zoom map)
        </Trans>
        <br />
        <FaExclamationTriangle />{' '}
        <Trans>For safety, share only approximate location</Trans>{' '}
        <FaExclamationTriangle />
      </label>
      <Controller
        control={control}
        name="location"
        render={({ field }) => (
          <div className={clsx(errors.location && styles.inputError)}>
            <SelectLocation
              value={field.value}
              onChange={field.onChange}
              isInitial={!initialData}
            />
          </div>
        )}
      />
      {errors.location && (
        <div className={styles.errorMessage}>
          <Trans>Please move map to your hosting location</Trans>
        </div>
      )}

      <label htmlFor="description">
        <Trans>About your hosting</Trans>
      </label>
      <textarea
        className={clsx(errors.description && styles.inputError)}
        id="description"
        placeholder={t`Tell others about your place and hosting`}
        {...register('description')}
      />
      {errors.description && (
        <div className={styles.errorMessage}>
          <Trans>This field is required</Trans>
        </div>
      )}

      <div className={styles.actions}>
        <Button type="reset" secondary>
          <Trans>Cancel</Trans>
        </Button>
        <Button type="submit" primary>
          <Trans>Submit</Trans>
        </Button>
      </div>
    </form>
  )
}
