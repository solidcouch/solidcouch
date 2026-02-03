import { ContactInvitationActivityShapeType } from '@/ldo/app.shapeTypes'
import { Contact, URI } from '@/types'
import { useLdhopQuery } from '@ldhop/react'
import { createLdoDataset, set } from '@ldo/ldo'
import { Store } from 'n3'
import * as foaf from 'rdf-namespaces/foaf'
import * as rdfs from 'rdf-namespaces/rdfs'
import * as solid from 'rdf-namespaces/solid'
import { useCallback, useMemo } from 'react'
import { useUpdateAcl } from './access'
import { contactRequestsQuery, contactsQuery } from './queries'
import { AccessMode } from './types'
import {
  useCreateRdfDocument,
  useDeleteRdfDocument,
  useUpdateRdfDocument,
} from './useRdfDocument'

export enum ContactStatus {
  confirmed = 'confirmed',
  requestSent = 'request_sent',
  requestReceived = 'request_received',
}

export const useReadContacts = (personId: URI) => {
  const { quads, variables, isLoading } = useLdhopQuery(
    useMemo(
      () => ({
        query: contactsQuery,
        variables: { person: [personId] },
        fetch,
      }),
      [personId],
    ),
  )

  const contacts: Contact[] = useMemo(() => {
    const store = new Store(quads)

    return Array.from(variables.otherPerson ?? []).map(otherPerson => {
      // find personal and profile documents of otherPerson
      // TODO this should be replaced with uri=>resource map when it's available from the engine
      // i.e. we should use the response.url of the otherPerson URI.
      const personalDocument = store
        .getGraphs(otherPerson, solid.oidcIssuer, null)
        .values()
        .next().value?.value

      const extendedDocuments = personalDocument
        ? store.getObjects(otherPerson.value, rdfs.seeAlso, personalDocument)
        : []
      // see if the other person advertises contact to the person
      const knowsPersonal = personalDocument
        ? store.getQuads(otherPerson, foaf.knows, personId, personalDocument)
        : []

      const knowsExtended = extendedDocuments.flatMap(ed =>
        store.getQuads(otherPerson.value, foaf.knows, personId, ed),
      )

      return {
        webId: otherPerson.value,
        status:
          knowsPersonal.length + knowsExtended.length > 0
            ? ContactStatus.confirmed
            : ContactStatus.requestSent,
      }
    })
  }, [personId, quads, variables.otherPerson])

  const [notifications, notificationQueryStatus] =
    useReadContactNotifications(personId)

  return useMemo(
    () =>
      [
        contacts.concat(notifications),
        { isLoading },
        notificationQueryStatus,
      ] as const,
    [isLoading, contacts, notificationQueryStatus, notifications],
  )
}

const useReadContactNotifications = (me: URI) => {
  const { quads, variables, isLoading } = useLdhopQuery(
    useMemo(
      () => ({
        query: contactRequestsQuery,
        variables: { person: [me] },
        fetch,
      }),
      [me],
    ),
  )

  const contacts: Contact[] = useMemo(() => {
    const notifications = variables.inviteNotification
    const dataset = createLdoDataset(quads).usingType(
      ContactInvitationActivityShapeType,
    )
    return Array.from(notifications ?? [])
      .map(notification => dataset.fromSubject(notification.value))
      .filter(
        ldo =>
          ldo.object?.subject?.['@id'] === ldo.actor?.['@id'] &&
          ldo.object?.object?.['@id'] === ldo.target?.['@id'] &&
          ldo.object?.relationship?.['@id'] === 'knows',
      )
      .map(n => ({
        webId: n.actor?.['@id'] as unknown as URI,
        status: ContactStatus.requestReceived,
        notification: n['@id']!,
        invitation: n.content,
      }))
  }, [quads, variables.inviteNotification])

  return useMemo(
    () => [contacts, { isLoading }] as const,
    [contacts, isLoading],
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
          type: set({ '@id': 'Invite' }),
          content: message,
          actor: { '@id': me },
          object: {
            type: set({ '@id': 'Relationship' }),
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
  const updateAcl = useUpdateAcl()

  return useCallback(
    async ({
      person,
      hospexContainer,
    }: {
      person: URI
      hospexContainer: URI
    }) => {
      await updateAcl(hospexContainer, [
        {
          operation: 'add',
          access: [AccessMode.Read],
          default: true,
          agents: [person],
        },
      ])
    },
    [updateAcl],
  )
}
