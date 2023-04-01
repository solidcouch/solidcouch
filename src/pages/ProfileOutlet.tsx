import { skipToken } from '@reduxjs/toolkit/dist/query'
import { api } from 'app/services/api'
import { Loading } from 'components/Loading/Loading'
import { useAuth } from 'hooks/useAuth'
import { Outlet, useParams } from 'react-router-dom'

export const ProfileOutlet = () => {
  const auth = useAuth()
  const personId = useParams().id as string

  const {
    data: profile,
    isLoading,
    isError,
  } = api.endpoints.readUser.useQuery(personId ?? auth.webId ?? skipToken)

  if (isLoading) return <Loading>Loading user</Loading>
  if (isError) return <>Something went wrong...</>

  return <Outlet context={profile} />
}
