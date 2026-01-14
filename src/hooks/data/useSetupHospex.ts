import { useConfig } from '@/config/hooks'
import {
  HospexProfileShapeType,
  PrivateTypeIndexShapeType,
  PublicTypeIndexShapeType,
} from '@/ldo/app.shapeTypes'
import { AuthorizationShapeType } from '@/ldo/wac.shapeTypes'
import { URI } from '@/types'
import { HttpError } from '@/utils/errors'
import { fullFetch, getAcl, getContainer } from '@/utils/helpers'
import { fetch } from '@inrupt/solid-client-authn-browser'
import { set } from '@ldo/ldo'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { foaf, ldp, solid, space } from 'rdf-namespaces'
import { useCallback } from 'react'
import { v4 as uuidv4 } from 'uuid'
import { useUpdateAcl } from './access'
import { AccessMode, QueryKey } from './types'
import { useReadCommunity } from './useCommunity'
import {
  useCreateRdfContainer,
  useCreateRdfDocument,
  useUpdateLdoDocument,
  useUpdateRdfDocument,
} from './useRdfDocument'

export const saveTypeRegistration = async ({
  index,
  type,
  location,
}: {
  index: URI
  type: URI
  location: URI
}) => {
  const isForContainer = location.endsWith('/')
  const locationPredicate = isForContainer
    ? solid.instanceContainer
    : solid.instance

  // first try to add the instance to existing type registration
  const updateResponse = await fullFetch(index, {
    method: 'PATCH',
    headers: { 'content-type': 'text/n3' },
    body: `
    @prefix solid: <http://www.w3.org/ns/solid/terms#>.
    _:update a solid:InsertDeletePatch;
      solid:where {
        ?typeRegistration
          a solid:TypeRegistration;
          solid:forClass <${type}>.
      };
      solid:inserts {
        ?typeRegistration <${locationPredicate}> <${location}>.
      } .`,
  })

  // TODO this fails when there are already multiple type registrations for given class
  // it would be nicer if it adds to one of the multiple

  if (updateResponse.ok) return
  if (updateResponse.status !== 409)
    throw new HttpError('Updating type registration failed.', updateResponse)

  // if adding to existing type registration fails, create a new type registration
  const typeRegistration = uuidv4()
  const addResponse = await fullFetch(index, {
    method: 'PATCH',
    headers: { 'content-type': 'text/n3' },
    body: `
    @prefix solid: <http://www.w3.org/ns/solid/terms#>.
    _:add a solid:InsertDeletePatch;
      solid:inserts {
        <#${typeRegistration}>
          a solid:TypeRegistration;
          solid:forClass <${type}>;
          <${locationPredicate}> <${location}>.
      } .`,
  })
  if (!addResponse.ok)
    throw new HttpError('Saving type registration failed.', addResponse)
}

/**
 * update type registration of a given type, or create a new type registration
 */
export const useSaveTypeRegistration = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: saveTypeRegistration,
    onSuccess: (_, { index }) => {
      queryClient.invalidateQueries({ queryKey: [QueryKey.rdfDocument, index] })
    },
  }).mutateAsync
}

/**
 * create settings container if it doesn't exist, with access to owner
 * create preferences file inside settings container and link it from webId document
 * add link private type index in preferencesFile if it's provided
 */
export const useCreatePreferences = () => {
  const createSettingsAcl = useUpdateAcl()
  const createPreferencesFilePatch = useUpdateRdfDocument()
  const saveLinkToWebId = useUpdateRdfDocument()

  return useCallback(
    async ({
      preferencesFile,
      webId,
      privateTypeIndex,
    }: {
      preferencesFile: URI
      webId: URI
      privateTypeIndex?: URI
    }) => {
      // create preferences file (including private type index if provided)
      await createPreferencesFilePatch.mutateAsync({
        uri: preferencesFile,
        patch: `
        @prefix pim: <http://www.w3.org/ns/pim/space#> .
        _:mutate a <${solid.InsertDeletePatch}>;
          <${solid.inserts}> {
            <> a pim:ConfigurationFile.
            ${privateTypeIndex ? `<${webId}> <${solid.privateTypeIndex}> <${privateTypeIndex}>.` : ''}
          }.`,
      })

      // create acl for settings container
      const settingsContainer = getContainer(preferencesFile)
      await createSettingsAcl(settingsContainer, [
        {
          operation: 'add',
          access: [AccessMode.Read, AccessMode.Write, AccessMode.Control],
          default: true,
          agents: [webId],
        },
      ])

      // save preferences link to webId
      await saveLinkToWebId.mutateAsync({
        uri: webId,
        patch: `_:mutate a <${solid.InsertDeletePatch}>; <${solid.inserts}> {
          <${webId}> <${space.preferencesFile}> <${preferencesFile}>.
        }.`,
      })
    },
    [createPreferencesFilePatch, createSettingsAcl, saveLinkToWebId],
  )
}

export const useCreatePrivateTypeIndex = () => {
  const createMutation = useCreateRdfDocument(PrivateTypeIndexShapeType)
  const updateMutation = useUpdateRdfDocument()

  return useCallback(
    async ({
      webId,
      privateTypeIndex,
      preferencesFile,
    }: {
      webId: URI
      privateTypeIndex: URI
      preferencesFile: string
    }) => {
      await createMutation.mutateAsync({
        uri: privateTypeIndex,
        data: {
          '@id': privateTypeIndex,
          type: set({ '@id': 'TypeIndex' }, { '@id': 'UnlistedDocument' }),
        },
      })

      const patch = `_:mutate a <${solid.InsertDeletePatch}>; <${solid.inserts}> { <${webId}> <${solid.privateTypeIndex}> <${privateTypeIndex}>. }.`

      // create private type index
      await updateMutation.mutateAsync({ uri: preferencesFile, patch })
    },
    [createMutation, updateMutation],
  )
}

// add community to existing hospex profile
export const useAddToHospexProfile = () => {
  const { communityId } = useConfig()
  const updateMutation = useUpdateLdoDocument(HospexProfileShapeType)
  const createAcl = useCreateHospexProfileAcl()
  const updateAcl = useUpdateAcl()
  const community = useReadCommunity(communityId)

  return useCallback(
    async ({ uri, webId }: { uri: string; webId: string }) => {
      await updateMutation.mutateAsync({
        uri,
        subject: webId,
        transform: ldo => {
          ldo.memberOf ??= set()
          ldo.memberOf.add({ '@id': communityId })
          ldo.storage2 ??= { '@id': getContainer(uri) }
          ldo['@id'] ??= webId
        },
      })
      try {
        await createAcl(
          { webId, uri: getContainer(uri) },
          { throwOnHttpError: true },
        )
      } catch {
        await updateAcl(getContainer(uri), [
          {
            operation: 'add',
            access: [AccessMode.Read],
            agentGroups: community.groups,
            default: true,
          },
        ])
      }
    },
    [community.groups, communityId, createAcl, updateAcl, updateMutation],
  )
}

const useCreateHospexProfileAcl = () => {
  const { communityId } = useConfig()
  const createAclMutation = useCreateRdfDocument(AuthorizationShapeType)
  const community = useReadCommunity(communityId)

  return useCallback(
    async (
      { uri, webId }: { uri: URI; webId: URI },
      options: { throwOnHttpError?: boolean } = {},
    ) => {
      const hospexStorage = getContainer(uri)
      const aclUri = await getAcl(hospexStorage)
      await createAclMutation.mutateAsync({
        uri: aclUri,
        data: [
          {
            '@id': aclUri + '#owner',
            type: set({ '@id': 'Authorization' }),
            accessTo: { '@id': hospexStorage },
            default: { '@id': hospexStorage },
            agent: set({ '@id': webId }),
            mode: set(
              { '@id': 'Read' },
              { '@id': 'Write' },
              { '@id': 'Control' },
            ),
          },
          {
            '@id': aclUri + '#reader',
            type: set({ '@id': 'Authorization' }),
            accessTo: { '@id': hospexStorage },
            default: { '@id': hospexStorage },
            agentGroup: set(
              ...community.groups.map(group => ({ '@id': group })),
            ),
            mode: set({ '@id': 'Read' }),
          },
        ],
        ...options,
      })
    },
    [community.groups, createAclMutation],
  )
}

export const useCreateHospexProfile = () => {
  const createMutation = useCreateRdfDocument(HospexProfileShapeType)
  const createAcl = useCreateHospexProfileAcl()

  return useCallback(
    async ({
      uri,
      webId,
      communityId,
    }: {
      uri: URI
      webId: URI
      communityId: URI
    }) => {
      const hospexStorage = getContainer(uri)
      await createMutation.mutateAsync({
        uri,
        data: {
          '@id': webId,
          memberOf: set({ '@id': communityId }),
          storage2: { '@id': hospexStorage },
        },
      })
      await createAcl({ uri, webId })
    },
    [createAcl, createMutation],
  )
}

export const useCreatePublicTypeIndex = () => {
  const createIndexMutation = useCreateRdfDocument(PublicTypeIndexShapeType)
  const createAclMutation = useCreateRdfDocument(AuthorizationShapeType)
  const updateMutation = useUpdateRdfDocument()

  return useCallback(
    async ({
      webId,
      publicTypeIndex,
    }: {
      webId: URI
      publicTypeIndex: URI
    }) => {
      await createIndexMutation.mutateAsync({
        uri: publicTypeIndex,
        method: 'PUT',
        data: {
          '@id': publicTypeIndex,
          type: set({ '@id': 'TypeIndex' }, { '@id': 'ListedDocument' }),
        },
      })

      const aclUri = await getAcl(publicTypeIndex)

      await createAclMutation.mutateAsync({
        uri: aclUri,
        method: 'PUT',
        data: [
          {
            '@id': aclUri + '#owner',
            type: set({ '@id': 'Authorization' }),
            agent: set({ '@id': webId }),
            accessTo: { '@id': publicTypeIndex },
            mode: set(
              { '@id': 'Read' },
              { '@id': 'Write' },
              { '@id': 'Control' },
            ),
          },
          {
            '@id': aclUri + '#public',
            type: set({ '@id': 'Authorization' }),
            agentClass: set({ '@id': foaf.Agent }),
            accessTo: { '@id': publicTypeIndex },
            mode: set({ '@id': 'Read' }),
          },
        ],
      })

      const patch = `_:mutate a <${solid.InsertDeletePatch}>; <${solid.inserts}> { <${webId}> <${solid.publicTypeIndex}> <${publicTypeIndex}>. }.`

      // create public type index
      await updateMutation.mutateAsync({ uri: webId, patch })
    },
    [createAclMutation, createIndexMutation, updateMutation],
  )
}

export const useCreateInbox = () => {
  const createContainerMutation = useCreateRdfContainer()
  const createAclMutation = useCreateRdfDocument(AuthorizationShapeType)
  const updateMutation = useUpdateRdfDocument()

  return useCallback(
    async ({ webId, inbox }: { webId: URI; inbox: URI }) => {
      await createContainerMutation.mutateAsync({ uri: inbox })

      // create ACL for inbox
      const aclUri = await getAcl(inbox)
      await createAclMutation.mutateAsync({
        uri: aclUri,
        data: [
          {
            '@id': aclUri + '#ControlReadWrite',
            type: set({ '@id': 'Authorization' }),
            agent: set({ '@id': webId }),
            accessTo: { '@id': inbox },
            default: { '@id': inbox },
            mode: set(
              { '@id': 'Read' },
              { '@id': 'Write' },
              { '@id': 'Control' },
            ),
          },
          {
            '@id': aclUri + '#Append',
            type: set({ '@id': 'Authorization' }),
            agentClass: set({ '@id': 'AuthenticatedAgent' }),
            accessTo: { '@id': inbox },
            default: { '@id': inbox },
            mode: set({ '@id': 'Append' }),
          },
        ],
      })

      // create private type index
      await updateMutation.mutateAsync({
        uri: webId,
        patch: `_:mutate a <${solid.InsertDeletePatch}>; <${solid.inserts}> { <${webId}> <${ldp.inbox}> <${inbox}>. }.`,
      })
    },
    [createAclMutation, createContainerMutation, updateMutation],
  )
}

export const useInitEmailNotifications = () => {
  const { emailNotificationsService, emailNotificationsIdentity } = useConfig()
  // Define a mutation function that will handle the API request
  const addActivity = async (requestData: unknown) => {
    const response = await fetch(`${emailNotificationsService}/inbox`, {
      method: 'POST',
      headers: { 'content-type': 'application/ld+json' },
      body: JSON.stringify(requestData),
    })

    if (!response.ok) throw new Error('not ok!')
  }

  const queryClient = useQueryClient()

  const { mutate } = useMutation({
    mutationFn: addActivity,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QueryKey.mailerIntegration] })
    },
  })

  const initializeIntegration = useCallback(
    ({ webId, inbox, email }: { webId: URI; inbox: URI; email: string }) => {
      const requestData = {
        '@context': 'https://www.w3.org/ns/activitystreams',
        '@id': '',
        '@type': 'Add',
        actor: webId,
        object: inbox,
        target: email,
      }

      mutate(requestData)
    },
    [mutate],
  )

  const updateAclMutation = useUpdateLdoDocument(AuthorizationShapeType)

  return useCallback(
    async ({
      email,
      inbox,
      webId,
    }: {
      webId: URI
      inbox: URI
      email: string
    }) => {
      // give mailer read access to inbox
      const inboxAcl = await getAcl(inbox)
      await updateAclMutation.mutateAsync({
        uri: inboxAcl,
        subject: inboxAcl + '#read',
        transform: ldo => {
          ldo['@id'] = inboxAcl + '#read'
          ldo.type = set({ '@id': 'Authorization' })
          ldo.agent ??= set()
          ldo.agent.add({ '@id': emailNotificationsIdentity })
          ldo.accessTo = { '@id': inbox }
          ldo.default = { '@id': inbox }
          ldo.mode ??= set()
          ldo.mode.add({ '@id': 'Read' })
        },
      })
      // initialize integration
      initializeIntegration({
        email,
        inbox,
        webId,
      })
    },
    [emailNotificationsIdentity, initializeIntegration, updateAclMutation],
  )
}

/**
 * Send verification email for direct email notifications
 */
export const useSendVerificationEmail = () => {
  const { emailNotificationsService } = useConfig()
  // Define a mutation function that will handle the API request
  const addActivity = async (requestData: { email: string }) => {
    const response = await fetch(`${emailNotificationsService}/init`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(requestData),
    })

    if (!response.ok)
      throw new HttpError('Sending verification email failed', response)
  }

  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: addActivity,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [QueryKey.simpleMailerIntegration],
      })
    },
  })

  return mutation
}

export const usePreparePodForDirectEmailNotifications = () => {
  const { emailNotificationsIdentity } = useConfig()
  const updateAclMutation = useUpdateLdoDocument(AuthorizationShapeType)
  const updateMutation = useUpdateRdfDocument()
  const updateAcl = useUpdateAcl()

  const preparePodForSimpleEmailNotifications = useCallback(
    async ({
      hospexDocument,
      webId,
      email,
    }: {
      hospexDocument: string
      webId: string
      email: string
    }) => {
      // First find the hospex container for this community
      const hospexContainer = getContainer(hospexDocument)
      // give the mailer read access to the hospex container
      await updateAcl(hospexContainer, [
        {
          operation: 'add',
          access: [AccessMode.Read],
          agents: [emailNotificationsIdentity],
          default: true,
        },
      ])
      // create emailSettings file
      const emailSettings = hospexContainer + 'emailSettings-' + uuidv4()

      const addEmail = `_:mutate a <${solid.InsertDeletePatch}>;
        <${solid.inserts}> { <${webId}> <${foaf.mbox}> "${email}". } .`
      await updateMutation.mutateAsync({
        uri: emailSettings,
        patch: addEmail,
      })

      // give the mailer read & write access to the email settings file
      const emailSettingsAcl = await getAcl(emailSettings)
      await updateAclMutation.mutateAsync({
        uri: emailSettingsAcl,
        subject: emailSettingsAcl + '#owner',
        transform: ldo => {
          ldo['@id'] = emailSettingsAcl + '#owner'
          ldo.type = set({ '@id': 'Authorization' })
          ldo.agent ??= set()
          ldo.agent.add({ '@id': webId })
          ldo.accessTo = { '@id': emailSettings }
          ldo.mode ??= set()
          ldo.mode
            .add({ '@id': 'Read' })
            .add({ '@id': 'Write' })
            .add({ '@id': 'Control' })
        },
      })
      await updateAclMutation.mutateAsync({
        uri: emailSettingsAcl,
        subject: emailSettingsAcl + '#readWriteMailer',
        transform: ldo => {
          ldo['@id'] = emailSettingsAcl + '#readWriteMailer'
          ldo.type = set({ '@id': 'Authorization' })
          ldo.agent ??= set()
          ldo.agent.add({ '@id': emailNotificationsIdentity })
          ldo.accessTo = { '@id': emailSettings }
          ldo.mode ??= set()
          ldo.mode.add({ '@id': 'Read' }).add({ '@id': 'Write' })
        },
      })

      // put the triple person -> settings -> email file to hospexDocument
      const patch = `_:mutate a <${solid.InsertDeletePatch}>;
        <${solid.inserts}> { <${webId}> <${space.preferencesFile}> <${emailSettings}>. } .`
      await updateMutation.mutateAsync({
        uri: hospexDocument,
        patch,
      })
    },
    [emailNotificationsIdentity, updateAcl, updateAclMutation, updateMutation],
  )
  return preparePodForSimpleEmailNotifications
}
