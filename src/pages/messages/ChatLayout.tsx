import { Button, ButtonLink } from '@/components'
import { Person } from '@/components/Person/Person'
import { Trans } from '@lingui/react/macro'
import clsx from 'clsx'
import { useEffect, useMemo, useState } from 'react'
import { FaAngleLeft, FaAngleRight } from 'react-icons/fa'
import type { UIMatch } from 'react-router'
import { Outlet, useMatches, useSearchParams } from 'react-router'
import styles from './ChatLayout.module.scss'
import { ChatList } from './ChatList'

export const ChatLayout = () => {
  const matches = useMatches()

  const currentMatch = useMemo(
    () =>
      [...matches].pop() as UIMatch<unknown, { list?: 'detailed' } | undefined>,
    [matches],
  )

  useEffect(() => {
    const isDefaultWide = currentMatch?.handle?.list === 'detailed'
    setIsWide(isDefaultWide)
  }, [currentMatch])

  const [isWide, setIsWide] = useState(
    currentMatch?.handle?.list === 'detailed',
  )

  const [searchParams] = useSearchParams()

  const withPeople = useMemo(() => searchParams.getAll('with'), [searchParams])

  const people = (
    <>
      {withPeople.map(webId => (
        <Person webId={webId} key={webId} showName popover />
      ))}
    </>
  )

  const newSearchParams = useMemo(() => {
    const withParams = searchParams.getAll('with')
    // eslint-disable-next-line lingui/no-unlocalized-strings
    const newParams = new URLSearchParams(withParams.map(w => ['with', w]))
    return newParams
  }, [searchParams])

  return (
    <>
      <div className={styles.container}>
        <aside className={clsx(styles.chatList, isWide && styles.wide)}>
          <div className={styles.top}>
            <Button
              className={styles.expandButton}
              secondary
              onClick={() => {
                setIsWide(a => !a)
              }}
            >
              {isWide ? <FaAngleLeft /> : <FaAngleRight />}
            </Button>
            {isWide && (
              <header className={styles.header}>
                <h1>
                  {withPeople.length === 0 ? (
                    <Trans>Conversations</Trans>
                  ) : (
                    <>
                      <Trans>Conversations with {people}</Trans>
                    </>
                  )}
                </h1>

                {withPeople.length > 0 && (
                  <>
                    <ButtonLink
                      to={{
                        pathname: '/messages/new',
                        search: newSearchParams.toString(),
                      }}
                      primary
                    >
                      <Trans>Start a new conversation</Trans>
                    </ButtonLink>{' '}
                    <ButtonLink to={{ pathname: '/messages' }} secondary>
                      <Trans>All conversations</Trans>
                    </ButtonLink>
                  </>
                )}
              </header>
            )}
          </div>
          <ChatList withPeople={withPeople} detailed={isWide} />
        </aside>
        <main className={clsx(styles.content, !isWide && styles.wide)}>
          <Outlet />
        </main>
      </div>
    </>
  )
}
