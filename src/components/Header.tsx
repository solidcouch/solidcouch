import { Link } from 'react-router-dom'
import { SignIn } from './SignIn'

export const Header = () => (
  <nav>
    <Link to="/">(logo)</Link>
    <SignIn />
  </nav>
)
