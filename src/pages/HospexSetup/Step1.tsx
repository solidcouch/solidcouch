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
import { getContainer } from '@/utils/helpers'
import { hospex } from '@/utils/rdf-namespaces'
import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { Editable } from './Editable'
import { StepProps } from './HospexSetup'
import styles from './HospexSetup.module.scss'

export const Step1 = ({
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
  publicTypeIndex: string
}) => {
  const { communityContainer, communityId } = useConfig()
  const auth = useAuth()
  const storage = useStorage(auth.webId ?? '')
  const community = useReadCommunity(communityId)
  const joinGroupLegacy = useJoinGroupLegacy()
  const joinCommunity = useJoinCommunity()
  const createHospexProfile = useCreateHospexProfile()
  const addToHospexProfile = useAddToHospexProfile()
  const saveTypeRegistration = useSaveTypeRegistration()

  const defaultHospexDocument =
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
        else
          await joinGroupLegacy({
            person: auth.webId as URI,
            group: community.groups[0],
          })
      onSuccess()
    },
  )

  return (
    <form onSubmit={handleFormSubmit}>
      {!isMember ? (
        <li>Join community {community.name || communityId}</li>
      ) : (
        <li>You are already a member of {community.name || communityId}</li>
      )}
      {!isHospexProfile && allHospex.length === 0 && (
        <li>
          Setup hospex document and storage:{' '}
          <Editable
            value={getContainerPath(newHospexDocument)}
            {...register('newHospexDocument')}
          />
        </li>
      )}
      {!isHospexProfile && allHospex.length > 0 && (
        <li>
          <legend>Setup hospex document and storage</legend>
          <fieldset className={styles.storageOptions}>
            <legend>
              You already seem to be a member of some hospitality exchange
              communities. Would you like to:
            </legend>
            <div className={styles.option}>
              <input
                required
                type="radio"
                id="new-hospex-document"
                value="new"
                {...register('hospexDocument')}
              />{' '}
              <label htmlFor="new-hospex-document">
                Set up new data for this community:
                <Editable
                  {...register('newHospexDocument')}
                  value={getContainerPath(watch('newHospexDocument'), storage)}
                />
              </label>
            </div>
            <div>
              <legend>
                Or use data (profile, hosting offers, etc.) from one of your
                existing communities?{' '}
                <i>(Recommended for similar communities)</i>
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
                    {getContainerPath(hospexDocument, storage)})
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
        disabled={!publicTypeIndex}
      >
        Continue
      </Button>
    </form>
  )
}

const getContainerPath = (url: string, baseUrl?: string) => {
  const containerUrl = new URL(getContainer(url))

  // If no baseUrl, return the full pathname
  if (!baseUrl) {
    return containerUrl.pathname
  }

  const base = new URL(baseUrl)

  // If baseUrl doesn't match the beginning of the URL, return the full URL
  if (!containerUrl.href.startsWith(base.href)) {
    return containerUrl.href // Return full URL if bases don't match
  }

  // Return the relative path by removing the baseUrl part
  return containerUrl.pathname.replace(base.pathname, '').replace(/^\/+/, '')
}
