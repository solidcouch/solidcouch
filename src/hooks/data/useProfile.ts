import { createLdoDataset, languagesOf } from '@ldo/ldo'
import '@szhsin/react-menu/dist/index.css'
import '@szhsin/react-menu/dist/transitions/slide.css'
import {
  FoafProfileShapeType,
  HospexProfileShapeType,
  SolidProfileShapeType,
} from 'ldo/app.shapeTypes'
import { FoafProfile, HospexProfile, SolidProfile } from 'ldo/app.typings'
import { merge } from 'lodash'
import { useCallback, useMemo } from 'react'
import { Person, URI } from 'types'
import { ldo2json } from 'utils/ldo'
import { foaf, hospex, solid } from 'utils/rdf-namespaces'
import { useUpdateLdoDocument, useUpdateRdfDocument } from './useRdfDocument'
import { useRdfQuery } from './useRdfQuery'

const profileQuery = [
  ['?webId', (a: string) => a, '?profile', SolidProfileShapeType],
  ['?profile', 'seeAlso', '?profileDocument'],
  ['?profileDocument'],
  ['?profile', (a: URI) => a, '?foafProfile', FoafProfileShapeType],
  ['?foafProfile'],
  ['?profile', 'publicTypeIndex', '?publicTypeIndex'],
  ['?publicTypeIndex', 'references', '?typeRegistration'],
  ['?typeRegistration', 'forClass', hospex.PersonalHospexDocument],
  ['?typeRegistration', 'instance', '?hospexDocument'],
  ['?hospexDocument'],
  ['?profile', (a: URI) => a, '?hospexProfile', HospexProfileShapeType],
  [
    '?hospexProfile',
    (ldo: HospexProfile, params: { communityId: URI }) =>
      ldo.memberOf?.['@id'] === params.communityId,
  ],
] as const

export const useProfile = (webId: URI, communityId: URI) => {
  const params = useMemo(() => ({ webId, communityId }), [communityId, webId])
  const [results, queryStatus, dataset] = useRdfQuery(profileQuery, params)

  // keep the data from hospex document separate from generic foaf profile
  // can we generalize this pattern? (using only part of the fetched dataset)
  // we also do this because of the issue in LDO - when we expect one name but there are multiple, the result contains array, not a single result
  // https://github.com/o-development/ldo/issues/22#issuecomment-1590228592
  const hospexDocuments = useMemo(
    () => results.hospexDocument.flatMap(hd => hd['@id'] ?? []),
    [results.hospexDocument],
  )
  const hospexLdos = useMemo(
    () =>
      (queryStatus.data ?? [])
        .flatMap(a => a ?? [])
        .filter(a => hospexDocuments.includes(a.response.url))
        .map(a => ({
          ldo: createLdoDataset(a.data ?? [])
            .usingType(HospexProfileShapeType)
            .fromSubject(webId),
          document: a.response.url,
        }))
        .filter(a => a.ldo.memberOf['@id'] === communityId),
    [communityId, hospexDocuments, queryStatus.data, webId],
  )

  const foafProfile = results.foafProfile[0] as FoafProfile | undefined
  const hospexProfile = hospexLdos[0]?.ldo ?? undefined
  const hospexDocument = hospexLdos[0]?.document ?? undefined

  // we convert LDOs to pure objects before merging for better performance
  // merging LDOs took up to several seconds when data were complex (e.g. with Trinpod)
  const mergedProfile = merge(
    {},
    foafProfile && ldo2json(foafProfile),
    hospexProfile && ldo2json(hospexProfile),
  )
  const descriptionLanguages =
    hospexProfile && languagesOf(hospexProfile, 'note')
  const about = descriptionLanguages?.en?.values().next().value ?? ''
  const profile: Person = {
    id: webId,
    name: mergedProfile.name ?? '',
    photo: mergedProfile.hasPhoto?.['@id'],
    about,
    interests: mergedProfile.topicInterest?.map(i => i['@id']) ?? [],
  }

  const hospexProfileFormatted: Person | undefined = hospexProfile && {
    id: webId,
    name: hospexProfile.name ?? '',
    photo: hospexProfile.hasPhoto?.['@id'],
    about: hospexProfile.note?.[0],
  }

  const interestsWithDocuments = dataset
    .filter(
      quad =>
        quad.subject.id === webId && quad.predicate.id === foaf.topic_interest,
    )
    .map(quad => ({ id: quad.object.id, document: quad.graph.id }))

  return [
    profile,
    queryStatus,
    hospexDocument,
    interestsWithDocuments,
    hospexProfileFormatted,
  ] as const
}

const solidProfileQuery = [
  ['?me', (a: string) => a, '?profile', SolidProfileShapeType],
  ['?profile', 'seeAlso', '?profileDocument'],
  ['?profileDocument'],
] as const

export const useSolidProfile = (me: URI) => {
  const params = useMemo(() => ({ me }), [me])
  const [results, queryStatus] = useRdfQuery(solidProfileQuery, params)
  return [results.profile[0] as SolidProfile | undefined, queryStatus] as const
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
