import { Outlet } from 'react-router'
import styles from './ChatLayout.module.scss'
import { ChatList } from './ChatList'

export const ChatLayout = () => {
  return (
    <div className={styles.container}>
      <aside className={styles.chatList}>
        <ChatList />
      </aside>
      <main className={styles.content}>
        <Outlet />
      </main>
    </div>
  )
}
