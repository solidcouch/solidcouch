import { skipToken } from '@reduxjs/toolkit/dist/query/react'
import { ldoApi } from 'app/services/ldoApi'
import { ImgHTMLAttributes } from 'react'

export const ProtectedImg = (props: ImgHTMLAttributes<HTMLImageElement>) => {
  const { data: src } = ldoApi.endpoints.readImage.useQuery(
    props.src ?? skipToken,
  )

  return <img {...props} src={src} alt={props.alt ?? ''} />
}
