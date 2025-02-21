import { Button } from '@/components'
import {
  useCreateInbox,
  useCreatePrivateTypeIndex,
  useCreatePublicTypeIndex,
} from '@/hooks/data/useSetupHospex'
import { removeBaseUrl } from '@/utils/helpers'
import { Trans, useLingui } from '@lingui/react/macro'
import { useForm } from 'react-hook-form'
import { Editable } from './Editable'
import { StepProps } from './HospexSetup'
import { SetupStatusKey } from './types'

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
  [SetupStatusKey.isPublicTypeIndex]: boolean
  [SetupStatusKey.isPrivateTypeIndex]: boolean
  [SetupStatusKey.isInbox]: boolean
  webId: string
  storage: string
}) => {
  const { t } = useLingui()
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
        throw new Error(t`Something is not resolved (unexpected error)`)

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
          <Trans>Public type index is set up.</Trans>
        ) : (
          <>
            <Trans>Create public type index:</Trans>{' '}
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
          <Trans>Private type index is set up.</Trans>
        ) : (
          <>
            <Trans>Create private type index:</Trans>{' '}
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
          <Trans>Inbox is set up.</Trans>
        ) : (
          <>
            <Trans>Create inbox:</Trans>{' '}
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
        <Trans>Continue</Trans>
      </Button>
    </form>
  )
}
