import { selectAuth } from '@/redux/authSlice'
import { useAppSelector } from '@/redux/hooks'

export const useAuth = () => {
  const auth = useAppSelector(selectAuth)
  return auth
}
