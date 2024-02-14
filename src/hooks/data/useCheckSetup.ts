import { fetch } from '@inrupt/solid-client-authn-browser'
import { useQuery } from '@tanstack/react-query'
import { createLdoDataset } from 'ldo'
import { SolidProfileShapeType } from 'ldo/app.shapeTypes'
import { differenceBy } from 'lodash'
import * as n3 from 'n3'
import { useCallback, useMemo } from 'react'
import { URI } from 'types'
import { dct, hospex, rdfs, sioc, solid, space } from 'utils/rdf-namespaces'
import { useIsMember } from './useCommunity'
import { RdfQuery, useRdfQuery } from './useRdfQuery2'

/**
 * Check that
 * public type index exists
 * private type index exists
 * personal hospex document exists
 * community is joined
 */
export const useCheckSetup = (userId: URI, communityId: URI) => {
  const isMember = useIsMember(userId, communityId)
  const hospexDocumentSetup = useHospexDocumentSetup(userId, communityId)
  return useMemo(
    () => ({ isMember, ...hospexDocumentSetup } as const),
    [hospexDocumentSetup, isMember],
  )
}

const hospexDocumentQuery: RdfQuery = [
  // find person and their profile documents
  // https://solid.github.io/webid-profile/#discovery
  {
    type: 'match',
    subject: '?person',
    predicate: rdfs.seeAlso, // TODO also include foaf.isPrimaryTopicOf
    pick: 'object',
    target: '?profileDocument',
  },
  // fetch the profile documents
  { type: 'add resources', variable: '?profileDocument' },
  // find and fetch preferences file
  // https://solid.github.io/webid-profile/#discovery
  {
    type: 'match',
    subject: '?person',
    predicate: space.preferencesFile,
    pick: 'object',
    target: '?preferencesFile',
  },
  { type: 'add resources', variable: '?preferencesFile' },
  // find and fetch private type index
  {
    type: 'match',
    subject: '?person',
    predicate: solid.privateTypeIndex,
    pick: 'object',
    target: '?privateTypeIndex',
  },
  { type: 'add resources', variable: '?privateTypeIndex' },
  // find public type index
  {
    type: 'match',
    subject: '?person',
    predicate: solid.publicTypeIndex,
    pick: 'object',
    target: '?publicTypeIndex',
  },
  // and in public type index, find all personal hospex documents of the person, and fetch them
  {
    type: 'match',
    subject: '?publicTypeIndex',
    predicate: dct.references,
    pick: 'object',
    target: '?typeRegistration',
  },
  {
    type: 'match',
    subject: '?typeRegistration',
    predicate: solid.forClass,
    object: hospex.PersonalHospexDocument,
    pick: 'subject',
    target: '?typeRegistrationForHospex',
  },
  {
    type: 'match',
    subject: '?typeRegistrationForHospex',
    predicate: solid.instance,
    pick: 'object',
    target: `?hospexDocument`,
  },
  { type: 'add resources', variable: '?hospexDocument' },
  // find only hospex documents for this particular community
  // we find hospex document (graph) that contains triple person - sioc.member_of -> community
  // and fetch those hospex documents (if not fetched already)
  {
    type: 'match',
    subject: '?person',
    predicate: sioc.member_of,
    object: '?community',
    pick: 'graph',
    target: '?hospexDocumentForCommunity',
  },
  {
    type: 'match',
    subject: '?person',
    predicate: space.preferencesFile,
    graph: '?hospexDocumentForCommunity',
    pick: 'object',
    target: '?hospexSettings',
  },
  { type: 'add resources', variable: '?hospexDocumentForCommunity' },
  // remove all other hospex documents that don't belong to this community
  (store, variables) => {
    differenceBy(
      variables.hospexDocument,
      variables.hospexDocumentForCommunity,
      'value',
    ).forEach(hd => store.removeMatches(null, null, null, hd as n3.NamedNode))
  },
]

export const useHospexDocumentSetup = (userId: URI, communityId: URI) => {
  const [store, queryStatus] = useRdfQuery(hospexDocumentQuery, {
    person: [userId],
    community: [communityId],
  })

  const profile = useMemo(() => {
    const dataset = createLdoDataset([...store])
    const profile = dataset.usingType(SolidProfileShapeType).fromSubject(userId)
    return profile
  }, [store, userId])

  const publicTypeIndexes =
    profile.publicTypeIndex?.filter(i => i['@id']).map(i => i['@id'] as URI) ??
    []
  const privateTypeIndexes =
    profile.privateTypeIndex?.filter(i => i['@id']).map(i => i['@id'] as URI) ??
    []
  const inboxes = profile.inbox?.['@id'] ? [profile.inbox['@id']] : []

  // we look for a resource that says `<this person> <is member of> <this community>.` That should be the personal hospex document; but maybe in the future this will change
  const personalHospexDocumentsForCommunity = [
    ...store.match(
      new n3.NamedNode(userId),
      new n3.NamedNode(sioc.member_of),
      new n3.NamedNode(communityId),
    ),
  ].map(q => q.graph.value)

  const isHospexProfile =
    personalHospexDocumentsForCommunity.length > 0
      ? true
      : queryStatus.isInitialLoading
      ? undefined
      : false
  const isPublicTypeIndex =
    publicTypeIndexes.length > 0
      ? true
      : queryStatus.isInitialLoading
      ? undefined
      : false
  const isPrivateTypeIndex =
    privateTypeIndexes.length > 0
      ? true
      : queryStatus.isInitialLoading
      ? undefined
      : false
  const isInbox =
    inboxes.length > 0 ? true : queryStatus.isInitialLoading ? undefined : false
  return {
    isHospexProfile,
    isPublicTypeIndex,
    isPrivateTypeIndex,
    isInbox,
    personalHospexDocuments: personalHospexDocumentsForCommunity,
    publicTypeIndexes,
    privateTypeIndexes,
    inboxes,
  } as const
}

export const useCheckEmailNotifications = (inbox: URI, mailer: string) => {
  const checkMailerIntegration = useCallback(async () => {
    if (!mailer) return 'mailer not set up'

    const response = await fetch(`${mailer}/status`)
    if (!response.ok) {
      throw new Error('Network response was not ok')
    }
    return response.json()
  }, [mailer])

  const { isLoading, data } = useQuery<
    | {
        integrations: { object: URI; target: URI; verified: boolean }[]
      }
    | 'mailer not set up'
  >(['mailerIntegration'], checkMailerIntegration)

  if (data === 'mailer not set up') return true

  if (isLoading || !data) return undefined
  const integrations = data.integrations.filter(i => i.object === inbox)

  if (integrations.length === 0) return false
  else if (integrations.some(i => i.verified)) return true
  else return 'unverified' as const
}

export const useCheckSimpleEmailNotifications = (
  webId: URI,
  mailer: string,
) => {
  const checkMailerIntegration = useCallback(async () => {
    if (!mailer) return 'mailer not set up'

    const response = await fetch(
      `${mailer}/status/${encodeURIComponent(webId)}`,
    )

    if (response.status === 403) return { emailVerified: false }
    if (!response.ok) {
      throw new Error('Network response was not ok')
    }
    return response.json()
  }, [mailer, webId])

  const { isLoading, data } = useQuery<
    { emailVerified: boolean } | 'mailer not set up'
  >(['simpleMailerIntegration'], checkMailerIntegration)

  if (data === 'mailer not set up') return true

  if (isLoading || !data) return undefined

  return data.emailVerified
}
