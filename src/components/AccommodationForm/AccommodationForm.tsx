import { ajvResolver } from '@hookform/resolvers/ajv'
import { JSONSchemaType } from 'ajv'
import classNames from 'classnames'
import { Button } from 'components'
import { SelectLocation } from 'components/SelectLocation'
import { merge } from 'lodash'
import styles from 'pages/MyOffers.module.scss'
import { Controller, useForm } from 'react-hook-form'
import { FaExclamationTriangle, FaLocationArrow } from 'react-icons/fa'
import { Accommodation } from 'types'

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
      className={classNames(styles.accommodationForm, styles.accommodation)}
    >
      <label>
        Hosting location (click <FaLocationArrow /> or drag & zoom map)
        <br />
        <FaExclamationTriangle /> For safety, share only approximate location{' '}
        <FaExclamationTriangle />
      </label>
      <Controller
        control={control}
        name="location"
        render={({ field }) => (
          <div className={classNames(errors.location && styles.inputError)}>
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
          Please move map to your hosting location
        </div>
      )}

      <label htmlFor="description">About your hosting</label>
      <textarea
        className={classNames(errors.description && styles.inputError)}
        id="description"
        placeholder="Tell others about your place and hosting"
        {...register('description')}
      />
      {errors.description && (
        <div className={styles.errorMessage}>This field is required</div>
      )}

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
