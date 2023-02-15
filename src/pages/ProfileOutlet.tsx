import { skipToken } from '@reduxjs/toolkit/dist/query'
import { useAppSelector } from 'app/hooks'
import { api } from 'app/services/api'
import { selectAuth } from 'features/auth/authSlice'
import { Outlet } from 'react-router-dom'

export const ProfileOutlet = () => {
  const auth = useAppSelector(selectAuth)
  const {
    data: profile,
    isLoading,
    isError,
  } = api.endpoints.readUser.useQuery(auth.webId ?? skipToken)

  if (isLoading) return <>Loading user</>
  if (isError) return <>Something went wrong...</>

  return <Outlet context={profile} />
}
