import { NavLayout } from 'layouts/NavLayout'
import { Outlet } from 'react-router-dom'

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
