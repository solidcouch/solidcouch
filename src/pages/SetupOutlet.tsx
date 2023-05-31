import { useAppSelector } from 'app/hooks'
import { Loading } from 'components'
import { communityId } from 'config'
import { selectAuth } from 'features/auth/authSlice'
import { useCheckSetup } from 'hooks/data/useCheckSetup'
import { omit } from 'lodash'
import { Outlet } from 'react-router-dom'
import { NonUndefined } from 'utility-types'
import { HospexSetup } from './HospexSetup'

export const SetupOutlet = () => {
  const auth = useAppSelector(selectAuth)

  const setupCheck = useCheckSetup(auth.webId ?? '', communityId ?? '')
  const tasks = omit(setupCheck, [
    'publicTypeIndexes',
    'privateTypeIndexes',
    'personalHospexDocuments',
  ])

  const isEverythingSetUp = Object.values(setupCheck).every(v => v)

  if (isEverythingSetUp) return <Outlet />

  const checks = Object.entries(tasks)
    .filter(([, value]) => value === undefined)
    .map(([key]) => key)
  if (Object.values(setupCheck).some(a => a === undefined))
    return <Loading>Checking {checks.join(', ')}</Loading>

  return <HospexSetup {...(setupCheck as DefinedProps<typeof setupCheck>)} />
}

type DefinedProps<T extends { [key: string]: unknown }> = {
  [Key in keyof T]: NonUndefined<T[Key]>
}
