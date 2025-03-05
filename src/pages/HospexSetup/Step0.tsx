import { Button } from '@/components'
import {
  useCreateInbox,
  useCreatePreferences,
  useCreatePrivateTypeIndex,
  useCreatePublicTypeIndex,
} from '@/hooks/data/useSetupHospex'
import { getContainer, removeBaseUrl } from '@/utils/helpers'
import { Trans, useLingui } from '@lingui/react/macro'
import { useForm } from 'react-hook-form'
import { Editable } from './Editable'
import { StepProps } from './HospexSetup'
import { SetupStatusKey } from './types'

interface Step0Data {
  publicTypeIndex: string
  privateTypeIndex: string
  preferencesFile: string
  inbox: string
}

export const Step0 = ({
  onSuccess,
  isPublicTypeIndex,
  isPrivateTypeIndex,
  isPreferencesFile,
  isInbox,
  preferencesFile: existingPreferencesFile,
  privateTypeIndex: existingPrivateTypeIndex,
  publicTypeIndex: existingPublicTypeIndex,
  webId,
  storage,
}: StepProps & {
  [SetupStatusKey.isPublicTypeIndex]: boolean
  [SetupStatusKey.isPrivateTypeIndex]: boolean
  [SetupStatusKey.isInbox]: boolean
  [SetupStatusKey.isPreferencesFile]: boolean
  webId: string
  storage: string
  preferencesFile?: string
  privateTypeIndex?: string
  publicTypeIndex?: string
}) => {
  const { t } = useLingui()
  const createPublicTypeIndex = useCreatePublicTypeIndex()
  const createPrivateTypeIndex = useCreatePrivateTypeIndex()
  const createInbox = useCreateInbox()
  const createPreferences = useCreatePreferences()

  // if there is already a container with preferences or a type index, use it for settings
  const settingsContainer =
    getRelevantContainer(
      storage,
      existingPreferencesFile,
      existingPrivateTypeIndex,
      existingPublicTypeIndex,
    ) ?? new URL('settings/', storage).toString()

  const { watch, register, handleSubmit } = useForm<Step0Data>({
    defaultValues: {
      preferencesFile: new URL('preferences.ttl', settingsContainer).toString(),
      publicTypeIndex: new URL(
        'publicTypeIndex.ttl',
        settingsContainer,
      ).toString(),
      privateTypeIndex: new URL(
        'privateTypeIndex.ttl',
        settingsContainer,
      ).toString(),
      inbox: new URL('./inbox/', storage).toString(),
    },
  })

  const handleFormSubmit = handleSubmit(
    async ({ publicTypeIndex, privateTypeIndex, preferencesFile, inbox }) => {
      if (
        isPublicTypeIndex === undefined ||
        isPrivateTypeIndex === undefined ||
        isPreferencesFile === undefined ||
        isInbox === undefined
      )
        throw new Error(t`Something is not resolved (unexpected error)`)

      // save preferences file if missing
      // include private type index if present
      if (!isPreferencesFile) {
        await createPreferences({
          preferencesFile,
          privateTypeIndex: existingPrivateTypeIndex, // link existing private type index
          webId,
        })
      }

      if (isPublicTypeIndex === false)
        await createPublicTypeIndex({
          publicTypeIndex,
          webId,
        })

      if (isPrivateTypeIndex === false)
        await createPrivateTypeIndex({
          privateTypeIndex,
          preferencesFile: existingPreferencesFile || preferencesFile, // link private type index from preferences file
          webId,
        })

      if (isInbox === false) await createInbox({ inbox, webId })

      onSuccess()
    },
  )

  return (
    <form onSubmit={handleFormSubmit}>
      <div>
        {isPreferencesFile ? (
          <Trans>Preferences file is set up.</Trans>
        ) : (
          <>
            <Trans>Create preferences file:</Trans>{' '}
            <Editable
              value={removeBaseUrl(watch('preferencesFile'), storage)}
              {...register('preferencesFile', { required: true })}
              type="url"
            />
          </>
        )}
      </div>
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

/**
 * Get first fitting container of multiple files
 * We take container which is one or more directory structures within baseUrl
 */
const getRelevantContainer = (
  baseUrl: string | undefined,
  ...urls: (string | undefined)[]
) => {
  if (!baseUrl) return
  for (const url of urls) {
    if (!url) break
    const container = getContainer(url)
    const containerPath = removeBaseUrl(container, baseUrl)
    if (
      // succeed ...
      containerPath && //... if it exists ...
      containerPath !== '/' && // ... and is not root ...
      containerPath.includes(baseUrl) // ... and is within the storage.
    )
      return container
  }
}
