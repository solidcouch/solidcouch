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
import { getContainer } from 'utils/helpers'
import { acl, foaf, hospex, solid } from 'utils/rdf-namespaces'
import * as uuid from 'uuid'
import { useReadCommunity } from './useCommunity'
import {
  useCreateRdfDocument,
  useUpdateLdoDocument,
  useUpdateRdfDocument,
} from './useRdfDocument'

export type SetupTask =
  | 'createPublicTypeIndex'
  | 'createPrivateTypeIndex'
  | 'createHospexProfile'
export type SetupSettings = {
  person: URI
  publicTypeIndex: URI
  privateTypeIndex: URI
  hospexDocument: URI
}

export const useSetupHospex = () => {
  const createPrivateTypeIndex = useCreatePrivateTypeIndex()
  const createPublicTypeIndex = useCreatePublicTypeIndex()
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
      const aclUri = hospexStorage + '.acl'
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
        data: {
          '@id': publicTypeIndex,
          type: [{ '@id': 'TypeIndex' }, { '@id': 'ListedDocument' }],
        },
      })

      await createAclMutation.mutateAsync({
        uri: publicTypeIndex + '.acl',
        data: [
          {
            '@id': publicTypeIndex + '#owner',
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
            '@id': publicTypeIndex + '#public',
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
