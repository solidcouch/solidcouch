import { Outlet } from 'react-router-dom'
import { NavLayout } from '../layouts/NavLayout'

// const tabs = [
//   { link: 'offers', label: 'my offers' },
//   { link: 'invite', label: 'invite people' },
//   { link: 'guests', label: 'my guests' },
// ]

export const HostOutlet = () => {
  return (
    <NavLayout tabs={[]}>
      <Outlet />
    </NavLayout>
  )
}
