import { skipToken } from '@reduxjs/toolkit/dist/query'
import { ldoApi } from 'app/services/ldoApi'
import { Loading } from 'components/Loading/Loading'
import { useAuth } from 'hooks/useAuth'
import { Outlet, useParams } from 'react-router-dom'

/**
 * This is currently deprecated
 */
export const ProfileOutlet = () => {
  const auth = useAuth()
  const personId = useParams().id as string

  const {
    data: profile,
    isLoading,
    isError,
  } = ldoApi.endpoints.readUser.useQuery(personId ?? auth.webId ?? skipToken)

  if (isLoading) return <Loading>Loading user</Loading>
  if (isError) return <>Something went wrong...</>

  return <Outlet context={profile} />
}
