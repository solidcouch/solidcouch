import { fetch } from '@inrupt/solid-client-authn-browser'
import { useLDhopQuery } from '@ldhop/react'
import { createLdoDataset, languagesOf } from '@ldo/ldo'
import '@szhsin/react-menu/dist/index.css'
import '@szhsin/react-menu/dist/transitions/slide.css'
import {
  FoafProfileShapeType,
  HospexProfileShapeType,
  SolidProfileShapeType,
} from 'ldo/app.shapeTypes'
import { FoafProfile, HospexProfile } from 'ldo/app.typings'
import { merge } from 'lodash'
import { NamedNode } from 'n3'
import { useCallback, useMemo } from 'react'
import { Person, URI } from 'types'
import { ldo2json } from 'utils/ldo'
import { foaf, solid } from 'utils/rdf-namespaces'
import {
  hospexDocumentQuery,
  profileDocuments,
  webIdProfileQuery,
} from './queries'
import { useUpdateLdoDocument, useUpdateRdfDocument } from './useRdfDocument'

export const useProfile = (webId: URI, communityId: URI) => {
  const hospexDocumentQueryOutput = useLDhopQuery(
    useMemo(
      () => ({
        query: hospexDocumentQuery,
        variables: { person: webId ? [webId] : [], community: [communityId] },
        fetch,
      }),
      [communityId, webId],
    ),
  )

  const { variables, isLoading } = hospexDocumentQueryOutput

  const foafProfileQueryOutput = useLDhopQuery(
    useMemo(
      () => ({
        query: webIdProfileQuery,
        variables: { person: webId ? [webId] : [] },
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
    const hospexDocuments = variables.hospexDocumentForCommunity ?? []
    const hospexGraphs = hospexDocuments.map(hospexDocument =>
      hospexDocumentQueryOutput.store.getQuads(
        null,
        null,
        null,
        new NamedNode(hospexDocument),
      ),
    )

    const hospexLdos = hospexGraphs.map(hospexGraph =>
      createLdoDataset(hospexGraph)
        .usingType(HospexProfileShapeType)
        .fromSubject(webId),
    )

    return hospexLdos
  }, [
    hospexDocumentQueryOutput.store,
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
  const descriptionLanguages = useMemo(
    () =>
      hospexProfiles.map(hospexProfile => languagesOf(hospexProfile, 'note')),
    [hospexProfiles],
  )
  const [about] = useMemo(
    () => descriptionLanguages.map(dl => dl?.en?.values().next().value ?? ''),
    [descriptionLanguages],
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
            name: hospexProfiles[0].name ?? '',
            photo: hospexProfiles[0].hasPhoto?.['@id'],
            about: hospexProfiles[0].note?.[0],
          }
        : undefined,
    [hospexProfiles, webId],
  )

  const interestsWithDocuments = useMemo(
    () =>
      hospexDocumentQueryOutput.store
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
        variables.hospexDocumentForCommunity?.[0],
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
  const { quads, isFetched } = useLDhopQuery(
    useMemo(
      () => ({
        query: profileDocuments,
        variables: { person: [person] },
        fetch,
        getAdditionalData: results => ({
          isFetched: results.every(result => result.isFetched),
        }),
      }),
      [person],
    ),
  )

  const output = useMemo(() => {
    const dataset = createLdoDataset(quads)
    const profile = dataset.usingType(SolidProfileShapeType).fromSubject(person)
    return [profile, { isFetched }] as const
  }, [isFetched, person, quads])
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
      language = 'en',
    }: {
      personId: URI
      hospexDocument: URI
      data: Partial<Pick<Person, 'name' | 'photo' | 'about'>>
      language: string
    }) => {
      await updateHospexProfileMutation.mutateAsync({
        uri: hospexDocument,
        subject: personId,
        language,
        transform: person => {
          if (data.name) person.name = data.name
          if (data.about) person.note = [data.about]
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
      await updateMutation.mutateAsync({
        uri: doc,
        patch,
      })
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
