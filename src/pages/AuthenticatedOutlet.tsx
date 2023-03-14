import { skipToken } from '@reduxjs/toolkit/dist/query'
import { useAppSelector } from 'app/hooks'
import { comunicaApi } from 'app/services/comunicaApi'
import { Loading } from 'components/Loading/Loading'
import { selectAuth } from 'features/auth/authSlice'
import { usePersonalHospexDocuments } from 'hooks/usePersonalHospexDocuments'
import { Outlet } from 'react-router-dom'
import { URI } from 'types'
import { getContainer } from 'utils/helpers'
import { HospexSetup } from './HospexSetup'
import { UnauthenticatedHome } from './UnauthenticatedHome'

const communityId =
  process.env.REACT_APP_COMMUNITY ||
  'https://solidweb.me/dev-sleepy-bike/community#us'

export const AuthenticatedOutlet = () => {
  const auth = useAppSelector(selectAuth)

  // is hospex set up?
  const setup = usePersonalHospexDocuments(auth.webId)

  const { data: hasJoined } = comunicaApi.endpoints.isMemberOf.useQuery(
    auth.webId && setup.data?.length
      ? {
          webId: auth.webId,
          communityId,
          personalHospexDocuments: setup.data as [URI, ...URI[]],
        }
      : skipToken,
  )

  if (auth.isLoggedIn === undefined) return <Loading>Authenticating...</Loading>

  if (auth.isLoggedIn === false) return <UnauthenticatedHome />

  if (setup.isLoading) return <Loading>Checking...</Loading>

  if (hasJoined === undefined) return <Loading>Checking membership</Loading>
  if (
    setup.error === 'TYPE_INDEX_MISSING' ||
    setup.error === 'HOSPEX_NOT_SET_UP' ||
    hasJoined === false
  )
    return (
      <HospexSetup
        setup={
          setup.error === 'TYPE_INDEX_MISSING' ||
          setup.error === 'HOSPEX_NOT_SET_UP'
        }
        join={!hasJoined}
        joinData={
          !hasJoined && auth.webId && setup.data?.[0]
            ? {
                webId: auth.webId,
                communityId,
                storage: getContainer(setup.data[0]),
                personalHospexDocument: setup.data[0],
              }
            : undefined
        }
      />
    )

  return <Outlet />
}
