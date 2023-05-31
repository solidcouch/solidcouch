import { communityId } from 'config'
import { parseRdf, startTransaction } from 'ldo'
import {
  HospexProfileShapeType,
  PrivateTypeIndexShapeType,
  PublicTypeIndexShapeType,
} from 'ldo/app.shapeTypes'
import {
  PrivateTypeIndex,
  PublicTypeIndex,
  SolidProfile,
} from 'ldo/app.typings'
import { SolidProfileShapeType } from 'ldo/solidProfile.shapeTypes'
import { AuthorizationShapeType } from 'ldo/wac.shapeTypes'
import { minBy } from 'lodash'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { URI } from 'types'
import { fullFetch, getContainer } from 'utils/helpers'
import { toN3Patch } from 'utils/ldo'
import { acl, foaf, hospex, solid, space } from 'utils/rdf-namespaces'
import * as uuid from 'uuid'
import { useReadCommunity } from './data/useCheckSetup'
import {
  useCreateRdfDocument,
  useUpdateRdfDocument,
} from './data/useRdfDocument'
import { useRdfDocuments, useRdfQuery } from './data/useRdfQuery'
import { useAuth } from './useAuth'

export const useSetupHospex = () => {
  const createPrivateTypeIndex = useCreatePrivateTypeIndex()
  const createPublicTypeIndex = useCreatePublicTypeIndex()
  const createHospexProfile = useCreateHospexProfile()
  const saveTypeRegistration = useSaveTypeRegistration()
  const auth = useAuth()
  const storage = useStorage(auth.webId ?? '')
  const [solidProfile] = useProfile(auth.webId ?? '')

  // TODO add options so users can have a choice
  return useCallback(async () => {
    if (!auth.webId) throw new Error("We couldn't find your webId")

    // try to find hospex document
    // create personal hospex document at hospex/sleepy-bike/card folder
    // in home folder (pim:storage)

    if (!storage) throw new Error("We couldn't find your storage")

    const sleepyBikeFolder = storage + 'hospex/sleepy-bike/'

    await createHospexProfile({
      uri: sleepyBikeFolder + 'card',
      webId: auth.webId,
      communityId,
    })

    // create type indexes if we haven't found them
    let publicTypeIndex = solidProfile?.publicTypeIndex?.[0]?.['@id']
    let privateTypeIndex = solidProfile?.privateTypeIndex?.[0]?.['@id']

    if (!privateTypeIndex) {
      await createPrivateTypeIndex({
        webId: auth.webId ?? '',
        privateTypeIndex: `${storage}settings/privateTypeIndex.ttl`,
      })
    }

    if (!publicTypeIndex) {
      await createPublicTypeIndex({
        webId: auth.webId as string,
        publicTypeIndex: storage + 'settings/publicTypeIndex.ttl',
      })
    }

    // save hospex datatype to public type index
    const index = publicTypeIndex ?? storage + 'settings/publicTypeIndex.ttl'

    await saveTypeRegistration({
      index,
      type: hospex.PersonalHospexDocument,
      location: sleepyBikeFolder + 'card',
    })
  }, [
    auth.webId,
    createHospexProfile,
    createPrivateTypeIndex,
    createPublicTypeIndex,
    saveTypeRegistration,
    solidProfile?.privateTypeIndex,
    solidProfile?.publicTypeIndex,
    storage,
  ])
}

export const useSaveTypeRegistration = (isPrivate = true) => {
  const updateMutation = useUpdateRdfDocument()
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
      const indexResponse = await fullFetch(index)
      const indexData = await indexResponse.text()
      const ldoDataset = await parseRdf(indexData, { baseIRI: index })
      let ldo: PublicTypeIndex | PrivateTypeIndex
      ldo = isPrivate
        ? ldoDataset.usingType(PrivateTypeIndexShapeType).fromSubject(index)
        : ldoDataset.usingType(PublicTypeIndexShapeType).fromSubject(index)

      startTransaction(ldo)
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

      const patch = await toN3Patch(ldo)
      await updateMutation.mutateAsync({
        uri: index,
        patch,
      })
    },
    [isPrivate, updateMutation],
  )
}

const profileQuery = [
  ['?me', (a: string) => a, '?profile', SolidProfileShapeType],
  ['?profile', 'seeAlso', '?profileDocument'],
  ['?profileDocument'],
] as const

export const useProfile = (me: URI) => {
  const params = useMemo(() => ({ me }), [me])
  const [results, queryStatus] = useRdfQuery(profileQuery, params)
  return [results.profile[0] as SolidProfile | undefined, queryStatus] as const
}

export const useStorage = (me: URI) => {
  const [profile, queryStatus] = useProfile(me)
  const [rootStorage] = useRootStorage(me)
  const storages = profile?.storage?.map(s => s['@id']) ?? []
  if (queryStatus.isFetched) return storages[0] ?? rootStorage
}

const useRootStorage = (me: URI) => {
  const [resources, setResources] = useState<URI[]>([getContainer(me)])
  const [storage, setStorage] = useState<URI>()
  const results = useRdfDocuments(resources)
  const outcomes = useMemo(
    () => results.map(res => res.data?.response.headers.get('Link')),
    [results],
  )

  useEffect(() => {
    const storageIndex = outcomes.findIndex(outcome =>
      outcome?.includes(space.Storage),
    )
    if (storageIndex > -1) {
      setStorage(resources[storageIndex])
    } else if (results.every(r => r.isSuccess || r.isError)) {
      setResources(state => {
        // get shortest of the resources and get its parent if available
        const shortest = minBy(state, str => str.length)
        if (shortest) {
          const parent = getParent(shortest)
          if (!state.includes(parent)) return [...state, parent]
        }
        return state
      })
    }
  }, [outcomes, resources, results])

  const inProgress =
    !results.every(r => r.isSuccess || r.isError) ||
    results.length < resources.length

  return [storage, inProgress]
}

const getParent = (uri: URI): URI => {
  const url = new URL(uri)
  if (url.pathname.length === 0 || url.pathname === '/') return uri
  const pathPieces = url.pathname.split('/').slice(0, -2)
  pathPieces.push('')
  url.pathname = pathPieces.join('/')

  return url.toString()
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
