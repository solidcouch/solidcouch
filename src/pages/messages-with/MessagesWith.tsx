/**
 * This page lists all my conversations that this person participates in.
 * Probably should sort by last posted message; or by amount of users.
 */

import { t } from '@lingui/core/macro'
import { Link, useParams } from 'react-router'
import strict_uri_encode from 'strict-uri-encode'

export const MessagesWith = () => {
  const webId = useParams().webId as string

  const chats: { url: string }[] = []

  return (
    // eslint-disable-next-line lingui/no-unlocalized-strings
    <>
      Messages With Person
      <Link
        to={`/messages-with/${strict_uri_encode(webId)}/new`}
        aria-label={t`Start a new conversation`}
      >
        +
      </Link>
      <ul>
        {chats.map(({ url }) => (
          <li key={url}>{url}</li>
        ))}
      </ul>
    </>
  )
}
