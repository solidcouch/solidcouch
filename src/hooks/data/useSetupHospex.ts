import { communityId } from 'config'
import {
  HospexProfileShapeType,
  PrivateTypeIndexShapeType,
  PublicTypeIndexShapeType,
} from 'ldo/app.shapeTypes'
import { PrivateTypeIndex, PublicTypeIndex } from 'ldo/app.typings'
import { AuthorizationShapeType } from 'ldo/wac.shapeTypes'
import { useCallback } from 'react'
import { URI } from 'types'
import { getAcl, getContainer } from 'utils/helpers'
import { acl, foaf, hospex, ldp, solid } from 'utils/rdf-namespaces'
import * as uuid from 'uuid'
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
export type SetupSettings = {
  person: URI
  publicTypeIndex: URI
  privateTypeIndex: URI
  inbox: URI
  hospexDocument: URI
}

export const useSetupHospex = () => {
  const createPrivateTypeIndex = useCreatePrivateTypeIndex()
  const createPublicTypeIndex = useCreatePublicTypeIndex()
  const createInbox = useCreateInbox()
  const createHospexProfile = useCreateHospexProfile()
  const saveTypeRegistration = useSaveTypeRegistration()

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
      }: SetupSettings,
    ) => {
      // create personal hospex document at hospex/sleepy-bike/card folder
      // in home folder (pim:storage)
      if (tasks.includes('createHospexProfile'))
        await createHospexProfile({
          uri: hospexDocument,
          webId: person,
          communityId,
        })

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
    },
    [
      createHospexProfile,
      createInbox,
      createPrivateTypeIndex,
      createPublicTypeIndex,
      saveTypeRegistration,
    ],
  )
}

export const useSaveTypeRegistration = (isPrivate = false) => {
  const updatePrivateMutation = useUpdateLdoDocument(PrivateTypeIndexShapeType)
  const updatePublicMutation = useUpdateLdoDocument(PublicTypeIndexShapeType)
  const updateMutation = isPrivate
    ? updatePrivateMutation
    : updatePublicMutation

  return useCallback(
    async ({
      index,
      type,
      location,
    }: {
      index: URI
      type: URI
      location: URI
    }) => {
      const transform = (ldo: PublicTypeIndex | PrivateTypeIndex) => {
        let referenceIndex =
          ldo.references?.findIndex(ref =>
            ref.forClass.some(fc => fc['@id'] === type),
          ) ?? -1
        if (referenceIndex === -1) {
          ldo.references ??= []
          referenceIndex =
            ldo.references.push({
              '@id': index + '#' + uuid.v4(),
              type: { '@id': 'TypeRegistration' },
              forClass: [{ '@id': type }],
            }) - 1
        }

        const isForContainer = location.endsWith('/')
        const reference = ldo.references![referenceIndex]
        if (isForContainer) {
          reference.instanceContainer ??= []
          reference.instanceContainer.push({ '@id': location })
        } else {
          reference.instance ??= []
          reference.instance.push({ '@id': location })
        }
      }

      await updateMutation.mutateAsync({
        uri: index,
        subject: index,
        transform,
      })
    },
    [updateMutation],
  )
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

const useCreateHospexProfile = () => {
  const createMutation = useCreateRdfDocument(HospexProfileShapeType)
  const createAclMutation = useCreateRdfDocument(AuthorizationShapeType)
  const community = useReadCommunity(communityId)

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
          memberOf: { '@id': communityId },
          storage2: { '@id': hospexStorage },
        },
      })
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
      })
    },
    [community.groups, createAclMutation, createMutation],
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
