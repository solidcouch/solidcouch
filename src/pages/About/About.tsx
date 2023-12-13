import Markdown from 'react-markdown'
import styles from './About.module.scss'
import { about } from './data'

export const About = () => <Markdown className={styles.text}>{about}</Markdown>
