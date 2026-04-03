import Markdown from 'react-markdown'
import rehypeSlug from 'rehype-slug'
import privacy from '../../docs/privacy.md?raw'
import styles from './Text.module.scss'

export const Privacy = () => {
  return (
    <Markdown className={styles.text} rehypePlugins={[rehypeSlug]}>
      {privacy}
    </Markdown>
  )
}
