import { Button } from '@/components'
import { withToast } from '@/components/withToast'
import { useConfig } from '@/config/hooks'
import { useReadCommunity } from '@/hooks/data/useCommunity'
import { useJoinCommunity, useJoinGroupLegacy } from '@/hooks/data/useJoinGroup'
import {
  useAddToHospexProfile,
  useCreateHospexProfile,
  useSaveTypeRegistration,
} from '@/hooks/data/useSetupHospex'
import { useStorage } from '@/hooks/data/useStorage'
import { useAuth } from '@/hooks/useAuth'
import { URI } from '@/types'
import { removeBaseUrl } from '@/utils/helpers'
import { hospex } from '@/utils/rdf-namespaces'
import { Trans, useLingui } from '@lingui/react/macro'
import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import styles from './CommunitySetup.module.scss'
import { Editable } from './Editable'
import { StepProps } from './HospexSetup'
import { useToastError } from './useToastError'

export const CommunitySetup = ({
  onSuccess,
  isMember,
  isHospexProfile,
  allHospex,
  publicTypeIndex,
}: StepProps & {
  isMember: boolean
  isHospexProfile: boolean
  allHospex: {
    hospexDocument: URI
    communities: { uri: string; name: string }[]
  }[]
  publicTypeIndex?: string
}) => {
  const { communityContainer, communityId } = useConfig()
  const auth = useAuth()
  const { t } = useLingui()
  const storage = useStorage(auth.webId!)
  const community = useReadCommunity(communityId)
  const joinGroupLegacy = useJoinGroupLegacy()
  const joinCommunity = useJoinCommunity()
  const createHospexProfile = useCreateHospexProfile()
  const addToHospexProfile = useAddToHospexProfile()
  const saveTypeRegistration = useSaveTypeRegistration()

  const defaultHospexDocument =
    // eslint-disable-next-line lingui/no-unlocalized-strings
    storage && `${storage}hospex/${communityContainer}/card`

  const { handleSubmit, register, watch, setValue } = useForm<{
    hospexDocument: string
    newHospexDocument: string
  }>({ defaultValues: { newHospexDocument: defaultHospexDocument } })

  useEffect(() => {
    if (storage)
      setValue(
        'newHospexDocument',
        `${storage}hospex/${communityContainer}/card`,
      )
  }, [communityContainer, setValue, storage])

  const newHospexDocument = watch('newHospexDocument')

  const toastError = useToastError()

  if (!storage) return <Trans>No storage found</Trans>
  if (!newHospexDocument) return <>...</>

  const handleFormSubmit = handleSubmit(
    async ({ hospexDocument, newHospexDocument }) => {
      if (!isHospexProfile) {
        const isNew = allHospex.length === 0 || hospexDocument === 'new'

        await withToast(
          (async function () {
            if (isNew) {
              if (!publicTypeIndex)
                throw new Error(t`Public type index is not set up`)
              await createHospexProfile({
                uri: newHospexDocument,
                webId: auth.webId!,
                communityId,
              })
              return await saveTypeRegistration({
                index: publicTypeIndex,
                type: hospex.PersonalHospexDocument,
                location: newHospexDocument,
              })
            } else
              return addToHospexProfile({
                uri: hospexDocument,
                webId: auth.webId!,
              })
          })(),
          {
            pending: t`Setting up hospex data`,
            success: t`Hospex data setup successful`,
            error: toastError,
          },
        )
      }

      if (!isMember) {
        if (community.inbox) {
          await withToast(
            joinCommunity({
              actor: auth.webId!,
              object: community.community,
              type: 'Join',
              inbox: community.inbox,
            }),
            {
              pending: t`Joining community`,
              success: t`Join request sent`,
              error: toastError,
            },
          )
        } else {
          await withToast(
            (async function () {
              if (community.isError)
                throw new Error(
                  t`Community Solid Pod is not available at the moment.`,
                )
              if (!community.groups[0])
                throw new Error(t`Community does not have a group.`)

              return await joinGroupLegacy({
                person: auth.webId as URI,
                group: community.groups[0],
              })
            })(),
            {
              pending: t`Joining community`,
              success: t`Community joined`,
              error: toastError,
            },
          )
        }
      }
      onSuccess()
    },
  )

  const communityLabel = community.name || new URL(communityId).host

  return (
    <form onSubmit={handleFormSubmit}>
      {!isMember ? (
        <li>
          <Trans>Join community {communityLabel}</Trans>
        </li>
      ) : (
        <li>
          <Trans>You are already a member of {communityLabel}</Trans>
        </li>
      )}
      {isHospexProfile ? (
        <li>
          <Trans>Your {communityLabel} data storage is set up.</Trans>
        </li>
      ) : allHospex.length === 0 ? (
        <li>
          <Trans>Choose your community data storage:</Trans>{' '}
          <Editable
            editable
            value={removeBaseUrl(newHospexDocument, storage)}
            {...register('newHospexDocument', { required: true })}
          />
        </li>
      ) : (
        <li>
          <legend>
            <Trans>Choose your community data storage:</Trans>
          </legend>
          <fieldset className={styles.storageOptions}>
            <div>
              <legend>
                <Trans>Link existing community profile:</Trans>
              </legend>
              {allHospex.map(({ hospexDocument, communities }, i) => (
                <div key={hospexDocument} className={styles.option}>
                  <input
                    required
                    type="radio"
                    id={`hospexDocument-${i}`}
                    value={hospexDocument}
                    {...register('hospexDocument', { required: true })}
                  />{' '}
                  <label htmlFor={`hospexDocument-${i}`}>
                    {communities
                      .map(c => c.name || new URL(c.uri).hostname) // this is a compromise between precision and readability
                      .join(', ')}{' '}
                    ({removeBaseUrl(hospexDocument, storage)})
                  </label>
                </div>
              ))}
            </div>
            <div>
              <legend>
                <Trans>Create new profile for this community:</Trans>
              </legend>
              <div className={styles.option}>
                <input
                  required
                  type="radio"
                  id="new-hospex-document"
                  // eslint-disable-next-line lingui/no-unlocalized-strings
                  value="new"
                  {...register('hospexDocument', { required: true })}
                />{' '}
                <label htmlFor="new-hospex-document">
                  <Editable
                    editable
                    {...register('newHospexDocument', { required: true })}
                    value={removeBaseUrl(watch('newHospexDocument'), storage)}
                  />
                </label>
              </div>
            </div>
          </fieldset>
        </li>
      )}

      <Button
        type="submit"
        primary
        data-cy="setup-step-1-continue"
        data-testid="setup-step-1-continue"
        disabled={!publicTypeIndex}
      >
        <Trans>Confirm and Continue</Trans>
      </Button>
    </form>
  )
}
