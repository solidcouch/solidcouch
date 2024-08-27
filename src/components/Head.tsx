import { useConfig } from 'config/hooks'
import { useReadCommunity } from 'hooks/data/useCommunity'
import { useEffect, useState } from 'react'
import { Helmet } from 'react-helmet'

export const Head = () => {
  const { communityId } = useConfig()
  const community = useReadCommunity(communityId)

  const focused = useFocus()

  const logo =
    focused && community.logo.length >= 2
      ? community.logo[0]
      : community.logo[1]

  return (
    <Helmet>
      {logo && <link rel="icon" href={logo} />}
      <title>{community.name}</title>
      <meta name="description" content={community.about} />
    </Helmet>
  )
}

const useFocus = () => {
  const [focused, setFocused] = useState(document.hasFocus())

  useEffect(() => {
    const handleFocus = () => {
      setFocused(true)
    }

    const handleBlur = () => {
      setFocused(false)
    }

    window.addEventListener('focus', handleFocus)
    window.addEventListener('blur', handleBlur)

    // Cleanup event listeners on component unmount
    return () => {
      window.removeEventListener('focus', handleFocus)
      window.removeEventListener('blur', handleBlur)
    }
  }, [])

  return focused
}
