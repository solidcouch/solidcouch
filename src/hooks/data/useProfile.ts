import {
  FoafProfileShapeType,
  HospexProfileShapeType,
  SolidProfileShapeType,
} from '@/ldo/app.shapeTypes'
import { FoafProfile, HospexProfile } from '@/ldo/app.typings'
import { Person, URI } from '@/types'
import { addLanguagesToLdo, getLanguages, ldo2json } from '@/utils/ldo'
import { fetch } from '@inrupt/solid-client-authn-browser'
import { useLdhopQuery } from '@ldhop/react'
import { createLdoDataset } from '@ldo/ldo'
import merge from 'lodash/merge'
import { NamedNode, Store } from 'n3'
import { foaf, solid } from 'rdf-namespaces'
import { useCallback, useMemo } from 'react'
import { hospexDocumentQuery, webIdProfileQuery } from './queries'
import { useUpdateLdoDocument, useUpdateRdfDocument } from './useRdfDocument'

export const useProfile = (webId: URI, communityId: URI) => {
  const hospexDocumentQueryOutput = useLdhopQuery(
    useMemo(
      () => ({
        query: hospexDocumentQuery,
        variables: { person: [webId], community: [communityId] },
        fetch,
      }),
      [communityId, webId],
    ),
  )

  const { variables, isLoading } = hospexDocumentQueryOutput

  const foafProfileQueryOutput = useLdhopQuery(
    useMemo(
      () => ({
        query: webIdProfileQuery,
        variables: { person: [webId] },
        fetch,
      }),
      [webId],
    ),
  )

  // keep the data from hospex document separate from generic foaf profile
  // can we generalize this pattern? (using only part of the fetched dataset)
  // we also do this because of the issue in LDO - when we expect one name but there are multiple, the result contains array, not a single result
  // https://github.com/o-development/ldo/issues/22#issuecomment-1590228592

  const hospexProfiles = useMemo(() => {
    const hospexDocuments = variables.hospexDocumentForCommunity ?? new Set()

    const hospexGraphs = Array.from(hospexDocuments).map(hospexDocument =>
      new Store(hospexDocumentQueryOutput.quads).getQuads(
        null,
        null,
        null,
        hospexDocument,
      ),
    )

    const hospexLdos = hospexGraphs.map(hospexGraph =>
      createLdoDataset(hospexGraph)
        .usingType(HospexProfileShapeType)
        .fromSubject(webId),
    )

    return hospexLdos
  }, [
    hospexDocumentQueryOutput.quads,
    variables.hospexDocumentForCommunity,
    webId,
  ])

  // const hospexLdos = useMemo(
  //   () =>
  //     (queryStatus.data ?? [])
  //       .flatMap(a => a ?? [])
  //       .filter(a => hospexDocuments.includes(a.response.url))
  //       .map(a => ({
  //         ldo: createLdoDataset(a.data ?? [])
  //           .usingType(HospexProfileShapeType)
  //           .fromSubject(webId),
  //         document: a.response.url,
  //       }))
  //       .filter(a => a.ldo.memberOf?.['@id'] === communityId),
  //   [communityId, hospexDocuments, queryStatus.data, webId],
  // )

  const foafProfile = useMemo(() => {
    const { quads } = foafProfileQueryOutput
    const foafLdo = createLdoDataset(quads)
      .usingType(FoafProfileShapeType)
      .fromSubject(webId)
    return foafLdo
  }, [foafProfileQueryOutput, webId])

  // we convert LDOs to pure objects before merging for better performance
  // merging LDOs took up to several seconds when data were complex (e.g. with Trinpod)
  const mergedProfile: FoafProfile & HospexProfile = useMemo(
    () =>
      merge(
        {},
        ldo2json(foafProfile),
        ...hospexProfiles.map(hp => ldo2json(hp)),
      ),
    [foafProfile, hospexProfiles],
  )
  const about = useMemo(
    () => (hospexProfiles[0] ? getLanguages(hospexProfiles[0], 'note') : {}),
    [hospexProfiles],
  )

  const profile: Person = useMemo(
    () => ({
      id: webId,
      name: mergedProfile.name ?? '',
      photo: mergedProfile.hasPhoto?.['@id'],
      about,
      interests: mergedProfile.topicInterest?.map(i => i['@id']) ?? [],
    }),
    [
      about,
      mergedProfile.hasPhoto,
      mergedProfile.name,
      mergedProfile.topicInterest,
      webId,
    ],
  )

  const hospexProfileFormatted: Person | undefined = useMemo(
    () =>
      hospexProfiles.length > 0
        ? {
            id: webId,
            name: hospexProfiles[0]?.name ?? '',
            photo: hospexProfiles[0]?.hasPhoto?.['@id'],
            about,
          }
        : undefined,
    [about, hospexProfiles, webId],
  )

  const interestsWithDocuments = useMemo(
    () =>
      new Store(hospexDocumentQueryOutput.quads)
        .getQuads(
          new NamedNode(webId),
          new NamedNode(foaf.topic_interest),
          null,
          null,
        )
        .map(quad => ({ id: quad.object.id, document: quad.graph.id })),
    [hospexDocumentQueryOutput, webId],
  )

  return useMemo(
    () =>
      [
        profile,
        isLoading,
        Array.from(variables.hospexDocumentForCommunity ?? [])[0]?.value,
        interestsWithDocuments,
        hospexProfileFormatted,
      ] as const,
    [
      hospexProfileFormatted,
      interestsWithDocuments,
      isLoading,
      profile,
      variables.hospexDocumentForCommunity,
    ],
  )
}

export const useSolidProfile = (person: URI) => {
  const { quads, isFetching, isLoading } = useLdhopQuery(
    useMemo(
      () => ({
        query: webIdProfileQuery,
        variables: { person: [person] },
        fetch,
      }),
      [person],
    ),
  )

  const output = useMemo(() => {
    const dataset = createLdoDataset(quads)
    const profile = dataset.usingType(SolidProfileShapeType).fromSubject(person)
    return [profile, { isLoading, isFetching }] as const
  }, [isFetching, isLoading, person, quads])
  return output
}

export const useUpdateHospexProfile = () => {
  const updateHospexProfileMutation = useUpdateLdoDocument(
    HospexProfileShapeType,
  )

  return useCallback(
    async ({
      personId,
      hospexDocument,
      data,
    }: {
      personId: URI
      hospexDocument: URI
      data: Partial<Pick<Person, 'name' | 'photo' | 'about'>>
    }) => {
      await updateHospexProfileMutation.mutateAsync({
        uri: hospexDocument,
        subject: personId,
        language: 'en',
        transform: person => {
          if (data.name) person.name = data.name
          // update all languages of note (about)
          if (data.about) addLanguagesToLdo(data.about, person, 'note')
          if (data.photo) person.hasPhoto = { '@id': data.photo }
        },
      })
    },
    [updateHospexProfileMutation],
  )
}

export const useAddInterest = () => {
  const updateMutation = useUpdateRdfDocument()
  return useCallback(
    async ({
      person,
      document: doc,
      interest,
    }: {
      person: URI
      document: URI
      interest: URI
    }) => {
      const patch = `_:mutate a <${solid.InsertDeletePatch}>;
        <${solid.inserts}> { <${person}> <${foaf.topic_interest}> <${interest}>. } .`
      await updateMutation.mutateAsync({ uri: doc, patch })
    },
    [updateMutation],
  )
}

export const useRemoveInterest = () => {
  const updateMutation = useUpdateRdfDocument()
  return useCallback(
    async ({
      person,
      document: doc,
      interest,
    }: {
      person: URI
      document: URI
      interest: URI
    }) => {
      const patch = `_:mutate a <${solid.InsertDeletePatch}>;
        <${solid.deletes}> { <${person}> <${foaf.topic_interest}> <${interest}>. } .`
      await updateMutation.mutateAsync({
        uri: doc,
        patch,
      })
    },
    [updateMutation],
  )
}
