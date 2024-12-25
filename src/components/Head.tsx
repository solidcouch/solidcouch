import { useConfig } from '@/config/hooks.ts'
import { useReadCommunity } from '@/hooks/data/useCommunity.ts'
import { useEffect, useState } from 'react'

export const Head = () => {
  const { communityId } = useConfig()
  const community = useReadCommunity(communityId)

  const focused = useFocus()

  const logo =
    focused && community.logo.length >= 2
      ? community.logo[0]
      : community.logo[1]

  return (
    <>
      <title>{community.name}</title>
      {logo && <link rel="icon" href={logo} />}
      <meta name="description" content={community.about} />
    </>
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
