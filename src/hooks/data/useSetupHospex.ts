import { useConfig } from '@/config/hooks'
import { useAuth } from '@/hooks/useAuth'
import {
  HospexProfileShapeType,
  PrivateTypeIndexShapeType,
  PublicTypeIndexShapeType,
} from '@/ldo/app.shapeTypes'
import { AuthorizationShapeType } from '@/ldo/wac.shapeTypes'
import { URI } from '@/types'
import { HttpError } from '@/utils/errors'
import { fullFetch, getAcl, getContainer, processAcl } from '@/utils/helpers'
import { hospex } from '@/utils/rdf-namespaces'
import { fetch } from '@inrupt/solid-client-authn-browser'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { NamedNode, Quad, Writer } from 'n3'
import { acl, foaf, ldp, rdf, solid, space } from 'rdf-namespaces'
import { useCallback } from 'react'
import { v4 as uuidv4 } from 'uuid'
import { useReadCommunity } from './useCommunity'
import {
  useCreateRdfContainer,
  useCreateRdfDocument,
  useUpdateLdoDocument,
  useUpdateRdfDocument,
} from './useRdfDocument'

export type SetupTask =
  | 'createPublicTypeIndex'
  | 'createPrivateTypeIndex'
  | 'createInbox'
  | 'createHospexProfile'
  | 'addToHospexProfile'
  | 'integrateEmailNotifications'
  | 'integrateSimpleEmailNotifications'
export type SetupSettings = {
  person: URI
  publicTypeIndex: URI
  privateTypeIndex: URI
  inbox: URI
  hospexDocument: URI
  email: string
}

export const useSetupHospex = () => {
  const { communityId } = useConfig()
  const createPrivateTypeIndex = useCreatePrivateTypeIndex()
  const createPublicTypeIndex = useCreatePublicTypeIndex()
  const createInbox = useCreateInbox()
  const createHospexProfile = useCreateHospexProfile()
  const addToHospexProfile = useAddToHospexProfile()
  const saveTypeRegistration = useSaveTypeRegistration()
  const initEmailNotifications = useInitEmailNotifications()
  const initSimpleEmailNotifications = useInitSimpleEmailNotifications()

  const { webId } = useAuth()

  // TODO add options so users can have a choice
  return useCallback(
    async (
      tasks: SetupTask[],
      {
        person,
        publicTypeIndex,
        privateTypeIndex,
        hospexDocument,
        inbox,
        email,
      }: SetupSettings,
    ) => {
      // create personal hospex document at hospex/{communityContainer}/card
      // in home folder (pim:storage)
      if (tasks.includes('createHospexProfile'))
        await createHospexProfile({
          uri: hospexDocument,
          webId: person,
          communityId,
        })

      if (tasks.includes('addToHospexProfile'))
        await addToHospexProfile({ uri: hospexDocument, webId: person })

      // create type indexes if we haven't found them
      if (tasks.includes('createPrivateTypeIndex')) {
        await createPrivateTypeIndex({
          webId: person,
          privateTypeIndex,
        })
      }
      if (tasks.includes('createPublicTypeIndex')) {
        await createPublicTypeIndex({
          webId: person,
          publicTypeIndex,
        })
      }

      // create inbox
      if (tasks.includes('createInbox')) {
        await createInbox({
          webId: person,
          inbox,
        })
      }

      // save hospex datatype to public type index
      if (
        tasks.includes('createHospexProfile') ||
        tasks.includes('createPublicTypeIndex')
      )
        await saveTypeRegistration({
          index: publicTypeIndex,
          type: hospex.PersonalHospexDocument,
          location: hospexDocument,
        })

      if (tasks.includes('integrateEmailNotifications'))
        await initEmailNotifications({ email, inbox, webId: webId as string })
      if (tasks.includes('integrateSimpleEmailNotifications'))
        await initSimpleEmailNotifications({
          email,
          webId: webId as string,
          hospexDocument,
        })
    },
    [
      addToHospexProfile,
      communityId,
      createHospexProfile,
      createInbox,
      createPrivateTypeIndex,
      createPublicTypeIndex,
      initEmailNotifications,
      initSimpleEmailNotifications,
      saveTypeRegistration,
      webId,
    ],
  )
}

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
      queryClient.invalidateQueries({ queryKey: ['rdfDocument', index] })
    },
  }).mutateAsync
}

const useCreatePrivateTypeIndex = () => {
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
          type: [{ '@id': 'TypeIndex' }, { '@id': 'UnlistedDocument' }],
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
const useAddToHospexProfile = () => {
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
          ldo.memberOf ??= []
          ldo.memberOf.push({ '@id': communityId })
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
            access: ['Read'],
            agentGroups: community.groups,
            default: true,
          },
        ])
      }
    },
    [community.groups, communityId, createAcl, updateAcl, updateMutation],
  )
}

const useUpdateAcl = () => {
  const updateAclMutation = useUpdateRdfDocument()

  return useCallback(
    async (
      uri: string, // uri of the document or container whose acl we want to update
      operations: {
        // operations to perform
        operation: 'add'
        access: ('Read' | 'Append' | 'Write' | 'Control')[] // add to this access
        default?: boolean
        agentGroups?: URI[]
        agents?: URI[]
      }[],
      // options: { throwOnHttpError?: boolean } = {},
    ) => {
      const aclUri = await getAcl(uri)
      const aclResponse = await fullFetch(aclUri)
      const aclBody = await aclResponse.text()

      const authorizations = processAcl(aclUri, aclBody)

      const writer = new Writer({ format: 'N-Triples' })

      for (const operation of operations) {
        operation.agents ??= []
        operation.agentGroups ??= []
        // find relevant access
        const auth = authorizations.find(a => {
          const expectedAccess = new Set(operation.access)
          const actualAccess = new Set(a.accesses)

          return expectedAccess.size === actualAccess.size &&
            [...expectedAccess].every(aa => actualAccess.has(aa)) &&
            operation.default
            ? a.defaults.includes(uri)
            : a.defaults.length === 0
        })

        const getNewAuthUrl = (uri: string) => {
          const newAuthURL = new URL(uri)
          newAuthURL.hash = uuidv4()
          return newAuthURL.toString()
        }

        const authUrl = auth?.url ?? getNewAuthUrl(aclUri)

        const authNode = new NamedNode(authUrl)

        writer.addQuads(
          operation.agentGroups.map(
            ag =>
              new Quad(
                authNode,
                new NamedNode(acl.agentGroup),
                new NamedNode(ag),
              ),
          ),
        )
        writer.addQuads(
          operation.agents.map(
            a => new Quad(authNode, new NamedNode(acl.agent), new NamedNode(a)),
          ),
        )

        if (!auth) {
          // untested!
          writer.addQuads([
            new Quad(
              authNode,
              new NamedNode(rdf.type),
              new NamedNode(acl.Authorization),
            ),
            new Quad(authNode, new NamedNode(acl.accessTo), new NamedNode(uri)),
            ...operation.access.map(
              a =>
                new Quad(
                  authNode,
                  new NamedNode(acl.mode),
                  new NamedNode(acl[a]),
                ),
            ),
          ])
          if (operation.default)
            writer.addQuads([
              new Quad(
                authNode,
                new NamedNode(acl.default__workaround),
                new NamedNode(uri),
              ),
            ])
        }
      }

      const insertions = await new Promise<string>((resolve, reject) => {
        writer.end((error, result) => {
          if (error) reject(error)
          else resolve(result)
        })
      })

      await updateAclMutation.mutateAsync({
        uri: aclUri,
        patch: `
        @prefix foaf: <http://xmlns.com/foaf/0.1/>.
        @prefix solid: <http://www.w3.org/ns/solid/terms#>.
        _:mutation a solid:InsertDeletePatch;
          solid:inserts {
            ${insertions}
          } .`,
      })
    },
    [updateAclMutation],
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
            accessTo: [{ '@id': hospexStorage }],
            default: { '@id': hospexStorage },
            agent: [{ '@id': webId }],
            mode: [
              { '@id': acl.Read },
              { '@id': acl.Write },
              { '@id': acl.Control },
            ],
          },
          {
            '@id': aclUri + '#reader',
            type: { '@id': 'Authorization' },
            accessTo: [{ '@id': hospexStorage }],
            default: { '@id': hospexStorage },
            agentGroup: community.groups.map(group => ({ '@id': group })),
            mode: [{ '@id': acl.Read }],
          },
        ],
        ...options,
      })
    },
    [community.groups, createAclMutation],
  )
}

const useCreateHospexProfile = () => {
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
          memberOf: [{ '@id': communityId }],
          storage2: { '@id': hospexStorage },
        },
      })
      await createAcl({ uri, webId })
    },
    [createAcl, createMutation],
  )
}

const useCreatePublicTypeIndex = () => {
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
          type: [{ '@id': 'TypeIndex' }, { '@id': 'ListedDocument' }],
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
            agent: [{ '@id': webId }],
            accessTo: [{ '@id': publicTypeIndex }],
            mode: [
              { '@id': acl.Read },
              { '@id': acl.Write },
              { '@id': acl.Control },
            ],
          },
          {
            '@id': aclUri + '#public',
            type: { '@id': 'Authorization' },
            agentClass: [{ '@id': foaf.Agent }],
            accessTo: [{ '@id': publicTypeIndex }],
            mode: [{ '@id': acl.Read }],
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

const useCreateInbox = () => {
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
            agent: [{ '@id': webId }],
            accessTo: [{ '@id': inbox }],
            default: { '@id': inbox },
            mode: [
              { '@id': acl.Read },
              { '@id': acl.Write },
              { '@id': acl.Control },
            ],
          },
          {
            '@id': aclUri + '#Append',
            type: { '@id': 'Authorization' },
            agentClass: [{ '@id': acl.AuthenticatedAgent }],
            accessTo: [{ '@id': inbox }],
            default: { '@id': inbox },
            mode: [{ '@id': acl.Append }],
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

const useInitEmailNotifications = () => {
  const { emailNotificationsService, emailNotificationsIdentity } = useConfig()
  // Define a mutation function that will handle the API request
  const addActivity = async (requestData: unknown) => {
    const response = await fetch(`${emailNotificationsService}/inbox`, {
      method: 'post',
      headers: { 'content-type': 'application/ld+json' },
      body: JSON.stringify(requestData),
    })

    if (!response.ok) throw new Error('not ok!')
  }

  const queryClient = useQueryClient()

  const { mutate } = useMutation({
    mutationFn: addActivity,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mailerIntegration'] })
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

          ldo.agent = [{ '@id': emailNotificationsIdentity }]
          ldo.accessTo = [{ '@id': inbox }]
          ldo.default = { '@id': inbox }
          ldo.mode = [{ '@id': acl.Read }]
        },
      })
      // initialize integration
      await initializeIntegration({
        email,
        inbox,
        webId,
      })
    },
    [emailNotificationsIdentity, initializeIntegration, updateAclMutation],
  )
}

const useInitSimpleEmailNotifications = () => {
  const { emailNotificationsService } = useConfig()
  // Define a mutation function that will handle the API request
  const addActivity = async (requestData: unknown) => {
    const response = await fetch(`${emailNotificationsService}/init`, {
      method: 'post',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(requestData),
    })

    if (!response.ok) throw new Error('not ok!')
  }

  const queryClient = useQueryClient()
  const preparePodForSimpleEmailNotifications =
    usePreparePodForSimpleEmailNotifications()

  const { mutate } = useMutation({
    mutationFn: addActivity,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['simpleMailerIntegration'] })
    },
  })

  const initializeIntegration = useCallback(
    ({ email }: { email: string }) => {
      const requestData = { email }

      mutate(requestData)
    },
    [mutate],
  )

  return useCallback(
    async ({
      email,
      webId,
      hospexDocument,
    }: {
      webId: URI
      email: string
      hospexDocument: string
    }) => {
      // give mailer read and write access to email settings, as needed
      await preparePodForSimpleEmailNotifications({
        hospexDocument,
        webId,
        email,
      })
      // initialize integration
      await initializeIntegration({ email })
    },
    [initializeIntegration, preparePodForSimpleEmailNotifications],
  )
}

// TODO this method runs very carelessly
// in particular, we don't want to overwrite existing resources or data
const usePreparePodForSimpleEmailNotifications = () => {
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
      await updateAcl(getContainer(hospexDocument), [
        {
          operation: 'add',
          access: ['Read'],
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
          ldo.agent = [{ '@id': webId }]
          ldo.accessTo = [{ '@id': emailSettings }]
          ldo.mode = [
            { '@id': acl.Read },
            { '@id': acl.Write },
            { '@id': acl.Control },
          ]
        },
      })
      await updateAclMutation.mutateAsync({
        uri: emailSettingsAcl,
        subject: emailSettingsAcl + '#readWriteMailer',
        transform: ldo => {
          ldo['@id'] = emailSettingsAcl + '#readWriteMailer'
          ldo.type = { '@id': 'Authorization' }
          ldo.agent = [{ '@id': emailNotificationsIdentity }]
          ldo.accessTo = [{ '@id': emailSettings }]
          ldo.mode = [{ '@id': acl.Read }, { '@id': acl.Write }]
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
