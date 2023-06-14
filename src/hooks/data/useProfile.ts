import '@szhsin/react-menu/dist/index.css'
import '@szhsin/react-menu/dist/transitions/slide.css'
import { createLdoDataset, languagesOf } from 'ldo'
import {
  FoafProfileShapeType,
  HospexProfileShapeType,
  SolidProfileShapeType,
} from 'ldo/app.shapeTypes'
import { FoafProfile, HospexProfile, SolidProfile } from 'ldo/app.typings'
import { merge } from 'lodash'
import { useMemo } from 'react'
import { Person, URI } from 'types'
import { hospex } from 'utils/rdf-namespaces'
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
  const [results, queryStatus] = useRdfQuery(profileQuery, params)

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
        .map(a =>
          createLdoDataset(a.data ?? [])
            .usingType(HospexProfileShapeType)
            .fromSubject(webId),
        )
        .filter(a => a.memberOf['@id'] === communityId),
    [communityId, hospexDocuments, queryStatus.data, webId],
  )

  const foafProfile = results.foafProfile[0] as FoafProfile | undefined
  const hospexProfile = hospexLdos[0] ?? undefined
  const mergedProfile = merge({}, foafProfile, hospexProfile)
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
  return [profile, queryStatus] as const
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
