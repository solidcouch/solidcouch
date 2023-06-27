import {
  ContactInvitationActivityShapeType,
  FoafProfileShapeType,
  SolidProfileShapeType,
} from 'ldo/app.shapeTypes'
import { ContactInvitationActivity } from 'ldo/app.typings'
import { AuthorizationShapeType } from 'ldo/wac.shapeTypes'
import { useCallback, useMemo } from 'react'
import { Contact, URI } from 'types'
import { getAcl } from 'utils/helpers'
import { acl, rdf } from 'utils/rdf-namespaces'
import {
  useCreateRdfDocument,
  useDeleteRdfDocument,
  useMatchUpdateLdoDocument,
  useUpdateRdfDocument,
} from './useRdfDocument'
import { useRdfQuery } from './useRdfQuery'

const contactsQuery = [
  ['?person', (a: string) => a, '?profile', SolidProfileShapeType],
  ['?profile', 'seeAlso', '?profileDocument'],
  ['?profileDocument'],
  ['?profile', (a: string) => a, '?foafProfile', FoafProfileShapeType],
  ['?foafProfile', 'knows', '?otherFoafProfile'],
  [
    '?otherFoafProfile',
    (a: string) => a,
    '?otherProfile',
    SolidProfileShapeType,
  ],
  ['?otherProfile', 'seeAlso', '?otherProfileDocument'],
  ['?otherProfileDocument'],
] as const

export const useReadContacts = (personId: URI) => {
  const params = useMemo(() => ({ person: personId }), [personId])
  const [results, queryStatus] = useRdfQuery(contactsQuery, params)

  const contacts: Contact[] = useMemo(
    () =>
      results.foafProfile.flatMap(
        fp =>
          fp.knows?.map(c => {
            const isConfirmed = c.knows?.some(k => k['@id'] === personId)
            return {
              webId: c['@id']!,
              status: isConfirmed ? 'confirmed' : 'request_sent',
            }
          }) ?? [],
      ),
    [personId, results.foafProfile],
  )
  const [notifications, notificationQueryStatus] =
    useReadContactNotifications(personId)

  return useMemo(
    () =>
      [
        contacts.concat(notifications),
        queryStatus,
        notificationQueryStatus,
      ] as const,
    [contacts, notificationQueryStatus, notifications, queryStatus],
  )
}

const contactRequestQuery = [
  ['?me', (a: string) => a, '?profile', SolidProfileShapeType],
  ['?profile', 'seeAlso', '?profileDocument'],
  ['?profileDocument'],
  ['?profile', 'inbox', '?inbox'],
  ['?inbox', 'contains', '?notification'],
  ['?notification', 'type', 'Invite'],
  ['?notification', 'object', '?relationship'],
  [
    '?notification',
    () => {
      return true
    },
  ],
] as const
const useReadContactNotifications = (me: URI) => {
  const [partialResults, combinedQueryResults] = useRdfQuery(
    contactRequestQuery,
    { me },
  )

  const contacts: Contact[] = useMemo(
    () =>
      (partialResults.notification as ContactInvitationActivity[]).map(n => ({
        // TODO a bug in LDO which misaligns types and values
        // @ts-ignore
        webId: n.actor?.[0]?.['@id'] as unknown as URI,
        status: 'request_received',
        notification: n['@id']!,
        invitation: n.content2,
      })),
    [partialResults.notification],
  )

  return useMemo(
    () => [contacts, combinedQueryResults] as const,
    [combinedQueryResults, contacts],
  )
}

export const useCreateContact = () => {
  const addContact = useAddContact()
  const grantHospexAccess = useGrantHospexAccess()
  const createNotification = useCreateContactNotification()

  return useCallback(
    async ({
      me,
      other,
      hospexContainer,
      inbox,
      message,
    }: {
      me: URI
      other: URI
      hospexContainer: URI
      inbox: URI
      message: string
    }) => {
      // create contact
      await addContact({ me, other })
      // send notification
      await createNotification({ inbox, me, other, message })
      // grant access to my hospex container
      await grantHospexAccess({ person: other, hospexContainer })
    },
    [addContact, createNotification, grantHospexAccess],
  )
}

const useCreateContactNotification = () => {
  const createMutation = useCreateRdfDocument(
    ContactInvitationActivityShapeType,
  )
  return useCallback(
    async ({
      inbox,
      me,
      other,
      message,
    }: {
      inbox: URI
      me: URI
      other: URI
      message: string
    }) => {
      await createMutation.mutateAsync({
        uri: inbox,
        method: 'POST',
        data: {
          '@id': '',
          // @ts-ignore
          type: { '@id': 'Invite' },
          content2: message,
          actor: { '@id': me },
          object: {
            type: { '@id': 'Relationship' },
            subject: { '@id': me },
            relationship: { '@id': 'knows' },
            object: { '@id': other },
          },
          target: { '@id': other },
          updated: new Date().toISOString(),
        },
      })
    },
    [createMutation],
  )
}

export const useIgnoreContactRequest = () => {
  const deleteNotificationMutation = useDeleteRdfDocument()

  return useCallback(
    async ({ notification }: { notification: URI }) => {
      // delete notification
      await deleteNotificationMutation.mutateAsync({ uri: notification })
    },
    [deleteNotificationMutation],
  )
}

export const useConfirmContact = () => {
  const deleteNotificationMutation = useDeleteRdfDocument()

  const addContact = useAddContact()
  const grantHospexAccess = useGrantHospexAccess()

  return useCallback(
    async ({
      me,
      other,
      notification,
      hospexContainer,
    }: {
      me: URI
      other: URI
      notification: URI
      hospexContainer: URI
    }) => {
      // save contact
      await addContact({ me, other })

      // delete notification
      await deleteNotificationMutation.mutateAsync({ uri: notification })

      // grant direct access to hospex data
      await grantHospexAccess({ person: other, hospexContainer })
    },
    [addContact, deleteNotificationMutation, grantHospexAccess],
  )
}

const useAddContact = () => {
  const addContactMutation = useUpdateRdfDocument()

  return useCallback(
    async ({ me, other }: { me: URI; other: URI }) => {
      // save contact
      await addContactMutation.mutateAsync({
        uri: me,
        patch: `
        @prefix foaf: <http://xmlns.com/foaf/0.1/>.
        @prefix solid: <http://www.w3.org/ns/solid/terms#>.
        _:mutation a solid:InsertDeletePatch;
          solid:inserts {
            <${me}> foaf:knows <${other}>.
          } .`,
      })
    },
    [addContactMutation],
  )
}

const useGrantHospexAccess = () => {
  const grantHospexAccessMutation = useMatchUpdateLdoDocument(
    AuthorizationShapeType,
  )

  return useCallback(
    async ({
      person,
      hospexContainer,
    }: {
      person: URI
      hospexContainer: URI
    }) => {
      const accessList = await getAcl(hospexContainer)
      // grant direct access to hospex data
      await grantHospexAccessMutation.mutateAsync({
        uri: accessList,
        match: builder => {
          const ldos = builder.matchSubject(rdf.type, acl.Authorization)
          const ldo = ldos.find(
            ldoo =>
              ldoo.accessTo.length === 1 &&
              ldoo.accessTo[0]['@id'] === hospexContainer &&
              ldoo.mode?.length === 1 &&
              ldoo.mode[0]['@id'] === 'Read',
          )
          if (!ldo) throw new Error('subject not found')
          return ldo
        },
        transform: ldo => {
          ldo.agent ??= []
          ldo.agent.push({ '@id': person })
        },
      })
    },
    [grantHospexAccessMutation],
  )
}
