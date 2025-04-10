import { Button } from '@/components'
import {
  useCreateInbox,
  useCreatePrivateTypeIndex,
  useCreatePublicTypeIndex,
} from '@/hooks/data/useSetupHospex'
import { removeBaseUrl } from '@/utils/helpers'
import { useForm } from 'react-hook-form'
import { Editable } from './Editable'
import { StepProps } from './HospexSetup'

interface Step0Data {
  publicTypeIndex: string
  privateTypeIndex: string
  inbox: string
}

export const Step0 = ({
  onSuccess,
  isPublicTypeIndex,
  isPrivateTypeIndex,
  isInbox,
  webId,
  storage,
}: StepProps & {
  isPublicTypeIndex: boolean
  isPrivateTypeIndex: boolean
  isInbox: boolean
  webId: string
  storage: string
}) => {
  const createPublicTypeIndex = useCreatePublicTypeIndex()
  const createPrivateTypeIndex = useCreatePrivateTypeIndex()
  const createInbox = useCreateInbox()

  const { watch, register, handleSubmit } = useForm<Step0Data>({
    defaultValues: {
      publicTypeIndex: new URL(
        './settings/publicTypeIndex.ttl',
        storage,
      ).toString(),
      privateTypeIndex: new URL(
        './settings/privateTypeIndex.ttl',
        storage,
      ).toString(),
      inbox: new URL('./inbox/', storage).toString(),
    },
  })

  const handleFormSubmit = handleSubmit(
    async ({ publicTypeIndex, privateTypeIndex, inbox }) => {
      if (
        isPublicTypeIndex === undefined ||
        isPrivateTypeIndex === undefined ||
        isInbox === undefined
      )
        throw new Error('Something is not resolved (unexpected error)')

      if (isPublicTypeIndex === false)
        await createPublicTypeIndex({
          publicTypeIndex,
          webId,
        })

      if (isPrivateTypeIndex === false)
        await createPrivateTypeIndex({
          privateTypeIndex,
          webId,
        })

      if (isInbox === false) await createInbox({ inbox, webId })

      onSuccess()
    },
  )

  return (
    <form onSubmit={handleFormSubmit}>
      <div>
        {isPublicTypeIndex ? (
          <>Public type index is set up.</>
        ) : (
          <>
            Create public type index:{' '}
            <Editable
              value={removeBaseUrl(watch('publicTypeIndex'), storage)}
              {...register('publicTypeIndex', { required: true })}
              type="url"
            />
          </>
        )}
      </div>
      <div>
        {isPrivateTypeIndex ? (
          <>Private type index is set up.</>
        ) : (
          <>
            Create private type index:{' '}
            {
              <Editable
                value={removeBaseUrl(watch('privateTypeIndex'), storage)}
                {...register('privateTypeIndex', { required: true })}
                type="url"
              />
            }
          </>
        )}
      </div>
      <div>
        {isInbox ? (
          <>Inbox is set up.</>
        ) : (
          <>
            Create inbox:{' '}
            {
              <Editable
                value={removeBaseUrl(watch('inbox'), storage)}
                {...register('inbox', { required: true })}
                type="url"
              />
            }
          </>
        )}
      </div>

      <Button type="submit" primary data-cy="setup-step-0-continue">
        Continue
      </Button>
    </form>
  )
}
