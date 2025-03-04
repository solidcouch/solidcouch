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
import { BasicLdSet } from '@ldo/jsonld-dataset-proxy'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { acl, foaf, ldp, solid, space } from 'rdf-namespaces'
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

const saveTypeRegistration = async ({
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

export const useCreatePrivateTypeIndex = () => {
  const createMutation = useCreateRdfDocument(PrivateTypeIndexShapeType)
  const updateMutation = useUpdateRdfDocument()

  return useCallback(
    async ({
      webId,
      privateTypeIndex,
    }: {
      webId: URI
      privateTypeIndex: URI
    }) => {
      await createMutation.mutateAsync({
        uri: privateTypeIndex,
        data: {
          '@id': privateTypeIndex,
          type: new BasicLdSet([
            { '@id': 'TypeIndex' },
            { '@id': 'UnlistedDocument' },
          ]),
        },
      })

      const patch = `_:mutate a <${solid.InsertDeletePatch}>; <${solid.inserts}> { <${webId}> <${solid.privateTypeIndex}> <${privateTypeIndex}>. }.`

      // create private type index
      await updateMutation.mutateAsync({ uri: webId, patch })
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
          ldo.memberOf?.add({ '@id': communityId })
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
            type: { '@id': 'Authorization' },
            accessTo: new BasicLdSet([{ '@id': hospexStorage }]),
            default: { '@id': hospexStorage },
            agent: new BasicLdSet([{ '@id': webId }]),
            mode: new BasicLdSet([
              { '@id': acl.Read },
              { '@id': acl.Write },
              { '@id': acl.Control },
            ]),
          },
          {
            '@id': aclUri + '#reader',
            type: { '@id': 'Authorization' },
            accessTo: new BasicLdSet([{ '@id': hospexStorage }]),
            default: { '@id': hospexStorage },
            agentGroup: new BasicLdSet(
              community.groups.map(group => ({ '@id': group })),
            ),
            mode: new BasicLdSet([{ '@id': acl.Read }]),
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
          memberOf: new BasicLdSet([{ '@id': communityId }]),
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
          type: new BasicLdSet([
            { '@id': 'TypeIndex' },
            { '@id': 'ListedDocument' },
          ]),
        },
      })

      const aclUri = await getAcl(publicTypeIndex)

      await createAclMutation.mutateAsync({
        uri: aclUri,
        method: 'PUT',
        data: [
          {
            '@id': aclUri + '#owner',
            type: { '@id': 'Authorization' },
            agent: new BasicLdSet([{ '@id': webId }]),
            accessTo: new BasicLdSet([{ '@id': publicTypeIndex }]),
            mode: new BasicLdSet([
              { '@id': acl.Read },
              { '@id': acl.Write },
              { '@id': acl.Control },
            ]),
          },
          {
            '@id': aclUri + '#public',
            type: { '@id': 'Authorization' },
            agentClass: new BasicLdSet([{ '@id': foaf.Agent }]),
            accessTo: new BasicLdSet([{ '@id': publicTypeIndex }]),
            mode: new BasicLdSet([{ '@id': acl.Read }]),
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
            type: { '@id': 'Authorization' },
            agent: new BasicLdSet([{ '@id': webId }]),
            accessTo: new BasicLdSet([{ '@id': inbox }]),
            default: { '@id': inbox },
            mode: new BasicLdSet([
              { '@id': acl.Read },
              { '@id': acl.Write },
              { '@id': acl.Control },
            ]),
          },
          {
            '@id': aclUri + '#Append',
            type: { '@id': 'Authorization' },
            agentClass: new BasicLdSet([{ '@id': acl.AuthenticatedAgent }]),
            accessTo: new BasicLdSet([{ '@id': inbox }]),
            default: { '@id': inbox },
            mode: new BasicLdSet([{ '@id': acl.Append }]),
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
          ldo.type = { '@id': 'Authorization' }

          ldo.agent?.add({ '@id': emailNotificationsIdentity })
          ldo.accessTo.add({ '@id': inbox })
          ldo.default = { '@id': inbox }
          ldo.mode?.add({ '@id': acl.Read })
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
export const useVerifyEmail = () => {
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
          ldo.type = { '@id': 'Authorization' }
          ldo.agent?.add({ '@id': webId })
          ldo.accessTo.add({ '@id': emailSettings })
          ldo.mode
            ?.add({ '@id': acl.Read })
            .add({ '@id': acl.Write })
            .add({ '@id': acl.Control })
        },
      })
      await updateAclMutation.mutateAsync({
        uri: emailSettingsAcl,
        subject: emailSettingsAcl + '#readWriteMailer',
        transform: ldo => {
          ldo['@id'] = emailSettingsAcl + '#readWriteMailer'
          ldo.type = { '@id': 'Authorization' }
          ldo.agent?.add({ '@id': emailNotificationsIdentity })
          ldo.accessTo.add({ '@id': emailSettings })
          ldo.mode?.add({ '@id': acl.Read }).add({ '@id': acl.Write })
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
