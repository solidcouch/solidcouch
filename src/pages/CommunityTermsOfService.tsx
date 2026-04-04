import { Loading } from '@/components'
import { defaultLocale } from '@/config'
import { useConfig } from '@/config/hooks'
import { useReadCommunity } from '@/hooks/data/useCommunity'
import { useAppSelector } from '@/redux/hooks'
import { selectLocale } from '@/redux/uiSlice'
import { Trans } from '@lingui/react/macro'
import Markdown from 'react-markdown'
import rehypeSlug from 'rehype-slug'
import styles from './Text.module.scss'

export const CommunityTermsOfService = () => {
  const { communityId } = useConfig()
  const locale = useAppSelector(selectLocale)
  const community = useReadCommunity(communityId, locale, defaultLocale)
  const communityName = community.name

  let content = null

  if (community.isLoading) {
    content = (
      <Loading>
        <Trans>Loading</Trans>
      </Loading>
    )
  } else if (community.terms) {
    content = (
      <Markdown rehypePlugins={[rehypeSlug]}>{community.terms}</Markdown>
    )
  } else {
    content = (
      <p>
        <Trans>This community doesn't have Terms of Service.</Trans>
      </p>
    )
  }

  return (
    <div className={styles.text}>
      <h1>
        <Trans>Community Terms for {communityName}</Trans>
      </h1>

      {content}
    </div>
  )
}
