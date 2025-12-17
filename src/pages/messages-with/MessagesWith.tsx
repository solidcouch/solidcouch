/**
 * This page lists all my conversations that this person participates in.
 * Probably should sort by last posted message; or by amount of users.
 */

import { ButtonLink } from '@/components'
import { Person } from '@/components/Person/Person'
import { t } from '@lingui/core/macro'
import { Trans } from '@lingui/react/macro'
import { useParams } from 'react-router'
import strict_uri_encode from 'strict-uri-encode'

export const MessagesWith = () => {
  const webId = useParams().webId as string

  const chats: { url: string }[] = []

  return (
    <>
      <Trans>
        Messages With <Person webId={webId} showName />
      </Trans>
      <ButtonLink
        primary
        to={`/messages-with/${strict_uri_encode(webId)}/new`}
        aria-label={t`Start a new conversation`}
      >
        <Trans>Start a conversation</Trans>
      </ButtonLink>
      <ul>
        {chats.map(({ url }) => (
          <li key={url}>{url}</li>
        ))}
      </ul>
    </>
  )
}
