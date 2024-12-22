import { Outlet } from 'react-router-dom'
import { NavLayout } from '../layouts/NavLayout.tsx'

// const tabs = [
//   { link: 'search', label: 'search hosts' },
//   { link: 'plans', label: 'plans' },
//   { link: 'hosts', label: 'my hosts' },
// ]

export const TravelOutlet = () => {
  return (
    <NavLayout tabs={[]}>
      <Outlet />
    </NavLayout>
  )
}
