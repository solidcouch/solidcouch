import { useAppSelector } from 'app/hooks'
import { selectAuth } from 'features/auth/authSlice'
import { Link } from 'react-router-dom'
import { SignIn } from './SignIn'
import { SignOut } from './SignOut'

export const Header = () => {
  const auth = useAppSelector(selectAuth)
  const photo = auth.profile?.img || auth.profile?.hasPhoto?.['@id']

  return (
    <nav>
      <Link to="/">(logo)</Link>
      {auth.isLoggedIn === true && (
        <>
          {auth.profile?.name}{' '}
          {photo && <img src={photo} alt={auth.profile?.name} />} <SignOut />
        </>
      )}
      {auth.isLoggedIn === false && <SignIn />}
      {auth.isLoggedIn === undefined && <>...</>}
    </nav>
  )
}
