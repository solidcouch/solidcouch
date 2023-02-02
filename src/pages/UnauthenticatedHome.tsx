import { ButtonLink } from 'components'
import { SignIn } from 'components/SignIn/SignIn'

export const UnauthenticatedHome = () => {
  return (
    <div>
      <SignIn />
      <ButtonLink tertiary to="about">
        Read more
      </ButtonLink>
    </div>
  )
}
