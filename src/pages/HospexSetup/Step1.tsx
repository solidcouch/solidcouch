import { Button } from '@/components'
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
import { Editable } from './Editable'
import { StepProps } from './HospexSetup'
import styles from './HospexSetup.module.scss'
import { SetupStatusKey } from './types'

export const Step1 = ({
  onSuccess,
  isMember,
  isHospexProfile,
  allHospex,
  publicTypeIndex,
}: StepProps & {
  [SetupStatusKey.isMember]: boolean
  [SetupStatusKey.isHospexProfile]: boolean
  allHospex: {
    hospexDocument: URI
    communities: { uri: string; name: string }[]
  }[]
  publicTypeIndex?: string
}) => {
  const { communityContainer, communityId } = useConfig()
  const auth = useAuth()
  const { t } = useLingui()
  const storage = useStorage(auth.webId ?? '')!
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

  if (!storage || !newHospexDocument) return <>...</>
  const handleFormSubmit = handleSubmit(
    async ({ hospexDocument, newHospexDocument }) => {
      if (!publicTypeIndex) throw new Error(t`Public type index is not set up`)

      if (!isHospexProfile) {
        const isNew = allHospex.length === 0 || hospexDocument === 'new'

        if (isNew) {
          await createHospexProfile({
            uri: newHospexDocument,
            webId: auth.webId!,
            communityId,
          })

          await saveTypeRegistration({
            index: publicTypeIndex,
            type: hospex.PersonalHospexDocument,
            location: newHospexDocument,
          })
        } else
          await addToHospexProfile({
            uri: hospexDocument,
            webId: auth.webId!,
          })
      }

      if (!isMember)
        if (community.inbox)
          await joinCommunity({
            actor: auth.webId!,
            object: community.community,
            type: 'Join',
            inbox: community.inbox,
          })
        else {
          if (!community.groups[0])
            throw new Error(t`Community does not have a group`)
          await joinGroupLegacy({
            person: auth.webId as URI,
            group: community.groups[0],
          })
        }
      onSuccess()
    },
  )

  const communityLabel = community.name || communityId

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
      {!isHospexProfile && allHospex.length === 0 && (
        <li>
          <Trans>Setup hospex document and storage:</Trans>{' '}
          <Editable
            value={removeBaseUrl(newHospexDocument, storage)}
            {...register('newHospexDocument', { required: true })}
          />
        </li>
      )}
      {!isHospexProfile && allHospex.length > 0 && (
        <li>
          <legend>
            <Trans>Setup hospex document and storage</Trans>
          </legend>
          <fieldset className={styles.storageOptions}>
            <legend>
              <Trans>
                You already seem to be a member of some hospitality exchange
                communities. Would you like to:
              </Trans>
            </legend>
            <div className={styles.option}>
              <input
                type="radio"
                id="new-hospex-document"
                // eslint-disable-next-line lingui/no-unlocalized-strings
                value="new"
                {...register('hospexDocument', { required: true })}
              />{' '}
              <label htmlFor="new-hospex-document">
                <Trans>Set up new data for this community:</Trans>
                <Editable
                  {...register('newHospexDocument', { required: true })}
                  value={removeBaseUrl(watch('newHospexDocument'), storage)}
                />
              </label>
            </div>
            <div>
              <legend>
                <Trans>
                  Or use data (profile, hosting offers, etc.) from one of your
                  existing communities?{' '}
                  <i>(Recommended for similar communities)</i>
                </Trans>
              </legend>
              {allHospex.map(({ hospexDocument, communities }, i) => (
                <div key={hospexDocument} className={styles.option}>
                  <input
                    required
                    type="radio"
                    id={`hospexDocument-${i}`}
                    value={hospexDocument}
                    {...register('hospexDocument')}
                  />{' '}
                  <label htmlFor={`hospexDocument-${i}`}>
                    {communities.map(c => c.name ?? c.uri).join(', ')} (
                    {removeBaseUrl(hospexDocument, storage)})
                  </label>
                </div>
              ))}
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
        <Trans>Continue</Trans>
      </Button>
    </form>
  )
}
