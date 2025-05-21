/**
 * This page lists all my conversations that this person participates in.
 * Probably should sort by last posted message; or by amount of users.
 */

import { t } from '@lingui/core/macro'
import { Link } from 'react-router'

export const MessagesWith = () => {
  const chats: { url: string }[] = []

  return (
    // eslint-disable-next-line lingui/no-unlocalized-strings
    <>
      Messages With Person
      <Link to="./new" aria-label={t`Start a new conversation`}>
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
