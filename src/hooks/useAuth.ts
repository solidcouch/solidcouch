import { useAppSelector } from '@/app/hooks.ts'
import { selectAuth } from '@/features/auth/authSlice.ts'

export const useAuth = () => {
  const auth = useAppSelector(selectAuth)
  return auth
}
